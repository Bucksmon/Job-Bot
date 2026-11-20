import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { filterUnsentJobs, markJobsAsSent } from "../src/jobs/jobStore.js";

test("filters previously sent jobs and ignores tracking parameters", async () => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), "job-filter-"));
  const historyPath = path.join(folder, "sent-jobs.json");

  const firstJob = {
    title: "Junior Developer",
    company: "Example Co",
    location: "Dubai",
    url: "https://www.linkedin.com/jobs/view/123?utm_source=alert"
  };

  await markJobsAsSent([firstJob], historyPath);

  const remaining = await filterUnsentJobs([{
    ...firstJob,
    url: "https://www.linkedin.com/jobs/view/123?trk=public_jobs"
  }], historyPath);

  assert.equal(remaining.length, 0);
  await fs.rm(folder, { recursive: true, force: true });
});
