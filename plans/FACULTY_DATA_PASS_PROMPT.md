# Builder prompt — Faculty data-gathering pass (enrich the faculty layer)

> A **data-acquisition** session (Chrome MCP + web research), greenlit 2026-06-27. Goal: gather a real
> faculty dataset — rosters, **platform-movement history**, and public/video ratings — to enrich the
> seed from `PHASE1C1F_PROMPT.md`. Output is a **curated raw file**, not app code. Needs the user's
> **logged-in Chrome** for own-account/public platform pages.

## Guardrails (hard — same as all Meridian data pulls)
- **Public or the user's own logged-in account only.** No paywall bypass, no protection circumvention,
  no scraping behind logins that aren't the user's. Respect each platform's terms.
- **Never fabricate.** Every faculty, affiliation, date, and rating must trace to a URL/source you record.
  Unknown ⇒ leave blank. Tag reputation/sentiment `directional`; app-store/3p figures `public-3p` + date.
- **Be disciplined / cheap first:** roster + current platform + subjects (high value) before deep history.

## Gather (per faculty, into `_raw/curated/faculty_roster.csv` + a sources list)
1. **Roster & subjects** — from each platform's public faculty/educator pages: name, subject(s), current
   platform, role. Start with the 5 tracked platforms (Marrow, Cerebellum, DocTutorials, PrepLadder, eGurukul).
2. **Movement history** — where a faculty previously taught / has gone **solo** or into **super-specialty**
   coaching: prior platform(s) + approximate from/to years. Sources: public bios, announcements, YouTube/
   Telegram/Quora/Reddit mentions, news. Record the source per claim; approximate dates flagged as such.
3. **Ratings signals** — (a) any public rating of the faculty (directional, sourced); (b) the platform's
   **app-store rating** they're associated with (already in `RESEARCH_FINDINGS.md` scorecard — reuse it),
   as the `videoByPlatform` proxy until real per-video ratings exist.
4. **Aliases** (`aka`) students use to search.

## Output format
- `_raw/curated/faculty_roster.csv` — columns: `name, aka, subjects, platform, role, status(current|past|
  solo|superspecialty), from, to, profile_rating, profile_rating_source, notes, source_url, capture_date`.
- A short `_raw/curated/faculty_sources.md` listing every source URL + what it backs.
- Keep rows atomic (one affiliation per row) so `build_data.py` can fold them into `D.faculty[].affiliations`.

## Hand-off (do NOT build the app here)
- Commit the raw files; `git push origin main`. Update `PROGRESS.md` data inventory + a decision-log line.
- **Report to coordinator:** how many faculty / affiliations gathered, coverage gaps, lowest-confidence
  rows, anything that needs a judgment call. A later build folds this into `D.faculty[]` (zero UI churn —
  the faculty surface from 1c.1F already renders the schema).

## Model / reasoning
**Sonnet 4.6, medium reasoning** — gathering/extraction with strict sourcing; high volume, low logic.
Escalate to Opus only for ambiguous movement-history judgment calls. (Coordinator verifies sourcing after.)

> NOTE: this pass needs the user present with a logged-in browser. Confirm the user is ready before starting.
