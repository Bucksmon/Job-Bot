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
const downloadButton = document.querySelector("#download-button");

fileInput.accept = ".pdf,.docx,.doc,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

let selectedFile = null;
let currentDocumentData = null;
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

  document.querySelector("#score-description").textContent =
    analysis.score === null
      ? "The scanner did not find enough recognised role-specific terms to calculate a useful estimate."
      : analysis.score === 0
        ? analysis.resumeKeywordCount === 0
          ? "We extracted resume text but could not recognise any skills from our current keyword library. Check that your resume text is selectable and review the skills list manually."
          : `We recognised ${analysis.resumeKeywordCount} resume terms and ${analysis.jobKeywordCount} job-description terms, but found no exact keyword overlap. Related wording may still describe the same skill.`
        : `Found ${analysis.matchedKeywords.length} of ${analysis.jobKeywordCount} recognised job-description keywords in your resume.`;

  document.querySelector("#matched-count").textContent = analysis.matchedKeywords.length;
  document.querySelector("#missing-count").textContent = analysis.missingKeywords.length;

  addTags(document.querySelector("#matched-list"), analysis.matchedKeywords);
  addTags(document.querySelector("#missing-list"), analysis.missingKeywords, true);

  const evidenceList = document.querySelector("#evidence-list");
  evidenceList.replaceChildren();

  if (!analysis.evidence.length) {
    const item = document.createElement("li");
    item.textContent = "No matching evidence lines were found. Review your experience and project sections manually.";
    evidenceList.append(item);
  } else {
    for (const evidence of analysis.evidence) {
      const item = document.createElement("li");
      item.textContent = evidence;
      evidenceList.append(item);
    }
  }

  summaryDraft.value = analysis.summaryDraft;
  currentDocumentData = payload.documentData;
  document.querySelector("#method-note").textContent = analysis.notes.join(" ");
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
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

document.querySelector("#copy-summary").addEventListener("click", async () => {
  if (!summaryDraft.value.trim()) return;

  try {
    await navigator.clipboard.writeText(summaryDraft.value);
    showToast("Summary copied.");
  } catch {
    summaryDraft.select();
    document.execCommand("copy");
    showToast("Summary copied.");
  }
});

downloadButton.addEventListener("click", async () => {
  if (!apiBase || !currentDocumentData) {
    showToast("Run an analysis before downloading a draft.");
    return;
  }

  downloadButton.disabled = true;
  downloadButton.textContent = "Preparing DOCX…";

  try {
    const documentData = {
      ...currentDocumentData,
      summaryDraft: summaryDraft.value.trim()
    };

    const response = await fetch(`${apiBase}/api/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentData })
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Could not create the DOCX file.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Tailored-Resume-${(documentData.targetRole || "Draft").replace(/[^a-z0-9]+/gi, "-")}.docx`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast("Your tailored resume draft is ready.");
  } catch (error) {
    showToast(error.message || "Could not download the DOCX.");
  } finally {
    downloadButton.disabled = false;
    downloadButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> Download tailored DOCX';
  }
});

document.querySelector("#start-over").addEventListener("click", () => {
  resultsSection.hidden = true;
  currentDocumentData = null;
  window.scrollTo({ top: 0, behavior: "smooth" });
});
