# Mapping Audit & Recall-Recovery — ULTRACODE BRIEF

> Coordinator's brief for an **ultracode (multi-agent Workflow) session**. Runs **after Phase 1d, before
> Phase 2b**. Goal: raise the platform↔canonical-topic mapping **recall** (find the real matches the
> precision-first matcher missed) **without sacrificing precision** (a wrong map = false coverage = worse
> than `unmapped`). The cross-platform tracker is built on this map — it must be trustworthy first.

## Why (the numbers)
Phase 1d mapped, precision-first: **232/787 topics**, **77/157 high-yield**. Per-platform HY: Marrow 46,
eGurukul 54, PrepLadder 45, DocTutorials 26, Cerebellum 14. These are **recall failures, not genuine
gaps** — Marrow/Cerebellum demonstrably cover far more than 46/14 of 157 high-yield topics; the names just
differ or sit at a different granularity. Recover those matches, keep the precision.

## Scope
- **Improve the platform→canonical-topic mapping only.** Do **NOT** edit `D.library` (the canonical spine
  from the masterlist is the source of truth) and do **NOT** build tracker/PYQ UI here.
- Handle **granularity mismatch**: allow **1:many** (one platform module → several canonical topics) and
  **many:1** (several modules → one topic). Source of mismatch the 1d matcher couldn't do.
- Prioritize the **157 high-yield topics first**, then the remaining 630.
- Also lightly **re-verify the existing 232 maps** for any surviving false positives.

## Known failure modes (the refutation checklist — these MUST be caught)
- **Sibling variants** (different entity, shared words): Fungal vs Bacterial Corneal Ulcer; OHSS vs PCOS.
- **Generic-noun overlap**: matching on "syndrome"/"carcinoma"/"acute" alone.
- **Granularity over-reach**: mapping a broad module to a narrow topic (or vice-versa) without real containment.
- **Same word, different entity**: homonyms across systems.

## Recommended Workflow shape (the session may refine)
Fan out **per subject** (19), pipeline each subject independently (no barrier):
1. **Propose (parallel, per subject)** — agent gets that subject's canonical topics (flag the unmapped
   high-yield) + all 5 platforms' module/topic lists for that subject. Proposes NEW high-confidence
   mappings (incl. 1:many / many:1), each with: canonical-topic id, platform, the matched module(s),
   **rationale**, **confidence**, and **which trap it avoided**. Anchor on canonical names + aliases +
   medical knowledge. When uncertain → leave unmapped.
2. **Refute (parallel, per proposed mapping/subject)** — a skeptic agent tries to **kill** each proposed
   mapping against the checklist above. **Default to reject when uncertain.** Keep only survivors.
3. **Integrate + report** — merge surviving maps into the mapping artifact / `build_data.py`; recompute
   coverage; emit a **before→after coverage table** (per subject + per platform, topics + high-yield) and
   a list of **genuinely-unmapped high-yield topics** (real gaps, honestly surfaced) vs recovered.

## Hard constraints (auto-fail)
- **Precision is the prime directive.** Recall rises *only* through verified additions — never by lowering
  the bar or quota-filling. Quality over quantity.
- No fabrication; medical-domain correctness; preserve epistemic labels + the source-integrity guard;
  56,091 measured MCQs unchanged; `D.library` untouched.

## Verify → ship
- `python build_data.py` (guard must pass); Claude Preview — High-Yield + Subject pages show the richer
  per-platform coverage pips, console clean, no h-scroll 320→1440, day+evening. Spot-check ~5 recovered
  maps + ~3 rejected ones are correct calls.
- Commit; `git push origin main`. Tick this in `PROGRESS.md`, decision-log line with before→after coverage,
  refresh the data inventory.
- **Report to coordinator (5–7 lines):** before→after coverage (topics + HY, per platform), # recovered,
  # rejected by the refuter, remaining genuine HY gaps, confidence the map is now tracker-ready.

## Acceptance (coordinator will verify)
Every retained mapping survives adversarial refutation; HY coverage rises materially through *verified*
additions; the genuinely-unmapped HY list is honest (not hidden); no precision regression on the original 232.

## Model / reasoning
Ultracode workflow — propose + refute agents at **Opus 4.8 · high**, the refuter strict. The map is
correctness-critical; spend the rigor here so the tracker stands on solid ground.
