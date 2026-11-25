import PDFDocument from "pdfkit";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { buildResumeModel, cleanResumeBullet, isResumeBullet } from "./resumeModel.js";

const A4 = { width: 595.28, height: 841.89 };
const COLORS = {
  ink: "#1E2D3A",
  accent: "#245B82",
  muted: "#667684",
  rule: "#D9E2E9",
  pale: "#F4F7FA"
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function median(values) {
  if (!values.length) return 9.7;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[index] : (sorted[index - 1] + sorted[index]) / 2;
}

export async function inspectPdfTemplate(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) return null;
  let document;

  try {
    const task = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
      verbosity: 0
    });
    document = await task.promise;

    const page = await document.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const text = await page.getTextContent();
    const items = text.items
      .filter((item) => typeof item.str === "string" && item.str.trim())
      .map((item) => ({
        x: Number(item.transform?.[4]) || 0,
        size: Math.hypot(Number(item.transform?.[0]) || 0, Number(item.transform?.[1]) || 0) || Number(item.height) || 10
      }));

    const left = items.length ? Math.min(...items.map((item) => item.x)) : 48;
    const sizes = items.map((item) => item.size).filter((size) => size >= 6 && size <= 24);
    const sortedX = items.map((item) => item.x).sort((a, b) => a - b);
    let widestGap = 0;
    let split = viewport.width / 2;

    for (let index = 1; index < sortedX.length; index += 1) {
      const gap = sortedX[index] - sortedX[index - 1];
      if (gap > widestGap) {
        widestGap = gap;
        split = (sortedX[index] + sortedX[index - 1]) / 2;
      }
    }

    const leftCount = items.filter((item) => item.x < split).length;
    const rightCount = items.length - leftCount;

    return {
      width: viewport.width || A4.width,
      height: viewport.height || A4.height,
      margin: clamp(left || 48, 36, 68),
      bodySize: clamp(median(sizes), 8.3, 11.2),
      sourcePageCount: document.numPages || 1,
      sourceLayout: widestGap > viewport.width * 0.19 && leftCount >= 5 && rightCount >= 5
        ? "multi-column"
        : "single-column"
    };
  } catch (error) {
    return {
      width: A4.width,
      height: A4.height,
      margin: 48,
      bodySize: 9.5,
      sourcePageCount: 1,
      sourceLayout: "unknown",
      inspectWarning: error.message
    };
  } finally {
    await document?.destroy?.();
  }
}

function safeText(value) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/[–—−]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[•●▪◦]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPdf(data, profile) {
  return new Promise((resolve, reject) => {
    const pageWidth = profile?.width || A4.width;
    const pageHeight = profile?.height || A4.height;
    const margin = clamp(profile?.margin || 48, 36, 68);
    const bodySize = clamp(profile?.bodySize || 9.5, 8.3, 11.2);
    const sectionSize = clamp(bodySize + 1.8, 10.5, 13);
    const nameSize = clamp(bodySize * 2.4, 22, 28);
    const width = pageWidth - margin * 2;
    const bottom = pageHeight - 46;
    const chunks = [];

    const doc = new PDFDocument({
      size: profile ? [pageWidth, pageHeight] : "A4",
      margins: { top: 42, right: margin, bottom: 44, left: margin },
      compress: true,
      info: {
        Title: "Tailored Resume - " + safeText(data.targetRole || "Candidate"),
        Author: "Resume Match",
        Subject: "Tailored searchable resume",
        Creator: "Resume Match"
      }
    });

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const ensureRoom = (height) => {
      if (doc.y + height > bottom) doc.addPage();
    };

    const rule = (y) => {
      doc.save()
        .strokeColor(COLORS.rule)
        .lineWidth(0.65)
        .moveTo(margin, y)
        .lineTo(pageWidth - margin, y)
        .stroke()
        .restore();
    };

    const paragraph = (value, options = {}) => {
      const text = safeText(value);
      if (!text) return;

      const size = options.size || bodySize;
      const font = options.bold ? "Helvetica-Bold" : "Helvetica";
      const indent = options.indent || 0;
      const textWidth = width - indent;
      doc.font(font).fontSize(size);
      const height = doc.heightOfString(text, { width: textWidth, lineGap: 2 });
      ensureRoom(height + 5);

      doc.font(font)
        .fontSize(size)
        .fillColor(options.color || COLORS.ink)
        .text(text, margin + indent, doc.y, {
          width: textWidth,
          lineGap: 2,
          paragraphGap: 0
        });
      doc.y += options.after ?? 4;
    };

    const heading = (value) => {
      ensureRoom(sectionSize + 30);
      const y = doc.y + 8;
      doc.save()
        .fillColor(COLORS.accent)
        .rect(margin, y + 1, 3, 12)
        .fill()
        .restore();
      doc.font("Helvetica-Bold")
        .fontSize(sectionSize)
        .fillColor(COLORS.accent)
        .text(safeText(value).toUpperCase(), margin + 10, y, {
          width: width - 10,
          lineBreak: false
        });
      doc.y = y + sectionSize + 9;
      rule(doc.y);
      doc.y += 11;
    };

    const model = buildResumeModel(data);

    // Candidate header
    doc.font("Helvetica-Bold")
      .fontSize(nameSize)
      .fillColor(COLORS.ink)
      .text(safeText(model.name), margin, doc.y, { width });
    doc.moveDown(0.2);

    if (model.contact.length) {
      paragraph(model.contact.join("  |  "), {
        size: Math.max(8, bodySize - 0.4),
        color: COLORS.muted,
        after: 6
      });
    }

    if (model.targetRole) {
      paragraph("Target role: " + model.targetRole, {
        size: bodySize,
        color: COLORS.muted,
        after: 7
      });
    }

    rule(doc.y + 2);
    doc.y += 11;

    for (const section of model.sections) {
      heading(section.title);

      if (Array.isArray(section.skills) && section.skills.length) {
        paragraph(section.skills.map(safeText).join("  |  "), { after: 9 });
      }

      let experienceMetaLine = 0;
      for (const line of section.lines || []) {
        const bullet = isResumeBullet(line);

        if (section.key === "experience" && bullet) {
          paragraph("- " + cleanResumeBullet(line), {
            indent: 10,
            after: 6
          });
          experienceMetaLine = 0;
          continue;
        }

        const isExperienceHeading = section.key === "experience" && experienceMetaLine === 0;
        const isExperienceEmployer = section.key === "experience" && experienceMetaLine === 1;
        paragraph(line, {
          bold: isExperienceHeading,
          color: isExperienceEmployer ? COLORS.muted : COLORS.ink,
          size: isExperienceHeading ? bodySize + 0.25 : bodySize,
          after: isExperienceHeading ? 2 : isExperienceEmployer ? 7 : 4
        });

        if (section.key === "experience") experienceMetaLine = Math.min(experienceMetaLine + 1, 2);
      }

      if (section.summary) paragraph(section.summary, { after: 13 });
      doc.y += 6;
    }

    doc.end();
  });
}

export async function createTailoredResumePdf(data, originalPdf = null) {
  const profile = originalPdf ? await inspectPdfTemplate(originalPdf) : null;
  return buildPdf(data, profile);
}
