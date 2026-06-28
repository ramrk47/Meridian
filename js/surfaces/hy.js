/* ============================================================
   surfaces/hy.js — HIGH-YIELD  ·  JUDGMENT surface #1
   Reframed as PROXY DENSITY + CONSENSUS (never "real" exam yield).
   Relational viz (mandatory here):
     · Pl.1  rankedBars — MCQ-density mass by subject, consensus-ranked,
              with per-subject consensusMark + best-platform directional chip
     · Pl.2  rankedBars — top topics within the chosen subject (or top picks
              across all), each carrying a consensusMark (≥2 banks agree)
   Plus a consensus inset-group (topics ≥2 banks flag ★★★) and per-subject
   density groupLists. Every figure carries epi (proxy/measured/directional)
   + source via chartFrame/panel. Names link to Subject pages; rows keep the
   existing tracking drill-down (data-open-leaf) + filters untouched.
   ============================================================ */
let hySubject = "all", hyStatus = "all";

/* status filter options — shared [v,label] tuple shape with QBank (QB_STATUS_OPTS),
   so the same desktop-select + mobile-bottom-sheet toolbar idiom is reused here. */
const HY_STATUS_OPTS = [["all", "All statuses"], ["untracked", "Yet to attempt"], ["attempted", "Attempted"], ["review", "Needs review"], ["mastered", "Mastered"], ["starred", "My starred"]];

function hyLeafMatch(l) {
  const p = Store.prog(l.id), st = Store.state.stars[l.id];
  switch (hyStatus) {
    case "untracked": return !p.a && !p.r && !p.t;
    case "attempted": return !!p.a;
    case "review": return p.a && !p.r;
    case "mastered": return !!p.t;
    case "starred": return !!st;
    default: return true;
  }
}

/* canonical subject -> { platformId: best directional platform } from D.subjectStrength */
function _hyStrongest() {
  const out = {};
  const subs = (CUR.strength && CUR.strength.subjects) || [];
  subs.forEach(r => {
    const top = (r.strong || [])[0];
    if (top && top.platformId && PLAT_BY_ID[top.platformId]) out[canon(r.subject)] = top.platformId;
  });
  return out;
}

/* consensus topics: a leaf that is ★★★ on >=2 independent integrated banks for the same topic */
function _hyConsensus() {
  const consensus = [], used = new Set();
  LEAVES.filter(l => l.priority === 3).forEach(l => {
    if (used.has(l.id)) return;
    const members = { [l.platform]: l };
    Object.entries(bestCrossByPlat(l)).forEach(([pid, ol]) => { if (ol.priority === 3) members[pid] = ol; });
    if (Object.keys(members).length < 2) return;            // needs agreement from another bank
    Object.values(members).forEach(x => used.add(x.id));
    consensus.push({
      members, canon: l.canon, lead: l,
      n: Object.keys(members).length,
      mcqs: Object.values(members).reduce((a, x) => a + x.mcqs, 0),
    });
  });
  consensus.sort((a, b) => (b.n - a.n) || (b.mcqs - a.mcqs));
  return consensus;
}

