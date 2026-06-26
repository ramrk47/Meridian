# Data Integration Plan — new platforms + exam-agnostic model

## What's captured (raw, in `_raw/NewPlatforms/`)
- **DocTutorials** (`doctutorials_qbank_raw.txt`) — 19 subjects with **chapter + MCQ totals**
  (complete enough to integrate now). e.g. Medicine 68 ch / 1464 MCQs, Anatomy 47 / 714.
- **PrepLadder** (`prepladder_qbank_raw.txt`) — 19 subjects with **module counts** grouped by Prof
  (no MCQ totals on overview; free-plan account). Needs per-subject drill for MCQ counts.
- **eGurukul** (`egurukul_qbank_raw.txt`) — 19 subjects + sample topic structure (Anatomy = 10
  topics). No counts on overview; per-topic question counts exist on drill.

### Pending pulls (next Chrome session, logged in)
- PrepLadder: open each subject → read MCQ totals per module/chapter.
- eGurukul: open each subject → `Topics(N)` + per-topic question counts (the free-QB cards show
  `0/N Questions`, so counts are reachable).
- DocTutorials: also grab the **QRP** and **PYQs** sub-tabs, and optionally topic-level per subject.
- Be disciplined: subject-level first (cheap, high value); topic-level is a second pass.
- Respect guardrails: read rendered page content from the user's own logged-in account only; no
  protection bypass, no paywalled scraping.

## Generalize the data model (exam-agnostic — sets up the multi-exam compendium)
Today `data.js` has `marrow`, `cerebellum`, `corebtr`, `videos` as bespoke keys. Refactor toward:

```
D = {
  exam: "NEET PG / INI-CET",            // future: switch verticals (UPSC, NEET-UG, JEE, KCET)
  platforms: [
    { id:"marrow", name:"Marrow", kind:"qbank", subjects:[ {subject, modules:[{id,category,name,mcqs,rating,priority,hyScore}]} ] },
    { id:"cerebellum", ... }, { id:"doctutorials", ... }, { id:"prepladder", ... }, { id:"egurukul", ... },
  ],
  tests: [...], videos: [...],          // already source-tagged; keep
}
```
- Keep stable `id`s and the `priority`/`hyScore` engine; compute hyScore per platform where MCQ
  counts exist, else fall back to a neutral tier (don't fake high-yield from missing data).
- The app's `LEAVES` index, `canon()` subject map, cross-platform matcher, palette, and drawer are
  already platform-generic in spirit — point them at `D.platforms` instead of hardcoded keys.
- **UI:** the QBank platform toggle becomes an N-way platform switch (segmented or dropdown when >3).
  Subject sidebar + tree are unchanged. Cross-bank "seen on other platform" + consensus generalize
  from 2 → N platforms (consensus = high on ≥2 independent platforms).

## Subject-name canonicalization (extend `CANON` in app.js)
New aliases seen in the captures — fold into the canon map:
- DocTutorials: `OB & G` → Obstetrics & Gynaecology; `PSM` → Community Medicine / PSM.
- PrepLadder: `Gynaecology & Obstetrics` → Obstetrics & Gynaecology; `PSM`, prof groupings ignored for canon.
- eGurukul: `OBG` → Obstetrics & Gynaecology; Video layer splits Micro (Organism/System) & Medicine
  (2 faculty) — QBank does not, so no canon change needed there.
All five platforms use the same 19-subject spine → cross-platform mapping is clean.

## Build steps
1. Extend `build_data.py` to parse `_raw/NewPlatforms/*` into the `platforms[]` shape (start with
   DocTutorials' MCQ totals; add PrepLadder/eGurukul once drilled).
2. Migrate `app.js` from `D.marrow`/`D.cerebellum` reads to iterate `D.platforms` (keep a back-compat
   shim during the transition).
3. Update the QBank/High-Yield/Progress views to N platforms; verify totals and consensus.
4. Regenerate, verify in preview, commit, push.

## Sanity numbers to preserve
- Marrow 21,915 MCQs, Cerebellum 20,974 (combined 42,889) — must not change.
- DocTutorials total MCQs ≈ sum of the captured per-subject totals (compute on integration).
