import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  filterUnsentJobs,
  markJobsAsSent,
  markJobApplied
} from "../src/jobs/jobStore.js";

test("filters previously sent jobs and ignores tracking parameters", async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "job-filter-"));
  const historyPath = path.join(folder, "sent-jobs.json");

  const firstJob = {
    title: "Junior Developer",
    company: "Example Co",
    location: "Dubai",
    url: "https://careers.example.com/jobs/123?utm_source=alert"
  };

  await markJobsAsSent([firstJob], historyPath);

  const remaining = await filterUnsentJobs([{
    ...firstJob,
    url: "https://careers.example.com/jobs/123?trk=public_jobs"
  }], historyPath);

  assert.equal(remaining.length, 0);
  await fs.rm(folder, { recursive: true, force: true });
});

test("records an application against a previously sent job", async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "job-filter-"));
  const historyPath = path.join(folder, "sent-jobs.json");
  const job = {
    title: "Junior Developer",
    company: "Example Co",
    location: "Dubai",
    url: "https://careers.example.com/jobs/456"
  };

  await markJobsAsSent([job], historyPath);
  const record = await markJobApplied(job.url, historyPath);

  assert.equal(record.status, "applied");
  assert.ok(record.appliedAt);
  await fs.rm(folder, { recursive: true, force: true });
});
