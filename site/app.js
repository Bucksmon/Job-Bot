const apiBase = (window.JOBBOT_API_BASE || "").replace(/\/$/, "");

const fileInput = document.querySelector("#resume-file");
const dropZone = document.querySelector("#drop-zone");
const uploadTitle = document.querySelector("#upload-title");
const uploadSubtitle = document.querySelector("#upload-subtitle");
const filePill = document.querySelector("#file-pill");
const jobTitleInput = document.querySelector("#job-title");
const jobDescriptionInput = document.querySelector("#job-description");
const characterCount = document.querySelector("#character-count");
const analyzeButton = document.querySelector("#analyze-button");
const resultsSection = document.querySelector("#results");
const toast = document.querySelector("#toast");
const summaryDraft = document.querySelector("#summary-draft");

fileInput.accept = ".pdf,.docx,.doc,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

let selectedFile = null;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
}

function setSelectedFile(file) {
  if (!file) return;

  const validExtension = /\.(pdf|docx|doc)$/i.test(file.name);
  if (!validExtension) {
    selectedFile = null;
    filePill.hidden = true;
    fileInput.value = "";
    showToast("Please choose a PDF, DOCX, or DOC resume.");
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    showToast("Your resume must be smaller than 8 MB.");
    return;
  }

  selectedFile = file;
  uploadTitle.textContent = "Resume ready";
  uploadSubtitle.textContent = "You can choose a different file any time";
  filePill.hidden = false;
  filePill.textContent = `${file.name} · ${(file.size / 1024).toFixed(0)} KB`;
}

fileInput.addEventListener("change", () => setSelectedFile(fileInput.files?.[0]));

for (const eventName of ["dragenter", "dragover"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("dragging");
  });
}

for (const eventName of ["dragleave", "drop"]) {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragging");
  });
}

dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files?.[0];
  setSelectedFile(file);
});

jobDescriptionInput.addEventListener("input", () => {
  characterCount.textContent = `${jobDescriptionInput.value.length.toLocaleString()} / 30,000`;
});

function addTags(container, values, missing = false) {
  container.replaceChildren();

  if (!values.length) {
    const empty = document.createElement("span");
    empty.className = "empty-tags";
    empty.textContent = missing
      ? "No missing recognised keywords."
      : "No matching keywords identified yet.";
    container.append(empty);
    return;
  }

  for (const value of values) {
    const tag = document.createElement("span");
    tag.className = missing ? "tag missing" : "tag";
    tag.textContent = value;
    container.append(tag);
  }
}

