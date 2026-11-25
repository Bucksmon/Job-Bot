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

test("recognises common resume wording and technology aliases", () => {
  const keywords = extractKeywords("Built a ReactJS and Node app. Used JS, PostgreSQL, AWS and version control.");
  assert.ok(keywords.includes("React"));
  assert.ok(keywords.includes("Node.js"));
  assert.ok(keywords.includes("JavaScript"));
  assert.ok(keywords.includes("PostgreSQL"));
  assert.ok(keywords.includes("AWS"));
  assert.ok(keywords.includes("Git"));
});

test("recognises soft-skill synonyms without requiring exact phrasing", () => {
  const result = analyzeResume({
    resumeText: "Strong written and verbal communication. Worked with cross-functional teams. Applied analytical skills to resolve issues.",
    jobDescription: "We need communication skills, collaboration, and problem solving in a fast-paced environment.",
    jobTitle: "Operations Associate"
  });
  assert.ok(result.matchedKeywords.includes("Communication"));
  assert.ok(result.matchedKeywords.includes("Collaboration"));
  assert.ok(result.matchedKeywords.includes("Problem Solving"));
  assert.ok(result.score > 0);
});

test("recognises security and operations role keywords", () => {
  const result = analyzeResume({
    resumeText: "Worked as a security officer monitoring CCTV, managing access control, patrolling premises and writing incident reports. Certified in first aid and fire safety.",
    jobDescription: "Security guard required. Duties include CCTV monitoring, access control, patrolling, incident reporting, first aid and fire safety.",
    jobTitle: "Security Guard"
  });
  assert.ok(result.score > 0);
  assert.ok(result.matchedKeywords.includes("CCTV"));
  assert.ok(result.matchedKeywords.includes("Access Control"));
  assert.ok(result.matchedKeywords.includes("First Aid"));
});


test("does not inject generic filler if the source has no summary evidence", () => {
  const result = analyzeResume({
    resumeText: "Furqan Nadir\nfurqan@example.com\nA resume without recognised technologies or achievement statements.",
    jobDescription: "Required: Kubernetes, Azure and Terraform experience.",
    jobTitle: "Cloud Engineer"
  });

  assert.equal(result.summaryDraft, "");
});

test("replaces an old placeholder with genuine resume evidence", () => {
  const result = analyzeResume({
    resumeText: [
      "Furqan Nadir",
      "PROFESSIONAL SUMMARY",
      "Candidate targeting Backend Software Engineer. Add a concise summary of relevant experience and verified strengths from your resume before applying.",
      "PROFESSIONAL EXPERIENCE",
      "- Built REST APIs using Node.js and Express.js for an internal platform.",
      "The platform handled 50,000 requests per day and reduced response latency by 30%."
    ].join("\n"),
    jobDescription: "Required qualifications:\n- Node.js and Express.js experience building REST APIs.",
    jobTitle: "Backend Software Engineer"
  });

  assert.match(result.summaryDraft, /Node.js/);
  assert.match(result.summaryDraft, /50,000 requests per day/);
  assert.doesNotMatch(result.summaryDraft, /Candidate targeting/);
  assert.doesNotMatch(result.summaryDraft, /Add a concise summary/);
});

test("classifies skills under required and preferred headings", () => {
  const result = analyzeResume({
    resumeText: "JavaScript, Node.js",
    jobDescription: [
      "Required qualifications:",
      "- JavaScript and Node.js experience.",
      "",
      "Preferred:",
      "- Docker and AWS knowledge."
    ].join("\n"),
    jobTitle: "Backend Developer"
  });

  assert.deepEqual(result.requiredKeywords, ["JavaScript", "Node.js"]);
  assert.deepEqual(result.matchedRequired, ["JavaScript", "Node.js"]);
  assert.deepEqual(result.matchedPreferred, []);
});

test("builds a truthful profile summary when the job description has no exact keyword overlap", () => {
  const resume = [
    "FURQAN NADIR",
    "EXPERIENCE",
    "Web Developer Intern",
    "Marketist",
    "- Optimized the mockup generator's load time and UI responsiveness, serving 40-50 daily active users, resulting in 25% faster page loads.",
    "- Built and deployed a Puppeteer-based screenshot and video generation service for automated website previews, while maintaining service availability during development and deployment.",
    "EDUCATION",
    "BSc Software Engineering",
    "PROJECTS",
    "- Created a full-stack marketplace for GTA World, supporting 60+ registered users to list and purchase items.",
    "SKILLS & AWARDS",
    "Technical Skills: C++, Python, JavaScript, React, Node.js, Express.js, MongoDB, REST APIs, Puppeteer"
  ].join("\n");

  const result = analyzeResume({
    resumeText: resume,
    jobDescription: "Build an inference platform and isolated agent sandboxes. Work on model-serving orchestration, runtime reliability, execution environments, and large-scale distributed systems.",
    jobTitle: "Senior Software Engineer Inference Platform Agent Sandboxes"
  });

  assert.equal(result.matchedKeywords.length, 0);
  assert.match(result.summaryDraft, /Software Engineering graduate/);
  assert.match(result.summaryDraft, /25% faster page loads/);
  assert.match(result.summaryDraft, /Puppeteer/);
  assert.doesNotMatch(result.summaryDraft, /Kubernetes|distributed systems experience/i);
});
