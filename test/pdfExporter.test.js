import test from "node:test";
import assert from "node:assert/strict";
import PDFDocument from "pdfkit";
import pdfParse from "pdf-parse";
import { createTailoredResumePdf, inspectPdfTemplate } from "../lib/pdfExporter.js";

function makeSourcePdf() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [500, 700], margin: 42 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.font("Helvetica-Bold").fontSize(18).text("Bucksmon", 42, 35);
    doc.font("Helvetica").fontSize(10).text("Software Engineer | Dubai, UAE", 42, 62);
    doc.font("Helvetica-Bold").fontSize(12).text("Experience", 42, 105);
    doc.font("Helvetica").fontSize(10).text("Built applications with JavaScript, React and Node.js.", 42, 125);
    doc.end();
  });
}

const data = {
  targetRole: "Junior Full Stack Developer",
  summaryDraft: "Software engineering graduate targeting a junior full stack developer role, with resume-documented strengths in JavaScript, React and Node.js.",
  matchedKeywords: ["JavaScript", "React", "Node.js"],
  resumeKeywords: ["JavaScript", "React", "Node.js", "MongoDB"],
  resumeText: [
    "Bucksmon",
    "bucksmon@example.com | +971 50 123 4567",
    "PROFESSIONAL SUMMARY",
    "Software engineering graduate with practical development experience.",
    "SKILLS",
    "JavaScript, React Native, MongoDB",
    "WORK EXPERIENCE",
    "- Built a web application using JavaScript and Node.js.",
    "EDUCATION",
    "BSc Software Engineering"
  ].join("\n")
};

test("inspects source PDF page size and layout", async () => {
  const source = await makeSourcePdf();
  const profile = await inspectPdfTemplate(source);

  assert.equal(Math.round(profile.width), 500);
  assert.equal(Math.round(profile.height), 700);
  assert.equal(profile.sourceLayout, "single-column");
});

test("exports an ATS-readable PDF using the source page dimensions", async () => {
  const source = await makeSourcePdf();
  const buffer = await createTailoredResumePdf(data, source);

  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "%PDF");

  const parsed = await pdfParse(buffer);
  assert.match(parsed.text, /Bucksmon/);
  assert.match(parsed.text, /RELEVANT SKILLS/i);
  assert.match(parsed.text, /JavaScript/);
  assert.match(parsed.text, /Professional Experience/);
  assert.match(parsed.text, /Education/);
});

test("never inserts a missing skill that is not in the supplied resume", async () => {
  const source = await makeSourcePdf();
  const buffer = await createTailoredResumePdf({
    ...data,
    matchedKeywords: ["JavaScript", "Docker"],
    resumeKeywords: ["JavaScript", "React", "Node.js", "MongoDB"]
  }, source);
  const parsed = await pdfParse(buffer);

  assert.doesNotMatch(parsed.text, /Docker/);
});
