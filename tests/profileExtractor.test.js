import test from "node:test";
import assert from "node:assert/strict";
import { extractProfile } from "../src/resume/profileExtractor.js";

test("extracts skills that appear in the resume", () => {
  const profile = extractProfile(
    "Built projects using JavaScript, React Native, Node.js, MongoDB and Firebase.",
    {
      jobTitles: ["Full Stack Developer"],
      location: "Dubai, UAE",
      minimumMatchScore: 70,
      maximumRequiredYears: 3
    }
  );

  assert.deepEqual(profile.skills, [
    "JavaScript",
    "React",
    "React Native",
    "Node.js",
    "MongoDB",
    "Firebase"
  ]);
});

test("does not match Java inside the word JavaScript", () => {
  const profile = extractProfile("JavaScript developer", {
    jobTitles: [],
    location: "Dubai",
    minimumMatchScore: 70,
    maximumRequiredYears: 3
  });

  assert.deepEqual(profile.skills, ["JavaScript"]);
});
