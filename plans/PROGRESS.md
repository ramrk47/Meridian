# Meridian — PROGRESS (living source of truth)

> The **coordinator session** owns this file. Update it every working session: tick milestones,
> append to the decisions log, keep the data inventory current. Read it (and `git log`) FIRST.
> Last updated: 2026-06-26.

## Status snapshot
- **Shipped (v2):** Marrow + Cerebellum QBanks (42,889 MCQs), CoreBTR tests + 178 topic videos.
  3-level QBank tracker (sidebar + sticky controls + collapsible tree + sort/filter), high-yield
  engine + consensus, command palette, detail drawer, progress/coverage, test scoring + per-subject
  accuracy, evening theme, j/k keyboard, PWA-ready storage adapter. 25 review findings fixed.
- **Repo:** `~/Meridian`, git → `git@github.com:ramrk47/Meridian.git` (branch `main`, SSH; gh token invalid).
- **Market research:** DONE — see `RESEARCH_FINDINGS.md` (H1/H2/H3/H6 confirmed; H4/H5 partial).
- **Now blocking:** poor space utilization + no real mobile view; 5-platform data captured but not integrated.

## Data inventory (`_raw/NewPlatforms/`) — captured, NOT yet integrated
| File | Rows | Level | Notes |
|------|-----:|-------|-------|
| `doctutorials_subjects.csv` | 57 | subject×{Main,QRP,PYQ} | `section,subject,chapters,total_mcqs` |
| `doctutorials_chapters.csv` | 1311 | chapter | `section,subject,chapter,mcq_count` |
| `egurukul_topics.csv` | 1282 | topic | `subject,topic,question_count` |
| `egurukul_other.csv` | 1809 | topic | PYQ/Express sections: `section,subject,topic,question_count` |
| `prepladder_modules.csv` | 1115 | module | `prof,subject,module,mcq_count` |
| `prepladder_pyq.csv` | 361 | topic/year | `subject,topic_or_year,question_count` |
| `prepladder_subject_totals.csv` | 19 | subject | `prof,subject,total_modules` |
- ⚠️ **Dedup needed:** duplicate `… (1).csv` / `… (2).csv` copies exist — pick canonical, delete rest.
- ⚠️ **Verify DocTutorials Main vs PYQ** — they showed identical subject totals in the spot-check;
  confirm against `doctutorials_chapters.csv` whether PYQ is distinct or a duplicate of Main.
- Full-page HTML saves (`*.html` + `*_files/`) are also present as a fallback source — big; consider
  `.gitignore`-ing them rather than committing.

## Milestone board
### P0 — foundation (do first)
- [ ] **Responsive + mobile-first rebuild** (`RESPONSIVE_MOBILE_REWORK.md`): fluid container,
      container queries, bottom-nav, drawer→bottom-sheet, tables→cards, PWA manifest+SW. Test at
      320/375/414/768/1024/1440. **Validated by H5.**
- [ ] **Multi-platform data model** (`DATA_INTEGRATION.md`): exam-agnostic `D.platforms[]`; ingest the
      5 platforms; N-way platform switch; generalize cross-platform "seen"/consensus from 2→N. **H1.**
### P1 — research-validated features
- [ ] **Spaced revision / review queue** — surface Reviewed/Retaken items due for re-review; a
      mistake/review inbox. *Top pain (H2, CONFIRMED High).*
- [ ] **"Best platform per subject" + ratings scaffold** — encode the subject/faculty strength map
      (Marrow: Surg/ENT/Ophtho/Patho/OBG; PrepLadder: Anat/Pharma/Med/Ortho/Derma) + per-test/topic
      community-rating data shape (local now, aggregate later). *H3 + the IMDB wedge.*
- [ ] **Weak-area routing / comparable analytics** — from test scores → "what to revise next",
      cross-platform-comparable, deep-linked into the bank. *H4.*
### P2 — scale
- [ ] Accounts + PHP/DB backend; deploy to notalonestudios.com subdomain.
- [ ] Multi-exam verticals (UPSC, NEET-UG, JEE, KCET) behind an exam switcher.
- [ ] Mobile app shell (Capacitor/PWA install).

## Decisions log
- 2026-06-26 Moved repo Downloads → `~/Meridian`. Market research done (web-harvest; Reddit via DDG
  snippets, IG/TG not accessible). Data for DocTutorials/PrepLadder/eGurukul captured to detail.
- (append new decisions here, newest first)

## Open questions for the user
- Confirm the "next 5 features" ordering before any large build.
- DocTutorials/PrepLadder show on a free/limited account — are MCQ totals the full paid catalog?
