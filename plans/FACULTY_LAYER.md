# Faculty Layer — the "people" pillar (architecture + guardrails)

> Decided 2026-06-27. Meridian is "IMDB for exam prep" — IMDB has *titles* **and** *people*. We had only
> the content side; **faculty are the people layer.** Faculty move platforms, go solo, and split into
> super-specialty coaching — and **no platform will ever track a teacher who left for a rival or went
> solo.** Only a neutral layer can. That career-history + neutral rating is a unique, un-buildable-by-
> incumbents moat. This doc is the standing architecture; governed also by `DATA_VISUAL_STANDARD.md`
> (epistemic labels + neutrality firewall apply to every faculty figure).

## Decisions locked
- **Scope now:** design the entity schema (everything becomes faculty-aware) + a **small curated seed**
  (~10–20 well-known faculty, `directional`, sourced) to prove profile + history + rating. Grow over time.
- **Data:** a dedicated **faculty data-gathering pass** is greenlit (`FACULTY_DATA_PASS_PROMPT.md`) —
  public/own-account content only, per guardrails — to enrich beyond the seed.
- **Verified voting:** gate = **in-app tracked activity** (you may rate a faculty only if Meridian
  recorded you watched their videos / tracked a platform they taught on). Design `verifiedVia` now;
  **enforce post-backend** (needs accounts + server + vote dedupe — consistent with "local-first now,
  backend after the wedge proves"). Until then, show **seeded `directional` ratings only.**

## Entity schema (target `D.faculty[]`)
```
D.faculty = [{
  id: "fac-<slug>",
  name: "Dr. …",
  aka: ["…"],                       // nicknames students search by
  subjects: ["Surgery", …],         // canonical (use CANON)
  affiliations: [                   // the career timeline — the moat
    { platformId:"marrow", role:"faculty", subjects:["Surgery"], from:"2018", to:null,   status:"current" },
    { platformId:"prepladder",            subjects:["Surgery"], from:"2014", to:"2018", status:"past" },
    { platformId:null, name:"<solo brand>", subjects:["Surgical Onco"], from:"2024", to:null, status:"superspecialty" }
  ],
  ratings: {
    profile:        { score:null, count:0, verifiedVia:"in-app-activity", status:"directional" }, // seed now; community later
    videoByPlatform:[ { platformId:"marrow", avg:null, n:0, status:"directional" } ]              // rolled-up video rating
  },
  bio: "…",                         // short, sourced
  sourceIds: ["src-…"],             // → D.sources[] (the registry from 1c.1)
  epistemic: "directional"          // overall tag for seeded data
}]
```
- `status` values: `current` · `past` · `solo` · `superspecialty`.
- Faculty link to `D.platforms` (via `platformId`) and to subjects (via CANON). Videos (`D.videos`) get an
  optional `facultyId` so video ratings can roll up per faculty per platform.
- Every rating carries `verifiedVia` + `status` so the seed→verified-community transition is a data flip,
  not a rewrite.

## Two rating signals (as specified by the user)
1. **Profile votes** — direct public rating on the faculty profile; **gated** by `verifiedVia` (anti-astroturf).
2. **Rolled-up video rating** — average of the faculty's video ratings across the platforms they've worked on.

## Neutrality guardrails (rating *named individuals* is reputation-sensitive — be deliberate)
- **Aggregate-only**, sourced, dated; framed as **community sentiment**, never "Meridian's verdict."
- **No gratuitous "worst faculty" ranking.** Present strengths/fit per subject, not a public shaming board.
- Seed ratings are `directional` and labeled as such; real ratings appear only once verified-gated voting is live.
- Never fabricate a name, affiliation, date, or score — every datum traces to a source in `D.sources[]`.

## Sequencing
- **1c.1F** (now): schema + curated seed + a faculty surface (profiles + history timeline + directional
  rating) + `verifiedVia` design. Prompt: `PHASE1C1F_PROMPT.md`.
- **Faculty data pass** (greenlit, parallel): gather rosters / movement history / ratings → `_raw/curated/`.
- **1c.2** (viz): faculty surfaces get the data-viz treatment (timeline, per-subject strength).
- **Post-backend** (Phase 5): switch on verified, aggregated community voting (`verifiedVia` enforced).