function renderHY() {
  resetPlates();
  const v = $("#view-hy"); v.innerHTML = "";

  const CAP = (CUR.strength && CUR.strength.captured) || D.captured;
  const SS_SRC = (CUR.strength && CUR.strength.sourceIds) || [];
  const strongBy = _hyStrongest();

  // ---- per-subject density maps (measured counts; density bucketing = proxy) ----
  const subjMaps = QBANKS.map(p => Object.fromEntries(freshSubjects(p).map(s => [canon(s.subject), s])));
  const subjTotal = cs => subjMaps.reduce((a, m) => a + (m[cs] ? m[cs]._mcqs : 0), 0);
  const subjects = [...new Set(subjMaps.flatMap(m => Object.keys(m)))].sort((a, b) => subjTotal(b) - subjTotal(a));

  // ---- consensus set (proxy: ★★★ on >=2 banks) ----
  const consensus = _hyConsensus();
  const consensusByCanon = {};
  consensus.forEach(c => { consensusByCanon[c.canon] = (consensusByCanon[c.canon] || 0) + 1; });

  const hyAll = LEAVES.filter(l => l.priority === 3);
  const hyDone = hyAll.filter(l => Store.prog(l.id).a).length;
  const hh = LEAVES.filter(l => l.priority >= 2);
  const hhRev = hh.filter(l => Store.prog(l.id).r).length;
  const topSubj = subjects[0];

  /* ── PRIMARY signal: PYQ-frequency importance from the canonical spine (directional). ──
     MCQ density (above) is demoted to a clearly-labelled proxy lens lower down. */
  const libHigh = LIB_TOPICS.filter(t => t.tier === 3);
  const libHighStarted = libHigh.filter(libTopicStarted).length;
  const covHy = LIB_COV ? LIB_COV.hyWithAnyPlatform : 0;
  const covHyTot = LIB_COV ? LIB_COV.hyTotal : libHigh.length;

  /* ── 6 stat-tiles (mobile 2/3-col, 84–104px). Hero leads with REAL PYQ frequency. ── */
  const tiles = el("div", "tiles hy-tiles");
  tiles.innerHTML =
    statTile({ accent: "g", hero: true, value: fmt(libHigh.length), label: "High-yield topics", note: `by PYQ frequency · ${LIB_SUBJECTS.length} subjects`, epi: "directional" }) +
    statTile({ accent: "k", value: `${covHy}/${covHyTot}`, label: "Mapped to a platform", note: "confident cross-platform", epi: "directional" }) +
    statTile({ accent: "m", value: pct(libHighStarted, libHigh.length) + "%", label: "You've started", note: `${libHighStarted} of ${fmt(libHigh.length)} HY`, epi: "measured" }) +
    statTile({ accent: "c", value: fmt(consensus.length), label: "Density consensus", note: "≥2 banks agree ★★★", epi: "proxy" }) +
    statTile({ accent: "k", value: fmt(subjTotal(topSubj)), label: "Heaviest subject", note: esc(topSubj), epi: "measured", go: "subject:" + topSubj }) +
    statTile({ accent: "g", value: fmt(hyAll.length), label: "Top-density topics", note: "★★★ proxy lens (below)", epi: "proxy" });
  v.appendChild(tiles);
  // count-up the ONE hero serif numeral (high-yield topics). statTile printed the final
  // en-IN string; we stamp data-count="<raw int>" so the shared countUp() tweens once.
  const heroV = tiles.querySelector(".tile.is-hero .tile-v");
  if (heroV) heroV.dataset.count = String(libHigh.length);

  /* ── honest framing: importance primary (directional), density secondary (proxy) ── */
  const proxyNote = el("div", "callout proxy-note",
    `<b>This tab now ranks real PYQ frequency ${epiBadge("directional")} as the primary signal.</b>
     Topics are ordered by how often they've been asked (community-curated masterlist), each shown with the <em>angle</em> it's asked from and which platforms confidently cover it.
     It's <b>directional</b> — community-curated PYQ counts, not Calvetra's measurement. Below, the older <b>MCQ-density</b> view stays as a clearly-labelled ${epiBadge("proxy")} lens (a stand-in for exam weight, not real yield).
     <span class="muted">Source: ${LIB_SRC ? srcLinks(LIB_SRC_IDS) : "masterlist"} · captured ${esc(LIB_CAP)}. Click a topic to open its subject. Method → <button type="button" class="linkbtn" data-hy-howrate>How we rate ↗</button></span>`);
  proxyNote.setAttribute("data-reveal", "");
  v.appendChild(proxyNote);

  /* ── ONE sticky toolbar (subject + status) — drives BOTH the importance section
        and the proxy-density section below. Shared idiom with QBank. ── */
  const HY_SUBJ_OPTS = [["all", "All subjects (top picks each)"]].concat(subjects.map(s => [s, s]));
  const ctr = el("div", "controls hy-controls qb-controls");
  ctr.innerHTML =
    `<select class="sel desk-ctrl" id="hysub" aria-label="Subject">
       ${HY_SUBJ_OPTS.map(([vv, l]) => `<option value="${esc(vv)}">${esc(l)}</option>`).join("")}
     </select>
     <select class="sel desk-ctrl" id="hystatus" aria-label="Filter by your status">
       ${HY_STATUS_OPTS.map(([vv, l]) => `<option value="${esc(vv)}">${esc(l)}</option>`).join("")}
     </select>
     <button class="iconbtn mob-ctrl" id="hySubBtn" aria-label="Choose subject" title="Subject">☰</button>
     <button class="iconbtn mob-ctrl" id="hyStatusBtn" aria-label="Filter topics" title="Filter">⛁</button>
     <div class="spacer"></div><span class="count-pill">click a topic → subject</span>`;
  v.appendChild(ctr);
  $("#hysub").value = hySubject; $("#hystatus").value = hyStatus;
  $("#hysub").addEventListener("change", e => { hySubject = e.target.value; renderHY(); });
  $("#hystatus").addEventListener("change", e => { hyStatus = e.target.value; renderHY(); });
  $("#hySubBtn")?.addEventListener("click", () => openSheet("Choose subject", HY_SUBJ_OPTS, hySubject, val => { hySubject = val; renderHY(); }));
  $("#hyStatusBtn")?.addEventListener("click", () => openSheet("Filter by status", HY_STATUS_OPTS, hyStatus, val => { hyStatus = val; renderHY(); }));
  $("#hyStatusBtn")?.classList.toggle("has-dot", hyStatus !== "all");

  /* ──────────────────────────────────────────────────────────
     PRIMARY — Highest-yield topics by PYQ frequency (directional, sourced).
     Each row: importance stars · topic name (→ subject) · the PYQ ANGLE it's
     asked from · "asked N×" · confident platform-coverage pips. This is the
     real high-yield signal; density (below) is the proxy fallback.
     ────────────────────────────────────────────────────────── */
  if (LIB_TOPICS.length) {
    const startFilter = t => hyStatus === "untracked" ? !libTopicStarted(t)
      : hyStatus === "attempted" ? libTopicStarted(t) : true;
    const impTopics = (hySubject === "all" ? libTopTopics(40) : libTopics(hySubject)).filter(startFilter);
    const impRows = impTopics.map(t => {
      const ang = t.pyqAngle ? `<span class="imp-angle" title="${esc(t.pyqAngle)}">${esc(t.pyqAngle)}</span>` : `<span class="imp-angle muted">angle not recorded</span>`;
      const freq = t.timesRepeated != null ? `<span class="imp-freq" title="Times this topic recurred in the masterlist's PYQ scan (directional)">asked ${t.timesRepeated}×</span>` : "";
      return listRow({
        lead: impStars(t.tier),
        title: `<a class="hy-jump is-link" data-go-subject="${esc(t.subject)}">${esc(t.name)}</a>`
          + (hySubject === "all" ? ` <span class="imp-subj">${esc(t.subject)}</span>` : ` <span class="imp-subj">${esc(t.section)}</span>`),
        sub: `${freq} ${ang}`,
        trail: libCoverageChips(t),
      });
    });
    const impHead = `<div class="ph"><div class="ph-l">`
      + `<h3>Highest-yield topics — by PYQ frequency</h3>`
      + `<span class="muted hy-sh">${hySubject === "all" ? "top picks across all subjects" : esc(hySubject)} · ranked by how often asked ${epiBadge("directional")}</span>`
      + `</div><span class="count-pill">${impTopics.length} topics</span></div>`;
    const impSec = el("section", "panel hy-panel hy-importance");
    impSec.setAttribute("data-reveal", "");
    impSec.innerHTML = impHead
      + srcLine(LIB_SRC_IDS, LIB_CAP)
      + `<div class="panel-body">${impRows.length ? groupList(impRows, "hy-implist")
          : emptyState({ icon: "quill", title: "No topics under this filter", body: `No high-yield topics match this filter for ${esc(hySubject === "all" ? "any subject" : hySubject)}.` })}</div>`;
    v.appendChild(impSec);
  }

  /* ── divider: everything below is the SECONDARY proxy-density lens ── */
  const lens = el("div", "hy-lens-divider");
  lens.setAttribute("data-reveal", "");
  lens.innerHTML = `<span class="hy-lens-l">Secondary lens · MCQ density ${epiBadge("proxy")}</span>`
    + `<span class="muted small">a stand-in for exam weight, not measured yield — kept for cross-checking</span>`;
  v.appendChild(lens);

  /* ──────────────────────────────────────────────────────────
     Pl.1 — RELATIONAL HERO: density mass by subject, consensus-ranked.
     value = combined MCQ mass (measured); bar fill = yieldFill of mass
     (proxy magnitude). mark = consensusMark (how many banks agree HY).
     Sort: subjects with consensus float up, then by mass. Names → Subject.
     Directional gold chip = community-reputed strongest platform.
     ────────────────────────────────────────────────────────── */
  const maxMass = Math.max(1, ...subjects.map(subjTotal));
  const subjItems = subjects.map(cs => {
    const n = consensusByCanon[cs] || 0;
    const plats = QBANKS.map(p => ({ id: p.id, on: !!(subjMaps[QBANKS.indexOf(p)][cs] && consensus.some(c => c.canon === cs && c.members[p.id])) }));
    const agree = plats.filter(x => x.on).length;
    const strongPid = strongBy[cs];
    const mark = consensusMark(agree, plats)
      + (strongPid ? ` <span class="hy-best" style="color:${platColor(strongPid)}" title="Community-reputed strongest (directional)">${esc(platName(strongPid))}</span>` : "");
    return { label: cs, value: subjTotal(cs), t: subjTotal(cs) / maxMass, go: "subject:" + cs, mark, _n: agree };
  }).sort((a, b) => (b._n - a._n) || (b.value - a.value));

  const massLegend =
    `<span class="lg-ramp"><i class="r0"></i><i class="r1"></i><i class="r2"></i><i class="r3"></i><i class="r4"></i><i class="r5"></i><span>MCQ mass</span></span>`
    + `<span class="lg-con"><span class="cpip on" style="border-color:var(--gold);background:var(--con-all)"></span>banks agree (proxy)</span>`
    + `<span class="lg-best"><span class="hy-best">●</span>reputed strongest (directional)</span>`;

  // Source attribution: the density + consensus figure is a Calvetra-derived proxy
  // over measured MCQ counts — the proxy badge + note disclose the method, so we cite
  // NO third-party source for it. SS_SRC (subjectStrength: reputation blogs/Quora) backs
  // ONLY the directional "community-reputed strongest" gold chip, disclosed inline below.
  v.appendChild(_frame(chartFrame(
    "MCQ-density mass by subject — consensus-ranked", "proxy",
    undefined, CAP,
    rankedBars(subjItems, { nosort: true }),
    { legend: massLegend, plateNo: 1,
      note: `Bar length = combined MCQ mass (measured) · fill = within-set density (proxy) · pips = how many of ${QBANKS.length} banks flag ★★★ (proxy) · gold name = community-reputed strongest`
        + (SS_SRC.length ? ` (directional, sourced separately: ${srcLinks(SS_SRC)})` : ` (directional)`) + `.` })));

  /* ──────────────────────────────────────────────────────────
     Consensus inset-group — topics where ≥2 independent banks agree ★★★.
     Each row: consensusMark + which banks + combined mass + your coverage.
     The single most information-rich proxy signal. Row → topic drawer.
     ────────────────────────────────────────────────────────── */
  if (consensus.length) {
    const rows = consensus.slice(0, 16).map(c => {
      const plats = QBANKS.map(p => ({ id: p.id, on: !!c.members[p.id] }));
      const banks = QBANKS.filter(p => c.members[p.id]).map(p =>
        `<span class="echip" style="color:${platColor(p.id)}" data-go-platform="${esc(p.id)}">${esc(platName(p.id))}</span>`).join("");
      const trail = `${consensusMark(c.n, plats)} <span class="hy-mass num">${fmt(c.mcqs)}</span>`;
      return listRow({
        lead: consensusMark(c.n, plats, { glyph: true }),
        title: esc(c.lead.name),
        sub: `<a class="echip" data-go-subject="${esc(c.canon)}">${esc(c.canon)}</a> · ${banks}`,
        trail,
        go: undefined,
      }).replace('class="lrow"', `class="lrow is-link" data-open-leaf="${esc(c.lead.id)}" role="button" tabindex="0"`);
    });
    const consensusPanel = panel({
      title: `Consensus — banks agree ★★★`,
      epi: "proxy",
      // Calvetra-derived proxy (cross-bank ★★★ agreement over measured counts):
      // method disclosed in the cf-note below. No third-party source attached —
      // SS_SRC (reputation blogs) does NOT substantiate this density computation.
      sourceIds: undefined,
      captured: CAP,
      curated: true,
      actions: `<button type="button" class="linkbtn" data-hy-howrate>How we rate ↗</button> <span class="count-pill">${consensus.length} topics</span>`,
      body: groupList(rows, "hy-consensus")
        + `<div class="cf-note">Agreement on MCQ density across two or more independent banks for the same topic — the strongest prioritisation signal buildable today (still a proxy for exam weight, not measured consensus). Click a topic to track it or jump to the bank.</div>`,
    });

    /* Companion compact subject-density panel (right column on desktop) — the
       subjects carrying the most consensus topics, each with combined mass +
       a within-set density bar (proxy). Reinforces the same signal at the
       subject grain; on mobile it stacks below the consensus list (no density
       penalty — it's a summary of data already on the page). */
    const denseSubj = subjects
      .map(cs => ({ cs, con: consensusByCanon[cs] || 0, mass: subjTotal(cs) }))
      .filter(s => s.mass > 0)
      .sort((a, b) => (b.con - a.con) || (b.mass - a.mass))
      .slice(0, 8);
    const denseMax = Math.max(1, ...denseSubj.map(s => s.mass));
    const denseRows = denseSubj.map(s => {
      const t = s.mass / denseMax;
      const w = Math.max(6, Math.round(t * 100));
      const dens = `<span class="hy-dbar"><i style="width:${w}%;background:${yieldFill(t)}"></i></span>`;
      const conChip = s.con ? `<span class="hy-concount" title="${s.con} consensus topic${s.con > 1 ? "s" : ""} (proxy)">${s.con}×★★★</span>` : `<span class="hy-concount none">—</span>`;
      return listRow({
        title: `<a class="hy-jump is-link" data-go-subject="${esc(s.cs)}">${esc(s.cs)}</a>`,
        trail: `${dens}${conChip}<span class="hy-q num">${fmt(s.mass)}</span>`,
      }).replace('class="lrow"', 'class="lrow"');
    });
    const densePanel = panel({
      title: `Where the density sits`,
      epi: "proxy",
      sourceIds: undefined,
      captured: CAP,
      curated: true,
      actions: `<span class="count-pill">top ${denseSubj.length} subjects</span>`,
      body: groupList(denseRows, "hy-dlist hy-densesum")
        + `<div class="cf-note">Combined MCQ mass (measured) per subject with its consensus-topic count (proxy). A compact read of where prioritisation effort concentrates. Click a subject to open it.</div>`,
    });

    const grid = el("div", "panel-grid hy-consensus-grid");
    grid.setAttribute("data-reveal", "");
    grid.innerHTML = consensusPanel + densePanel;
    v.appendChild(grid);
  }

  /* ──────────────────────────────────────────────────────────
     Per-subject density — top topics by hyScore, as inset groupLists.
     One subject open (12 topics) or top-5 picks per subject (all view).
     Each row: density bar (proxy) + consensusMark trail + status dots.
     Row → topic drawer (data-open-leaf, tracking preserved).
     ────────────────────────────────────────────────────────── */
  const showSubjects = hySubject === "all" ? subjects : [hySubject];
  const perN = hySubject === "all" ? 5 : 12;
  let plateNo = 1;

  showSubjects.forEach(cs => {
    // gather this subject's leaves across banks, density-ranked
    const leaves = [];
    QBANKS.forEach((p, i) => {
      const so = subjMaps[i][cs];
      if (so) LEAVES.filter(l => l.platform === p.id && l.subject === so.subject && hyLeafMatch(l)).forEach(l => leaves.push(l));
    });
    leaves.sort((a, b) => b.hyScore - a.hyScore);
    const top = leaves.slice(0, perN);
    const maxQ = Math.max(1, ...top.map(l => l.mcqs));
    const strongPid = strongBy[cs];

    const rows = top.map(l => {
      const w = Math.max(6, Math.round(l.mcqs / maxQ * 100));
      const t = l.mcqs / maxQ;
      const dens = `<span class="hy-dbar"><i style="width:${w}%;background:${yieldFill(t)}"></i></span>`;
      // does another bank also flag this topic ★★★? (consensus pip on the row)
      const others = bestCrossByPlat(l);
      const plats = QBANKS.map(p => ({ id: p.id, on: p.id === l.platform ? l.priority === 3 : !!(others[p.id] && others[p.id].priority === 3) }));
      const agree = plats.filter(x => x.on).length;
      const trail = `${dens}${consensusMark(agree, plats, { glyph: true })}<span class="hy-q num">${statusDots(l.id)} ${fmt(l.mcqs)}</span>`;
      return listRow({
        lead: `<span class="hy ${l.priority === 3 ? "" : "med"}">${priStars(l.priority) || "★"}</span>`,
        title: esc(l.name),
        sub: `<span style="color:${platColor(l.platform)}">${esc(platName(l.platform))}</span>`,
        trail,
      }).replace('class="lrow"', `class="lrow is-link" data-open-leaf="${esc(l.id)}" role="button" tabindex="0"`);
    });

    const head = `<div class="ph"><div class="ph-l">`
      + `<h3><a class="hy-jump is-link" data-go-subject="${esc(cs)}">${esc(cs)}</a></h3>`
      + `<span class="muted hy-sh">${fmt(subjTotal(cs))} combined MCQs ${epiBadge("measured")}`
      + (strongPid ? ` · reputed strongest <span class="hy-best" style="color:${platColor(strongPid)}" data-go-platform="${esc(strongPid)}">${esc(platName(strongPid))}</span> ${epiBadge("directional")}` : "")
      + `</span></div>`
      + `<span class="count-pill">density ${epiBadge("proxy")}</span></div>`;

    const sec = el("section", "panel hy-panel");
    sec.setAttribute("data-reveal", "");        // gentle rise on entrance (shared reveal)
    sec.innerHTML = head
      + (strongPid && SS_SRC.length ? srcLine(SS_SRC, CAP) : "")
      + `<div class="panel-body">${top.length ? groupList(rows, "hy-dlist") : hyEmpty(cs)}</div>`;
    v.appendChild(sec);
    plateNo++;
  });

  // make every Pl. N plate-number a keyboard+pointer affordance for the metaphor
  // sheet (idempotent per-render: attribute stamping is safe to repeat).
  $$(".hy-frame .plate-no", v).forEach(no => {
    no.setAttribute("data-plate-explain", "");
    no.setAttribute("tabindex", "0");
    no.setAttribute("role", "button");
    no.setAttribute("aria-label", "What this engraved plate means");
  });

  // Delegated view-level handlers — bound ONCE on #view-hy (a render-survivor:
  // v.innerHTML="" clears children but not listeners on v itself). The guard flag
  // prevents the stack-up that would otherwise duplicate every renderHY() the
  // status/subject filters trigger. (Pre-existing "How we rate" listener folded in.)
  if (!v.dataset.hyBound) {
    v.dataset.hyBound = "1";
    const explainFrom = t => { const pn = t.closest("[data-plate-explain]"); if (pn) { hyExplainPlate(pn.closest(".cframe.plate")); return true; } return false; };
    v.addEventListener("click", e => {
      if (e.target.closest("[data-hy-howrate]")) { e.preventDefault(); hyGotoMethodology(); return; }
      if (e.target.closest("[data-hy-clearstatus]")) { e.preventDefault(); hyStatus = "all"; renderHY(); return; }
      // .plate-no explains the engraved-plate metaphor + jumps to imprint sources.
      // Self-wired (appClick has no data-plate-explain handler yet — shared gap).
      if (explainFrom(e.target)) e.preventDefault();
    });
    v.addEventListener("keydown", e => {
      if ((e.key === "Enter" || e.key === " ") && e.target.closest && e.target.closest("[data-plate-explain]")) {
        e.preventDefault(); explainFrom(e.target);
      }
    });
  }

  labelizeResponsiveTables();
  // renderHY() is reached DIRECTLY (subject/status filters, sheet callbacks, clear-status click) —
  // bypassing show()'s central animateView(). Without this, the fresh [data-reveal] panels (proxy note,
  // consensus/dense grids, per-subject plates) stay opacity:0 → the whole HY view is invisible for
  // motion-OK users until they leave + return. Idempotent (once-only IO + data-done), mirroring
  // tests.js / qbank.js / overview.js, so the show()-path call stays harmless.
  if (typeof animateView === "function") animateView($("#view-hy"));
}

