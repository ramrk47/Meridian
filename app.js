/* ===== Meridian — cross-platform exam almanac ===== */
const D = window.QBANK_DATA;   // exam-agnostic model: { exam, platforms[], tests, videos } (QBANK_DATA aliases window.D)
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => (n == null ? "—" : n.toLocaleString("en-IN"));
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---- canonical subject names across platforms ---- */
const CANON = {
  "Anatomy":"Anatomy","Physiology":"Physiology","Biochemistry":"Biochemistry","Pharmacology":"Pharmacology",
  "Microbiology":"Microbiology","Pathology":"Pathology","Community Medicine":"Community Medicine / PSM",
  "Preventive & Social Medicine":"Community Medicine / PSM","Forensic Medicine":"Forensic Medicine",
  "Ophthalmology":"Ophthalmology","ENT":"ENT","Anaesthesia":"Anaesthesia","Anesthesia":"Anaesthesia",
  "Dermatology":"Dermatology","Psychiatry":"Psychiatry","Radiology":"Radiology","Medicine":"Medicine",
  "Surgery":"Surgery","Orthopaedics":"Orthopaedics","Orthopedics":"Orthopaedics","Paediatrics":"Paediatrics",
  "Pediatrics":"Paediatrics","Obstetrics & Gynaecology":"Obstetrics & Gynaecology","Obstetrics & Gynecology":"Obstetrics & Gynaecology",
  // new-platform aliases (DocTutorials / PrepLadder / eGurukul)
  "PSM":"Community Medicine / PSM","OB & G":"Obstetrics & Gynaecology","OBG":"Obstetrics & Gynaecology",
  "Gynaecology & Obstetrics":"Obstetrics & Gynaecology","Obs & Gynae":"Obstetrics & Gynaecology",
};
const canon = s => CANON[s] || s;
const PYQ = "Previous Year Question Papers";

/* ---- platform registry (N-platform; no hardcoded marrow/cerebellum keys) ---- */
const PLATFORMS = D.platforms;
const QBANKS = PLATFORMS.filter(p => p.kind === "qbank");
const PLAT_BY_ID = Object.fromEntries(PLATFORMS.map(p => [p.id, p]));
const platName = id => PLAT_BY_ID[id]?.name || id;
const platCls = id => PLAT_BY_ID[id]?.cls || "m";          // maps to .m/.c/.k color hooks in styles.css
const platColor = id => PLAT_BY_ID[id]?.color || "var(--marrow)";
const platInitial = id => (platName(id)[0] || "?").toUpperCase();
// precompute per-subject MCQ totals once (subject summaries derive from the modules themselves)
PLATFORMS.forEach(p => p.subjects.forEach(s => { s._mcqs = s.modules.reduce((a, m) => a + m.mcqs, 0); }));
const freshSubjects = p => p.subjects.filter(s => s.subject !== PYQ);   // drop PYQ paper bucket from rollups

/* ---- totals ---- */
const platMCQ = id => PLAT_BY_ID[id].subjects.reduce((a, s) => a + s._mcqs, 0);
const platMods = id => PLAT_BY_ID[id].subjects.reduce((a, s) => a + s.modules.length, 0);
const QBANK_MCQ = QBANKS.reduce((a, p) => a + platMCQ(p.id), 0);   // all integrated banks combined

/* ---- flat leaf index (every platform's modules/units/chapters) ---- */
const LEAVES = [];
PLATFORMS.forEach(p => p.subjects.forEach(s => s.modules.forEach(m => LEAVES.push({
  id: m.id, platform: p.id, name: m.name, subject: s.subject, canon: canon(s.subject),
  cat: m.category || null, rating: m.rating ?? null, mcqs: m.mcqs, modulesCount: m.modulesCount ?? null,
  priority: m.priority, hyScore: m.hyScore,
}))));
const LEAF_BY_ID = Object.fromEntries(LEAVES.map(l => [l.id, l]));
const allModuleIds = LEAVES.map(l => l.id);

/* subject lookups */
function subjectsOf(platform) {                       // PYQ paper bucket (if any) sorts last
  const p = PLAT_BY_ID[platform]; if (!p) return [];
  return [...freshSubjects(p), ...p.subjects.filter(s => s.subject === PYQ)].map(s => s.subject);
}
function subjMeta(platform, subject) {
  const s = PLAT_BY_ID[platform]?.subjects.find(x => x.subject === subject);
  return s ? { subject, mcqs: s._mcqs, modules: s.modules.length } : null;
}
function leavesOf(platform, subject) { return LEAVES.filter(l => l.platform === platform && l.subject === subject); }
/* group by category when the platform has one (Marrow); otherwise a single flat group */
function treeOf(platform, subject) {
  const ls = leavesOf(platform, subject);
  if (!ls.some(l => l.cat)) return [{ cat: null, items: ls }];
  const map = new Map();
  ls.forEach(l => { if (!map.has(l.cat)) map.set(l.cat, []); map.get(l.cat).push(l); });
  return [...map.entries()].map(([cat, items]) => ({ cat, items }));
}
/* the platform's "unit" noun for headers (modules vs units vs chapters) */
const platUnitNoun = id => id === "marrow" ? "modules" : id === "doctutorials" ? "chapters" : "units";

/* rollups */
function rollup(ids) { let a = 0, r = 0, t = 0; ids.forEach(id => { const p = Store.prog(id); if (p.a) a++; if (p.r) r++; if (p.t) t++; }); return { a, r, t, total: ids.length }; }
function rollupLeaves(ls) { return rollup(ls.map(l => l.id)); }

/* priority */
const priStars = p => (p === 3 ? "★★★" : p === 2 ? "★★" : "");
const hyBadge = p => p === 3 ? `<span class="hy" title="High-yield">★★★</span>` : p === 2 ? `<span class="hy med" title="Medium-yield">★★</span>` : "";

/* cross-platform topic matching */
const STOP = new Set("and the of for with system systems disease diseases its his amp general basic concepts tricks magics drugs drug disorders disorder management basics introduction clinical miscellaneous related".split(" "));
const _tokCache = new Map();
function toksC(s) { if (_tokCache.has(s)) return _tokCache.get(s); const t = new Set((s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w))); _tokCache.set(s, t); return t; }
function sim(a, b) { const ta = toksC(a), tb = toksC(b); if (!ta.size || !tb.size) return 0; let i = 0; ta.forEach(w => { if (tb.has(w)) i++; }); return i / Math.min(ta.size, tb.size); }
function scoredCross(leaf) {     // matches on ANY other platform sharing the canonical subject
  const pool = LEAVES.filter(l => l.platform !== leaf.platform && l.canon === leaf.canon);
  return pool.map(l => ({ l, s: Math.max(sim(leaf.name, l.name), leaf.cat ? sim(leaf.cat, l.name) * 0.7 : 0) })).filter(x => x.s >= 0.34).sort((a, b) => b.s - a.s);
}
function crossMatches(leaf, limit = 6) { return scoredCross(leaf).slice(0, limit).map(x => x.l); }
const _bestCross = new Map();
function bestCross(leaf) {       // single most-confident match across all other platforms
  if (_bestCross.has(leaf.id)) return _bestCross.get(leaf.id);
  const top = scoredCross(leaf)[0];
  const res = top && top.s >= 0.5 ? top : null; // only confident matches
  _bestCross.set(leaf.id, res); return res;
}
const _bestCrossByPlat = new Map();
function bestCrossByPlat(leaf) { // { platformId: bestLeaf } — best confident match per other platform
  if (_bestCrossByPlat.has(leaf.id)) return _bestCrossByPlat.get(leaf.id);
  const out = {};
  scoredCross(leaf).forEach(({ l, s }) => { if (s >= 0.5 && !out[l.platform]) out[l.platform] = l; });
  _bestCrossByPlat.set(leaf.id, out); return out;
}
function siblings(leaf, limit = 8) {
  let pool;
  if (leaf.cat) pool = LEAVES.filter(l => l.platform === leaf.platform && l.subject === leaf.subject && l.cat === leaf.cat && l.id !== leaf.id);
  else pool = LEAVES.filter(l => l.platform === leaf.platform && l.subject === leaf.subject && l.id !== leaf.id);
  return pool.slice(0, limit);
}

/* tests index */
function buildTests() {
  const out = [];
  D.tests.corebtr.forEach(t => out.push({ id: t.id, platform: "CoreBTR", name: t.name, q: t.questions, status: t.status }));
  D.tests.gt2026.forEach(t => out.push({ id: t.id, platform: "Cerebellum", name: t.name, q: +t.questions || null, status: t.date }));
  Store.state.customTests.forEach(t => out.push({ ...t, custom: true }));
  return out;
}
function relatedTests(canonSubj) {
  // match a test if its name contains the subject's first word OR any alias mapping to this subject
  const key = canonSubj.toLowerCase().replace(/ \/.*/, "").split(" ")[0];
  const aliasKeys = Object.keys(TEST_ALIASES).filter(k => TEST_ALIASES[k] === canonSubj);
  return buildTests().filter(t => {
    const n = t.name.toLowerCase();
    return n.includes(key) || aliasKeys.some(k => new RegExp("\\b" + k + "\\b").test(n));
  }).slice(0, 6);
}

/* ============================================================
   OVERVIEW
   ============================================================ */
function renderOverview() {
  const v = $("#view-overview"); v.innerHTML = "";

  const att = allModuleIds.filter(id => Store.prog(id).a).length;
  const rev = allModuleIds.filter(id => Store.prog(id).r).length;
  const scored = Object.keys(Store.state.scores).length;
  const hyTotal = LEAVES.filter(l => l.priority === 3).length;
  const hyDone = LEAVES.filter(l => l.priority === 3 && Store.prog(l.id).a).length;

  const mastered = allModuleIds.filter(id => Store.prog(id).t).length;
  const stats = el("div", "statgrid tiles");
  const card = (cls, big, lbl, note) => `<div class="stat ${cls}"><div class="big">${big}</div><div class="lbl">${lbl}</div><div class="note">${note}</div></div>`;
  stats.innerHTML =
    card("g", fmt(QBANK_MCQ), "Combined MCQs", `${fmt(allModuleIds.length)} topics · ${QBANKS.length} banks`) +
    card("m", `${pct(att, allModuleIds.length)}%`, "Attempted", `${fmt(att)} of ${fmt(allModuleIds.length)}`) +
    card("k", fmt(rev), "Reviewed", `2nd-pass topics`) +
    card("c", `${pct(hyDone, hyTotal)}%`, "High-yield", `${hyDone} of ${hyTotal} ★★★`) +
    card("g", fmt(hyTotal - hyDone), "HY gaps", `untouched ★★★`) +
    card("k", fmt(scored), "Tests scored", `${mastered} mastered`);
  v.appendChild(stats);

  // two-up: continue + next moves
  const grid = el("div", "two-col");
  // continue where you left off
  const recent = Object.entries(Store.state.progress)
    .filter(([id]) => LEAF_BY_ID[id]).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0)).slice(0, 6).map(([id]) => LEAF_BY_ID[id]);
  const contPanel = el("div", "panel");
  contPanel.innerHTML = `<div class="ph"><div><h3>Continue where you left off</h3>
    <span class="muted" style="font-size:12px">your most recently tracked modules</span></div></div>`;
  if (recent.length) {
    const lst = el("div", "mini-list");
    recent.forEach(l => lst.appendChild(el("div", "mini-row",
      `<span class="dot ${platCls(l.platform)}" style="background:${platColor(l.platform)}"></span>
       <span class="mini-n" data-open-leaf="${l.id}">${esc(l.name)}</span>
       <span class="mini-sub">${esc(l.canon)} · ${esc(platName(l.platform))}</span>
       ${statusDots(l.id)}`)));
    contPanel.appendChild(lst);
  } else {
    contPanel.appendChild(el("div", "empty", "No modules tracked yet. Open the <b>QBank Tracker</b> and tick a few — your trail shows up here."));
  }
  grid.appendChild(contPanel);

  // next best moves (untracked high-yield)
  const nextPanel = el("div", "panel");
  nextPanel.innerHTML = `<div class="ph"><div><h3>Your next best moves</h3>
    <span class="muted" style="font-size:12px">high-yield topics you haven't started</span></div>
    <button class="linkbtn" data-jump-hygaps>See all gaps →</button></div>`;
  const gaps = LEAVES.filter(l => l.priority === 3 && !Store.prog(l.id).a).sort((a, b) => b.hyScore - a.hyScore).slice(0, 6);
  const nlst = el("div", "mini-list");
  gaps.forEach(l => nlst.appendChild(el("div", "mini-row",
    `<span class="hy">★★★</span>
     <span class="mini-n" data-open-leaf="${l.id}">${esc(l.name)}</span>
     <span class="mini-sub">${esc(l.canon)} · ${fmt(l.mcqs)} MCQs</span>
     <button class="qmark" data-quick-a="${l.id}" title="Mark attempted">+</button>`)));
  nextPanel.appendChild(nlst);
  grid.appendChild(nextPanel);
  v.appendChild(grid);

  // comparison bars (clickable -> jump) — one bar per QBank, per subject
  const panel = el("div", "panel");
  panel.innerHTML = `<div class="ph"><div><h3>MCQ volume by subject — ${QBANKS.map(p => esc(p.name)).join(" · ")}</h3>
    <span class="muted" style="font-size:12px">click a subject to open it in the tracker</span></div>
    <div class="legend">${QBANKS.map(p => `<span><i style="background:${p.color}"></i>${esc(p.name)}</span>`).join("")}</div></div>`;
  const bars = el("div", "bars");
  const maps = QBANKS.map(p => Object.fromEntries(freshSubjects(p).map(s => [canon(s.subject), s._mcqs])));
  const subs = [...new Set(maps.flatMap(m => Object.keys(m)))];
  const subTotal = s => maps.reduce((a, m) => a + (m[s] || 0), 0);
  const maxV = Math.max(1, ...subs.map(s => Math.max(...maps.map(m => m[s] || 0))));
  subs.sort((a, b) => subTotal(b) - subTotal(a));
  subs.forEach(s => {
    const track = QBANKS.map((p, i) => {
      const val = maps[i][s] || 0;
      return `<div class="bar ${p.cls}" style="width:${(val / maxV * 100).toFixed(1)}%;background:${p.color}"><span class="val${val / maxV < .22 ? " out" : ""}">${fmt(val)}</span></div>`;
    }).join("");
    bars.appendChild(el("div", "barrow clickable", `<div class="name" data-jump-subj="${esc(s)}">${esc(s)}</div><div class="track">${track}</div>`));
  });
  panel.appendChild(bars);
  v.appendChild(panel);
}
function statusDots(id) {
  const p = Store.prog(id);
  return `<span class="sdots">${["a","r","t"].map(k => `<i class="sd ${k} ${p[k] ? "on" : ""}"></i>`).join("")}</span>`;
}