function renderResults(payload) {
  const { analysis } = payload;

  document.querySelector("#score-value").textContent =
    analysis.score === null ? "—" : `${analysis.score}%`;

  document.querySelector("#score-ring").style.setProperty(
    "--score",
    analysis.score === null ? 0 : analysis.score
  );

  document.querySelector("#score-heading").textContent =
    analysis.score === null ? "Not enough recognised keywords" :
    analysis.score >= 75 ? "Strong keyword overlap" :
    analysis.score >= 45 ? "Some relevant terms found" :
    "More alignment may be needed";

  const detectedResumeSkills = analysis.resumeSkills || analysis.resumeKeywords || [];
  document.querySelector("#score-description").textContent =
    analysis.score === null
      ? `We extracted ${detectedResumeSkills.length} skills from your resume, but could not recognise any job-specific terms. Try including the job's technical requirements or responsibilities.`
      : analysis.score === 0
        ? `We found ${detectedResumeSkills.length} skills in your resume and ${analysis.jobKeywordCount} recognised job terms, but no direct overlap. Review the evidence and gaps below; related wording may still describe the same capability.`
        : `Matched ${analysis.matchedKeywords.length} of ${analysis.jobKeywordCount} recognised job terms. We also detected ${detectedResumeSkills.length} skills in your resume.`;

  document.querySelector("#resume-skill-count").textContent = detectedResumeSkills.length;
  document.querySelector("#matched-count").textContent = analysis.matchedKeywords.length;
  document.querySelector("#missing-count").textContent = analysis.missingKeywords.length;

  addTags(document.querySelector("#resume-skill-list"), detectedResumeSkills);
  addTags(document.querySelector("#matched-list"), analysis.matchedKeywords);
  addTags(document.querySelector("#missing-list"), analysis.missingKeywords, true);

  const evidenceList = document.querySelector("#evidence-list");
  evidenceList.replaceChildren();

  if (!analysis.evidence.length) {
    const item = document.createElement("li");
    item.textContent = "No achievement-style lines could be confidently extracted. Review your experience and project sections manually.";
    evidenceList.append(item);
  } else {
    for (const evidence of analysis.evidence) {
      const item = document.createElement("li");
      item.textContent = evidence;
      evidenceList.append(item);
    }
  }

  const auditList = document.querySelector("#audit-list");
  auditList.replaceChildren();

  for (const check of payload.resumeAudit?.checks || []) {
    const item = document.createElement("li");
    item.className = "audit-item " + check.status;

    const status = document.createElement("span");
    status.className = "audit-status";
    status.textContent = check.status === "pass" ? "PASS" :
      check.status === "review" ? "REVIEW" : "INFO";

    const body = document.createElement("div");
    const heading = document.createElement("strong");
    heading.textContent = check.label;
    const detail = document.createElement("p");
    detail.textContent = check.detail;
    body.append(heading, detail);
    item.append(status, body);
    auditList.append(item);
  }

  const suggestions = analysis.suggestedEdits || {};
  summaryDraft.value = suggestions.summary || analysis.summaryDraft || "";
  summaryDraft.placeholder = summaryDraft.value
    ? ""
    : "No evidence-backed summary could be assembled. Draft one manually using facts from your CV.";

  document.querySelector("#skills-draft").value = suggestions.skillsText || "";
  document.querySelector("#experience-draft").value =
    (suggestions.experienceBullets || []).map((line) => "- " + line).join("\n");
  document.querySelector("#projects-draft").value =
    (suggestions.projectBullets || []).map((line) => "- " + line).join("\n");
  addTags(document.querySelector("#verify-terms"), suggestions.termsToVerify || [], true);
  document.querySelector("#method-note").textContent = analysis.notes.join(" ");
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

const jobQueryInput = document.querySelector("#job-query");
const jobLocationInput = document.querySelector("#job-location");
const searchJobsButton = document.querySelector("#search-jobs");
const jobResults = document.querySelector("#job-results");
const jobList = document.querySelector("#job-list");

function formatPublishedDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return "Published " + new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

function renderJobs(payload) {
  jobList.replaceChildren();
  const count = Number(payload.total || 0);
  document.querySelector("#job-results-count").textContent =
    count + (count === 1 ? " vacancy found" : " vacancies found");

  const workingSources = (payload.providers || []).filter((item) =>
    item.status === "ok" || item.status === "cached"
  ).length;
  document.querySelector("#job-results-source").textContent =
    workingSources + " employer boards checked";

  if (!count) {
    const empty = document.createElement("p");
    empty.className = "job-empty";
    empty.textContent = "No matching published roles were found in the selected employer boards. Try a broader title or location.";
    jobList.append(empty);
    jobResults.hidden = false;
    return;
  }

  for (const job of payload.jobs) {
    const card = document.createElement("article");
    card.className = "job-card";

    const top = document.createElement("div");
    top.className = "job-card-top";

    const identity = document.createElement("div");
    const company = document.createElement("span");
    company.className = "job-company";
    company.textContent = job.company;

    const title = document.createElement("h3");
    title.textContent = job.title;
    identity.append(company, title);

    const type = document.createElement("span");
    type.className = "job-type";
    type.textContent = job.workplaceType || "Workplace not specified";
    top.append(identity, type);

    const meta = document.createElement("div");
    meta.className = "job-meta";
    [job.location, job.employmentType, formatPublishedDate(job.publishedAt), job.compensation]
      .filter(Boolean)
      .forEach((value) => {
        const item = document.createElement("span");
        item.textContent = value;
        meta.append(item);
      });

    const description = document.createElement("p");
    description.className = "job-description-preview";
    description.textContent = (job.description || "The employer has not provided a plain-text job description.")
      .slice(0, 420);

    const actions = document.createElement("div");
    actions.className = "job-card-actions";

    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.className = "job-use-button";
    loadButton.textContent = "Use this job";
    loadButton.addEventListener("click", () => {
      jobTitleInput.value = job.title;
      jobDescriptionInput.value = job.description || "";
      jobDescriptionInput.dispatchEvent(new Event("input", { bubbles: true }));
      document.querySelector("#job-description").scrollIntoView({ behavior: "smooth", block: "center" });
      jobDescriptionInput.focus({ preventScroll: true });
      showToast("Employer job description loaded. Upload your resume and analyse it.");
    });

    actions.append(loadButton);

    for (const [label, url] of [
      ["View posting", job.jobUrl],
      ["Apply on employer site", job.applyUrl]
    ]) {
      if (!url) continue;
      const link = document.createElement("a");
      link.className = "job-link";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = label;
      actions.append(link);
    }

    card.append(top, meta, description, actions);
    jobList.append(card);
  }

  jobResults.hidden = false;
}

searchJobsButton.addEventListener("click", async () => {
  if (!apiBase) {
    showToast("The job search service has not been configured.");
    return;
  }

  const query = jobQueryInput.value.trim();
  const location = jobLocationInput.value.trim();
  searchJobsButton.disabled = true;
  searchJobsButton.querySelector("span").textContent = "Searching…";
  jobResults.hidden = false;
  jobList.replaceChildren();

  const loading = document.createElement("p");
  loading.className = "job-empty";
  loading.textContent = "Checking live employer career boards…";
  jobList.append(loading);

  try {
    const params = new URLSearchParams({ q: query, location });
    const response = await fetch(apiBase + "/api/jobs?" + params.toString());
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not retrieve employer listings.");
    renderJobs(payload);
    showToast("Employer job search complete.");
  } catch (error) {
    jobList.replaceChildren();
    const message = document.createElement("p");
    message.className = "job-empty";
    message.textContent = error.message || "Could not connect to the job search service.";
    jobList.append(message);
    showToast(error.message || "Job search failed.");
  } finally {
    searchJobsButton.disabled = false;
    searchJobsButton.querySelector("span").textContent = "Find jobs";
  }
});

for (const input of [jobQueryInput, jobLocationInput]) {
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchJobsButton.click();
  });
}

