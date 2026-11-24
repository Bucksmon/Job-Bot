import test from "node:test";
import assert from "node:assert/strict";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph } from "docx";
import { extractResumeDocument, extractResumeText, buildResumeAudit } from "../lib/resumeParser.js";

function makePdf(lines) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [595, 842], margin: 40 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    for (const line of lines) {
      doc.font("Helvetica").fontSize(10).text(line.text, line.x, line.y, { lineBreak: false });
    }
    doc.end();
  });
}

test("extracts DOCX text with paragraph boundaries", async () => {
  const document = new Document({
    sections: [{
      children: [
        new Paragraph({ text: "Furqan Nadir" }),
        new Paragraph({ text: "Software Engineer" }),
        new Paragraph({ text: "JavaScript, Node.js, PostgreSQL" })
      ]
    }]
  });
  const buffer = await Packer.toBuffer(document);
  const text = await extractResumeText({ buffer, originalname: "resume.docx" });

  assert.match(text, /Furqan Nadir/);
  assert.match(text, /Software Engineer/);
  assert.match(text, /JavaScript/);
  assert.match(text, /\n/);
});

test("reconstructs words separated by PDF coordinates", async () => {
  const buffer = await makePdf([
    { text: "Web Developer Intern", x: 42, y: 100 },
    { text: "Sep 2025 - Dec 2025", x: 205, y: 100 },
    { text: "Marketist", x: 42, y: 122 },
    { text: "Islamabad, Pakistan", x: 205, y: 122 },
    { text: "- Optimized the mockup generator load time and UI responsiveness, serving 40-50 daily active users, resulting in", x: 42, y: 148 },
    { text: "25% faster page loads.", x: 42, y: 162 }
  ]);

  const parsed = await extractResumeDocument({ buffer, originalname: "resume.pdf" });
  assert.match(parsed.text, /Web Developer Intern Sep 2025 - Dec 2025/);
  assert.match(parsed.text, /Marketist Islamabad, Pakistan/);
  assert.match(parsed.text, /resulting in/);
  assert.match(parsed.text, /25% faster page loads/);
  assert.equal(parsed.metadata.fileType, "pdf");
  assert.equal(parsed.metadata.sourceLayout, "single-column");
});

test("creates a useful document-readability audit", () => {
  const audit = buildResumeAudit({
    text: [
      "Furqan Nadir",
      "furqan@example.com | +971 501234567 | linkedin.com/in/furqan-nadir",
      "PROFESSIONAL EXPERIENCE",
      "2025 - 2026",
      "- Built an API and reduced response time by 25%.",
      "- Automated reports for 50 users.",
      "EDUCATION",
      "BSc Software Engineering",
      "SKILLS",
      "JavaScript, Node.js, SQL"
    ].join("\n"),
    metadata: { fileType: "pdf", pageCount: 2, sourceLayout: "single-column" }
  });

  assert.equal(audit.pageCount, 2);
  assert.ok(audit.checks.some((check) => check.label === "Contact details" && check.status === "pass"));
  assert.ok(audit.checks.some((check) => check.label === "Reading layout" && check.status === "pass"));
});

test("rejects scanned PDFs when no selectable text is available", async () => {
  const buffer = await makePdf([]);
  await assert.rejects(
    extractResumeText({ buffer, originalname: "scan.pdf" }),
    /empty or image-only/
  );
});

test("rejects unsupported extensions clearly", async () => {
  await assert.rejects(
    extractResumeText({
      buffer: Buffer.from("resume"),
      originalname: "resume.txt"
    }),
    /PDF, DOCX, or DOC/
  );
});
