# Meridian — Research Findings (aspirant sentiment → ranked backlog)

> Source-of-truth for re-ranking [VISION_and_ROADMAP.md](VISION_and_ROADMAP.md). Generated from a
> fan-out web harvest (Reddit, app stores, Quora, comparison blogs) on **2026-06-26**, executed per
> [MARKET_RESEARCH_PLAN.md](MARKET_RESEARCH_PLAN.md). Every finding carries a URL. No quotes were
> fabricated.

## Method & honest caveats
- **What ran:** 5 parallel search agents (the `deep-research` skill's own structured-output step
  crashed, so we fell back to `WebSearch` + `WebFetch`, which the plan explicitly allows) covering:
  Reddit comparisons, Reddit tracking/revision, app-store reviews, YouTube/Quora, and pricing/analytics.
- **Reddit access:** `reddit.com` and most engines **blocked direct fetch**. Reddit quotes were
  recovered from **DuckDuckGo HTML result snippets** — the permalinks are real and resolvable, the
  snippet text is verbatim-as-indexed, but **live upvote/comment counts were not retrievable**.
  Frequency is therefore reported as *recurrence / thread-genre*, not vote totals. Treat Reddit
  signals as **directional, not quantified**.
- **App stores:** iOS India App Store pages fetched directly — **star ratings are solid**.
- **Quora:** question pages return 403; Quora quotes are from search snippets (flagged inline).
- **Blogs:** comparison/SEO blogs (crackneetpg, medicotopics, learnmedx) are **secondary** —
  used for corroboration only, downweighted vs. primary user voice. One blog (`crackneetpg`) is
  SEO content of uncertain authority; its claims are flagged `[blog-only]`.
- **Instagram / Telegram:** login-walled, **not directly accessible** — substituted by Reddit/Quora
  proxies as planned. No IG/TG quotes are claimed.
- **Bottom line:** strong qualitative signal, weak quantitative signal. Good enough to **rank
  themes and kill/confirm hypotheses**; not good enough to size markets. A future pass with
  authenticated Reddit API access would harden the frequency numbers.

---

## Hypothesis verdicts

| # | Hypothesis | Verdict | Confidence |
|---|-----------|---------|-----------|
| 1 | No unified cross-platform tracker | **CONFIRMED** | High |
| 2 | Revision / spaced-rep is the weak point of all apps | **CONFIRMED** | High |
| 3 | Endless "which platform is better for X" debates | **CONFIRMED** | High |
| 4 | Test/QBank analytics are shallow | **PARTIALLY CONFIRMED** | Med-High |
| 5 | Mobile usage dominates; desktop-only trackers lose | **PARTIALLY CONFIRMED** | Medium |
| 6 | Price/lock-in resentment → goodwill for a neutral free layer | **CONFIRMED** (resentment); goodwill is **inferred** | Med-High |

### H1 — No unified cross-platform tracker → **CONFIRMED**
Aspirants explicitly ask for an external tool and build their own when none exists.
- *"Suggestions for any app/website/program/Excel sheet"* to track **Custom Modules, Qbank, GTs** —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/100ojxg/suggestions_for_any_appwebsiteprogramexcel_sheet/) (explicit demand)
- DIY QBank-tracking spreadsheets with formulas shared as a workaround —
  [r/medicalschoolanki](https://www.reddit.com/r/medicalschoolanki/comments/nscjiu/step_2_level_2_ome_anking_qbank_spreadsheet/)
- Toppers self-assemble a multi-platform stack: *"solving only the qbank from marrow + dams notes and got 1k rank"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/vi38pn/pre_pg_vs_marrowprepladder_qbank/) ·
  *"PrepLadder rapid revision … along with marrow qbank (taking notes from it)"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/vgcspa/prepladder_rapid_revision_with_marrow_qbank/)
- Mistake-notebook habit because no platform surfaces a review queue —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/14rcwn2/can_i_score_good_in_neet_pg_just_by_q_bank/)

### H2 — Revision / spaced-rep is weak → **CONFIRMED**
Retention is named as *the* central pain, and serious students leave the platforms for Anki to fix it.
- *"Revision has always been the biggest headache for me in MBBS"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1dae6dj/score_95th_percentile_with_mangomedic_anki_deck/)
- *"The greatest mistake I was making was thinking qbank was a revision tool and not a learning tool"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1bgpkte/how_to_improve_qbank_score_marrow/)
- *"remaining subjects are a little out of memory"* / *"importance of the last 10 days of revision"* —
  [crux thread](https://www.reddit.com/r/indianmedschool/comments/11s5n1c/crux_for_neet_pg_preparation/) ·
  [hard-lessons thread](https://www.reddit.com/r/indianmedschool/comments/12188a2/what_hard_lessons_did_you_learn_after_neet_pg/)
- *"Marrow revision videos take too long to watch"* — revision is video-bound, not spaced —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/17srqgq/)
- Migration to external Anki decks specifically *to solve revision* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1dae6dj/score_95th_percentile_with_mangomedic_anki_deck/)