/* ============================================================
   QBANK TRACKER — sidebar workspace + 3-level tree
   ============================================================ */
const QB = { platform: "marrow", subject: null, sort: "hy", status: "all", hyOnly: false, search: "", subjSort: "size" };
const QB_SORT_OPTS = [["hy", "High-yield"], ["mcqs", "Most MCQs"], ["rating", "Rating / difficulty"], ["name", "A–Z"], ["leastdone", "Least attempted"], ["completion", "Least complete"]];
const QB_STATUS_OPTS = [["all", "All statuses"], ["untracked", "Yet to attempt"], ["attempted", "Attempted"], ["review", "Needs review"], ["mastered", "Mastered (retaken)"], ["starred", "My starred"], ["hard", "High difficulty (top-rated)"]];
function qbDefaultSubject() { const s = subjectsOf(QB.platform); return s[0]; }
/* N-way platform switch: segmented up to 3 banks, dropdown beyond */
function qbankSwitchHTML() {
  if (QBANKS.length > 3) {
    return `<select class="sel mini" id="qplat" title="QBank platform">${QBANKS.map(p =>
      `<option value="${p.id}" ${QB.platform === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>`;
  }
  return `<div class="seg" id="qseg">${QBANKS.map(p =>
    `<button data-p="${p.id}" class="${QB.platform === p.id ? "on" : ""}"${QB.platform === p.id ? ` style="background:${p.color};color:#fff"` : ""}>${esc(p.name)}</button>`).join("")}</div>`;
}
function switchQbankPlatform(id) {
  if (!id || id === QB.platform || !PLAT_BY_ID[id]) return;
  const prevCanon = QB.subject ? canon(QB.subject) : null;   // land on the same topic across banks
  QB.platform = id;
  const list = subjectsOf(QB.platform);
  QB.subject = (prevCanon && list.find(s => canon(s) === prevCanon)) || qbDefaultSubject();
  QB.search = ""; renderQbank();
}

function renderQbank() {
  const v = $("#view-qbank"); v.innerHTML = "";
  if (!QB.subject || !subjectsOf(QB.platform).includes(QB.subject)) QB.subject = qbDefaultSubject();

  const layout = el("div", "qb-layout");
  layout.innerHTML = `
    <aside class="qb-side">
      <div class="qb-side-top">
        ${qbankSwitchHTML()}
        <select class="sel mini" id="qSubjSort" title="Order subjects">
          <option value="size">By size</option><option value="alpha">A–Z</option>
          <option value="completion">By completion</option><option value="gaps">By high-yield gaps</option>
        </select>
      </div>
      <div class="sb-list" id="sbList"></div>
    </aside>
    <div class="qb-main">
      <div class="qb-controls" id="qbControls">
        <input class="search" id="qsearch" placeholder="Search ${esc(platName(QB.platform))} topics…" value="${esc(QB.search)}">
        <select class="sel desk-ctrl" id="qsort" aria-label="Sort topics">
          ${QB_SORT_OPTS.map(([v, l]) => `<option value="${v}">Sort: ${l}</option>`).join("")}
        </select>
        <select class="sel desk-ctrl" id="qstatus" aria-label="Filter topics">
          ${QB_STATUS_OPTS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}
        </select>
        <button class="iconbtn mob-ctrl" id="qSortBtn" aria-label="Sort topics" title="Sort">⇅</button>
        <button class="iconbtn mob-ctrl" id="qFilterBtn" aria-label="Filter topics" title="Filter">⛁</button>
        <button class="chipbtn ${QB.hyOnly ? "on" : ""}" id="qHy" title="High-yield only">★<span class="ctrl-lbl"> High-yield</span></button>
        <div class="spacer"></div>
        <button class="ghostbtn desk-ctrl" id="qExpand" title="Expand all">⊕ Expand</button>
        <button class="ghostbtn desk-ctrl" id="qCollapse" title="Collapse all">⊖ Collapse</button>
      </div>
      <div class="qb-content" id="qbContent"></div>
    </div>`;
  v.appendChild(layout);

  $("#qsort").value = QB.sort; $("#qstatus").value = QB.status; $("#qSubjSort").value = QB.subjSort;
  // wiring — platform switch is segmented (≤3 banks) or a dropdown (>3)
  const qseg = $("#qseg"); if (qseg) qseg.addEventListener("click", e => { const b = e.target.closest("button"); if (b) switchQbankPlatform(b.dataset.p); });
  const qplat = $("#qplat"); if (qplat) qplat.addEventListener("change", e => switchQbankPlatform(e.target.value));
  $("#qSubjSort").addEventListener("change", e => { QB.subjSort = e.target.value; drawSidebar(); });
  $("#qsearch").addEventListener("input", e => { QB.search = e.target.value; drawSidebar(); drawSubject(); });
  $("#qsort").addEventListener("change", e => { QB.sort = e.target.value; drawSubject(); });
  $("#qstatus").addEventListener("change", e => { QB.status = e.target.value; drawSidebar(); drawSubject(); });
  $("#qHy").addEventListener("click", () => { QB.hyOnly = !QB.hyOnly; $("#qHy").classList.toggle("on", QB.hyOnly); updateQbFilterBadge(); drawSidebar(); drawSubject(); });
  $("#qExpand").addEventListener("click", () => $$(".cat-block", $("#qbContent")).forEach(b => b.classList.add("open")));
  $("#qCollapse").addEventListener("click", () => $$(".cat-block", $("#qbContent")).forEach(b => b.classList.remove("open")));
  // mobile: sort/filter open a bottom-sheet instead of native selects
  $("#qSortBtn")?.addEventListener("click", () => openSheet("Sort topics", QB_SORT_OPTS, QB.sort, val => { QB.sort = val; const s = $("#qsort"); if (s) s.value = val; drawSubject(); }));
  $("#qFilterBtn")?.addEventListener("click", () => openSheet("Filter by status", QB_STATUS_OPTS, QB.status, val => { QB.status = val; const s = $("#qstatus"); if (s) s.value = val; updateQbFilterBadge(); drawSidebar(); drawSubject(); }));
  updateQbFilterBadge();

  drawSidebar(); drawSubject();
}
function leafMatchesFilters(l) {
  if (QB.hyOnly && l.priority !== 3) return false;
  const p = Store.prog(l.id), st = Store.state.stars[l.id];
  switch (QB.status) {
    case "untracked": if (p.a || p.r || p.t) return false; break;
    case "attempted": if (!p.a) return false; break;
    case "review": if (!(p.a && !p.r)) return false; break;
    case "mastered": if (!p.t) return false; break;
    case "starred": if (!st) return false; break;
    case "hard": { const hard = l.rating != null ? l.rating >= 4.5 : l.priority === 3; if (!hard) return false; break; }
  }
  if (QB.search) { const t = QB.search.toLowerCase(); if (!l.name.toLowerCase().includes(t) && !(l.cat || "").toLowerCase().includes(t) && !l.subject.toLowerCase().includes(t)) return false; }
  return true;
}
function subjectMatchCount(subject) { return leavesOf(QB.platform, subject).filter(leafMatchesFilters).length; }
function drawSidebar() {
  const wrap = $("#sbList"); if (!wrap) return; wrap.innerHTML = "";
  let subs = subjectsOf(QB.platform).map(s => {
    const ls = leavesOf(QB.platform, s); const ro = rollupLeaves(ls);
    const hyGaps = ls.filter(l => l.priority === 3 && !Store.prog(l.id).a).length;
    return { s, ls, ro, hyGaps, mcqs: subjMeta(QB.platform, s)?.mcqs || 0, match: subjectMatchCount(s) };
  });
  const filtering = QB.search || QB.status !== "all" || QB.hyOnly;
  if (filtering) subs = subs.filter(x => x.match > 0);
  subs.sort((a, b) => {
    if (QB.subjSort === "alpha") return a.s.localeCompare(b.s);
    if (QB.subjSort === "completion") return pct(b.ro.a, b.ro.total) - pct(a.ro.a, a.ro.total);
    if (QB.subjSort === "gaps") return b.hyGaps - a.hyGaps;
    return b.mcqs - a.mcqs;
  });
  // keep selection valid
  if (filtering && subs.length && !subs.some(x => x.s === QB.subject)) QB.subject = subs[0].s;
  subs.forEach(x => {
    const it = el("button", "sb-item" + (x.s === QB.subject ? " on" : ""));
    it.dataset.subj = x.s;
    it.innerHTML = `<span class="sb-row1"><span class="sb-name">${esc(x.s)}</span>${x.hyGaps ? `<span class="sb-gaps" title="${x.hyGaps} high-yield gaps">${x.hyGaps}</span>` : ""}</span>
      <span class="sb-row2">${meterHTML(x.ro.a, x.ro.total)}${filtering ? `<span class="sb-match">${x.match} match${x.match !== 1 ? "es" : ""}</span>` : `<span class="sb-mcq">${fmt(x.mcqs)}</span>`}</span>`;
    wrap.appendChild(it);
  });
  if (!subs.length) wrap.appendChild(el("div", "empty small", "No subjects match."));
}
function meterHTML(a, total, cls = "") {
  return `<span class="meter ${cls}"><span class="meter-bar"><i style="width:${pct(a, total)}%"></i></span><span class="meter-txt">${a}/${total}</span></span>`;
}
function sortLeaves(arr) {
  const a = [...arr];
  switch (QB.sort) {
    case "mcqs": a.sort((x, y) => y.mcqs - x.mcqs); break;
    case "rating": a.sort((x, y) => (y.rating || y.hyScore) - (x.rating || x.hyScore)); break;
    case "name": a.sort((x, y) => x.name.localeCompare(y.name)); break;
    case "leastdone": case "completion": a.sort((x, y) => (Store.prog(x.id).a - Store.prog(y.id).a) || (y.hyScore - x.hyScore)); break;
    default: a.sort((x, y) => y.hyScore - x.hyScore); // hy
  }
  return a;
}
function drawSubject() {
  const host = $("#qbContent"); if (!host) return; host.innerHTML = "";
  const subject = QB.subject; if (!subject) { host.appendChild(el("div", "empty", "Pick a subject.")); return; }
  const ls = leavesOf(QB.platform, subject);
  const ro = rollupLeaves(ls);
  const meta = subjMeta(QB.platform, subject);
  const others = subjOthers(subject);
  // header
  const head = el("div", "subj-hero");
  head.innerHTML = `
    <div class="sh-top">
      <h2 class="sh-name">${esc(subject)}</h2>
      ${others.map(o => `<button class="linkbtn" data-jump-other="${esc(o.subject)}" data-jump-plat="${o.platform}">↔ ${esc(platName(o.platform))}</button>`).join("")}
    </div>
    <div class="sh-meters">
      <div class="sh-stat"><b>${fmt(meta?.mcqs || 0)}</b><span>MCQs</span></div>
      <div class="sh-stat"><b>${ls.length}</b><span>${platUnitNoun(QB.platform)}</span></div>
      <div class="sh-stat"><b>${pct(ro.a, ro.total)}%</b><span>attempted</span></div>
      <div class="sh-stat"><b>${ro.r}</b><span>reviewed</span></div>
      <div class="sh-stat"><b>${ls.filter(l => l.priority === 3).length}</b><span>high-yield</span></div>
      <div class="sh-progress">${bigMeter(ro)}</div>
    </div>`;
  host.appendChild(head);

  let tree = treeOf(QB.platform, subject);
  if (QB.sort === "completion") tree = [...tree].sort((a, b) => { const ra = rollupLeaves(a.items), rb = rollupLeaves(b.items); return pct(ra.a, ra.total) - pct(rb.a, rb.total); });
  const body = el("div", "tree");
  let shown = 0;
  tree.forEach(group => {
    const items = sortLeaves(group.items.filter(leafMatchesFilters));
    if (!items.length) return;
    shown += items.length;
    if (group.cat == null) {
      // no category level (Cerebellum): render rows directly
      items.forEach(l => body.appendChild(leafRow(l)));
    } else {
      const gro = rollupLeaves(group.items);
      const hy = group.items.filter(l => l.priority === 3).length;
      const block = el("div", "cat-block" + (QB.search || QB.status !== "all" || QB.hyOnly ? " open" : ""));
      block.dataset.cat = group.cat; block.dataset.subject = subject;
      block.innerHTML = `<div class="cat-head" data-cat-toggle>
          <span class="chev">▶</span>
          <span class="cat-name">${esc(group.cat)}</span>
          ${hy ? `<span class="cat-hy" title="${hy} high-yield">★ ${hy}</span>` : ""}
          <span class="cat-meter">${meterHTML(gro.a, gro.total)}</span>
          <span class="cat-mcq">${fmt(group.items.reduce((s, l) => s + l.mcqs, 0))}</span>
          <button class="bulkbtn" data-bulk="${esc(group.cat)}" title="Mark all attempted">✓ all</button>
        </div>
        <div class="cat-body"></div>`;
      const cb = $(".cat-body", block);
      items.forEach(l => cb.appendChild(leafRow(l)));
      body.appendChild(block);
    }
  });
  if (!shown) body.appendChild(el("div", "empty", "No topics match your filters in this subject."));
  host.appendChild(body);
}
function bigMeter(ro) {
  return `<div class="bigmeter"><div class="bm-bar"><i style="width:${pct(ro.a, ro.total)}%"></i><b style="width:${pct(ro.r, ro.total)}%"></b></div>
    <div class="bm-key"><span><i class="k a"></i>${ro.a} attempted</span><span><i class="k r"></i>${ro.r} reviewed</span><span><i class="k t"></i>${ro.t} mastered</span></div></div>`;
}
function coverageBadge(l) {            // one ✓ per other platform where the matched topic is tracked
  const byP = bestCrossByPlat(l);
  return Object.entries(byP).map(([pid, ol]) => {
    const p = Store.prog(ol.id); if (!p.a && !p.r) return "";
    return `<span class="xcov ${platCls(pid)}" data-xgo="${ol.id}" style="color:${platColor(pid)}" title="${esc(platName(pid))}: ${esc(ol.name)} — ${p.r ? "reviewed" : "attempted"} on the other bank">${platInitial(pid)} ✓</span>`;
  }).join("");
}
function leafRow(l) {
  const p = Store.prog(l.id), st = Store.state.stars[l.id];
  const row = el("div", "row mrow" + (p.a ? " done" : "")); row.dataset.id = l.id;
  const rate = l.rating != null ? `<span class="rrate">${l.rating.toFixed(1)}</span>` : (l.modulesCount != null ? `<span class="rrate">${l.modulesCount} mod</span>` : "<span class='rrate'></span>");
  row.innerHTML = `
    <div class="rname"><button class="pinstar ${st ? "on" : ""}" data-act="star" aria-pressed="${st ? "true" : "false"}" aria-label="Pin topic" title="Pin">${st ? "★" : "☆"}</button><span class="leaf-link" role="button" tabindex="0" data-open-leaf="${l.id}" aria-label="Open ${esc(l.name)}">${esc(l.name)}</span> ${hyBadge(l.priority)}${coverageBadge(l)}</div>
    <div class="chips">
      <button class="chip a ${p.a ? "on" : ""}" data-act="a" aria-pressed="${p.a ? "true" : "false"}" title="Attempted">A</button>
      <button class="chip r ${p.r ? "on" : ""}" data-act="r" aria-pressed="${p.r ? "true" : "false"}" title="Reviewed">R</button>
      <button class="chip t ${p.t ? "on" : ""}" data-act="t" aria-pressed="${p.t ? "true" : "false"}" title="Retaken / mastered">Rt</button>
    </div>
    ${rate}<div class="rmcq">${fmt(l.mcqs)}</div>`;
  return row;
}
function subjOthers(subject) {        // same canonical subject on every OTHER qbank
  if (subject === PYQ) return [];
  const c = canon(subject);
  return QBANKS.filter(p => p.id !== QB.platform)
    .map(p => { const f = p.subjects.find(s => canon(s.subject) === c); return f ? { platform: p.id, subject: f.subject } : null; })
    .filter(Boolean);
}

/* live meter sync after a toggle (no full re-render) */
function syncAfterToggle(id) {
  const leaf = LEAF_BY_ID[id]; if (!leaf) return;
  // category meter
  const block = $(`#qbContent .cat-block[data-cat="${cssEsc(leaf.cat)}"][data-subject="${cssEsc(leaf.subject)}"]`);
  if (block) {
    const gro = rollupLeaves(leavesOf(QB.platform, leaf.subject).filter(l => l.cat === leaf.cat));
    const m = $(".cat-meter", block); if (m) m.innerHTML = meterHTML(gro.a, gro.total);
  }
  // subject hero
  if (leaf.subject === QB.subject && leaf.platform === QB.platform) {
    const ro = rollupLeaves(leavesOf(QB.platform, QB.subject));
    const hero = $("#qbContent .subj-hero");
    if (hero) {
      const stats = $$(".sh-stat b", hero);
      if (stats[2]) stats[2].textContent = pct(ro.a, ro.total) + "%";
      if (stats[3]) stats[3].textContent = ro.r;
      const bm = $(".sh-progress", hero); if (bm) bm.innerHTML = bigMeter(ro);
    }
  }
  // sidebar entry
  const sb = $(`#sbList .sb-item[data-subj="${cssEsc(leaf.subject)}"]`);
  if (sb) {
    const ro = rollupLeaves(leavesOf(QB.platform, leaf.subject));
    const m = $(".meter", sb); if (m) m.outerHTML = meterHTML(ro.a, ro.total);
    const gaps = leavesOf(QB.platform, leaf.subject).filter(l => l.priority === 3 && !Store.prog(l.id).a).length;
    let g = $(".sb-gaps", sb);
    if (gaps) {
      if (g) g.textContent = gaps;
      else { const r1 = $(".sb-row1", sb); if (r1) r1.insertAdjacentHTML("beforeend", `<span class="sb-gaps" title="${gaps} high-yield gaps">${gaps}</span>`); }
    } else if (g) g.remove();
  }
}
function cssEsc(s) { return String(s).replace(/["\\]/g, "\\$&"); }

/* ============================================================
   DETAIL DRAWER (shared by QBank + High-Yield + Overview)
   ============================================================ */
let lastFocus = null;
function openDrawer(id) {
  const l = LEAF_BY_ID[id]; if (!l) return;
  lastFocus = document.activeElement;
  const dr = $("#drawer"), body = $("#drawerBody");
  const p = Store.prog(l.id), st = Store.state.stars[l.id];
  const cross = crossMatches(l), sibs = siblings(l, 8), tests = relatedTests(l.canon);
  const crossByPlat = {};
  cross.forEach(c => (crossByPlat[c.platform] = crossByPlat[c.platform] || []).push(c));
  body.innerHTML = `
    <div class="dr-eyebrow"><span class="platlabel ${platCls(l.platform)}" style="color:${platColor(l.platform)}">${esc(platName(l.platform))}</span> · ${esc(l.canon)}${l.cat ? " · " + esc(l.cat) : ""}</div>
    <h2 class="dr-title">${esc(l.name)} ${hyBadge(l.priority)}</h2>
    <div class="dr-facts">
      <span><b>${fmt(l.mcqs)}</b> MCQs</span>
      ${l.rating != null ? `<span><b>${l.rating.toFixed(1)}</b> rating</span>` : ""}
      ${l.modulesCount != null ? `<span><b>${l.modulesCount}</b> modules</span>` : ""}
      <span><b>${l.priority === 3 ? "High" : l.priority === 2 ? "Medium" : "Normal"}</b> yield</span>
    </div>
    <div class="dr-track">
      <span class="dr-lbl">Your status</span>
      <div class="chips big" data-id="${l.id}">
        <button class="chip a ${p.a ? "on" : ""}" data-dract="a">Attempted</button>
        <button class="chip r ${p.r ? "on" : ""}" data-dract="r">Reviewed</button>
        <button class="chip t ${p.t ? "on" : ""}" data-dract="t">Mastered</button>
        <button class="chip star ${st ? "on" : ""}" data-dract="star">${st ? "★ Pinned" : "☆ Pin"}</button>
      </div>
      <button class="linkbtn" data-goto-leaf="${l.id}">Open in QBank Tracker →</button>
    </div>
    <div class="dr-sec"><div class="dr-lbl">Same topic on other platforms</div>
      ${cross.length ? QBANKS.filter(p => crossByPlat[p.id]).map(p =>
        `<div class="dr-subgrp"><span class="platlabel ${p.cls}" style="color:${p.color};font-size:11px">${esc(p.name)}</span>
         ${crossByPlat[p.id].map(c => drLink(c)).join("")}</div>`).join("")
        : `<div class="muted small">No close match found on the other banks.</div>`}</div>
    <div class="dr-sec"><div class="dr-lbl">${l.cat ? "More in " + esc(l.cat) : "Related in " + esc(l.canon)}</div>
      ${sibs.length ? sibs.map(s => drLink(s)).join("") : `<div class="muted small">—</div>`}</div>
    <div class="dr-sec"><div class="dr-lbl">Related tests</div>
      ${tests.length ? tests.map(t => `<button class="dr-itemlink" data-goto-test="${esc(t.id)}"><span>${esc(t.name)}</span><span class="muted">${t.platform}</span></button>`).join("") : `<div class="muted small">No subject-named tests; see the Tests tab.</div>`}</div>
    ${videosForLeaf(l).length ? `<div class="dr-sec"><div class="dr-lbl">CoreBTR videos covering this</div>
      ${videosForLeaf(l).map(vi => `<button class="dr-itemlink" data-open-video="${vi.id}"><span>🎬 ${esc(vi.topic)}</span><span class="muted">${esc(vi.subject)}${vi.durMin ? " · " + vi.durMin + "m" : ""}</span></button>`).join("")}</div>` : ""}`;
  dr.classList.add("open"); $("#drawerScrim").classList.add("open"); dr.setAttribute("aria-hidden", "false");
  setTimeout(() => $("#drawerClose").focus(), 30);
}
function drLink(l) {
  const p = Store.prog(l.id);
  return `<button class="dr-itemlink" data-open-leaf="${l.id}">
    <span>${hyBadge(l.priority)} ${esc(l.name)}</span>
    <span class="dr-rt">${fmt(l.mcqs)} ${statusDots(l.id)}</span></button>`;
}
function closeDrawer() {
  const dr = $("#drawer"); if (!dr.classList.contains("open")) return;
  dr.classList.remove("open"); $("#drawerScrim").classList.remove("open"); dr.setAttribute("aria-hidden", "true");
  if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch {} lastFocus = null; }
}

/* ---- option bottom-sheet (mobile sort / filter) ---- */
let sheetPick = null, sheetLastFocus = null;
function openSheet(title, opts, current, onPick) {
  sheetLastFocus = document.activeElement; sheetPick = onPick;
  const sh = $("#sheet"); $("#sheetTitle").textContent = title;
  $("#sheetBody").innerHTML = opts.map(([v, l]) =>
    `<button class="sheet-opt${v === current ? " on" : ""}" data-v="${esc(v)}"><span>${esc(l)}</span>${v === current ? '<span class="sheet-tick">✓</span>' : ""}</button>`).join("");
  $("#sheetScrim").classList.add("open"); sh.classList.add("open"); sh.setAttribute("aria-hidden", "false");
  setTimeout(() => $("#sheetClose").focus(), 30);
}
function closeSheet() {
  const sh = $("#sheet"); if (!sh.classList.contains("open")) return;
  sh.classList.remove("open"); $("#sheetScrim").classList.remove("open"); sh.setAttribute("aria-hidden", "true"); sheetPick = null;
  if (sheetLastFocus && sheetLastFocus.focus) { try { sheetLastFocus.focus(); } catch {} sheetLastFocus = null; }
}
function updateQbFilterBadge() {
  const b = $("#qFilterBtn"); if (b) b.classList.toggle("has-dot", QB.status !== "all");
}

/* ============================================================
   HIGH-YIELD
   ============================================================ */
let hySubject = "all", hyStatus = "all";
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
function renderHY() {
  const v = $("#view-hy"); v.innerHTML = "";
  const hyAll = LEAVES.filter(l => l.priority === 3);
  const hyDone = hyAll.filter(l => Store.prog(l.id).a).length;
  const sg = el("div", "statgrid");
  sg.innerHTML =
    `<div class="stat g"><div class="big">${hyAll.length}</div><div class="lbl">High-yield topics</div><div class="note">★★★ across both banks</div></div>
     <div class="stat m"><div class="big">${pct(hyDone, hyAll.length)}%</div><div class="lbl">You've started</div><div class="note">${hyDone} of ${hyAll.length} attempted</div></div>
     <div class="stat c"><div class="big">${hyAll.length - hyDone}</div><div class="lbl">Gaps remaining</div><div class="note">untouched high-yield</div></div>
     <div class="stat k"><div class="big">${pct(LEAVES.filter(l => l.priority >= 2 && Store.prog(l.id).r).length, LEAVES.filter(l => l.priority >= 2).length)}%</div><div class="lbl">★★+ reviewed</div><div class="note">depth of revision</div></div>`;
  v.appendChild(sg);

  v.appendChild(el("div", "callout",
    `<b>High-yield engine.</b> Marrow modules scored from their <b>star-rating</b> × MCQ share; Cerebellum units from <b>volume × density</b>; DocTutorials chapters from <b>MCQ share</b> (no rating captured).
     ★★★ = top tier within a subject. <b>Click any topic</b> to open its card — track it, jump to the bank, or see the same topic on another platform.`));

  // consensus: a topic that is ★★★ on ≥2 independent platforms
  const consensus = [];
  const used = new Set();
  LEAVES.filter(l => l.priority === 3).forEach(l => {
    if (used.has(l.id)) return;
    const members = { [l.platform]: l };
    Object.entries(bestCrossByPlat(l)).forEach(([pid, ol]) => { if (ol.priority === 3) members[pid] = ol; });
    if (Object.keys(members).length < 2) return;             // needs agreement from another bank
    Object.values(members).forEach(x => used.add(x.id));
    consensus.push({ members, canon: l.canon, mcqs: Object.values(members).reduce((a, x) => a + x.mcqs, 0) });
  });
  consensus.sort((a, b) => b.mcqs - a.mcqs);
  if (consensus.length) {
    const cp = el("div", "panel consensus");
    cp.innerHTML = `<div class="ph"><div><h3>Consensus high-yield — banks agree ★★★</h3>
      <span class="muted" style="font-size:12px">the strongest prioritisation signal: top-tier on two or more platforms for the same topic</span></div>
      <span class="count-pill">${consensus.length} topics</span></div>`;
    const tbl = el("table", "resp");
    tbl.innerHTML = `<thead><tr><th>Subject</th>${QBANKS.map(p => `<th>${esc(p.name)}</th>`).join("")}<th class="num">Σ MCQs</th><th>Your coverage</th></tr></thead><tbody></tbody>`;
    const tb = $("tbody", tbl);
    consensus.slice(0, 24).forEach(x => {
      const cells = QBANKS.map(p => { const m = x.members[p.id]; return `<td>${m ? `<span class="leaf-link" data-open-leaf="${m.id}">${esc(m.name)}</span>` : '<span class="muted">—</span>'}</td>`; }).join("");
      const cov = QBANKS.map(p => { const m = x.members[p.id]; return m ? `${statusDots(m.id)} <span class="muted small">${platInitial(p.id)}</span>` : ""; }).filter(Boolean).join(" &nbsp; ");
      tb.appendChild(el("tr", null, `<td style="font-weight:600">${esc(x.canon)}</td>${cells}<td class="num" style="font-weight:700">${fmt(x.mcqs)}</td><td>${cov}</td>`));
    });
    cp.appendChild(tbl);
    v.appendChild(cp);
  }

  const subjMaps = QBANKS.map(p => Object.fromEntries(freshSubjects(p).map(s => [canon(s.subject), s])));
  const subjTotal = cs => subjMaps.reduce((a, m) => a + (m[cs]?._mcqs || 0), 0);
  const subjects = [...new Set(subjMaps.flatMap(m => Object.keys(m)))].sort((a, b) => subjTotal(b) - subjTotal(a));

  const ctr = el("div", "controls");
  ctr.innerHTML = `<select class="sel" id="hysub" aria-label="Subject"><option value="all">All subjects (top picks each)</option>
    ${subjects.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("")}</select>
    <select class="sel" id="hystatus" aria-label="Filter by your status">
      <option value="all">All statuses</option>
      <option value="untracked">Yet to attempt</option>
      <option value="attempted">Attempted</option>
      <option value="review">Needs review</option>
      <option value="mastered">Mastered</option>
      <option value="starred">My starred</option>
    </select>
    <div class="spacer"></div><span class="count-pill">click a topic → detail card</span>`;
  v.appendChild(ctr);
  $("#hysub").value = hySubject; $("#hystatus").value = hyStatus;
  $("#hysub").addEventListener("change", e => { hySubject = e.target.value; renderHY(); });
  $("#hystatus").addEventListener("change", e => { hyStatus = e.target.value; renderHY(); });

  const wrap = el("div"); v.appendChild(wrap);
  const n = hySubject === "all" ? 5 : 12;
  const top = arr => [...arr].sort((a, b) => b.hyScore - a.hyScore).slice(0, n);
  const col = (label, cls, color, mods) => {
    const c = el("div", "hy-col");
    c.innerHTML = `<div class="hy-h ${cls}" style="color:${color}">${esc(label)}</div>`;
    const rows = top(mods.filter(hyLeafMatch));
    rows.forEach(l => c.appendChild(el("div", "hy-row", `<span class="hy ${l.priority === 3 ? "" : "med"}">${priStars(l.priority) || "★"}</span>
      <span class="hy-n" role="button" tabindex="0" data-open-leaf="${l.id}">${esc(l.name)}</span><span class="hy-q">${statusDots(l.id)} ${fmt(l.mcqs)}</span>`)));
    if (!rows.length) c.appendChild(el("div", "hy-row muted", "—"));
    return c;
  };
  (hySubject === "all" ? subjects : [hySubject]).forEach(cs => {
    const panel = el("div", "panel hy-panel");
    panel.innerHTML = `<div class="ph"><div><h3 class="hy-jump" data-jump-subj="${esc(cs)}">${esc(cs)}</h3>
      <span class="muted" style="font-size:12px">${fmt(subjTotal(cs))} combined MCQs · click a row</span></div></div><div class="hy-cols"></div>`;
    const cols = $(".hy-cols", panel);
    QBANKS.forEach((p, i) => {
      const subjObj = subjMaps[i][cs];
      const mods = subjObj ? LEAVES.filter(l => l.platform === p.id && l.subject === subjObj.subject) : [];
      cols.appendChild(col(p.name, p.cls, p.color, mods));
    });
    wrap.appendChild(panel);
  });
  labelizeResponsiveTables();
}

/* ============================================================
   PROGRESS
   ============================================================ */
function renderProgress() {
  const v = $("#view-progress"); v.innerHTML = "";
  const overall = id => { const kids = LEAVES.filter(l => l.platform === id); return { total: kids.length, ...rollup(kids.map(k => k.id)) }; };
  const os = QBANKS.map(p => ({ p, o: overall(p.id) }));
  const tot = os.reduce((a, x) => ({ a: a.a + x.o.a, total: a.total + x.o.total, r: a.r + x.o.r, t: a.t + x.o.t }), { a: 0, total: 0, r: 0, t: 0 });
  const sg = el("div", "statgrid");
  sg.innerHTML =
    os.map(({ p, o }) => `<div class="stat ${p.cls}"><div class="big">${pct(o.a, o.total)}%</div><div class="lbl">${esc(p.name)} attempted</div><div class="note">${o.a}/${o.total} · ${o.r} reviewed · ${o.t} mastered</div></div>`).join("") +
    `<div class="stat g"><div class="big">${pct(tot.a, tot.total)}%</div><div class="lbl">Combined attempted</div><div class="note">${tot.a}/${tot.total} items · ${tot.r} reviewed · ${tot.t} mastered</div></div>`;
  v.appendChild(sg);

  // combined coverage ledger (union of both banks per subject)
  const ledger = el("div", "panel");
  ledger.innerHTML = `<div class="ph"><div><h3>Combined coverage — both banks per subject</h3>
    <span class="muted" style="font-size:12px">attempted across the union of Marrow + Cerebellum · ⚠ flags a lopsided subject covered from one source only</span></div></div>`;
  const ltbl = el("table", "resp");
  ltbl.innerHTML = `<thead><tr><th>Subject</th><th class="num">Items</th><th class="num">Combined</th>${QBANKS.map(p => `<th class="num">${esc(p.name)}</th>`).join("")}<th style="width:24%">Coverage</th></tr></thead><tbody></tbody>`;
  const ltb = $("tbody", ltbl);
  const maps = QBANKS.map(p => Object.fromEntries(freshSubjects(p).map(s => [canon(s.subject), s.subject])));
  [...new Set(maps.flatMap(m => Object.keys(m)))]
    .map(cs => {
      const perPlat = QBANKS.map((p, i) => maps[i][cs] ? leavesOf(p.id, maps[i][cs]) : []);
      const all = perPlat.flat();
      const att = all.filter(l => Store.prog(l.id).a).length;
      const pcts = perPlat.map(ls => pct(ls.filter(l => Store.prog(l.id).a).length, ls.length));
      const present = pcts.filter((_, i) => perPlat[i].length);
      const lop = present.length >= 2 && (Math.max(...present) - Math.min(...present) >= 40);
      return { cs, total: all.length, att, comb: pct(att, all.length), pcts, perPlat, lop };
    })
    .sort((a, b) => b.comb - a.comb || b.total - a.total)
    .forEach(x => {
      const tr = el("tr", "rowlink"); tr.dataset.jumpSubj = x.cs;
      const platCells = QBANKS.map((p, i) => `<td class="num" style="color:${p.color};font-weight:600">${x.perPlat[i].length ? x.pcts[i] + "%" : "—"}</td>`).join("");
      tr.innerHTML = `<td style="font-weight:600">${esc(x.cs)} ${x.lop ? `<span class="lop" title="Lopsided: covered mainly from one bank">⚠</span>` : ""}</td>
        <td class="num">${x.total}</td><td class="num" style="font-weight:700">${x.comb}%</td>
        ${platCells}
        <td><div class="pbar lg"><i style="width:${x.comb}%"></i></div></td>`;
      ltb.appendChild(tr);
    });
  ledger.appendChild(ltbl);
  v.appendChild(ledger);

  QBANKS.forEach(p => {
    const panel = el("div", "panel");
    panel.innerHTML = `<div class="ph"><div><h3><span class="platlabel ${p.cls}" style="color:${p.color}">${esc(p.name)}</span> · per-subject progress</h3>
      <span class="muted" style="font-size:12px">click a subject to open it in the tracker</span></div>
      <div class="legend"><span><i style="background:var(--marrow)"></i>attempted</span><span><i style="background:var(--core)"></i>reviewed</span></div></div>`;
    const tbl = el("table", "resp");
    tbl.innerHTML = `<thead><tr><th>Subject</th><th class="num">Items</th><th class="num">Attempted</th><th class="num">Reviewed</th><th style="width:34%">Progress</th></tr></thead><tbody></tbody>`;
    const tb = $("tbody", tbl);
    p.subjects.forEach(s => {
      const ro = rollupLeaves(leavesOf(p.id, s.subject));
      const tr = el("tr", "rowlink"); tr.dataset.jumpSubj = canon(s.subject); tr.dataset.jumpPlat = p.id;
      tr.innerHTML = `<td style="font-weight:600">${s.subject}</td><td class="num">${ro.total}</td>
        <td class="num pf-m">${ro.a}</td><td class="num pf-c">${ro.r}</td>
        <td><div class="pbar lg"><i style="width:${pct(ro.a, ro.total)}%"></i><b style="width:${pct(ro.r, ro.total)}%"></b></div></td>`;
      tb.appendChild(tr);
    });
    panel.appendChild(tbl);
    v.appendChild(panel);
  });
  labelizeResponsiveTables();
}

/* ============================================================
   TESTS & SCORES
   ============================================================ */
function testTag(name, status) {
  const n = (name || "").toLowerCase();
  if (status === "Non-Competitive") return `<span class="tag misc">Surprise</span>`;
  if (/grand test|gt[\s-]|^grand/.test(n)) return `<span class="tag gt">Grand</span>`;
  if (/mini/.test(n)) return `<span class="tag mini">Mini</span>`;
  if (/fmge/.test(n)) return `<span class="tag misc">FMGE</span>`;
  if (/integrated/.test(n)) return `<span class="tag subj">Integrated</span>`;
  if (/inicet|ini-cet/.test(n)) return `<span class="tag gt">INICET</span>`;
  return `<span class="tag subj">Subject</span>`;
}
const TEST_ALIASES = { anat: "Anatomy", anatomy: "Anatomy", physio: "Physiology", physiology: "Physiology", biochem: "Biochemistry", biochemistry: "Biochemistry", pharma: "Pharmacology", pharmacology: "Pharmacology", patho: "Pathology", pathology: "Pathology", micro: "Microbiology", microbiology: "Microbiology", psm: "Community Medicine / PSM", obg: "Obstetrics & Gynaecology", obgy: "Obstetrics & Gynaecology", obstetrics: "Obstetrics & Gynaecology", peds: "Paediatrics", paediatrics: "Paediatrics", pediatrics: "Paediatrics", ortho: "Orthopaedics", orthopedics: "Orthopaedics", orthopaedics: "Orthopaedics", fmt: "Forensic Medicine", forensic: "Forensic Medicine", ophthal: "Ophthalmology", ophtha: "Ophthalmology", opthal: "Ophthalmology", ophthalmology: "Ophthalmology", ent: "ENT", derma: "Dermatology", dermat: "Dermatology", dermatology: "Dermatology", psych: "Psychiatry", psychi: "Psychiatry", psychiatry: "Psychiatry", radio: "Radiology", radiology: "Radiology", anesthesia: "Anaesthesia", anaesthesia: "Anaesthesia", surg: "Surgery", surgery: "Surgery", medicine: "Medicine" };
function subjectAccuracy() {
  const acc = {};
  buildTests().forEach(t => {
    const s = Store.score(t.id); if (!s || s.right == null) return;
    const tot = s.right + s.wrong; if (!tot) return; // attempted (skipped isn't captured)
    const n = (t.name || "").toLowerCase();
    if (/grand test|\bgt[\s-]|integrated|fmge|inicet|ini-cet|national/.test(n)) return; // broad tests: skip to avoid noise
    const matched = new Set();
    Object.keys(TEST_ALIASES).forEach(k => { if (new RegExp("\\b" + k + "\\b").test(n)) matched.add(TEST_ALIASES[k]); });
    if (matched.size !== 1) return; // only attribute clean single-subject tests (no split-credit noise)
    matched.forEach(cs => { const a = acc[cs] || (acc[cs] = { right: 0, q: 0, tests: 0 }); a.right += s.right; a.q += tot; a.tests++; });
  });
  return Object.entries(acc).map(([cs, a]) => ({ cs, pct: pct(a.right, a.q), tests: a.tests, q: a.q })).sort((x, y) => x.pct - y.pct);
}
let testPlat = "all";
function renderTests() {
  const v = $("#view-tests"); v.innerHTML = "";
  const scores = Object.values(Store.state.scores).filter(s => s.right != null);
  const totR = scores.reduce((a, s) => a + (s.right || 0), 0);
  const totQ = scores.reduce((a, s) => a + ((s.right || 0) + (s.wrong || 0) + (s.skipped || 0)), 0);
  const sg = el("div", "statgrid");
  sg.innerHTML =
    `<div class="stat k"><div class="big">${scores.length}</div><div class="lbl">Tests scored</div><div class="note">your accuracy log</div></div>
     <div class="stat g"><div class="big">${pct(totR, totQ)}%</div><div class="lbl">Overall accuracy</div><div class="note">${fmt(totR)} right / ${fmt(totQ)} attempted</div></div>
     <div class="stat m"><div class="big">${D.tests.corebtr.length + D.tests.gt2026.length + Store.state.customTests.length}</div><div class="lbl">Tests in hub</div><div class="note">incl. ${Store.state.customTests.length} you added</div></div>
     <div class="stat c"><div class="big">106</div><div class="lbl">Cerebellum GTs</div><div class="note">2023–26 archive</div></div>`;
  v.appendChild(sg);

  const add = el("div", "panel");
  add.innerHTML = `<div class="ph"><div><h3>Add a Grand Test / custom test</h3>
     <span class="muted" style="font-size:12px">log any test not listed — your own GTs, offline mocks, anything</span></div></div>
     <div class="addform">
       <input class="search" id="ctName" placeholder="Test name (e.g. My GT-7)" style="flex:2;min-width:200px">
       <select class="sel" id="ctPlat"><option>CoreBTR</option><option>Marrow</option><option>Cerebellum</option><option>Other</option></select>
       <input class="search" id="ctQ" type="number" min="1" placeholder="Q count" style="min-width:100px">
       <button class="btn" id="ctAdd">Add test</button>
     </div>`;
  v.appendChild(add);
  $("#ctAdd").addEventListener("click", () => {
    const name = $("#ctName").value.trim(); if (!name) { $("#ctName").focus(); return; }
    Store.addCustomTest({ name, platform: $("#ctPlat").value, q: +$("#ctQ").value || null, status: "custom" });
    renderTests();
  });

  const ctr = el("div", "controls");
  ctr.innerHTML = `<div class="seg" id="tseg">
      ${["all", "CoreBTR", "Cerebellum", "custom"].map(p => `<button data-p="${p}" class="${testPlat === p ? "on" : ""}">${p === "all" ? "All" : p === "custom" ? "My tests" : p}</button>`).join("")}
    </div><div class="spacer"></div><span class="count-pill">click a row to score · ★ rate difficulty</span>`;
  v.appendChild(ctr);
  $("#tseg").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { testPlat = b.dataset.p; renderTests(); } });

  let rows = buildTests();
  if (testPlat === "custom") rows = rows.filter(t => t.custom);
  else if (testPlat !== "all") rows = rows.filter(t => t.platform === testPlat);

  const panel = el("div", "panel");
  panel.innerHTML = `<table class="tests resp"><thead><tr>
    <th>Test</th><th>Type</th><th class="num">Q</th><th class="num">Right</th><th class="num">Wrong</th>
    <th class="num">Acc.</th><th>Difficulty</th><th></th></tr></thead><tbody></tbody></table>`;
  const tb = $("tbody", panel);
  rows.forEach(t => tb.appendChild(scoreRow(t)));
  v.appendChild(panel);

  // per-subject accuracy from scored subject tests
  const sacc = subjectAccuracy();
  if (sacc.length) {
    const ap = el("div", "panel");
    ap.innerHTML = `<div class="ph"><div><h3>Your subjects, weakest first</h3>
      <span class="muted" style="font-size:12px">accuracy inferred from your scored <em>subject</em> tests (broad GTs excluded) · click to drill in</span></div></div>`;
    const at = el("table", "resp");
    at.innerHTML = `<thead><tr><th>Subject</th><th class="num">Accuracy</th><th class="num">Attempted</th><th class="num">Tests</th><th style="width:30%"></th></tr></thead><tbody></tbody>`;
    const atb = $("tbody", at);
    sacc.forEach(x => {
      const tr = el("tr", "rowlink"); tr.dataset.jumpSubj = x.cs;
      tr.innerHTML = `<td style="font-weight:600">${esc(x.cs)}</td>
        <td class="num" style="font-weight:700;color:${x.pct < 55 ? "var(--bad)" : x.pct < 70 ? "var(--gold)" : "var(--accent)"}">${x.pct}%</td>
        <td class="num">${fmt(x.q)}</td><td class="num">${x.tests}</td>
        <td><div class="pbar lg"><i style="width:${x.pct}%;background:${x.pct < 55 ? "var(--bad)" : "var(--marrow)"}"></i></div></td>`;
      atb.appendChild(tr);
    });
    ap.appendChild(at);
    v.appendChild(ap);
  }

  const p2 = el("div", "panel");
  p2.innerHTML = `<div class="ph"><div><h3><span class="platlabel c">Cerebellum</span> · 2026 Grand Test schedule</h3>
    <span class="muted" style="font-size:12px">dated calendar to pace against</span></div></div>`;
  const tl = el("div", "timeline");
  D.tests.gt2026.forEach(t => tl.appendChild(el("div", "tl",
    `<div class="tdate">${t.date}</div><div class="tname">${t.name}</div><div class="tmeta">${t.questions} Q · ${t.duration} min</div>`)));
  p2.appendChild(tl);
  v.appendChild(p2);
  labelizeResponsiveTables();
}
function scoreRow(t) {
  const s = Store.score(t.id) || {};
  const acc = (s.right != null && (s.right + s.wrong + (s.skipped || 0)) > 0) ? pct(s.right, s.right + s.wrong + (s.skipped || 0)) + "%" : "—";
  const tr = el("tr", "scorerow"); tr.dataset.id = t.id;
  tr.innerHTML = `
    <td style="font-weight:600">${esc(t.name)}${t.custom ? ' <span class="tag misc">mine</span>' : ""}</td>
    <td>${testTag(t.name, t.status)}</td>
    <td class="num">${t.q ? fmt(t.q) : "—"}</td>
    <td class="num"><input class="sin" data-f="right" type="number" min="0" value="${s.right ?? ""}" placeholder="–"></td>
    <td class="num"><input class="sin" data-f="wrong" type="number" min="0" value="${s.wrong ?? ""}" placeholder="–"></td>
    <td class="num acc">${acc}</td>
    <td class="diff" data-id="${t.id}">${[1, 2, 3, 4, 5].map(n => `<span class="ds ${s.diff >= n ? "on" : ""}" data-n="${n}">★</span>`).join("")}</td>
    <td>${t.custom ? `<button class="xbtn" data-act="del" title="Remove">✕</button>` : ""}</td>`;
  return tr;
}
function testsInput(e) {
  const inp = e.target.closest("input.sin"); if (!inp) return;
  const row = e.target.closest(".scorerow"); const id = row.dataset.id;
  const rv = $('input[data-f="right"]', row).value, wv = $('input[data-f="wrong"]', row).value;
  const right = +rv || 0, wrong = +wv || 0;
  Store.setScore(id, { right: rv === "" ? null : right, wrong });
  $(".acc", row).textContent = (right + wrong) ? pct(right, right + wrong) + "%" : "—";
}
function testsClick(e) {
  const star = e.target.closest(".diff .ds");
  if (star) {
    const cell = e.target.closest(".diff"); const id = cell.dataset.id; const n = +star.dataset.n;
    const cur = (Store.score(id) || {}).diff || 0; const val = cur === n ? 0 : n;
    Store.setScore(id, { diff: val });
    $$(".ds", cell).forEach((s, i) => s.classList.toggle("on", i < val));
    return true;
  }
  const del = e.target.closest('[data-act="del"]');
  if (del) { const row = e.target.closest(".scorerow"); Store.removeCustomTest(row.dataset.id); renderTests(); return true; }
  return false;
}

/* ============================================================
   VIDEOS — CoreBTR topic clips, ready to intake more sources later
   ============================================================ */
const VIDEOS = (D.videos || []).map(v => ({ ...v }));
const VID_BY_ID = Object.fromEntries(VIDEOS.map(v => [v.id, v]));
// CoreBTR subject -> canonical QBank subject (best fit; integrated topics still search all banks)
const BTR_CANON = {
  "Anatomy": "Anatomy", "Anesthesia": "Anaesthesia", "Biochemistry": "Biochemistry", "Dermatology": "Dermatology",
  "ENT": "ENT", "Forensic Medicine": "Forensic Medicine", "General Pathology": "Pathology", "General Pharmacology": "Pharmacology",
  "General Physiology": "Physiology", "Hematology": "Pathology", "Immunology": "Microbiology", "Integrated CVS": "Medicine",
  "Integrated Renal-Electrolytes": "Medicine", "Integrative Neurology": "Medicine", "Microbiology": "Microbiology",
  "Obstetrics and Gynaecology": "Obstetrics & Gynaecology", "Ophthalmology": "Ophthalmology", "Orthopedics": "Orthopaedics",
  "Pediatrics": "Paediatrics", "Preventive and Social Medicine": "Community Medicine / PSM", "Psychiatry": "Psychiatry",
  "Radiology": "Radiology", "Surgery": "Surgery",
};
function videoSubjects() { return [...new Set(VIDEOS.map(v => v.subject))]; }
function videosOf(subject) { return VIDEOS.filter(v => v.subject === subject); }
function vidRollup(vids) { let w = 0, r = 0, mins = 0; vids.forEach(v => { const x = Store.video(v.id); if (x.w) w++; if (x.v) r++; mins += v.durMin || 0; }); return { w, r, mins, total: vids.length }; }
// suggest related QBank modules/units for a video (the baked-in connectivity layer)
const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
function topicLeafScore(topic, l, cc) {
  let s = sim(topic, l.name);
  if (l.cat) s = Math.max(s, sim(topic, l.cat) * 0.85);
  // normalized-substring catches compound words (Neuro-anatomy <-> NEUROANATOMY)
  const nt = norm(topic), ncat = norm(l.cat), nname = norm(l.name);
  if (nt.length >= 5) {
    if (ncat.includes(nt) || nname.includes(nt)) s = Math.max(s, 0.92);
    else if (ncat.length >= 5 && nt.includes(ncat)) s = Math.max(s, 0.72);
  }
  if (cc && l.canon === cc) s += 0.12; // gentle same-subject nudge
  return s;
}
const _vidSugg = new Map();
function videoSuggestions(v, n = 6) {
  if (_vidSugg.has(v.id)) return _vidSugg.get(v.id);
  const cc = BTR_CANON[v.subject];
  const res = LEAVES.map(l => ({ l, s: topicLeafScore(v.topic, l, cc) }))
    .filter(x => x.s >= 0.45).sort((a, b) => b.s - a.s).slice(0, n).map(x => x.l);
  _vidSugg.set(v.id, res); return res;
}
// reverse: videos that cover a given QBank leaf
const _leafVids = new Map();
function videosForLeaf(leaf, n = 3) {
  if (_leafVids.has(leaf.id)) return _leafVids.get(leaf.id);
  const res = VIDEOS.map(v => ({ v, s: topicLeafScore(v.topic, leaf, BTR_CANON[v.subject]) }))
    .filter(x => x.s >= 0.5).sort((a, b) => b.s - a.s).slice(0, n).map(x => x.v);
  _leafVids.set(leaf.id, res); return res;
}
const confTag = c => `<span class="conf ${c}">${c}</span>`;

let vSubject = null;
function vDefaultSubject() { return videoSubjects()[0]; }
function renderVideos() {
  const v = $("#view-videos"); v.innerHTML = "";
  if (!VIDEOS.length) { v.appendChild(el("div", "empty", "No videos loaded yet.")); return; }
  if (!vSubject || !videoSubjects().includes(vSubject)) vSubject = vDefaultSubject();

  const all = vidRollup(VIDEOS);
  const sg = el("div", "statgrid");
  sg.innerHTML =
    `<div class="stat k"><div class="big">${VIDEOS.length}</div><div class="lbl">CoreBTR topic videos</div><div class="note">${videoSubjects().length} subjects · topic-cut clips</div></div>
     <div class="stat m"><div class="big">${pct(all.w, all.total)}%</div><div class="lbl">Watched</div><div class="note">${all.w} of ${all.total} clips</div></div>
     <div class="stat c"><div class="big">${all.r}</div><div class="lbl">Revised</div><div class="note">second-pass clips</div></div>
     <div class="stat g"><div class="big">${Math.round(all.mins / 60)}h</div><div class="lbl">Total runtime</div><div class="note">${fmt(all.mins)} min across the set</div></div>`;
  v.appendChild(sg);
  v.appendChild(el("div", "callout",
    `<b>Video tracking.</b> Your CoreBTR lecture set, cut topic-by-topic. Mark <b>Watched</b> / <b>Revised</b>, and each clip is wired to the
     <b>question-bank modules it covers</b> across Marrow & Cerebellum — click a clip to see suggested modules, jump to them, or track them.
     This layer is source-agnostic: any future video set drops in the same way.`));

  const layout = el("div", "qb-layout");
  layout.innerHTML = `
    <aside class="qb-side">
      <div class="sb-list" id="vbList"></div>
    </aside>
    <div class="qb-main">
      <div class="qb-controls"><h3 style="font-family:var(--serif);font-weight:500;font-size:17px" id="vHeading"></h3><div class="spacer"></div>
        <button class="ghostbtn" id="vWatchAll" title="Mark all watched">✓ Watch all</button></div>
      <div class="qb-content" id="vbContent"></div>
    </div>`;
  v.appendChild(layout);

  drawVideoSidebar(); drawVideoSubject();
  $("#vWatchAll").addEventListener("click", () => {
    const vids = videosOf(vSubject); const allW = vids.every(x => Store.video(x.id).w);
    vids.forEach(x => { if (allW ? Store.video(x.id).w : !Store.video(x.id).w) Store.toggleVideo(x.id, "w"); });
    drawVideoSubject(); drawVideoSidebar(); toast(allW ? "Unmarked subject" : `Marked ${vids.length} clips watched`);
  });
}
function drawVideoSidebar() {
  const wrap = $("#vbList"); if (!wrap) return; wrap.innerHTML = "";
  videoSubjects().forEach(s => {
    const ro = vidRollup(videosOf(s));
    const it = el("button", "sb-item" + (s === vSubject ? " on" : "")); it.dataset.vsubj = s;
    it.innerHTML = `<span class="sb-row1"><span class="sb-name">${esc(s)}</span></span>
      <span class="sb-row2">${meterHTML(ro.w, ro.total)}<span class="sb-mcq">${Math.round(ro.mins / 60)}h</span></span>`;
    wrap.appendChild(it);
  });
}
function drawVideoSubject() {
  const host = $("#vbContent"); if (!host) return; host.innerHTML = "";
  const heading = $("#vHeading"); if (heading) heading.textContent = vSubject;
  const vids = videosOf(vSubject);
  const list = el("div", "vlist");
  vids.forEach(vid => list.appendChild(videoRow(vid)));
  host.appendChild(list);
}
function videoRow(vid) {
  const x = Store.video(vid.id);
  const sugg = videoSuggestions(vid).length;
  const row = el("div", "vrow" + (x.w ? " done" : "")); row.dataset.vid = vid.id;
  row.innerHTML = `
    <span class="vnum">${vid.num}</span>
    <div class="vmain">
      <span class="vtopic" role="button" tabindex="0" data-open-video="${vid.id}" aria-label="Open ${esc(vid.topic)}">${esc(vid.topic)}</span>
      <span class="vmeta">${vid.durMin != null ? vid.durMin + " min · " : ""}${confTag(vid.confidence)}${sugg ? ` · <span class="vsugg" data-open-video="${vid.id}">${sugg} linked modules</span>` : ""}</span>
    </div>
    <div class="chips">
      <button class="chip a ${x.w ? "on" : ""}" data-vact="w" aria-pressed="${x.w ? "true" : "false"}" title="Watched">W</button>
      <button class="chip r ${x.v ? "on" : ""}" data-vact="v" aria-pressed="${x.v ? "true" : "false"}" title="Revised">Rv</button>
    </div>`;
  return row;
}
function openVideoDrawer(id) {
  const vid = VID_BY_ID[id]; if (!vid) return;
  lastFocus = document.activeElement;
  const dr = $("#drawer"), body = $("#drawerBody");
  const x = Store.video(id);
  const sugg = videoSuggestions(vid, 8);
  const cc = BTR_CANON[vid.subject];
  body.innerHTML = `
    <div class="dr-eyebrow"><span class="platlabel k">CoreBTR video</span> · ${esc(vid.subject)}${cc ? " · maps to " + esc(cc) : ""}</div>
    <h2 class="dr-title">${esc(vid.topic)}</h2>
    <div class="dr-facts">
      <span><b>#${vid.num}</b> in subject</span>
      ${vid.durMin != null ? `<span><b>${vid.durMin}</b> min</span>` : ""}
      <span>cut confidence ${confTag(vid.confidence)}</span>
    </div>
    <div class="dr-track">
      <span class="dr-lbl">Your status</span>
      <div class="vchips big" data-vid="${id}">
        <button class="chip a ${x.w ? "on" : ""}" data-vdract="w">Watched</button>
        <button class="chip r ${x.v ? "on" : ""}" data-vdract="v">Revised</button>
      </div>
      <div class="muted small">File: ${esc(vid.file)}</div>
    </div>
    <div class="dr-sec"><div class="dr-lbl">Question-bank modules this video covers</div>
      ${sugg.length ? sugg.map(l => drLink(l)).join("") : `<div class="muted small">No close module match — try the command palette.</div>`}</div>
    <div class="dr-sec"><div class="dr-lbl">Related tests</div>
      ${cc ? relatedTests(cc).map(t => `<button class="dr-itemlink" data-goto-test="${esc(t.id)}"><span>${esc(t.name)}</span><span class="muted">${t.platform}</span></button>`).join("") || `<div class="muted small">—</div>` : `<div class="muted small">—</div>`}</div>`;
  dr.classList.add("open"); $("#drawerScrim").classList.add("open"); dr.setAttribute("aria-hidden", "false");
  setTimeout(() => $("#drawerClose").focus(), 30);
}
function syncVideoAfterToggle(id) {
  const vid = VID_BY_ID[id]; if (!vid) return;
  const sb = $(`#vbList .sb-item[data-vsubj="${cssEsc(vid.subject)}"]`);
  if (sb) { const ro = vidRollup(videosOf(vid.subject)); const m = $(".meter", sb); if (m) m.outerHTML = meterHTML(ro.w, ro.total); }
}

/* ============================================================
   PLANNER
   ============================================================ */
function renderPlanner() {
  const v = $("#view-planner"); v.innerHTML = "";
  v.appendChild(el("div", "callout",
    `<b>How this is built.</b> Subjects tiered by <b>combined MCQ weight</b> across ${QBANKS.map(p => esc(p.name)).join(" + ")} — a proxy for exam weight.
     Pair every subject pass with its tests, then layer Grand Tests weekly. Click a subject to open it.`));
  const maps = QBANKS.map(p => Object.fromEntries(freshSubjects(p).map(s => [canon(s.subject), s._mcqs])));
  const subs = [...new Set(maps.flatMap(m => Object.keys(m)))]
    .map(s => {
      const per = QBANKS.map((p, i) => ({ name: p.name, mcqs: maps[i][s] || 0 }));
      const t = per.reduce((a, x) => a + x.mcqs, 0);
      const top = per.slice().sort((a, b) => b.mcqs - a.mcqs)[0];
      return { s, per, t, top: top.name };
    }).sort((a, b) => b.t - a.t);
  const n = subs.length, hi = subs.slice(0, Math.ceil(n / 3)), mid = subs.slice(Math.ceil(n / 3), Math.ceil(2 * n / 3)), lo = subs.slice(Math.ceil(2 * n / 3));
  const grid = el("div", "plan-grid");
  const tier = (cls, title, sub, arr) => {
    const t = el("div", "tier " + cls);
    t.innerHTML = `<h4>${title}</h4><div class="tsub">${sub}</div><ul>${
      arr.map(x => `<li data-jump-subj="${esc(x.s)}"><span>${esc(x.s)}</span><span class="v">${fmt(x.t)} <span style="color:var(--dim)">· ${esc(x.top)}</span></span></li>`).join("")}</ul>`;
    return t;
  };
  grid.appendChild(tier("hi", "Tier 1 · Heavy", "Full first pass in the bigger bank + every subject test", hi));
  grid.appendChild(tier("mid", "Tier 2 · Medium", "First pass + targeted high-yield topics", mid));
  grid.appendChild(tier("lo", "Tier 3 · Light", "Revision-only / second-pass filter + PYQs", lo));
  v.appendChild(grid);

  const p = el("div", "panel");
  p.innerHTML = `<div class="ph"><div><h3>Suggested weekly rhythm</h3></div></div>
    <table class="resp"><thead><tr><th>Day</th><th>Focus</th><th>Test layer</th></tr></thead><tbody>
      <tr><td>Mon–Tue</td><td>Tier-1 subject — new modules in primary bank</td><td>Subject test (50 Q)</td></tr>
      <tr><td>Wed</td><td>Cross-check same subject in the other bank (gaps only)</td><td>Mini Test</td></tr>
      <tr><td>Thu–Fri</td><td>Tier-2 subject pass</td><td>Subject test + error log</td></tr>
      <tr><td>Sat</td><td>Tier-3 revision + PYQ papers (Marrow 5,738 PYQ MCQs)</td><td>—</td></tr>
      <tr><td>Sun</td><td>Full review of the week's error log</td><td><b>Grand Test (200 Q)</b> — rotate platforms</td></tr>
    </tbody></table>
    <div class="kpi-row">
      <div class="kpi"><b>${fmt(QBANK_MCQ)}</b> MCQs total</div>
      <div class="kpi">at <b>100/day</b> → <b>${Math.round(QBANK_MCQ / 100)}</b> days for one full pass</div>
      <div class="kpi">at <b>150/day</b> → <b>${Math.round(QBANK_MCQ / 150)}</b> days</div>
    </div>`;
  v.appendChild(p);
  labelizeResponsiveTables();
}

/* ============================================================
   COMMAND PALETTE
   ============================================================ */
let PALETTE_INDEX = null, palSel = 0, palResults = [];
function buildPaletteIndex() {
  const idx = [];
  // subjects
  QBANKS.forEach(p => subjectsOf(p.id).forEach(s =>
    idx.push({ type: "Subject", label: s, sub: p.name, run: () => jumpToSubject(canon(s), p.id) })));
  // leaves
  const leafType = { marrow: "Module", cerebellum: "Unit", doctutorials: "Chapter" };
  LEAVES.forEach(l => idx.push({ type: leafType[l.platform] || "Topic", label: l.name, sub: `${platName(l.platform)} · ${l.canon}`, leaf: l, run: () => openDrawer(l.id) }));
  // tests
  buildTests().forEach(t => idx.push({ type: "Test", label: t.name, sub: t.platform, run: () => { gotoTest(t.id); } }));
  // videos
  VIDEOS.forEach(vi => idx.push({ type: "Video", label: vi.topic, sub: `CoreBTR · ${vi.subject}`, run: () => openVideoDrawer(vi.id) }));
  // actions
  [["Overview", "overview"], ["QBank Tracker", "qbank"], ["Progress", "progress"], ["Tests & Scores", "tests"], ["High-Yield", "hy"], ["Study Planner", "planner"]]
    .forEach(([lbl, view]) => idx.push({ type: "Go to", label: lbl, sub: "tab", run: () => show(view) }));
  idx.push({ type: "Action", label: "Export tracking (backup)", sub: "", run: () => $("#btnExport").click() });
  return idx;
}
function scoreMatch(q, s) {
  s = s.toLowerCase(); q = q.toLowerCase();
  if (s === q) return 100; if (s.startsWith(q)) return 70; const i = s.indexOf(q);
  if (i >= 0) return 50 - i * 0.1;
  // token subsequence
  let pos = 0; for (const ch of q) { pos = s.indexOf(ch, pos); if (pos < 0) return -1; pos++; } return 10;
}
let palLastFocus = null;
function openPalette() {
  palLastFocus = document.activeElement;
  PALETTE_INDEX = buildPaletteIndex(); // refresh (custom tests / state)
  $("#palette").classList.add("open"); $("#palInput").value = ""; palSel = 0;
  drawPalette(""); setTimeout(() => $("#palInput").focus(), 20);
}
function closePalette() {
  $("#palette").classList.remove("open");
  if (palLastFocus && palLastFocus.focus) { try { palLastFocus.focus(); } catch {} palLastFocus = null; }
}
function drawPalette(q) {
  q = q.trim();
  if (!q) {
    palResults = [
      ...PALETTE_INDEX.filter(x => x.type === "Go to"),
      ...PALETTE_INDEX.filter(x => x.leaf && x.leaf.priority === 3).slice(0, 5).map(x => ({ ...x, type: "High-yield" })),
    ];
  } else {
    palResults = PALETTE_INDEX.map(x => ({ x, sc: Math.max(scoreMatch(q, x.label), scoreMatch(q, x.sub) - 20) }))
      .filter(o => o.sc > 0).sort((a, b) => b.sc - a.sc).slice(0, 40).map(o => o.x);
  }
  palSel = Math.max(0, Math.min(palSel, palResults.length - 1));
  const list = $("#palList"); list.innerHTML = "";
  palResults.forEach((r, i) => {
    const it = el("div", "pal-item" + (i === palSel ? " sel" : ""));
    it.dataset.i = i;
    it.innerHTML = `<span class="pal-type ${r.type.replace(/\s/g, "").toLowerCase()}">${r.type}</span>
      <span class="pal-label">${esc(r.label)}${r.leaf ? " " + hyBadge(r.leaf.priority) : ""}</span>
      <span class="pal-sub">${esc(r.sub)}</span>`;
    list.appendChild(it);
  });
  if (!palResults.length) list.appendChild(el("div", "pal-empty", "No matches."));
}
function palMove(d) { palSel = (palSel + d + palResults.length) % (palResults.length || 1); drawPalette($("#palInput").value); ensurePalVisible(); }
function ensurePalVisible() { const s = $(".pal-item.sel"); if (s) s.scrollIntoView({ block: "nearest" }); }
function palChoose() { const r = palResults[palSel]; if (r) { closePalette(); r.run(); } }

/* ============================================================
   NAVIGATION / DEEP LINKS
   ============================================================ */
function jumpToSubject(canonSubj, platform) {
  QB.platform = platform || QB.platform;
  const list = subjectsOf(QB.platform);
  const native = list.find(s => canon(s) === canonSubj) || list[0];
  QB.subject = native; QB.search = ""; QB.status = "all"; QB.hyOnly = false;
  show("qbank");
}
function gotoLeaf(id) {
  const l = LEAF_BY_ID[id]; if (!l) return;
  QB.platform = l.platform; QB.subject = l.subject; QB.search = ""; QB.status = "all"; QB.hyOnly = false;
  closeDrawer(); show("qbank");
  setTimeout(() => {
    const block = $(`#qbContent .cat-block[data-cat="${cssEsc(l.cat)}"]`); if (block) block.classList.add("open");
    const row = $(`#qbContent .mrow[data-id="${cssEsc(id)}"]`);
    if (row) { row.scrollIntoView({ block: "center", behavior: "smooth" }); row.classList.add("flash"); setTimeout(() => row.classList.remove("flash"), 1500); }
  }, 60);
}
function gotoTest(id) {
  show("tests");
  setTimeout(() => { const row = $(`#view-tests .scorerow[data-id="${cssEsc(id)}"]`); if (row) { row.scrollIntoView({ block: "center", behavior: "smooth" }); row.classList.add("flash"); setTimeout(() => row.classList.remove("flash"), 1500); } }, 60);
}
const SUBJ_BY_CANON = {};
QBANKS.forEach(p => p.subjects.forEach(s => { const c = canon(s.subject); (SUBJ_BY_CANON[c] = SUBJ_BY_CANON[c] || {})[p.id] = s.subject; }));

/* ============================================================
   GLOBAL EVENT DELEGATION
   ============================================================ */
function appClick(e) {
  // test interactions first
  if (testsClick(e)) return;

  // tracking chips (qbank rows or drawer)
  const actBtn = e.target.closest("[data-act],[data-dract]");
  if (actBtn) {
    const drawerChips = actBtn.closest(".chips.big");
    const id = drawerChips ? drawerChips.dataset.id : (e.target.closest(".mrow")?.dataset.id);
    const act = actBtn.dataset.act || actBtn.dataset.dract;
    if (id && act) {
      if (act === "star") Store.star(id); else Store.toggle(id, act);
      refreshRowEverywhere(id);
      if (drawerChips) refreshDrawerChips(id);
      syncAfterToggle(id);
      return;
    }
  }
  // video tracking chips (row or drawer)
  const vBtn = e.target.closest("[data-vact],[data-vdract]");
  if (vBtn) {
    const drawerV = vBtn.closest(".vchips.big");
    const id = drawerV ? drawerV.dataset.vid : e.target.closest(".vrow")?.dataset.vid;
    const act = vBtn.dataset.vact || vBtn.dataset.vdract;
    if (id && act) {
      Store.toggleVideo(id, act);
      const x = Store.video(id);
      $$(`.vrow[data-vid="${cssEsc(id)}"]`).forEach(r => {
        r.classList.toggle("done", !!x.w);
        const w = $(".chip.a", r), rv = $(".chip.r", r);
        if (w) { w.classList.toggle("on", !!x.w); w.setAttribute("aria-pressed", x.w ? "true" : "false"); }
        if (rv) { rv.classList.toggle("on", !!x.v); rv.setAttribute("aria-pressed", x.v ? "true" : "false"); }
      });
      if (drawerV) { $(".chip.a", drawerV)?.classList.toggle("on", !!x.w); $(".chip.r", drawerV)?.classList.toggle("on", !!x.v); }
      syncVideoAfterToggle(id);
      return;
    }
  }
  const ov = e.target.closest("[data-open-video]"); if (ov) { openVideoDrawer(ov.dataset.openVideo); return; }
  const vsb = e.target.closest("[data-vsubj]"); if (vsb) { vSubject = vsb.dataset.vsubj; drawVideoSidebar(); drawVideoSubject(); $("#vbContent").scrollIntoView({ block: "start", behavior: "smooth" }); return; }
  // cross-bank coverage jump
  const xg = e.target.closest("[data-xgo]"); if (xg) { e.stopPropagation(); gotoLeaf(xg.dataset.xgo); return; }
  // open drawer
  const op = e.target.closest("[data-open-leaf]"); if (op) { openDrawer(op.dataset.openLeaf); return; }
  // category collapse (ignore clicks on the bulk button inside the header)
  const ct = e.target.closest("[data-cat-toggle]"); if (ct && !e.target.closest("[data-bulk]")) { ct.closest(".cat-block").classList.toggle("open"); return; }
  // bulk mark
  const bulk = e.target.closest("[data-bulk]");
  if (bulk) {
    const block = bulk.closest(".cat-block"); const cat = block.dataset.cat, subject = block.dataset.subject;
    const ls = leavesOf(QB.platform, subject).filter(l => l.cat === cat);
    const allDone = ls.every(l => Store.prog(l.id).a);
    ls.forEach(l => { const p = Store.prog(l.id); if (allDone ? p.a : !p.a) Store.toggle(l.id, "a"); });
    drawSubject(); drawSidebar();
    toast(allDone ? `Unmarked ${esc(cat)}` : `Marked ${ls.length} modules attempted`);
    return;
  }
  // sidebar subject select
  const sb = e.target.closest("[data-subj]"); if (sb) { QB.subject = sb.dataset.subj; drawSidebar(); drawSubject(); $("#qbContent").scrollIntoView({ block: "start", behavior: "smooth" }); return; }
  // jumps
  const js = e.target.closest("[data-jump-subj]"); if (js) { jumpToSubject(js.dataset.jumpSubj, js.dataset.jumpPlat || js.closest("[data-jump-plat]")?.dataset.jumpPlat); return; }
  const jo = e.target.closest("[data-jump-other]"); if (jo) { QB.platform = jo.dataset.jumpPlat; QB.subject = jo.dataset.jumpOther; QB.search = ""; QB.status = "all"; QB.hyOnly = false; renderQbank(); return; }
  const gl = e.target.closest("[data-goto-leaf]"); if (gl) { gotoLeaf(gl.dataset.gotoLeaf); return; }
  const gt = e.target.closest("[data-goto-test]"); if (gt) { closeDrawer(); gotoTest(gt.dataset.gotoTest); return; }
  const qa = e.target.closest("[data-quick-a]"); if (qa) { Store.toggle(qa.dataset.quickA, "a"); renderOverview(); return; }
  const hg = e.target.closest("[data-jump-hygaps]"); if (hg) { QB.status = "untracked"; QB.hyOnly = true; QB.search = ""; show("qbank"); return; }
}
function refreshRowEverywhere(id) {
  const p = Store.prog(id), st = Store.state.stars[id];
  $$(`.mrow[data-id="${cssEsc(id)}"]`).forEach(row => {
    row.classList.toggle("done", !!p.a);
    [["a", p.a], ["r", p.r], ["t", p.t]].forEach(([k, val]) => { const c = $(".chip." + k, row); if (c) { c.classList.toggle("on", !!val); c.setAttribute("aria-pressed", val ? "true" : "false"); } });
    const ps = $(".pinstar", row); if (ps) { ps.classList.toggle("on", !!st); ps.textContent = st ? "★" : "☆"; ps.setAttribute("aria-pressed", st ? "true" : "false"); }
  });
}
function refreshDrawerChips(id) {
  const p = Store.prog(id), st = Store.state.stars[id];
  const box = $(`.chips.big[data-id="${cssEsc(id)}"]`); if (!box) return;
  $(".chip.a", box)?.classList.toggle("on", !!p.a);
  $(".chip.r", box)?.classList.toggle("on", !!p.r);
  $(".chip.t", box)?.classList.toggle("on", !!p.t);
  const star = $(".chip.star", box); if (star) { star.classList.toggle("on", !!st); star.textContent = st ? "★ Pinned" : "☆ Pin"; }
}

/* ============================================================
   TOOLBAR / TOAST / NAV / KEYBOARD
   ============================================================ */
function wireToolbar() {
  $("#btnExport").addEventListener("click", () => {
    const blob = new Blob([Store.export()], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `meridian-tracking-${Store.state.profile}.json`; a.click(); URL.revokeObjectURL(a.href);
  });
  $("#btnImport").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = () => { try { Store.import(rd.result); show(currentView); toast("Tracking imported"); } catch { toast("Invalid file", true); } };
    rd.readAsText(f);
  });
  $("#btnReset").addEventListener("click", () => {
    if (confirm("Reset all your tracking (progress, scores, stars, custom tests)? The QBank data itself stays.")) { Store.reset(); show(currentView); toast("Tracking reset"); }
  });
  $("#btnSearch")?.addEventListener("click", openPalette);
  $("#btnTheme")?.addEventListener("click", toggleTheme);
}
/* mobile-only chrome: compact search button + overflow "⋯" menu (proxies the toolbar) */
function wireMobileChrome() {
  $("#btnSearchM")?.addEventListener("click", openPalette);
  const ovBtn = $("#btnOverflow"), ovMenu = $("#overflowMenu");
  if (!ovBtn || !ovMenu) return;
  const close = () => { ovMenu.hidden = true; ovBtn.setAttribute("aria-expanded", "false"); };
  ovBtn.addEventListener("click", e => {
    e.stopPropagation();
    const willOpen = ovMenu.hidden; ovMenu.hidden = !willOpen; ovBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
  });
  ovMenu.addEventListener("click", e => { const b = e.target.closest("[data-proxy]"); if (b) { close(); $("#" + b.dataset.proxy)?.click(); } });
  document.addEventListener("click", e => { if (!ovMenu.hidden && !e.target.closest(".overflow")) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !ovMenu.hidden) close(); });
}
/* bottom-sheet drawer: drag the handle down to dismiss (mobile only) */
function wireDrawerDrag() {
  const dr = $("#drawer"), head = $(".drawer-head", dr); if (!head) return;
  let startY = 0, curY = 0, dragging = false;
  const isSheet = () => matchMedia("(max-width:640px)").matches;
  head.addEventListener("touchstart", e => {
    if (!isSheet() || !dr.classList.contains("open")) return;
    dragging = true; startY = e.touches[0].clientY; curY = 0; dr.style.transition = "none";
  }, { passive: true });
  head.addEventListener("touchmove", e => {
    if (!dragging) return; curY = Math.max(0, e.touches[0].clientY - startY); dr.style.transform = `translateY(${curY}px)`;
  }, { passive: true });
  head.addEventListener("touchend", () => {
    if (!dragging) return; dragging = false; dr.style.transition = ""; dr.style.transform = "";
    if (curY > 90) closeDrawer();
  });
}
function toast(msg, bad) {
  const t = el("div", "toast" + (bad ? " bad" : ""), msg); document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2200);
}
function toggleTheme() {
  const dark = document.body.classList.toggle("evening");
  try { localStorage.setItem("meridian_theme", dark ? "evening" : "day"); } catch {}
  $("#btnTheme").textContent = dark ? "☾ Evening" : "☀ Day";
}

