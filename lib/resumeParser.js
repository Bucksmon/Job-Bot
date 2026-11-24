import path from "node:path";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";

const wordExtractor = new WordExtractor();
const LINE_TOLERANCE = 2.6;

function normalisePlainText(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function mapTextItems(items) {
  return items
    .filter((item) => typeof item.str === "string" && item.str.trim())
    .map((item) => {
      const transform = item.transform || [10, 0, 0, 10, 0, 0];
      return {
        text: item.str,
        x: Number(transform[4]) || 0,
        baseline: -(Number(transform[5]) || 0),
        width: Number(item.width) || 0,
        fontSize: Math.hypot(Number(transform[0]) || 0, Number(transform[1]) || 0) ||
          Number(item.height) || 10
      };
    });
}

function groupIntoRows(items) {
  const sorted = [...items].sort((a, b) =>
    a.baseline - b.baseline || a.x - b.x
  );
  const rows = [];

  for (const item of sorted) {
    let row = rows[rows.length - 1];

    if (!row || Math.abs(row.baseline - item.baseline) > LINE_TOLERANCE) {
      row = { baseline: item.baseline, items: [] };
      rows.push(row);
    }

    row.items.push(item);
    row.baseline = row.items.reduce((sum, entry) => sum + entry.baseline, 0) / row.items.length;
  }

  return rows.map((row) => {
    const ordered = row.items.sort((a, b) => a.x - b.x);
    let text = "";
    let previous = null;
    let largestFont = 0;

    for (const item of ordered) {
      const raw = item.text.replace(/[\r\n]+/g, " ");
      if (!raw.trim()) continue;

      if (previous) {
        const gap = item.x - (previous.x + previous.width);
        const threshold = Math.max(0.55, Math.min(previous.fontSize, item.fontSize) * 0.14);
        if (gap > threshold && !text.endsWith(" ") && !raw.startsWith(" ")) {
          text += " ";
        }
      }

      text += raw;
      previous = item;
      largestFont = Math.max(largestFont, item.fontSize);
    }

    return {
      text: text.replace(/\s+/g, " ").trim(),
      baseline: row.baseline,
      fontSize: largestFont || 10
    };
  }).filter((row) => row.text);
}

function findColumnSplit(items, pageWidth) {
  const centres = items
    .map((item) => item.x + item.width / 2)
    .sort((a, b) => a - b);

  const medianWidth = (values) => {
    const widths = values.map((item) => item.width).sort((a, b) => a - b);
    if (!widths.length) return 0;
    return widths[Math.floor(widths.length / 2)];
  };

  let best = null;
  for (let index = 1; index < centres.length; index += 1) {
    const gap = centres[index] - centres[index - 1];
    if (gap <= pageWidth * 0.17) continue;

    const split = (centres[index] + centres[index - 1]) / 2;
    const left = items.filter((item) => item.x + item.width / 2 < split);
    const right = items.filter((item) => item.x + item.width / 2 >= split);
    const minCount = Math.max(8, Math.ceil(items.length * 0.12));

    // Ignore right-aligned dates and metadata: both columns must contain
    // repeated, substantial text blocks before treating the page as columns.
    if (left.length < minCount || right.length < minCount) continue;
    if (medianWidth(left) < pageWidth * 0.16) continue;
    if (medianWidth(right) < pageWidth * 0.16) continue;

    if (!best || gap > best.gap) best = { gap, split };
  }

  return best?.split ?? null;
}

function rowsToText(rows) {
  let previousBaseline = null;
  const output = [];

  for (const row of rows) {
    if (previousBaseline !== null) {
      const verticalGap = row.baseline - previousBaseline;
      if (verticalGap > Math.max(7, row.fontSize * 1.55)) output.push("");
    }

    output.push(row.text);
    previousBaseline = row.baseline;
  }

  return output.join("\n");
}

async function extractPdfDocument(buffer) {
  let document;
  try {
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
      verbosity: 0
    });
    document = await loadingTask.promise;

    const pageTexts = [];
    const layouts = [];
    const pageSizes = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items = mapTextItems(content.items);
      const split = findColumnSplit(items, viewport.width);

      pageSizes.push({
        width: Math.round(viewport.width),
        height: Math.round(viewport.height)
      });

      if (split) {
        layouts.push("multi-column");
        const spanning = items.filter((item) =>
          item.x < split && item.x + item.width > split + 18
        );
        const left = items.filter((item) =>
          item.x + item.width / 2 < split && !spanning.includes(item)
        );
        const right = items.filter((item) =>
          item.x + item.width / 2 >= split && !spanning.includes(item)
        );

        const parts = [
          rowsToText(groupIntoRows(spanning)),
          rowsToText(groupIntoRows(left)),
          rowsToText(groupIntoRows(right))
        ].filter(Boolean);

        pageTexts.push(parts.join("\n"));
      } else {
        layouts.push("single-column");
        pageTexts.push(rowsToText(groupIntoRows(items)));
      }

      page.cleanup();
    }

    return {
      text: normalisePlainText(pageTexts.join("\n\n")),
      metadata: {
        fileType: "pdf",
        pageCount: document.numPages,
        pageSizes,
        sourceLayout: layouts.includes("multi-column") ? "multi-column" : "single-column"
      }
    };
  } finally {
    await document?.destroy?.();
  }
}

