# Market Research Plan — what aspirants actually want

Goal: harvest **real, cited** pain points, feature requests, and praise from NEET PG / INI-CET /
FMGE aspirants about the prep platforms, then turn them into a ranked, deduplicated backlog
(`plans/RESEARCH_FINDINGS.md`). Bias toward *recurring* complaints and *unmet* needs that a neutral
cross-platform hub uniquely solves.

## Method
Prefer the **`deep-research` skill** (fan-out search → fetch → verify → cited synthesis). Where it
can't reach a source, fall back to `WebSearch` + `WebFetch`. For login-walled or app-only sources
(Telegram, in-app), note them as "not directly accessible" and substitute public proxies
(Reddit/YouTube/Quora threads that quote them). Never fabricate quotes — every finding gets a URL.

## Where to look (and how)
### Reddit (richest, most accessible)
- Subreddits: **r/MedicalPG, r/Indian_Medicine, r/medicalschoolindia, r/NEETMD, r/MBBS,
  r/india** (exam threads), r/medicine occasionally.
- Search patterns (run several): `Marrow vs PrepLadder`, `Cerebellum review`, `DAMS vs Marrow`,
  `best qbank NEET PG`, `<platform> not worth it`, `<platform> bugs`, `qbank tracker`,
  `how to track revision`, `spaced repetition NEET PG`, `<platform> app crash / offline`.
- For each strong thread: capture the specific complaint/praise + permalink + rough upvotes.

### Instagram
- It's hard to read without login; use WebSearch for **public post/reel captions & comment
  roundups** and creator pages: search `site:instagram.com Marrow NEET PG`, plus creator handles
  (Marrow, PrepLadder, Cerebellum, DBMCI/eGurukul, DocTutorials official + popular educator
  accounts). Capture themes from captions/comments that surface in search results.
- Look for: feature complaints, "wish the app could…", comparison polls, price gripes.

### Telegram (likely not directly accessible)
- Many groups are private/app-only. Try WebSearch for **t.me public group links & web previews**
  (`t.me NEET PG qbank`, `<platform> telegram group`). If unreachable, say so and rely on
  Reddit/YouTube quotes that reference Telegram sentiment. Do NOT attempt to bypass login.

### YouTube (good proxy for sentiment)
- Comments on "Marrow vs PrepLadder", "best QBank", platform review videos. WebFetch the video
  page / search for comment summaries.

### App stores & review sites
- Google Play / App Store reviews for Marrow, PrepLadder, Cerebellum, eGurukul, DocTutorials —
  WebSearch `<app> play store reviews complaints`. Star-rating trends + recurring 1–2★ themes are gold.

## What to extract (schema for each finding)
```
- source: reddit|instagram|youtube|appstore|telegram-proxy|blog
- url: <permalink>
- platform(s): which prep app(s) it's about (or "general")
- type: pain_point | feature_request | praise | pricing | reliability
- quote: short verbatim (<15 words) or tight paraphrase
- frequency_signal: upvotes / how often the theme recurs
- meridian_hook: which existing Meridian feature it validates, or a NEW idea it implies
```

## Synthesis → RESEARCH_FINDINGS.md
1. Cluster findings into themes (e.g. "no cross-platform tracking", "revision/spaced-repetition
   missing", "app slow/offline", "want difficulty ratings", "price/lock-in", "test analytics weak").
2. Rank themes by (frequency × strategic fit to the IMDB/cross-platform thesis).
3. For each top theme: 1-line problem, who feels it, and the Meridian feature (existing or new) that
   answers it, with effort estimate.
4. End with a **"Next 5 features"** recommendation + acceptance criteria; feed back into VISION_and_ROADMAP.md.

## Known hypotheses to validate or kill (from building so far)
- Aspirants juggle multiple platforms and have no unified tracker → **cross-platform tracking** (core).
- Revision/retention is the weak point of all apps → **spaced revision + Reviewed/Retaken nudges**.
- People argue endlessly "which platform is better for X" → **community ratings / consensus** is the wedge.
- Test analytics are shallow → **per-subject accuracy + weakest-subject routing**.
- Mobile usage dominates; web trackers are desktop-only → **mobile-first** is non-negotiable.
- Price/lock-in resentment → a neutral free meta-layer has goodwill + viral potential.

Confirm or refute each against real findings; don't ship features on hypotheses alone.
