const seniorityWords = /\b(senior|sr\.?|lead|principal|staff|manager|director|head of)\b/i;
const yearsPattern = /(\d{1,2})\s*\+?\s*(?:years|yrs)/i;

function normalize(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9+#. ]/g, " ").replace(/\s+/g, " ").trim();
}

function titleMatches(jobTitle, preferredTitles) {
  const title = normalize(jobTitle);

  if (!title) return false;

  return preferredTitles.some((preferredTitle) => {
    const target = normalize(preferredTitle);
    return target && (title.includes(target) || target.includes(title));
  });
}

function getRequiredYears(job) {
  if (Number.isFinite(job.requiredYears)) {
    return job.requiredYears;
  }

  const match = `${job.title || ""} ${job.description || ""}`.match(yearsPattern);
  return match ? Number(match[1]) : null;
}

function locationMatches(jobLocation, preferredLocation) {
  const job = normalize(jobLocation);
  const preferred = normalize(preferredLocation);

  if (!job || !preferred) return false;
  if (job.includes("remote") || job.includes("worldwide")) return true;

  // Dubai searches should also accept UAE-wide opportunities.
  if (preferred.includes("dubai") && job.includes("uae")) return true;

  return job.includes(preferred) || preferred.includes(job);
}

export function scoreJob(job, profile) {
  const titleMatch = titleMatches(job.title, profile.preferredTitles);
  const jobText = normalize(`${job.title || ""} ${job.description || ""}`);

  const matchedSkills = profile.skills.filter((skill) =>
    jobText.includes(normalize(skill))
  );

  // Cap the skill denominator so a long resume does not unfairly lower scores.
  const skillTarget = Math.min(profile.skills.length, 5);
  const skillScore = skillTarget === 0
    ? 0
    : Math.min(50, Math.round((matchedSkills.length / skillTarget) * 50));

  const titleScore = titleMatch ? 40 : 0;
  const locationScore = locationMatches(job.location, profile.location) ? 10 : 0;
  const total = titleScore + skillScore + locationScore;

  const requiredYears = getRequiredYears(job);
  const overqualifiedRole = seniorityWords.test(job.title || "");
  const experienceMismatch = requiredYears !== null &&
    requiredYears > profile.maximumRequiredYears;

  return {
    score: overqualifiedRole || experienceMismatch ? 0 : total,
    titleMatch,
    matchedSkills,
    requiredYears,
    locationMatch: locationScore > 0,
    rejectedForSeniority: overqualifiedRole || experienceMismatch
  };
}

export function isRelevantJob(job, profile) {
  const result = scoreJob(job, profile);

  return {
    ...result,
    relevant: !result.rejectedForSeniority &&
      result.score >= profile.minimumMatchScore
  };
}