const RENDER = { overview: renderOverview, qbank: renderQbank, progress: renderProgress, tests: renderTests, hy: renderHY, videos: renderVideos, planner: renderPlanner };
const TAB_ORDER = ["overview", "qbank", "progress", "tests", "hy", "videos", "planner"];
const TAB_LABEL = { overview: "Overview", qbank: "QBank Tracker", progress: "Progress", tests: "Tests & Scores", hy: "High-Yield", videos: "Videos", planner: "Study Planner" };
let currentView = "overview";
function show(view) {
  currentView = view;
  $$(".tab").forEach(t => { const on = t.dataset.view === view; t.classList.toggle("active", on); t.setAttribute("aria-selected", on ? "true" : "false"); });
  $$("#botnav button").forEach(b => { const on = b.dataset.view === view; b.classList.toggle("active", on); b.setAttribute("aria-current", on ? "page" : "false"); });
  const home = $("#btnHome"); if (home) { const on = view === "overview"; home.classList.toggle("active", on); home.setAttribute("aria-current", on ? "page" : "false"); }
  const mt = $("#mobTitle"); if (mt) mt.textContent = TAB_LABEL[view] || view;
  $$(".view").forEach(s => s.classList.toggle("active", s.id === "view-" + view));
  RENDER[view]();
  labelizeResponsiveTables();
  setHeaderHeight();
  try { location.hash = view; } catch {}
  window.scrollTo({ top: 0 });
}
/* card-list table mode (mobile): auto-stamp each cell with its column header,
   and wrap wide tables in a horizontal-scroll fallback for the tablet range
   (cards take over ≤640px, where .tbl-scroll goes overflow:visible). */
