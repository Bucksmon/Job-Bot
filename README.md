# Job-Bot

A private Discord job-hunting assistant. It reads your resume, checks configured public employer career pages, filters jobs against your skills and preferences, and posts new matches to Discord.

The application runs as a Render background worker, so your computer does not need to stay on.

## Current features

- Upload a PDF or DOCX resume with `/set-resume`.
- Add public employer career pages with `/add-source`.
- Check a source's `robots.txt` rules and its crawl delay before browsing.
- Extract job postings from visible links and Schema.org `JobPosting` data.
- Score job title, resume skills, location and experience level.
- Avoid duplicate notifications using persistent job history.
- Search on demand with `/search` or automatically every six hours.
- Track applications you submit yourself with `/mark-applied`.

## Job-source rules

This project does not automate LinkedIn or Indeed pages, log into those services, bypass CAPTCHA/anti-bot checks, or submit applications on those sites. Their terms restrict automated scraping and automated applications.

Playwright is used only for public employer career pages that permit automated access. Before adding a source, confirm that its terms permit it. The crawler also checks `robots.txt`, respects crawl delays, stays on the original host, and stops when a site returns access-denied, rate-limit or human-verification responses.

A site's `robots.txt` file is not a substitute for its terms of use. The `/add-source` confirmation is an explicit operator check, not an automated legal review.

## Discord commands

- `/set-resume file:<PDF or DOCX>` — save your resume on the persistent disk.
- `/add-source url:<HTTPS career page> terms-confirmed:true` — add a permitted source.
- `/sources` — list configured sources.
- `/search` — run a search immediately.
- `/mark-applied url:<job URL>` — track an application you submitted.
- `/help` — list commands.

Only the Discord user configured as `ALLOWED_DISCORD_USER_ID` can control the bot. Matching job alerts are posted to `DISCORD_CHANNEL_ID`.

## Local development

Requirements: Node.js 22 or newer.

```bash
npm install
cp .env.example .env
```

Fill in the Discord values in `.env`, then run:

```bash
npm start
```

Run tests with:

```bash
npm test
```

## Render deployment

The repository includes a Render Blueprint for a Docker-based background worker in Frankfurt with a 1 GB persistent disk.

1. In Render, create a Blueprint using this repository and `render.yaml`.
2. Supply `DISCORD_BOT_TOKEN`, `DISCORD_CHANNEL_ID`, `DISCORD_GUILD_ID`, and `ALLOWED_DISCORD_USER_ID`.
3. Deploy the worker.
4. In Discord, run `/set-resume`, then add permitted employer career pages with `/add-source`.

The configured worker plan is `0.5c-512mb` ($7/month) and the 1 GB disk is approximately $0.25/month at current Render list pricing. Increase the worker plan if headless Chromium runs out of memory.

## Application assistance

Job alerts include the original posting link. This release tracks applications marked through `/mark-applied`; it does not automatically submit forms. Application automation is site-specific and must only be added for employers that explicitly permit it, with a review step before submission.

## Matching settings

Edit `PREFERRED_JOB_TITLES`, `JOB_LOCATION`, `MIN_MATCH_SCORE`, and `MAX_REQUIRED_YEARS` in the environment to tune relevance filtering.
