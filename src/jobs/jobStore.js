import fs from "node:fs/promises";
import path from "node:path";

function getJobKey(job) {
  if (job.url) {
    try {
      const url = new URL(job.url);
      url.hash = "";

      // Tracking query parameters should not make the same listing look new.
      for (const key of [...url.searchParams.keys()]) {
        if (/^(utm_|trk|tracking)/i.test(key)) {
          url.searchParams.delete(key);
        }
      }

      return url.toString().replace(/\/$/, "").toLowerCase();
    } catch {
      // Fall back to a text-based key when the listing URL is malformed.
    }
  }

  return [
    job.title || "",
    job.company || "",
    job.location || ""
  ].join("|").toLowerCase().replace(/\s+/g, " ").trim();
}

async function readStore(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(content);

    return parsed && typeof parsed === "object" && parsed.jobs
      ? parsed
      : { jobs: {} };
  } catch (error) {
    if (error.code === "ENOENT") return { jobs: {} };
    throw new Error(`Could not read the local job history: ${error.message}`);
  }
}

async function writeStore(store, filePath) {
  const absolutePath = path.resolve(filePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });

  const temporaryPath = `${absolutePath}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(temporaryPath, absolutePath);
}

export async function filterUnsentJobs(
  jobs,
  filePath = process.env.JOB_HISTORY_PATH || "./data/sent-jobs.json"
) {
  const store = await readStore(filePath);
  return jobs.filter((job) => !store.jobs[getJobKey(job)]);
}

export async function markJobsAsSent(
  jobs,
  filePath = process.env.JOB_HISTORY_PATH || "./data/sent-jobs.json"
) {
  const store = await readStore(filePath);

  for (const job of jobs) {
    const key = getJobKey(job);
    store.jobs[key] = {
      ...(store.jobs[key] || {}),
      title: job.title || "",
      company: job.company || "",
      url: job.url || "",
      sentAt: new Date().toISOString(),
      status: store.jobs[key]?.status || "new"
    };
  }

  await writeStore(store, filePath);
}

export async function markJobApplied(
  jobUrl,
  filePath = process.env.JOB_HISTORY_PATH || "./data/sent-jobs.json"
) {
  const store = await readStore(filePath);
  const key = getJobKey({ url: jobUrl });
  const record = store.jobs[key];

  if (!record) {
    throw new Error("That job URL is not in the bot's sent history.");
  }

  record.status = "applied";
  record.appliedAt = new Date().toISOString();
  await writeStore(store, filePath);

  return record;
}
