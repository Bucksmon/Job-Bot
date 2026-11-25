import test from "node:test";
import assert from "node:assert/strict";
import { buildResumeModel, parseResumeSections } from "../lib/resumeModel.js";

test("recognises Skills & Awards and separates its labelled subsections", () => {
  const resumeText = [
    "FURQAN NADIR",
    "furqan@example.com | +971 50 123 4567",
    "EXPERIENCE",
    "Web Developer Intern",
    "- Built a Puppeteer-based screenshot service.",
    "EDUCATION",
    "BSc Software Engineering",
    "PROJECTS",
    "Royal Road",
    "- Created a full-stack marketplace.",
    "SKILLS & AWARDS",
    "Technical Skills: C++, Python, JavaScript, React, Node.js",
    ", Express.js, REST APIs, MongoDB, Puppeteer",
    "Languages: Urdu (Native), English (Professional)",
    "Certifications: Cybersecurity Fundamentals, Introduction to C++",
    "Awards: Friend of Police Card and Certificate of Appreciation"
  ].join("\n");

  const parsed = parseResumeSections(resumeText);
  assert.deepEqual(parsed.sections.map((section) => section.key), [
    "experience", "education", "projects", "skills", "languages", "certifications", "achievements"
  ]);

  const model = buildResumeModel({
    resumeText,
    summaryDraft: "Software Engineering graduate with hands-on web development experience.",
    matchedKeywords: [],
    resumeKeywords: ["JavaScript", "Python", "Node.js", "Express.js", "MongoDB"]
  });

  const sections = model.sections;
  const skills = sections.find((section) => section.key === "skills");
  const languages = sections.find((section) => section.key === "languages");
  const certifications = sections.find((section) => section.key === "certifications");
  const awards = sections.find((section) => section.key === "achievements");
  const projects = sections.find((section) => section.key === "projects");

  assert.ok(skills.lines.join(" ").includes("JavaScript"));
  assert.ok(skills.lines.join(" ").includes("Puppeteer"));
  assert.ok(languages.lines.join(" ").includes("English"));
  assert.ok(certifications.lines.join(" ").includes("Cybersecurity Fundamentals"));
  assert.ok(awards.lines.join(" ").includes("Friend of Police Card"));
  assert.doesNotMatch(projects.lines.join(" "), /Technical Skills|Certifications:|Awards:/);
  assert.ok(sections.findIndex((section) => section.key === "education") <
    sections.findIndex((section) => section.key === "projects"));
});
