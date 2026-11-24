import test from "node:test";
import assert from "node:assert/strict";
import { analyzeResume, extractKeywords } from "../lib/analyzer.js";

const resumeText = `
Full Stack Developer
Built applications using JavaScript, React, Node.js and MongoDB.
Developed REST APIs with Express.js and integrated Firebase authentication.
Created a self-checkout application using React Native and Expo.
`;

const jobDescription = `
Junior Full Stack Developer

Required qualifications:
- Experience with JavaScript, React and Node.js.
- Knowledge of MongoDB and REST APIs.
- Experience building responsive web applications.

Preferred:
- Familiarity with Docker and AWS.
- Understanding of automated testing.
`;

test("extracts recognised technical keywords", () => {
  const keywords = extractKeywords(resumeText);

  assert.ok(keywords.includes("JavaScript"));
  assert.ok(keywords.includes("React"));
  assert.ok(keywords.includes("Node.js"));
  assert.ok(keywords.includes("MongoDB"));
  assert.ok(keywords.includes("REST APIs"));
});

test("calculates overlap and identifies gaps", () => {
  const result = analyzeResume({
    resumeText,
    jobDescription,
    jobTitle: "Junior Full Stack Developer"
  });

  assert.ok(result.score > 0);
  assert.ok(result.matchedKeywords.includes("JavaScript"));
  assert.ok(result.missingKeywords.includes("Docker"));
  assert.ok(result.missingKeywords.includes("AWS"));
  assert.ok(result.targetRole === "Junior Full Stack Developer");
});

test("does not claim an ATS score when no recognised terms exist", () => {
  const result = analyzeResume({
    resumeText: "A general resume with no listed technical terminology.",
    jobDescription: "Seeking a candidate with a strong customer-facing mindset and a positive attitude.",
    jobTitle: "Customer Assistant"
  });

  assert.equal(result.score, null);
});

test("summary draft only uses skills found in the supplied resume", () => {
  const result = analyzeResume({
    resumeText,
    jobDescription,
    jobTitle: "Junior Full Stack Developer"
  });

  assert.match(result.summaryDraft, /JavaScript/);
  assert.doesNotMatch(result.summaryDraft, /Docker/);
});
