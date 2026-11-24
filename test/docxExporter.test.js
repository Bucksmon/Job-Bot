import test from "node:test";
import assert from "node:assert/strict";
import { buildResumeModel, createTailoredResumeDocx } from "../lib/docxExporter.js";

test("builds a structured CV and places job-relevant skills near the top", () => {
  const model = buildResumeModel({
    targetRole: "Junior Full Stack Developer",
    summaryDraft: "Candidate targeting a junior full stack developer role.",
    matchedKeywords: ["JavaScript", "React"],
    resumeKeywords: ["JavaScript", "React", "MongoDB"],
    resumeText: [
      "Bucksmon",
      "bucksmon@example.com | +971 50 123 4567",
      "PROFESSIONAL SUMMARY",
      "Software engineering graduate with practical project experience.",
      "SKILLS",
      "JavaScript, React Native, MongoDB",
      "WORK EXPERIENCE",
      "Built a web application using JavaScript.",
      "EDUCATION",
      "BSc Software Engineering"
    ].join("\n")
  });

  assert.equal(model.name, "Bucksmon");
  assert.deepEqual(model.sections.map((section) => section.title), [
    "Professional Summary",
    "Additional Profile Details",
    "Key Skills",
    "Skills & Tools",
    "Professional Experience",
    "Education"
  ]);
  assert.ok(model.sections[2].skills.includes("JavaScript"));
  assert.ok(model.sections[2].skills.includes("MongoDB"));
});

test("exports an editable CV document", async () => {
  const buffer = await createTailoredResumeDocx({
    targetRole: "Junior Full Stack Developer",
    summaryDraft: "Candidate targeting a junior full stack developer role.",
    matchedKeywords: ["JavaScript", "React", "Node.js"],
    resumeKeywords: ["JavaScript", "React", "Node.js", "MongoDB"],
    resumeText: [
      "Bucksmon",
      "bucksmon@example.com",
      "SKILLS",
      "JavaScript, React and MongoDB",
      "EXPERIENCE",
      "- Built a React application using JavaScript and Node.js.",
      "EDUCATION",
      "BSc Software Engineering"
    ].join("\n")
  });

  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 2).toString("ascii"), "PK");
  assert.ok(buffer.length > 1000);
});

test("exports when the source resume has no recognised section headings", async () => {
  const buffer = await createTailoredResumeDocx({
    targetRole: "Software Developer",
    summaryDraft: "Candidate targeting a software developer role.",
    matchedKeywords: ["JavaScript"],
    resumeKeywords: ["JavaScript"],
    resumeText: "Bucksmon\nBuilt an application using JavaScript and Node.js."
  });

  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 2).toString("ascii"), "PK");
});
