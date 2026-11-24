import test from "node:test";
import assert from "node:assert/strict";
import { buildResumeModel } from "../lib/resumeModel.js";

test("builds an ATS-friendly CV model with only evidenced matched keywords", () => {
  const model = buildResumeModel({
    targetRole: "Junior Full Stack Developer",
    summaryDraft: "Software engineering graduate targeting a junior full stack developer role.",
    matchedKeywords: ["JavaScript", "React", "Docker"],
    resumeKeywords: ["JavaScript", "React", "MongoDB"],
    resumeText: [
      "Bucksmon",
      "bucksmon@example.com | +971 50 123 4567",
      "PROFESSIONAL SUMMARY",
      "Software engineering graduate with practical project experience.",
      "SKILLS",
      "JavaScript, MongoDB",
      "WORK EXPERIENCE",
      "Built a web application with React.",
      "EDUCATION",
      "BSc Software Engineering"
    ].join("\n")
  });

  assert.equal(model.name, "Bucksmon");
  assert.deepEqual(model.sections.map((section) => section.title), [
    "Professional Summary",
    "Relevant Skills",
    "Skills & Tools",
    "Professional Experience",
    "Education"
  ]);
  assert.deepEqual(model.sections[1].skills, ["React"]);
  assert.doesNotMatch(JSON.stringify(model), /Docker/);
});
