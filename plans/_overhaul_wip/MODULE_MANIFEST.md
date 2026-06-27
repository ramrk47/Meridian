# Meridian — Module Manifest (Stage 3a, mechanical split)

Everything stays **global scope** — no `import`/`export`, no `type="module"`. Each symbol is
defined in **exactly one** module. Load order (index.html + sw.js SHELL) is dependency-correct:

```
data.js → storage.js → js/core.js → js/ds.js → js/motion.js →
  js/surfaces/{overview,qbank,progress,tests,hy,videos,planner}.js →
  js/entities/{subject,platform,faculty}.js →
  js/main.js   (loads LAST; calls Store.load().then(init))
```

`js/motion.js` (CRAFT shared seam) loads AFTER ds.js, BEFORE the surfaces — it
depends on `MOTION_OK`/`VT_OK`/`fmt` (core.js) and is consumed by surfaces + main.
Globals: `observeOnce`, `viewTransition`, `reveal`, `countUp`, `chartIntro`,
`animateView`. All reduced-motion + feature-detect guarded; all idempotent.

CSS load order: `css/tokens.css → css/components.css → css/charts.css → css/<surface>.css`
(base rules first, mobile media layer lives at the bottom of components.css to preserve cascade).

---

## js/core.js — shared seam (loads first after data/storage)
Globals exported:
- **D alias + DOM/format helpers:** `D`, `$`, `$$`, `fmt`, `pct`, `el`, `esc`, `cssEsc`
- **Canon:** `CANON`, `canon`, `PYQ`
- **Platform registry:** `PLATFORMS`, `QBANKS`, `PLAT_BY_ID`, `platName`, `platCls`, `platColor`,
  `platInitial`, `freshSubjects`, `platMCQ`, `platMods`, `QBANK_MCQ`, `platUnitNoun`
- **Leaf index:** `LEAVES`, `LEAF_BY_ID`, `allModuleIds`
- **Subject lookups:** `subjectsOf`, `subjMeta`, `leavesOf`, `treeOf`
- **Rollups:** `rollup`, `rollupLeaves`
- **Priority badges:** `priStars`, `hyBadge`
- **Curation (epistemic) helpers:** `CUR`, `SRC_BY_ID`, `EPI_DEF`, `epiName`, `epiDesc`, `epiBadge`,
  `srcLink`, `srcLinks`, `srcLine`, `platRefChip`
- **Cross-platform matching:** `STOP`, `_tokCache`, `toksC`, `sim`, `scoredCross`, `crossMatches`,
  `_bestCross`, `bestCross`, `_bestCrossByPlat`, `bestCrossByPlat`, `siblings`
- **Tests index:** `buildTests`, `TEST_ALIASES`, `relatedTests`
- **Video helpers:** `VIDEOS`, `VID_BY_ID`, `BTR_CANON`, `videoSubjects`, `videosOf`, `vidRollup`,
  `norm`, `topicLeafScore`, `_vidSugg`, `videoSuggestions`, `_leafVids`, `videosForLeaf`, `confTag`
- **Faculty helpers (now wired to D.faculty[]):** `FACULTY`, `FAC_BY_ID`, `facById(id)`,
  `facultyForSubject(canon)`, `facultyForPlatform(id)`, `videoFaculty()`. Each faculty carries a
  derived `platforms:[{platformId}]` (integrated only). Null-guard `D.faculty` (empty array if absent).
- **Reputation-only platform names:** `REPUTATION_NAMES` (prepladder/egurukul, sourced from
  D.reliability.apps), `platDisplayName(id)` — friendly name for ANY id; NEVER promotes a
  reputation-only id to a content link (callers still gate links on `PLAT_BY_ID`).
- **Cross-surface shared:** `SUBJ_BY_CANON`, `statusDots`

## js/ds.js — shared component + chart library (3b: ALL LIVE)
Pure functions returning HTML/SVG strings. Entity links via `data-go-subject|platform|faculty`.
- **Color-as-data helpers:** `yieldFill(t)` (0..1→`--y0..5`), `conFill(n)` (0..3→consensus ramp),
  `yieldInk(t)` (legible ink on a cell). (`platColor(id)` lives in core.js — single canonical def.)
- **Live shared meters:** `meterHTML(a,total,cls?)`, `bigMeter(rollupObj)`
- **Component primitives:**
  - `statTile({value,label,note,accent,spark,epi,go,hero})` — compact KPI tile; `go="subject:Surgery"` makes it a router link; `hero` upgrades to the one serif numeral. (positional back-comat retained)
  - `listRow({lead,title,sub,trail,go,done})` + `groupList(rows,cls?)` — inset-grouped rows in ONE container; `dotLead(color)` = colored-dot lead.
  - `epiDot(tag)` — 6px label-coded square (epiBadge lives in core.js, re-used).
  - `segmented(opts,current,name,tint?)` — pill group; opts = strings or `{v,label}`.
  - `panel({title,epi,sourceIds,captured,body,actions,curated})` — section container; warns if `curated` body lacks `epi`.
  - `chartFrame(title,epi,sourceIds,captured,svgOrHtml,{legend,note,plateNo})` — THE PLATE; auto `Pl. N` via `_plateSeq`; emits `data-read-plate/-src/-cap` on the epi badge. `resetPlates()` at top of each renderX.
  - `readPlateSheet(epi,srcIds,captured)` — touch handler (wired in main.js `[data-read-plate]`); opens openSheet with `[v,label]` tuples (the shape openSheet destructures).
  - `bottomSheetOpt(v,label,on)` — single sheet option row.
