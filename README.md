# Resume Match

A small resume and job-description matcher.

Upload a PDF or DOCX resume, paste a job description, review the keyword alignment, and export a tailored DOCX draft.

## Architecture

- **Frontend:** Plain HTML, CSS and JavaScript hosted on GitHub Pages.
- **Backend:** Node.js and Express hosted on Render.
- **Resume parsing:** `pdf-parse` and `mammoth`.
- **Document export:** `docx`.
- **Analysis:** Transparent keyword matching and resume evidence selection. No ML model or external AI API is required.

## What it does

1. Extracts text from a PDF or DOCX resume.
2. Finds recognised skills and terms in the job description.
3. Shows keyword overlap, missing terms, and resume evidence.
4. Creates a cautious professional-summary draft based only on the supplied resume.
5. Exports an editable DOCX draft while preserving the extracted original resume text.

The match percentage is an indicative keyword-alignment estimate. It is not a score from a specific ATS vendor and cannot guarantee that an application will pass an ATS.

The tool must never be used to add skills, qualifications, employers, achievements, or years of experience that are not true.

## Run locally

Requirements: Node.js 22 or newer.

```bash
npm install
cp .env.example .env
npm start
```

The API listens on port 10000 by default. For local frontend testing, use a static server to serve the `site` folder and configure `site/config.js` with:

```js
window.JOBBOT_API_BASE = "http://localhost:10000";
```

Run tests:

```bash
npm test
```

## Deploy the backend to Render

The root `render.yaml` defines a Node.js web service.

1. Create a Render Blueprint from this repository, or create a Web Service connected to this repository.
2. Use the repository root as the service root.
3. Build command: `npm install`
4. Start command: `npm start`
5. Health check path: `/api/health`
6. Set `FRONTEND_ORIGINS` to your GitHub Pages origin.

The free Render web-service plan can spin down after inactivity; the first request after a spin-down may take around a minute to wake the service. Upgrade the service plan to avoid this limitation.

## Deploy the frontend to GitHub Pages

1. Open **Settings → Pages** in the repository.
2. Set the publishing source to **GitHub Actions**.
3. Update `site/config.js` with the actual Render API URL.
4. Push to `main`; `.github/workflows/pages.yml` publishes the `site` folder.

For a private repository, GitHub Pages availability depends on the GitHub plan. If the Pages settings do not allow publishing, make the repository public or use a plan that supports Pages for private repositories.

## Privacy

Resume files are uploaded to the Render API for parsing in memory. The app does not write uploaded resumes or extracted resume text to disk or a database. The generated DOCX is returned directly to the browser. Do not upload a resume unless you are comfortable sending it to the configured backend.

The API has an 8 MB upload limit, CORS origin restrictions, and a per-IP request limit.