### H3 — "Which platform is better for X" debates → **CONFIRMED**
r/indianmedschool is saturated with near-identical comparison threads; **no consensus winner** —
recommendations fracture **subject-by-subject and faculty-by-faculty**, which is precisely the gap a
ratings/consensus layer fills.
- *"I'm so confused between prepladder or marrow or cerebellum?"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1cg1kdn/im_so_confused_between_prepladder_or_marrow_or/)
- *"Help me chose among prepladder, marrow, dams (emedicoz), eGurukul"* (4-way paralysis) —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/uws1o5/help_me_chose_among_prepladder_marrow/)
- *"Which faculties are better for each subject from Marrow and PrepLadder"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/sbicf2/which_faculties_are_better_for_each_subject_from/)
- Subject split recurs across blogs/Quora: Marrow stronger in Surgery/ENT/Ophtho/Patho/OBG;
  PrepLadder stronger in Anatomy/Pharma/Medicine/Ortho/Derma —
  [medicotopics](https://medicotopics.com/marrow-or-prepladder/) `[blog]`,
  [Quora](https://www.quora.com/Which-question-bank-of-PrepLadder-or-of-Marrow-is-best-for-the-NEET-PG) `[snippet]`
- *"Should I buy all the [platforms]?"* — owning multiple overlapping subs is normal —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1c0efno/should_i_buy_all_the/)

### H4 — Shallow analytics → **PARTIALLY CONFIRMED**
The gap is real but **nuanced**: within-platform analytics (esp. Marrow's percentile prediction) are
sometimes *praised*; the pain is (a) **cross-platform scores aren't comparable** and (b) **no
actionable "where am I weak / what next" routing**.
- Distrust of GT scores: PrepLadder GTs seen as inflated — *"got ~130 (90%ile)… are they intentionally easy?"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1cf1uq4/are_prepladder_gt_reliable/) ·
  *"I don't wanna have a false sense of where I stand"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1bhtgc0/prepladder_gts/)
