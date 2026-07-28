# Garden Watering Tracker — Project Context

## What it is
A shared watering log for a small garden group (Greenway57 Garden Society).
Members log daily watering, see who did it, and get email notifications automatically.

## Users
- A small group of gardener friends
- Most are **not tech-savvy** — the UI must stay simple and friction-free
- No login / authentication by design: security relies on the URL staying private
- There is nothing sensitive to steal, so this is an acceptable tradeoff

## Stack
- **Frontend:** Single HTML file (vanilla JS, no framework)
- **Backend:** Google Apps Script (`.gs`)
- **Database:** Google Sheet (one row per day)
- **Email:** Gmail API via Apps Script, HTML emails with a friendly display name
- **Config / secrets:** Apps Script Script Properties (`getEnv()` helper) — no hardcoded values

## Hosting & URL
- Hosted for free as a Google Apps Script Web App
- URL is shared via **Bitly** (free plan) for a friendlier link
- Bitly free plan limitations: cannot freely edit the short link alias
- **Goal:** find a free or near-free alternative for a clean, stable, editable short URL

## Constraints
- Must be **free or very low cost**
- Must remain simple to use for non-technical users
- No login screen
- Avoid any infrastructure that requires maintenance (servers, containers, etc.)

## Known limitations / rough edges
- One record per date: two gardeners cannot both log on the same day independently
- `doPost` in `code.gs` is dead code — the UI uses `google.script.run` directly
- No pagination — week navigation loads one week at a time
- Email list stored as a JSON string in Script Properties (slightly fragile)

## Potential improvements (backlog)
- Better / free short URL solution (see recommendations)
- ~~Allow multiple gardeners to log on the same day~~ ✅ done
- Light stats / streak view (how many days watered this month, who waters most)
- Plant or zone tracking (not just "the garden" but specific beds)

## Workflow Conventions
- Each new spec gets its own feature branch: `feature/<spec-name>`
- Branch from main before starting implementation tasks
- Merge back via PR when all tasks are complete

## Changelog
### 2026-07
- **Multiple gardeners per day:** `findRecordRow`, `addWateringRecord`, `deleteWateringRecord` now key on date + gardener name (case-insensitive). Two gardeners can each log independently on the same day; a second submission by the same gardener on the same day still updates their own record.
- **Week-at-a-glance strip:** A 7-day row (Sun–Sat) appears above the records list. Green + 💧 = watered that day, red + ❌ = logged but not watered, neutral dot = no entry yet, faded = future day.
- **Gardener name persistence:** Name is saved to `localStorage` on submit and restored on next visit. The form no longer clears the name after adding a record.
