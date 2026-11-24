# Resume Match

A small resume and job-description matcher.

Upload a PDF, DOCX, or legacy DOC resume, paste a job description, review the keyword alignment, and export a tailored DOCX draft.

## Architecture

- **Frontend:** Plain HTML, CSS and JavaScript hosted on GitHub Pages.
- **Backend:** Node.js and Express hosted on Render.
- **Resume parsing:** `pdf-parse`, `mammoth`, and `word-extractor`.
- **Document export:** `docx`.
- **Analysis:** Transparent keyword matching and resume evidence selection. No ML model or external AI API is required.

## What it does

1. Extracts text from PDF, modern Word DOCX, and legacy Word DOC resumes.
2. Finds recognised skills and terms in the job description.
3. Shows keyword overlap, missing terms, and resume evidence.
4. Creates an editable professional-summary draft based only on the supplied resume.
5. Exports a structured, editable CV with a professional summary, key skills, and the original experience, project, education, and certification sections that could be identified.

The match percentage is an indicative keyword-alignment estimate. It is not a score from a specific ATS vendor and cannot guarantee that an application will pass an ATS.

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

Resume files are uploaded to the Render API for parsing in memory. The app does not write uploaded resumes or extracted resume text to disk or a database. The generated DOCX is returned directly to the browser. Do not upload a resume unless you are comfortable sending it to the configured backend.

The API has an 8 MB upload limit, CORS origin restrictions, and a per-IP request limit.
