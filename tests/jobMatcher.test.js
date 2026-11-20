import test from "node:test";
import assert from "node:assert/strict";
import { isRelevantJob } from "../src/jobs/jobMatcher.js";

const profile = {
  skills: ["JavaScript", "React", "Node.js", "MongoDB", "Python"],
  preferredTitles: ["Full Stack Developer", "Junior Software Engineer"],
  location: "Dubai, United Arab Emirates",
  minimumMatchScore: 70,
  maximumRequiredYears: 3
};

test("accepts a relevant junior full-stack role", () => {
  const result = isRelevantJob({
    title: "Junior Full Stack Developer",
    location: "Dubai, UAE",
    description: "React, JavaScript, Node.js and MongoDB experience."
  }, profile);

  assert.equal(result.relevant, true);
  assert.ok(result.score >= 70);
});

test("rejects an unrelated senior role", () => {
  const result = isRelevantJob({
    title: "Senior Data Scientist",
    location: "Dubai, UAE",
    description: "Python, machine learning and data pipelines. 8 years experience."
  }, profile);

  assert.equal(result.relevant, false);
  assert.equal(result.rejectedForSeniority, true);
});

test("rejects a matching role with too few resume skill matches", () => {
  const result = isRelevantJob({
    title: "Junior Software Engineer",
    location: "Dubai, UAE",
    description: "C++ and embedded systems."
  }, profile);

  assert.equal(result.relevant, false);
});
