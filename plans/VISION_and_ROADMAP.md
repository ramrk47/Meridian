# Meridian — Vision, Core Ideas & Roadmap

## The one-line concept
**An IMDB for exam prep** — a neutral, cross-platform hub where aspirants track what they've
studied across *every* source they use, see what's high-yield by consensus, rate and review the
content/tests, and discover what to do next. Not a content seller; a **meta-layer** that sits
above the content sellers.

## Why it can win
Every aspirant pays for 2–4 platforms (Marrow, PrepLadder, Cerebellum, DocTutorials, eGurukul,
DAMS…) and has **no single place** to see combined progress, dedupe overlapping topics, or judge
which platform's content is actually best for a given topic. Each platform deliberately locks you
in. Meridian is the Switzerland: it makes multi-source study coherent. The data we already hold
(both major QBanks, topic-level, with computed high-yield + cross-platform matching) is the moat.

## Core ideas (the pillars)
1. **Cross-platform tracking** — one progress state over the union of all platforms' topics.
2. **Consensus high-yield** — when independent platforms both rank a topic high, that's signal.
3. **The review/ratings layer (the real IMDB part)** — users rate tests & topics for difficulty,
   quality, and "worth it", aggregated into community scores. This is the social moat and the
   thing no single platform can credibly build (they can't rate competitors).
4. **Topic equivalence graph** — the same topic mapped across platforms (modules, videos, tests),
   so "I did Glaucoma on Marrow" surfaces the Cerebellum/DocTutorials equivalents and any video.
5. **Do-next intelligence** — gap analysis (untracked high-yield), weakest-subject routing from
   test scores, spaced-revision nudges.

## Vision arcs (near → far)
- **Now (v2, shipped):** 2 QBanks + CoreBTR tests + CoreBTR videos, tracking, high-yield engine,
  command palette, detail drawer, evening theme. Local-first, single user.
- **Next:** responsive + true mobile; multi-platform data (DocTutorials/PrepLadder/eGurukul);
  research-validated features; PHP backend on a notalonestudios.com subdomain.
- **Then (social):** accounts + login; community ratings/reviews of tests & topics; leaderboards;
  "which platform is best for X" aggregated verdicts; shareable progress.
- **Mobile app:** wrap the responsive web app (Capacitor/Tauri/PWA) — the mobile rework is
  designed to be portable to a shell with minimal change.
- **Compendium (the big bet):** generalize beyond medical PG to **UPSC, NEET UG, JEE, KCET**, and
  other streams. The data model is already exam-agnostic in shape (Exam → Platform → Subject →
  Topic → Item). One codebase, many exam "verticals"; the cross-platform + ratings layer is the
  same everywhere. Becomes a compendium hub for all streams of aspirants.

## Roadmap backlog (pre-research ranking — re-rank after RESEARCH_FINDINGS.md)
**P0 — foundational**
- Responsive layout rework + exquisite mobile view (see RESPONSIVE_MOBILE_REWORK.md). Current
  desktop space utilization is poor; no mobile view exists. Blocks everything else's usability.
- Multi-platform data model (Exam→Platform→Subject→Topic) so new platforms are data, not rewrites.

**P1 — high-leverage, IMDB-aligned**
- Community ratings/reviews scaffold (even local-first first): per-test and per-topic difficulty +
  quality + notes, designed to aggregate server-side later.
- Finish data integration of DocTutorials (have MCQ totals), PrepLadder, eGurukul (drill counts).
- "What to do next" dashboard: untracked high-yield by MCQ-at-risk, weakest subjects from scores.
- Spaced revision: surface topics marked Reviewed/Retaken N days ago as "due".

**P2 — depth & delight**
- Topic equivalence graph view (cross-platform map per subject).
- Study sessions / pomodoro + daily goal + streaks (continuity).
- Print/PDF revision broadsheet polish.
- Import/merge a friend's export (compare coverage).

**P3 — platform & scale**
- Accounts + PHP/DB backend; deploy to subdomain.
- Multi-exam verticals (UPSC/NEET-UG/JEE/KCET) behind an exam switcher.
- Mobile app shell.

## Guardrails / principles
- **Neutral & honest:** never fake counts; label inferred data; respect each platform's guardrails
  (we read public/own-account page content, never bypass protections or scrape behind paywalls).
- **Local-first always works** even when the backend is down.
- **Design stays editorial** — calm, premium, never gaudy.
- **Exam-agnostic core** — every new feature should make sense for a future UPSC/JEE vertical too.