/* Richer empty state — "a plate awaiting its engraving", not a missing thing.
   Local stand-in until the shared ds.emptyState() primitive lands (noted in the
   return for the integrator). Monochrome stroke-only mark (NEVER color → keeps
   the firewall + warm-almanac identity), serif title, meta body, a clear-filter
   CTA when a status filter is the reason the plate is bare. Reads honestly: the
   topics exist, this filter just hides them. */
function hyEmpty(cs) {
  const filtered = hyStatus !== "all";
  return emptyState({
    icon: "quill",
    title: filtered ? "No topics under this filter" : "This plate is unengraved",
    body: filtered
      ? `${esc(cs)} has density topics, but none match <b>${esc((HY_STATUS_OPTS.find(o => o[0] === hyStatus) || ["", hyStatus])[1])}</b> yet.`
      : `No ranked density topics for ${esc(cs)} in the captured banks.`,
    action: filtered ? { label: "Show all statuses ↗", attrs: "data-hy-clearstatus" } : null,
  });
}

/* Navigate to Overview and reveal the "How we rate · sources" firewall panel.
   Works from any surface: switches the view first, then scrolls #howrate in. */
function hyGotoMethodology() {
  show("overview");
  requestAnimationFrame(() => {
    const m = document.getElementById("howrate");
    if (m) m.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/* Explain the engraved-plate metaphor + jump to this plate's imprint sources.
   "Pl. N" plates are this app's signature: every chart is an engraved plate with
   an epistemic label + cited imprint. The sheet teaches that, then (if the plate
   carries sources) hands off to readPlateSheet so the firewall context is one tap
   away on mobile. Falls back gracefully if openSheet is unavailable. */
function hyExplainPlate(plate) {
  if (typeof openSheet !== "function") return;
  const epiEl = plate && plate.querySelector(".cf-epi");
  const epi = epiEl ? epiEl.dataset.readPlate : "";
  const src = epiEl ? epiEl.dataset.readSrc : "";
  const cap = epiEl ? epiEl.dataset.readCap : "";
  const titleEl = plate && plate.querySelector(".cf-title");
  const which = titleEl ? titleEl.textContent.trim() : "this plate";
  const opts = [
    ["_about", "Each chart is an engraved “plate”"],
    ["_epi", "Read its epistemic label" + (epi ? ` — ${epiName(epi)}` : "")],
  ];
  if (src) opts.push(["_sources", "Jump to the cited imprint sources ↗"]);
  openSheet("Pl. — " + which, opts, "_about", v => {
    if (v === "_sources" || v === "_epi") readPlateSheet(epi, src, cap);
  });
}

/* wrap a chartFrame string into an element so we can appendChild.
   [data-reveal] → the shared reveal() (run by animateView post-render) gives each
   frame ONE gentle rise+fade on entrance (staggered, cap 4). chartIntro() finds
   the inner .cframe.plate on its own. Both collapse to final state under the
   reduced-motion firewall, so the plate is never stuck invisible. */
function _frame(html) { const d = el("div", "hy-frame"); d.setAttribute("data-reveal", ""); d.innerHTML = html; return d; }
