# Job Filter

A small, local Node.js application that checks job postings against your resume and sends relevant matches to Discord.

## Scope

This project intentionally focuses on three things:

1. Read a local PDF or DOCX resume and extract useful skills and job titles.
2. Discover publicly accessible job postings and filter out irrelevant results.
3. Send relevant, non-duplicate listings to one Discord channel.

There is no resume builder, application automation, email integration, hosted dashboard, or machine-learning training pipeline.

## Requirements

- Node.js 20 or newer
- A Discord bot token and a channel ID
- A local PDF or DOCX resume

## Setup

```bash
npm install
```

Copy `.env.example` to `.env`, then configure your Discord bot token and channel ID.

Place your resume at `data/resume.pdf` (or update `RESUME_PATH`).

## Development status

The repository is being built in small milestones. Job discovery will use accessible, permitted job-listing sources. The application will not automate LinkedIn login sessions or bypass access controls.

## Planned milestones

- [ ] Resume text extraction
- [ ] Basic skill and role profile extraction
- [ ] Job source adapter
- [ ] Simple relevance scoring
- [ ] SQLite duplicate prevention
- [ ] Discord notifications
- [ ] Local Search button / desktop interface