analyzeButton.addEventListener("click", async () => {
  if (!apiBase) {
    showToast("The backend URL has not been configured yet.");
    return;
  }

  const description = jobDescriptionInput.value.trim();

  if (!selectedFile) {
    showToast("Upload your resume first.");
    return;
  }

  if (description.length < 100) {
    showToast("Paste a fuller job description (at least 100 characters).");
    jobDescriptionInput.focus();
    return;
  }

  const formData = new FormData();
  formData.append("resume", selectedFile);
  formData.append("jobTitle", jobTitleInput.value.trim());
  formData.append("jobDescription", description);

  analyzeButton.disabled = true;
  analyzeButton.querySelector("span").textContent = "Analyzing resume…";

  try {
    const response = await fetch(`${apiBase}/api/analyze`, {
      method: "POST",
      body: formData
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not analyze the resume.");

    renderResults(payload);
    showToast("Analysis complete.");
  } catch (error) {
    showToast(error.message || "Could not connect to the analysis service.");
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.querySelector("span").textContent = "Analyze my resume";
  }
});

async function copySuggestion(targetId) {
  const field = document.getElementById(targetId);
  if (!field?.value.trim()) {
    showToast("There is no suggested text to copy for this section.");
    return;
  }

  try {
    await navigator.clipboard.writeText(field.value);
    showToast("Suggested text copied.");
  } catch {
    field.select();
    document.execCommand("copy");
    showToast("Suggested text copied.");
  }
}

for (const button of document.querySelectorAll(".copy-suggestion")) {
  button.addEventListener("click", () => copySuggestion(button.dataset.copyTarget));
}

document.querySelector("#start-over").addEventListener("click", () => {
  resultsSection.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
});
