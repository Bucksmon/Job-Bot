import "dotenv/config";
import { preferences } from "../config/preferences.js";
import { extractResumeText } from "../resume/resumeParser.js";
import { extractProfile } from "../resume/profileExtractor.js";
import { listSources } from "../discovery/sourceStore.js";
import { crawlCareerSource } from "../discovery/publicCareerCrawler.js";
import { filterAndNotify } from "./jobPipeline.js";

let searchInProgress = false;

export async function runSearch() {
  if (searchInProgress) {
    return { skipped: true, reason: "A search is already running." };
  }

  searchInProgress = true;

  try {
    const resumePath = process.env.RESUME_PATH || "./data/resume.pdf";
    const resumeText = await extractResumeText(resumePath);
    const profile = extractProfile(resumeText, preferences);
    const sources = await listSources();

    if (sources.length === 0) {
      throw new Error("No job sources configured. Use /add-source with a public employer career page that permits automated access.");
    }

    const collectedJobs = [];

    for (const source of sources) {
      try {
        const jobs = await crawlCareerSource(source);
        collectedJobs.push(...jobs);
        console.log(`Collected ${jobs.length} listings from ${source.url}`);
      } catch (error) {
        console.warn(`Source skipped (${source.url}): ${error.message}`);
      }
    }

    const result = await filterAndNotify(collectedJobs, profile, {
      historyPath: process.env.JOB_HISTORY_PATH || "./data/sent-jobs.json"
    });

    return {
      ...result,
      profileSkills: profile.skills.length,
      sourcesChecked: sources.length
    };
  } finally {
    searchInProgress = false;
  }
}
