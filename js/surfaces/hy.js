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

  /* ── 6 stat-tiles (mobile 2/3-col, 84–104px). One hero serif numeral. ── */
  const tiles = el("div", "tiles hy-tiles");
  tiles.innerHTML =
    statTile({ accent: "g", hero: true, value: fmt(hyAll.length), label: "Top-density topics", note: `★★★ across ${QBANKS.length} banks`, epi: "proxy" }) +
    statTile({ accent: "c", value: fmt(consensus.length), label: "Consensus topics", note: "≥2 banks agree ★★★", epi: "proxy" }) +
    statTile({ accent: "m", value: pct(hyDone, hyAll.length) + "%", label: "You've started", note: `${hyDone} of ${fmt(hyAll.length)}`, epi: "measured" }) +
    statTile({ accent: "g", value: fmt(hyAll.length - hyDone), label: "Density gaps", note: "untouched ★★★", epi: "measured" }) +
    statTile({ accent: "k", value: fmt(subjTotal(topSubj)), label: "Heaviest subject", note: esc(topSubj), epi: "measured", go: "subject:" + topSubj }) +
    statTile({ accent: "m", value: pct(hhRev, hh.length) + "%", label: "★★+ reviewed", note: "depth of revision", epi: "measured" });
  v.appendChild(tiles);

  /* ── honest proxy framing (the badge-in-view requirement) ── */
  v.appendChild(el("div", "callout proxy-note",
    `<b>This tab ranks MCQ density ${epiBadge("proxy")} — a proxy, not measured exam yield.</b>
     ★★★ marks the topics carrying the most question mass <em>within their subject</em> (Marrow: star-rating × MCQ share · Cerebellum: volume × density · DocTutorials: MCQ share).
     We hold no PYQ-weighted exam-frequency data, so we never claim real "high-yield" — it's an honest prioritisation signal. The strongest signal we can build is <b>consensus</b>: a topic that two or more independent banks both flag.
     <span class="muted">Click any subject or topic to open it. Full method → <button type="button" class="linkbtn" data-hy-howrate>How we rate ↗</button></span>`));

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

  // Source attribution: the density + consensus figure is a Meridian-derived proxy
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
    v.appendChild(_frame(panel({
      title: `Consensus — banks agree ★★★`,
      epi: "proxy",
      // Meridian-derived proxy (cross-bank ★★★ agreement over measured counts):
      // method disclosed in the cf-note below. No third-party source attached —
      // SS_SRC (reputation blogs) does NOT substantiate this density computation.
      sourceIds: undefined,
      captured: CAP,
      curated: true,
      actions: `<button type="button" class="linkbtn" data-hy-howrate>How we rate ↗</button> <span class="count-pill">${consensus.length} topics</span>`,
      body: groupList(rows, "hy-consensus")
        + `<div class="cf-note">Agreement on MCQ density across two or more independent banks for the same topic — the strongest prioritisation signal buildable today (still a proxy for exam weight, not measured consensus). Click a topic to track it or jump to the bank.</div>`,
    })));
  }

  /* ── ONE sticky toolbar — shared idiom with QBank: native <select> on desktop
        (desk-ctrl) + icon-button → bottom-sheet (mob-ctrl) on mobile. Subject is a
        large dynamic set; status reuses HY_STATUS_OPTS. ── */
  const HY_SUBJ_OPTS = [["all", "All subjects (top picks each)"]].concat(subjects.map(s => [s, s]));
  // reuse the .qb-controls container class so the established responsive toggle
  // (desk-ctrl native selects on desktop · mob-ctrl icon-buttons → sheet on mobile)
  // applies here too — one shared toolbar idiom, no per-surface CSS.
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
     <div class="spacer"></div><span class="count-pill">click a topic → detail card</span>`;
  v.appendChild(ctr);
  $("#hysub").value = hySubject; $("#hystatus").value = hyStatus;
  $("#hysub").addEventListener("change", e => { hySubject = e.target.value; renderHY(); });
  $("#hystatus").addEventListener("change", e => { hyStatus = e.target.value; renderHY(); });
  // mobile: subject/status open a bottom-sheet (same openSheet helper QBank uses)
  $("#hySubBtn")?.addEventListener("click", () => openSheet("Choose subject", HY_SUBJ_OPTS, hySubject, val => { hySubject = val; renderHY(); }));
  $("#hyStatusBtn")?.addEventListener("click", () => openSheet("Filter by status", HY_STATUS_OPTS, hyStatus, val => { hyStatus = val; renderHY(); }));
  $("#hyStatusBtn")?.classList.toggle("has-dot", hyStatus !== "all");

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
    sec.innerHTML = head
      + (strongPid && SS_SRC.length ? srcLine(SS_SRC, CAP) : "")
      + `<div class="panel-body">${top.length ? groupList(rows, "hy-dlist") : `<div class="empty small">No topics match this filter.</div>`}</div>`;
    v.appendChild(sec);
    plateNo++;
  });

  // reusable, always-working "How we rate" affordance (firewall surface).
  // The methodology panel only lives on Overview (id=howrate); a plain "#howrate"
  // link is dead while another tab is active, so we navigate THEN scroll.
  v.addEventListener("click", e => {
    if (e.target.closest("[data-hy-howrate]")) { e.preventDefault(); hyGotoMethodology(); }
  });

  labelizeResponsiveTables();
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

/* wrap a chartFrame string into an element so we can appendChild */
function _frame(html) { const d = el("div", "hy-frame"); d.innerHTML = html; return d; }
