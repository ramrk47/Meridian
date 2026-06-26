# Meridian — Cross-platform exam almanac

A local-first **tracking + review hub** across Marrow, Cerebellum, and CoreBTR — an
"IMDB of medical exams" for NEET PG / INI-CET aspirants. Built from data extracted from each
platform (captured 26 Jun 2026). Runs offline; deploys to a subdomain when you want it live.

> **Design:** a warm editorial "almanac" — paper + ink, a serif display face, hairline rules and
> muted clinical colours instead of neon. Calm and considered for long study sessions; an
> **evening edition** dark theme for late nights. *"Meridian" is a placeholder name (serif "M"
> monogram, top-left) — rename it freely in `index.html`, e.g. as a NotAloneStudios sub-brand.*

## Open it
- **Now:** double-click `index.html` — works in any browser, offline, no server.
- Or `Open Dashboard.command` (macOS) to launch in your default browser.
- **Live on a subdomain:** see `DEPLOY.md`.

## What you can do
| Tab | What it does |
|-----|--------------|
| **Overview** | Combined 42,889-MCQ landscape, live progress %, *Continue where you left off*, *Next best moves* (untracked high-yield), Marrow-vs-Cerebellum bars |
| **QBank Tracker** | A workspace: **subject sidebar** + sticky controls + a **3-level collapsible tree** (Subject → Category → Modules) with completion meters, **expand/collapse-all**, and bulk "✓ all". Tick **Attempted / Reviewed / Retaken**; **sort** (high-yield, MCQs, rating/difficulty, A–Z, least-attempted, least-complete) and **filter** (yet-to-attempt, attempted, needs-review, mastered, starred, high-difficulty). Cross-bank "seen on the other platform" badges. |
| **Progress** | Combined coverage per subject (with a *lopsided* flag), plus per-platform tables |
| **Tests & Scores** | Enter right/wrong → auto-accuracy, **rate difficulty**, **add your own GTs**, a *weakest-subjects* table inferred from your scores, dated Cerebellum 2026 calendar |
| **High-Yield** | Scores & **stars the important topics across both platforms**, a **consensus** list (★★★ on both banks), and status filters |
| **Videos** | Your **CoreBTR lecture set, cut topic-by-topic** (178 clips, ~97h). Mark **Watched / Revised**; each clip is wired to the **question-bank modules it covers** + related tests. Source-agnostic — future video sets drop in the same way. |
| **Study Planner** | Subjects tiered by exam weight + weekly rhythm template |

**Navigation:** ⌘K / Ctrl-K universal command palette (subjects, modules, units, tests, videos, actions);
press `1–7` to switch tabs; `j/k` + `a/r/t/s` to track without the mouse; click any topic for a
**detail drawer** linking it to the other platform, sibling modules, tests, and CoreBTR videos.

Everything you tick/score saves on the device (`localStorage`). **Export** = JSON backup;
**Import** = restore; **Reset** = clear your tracking (the source data stays).

## The video layer (and adding more later)
- `_raw/CoreBTR_Videos/Topic Video Cut Report.md` → parsed by `build_data.py` into `D.videos`
  (`{id, source, subject, topic, durMin, confidence, file}`).
- **Module-suggestion logic is baked in** (`videoSuggestions` / `videosForLeaf` in `app.js`): a video
  topic is matched to QBank modules/units across both banks by token + normalized-substring similarity,
  nudged toward the video's subject. Completion artifacts (`Watched` / `Revised`) live in `Store.state.videos`.
- To add another source (e.g. Marrow/Cerebellum videos): append items to the `videos` array with a
  `source` field and rebuild — the Videos tab, drawer, palette, and suggestion engine pick them up automatically.

## How the high-yield stars are computed
- **Marrow:** `0.55 × (star-rating, normalised) + 0.45 × (MCQ share within subject)`
- **Cerebellum:** `0.55 × (MCQ share) + 0.45 × (questions-per-module density)`
- ★★★ = top tier (score ≥ 0.70), ★★ = medium (≥ 0.45). PYQ papers are excluded from high-yield.
  Where both platforms star the same topic, it's *consensus* high-yield — doubly worth your reps.

## The numbers (verified against each platform's dashboard)
- Marrow QBank: **21,915** MCQs / 1,158 modules (incl. 5,738 PYQ)
- Cerebellum QBank: **20,974** MCQs / 1,245 modules · **Combined: 42,889 MCQs**
- Tests: Marrow 97 · Cerebellum 106 GTs + ~400 E&Ds · CoreBTR 28 · **CoreBTR videos: 178 clips (~97h)**

## Architecture (why it's server-ready)
- **Content vs. user-state are separate.** `data.js` = source data (read-only). Your tracking lives in a
  separate state object via a **storage adapter** (`storage.js`).
- Two backends: `local` (now) and `server` (PHP API in `server/`). Flip one flag.
- All state is keyed by `APP_CONFIG.profile` (`"me"` today) — the seam for real accounts later.
- Difficulty ratings, test scores, and video states are ready to aggregate into community signals (the social layer).

## Files
- `index.html`, `styles.css`, `app.js` — the app · `storage.js` — storage adapter
- `data.js` — embedded source data with stable IDs + high-yield scores + videos (generated)
- `build_data.py` — regenerates `data.js` from `_raw/`
- `server/` — PHP API (`api.php`), config sample, `.htaccess` — see `DEPLOY.md`
- `_raw/` — original extracted CSVs/text by platform, incl. `_raw/CoreBTR_Videos/` manifests

## Refresh the data later
Drop new CSVs/manifests into `_raw/…` (same columns) and run `python3 build_data.py`.
