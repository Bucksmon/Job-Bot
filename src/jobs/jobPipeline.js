import { isRelevantJob } from "./jobMatcher.js";
import { filterUnsentJobs, markJobsAsSent } from "./jobStore.js";
import { sendJobsToDiscord } from "../discord/discordNotifier.js";

export async function filterAndNotify(jobs, profile, options = {}) {
  const scoredJobs = jobs.map((job) => {
    const match = isRelevantJob(job, profile);

    return {
      ...job,
      matchScore: match.score,
      matchedSkills: match.matchedSkills,
      isRelevant: match.relevant
    };
  });

  const relevantJobs = scoredJobs.filter((job) => job.isRelevant);
  const newJobs = await filterUnsentJobs(
    relevantJobs,
    options.historyPath || process.env.JOB_HISTORY_PATH || "./data/sent-jobs.json"
  );

  // Keep Discord quiet when a search finds nothing new.
  if (newJobs.length > 0 && options.notify !== false) {
    await (options.sendToDiscord || sendJobsToDiscord)(newJobs, options.discord);
  }

  // Save only after Discord confirms delivery, so failed sends can be retried.
  if (newJobs.length > 0 && options.markSent !== false) {
    await markJobsAsSent(
      newJobs,
      options.historyPath || process.env.JOB_HISTORY_PATH || "./data/sent-jobs.json"
    );
  }

  return {
    discovered: jobs.length,
    relevant: relevantJobs.length,
    newMatches: newJobs.length,
    jobs: newJobs
  };
}