- **Chart vocabulary (all live):**
  - `heatmap(rows,cols,valueFn,{compact,ringFn})` — rows=`[{key,label,go?}]`, cols=`[{id,label,color?}]`, valueFn→`{v,raw,t}`; `ringFn(key)→colId` gold directional ring.
  - `consensusMark(n,plats,{glyph})` — plats=`[{id,on}]`; pip outlined by platform, filled by `conFill`.
  - `rankedBars(items,{colorFn,nosort})` / `treemap(items,opts)` — items=`[{label,value,t?,color?,go?,mark?}]`.
  - `sparkline(series,{w,h,unit})` / `smallMultiples([{key,label,series,go?,value?}],{unit})`.
  - `facultyTimeline(faculty)` — vertical career timeline; node color=platform, edge style=status; integrated affiliations link to Platform page, reputation-only ids show `platDisplayName` muted.
  - `ratingScorecard(data,mode)` — `mode:"reliability"` (apps[]) or `mode:"faculty"` (faculty.ratings: gated profile + rolled-up videoByPlatform); `_starMeter(score,max)` helper.

## js/surfaces/overview.js
`renderOverview`, `renderSubjectStrength`, `renderReliability`, `renderMethodology`

## js/surfaces/qbank.js (also owns the shared drawer + bottom-sheet chrome)
- **QBank state/render:** `QB`, `QB_SORT_OPTS`, `QB_STATUS_OPTS`, `qbDefaultSubject`,
  `qbankSwitchHTML`, `switchQbankPlatform`, `renderQbank`, `leafMatchesFilters`,
  `subjectMatchCount`, `drawSidebar`, `sortLeaves`, `drawSubject`, `coverageBadge`, `leafRow`,
  `subjOthers`, `syncAfterToggle`
- **Detail drawer (shared):** `lastFocus`, `openDrawer`, `drLink`, `closeDrawer`
- **Option bottom-sheet (shared mobile sort/filter):** `sheetPick`, `openSheet`, `closeSheet`,
  `updateQbFilterBadge`

## js/surfaces/progress.js
`renderProgress`

## js/surfaces/tests.js
`testTag`, `subjectAccuracy`, `testPlat`, `renderTests`, `scoreRow`, `testsInput`, `testsClick`

## js/surfaces/hy.js
`hySubject`, `hyLeafMatch`, `renderHY`

## js/surfaces/videos.js
`vSubject`, `vDefaultSubject`, `renderVideos`, `drawVideoSidebar`, `drawVideoSubject`, `videoRow`,
`openVideoDrawer`, `syncVideoAfterToggle`

## js/surfaces/planner.js
`renderPlanner`

## js/entities/subject.js — `renderSubjectPage(canonSubj)`  (stub placeholder, 3b fills in)
## js/entities/platform.js — `renderPlatformPage(id)`        (stub placeholder, 3b fills in)
## js/entities/faculty.js — `renderFacultyPage(id)`          (stub placeholder, 3b fills in)

## js/main.js — orchestrator (loads LAST)
- **Command palette:** `PALETTE_INDEX`, `palSel`, `palResults`, `buildPaletteIndex`, `scoreMatch`,
  `palLastFocus`, `openPalette`, `closePalette`, `drawPalette`, `palMove`, `ensurePalVisible`, `palChoose`
- **Navigation / deep links:** `jumpToSubject`, `gotoLeaf`, `gotoTest`
- **Entity routing:** `ENTITY_VIEWS`, `showEntity`, `goSubject`, `goPlatform`, `goFaculty`
- **Global event delegation:** `appClick`, `refreshRowEverywhere`, `refreshDrawerChips`
- **Toolbar/toast/nav/keyboard:** `wireToolbar`, `wireMobileChrome`, `wireDrawerDrag`, `toast`,
  `toggleTheme`
- **Render map + view switching:** `RENDER`, `TAB_ORDER`, `TAB_LABEL`, `currentView`, `show`,
  `labelizeResponsiveTables`, `setHeaderHeight`
- **Keyboard cursor (qbank):** `qbVisibleRows`, `moveCursor`, `cursorAct`
- **Boot:** `init` (invoked by `Store.load().then(init)` at file end)

---

## ENTITY-ROUTING ENTRY POINTS (for 3b surface/entity builders)
Entity pages are **NOT tabs** — they render into dedicated `<section>`s and `showEntity()` toggles
them visible while clearing tab/botnav highlight.

| Entry point | Renders into | Render fn (entity file) | Click hook (delegated in `appClick`) |
|---|---|---|---|
| `goSubject(canonSubj)`  | `#view-subject`  | `renderSubjectPage(canonSubj)` | `[data-go-subject="<canon>"]` |
| `goPlatform(id)`        | `#view-platform` | `renderPlatformPage(id)`       | `[data-go-platform="<id>"]`   |
| `goFaculty(id)`         | `#view-faculty`  | `renderFacultyPage(id)`        | `[data-go-faculty="<id>"]`    |

`showEntity(kind)` (kind ∈ `subject|platform|faculty`) handles the view toggle + chrome reset.
Surfaces emit `data-go-subject` / `data-go-platform` / `data-go-faculty` attributes to link in.

## Notes for downstream (3b)
- Charts/components in `ds.js` are stubs returning `""` (except `meterHTML`, `bigMeter`, `statTile`,
  `chartFrame`). Fill these in; surfaces already on these names will light up automatically.
- `css/charts.css` and `css/components.css` have placeholder comment anchors for the 3b chart classes.
- Faculty data may be absent in `D`; `core.js` faculty helpers degrade to empty arrays safely.
