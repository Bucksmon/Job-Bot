import test from "node:test";
import assert from "node:assert/strict";
import { createTailoredResumeDocx } from "../lib/docxExporter.js";

test("exports an editable DOCX draft", async () => {
  const buffer = await createTailoredResumeDocx({
    targetRole: "Junior Full Stack Developer",
    summaryDraft: "Resume-based profile highlighting JavaScript and React.",
    matchedKeywords: ["JavaScript", "React", "Node.js"],
    missingKeywords: ["Docker", "AWS"],
    evidence: ["Built a React application using JavaScript and Node.js."],
    resumeText: "Full Stack Developer\nBuilt a React application using JavaScript and Node.js.",
    notes: ["Review every detail before applying."]
  });

  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 2).toString("ascii"), "PK");
  assert.ok(buffer.length > 1000);
});

test("exports even when optional notes are omitted", async () => {
  const buffer = await createTailoredResumeDocx({
    targetRole: "Software Developer",
    summaryDraft: "Software developer experienced in JavaScript.",
    matchedKeywords: ["JavaScript"],
    missingKeywords: [],
    evidence: [],
    resumeText: "Software Developer with JavaScript experience."
  });
  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 2).toString("ascii"), "PK");
});