function labelizeResponsiveTables() {
  $$("#app .view.active table.resp").forEach(tbl => {
    if (!tbl.parentElement.classList.contains("tbl-scroll")) {
      const wrap = el("div", "tbl-scroll");
      tbl.parentNode.insertBefore(wrap, tbl); wrap.appendChild(tbl);
    }
    const heads = $$("thead th", tbl).map(th => th.textContent.trim());
    $$("tbody tr", tbl).forEach(tr => $$("td", tr).forEach((td, i) => { if (heads[i]) td.setAttribute("data-label", heads[i]); }));
  });
}
function setHeaderHeight() {
  const h = $(".topbar")?.offsetHeight || 110;
  document.documentElement.style.setProperty("--hh", h + "px");
}

function qbVisibleRows() { return $$("#qbContent .mrow").filter(r => r.offsetParent !== null); }
function moveCursor(dir) {
  const rows = qbVisibleRows(); if (!rows.length) return;
  let idx = rows.findIndex(r => r.dataset.id === QB.cursorId);
  idx = idx < 0 ? (dir > 0 ? 0 : rows.length - 1) : Math.max(0, Math.min(rows.length - 1, idx + dir));
  rows.forEach(r => r.classList.remove("cursor"));
  const row = rows[idx]; row.classList.add("cursor"); QB.cursorId = row.dataset.id;
  row.scrollIntoView({ block: "nearest" });
}
function cursorAct(act) {
  if (!QB.cursorId) { moveCursor(1); return; }
  if (act === "star") Store.star(QB.cursorId); else Store.toggle(QB.cursorId, act);
  refreshRowEverywhere(QB.cursorId); syncAfterToggle(QB.cursorId);
}
document.addEventListener("keydown", e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); return; }
  if ($("#palette").classList.contains("open")) {
    if (e.key === "Escape") closePalette();
    else if (e.key === "ArrowDown") { e.preventDefault(); palMove(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); palMove(-1); }
    else if (e.key === "Enter") { e.preventDefault(); palChoose(); }
    return;
  }
  // fast score entry: Enter jumps to next test's Right input
  if (e.target.classList && e.target.classList.contains("sin")) {
    if (e.key === "Enter") {
      e.preventDefault();
      const row = e.target.closest(".scorerow"); const next = row && row.nextElementSibling;
      const ni = next && next.querySelector('input[data-f="right"]'); if (ni) { ni.focus(); ni.select(); }
    }
    return;
  }
  if (e.key === "Escape") { closeSheet(); closeDrawer(); return; }
  if (typing) return;
  if (e.key === "/") { e.preventDefault(); openPalette(); return; }
  if (e.key >= "1" && e.key <= "7") { show(TAB_ORDER[+e.key - 1]); return; }
  // QBank keyboard tracking
  if (currentView === "qbank") {
    const k = e.key.toLowerCase();
    if (k === "j" || e.key === "ArrowDown") { e.preventDefault(); moveCursor(1); }
    else if (k === "k" || e.key === "ArrowUp") { e.preventDefault(); moveCursor(-1); }
    else if (k === "a") cursorAct("a");
    else if (k === "r") cursorAct("r");
    else if (k === "t") cursorAct("t");
    else if (k === "s") cursorAct("star");
  }
});