export async function extractResumeDocument(file) {
  if (!file?.buffer || !file.originalname) {
    throw new Error("Upload a PDF, DOCX, or DOC resume.");
  }

  const extension = path.extname(file.originalname).toLowerCase();
  let result;

  if (extension === ".pdf") {
    result = await extractPdfDocument(file.buffer);
  } else if (extension === ".docx") {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    result = {
      text: normalisePlainText(parsed.value),
      metadata: { fileType: "docx", pageCount: null, sourceLayout: "not-assessed" }
    };
  } else if (extension === ".doc") {
    const parsed = await wordExtractor.extract(file.buffer);
    result = {
      text: normalisePlainText(parsed.getBody()),
      metadata: { fileType: "doc", pageCount: null, sourceLayout: "not-assessed" }
    };
  } else {
    throw new Error("Unsupported file type. Upload a PDF, DOCX, or DOC resume.");
  }

  if (result.text.length < 80) {
    throw new Error("The resume appears empty or image-only. Upload a text-based PDF or Word document.");
  }

  return result;
}

export async function extractResumeText(file) {
  return (await extractResumeDocument(file)).text;
}

export function buildResumeAudit(document) {
  const text = String(document?.text || "");
  const metadata = document?.metadata || {};
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  const standardSections = [
    ["Experience", /\b(experience|employment history|work history)\b/i],
    ["Education", /\b(education|academic background|qualifications)\b/i],
    ["Skills", /\b(skills|technical skills|core competencies)\b/i],
    ["Projects", /\b(projects|selected projects)\b/i]
  ].filter(([, pattern]) => pattern.test(text)).map(([label]) => label);

  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const hasPhone = /(?:\+\d{1,3}[\s().-]*)?(?:\d[\s().-]*){8,}/.test(text);
  const hasProfileLink = /linkedin\.com|github\.com|portfolio|https?:\/\//i.test(text);
  const hasDate = /\b(?:19|20)\d{2}\b/.test(text);
  const bulletCount = lines.filter((line) => /^[-•●▪◦*]\s+/.test(line)).length;

  const checks = [
    {
      label: "Selectable resume text",
      status: text.length >= 250 ? "pass" : "review",
      detail: text.length >= 250
        ? "Readable text was extracted from the file."
        : "Very little text was extracted. The file may be image-based or difficult to parse."
    },
    {
      label: "Contact details",
      status: hasEmail && (hasPhone || hasProfileLink) ? "pass" : "review",
      detail: hasEmail && (hasPhone || hasProfileLink)
        ? "Email and at least one other contact method were detected."
        : "Check that your email, phone number and profile links are visible as ordinary text."
    },
    {
      label: "Standard resume sections",
      status: standardSections.length >= 2 ? "pass" : "review",
      detail: standardSections.length
        ? "Detected: " + standardSections.join(", ") + "."
        : "Use conventional headings such as Experience, Education, Skills and Projects."
    },
    {
      label: "Employment or education dates",
      status: hasDate ? "pass" : "review",
      detail: hasDate
        ? "Year information was detected."
        : "Add clear month/year dates where they help explain your experience."
    },
    {
      label: "Reading layout",
      status: metadata.sourceLayout === "multi-column" ? "review" :
        metadata.sourceLayout === "single-column" ? "pass" : "info",
      detail: metadata.sourceLayout === "multi-column"
        ? "The source PDF appears to use columns. The tailored export will linearise the content."
        : metadata.sourceLayout === "single-column"
          ? "The source PDF appears to use a single text column."
          : "The original document layout could not be assessed from this file type."
    },
    {
      label: "Achievement bullets",
      status: bulletCount >= 2 ? "pass" : "review",
      detail: bulletCount >= 2
        ? bulletCount + " bullet points were found."
        : "Use concise achievement bullets that show action, context and measurable results."
    }
  ];

  return {
    wordCount: text.split(/\s+/).filter(Boolean).length,
    pageCount: metadata.pageCount ?? null,
    sectionsFound: standardSections,
    checks
  };
}
