import "dotenv/config";
import { preferences } from "../config/preferences.js";
import { extractResumeText } from "../resume/resumeParser.js";
import { getResumePath } from "../resume/resumeStorage.js";
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
    const resumeText = await extractResumeText(await getResumePath());
    const profile = extractProfile(resumeText, preferences);
    const sources = await listSources();

    if (profile.skills.length === 0) {
      throw new Error("No supported technical skills were found in the resume. Check the resume text and skill dictionary.");
    }

    if (sources.length === 0) {
      throw new Error("No career sources configured. Use /add-source with an employer career page that permits automated access.");
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
