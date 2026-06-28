# Study Planner — the editable, shareable planning pillar + the accountability engine

> Proposed 2026-06-27 (by the user). Today the Planner is a static "do-next" read-out. This pillar makes it a
> real, **easy-to-use, editable, customizable** planner whose progress **auto-logs from actual tracking**, that
> can be **shared among peers** for accountability, and that can **adopt plans from curators**. It is the concrete
> form of the "do-next coach" pillar and the **retain surface** (the spreadsheet-killer) users funnel into.
> Governed by `DATA_VISUAL_STANDARD.md` (epistemic labels + neutrality firewall) and "local-first now, backend
> after the wedge proves" (Fork #3). Sibling of [[curator-layer]] (you adopt curators' plans) and the
> cross-platform tracker (which feeds the planner's "done" log).

## The idea (as asked)
- **Editable & customizable** plans — not a fixed list. Browse and add the topics / QBank modules you want.
- **Adopt plans from curators / peers** — copy a published plan into your own editable state.
- **Auto-logging:** when you mark a module *Attempted* (or Reviewed / a video Watched), it registers into the
  planner as something you did **on that day** — a "done diary" built from real activity, not self-report.
- **Shareable, NOT competitive:** small peer pods (WhatsApp-sized groups) opt into a shared plan for
  accountability — comparison for solidarity, never a leaderboard.
- **Lightweight, not a YPT-style time tracker** — just enough planning + tracking to create accountability.
- **Easy first:** manual per-module selection exists but is the *power* path. Simpler defaults: assign a subject
  to a **date range** (e.g. 25–28 Jun = OBG), or pick an **intensity template** (Hybrid videos+MCQs / MCQ-heavy /
  Revision-PYQ / Custom). Ease of use is a hard requirement.

## Design principles
1. **Ease before granularity** — quick modes are the default; manual day-by-day is optional.
2. **Accountability from real activity, not self-report** — completion is derived from tracked actions you can't
   fake, which is also the anti-dopamine mechanism.
3. **Calm almanac tone** — nudges, not punishment; no gamified noise, no infinite feed.
4. **Local-first core; social is post-backend** — the solo planner works offline; sharing needs accounts.

## Planner modes (the easy → hard ladder; all produce the same underlying plan items)
- **Quick-schedule:** assign subject(s) to a date range → auto-distributes that subject's modules/videos across
  the days, weighted by MCQ-density (proxy-labelled), respecting a daily load cap.
- **Intensity templates:** *Hybrid* (videos + MCQs), *MCQ-heavy*, *Revision/PYQ*, *Custom* (pick platform +
  activity type) — defaults to the student's **My-subscriptions** set (see below) when present.
- **Manual/custom:** hand-pick modules per day (power users).

## The "done diary" — auto-logging from real tracking (the user's idea, strengthened)
- **Key seam: the app already timestamps every tracked action.** `Store.state.progress[id].ts` and
  `Store.state.videos[id].ts` exist today. So "what I did on 26 Jun" is just a **view that groups tracked actions
  by day** — no new tracking surface, nothing to self-report or game.
- **Plan adherence** = planned items actually completed (matched by the same module ids), shown as **on-track /
  behind**, never as hours. This keeps progress honest and is the core anti-dopamine guardrail.

## The accountability engine (the meaty part — accountability is the #1 soft failure in exam prep)
Mechanisms, ordered by leverage and sequenced local → social:
- **(a) Plan-adherence, not vanity hours.** Measure "did you do what you committed to," derived from real tracked
  actions. No total-hours metric or hour-grinding leaderboard (that is the YPT dopamine trap).
- **(b) Realistic-plan guardrail.** If a plan is over-stuffed vs your observed pace (e.g. 1,500 MCQs in 2 days),
  warn and suggest a feasible split — kills the plan → fail → demoralize → abandon cycle.
- **(c) "Am I behind?" pacing** (ties roadmap job #5). Compare progress to the plan's own schedule *and* to the
  exam date; calm status, not red alarms.
- **(d) Commitment device.** Opt-in weekly commitment ("finish OBG MCQs by Sun") with a gentle check-in. Streaks
  optional and **forgiving** (no punishing reset that triggers abandonment).
- **(e) Peer pods (post-backend).** 3–8 people opt into a shared plan; a simple shared board shows who is on/behind
  **their own plan** — solidarity, not ranked by raw volume.
- **(f) WhatsApp-bridged snapshot.** The accountability groups already live on WhatsApp, so the app **generates a
  shareable weekly summary card** ("Adherence 82% · OBG done · Surgery behind") to drop into the group. The app is
  the source of truth; WhatsApp is the social surface — we don't try to be a chat app.
- **(g) Accountability partner.** Optional buddy who receives your weekly snapshot; mutual visibility drives
  follow-through.
- **Anti-dopamine guardrails:** completion counts only from real tracked actions; metrics are about *commitments
  kept*, not time logged; planning friction kept low so the planner doesn't become the procrastination. Honest
  caveat: any planner can be used to *feel* productive without studying — these three rules are how we fight it.

## Sharing model + privacy
- **Opt-in only.** Shared view = aggregate adherence + which subjects, **not** granular surveillance.
- **Plans are shareable artifacts** — a curator or peer publishes a plan template; adopting **copies** it into your
  own editable state.
- **Non-competitive by design** — a solidarity board, never a leaderboard.

## My subscriptions — the personal-banks lens (FUTURE; lands with the substantial planner upgrade)
> Captured 2026-06-28 from the user. **Parked, not built** — to ship as part of the planner overhaul.
- **The primitive:** a first-class user-state set of the platforms the student actually pays for / owns —
  a subset of the 5 (`Store.state.subs = ["marrow","prepladder",…]`, default empty = opt-in). Set via a
  small "My banks" selector (5 platform toggle-chips) in the toolbar + mobile overflow menu, next to Theme.
- **UI ask (verbatim intent):** above the general per-topic coverage pips (the muted `M C D P E` row from
  `libCoverageChips`, `core.js`), render a **separate, emphasized upper row in slightly bigger font** that
  highlights the student's *subscribed* platforms — covered = full-color pip, not-covered = outlined/muted —
  so they instantly see "do **my** banks cover this high-yield topic?" The general all-platforms row stays
  below as the neutral reference. When `subs` is empty, only the general row shows (no clutter; opt-in).
  Surfaces: High-Yield rows + Subject-page topic rows (both already call `libCoverageChips`); the change is
  centralized there, so it propagates everywhere for free.
- **Why it belongs to the planner:** the same `subs` set **scopes plan generation** — *Custom* mode and the
  intensity templates distribute only from owned banks, and the done-diary/adherence judge what the student
  can actually do. It also sharpens the honest-gap signal: an HY topic none of *my* banks cover is a real
  personal gap (consider a complement, e.g. a PYQ pass).
- **Build notes:** purely additive — a `subs[]`/`toggleSub()`/`isSub()` trio in `storage.js`, a `.cov-mine`
  upper row + CSS (bigger pips, covered vs `.off`) in `libCoverageChips`, and the selector wiring. No spine
  or mapping change; rides on the now-trustworthy `platformRefs` (post Mapping-Audit, 594/787 · 152/157 HY).
- **Ties:** [[study-planner-pillar]]; the cross-platform map (coverage source); curator/peer "adopt plan".

## Schema seam (mostly user-state; build-friendly)
- **`Store.state.subs[]`** (the My-subscriptions set, above) is the personalization seam — read by both the
  coverage-pip "my banks" row and plan generation; local-first, syncs later with the rest of user-state.
- **Local-first now:** `Store.state.schedule` already exists as the seam. Plan shape:
  `plan = { id, name, mode, range:{from,to}, dailyCap?, items:[{ entity:{type,id}, targetDate }], commitments:[…], adoptedFrom? }`
- **"Done diary" is DERIVED** from existing `progress[*].ts` + `videos[*].ts` (group by day; match item ids) — no
  new write path, no fabrication.
- **Templates** are generators over `D.platforms` (distribute a subject's modules by proxy weight across dates).
- **Shared/peer/snapshot features need accounts + backend** (the `storage.js` → server seam) — post-gate.

## Sequencing
- **Phase 2/3 — local-first (the retain surface; high value, no backend):** editable single-user planner +
  quick-schedule + intensity templates + the derived done-diary + realistic-plan guardrail + personal "am I
  behind". Mostly buildable now on `storage.js`.
- **Phase 3+ — post-backend gate (Fork #3):** adopt curator/peer plans, peer pods, shared adherence board,
  WhatsApp snapshot, accountability partner. Needs accounts + server (privacy + share dedupe).
- **Ties:** [[curator-layer]] (adopt plans), cross-platform tracker (auto-log source), Subject/Faculty entity
  pages ("add to plan" action — already noted in the curator/entity work), pace-benchmark job #5.

## Guardrails
- **Local-first must still work** — planner usable offline, solo.
- **Neutrality firewall** — template weighting is `proxy` and labelled; curator plans are `directional`/sourced;
  money never buys plan placement.
- **Privacy** — shared data is opt-in and minimal.
- **Anti-dopamine** — real-activity-only completion; no vanity hours; calm nudges.