function init() {
  // dynamic subhead — derived from D.platforms (no hardcoded platform list)
  const sub = $("#subhead");
  if (sub) sub.textContent = `Cross-platform exam almanac · ${D.exam || ""} · ${PLATFORMS.map(p => p.name).join(" · ")} · captured ${D.captured}`;
  // theme
  try { if (localStorage.getItem("meridian_theme") === "evening") { document.body.classList.add("evening"); } } catch {}
  if ($("#btnTheme")) $("#btnTheme").textContent = document.body.classList.contains("evening") ? "☾ Evening" : "☀ Day";
  wireToolbar();
  wireMobileChrome();
  wireDrawerDrag();
  $("#tabs").addEventListener("click", e => { const b = e.target.closest(".tab"); if (b) show(b.dataset.view); });
  $("#botnav").addEventListener("click", e => { const b = e.target.closest("button"); if (b) show(b.dataset.view); });
  $("#btnHome")?.addEventListener("click", () => show("overview"));
  document.body.addEventListener("click", appClick); // body, not #app — drawer/palette live outside #app
  $("#app").addEventListener("input", testsInput);
  // keyboard activation for focusable non-button controls (Enter / Space)
  document.body.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target.closest('[data-open-leaf],[data-jump-subj],[data-goto-leaf],[data-xgo],[data-quick-a],[data-open-video]');
    if (t && t.getAttribute("role") === "button") { e.preventDefault(); t.click(); }
  });
  // palette wiring
  $("#palInput").addEventListener("input", e => { palSel = 0; drawPalette(e.target.value); });
  $("#palList").addEventListener("click", e => { const it = e.target.closest(".pal-item"); if (it) { palSel = +it.dataset.i; palChoose(); } });
  $("#palScrim").addEventListener("click", closePalette);
  $("#drawerScrim").addEventListener("click", closeDrawer);
  $("#drawerClose").addEventListener("click", closeDrawer);
  // option bottom-sheet wiring
  $("#sheetScrim").addEventListener("click", closeSheet);
  $("#sheetClose").addEventListener("click", closeSheet);
  $("#sheetBody").addEventListener("click", e => { const b = e.target.closest(".sheet-opt"); if (b) { const v = b.dataset.v, cb = sheetPick; closeSheet(); if (cb) cb(v); } });
  window.addEventListener("resize", setHeaderHeight);
  // initial view from hash
  const h = (location.hash || "").replace("#", "");
  show(RENDER[h] ? h : "overview");
}
Store.load().then(init);
