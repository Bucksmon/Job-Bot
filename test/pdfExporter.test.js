import test from "node:test";
import assert from "node:assert/strict";
import PDFDocument from "pdfkit";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { createTailoredResumePdf, inspectPdfTemplate } from "../lib/pdfExporter.js";
import { buildResumeModel } from "../lib/resumeModel.js";

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

async function parseGeneratedPdf(buffer) {
  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
    verbosity: 0
  }).promise;

  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const text = await page.getTextContent();
    pages.push(text.items.map((item) => item.str).join(" "));
    page.cleanup();
  }

  return { text: pages.join("\n"), numpages: document.numPages };
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

  const parsed = await parseGeneratedPdf(buffer);
  assert.match(parsed.text, /Bucksmon/);
  assert.match(parsed.text, /RELEVANT SKILLS/i);
  assert.match(parsed.text, /JavaScript/);
  assert.match(parsed.text, /PROFESSIONAL EXPERIENCE/i);
  assert.match(parsed.text, /EDUCATION/i);
  assert.equal(parsed.numpages, 1, "A short resume should remain on one page.");
});

test("never inserts a missing skill that is not in the supplied resume", async () => {
  const source = await makeSourcePdf();
  const buffer = await createTailoredResumePdf({
    ...data,
    matchedKeywords: ["JavaScript", "Docker"],
    resumeKeywords: ["JavaScript", "React", "Node.js", "MongoDB"]
  }, source);
  const parsed = await parseGeneratedPdf(buffer);

  assert.doesNotMatch(parsed.text, /Docker/);
});


test("does not export the generic placeholder as a professional summary", async () => {
  const data = {
    targetRole: "Backend Software Engineer",
    summaryDraft: "",
    matchedKeywords: [],
    resumeKeywords: [],
    resumeText: [
      "Furqan Nadir",
      "PROFESSIONAL SUMMARY",
      "Candidate targeting Backend Software Engineer. Add a concise summary of relevant experience and verified strengths from your resume before applying.",
      "PROFESSIONAL EXPERIENCE",
      "- Built backend services using Node.js and PostgreSQL."
    ].join("\n")
  };

  const model = buildResumeModel(data);
  assert.equal(model.sections.some((section) => section.key === "summary"), false);

  const buffer = await createTailoredResumePdf(data);
  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 4).toString("ascii"), "%PDF");
  assert.ok(buffer.length > 500);
});
