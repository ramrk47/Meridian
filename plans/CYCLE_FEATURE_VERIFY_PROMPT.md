# Builder prompt — Verify + land the Planner Cycle feature (already implemented in the tree)

> Paste into a fresh session. You are the **builder**; the coordinator owns strategy/PROGRESS.
> The "cycle stat bar + lockable retrospective cycles" Planner feature is **already implemented but
> UNCOMMITTED** in the working tree (`storage.js`, `js/surfaces/planner.js`, `css/planner.css`, +419 lines).
> The coordinator reviewed the diff and approved the design (it applied 3 of 4 refinements). Your job is to
> **verify it works end-to-end, fix the one open item + anything broken, write the docs, and commit it.**
> Do NOT rebuild it from scratch. **Backup exists:** tag `wip-cycles-backup` (recover with
> `git checkout wip-cycles-backup -- <file>` if the tree is ever lost). App is **Calvetra**.

## Orient
- Read the approved design in the coordinator thread / `plans/STUDY_PLANNER.md`. The feature: week/month
  cycle windows over the active plan → per-date load strip + subject×extent matrix + adherence; **lock** a
  cycle = frozen lock-time adherence + a **live backlog** that shrinks as you catch up; auto-snapshot completed
  weeks **before** `_autoReschedule` rewrites dates.
- The code is in the tree now — review `git diff` first to understand what's there.

## Must verify (this is the coordinator's fold-in gate)
1. **Renders + no regression.** Planner loads, console clean; existing stats/passes/schedule/done-diary intact;
   56,091 / `D.library` / mapping / the 10 surfaces untouched; the 3 standards hold.
2. **Cycle math matches hand-computed values.** Create a backward plan; tick modules (attempt/review/retake)
   across several dated days. Toggle Week⇄Month and ◀▶ windows; confirm the per-date strip, subject×extent
   matrix, adherence, and the Extent⇄Revisions framing toggle all reflect the real tracked flags.
3. **Lock behavior.** Lock the current cycle → tick more of its backlog → the locked card's **live backlog
   shrinks** while its **frozen lock-time adherence stays put**. `removeCycle` discards.
4. **Auto-snapshot-before-reschedule.** Back-date items / simulate a rolled-over week → confirm
   `_autoSnapshotCycles` captures it (weeks only, idempotent — reload doesn't duplicate) BEFORE
   `_autoReschedule` moves dates. No history loss.
5. **REFINEMENT #4 (the open one): month strip at 320 px.** `_cycleStrip` for a ~30-day month must compress
   cleanly — **no horizontal scroll** at 320/360/375. Verify + fix the CSS if it overflows. (Week strip is trivial.)
6. **Sync on the HARDENED backend.** Signed-in (dev mock-auth + SQLite, `php -S` via the `backend` launch config),
   confirm `cycles[]` round-trips to `user_state` and `mergeState` unions by id (no dup/loss) on reload-from-server.
   Keep records lean — the server now enforces a **256 KB blob cap**; confirm cycles stay well under it.

## Then
- **Docs:** spec the cycle model + lock semantics in `plans/STUDY_PLANNER.md`; in `plans/PROGRESS.md` add a
  decision-log line + add `cycles` to the user-state seams in the data inventory.
- **Commit** the feature (storage.js + planner.js + planner.css + docs) in small **secrets-free** units;
  `git push origin main`. Once landed, you may delete the `wip-cycles-backup` tag.
- **Report to coordinator (4–6 lines):** what you verified (esp. the lock/live-backlog + auto-snapshot timing +
  the 320px month strip), anything you had to fix, and confirm no regression + the sync round-trip.

## Out of scope (don't add)
R4+ explicit revision counter; auto-injecting backlog into the active plan; peer/shared cycles (social layer).

## Model / reasoning
**Opus 4.8 · high reasoning** — verification-heavy with real edge cases (auto-snapshot timing, the 320px strip,
the sync union). Mostly verify + small fixes + docs; the build is already done.
