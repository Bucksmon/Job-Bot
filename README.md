# Resume Match

A small resume and job-description matcher.

Upload a PDF, DOCX, or legacy DOC resume, paste a job description, review the keyword alignment, and receive copy-ready CV edits to apply manually.

## Architecture

- **Frontend:** Plain HTML, CSS and JavaScript hosted on GitHub Pages.
- **Backend:** Node.js and Express hosted on Render.
- **Resume parsing:** `pdfjs-dist`, `mammoth`, and `word-extractor`.
- **PDF export:** `pdfjs-dist` for PDF text extraction.
- **Analysis:** Transparent keyword matching and resume evidence selection. No ML model or external AI API is required.

## What it does

1. Extracts text from PDF, modern Word DOCX, and legacy Word DOC resumes.
2. Finds recognised skills and terms in the job description.
3. Shows keyword overlap, missing terms, and resume evidence.
4. Creates an editable professional-summary draft based only on the supplied resume.
5. Exports a text-based, searchable PDF with a professional summary, relevant skills already evidenced in the resume, and the original experience, project, education, and certification sections that could be identified.

The match percentage is an indicative keyword-alignment estimate. ATS products use different parsing and ranking rules, so no third-party ATS score or 100% pass can be guaranteed. The suggested text is not a replacement CV or a generated file. It is intended to be reviewed and manually added to the original document.

The tool must never be used to add skills, qualifications, employers, achievements, or years of experience that are not true.

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm install
cp .env.example .env
npm start
```

The API listens on port 10000 by default. For local frontend testing, serve the `site` folder with a static server and change `site/config.js` to:

```js
window.JOBBOT_API_BASE = "http://localhost:10000";
```

Run tests:

```bash
npm test
```

## Deploy the backend to Render

The root `render.yaml` defines a Node.js web service.

1. Connect GitHub to Render. In Render **Account Settings → Git Deployment Credentials**, add GitHub and authorize access to this repository.
2. If Render uses its GitHub App, make sure `Bucksmon/Job-Bot` is included in the app installation's repository access list.
3. Create a Blueprint from this repository, or create a Web Service connected to it.
4. Use the repository root as the service root.
5. Build command: `npm install`
6. Start command: `npm start`
7. Health check path: `/api/health`
8. Set `FRONTEND_ORIGINS` to the exact GitHub Pages origin (origin only, without a path).

After Render creates the service, copy its actual `onrender.com` URL into `site/config.js` as `window.JOBBOT_API_BASE`, then push that change.

The free Render web-service plan can spin down after 15 minutes of inactivity; the first request after a spin-down can take around a minute to wake the service. Upgrade the service plan to avoid this limitation.

## Deploy the frontend to GitHub Pages

1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, set the source to **GitHub Actions**.
3. Push to `main`; `.github/workflows/pages.yml` publishes the `site` folder.
4. Check the Actions tab for the Pages deployment URL.

GitHub Pages is available for public repositories on GitHub Free. A private repository requires GitHub Pro, Team, or Enterprise. If the Pages setting is unavailable for this private repository, either upgrade the GitHub plan or publish the static `site` folder from a separate public repository. The API can remain private.

## Privacy

Resume files are uploaded to the Render API for parsing in memory. The app does not write uploaded resumes or extracted resume text to disk or a database. The app returns analysis and suggested text directly to the browser; users update their own CV manually. Do not upload a resume unless you are comfortable sending it to the configured backend.

The API has an 8 MB upload limit, CORS origin restrictions, and a per-IP request limit.

## Employer job search

The website includes a simple live job search that queries a curated list of public Ashby employer career boards from the Node.js backend. The current board list is maintained in `lib/jobSearch.js`; the browser never chooses arbitrary upstream URLs. The API filters to published/listed vacancies, searches title and description terms, checks location, caches feed responses for 10 minutes, and returns the employer's posting and application links.

- Endpoint: `GET /api/jobs?q=Backend%20Software%20Engineer&location=Dubai%2C%20UAE`
- Current board coverage is curated, not exhaustive. An empty result means no match was found in the boards currently configured; it does not prove there are no vacancies elsewhere.
- Listings are fetched directly from public employer boards using Ashby's documented public Job Postings API. Availability, role status and application requirements must be confirmed on the employer's own posting.

## Resume parsing and ATS checks

PDF text is reconstructed from its text-run coordinates so words in separate visual runs (for example a job title and right-aligned date) are separated correctly. The analysis response also returns document-readability checks for extracted text, contact details, standard sections, dates, layout and achievement bullets. These are practical diagnostics, not a score from any employer's ATS.
\n## Applying suggested CV edits\n\nThe app provides separate copy-ready fields for a professional summary, skills already detected in the resume, and existing work/project bullets to prioritise. It also lists unrecognised job-description terms for manual verification. Missing terms are not automatically written into the CV: only add them when supported by genuine skills or experience. The app does not generate or export a replacement resume file.\n