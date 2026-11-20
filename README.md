# Job Filter

A small, local Node.js application that filters job listings against a resume and sends relevant matches to Discord.

## What it does

1. Reads a local PDF or DOCX resume.
2. Extracts technical skills using a small, editable keyword dictionary.
3. Scores job listings against preferred roles, skills, location and experience level.
4. Sends relevant, non-duplicate listings to one Discord channel (notification integration is a later milestone).

No resume builder, email integration, application automation, hosted dashboard or machine-learning training pipeline.

## Requirements

- Node.js 20 or newer
- A local PDF or DOCX resume
- A Discord bot token and channel ID (needed when Discord notifications are added)

## Setup

```bash
npm install
```

Copy `.env.example` to `.env`, then edit the search preferences. Place your resume at `data/resume.pdf`, or change `RESUME_PATH`.

Extract and preview the profile:

```bash
npm run profile
```

Run the matching tests:

```bash
npm test
```

## Job discovery and LinkedIn

LinkedIn does not provide a general public API for searching and exporting job listings. Its User Agreement also prohibits automated scraping/copying of its services. This project will not automate LinkedIn login sessions, scrape LinkedIn pages, or bypass access controls.

The discovery layer will be kept separate from the resume matcher so it can connect to an authorized job-data source. If an authorized LinkedIn integration becomes available, it can be added without changing the matching logic.

## Development status

- [x] Local PDF/DOCX text extraction
- [x] Basic skill profile extraction
- [x] Configurable role and location preferences
- [x] Rule-based relevance scoring
- [x] Initial matching tests
- [ ] Job discovery source
- [ ] Duplicate prevention
- [ ] Discord notifications
- [ ] Minimal local Search interface