- Can't translate score to reality: *"87 percentile… I don't know where I'm going wrong"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1d8s2li/)
- QBank % explicitly dismissed as non-diagnostic: *"Qbanks are learning tools, not self-assessment tools"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1bgpkte/how_to_improve_qbank_score_marrow/)
- **Counter-evidence (keeps this from being fully CONFIRMED):** Marrow's percentile prediction
  praised as *"fairly accurate in recent years"* — [crackneetpg](https://www.crackneetpg.com/2026/05/21/marrow-vs-prepladder-which-is-better-for-neet-pg-in-2024-honest-comparison/) `[blog-only]`.
  So the wedge is **cross-platform comparability + weak-area routing**, not "analytics are bad."

### H5 — Mobile-first → **PARTIALLY CONFIRMED**
Confirmed that **mobile is the primary surface and reliability differentiates** (lower-rated apps
are dragged down by crashes/buffering). **Not** directly confirmed that "desktop-only trackers lose"
— that pain wasn't voiced; it's an inference. The actionable takeaway: Meridian **must** be
mobile-first because the incumbents already are.
- App-store reliability themes cluster in lower-rated apps (see table below): PrepLadder *"videos
  automatically stop… playback speed resets to 1x"*
  ([iOS](https://apps.apple.com/in/app/prepladder/id1622337839)); Cerebellum *"frequently freezes or
  crashes"* ([iOS](https://apps.apple.com/in/app/cerebellum-neet-pg-inicet-fmge/id1662462131));
  eGurukul *"video playback is really buggy"*
  ([iOS](https://apps.apple.com/in/app/egurukul-elearning-by-dbmci/id1491444366)).
- Marrow is tablet/phone-centric (weak desktop story): *"the tab crashed today and refuses to turn on"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/yly9yy/marrow_and_laptops/)
- Cerebellum reviewers want modern mobile UX: *"absence of PiP mode is a glaring omission… interface stuck in 2015"* —
  [iOS](https://apps.apple.com/in/app/cerebellum-neet-pg-inicet-fmge/id1662462131)

### H6 — Price/lock-in resentment → **CONFIRMED** (goodwill is inferred, not measured)
Resentment is well-documented. **Goodwill toward a neutral free layer is plausible but unproven** —
no finding directly says "I'd love a free neutral hub"; that's our bet, not a measured fact.
- Validity expiry is its own posting genre — subscriptions lapse days before the exam, students beg
  for extension codes: *"My marrow subscription ends 15 days bfr inicet"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1b6vgg9/marrow_extension_code_for_anyone_who_wants_15_days/) ·
  [expiry post](https://www.reddit.com/r/indianmedschool/comments/1cf13mn/marrow_expiring/)
- Buyer's remorse: *"DON'T BUY PREPLADDER. It's the worst platform…"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1ip3l1i/dont_buy_prepladder/)
- *"As it is expensive should I consider other options?"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/1799kug/marrow/);
  price drives piracy: PrepLadder *"is easily available on internet"* —
  [r/indianmedschool](https://www.reddit.com/r/indianmedschool/comments/12i6c9m/marrow_or_prepladder/)
- Hard lock-in: DBMCI **force-migrated** all pre-v4.0 NEET PG/FMGE lectures off eGurukul into the
  DBMCI One app (deadline 31 Jan 2026) — [DBMCI blog](https://blog.dbmci.com/neet-pg-and-fmge-videos-transition-to-dbmci-one/);
  eGurukul *"plan showed as expired after just 3 months… looting money"* —
  [Play](https://play.google.com/store/apps/details?id=com.egurukulapp);
  Marrow *"limitation of number of times a video can be viewed is unacceptable"* —
  [iOS](https://apps.apple.com/in/app/marrow-for-neet-pg-next/id1226886654);
  DocTutorials blocks screenshots: *"even screenshot is not allowed… we have to keep clicking photos"* —
  [iOS](https://apps.apple.com/in/app/doctutorials-neet-pg-ss-fmge/id1475350376)

---

## App-store reliability scorecard (iOS India, fetched 2026-06-26)
A useful **neutral data point Meridian can surface** — incumbents can't credibly rate each other.

| App | Rating | ~Ratings | Recurring 1–2★ themes |
|-----|--------|----------|------------------------|
| **Marrow** | ~4.7★ | 33k | pricing, price hikes, video view-count caps |
| **PrepLadder** | 4.4★ | 21k | buffering, playback resets to 1×, "other device login" logouts |
| **DocTutorials** | 4.2★ | 1.7k | stuck loading screen after updates, screenshot blocking, "buy again" bug |
| **Cerebellum** | 3.7★ | 3.4k | freezes/crashes, dated UI, no PiP, no dark mode |
| **eGurukul (DBMCI)** | 3.0★ | 2.3k | buggy playback, auto-logout on close, validity-expired-early "fraud" |

> Marrow is the quality benchmark; its complaints are about *price/access caps*, not stability.
> Everyone below it bleeds stars on *reliability*. (Source URLs in H5/H6 above.)

---

## Ranked themes (frequency × strategic fit to the cross-platform thesis)

### 1. Platform fragmentation → no single source of truth `[H1+H3]` — **TOP**
- **Problem:** Aspirants own/juggle 2–4 overlapping platforms, argue endlessly which is best for
  each subject, and have nowhere to see combined progress.
- **Who:** essentially everyone serious; the dominant genre of subreddit posts.
- **Meridian feature:** **Cross-platform tracking** (Pillar 1, *shipped*) + **consensus high-yield**
  (Pillar 2) — the union-of-platforms progress state is the core wedge. This is Meridian's reason to exist.
- **Effort:** Core already exists; harden multi-platform data model (P0). **M**.

### 2. Revision / retention has no system `[H2]`
- **Problem:** No platform offers spaced revision; students forget subjects, copy notes by hand, or
  defect to Anki.
- **Who:** every long-horizon aspirant; named as "the biggest headache."
- **Meridian feature:** **Spaced revision + Reviewed/Retaken "due" nudges** (Pillar 5 / roadmap P1).
  A review queue over the *union* of platforms is something no single seller can build.
- **Effort:** **M** — surface topics marked Reviewed/Retaken N days ago as due; needs date tracking + a queue view.

### 3. "Which is better for X" → community ratings wedge `[H3+H4]`
- **Problem:** Subject-by-subject, faculty-by-faculty disputes with no neutral arbiter.
- **Who:** all comparison-shoppers and switchers.
- **Meridian feature:** **The review/ratings layer** (Pillar 3, the real "IMDB part") — per-topic /
  per-test / per-faculty difficulty + quality + "worth it," aggregated. *Plus* a neutral **per-app
  reliability rating** seeded from the scorecard above.
- **Effort:** **L** for the local-first ratings scaffold; **XL** once it needs accounts + server aggregation.

### 4. Analytics don't route you to action `[H4]`
- **Problem:** Scores exist but don't translate to "where am I weak / what do I do next," and aren't
  comparable across platforms.
- **Who:** anyone taking GTs across two platforms.
- **Meridian feature:** **Do-next intelligence** (Pillar 5) — weakest-subject routing from scores +
  untracked-high-yield gap analysis; normalize/label cross-platform scores rather than compare raw.
- **Effort:** **M** — per-subject accuracy rollup + "weakest subject → next topics" is mostly data we hold.

### 5. Price/lock-in resentment `[H6]`
- **Problem:** Expensive, validity expires pre-exam, forced app migrations, view caps, screenshot blocks.
- **Who:** price-sensitive majority; especially DBMCI/eGurukul and PrepLadder cohorts.
- **Meridian feature:** **Neutral free meta-layer** positioning + *(new idea)* **subscription /
  validity tracker** — show each platform's expiry against the exam date and warn before it lapses.
  Directly answers the extension-code genre.
- **Effort:** **S** for a validity tracker; positioning is free.

### 6. Mobile reliability is the differentiator `[H5]`
- **Problem:** Lower-rated apps lose users to crashes/buffering/logouts; mobile is the primary surface.
- **Who:** all app users; acute on Cerebellum/eGurukul.
- **Meridian feature:** **Mobile-first build mandate** ([RESPONSIVE_MOBILE_REWORK.md](RESPONSIVE_MOBILE_REWORK.md), P0)
  + surface the **reliability scorecard** inside the ratings layer.
- **Effort:** **M** (the rework is already scoped); scorecard is **S**.

---

## Recommended **Next 5 features** (with acceptance criteria)

These re-rank the roadmap backlog around what the research actually validated. Order = build order.

**1. Mobile-first responsive rework (P0, unblocks everything)**
- *Why:* H5 — mobile is the only surface that matters; current app has no mobile view.
- *Accept:* every primary view (dashboard, subject drill-down, detail drawer, command palette)
  usable one-handed at 390 px; no horizontal scroll; touch targets ≥44 px; passes on a real phone.

**2. Harden the multi-platform data model (P0)**
- *Why:* H1 — fragmentation is the core wedge; new platforms must be *data*, not rewrites.
- *Accept:* Exam→Platform→Subject→Topic→Item schema holds Marrow + Cerebellum + DocTutorials +
  PrepLadder + eGurukul without code changes; one unified progress state spans all loaded platforms.

**3. Spaced-revision "Due" queue (P1)**
- *Why:* H2 — the single most-named unmet need; defensible vs. any single seller.
- *Accept:* topics marked Reviewed/Retaken surface as "due" after a configurable interval; a Today
  view lists due items across *all* platforms, sorted by high-yield × days-overdue; marking review resets the timer.

**4. Do-next intelligence: weakest-subject routing + high-yield gap (P1)**
- *Why:* H4 — analytics that *route to action*, not just report a number.
- *Accept:* per-subject accuracy computed from tracked test/QBank results; dashboard names the
  weakest subjects and links to the untracked high-yield topics in them; cross-platform scores are
  labeled by source (never compared raw).

**5. Local-first ratings scaffold + neutral reliability scorecard (P1)**
- *Why:* H3 — the IMDB wedge; start local, designed to aggregate server-side later.
- *Accept:* user can rate any topic/test for difficulty + quality + "worth it," stored locally with a
  schema ready for server sync; a read-only per-platform reliability card (seeded from app-store
  data, sourced/dated) ships alongside it.

*Deferred but validated:* **subscription/validity tracker** (H6, small, high-goodwill — good quick
win whenever P1 has slack) and the **topic-equivalence graph** (P2, supports H1/H3 once data model lands).

---

## What this changes in the roadmap
- **Confirms** the P0/P1 ordering in [VISION_and_ROADMAP.md](VISION_and_ROADMAP.md) — research did not
  surprise the thesis, it *validated* it. Cross-platform tracking, spaced revision, ratings, and
  weakest-subject routing all earned their place with real citations.
- **Sharpens H4:** the analytics wedge is **cross-platform comparability + action-routing**, not
  "incumbent analytics are bad" (Marrow's are decent). Don't pitch "better analytics"; pitch
  "analytics across all your platforms that tell you what to do next."
- **Tempers H5/H6:** mobile-first is a *build mandate* (validated) but "desktop trackers lose" is
  unproven; price *resentment* is real but *goodwill for a free neutral layer* is still our bet to prove.
- **New small win surfaced:** the **validity/expiry tracker** — cheap, emotionally resonant, viral-adjacent.
