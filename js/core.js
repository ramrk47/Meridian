/* ============================================================
   Meridian — core.js  (shared seam; loads first after data.js/storage.js)
   D alias, DOM/format helpers, canonical-subject map, platform registry,
   leaf index, rollups, priority/HY badges, curation (epistemic) helpers,
   token + cross-platform matching, tests index, video helpers, faculty
   helpers. Everything stays on global scope — no import/export.
   ============================================================ */
const D = window.QBANK_DATA;   // exam-agnostic model: { exam, platforms[], tests, videos } (QBANK_DATA aliases window.D)
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => (n == null ? "—" : n.toLocaleString("en-IN"));
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function cssEsc(s) { return String(s).replace(/["\\]/g, "\\$&"); }

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
/* platform id → categorical CSS var (theme-aware; §1.1 color-as-data contract).
   Reputation-only ids (prepladder/egurukul) resolve too, but callers must never
   place them in CONTENT viz (heatmap columns / coverage bars) — they have no platforms[]. */
const platColor = id => ({ marrow: "var(--p-marrow)", cerebellum: "var(--p-cere)", doctutorials: "var(--p-doc)", prepladder: "var(--p-prepl)", egurukul: "var(--p-eguru)" }[id] || (PLAT_BY_ID[id]?.color) || "var(--ink-3)");
const platInitial = id => (platName(id)[0] || "?").toUpperCase();
/* reputation-only platform ids (NOT content sources; appear in reliability/strength/faculty
   affiliations as muted, non-link labels). Display names come from D.reliability.apps where known. */
const REPUTATION_NAMES = (() => {
  const m = { prepladder: "PrepLadder", egurukul: "eGurukul (DBMCI)" };
  (D.reliability?.apps || []).forEach(a => { if (!a.platformId && a.name) {
    const k = a.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 8);
    if (k.startsWith("prepladd")) m.prepladder = a.name;
    else if (k.startsWith("egurukul")) m.egurukul = a.name;
  }});
  return m;
})();
/* friendly display name for ANY platform id — integrated platforms via platName,
   reputation-only ids via REPUTATION_NAMES, else the raw id. NEVER promotes a
   reputation-only id to a content link (callers gate links on PLAT_BY_ID). */
const platDisplayName = id => (PLAT_BY_ID[id] ? PLAT_BY_ID[id].name : (REPUTATION_NAMES[id] || id));
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
const hyBadge = p => p === 3 ? `<span class="hy" title="Top MCQ-density tier (proxy, not measured exam yield)">★★★</span>` : p === 2 ? `<span class="hy med" title="Mid MCQ-density tier (proxy)">★★</span>` : "";

/* ---- curated judgment layer: epistemic labels + sources (Phase 1c.1) ----
   measured | proxy | directional | public-3p. Every curated figure carries its tag + source + date.
   These helpers are reused by the faculty pass (1c.1F). */
const CUR = { sources: D.sources || [], strength: D.subjectStrength || null, reliability: D.reliability || null, method: D.methodology || null };
const SRC_BY_ID = Object.fromEntries(CUR.sources.map(s => [s.id, s]));
const EPI_DEF = Object.fromEntries((CUR.method?.labels || []).map(l => [l.tag, l]));
const epiName = tag => EPI_DEF[tag]?.name || tag;
const epiDesc = tag => EPI_DEF[tag]?.desc || "";
/* small pill; title carries the full definition so every figure self-documents on hover/focus */
function epiBadge(tag) {
  if (!tag) return "";
  return `<span class="epi ${tag}" tabindex="0" role="note" title="${esc(epiName(tag))} — ${esc(epiDesc(tag))}">${esc(epiName(tag))}</span>`;
}
function srcLink(id) {
  const s = SRC_BY_ID[id]; if (!s) return esc(id);
  const lbl = esc(s.publisher || s.title);
  return /^https?:/.test(s.url || "")
    ? `<a class="srclink" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" title="${esc(s.title)} · captured ${esc(s.captured)}">${lbl} ↗</a>`
    : `<span class="srclink" title="${esc(s.title)} · captured ${esc(s.captured)}">${lbl}</span>`;
}
const srcLinks = ids => (ids || []).map(srcLink).filter(Boolean).join(" · ");
/* a "Source: … · captured DATE" line for a curated panel */
const srcLine = (ids, captured) => `<div class="srcline">Source: ${srcLinks(ids)}${captured ? ` · captured ${esc(captured)}` : ""}</div>`;
/* platform name chip — colour-coded if Meridian integrates it, plain + flagged if reputation-only */
function platRefChip(ref) {
  const pid = ref.platformId;
  if (pid && PLAT_BY_ID[pid]) return `<span class="platlabel ${platCls(pid)}" style="color:${platColor(pid)}">${esc(ref.platform)}</span>`;
  return `<span class="platlabel off" title="Named in community reputation; not yet tracked in Meridian">${esc(ref.platform)}<span class="off-note"> · not yet tracked</span></span>`;
}

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

/* ---- tests index ---- */
function buildTests() {
  const out = [];
  D.tests.corebtr.forEach(t => out.push({ id: t.id, platform: "CoreBTR", name: t.name, q: t.questions, status: t.status }));
  D.tests.gt2026.forEach(t => out.push({ id: t.id, platform: "Cerebellum", name: t.name, q: +t.questions || null, status: t.date }));
  Store.state.customTests.forEach(t => out.push({ ...t, custom: true }));
  return out;
}
const TEST_ALIASES = { anat: "Anatomy", anatomy: "Anatomy", physio: "Physiology", physiology: "Physiology", biochem: "Biochemistry", biochemistry: "Biochemistry", pharma: "Pharmacology", pharmacology: "Pharmacology", patho: "Pathology", pathology: "Pathology", micro: "Microbiology", microbiology: "Microbiology", psm: "Community Medicine / PSM", obg: "Obstetrics & Gynaecology", obgy: "Obstetrics & Gynaecology", obstetrics: "Obstetrics & Gynaecology", peds: "Paediatrics", paediatrics: "Paediatrics", pediatrics: "Paediatrics", ortho: "Orthopaedics", orthopedics: "Orthopaedics", orthopaedics: "Orthopaedics", fmt: "Forensic Medicine", forensic: "Forensic Medicine", ophthal: "Ophthalmology", ophtha: "Ophthalmology", opthal: "Ophthalmology", ophthalmology: "Ophthalmology", ent: "ENT", derma: "Dermatology", dermat: "Dermatology", dermatology: "Dermatology", psych: "Psychiatry", psychi: "Psychiatry", psychiatry: "Psychiatry", radio: "Radiology", radiology: "Radiology", anesthesia: "Anaesthesia", anaesthesia: "Anaesthesia", surg: "Surgery", surgery: "Surgery", medicine: "Medicine" };
function relatedTests(canonSubj) {
  // match a test if its name contains the subject's first word OR any alias mapping to this subject
  const key = canonSubj.toLowerCase().replace(/ \/.*/, "").split(" ")[0];
  const aliasKeys = Object.keys(TEST_ALIASES).filter(k => TEST_ALIASES[k] === canonSubj);
  return buildTests().filter(t => {
    const n = t.name.toLowerCase();
    return n.includes(key) || aliasKeys.some(k => new RegExp("\\b" + k + "\\b").test(n));
  }).slice(0, 6);
}

/* ---- video helpers (cross-surface: drawer + palette + videos surface) ---- */
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

/* ---- faculty helpers (Phase 1c.1F seam) ----
   First-class faculty "people" layer. Data may not yet exist in D; these
   helpers degrade to empty so surfaces can call them safely today. */
const FACULTY = (D.faculty || []).map(f => ({ ...f }));
const FAC_BY_ID = Object.fromEntries(FACULTY.map(f => [f.id, f]));
function facById(id) { return FAC_BY_ID[id] || null; }
function facultyForSubject(canonSubj) {
  return FACULTY.filter(f => (f.subjects || []).some(s => canon(s) === canonSubj));
}
function facultyForPlatform(platformId) {
  return FACULTY.filter(f => (f.platforms || []).some(p => (p.platformId || p) === platformId));
}
// rollup of faculty referenced by the video set (CoreBTR + future sets)
function videoFaculty() {
  const ids = new Set();
  VIDEOS.forEach(v => { (v.facultyIds || (v.facultyId ? [v.facultyId] : [])).forEach(id => ids.add(id)); });
  return [...ids].map(facById).filter(Boolean);
}

/* canonical subject -> { platformId: nativeSubjectName } (used by jumps + entity pages) */
const SUBJ_BY_CANON = {};
QBANKS.forEach(p => p.subjects.forEach(s => { const c = canon(s.subject); (SUBJ_BY_CANON[c] = SUBJ_BY_CANON[c] || {})[p.id] = s.subject; }));

/* shared status-dot fragment (used by overview, drawer, consensus) */
function statusDots(id) {
  const p = Store.prog(id);
  return `<span class="sdots">${["a","r","t"].map(k => `<i class="sd ${k} ${p[k] ? "on" : ""}"></i>`).join("")}</span>`;
}
