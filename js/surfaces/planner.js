/* ============================================================
   surfaces/planner.js — STUDY PLANNER  ·  LOCAL-FIRST, EDITABLE
   The retain surface. Lead with the research-validated heroes:
     1. BACKWARD-PLAN from a locked exam date → auto M1/M2/M3 revision
        passes counting down, a live "on track / X days behind" read, and
        AUTO-RESCHEDULE when a day is missed (the anti-abandonment core).
     2. ADHERENCE + COVERAGE are the hero metrics; the DONE-DIARY is
        DERIVED from real tracked actions (progress[*].ts + videos[*].ts) —
        never self-reported. Hours are reframed (optional, non-ranked,
        video-minutes only, off by default).
     3. EDITABLE + forkable onboarding — never a blank page.
   Modes ladder (all produce the same plan.items): Quick-schedule ·
   Intensity templates · Backward-plan · Manual. My-subscriptions
   (Store.subs) scopes plan generation to owned banks.
   Anti-dopamine: completion counts ONLY from real tracked actions; calm
   almanac tone, nudges not punishment; no leaderboard, no infinite feed.
   Local-first: everything persists via storage.js; server-sync later.
   The post-backend social half (peer pods, shared board, WhatsApp snapshot,
   accountability partner, curator-adopt) is intentionally NOT built here.
   ============================================================ */

/* ── builder / view state (module-local; the plan itself lives in Store) ── */
let plBuilder = null;   // null = chooser/active; else {mode, subjects[], from, to, cap, exam, template, customPlat}
let plEdit = false;     // edit mode on the active plan (show remove / move / add)

/* ── cycle stat-bar view state (module-local; locked cycles live in Store) ── */
let plCycleSpan = "week";       // "week" | "month" — the live cycle granularity
let plCycleRef = null;          // iso anchor date for the viewed window (null = today); moved by ◀▶
let plCycleFraming = "extent";  // "extent" (Done/Reviewed/Revised) | "rev" (R1/R2/R3 tally)
const plCycExpanded = new Set();  // subject keys expanded in the live matrix
const plLockExpanded = new Set(); // locked-cycle ids expanded in the cycles list

/* ============================================================
   DATE MATH — local, no backend. iso = "yyyy-mm-dd" (lexicographic
   compare == chronological; all comparisons use that).
   ============================================================ */
function _today() { return isoDay(new Date()); }
function isoDay(dt) {
  const d = (dt instanceof Date) ? dt : new Date(dt);
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function parseDay(iso) { const [y, m, d] = String(iso).split("-").map(Number); return new Date(y, m - 1, d); }
function addDays(dOrIso, n) { const x = (dOrIso instanceof Date) ? new Date(dOrIso) : parseDay(dOrIso); x.setDate(x.getDate() + n); return x; }
function daysBetween(aIso, bIso) { return Math.round((parseDay(bIso) - parseDay(aIso)) / 86400000); }
function _dayRange(fromIso, toIso) { const out = []; let d = parseDay(fromIso); const end = parseDay(toIso); while (d <= end) { out.push(isoDay(d)); d = addDays(d, 1); } return out; }
function fmtDay(iso) { return parseDay(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
function fmtDayFull(iso) {
  const d = parseDay(iso), t = _today();
  if (iso === t) return "Today";
  if (iso === isoDay(addDays(parseDay(t), 1))) return "Tomorrow";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/* ============================================================
   SCOPE — My-subscriptions narrows the schedulable pool to owned banks.
   ============================================================ */
const PL_PLAT_ORDER = ["marrow", "cerebellum", "doctutorials", "prepladder", "egurukul"].filter(id => PLAT_BY_ID[id]);
function _ownedTopic(t) { const subs = Store.subs(); if (!subs.length) return true; return Object.keys(t.platformRefs || {}).some(pid => subs.includes(pid) && (t.platformRefs[pid] || []).length); }
/* subjects that have at least one schedulable topic under the current scope */
function _scopeSubjects() {
  const subs = Store.subs();
  if (!subs.length) return LIB_SUBJECTS.slice();
  return LIB_SUBJECTS.filter(s => libTopics(s).some(_ownedTopic));
}
/* the ordered topic pool for a set of canonical subjects, scoped to owned banks */
function _scopeTopics(subjects) {
  const list = (subjects && subjects.length) ? subjects : _scopeSubjects();
  let ts = list.flatMap(s => libTopics(s)).filter(_ownedTopic);
  // de-dupe (a topic id appears once per subject already, but guard) + importance order
  const seen = new Set(); ts = ts.filter(t => (seen.has(t.id) ? false : (seen.add(t.id), true)));
  return ts.sort(_byImp);
}
function _topicMcq(t) { let s = 0; Object.values(t.platformRefs || {}).forEach(ids => ids.forEach(id => { const m = LEAF_BY_ID[id]; if (m) s += m.mcqs || 0; })); return s; }
/* the leaf we toggle when the student marks a topic "done" — prefer an owned bank,
   so the completion is a REAL tracked action (anti-dopamine), then union-reflects it. */
function _topicPrimaryLeaf(t) {
  const refs = t.platformRefs || {}, subs = Store.subs();
  const owned = PL_PLAT_ORDER.filter(p => subs.includes(p));
  for (const p of owned) if ((refs[p] || []).length) return refs[p][0];
  for (const p of PL_PLAT_ORDER) if ((refs[p] || []).length) return refs[p][0];
  return null;
}

/* ============================================================
   ENTITY RESOLVERS — a plan item's entity is {type,id}: topic | leaf | video.
   ============================================================ */
function _entityTopic(e) { return e && e.type === "topic" ? LIB_TOPIC_BY_ID[e.id] : null; }
function _entityDone(e) {
  if (!e) return false;
  if (e.type === "topic") { const t = LIB_TOPIC_BY_ID[e.id]; return t ? libTopicUnion(t).started : false; }
  if (e.type === "leaf") return !!Store.prog(e.id).a;
  if (e.type === "video") return !!Store.video(e.id).w;
  return false;
}
function _entityName(e) {
  if (!e) return "—";
  if (e.type === "topic") { const t = LIB_TOPIC_BY_ID[e.id]; return t ? t.name : e.id; }
  if (e.type === "leaf") { const m = MODULE_BY_ID[e.id]; return m ? m.name : e.id; }
  if (e.type === "video") { const v = VID_BY_ID[e.id]; return v ? v.topic : e.id; }
  return e.id;
}
function _entitySubject(e) {
  if (!e) return "";
  if (e.type === "topic") { const t = LIB_TOPIC_BY_ID[e.id]; return t ? t.subject : ""; }
  if (e.type === "leaf") { const m = MODULE_BY_ID[e.id]; return m ? canon(m.subject) : ""; }
  if (e.type === "video") { const v = VID_BY_ID[e.id]; return v ? (BTR_CANON[v.subject] || v.subject) : ""; }
  return "";
}
/* unique library topics referenced by a plan (for coverage math) */
function _planTopics(plan) {
  const seen = new Set(), out = [];
  (plan.items || []).forEach(it => { const t = _entityTopic(it.entity); if (t && !seen.has(t.id)) { seen.add(t.id); out.push(t); } });
  return out;
}
/* every leaf id a plan touches (plan leaves + all leaves mapped to plan topics) —
   used to tag done-diary days that advanced the plan. */
function _planLeafIds(plan) {
  const ids = new Set();
  (plan.items || []).forEach(it => {
    const e = it.entity;
    if (e.type === "leaf") ids.add(e.id);
    else if (e.type === "topic") { const t = LIB_TOPIC_BY_ID[e.id]; if (t) Object.values(t.platformRefs || {}).forEach(a => a.forEach(x => ids.add(x))); }
  });
  return ids;
}

/* ============================================================
   GENERATORS — every mode produces plan.items:[{entity,targetDate,pass?}].
   ============================================================ */
let _planSeq = 0;
function _newPlanId() { return "plan-" + Date.now() + "-" + (++_planSeq); }
function _packPass(topics, days, perDayCap, pass) {
  if (!topics.length || !days.length) return [];
  const target = Math.min(perDayCap || 999, Math.max(1, Math.ceil(topics.length / days.length)));
  const out = []; let d = 0, c = 0;
  topics.forEach(t => {
    if (c >= target && d < days.length - 1) { d++; c = 0; }
    out.push({ entity: { type: "topic", id: t.id }, targetDate: days[d], pass });
    c++;
  });
  return out;
}

function _genQuick(subjects, from, to, cap) {
  const days = _dayRange(from, to);
  const pool = _scopeTopics(subjects);
  return {
    id: _newPlanId(), name: _autoName("quick", subjects), mode: "quick",
    range: { from, to }, dailyCap: cap, createdAt: _today(),
    items: _packPass(pool, days, cap), commitments: [],
  };
}
function _genTemplate(kind, subjects, from, to, cap, customPlat) {
  const days = _dayRange(from, to);
  let pool = _scopeTopics(subjects);
  let weightLabel = "directional";
  if (kind === "mcq") { pool = pool.slice().sort((a, b) => _topicMcq(b) - _topicMcq(a)); weightLabel = "proxy"; }
  else if (kind === "revision") pool = pool.filter(t => t.tier >= 2);
  else if (kind === "custom" && customPlat) pool = pool.filter(t => (t.platformRefs[customPlat] || []).length);
  const pass = kind === "revision" ? "Revision" : null;
  return {
    id: _newPlanId(), name: _autoName("template", subjects, kind), mode: "template",
    template: kind, customPlat: kind === "custom" ? customPlat : undefined, weightLabel,
    range: { from, to }, dailyCap: cap, createdAt: _today(),
    items: _packPass(pool, days, cap, pass), commitments: [],
  };
}
/* BACKWARD-PLAN — the signature feature. Phases count down from the exam:
   M1 foundation (first pass, all topics) · M2 revision+mocks (tier ≥2) ·
   M3 rapid revision / last-10-days (tier 3). High-yield therefore gets
   multiple passes; low-yield gets one. */
function _genBackward(examIso, subjects, cap) {
  const start = _today();
  const lastStudy = isoDay(addDays(parseDay(examIso), -1)); // exam day itself isn't a study day
  const days = _dayRange(start, lastStudy);
  const n = days.length;
  const pool = _scopeTopics(subjects);
  let m1End = Math.max(1, Math.floor(n * 0.5));
  let m3Start = Math.max(m1End + 1, Math.floor(n * 0.82));
  const last10 = n - 10; // reserve the last 10 days for rapid revision when the runway allows
  if (last10 > m1End) m3Start = Math.min(m3Start, last10);
  m3Start = Math.min(m3Start, n);
  const m1Days = days.slice(0, m1End);
  const m2Days = days.slice(m1End, m3Start);
  const m3Days = days.slice(m3Start);
  const items = []
    .concat(_packPass(pool, m1Days, cap, "M1"))
    .concat(m2Days.length ? _packPass(pool.filter(t => t.tier >= 2), m2Days, cap, "M2") : [])
    .concat(m3Days.length ? _packPass(pool.filter(t => t.tier === 3), m3Days, cap, "M3") : []);
  return {
    id: _newPlanId(), name: _autoName("backward", subjects, null, examIso), mode: "backward",
    examDate: examIso, dailyCap: cap, createdAt: _today(), items, commitments: [],
  };
}
/* MANUAL — forkable draft, never blank: seed from the top untracked high-yield
   topics in scope, spread across the range. Fully editable thereafter. */
function _genManual(from, to, cap) {
  const days = _dayRange(from, to);
  const pool = _scopeTopics(_scopeSubjects()).filter(t => t.tier >= 2 && !libTopicUnion(t).started).slice(0, Math.max(days.length * cap, 12));
  return {
    id: _newPlanId(), name: "My plan", mode: "manual",
    range: { from, to }, dailyCap: cap, createdAt: _today(),
    items: _packPass(pool, days, cap), commitments: [],
  };
}
function _autoName(mode, subjects, kind, examIso) {
  const subs = (subjects || []).slice();
  const subLbl = !subs.length ? "all subjects" : subs.length <= 2 ? subs.map(s => s.replace(/ \/.*/, "")).join(", ") : `${subs.length} subjects`;
  if (mode === "backward") return `Exam plan → ${examIso ? fmtDay(examIso) : ""}`.trim();
  if (mode === "template") return `${({ hybrid: "Hybrid", mcq: "MCQ-heavy", revision: "Revision/PYQ", custom: "Custom" }[kind] || "Template")} · ${subLbl}`;
  if (mode === "quick") return `Quick · ${subLbl}`;
  return "My plan";
}

/* ============================================================
   PACING / ADHERENCE / COVERAGE / GUARDRAIL
   ============================================================ */
function _planStats(plan) {
  const today = _today();
  const items = plan.items || [];
  const done = items.filter(it => _entityDone(it.entity));
  const due = items.filter(it => it.targetDate <= today);
  const dueDone = due.filter(it => _entityDone(it.entity));
  const overdue = due.filter(it => it.targetDate < today && !_entityDone(it.entity));
  const todays = items.filter(it => it.targetDate === today);
  const todaysDone = todays.filter(it => _entityDone(it.entity));
  const topics = _planTopics(plan);
  const hy = topics.filter(t => t.tier === 3);
  const hyDone = hy.filter(t => libTopicUnion(t).started).length;
  return {
    total: items.length, done: done.length,
    due: due.length, dueDone: dueDone.length, overdue: overdue.length,
    today: todays.length, todayDone: todaysDone.length,
    adherence: due.length ? pct(dueDone.length, due.length) : 100,
    coverage: hy.length ? pct(hyDone, hy.length) : 0, hyTotal: hy.length, hyDone,
    overdueItems: overdue,
  };
}
function _onTrack(plan, st) {
  if (st.total && st.done >= st.total) return { cls: "ok", txt: "Plan complete" };
  if (st.overdue === 0) return { cls: "ok", txt: "On track" };
  const cap = plan.dailyCap || 6;
  const d = Math.max(1, Math.ceil(st.overdue / cap));
  return { cls: "behind", txt: `${d} day${d > 1 ? "s" : ""} behind` };
}
/* observed pace = avg modules attempted per ACTIVE day over a trailing window.
   Returns null until there are ≥3 active days — fewer than that is noise, and a
   pace claim off noise would mis-warn (and suggest absurd caps). */
function _observedPace(windowDays) {
  const win = windowDays || 21;
  const cut = isoDay(addDays(parseDay(_today()), -win));
  const byDay = {};
  Object.values(Store.state.progress || {}).forEach(p => { if (p && p.ts && (p.a || p.r || p.t)) { const d = isoDay(new Date(p.ts)); if (d >= cut) byDay[d] = (byDay[d] || 0) + 1; } });
  const days = Object.keys(byDay); if (days.length < 3) return null;
  const total = days.reduce((a, d) => a + byDay[d], 0);
  return Math.max(1, Math.round(total / days.length));
}
/* realistic-plan guardrail. Two honest paths:
   · pace KNOWN (≥3 active days): warn when the peak day or the required pace runs
     well past what you've actually sustained; suggest a cap near your pace.
   · pace UNKNOWN: only warn on an objectively heavy load (needs >18/day) — no
     pace claim we can't back up. Exam-bound plans can't extend past the date, so
     the copy shifts to "trim / raise intensity" when even the cap won't fit. */
function _guardrail(plan) {
  const today = _today();
  const byDay = {}; (plan.items || []).forEach(it => { if (!_entityDone(it.entity)) byDay[it.targetDate] = (byDay[it.targetDate] || 0) + 1; });
  const peak = Math.max(0, ...Object.values(byDay));
  const pace = _observedPace();
  const remaining = (plan.items || []).filter(it => !_entityDone(it.entity)).length;
  const examBound = !!plan.examDate;
  const lastIso = (examBound ? isoDay(addDays(parseDay(plan.examDate), -1)) : (plan.range && plan.range.to)) || today;
  const runway = Math.max(1, daysBetween(today, lastIso) + 1);
  const needPerDay = Math.ceil(remaining / runway);
  let suggestCap;
  if (pace != null) {
    if (!(peak > Math.max(pace * 1.8, pace + 4) || needPerDay > Math.ceil(pace * 1.5))) return null;
    suggestCap = Math.max(4, Math.round(pace * 1.3));
  } else {
    if (needPerDay <= 18) return null;
    suggestCap = 12;
  }
  const fits = suggestCap * runway >= remaining;       // can the gentler cap finish in the runway?
  const suggestDays = Math.ceil(remaining / suggestCap);
  return { peak, pace, needPerDay, runway, remaining, suggestCap, suggestDays, examBound, fits };
}

/* ============================================================
   AUTO-RESCHEDULE — the recovery mechanism. Overdue, still-incomplete items
   are packed forward from tomorrow under the daily cap, preserving pass order.
   Mutates + persists ONLY when something actually moves (so render converges).
   ============================================================ */
function _autoReschedule(plan) {
  const today = _today();
  const items = (plan.items || []).map(x => Object.assign({}, x));
  const overdue = items.filter(it => it.targetDate < today && !_entityDone(it.entity));
  if (!overdue.length) return { moved: 0 };
  const cap = plan.dailyCap || 6;
  const load = {};
  items.forEach(it => { if (it.targetDate >= today && !_entityDone(it.entity)) load[it.targetDate] = (load[it.targetDate] || 0) + 1; });
  const passRank = { M1: 0, M2: 1, M3: 2, Revision: 1 };
  overdue.sort((a, b) => (passRank[a.pass] || 0) - (passRank[b.pass] || 0) || a.targetDate.localeCompare(b.targetDate));
  let cursor = addDays(parseDay(today), 1);
  overdue.forEach(it => {
    let d = isoDay(cursor);
    while ((load[d] || 0) >= cap) { cursor = addDays(cursor, 1); d = isoDay(cursor); }
    it.targetDate = d; load[d] = (load[d] || 0) + 1;
  });
  Store.updatePlan({ items });
  return { moved: overdue.length };
}

/* ============================================================
   DONE-DIARY — DERIVED from real tracking (progress[*].ts + videos[*].ts),
   grouped by local day. No new write path, nothing self-reported.
   ============================================================ */
function _doneDiary(limitDays) {
  const days = {};
  const bump = d => (days[d] = days[d] || { mods: new Set(), vids: new Set(), mins: 0 });
  Object.entries(Store.state.progress || {}).forEach(([id, p]) => { if (p && p.ts && (p.a || p.r || p.t)) bump(isoDay(new Date(p.ts))).mods.add(id); });
  Object.entries(Store.state.videos || {}).forEach(([id, x]) => { if (x && x.ts && (x.w || x.v)) { const o = bump(isoDay(new Date(x.ts))); o.vids.add(id); const v = VID_BY_ID[id]; if (x.w && v && v.durMin) o.mins += v.durMin; } });
  return Object.keys(days).sort().reverse().slice(0, limitDays || 12).map(d => ({ day: d, mods: days[d].mods, vids: days[d].vids, mins: days[d].mins }));
}

/* ============================================================
   RENDER
   ============================================================ */
let _plRendering = false;   // re-entrancy guard (auto-reschedule saves during render)
let _plRefresh = false;     // true when this render is a live refresh (suppress entrance anim)
function renderPlanner() {
  _plRendering = true;
  const refresh = _plRefresh; _plRefresh = false;
  try {
    resetPlates();
    const v = $("#view-planner"); v.innerHTML = "";
    if (!LIB || !LIB_TOPICS.length) {
      v.appendChild(el("div", "", emptyState({ icon: "compass", title: "No canonical library", body: "The topic spine (D.library) is unavailable, so plans can't be generated." })));
      _plBindOnce(); return;
    }
    const plan = Store.getPlan();
    if (plBuilder) _plBuilder(v);
    else if (plan) _plActive(v, plan);
    else _plOnboarding(v);
    _plBindOnce();
    labelizeResponsiveTables();
    // On a live refresh (a tracking tick re-derives adherence/diary), pre-stamp the
    // entrance flags so the surface updates instantly without re-playing rise/count-up.
    if (refresh) {
      $$("#view-planner [data-reveal]").forEach(e => { e.classList.add("in"); e.dataset.revealDone = "1"; });
      const h = $("#view-planner .tile.is-hero .tile-v[data-count]"); if (h) h.dataset.countDone = "1";
    }
    if (typeof animateView === "function") animateView($("#view-planner"));
  } finally { _plRendering = false; }
}

/* ── My-banks chip row (reads/writes the global Store.subs primitive) ── */
function _plBanksRow() {
  const subs = Store.subs();
  const chips = PL_PLAT_ORDER.map(id => `<button type="button" class="pl-bank${subs.includes(id) ? " on" : ""}" data-pl-bank="${esc(id)}" aria-pressed="${subs.includes(id)}" style="--c:${platColor(id)}">${esc(platDisplayName(id))}</button>`).join("");
  return `<div class="pl-banks"><span class="pl-banks-l">My banks</span>${chips}`
    + `<span class="pl-banks-note">${subs.length ? "plans scope to these" : "optional — scopes plans to what you own"}</span></div>`;
}

/* ============================================================
   ONBOARDING — never a blank page.
   ============================================================ */
function _plOnboarding(v) {
  const intro = el("div", "callout plan-intro");
  intro.dataset.reveal = "";
  intro.innerHTML = `<b>Build a plan you'll actually keep.</b> Adherence and coverage are the metrics ${epiBadge("measured")} —
    progress auto-logs from what you really track, never self-reported. Lock an exam date and the plan counts <em>backward</em> into
    revision passes and re-plans itself when a day slips. <span class="muted">Local-first: everything saves on this device.</span>`;
  v.appendChild(intro);

  const banks = el("div", "pl-banks-wrap"); banks.dataset.reveal = ""; banks.innerHTML = _plBanksRow(); v.appendChild(banks);

  const modes = [
    { m: "backward", icon: "◆", title: "Backward-plan from an exam date", hero: true, sub: "Lock the date → auto M1/M2/M3 revision passes, a live on-track read, and auto-reschedule when you miss a day. The signature mode." },
    { m: "quick", icon: "⚡", title: "Quick-schedule", sub: "Pick subjects + a date range → topics auto-distribute by importance under a daily cap." },
    { m: "template", icon: "▤", title: "Intensity template", sub: "Hybrid · MCQ-heavy · Revision/PYQ · Custom — distribute from your owned banks." },
    { m: "manual", icon: "✎", title: "Manual / custom", sub: "Start from a seeded draft of your top high-yield gaps, then hand-edit day by day." },
  ];
  const grid = el("div", "pl-modegrid"); grid.dataset.reveal = "";
  grid.innerHTML = modes.map(o => `<button type="button" class="pl-modecard${o.hero ? " hero" : ""}" data-pl-mode="${o.m}">`
    + `<span class="pl-mode-i" aria-hidden="true">${o.icon}</span>`
    + `<span class="pl-mode-t">${esc(o.title)}${o.hero ? ` <span class="pl-sig">signature</span>` : ""}</span>`
    + `<span class="pl-mode-s">${esc(o.sub)}</span></button>`).join("");
  v.appendChild(grid);

  /* seed: top untracked high-yield in scope — the forkable "plan this first" preview */
  const seed = _scopeTopics(_scopeSubjects()).filter(t => t.tier === 3 && !libTopicUnion(t).started).slice(0, 12);
  if (seed.length) {
    const rows = seed.map(t => listRow({
      lead: impStars(t.tier),
      title: `<a class="is-link" data-go-subject="${esc(t.subject)}">${esc(t.name)}</a>`,
      sub: `<span class="pl-sectag">${esc(t.subject)}</span>${t.timesRepeated != null ? ` <span class="pl-freq">asked ${t.timesRepeated}×</span>` : ""}`,
      trail: libCoverageChips(t),
    }));
    v.appendChild(_plFrame(panel({
      title: "Plan these first — your untracked high-yield", epi: "directional", sourceIds: LIB_SRC_IDS, captured: LIB_CAP, curated: true,
      actions: `<button type="button" class="linkbtn" data-pl-seed>Quick-start a 2-week plan →</button>`,
      body: groupList(rows, "pl-seedlist") + `<div class="cf-note">High-yield by community-curated PYQ frequency ${epiBadge("directional")} that you haven't started on any bank. A starting draft — you edit everything.</div>`,
    })));
  }

  /* social accountability — visible even before a plan exists (you can still join a pod) */
  if (typeof _plSocialSection === "function") v.appendChild(_plSocialSection());
}

/* ============================================================
   BUILDER FORMS
   ============================================================ */
function _plBuilder(v) {
  const b = plBuilder;
  const head = el("div", "pl-builder-head"); head.dataset.reveal = "";
  const titles = { quick: "Quick-schedule", template: "Intensity template", backward: "Backward-plan from an exam date", manual: "Manual / custom" };
  head.innerHTML = `<button type="button" class="linkbtn pl-back" data-pl-cancel>← back</button><h2>${esc(titles[b.mode] || "New plan")}</h2>`;
  v.appendChild(head);

  const form = el("div", "panel pl-form"); form.dataset.reveal = "";
  let html = "";

  if (Store.subs().length || b.mode !== "backward") html += `<div class="pl-field pl-banks-field">${_plBanksRow()}</div>`;

  if (b.mode === "template") {
    const tOpts = [{ v: "hybrid", label: "Hybrid" }, { v: "mcq", label: "MCQ-heavy" }, { v: "revision", label: "Revision/PYQ" }, { v: "custom", label: "Custom" }];
    html += `<div class="pl-field"><label class="pl-lbl">Intensity</label>${segmented(tOpts, b.template || "hybrid", "plTemplate")}</div>`;
    if ((b.template || "hybrid") === "custom") {
      const opts = PL_PLAT_ORDER.map(id => `<option value="${esc(id)}"${b.customPlat === id ? " selected" : ""}>${esc(platDisplayName(id))}</option>`).join("");
      html += `<div class="pl-field"><label class="pl-lbl" for="plCustomPlat">Bank</label><select class="sel" id="plCustomPlat">${opts}</select></div>`;
    }
  }

  if (b.mode === "backward") {
    const def = b.exam || isoDay(addDays(parseDay(_today()), 60));
    html += `<div class="pl-field"><label class="pl-lbl" for="plExam">Exam date</label><input class="pl-date" type="date" id="plExam" min="${isoDay(addDays(parseDay(_today()), 2))}" value="${esc(def)}"></div>`;
  } else {
    const from = b.from || _today();
    const to = b.to || isoDay(addDays(parseDay(_today()), 14));
    html += `<div class="pl-field pl-dates"><div><label class="pl-lbl" for="plFrom">From</label><input class="pl-date" type="date" id="plFrom" value="${esc(from)}"></div>`
      + `<div><label class="pl-lbl" for="plTo">To</label><input class="pl-date" type="date" id="plTo" value="${esc(to)}"></div></div>`;
  }

  html += `<div class="pl-field"><label class="pl-lbl" for="plCap">Daily cap <span class="muted small">topics/day</span></label><input class="pl-num" type="number" min="1" max="40" id="plCap" value="${b.cap || (b.mode === "backward" ? 8 : 6)}"></div>`;

  if (b.mode !== "manual") {
    const scope = _scopeSubjects();
    const sel = new Set(b.subjects && b.subjects.length ? b.subjects : scope);
    b.subjects = [...sel];
    html += `<div class="pl-field"><label class="pl-lbl">Subjects <span class="muted small">${Store.subs().length ? "in your banks" : ""}</span> <button type="button" class="linkbtn pl-selall" data-pl-selall>all</button> / <button type="button" class="linkbtn" data-pl-selnone>none</button></label>`
      + `<div class="pl-subjchips">` + scope.map(s => `<button type="button" class="pl-chip${sel.has(s) ? " on" : ""}" data-pl-subj="${esc(s)}" aria-pressed="${sel.has(s)}">${esc(s.replace(/ \/.*/, ""))}</button>`).join("") + `</div></div>`;
  }

  html += `<div class="pl-actions"><button type="button" class="pl-create" data-pl-create>Create plan</button>`
    + `<button type="button" class="linkbtn" data-pl-cancel>Cancel</button></div>`;
  html += `<div class="cf-note">Topics come from the canonical spine, ordered by community-curated PYQ importance ${epiBadge("directional")}${b.mode === "template" && b.template === "mcq" ? ` (MCQ-heavy reorders by density ${epiBadge("proxy")})` : ""}. Nothing here is graded yet — it's a draft you can edit after creating.</div>`;
  form.innerHTML = html;
  v.appendChild(form);
}

/* ============================================================
   ACTIVE PLAN
   ============================================================ */
function _plActive(v, plan) {
  /* 0 — snapshot any completed weeks BEFORE reschedule rewrites their dates (history-safe) */
  _autoSnapshotCycles(plan);
  if (Store.getCycles().length) plan = Store.getPlan() || plan;   // re-read if a lock saved
  /* 1 — auto-reschedule any missed days BEFORE we read stats (the recovery core) */
  const resched = _autoReschedule(plan);
  if (resched.moved) plan = Store.getPlan();
  const st = _planStats(plan);
  const ot = _onTrack(plan, st);
  const today = _today();

  /* header */
  const head = el("div", "pl-head"); head.dataset.reveal = "";
  const modeLabel = { quick: "Quick", template: "Template", backward: "Backward-plan", manual: "Manual" }[plan.mode] || plan.mode;
  let metaBits = `<span class="pl-modechip">${esc(modeLabel)}</span>`;
  if (plan.mode === "backward" && plan.examDate) {
    const dte = daysBetween(today, plan.examDate);
    metaBits += `<span class="pl-dte">${dte > 0 ? dte + " day" + (dte === 1 ? "" : "s") + " to exam" : dte === 0 ? "Exam today" : "Exam passed"} · ${fmtDay(plan.examDate)}</span>`;
  } else if (plan.range) {
    metaBits += `<span class="pl-dte">${fmtDay(plan.range.from)} → ${fmtDay(plan.range.to)}</span>`;
  }
  head.innerHTML = `<div class="pl-head-l"><h2 class="pl-name">${esc(plan.name)} <button type="button" class="pl-rename" data-pl-rename title="Rename">✎</button></h2><div class="pl-meta">${metaBits}</div></div>`
    + `<div class="pl-head-r"><button type="button" class="pl-btn${plEdit ? " on" : ""}" data-pl-edit>${plEdit ? "Done editing" : "Edit"}</button><button type="button" class="pl-btn" data-pl-new>New plan</button></div>`;
  v.appendChild(head);

  /* recovery banner (auto-reschedule fired) */
  if (resched.moved) {
    const rb = el("div", "callout pl-recovery"); rb.dataset.reveal = "";
    rb.innerHTML = `<b>Caught you up.</b> ${resched.moved} missed item${resched.moved === 1 ? "" : "s"} moved forward into your upcoming days — no need to start over. <span class="muted">Auto-reschedule is the recovery, not a penalty.</span>`;
    v.appendChild(rb);
  }

  /* hero tiles */
  const tiles = el("div", "tiles pl-tiles");
  tiles.innerHTML =
    statTile({ accent: "g", hero: true, value: st.adherence + "%", label: "Adherence", note: `${st.dueDone}/${st.due} due items done`, epi: "measured" }) +
    statTile({ accent: "m", value: st.coverage + "%", label: "High-yield covered", note: `${st.hyDone}/${st.hyTotal} HY topics · union`, epi: "measured" }) +
    statTile({ accent: ot.cls === "ok" ? "c" : "g", value: ot.txt, label: "Status", note: plan.mode === "backward" && plan.examDate ? `${Math.max(0, daysBetween(today, plan.examDate))} days left` : "vs your schedule", epi: "measured" }) +
    statTile({ accent: "k", value: pct(st.done, st.total) + "%", label: "Plan progress", note: `${st.done}/${st.total} items`, epi: "measured" }) +
    statTile({ accent: "c", value: fmt(st.today), label: "Today's load", note: `${st.todayDone} done`, epi: "measured" }) +
    statTile({ accent: ot.cls === "behind" ? "g" : "k", value: fmt(st.overdue), label: "Overdue", note: st.overdue ? "rescheduled forward" : "all caught up", epi: "measured" });
  tiles.innerHTML = tiles.innerHTML.replace('<span class="tile-v num">' + st.adherence + '%</span>', '<span class="tile-v num" data-count="' + st.adherence + '">' + st.adherence + '%</span>');
  v.appendChild(tiles);

  /* cycle stat bar — weekly/monthly planned-vs-done across dates, by subject + extent */
  v.appendChild(_plCycleBar(plan));

  /* on-track callout (calm) */
  const otc = el("div", "callout pl-ontrack " + ot.cls); otc.dataset.reveal = "";
  if (ot.cls === "ok") {
    otc.innerHTML = `<b>${esc(ot.txt)}.</b> You've kept ${st.dueDone} of ${st.due} commitments due so far. <span class="muted">Coverage is the goal — keep clearing high-yield, not piling on hours.</span>`;
  } else {
    otc.innerHTML = `<b>${esc(ot.txt)} — and that's recoverable.</b> Missed items were moved into upcoming days automatically. <span class="muted">Do today's list; the plan absorbs the slip.</span>`;
  }
  v.appendChild(otc);

  /* guardrail (realistic-plan) */
  const g = _guardrail(plan);
  if (g) {
    const gc = el("div", "callout pl-guard firewall"); gc.dataset.reveal = "";
    const lead = g.pace != null
      ? `<b>This plan is denser than your pace.</b> Your recent pace is ~${g.pace} topics/day ${epiBadge("measured")}, but ${g.peak > g.needPerDay ? `a day peaks at ${g.peak}` : `you'd need ~${g.needPerDay}/day`} to finish on time.`
      : `<b>This is a heavy daily load.</b> Finishing on time needs ~${g.needPerDay} topics/day — a lot to sustain.`;
    const fix = g.fits
      ? `A feasible split: cap at <b>${g.suggestCap}/day</b>${g.examBound ? " — that fits before your exam" : ` over ~${g.suggestDays} days`}. <button type="button" class="linkbtn" data-pl-relax="${g.suggestCap}">Re-cap &amp; spread →</button>`
      : g.examBound
        ? `Even ${g.suggestCap}/day won't fit ${g.runway} days — trim lower-yield topics (or lean on the revision passes) rather than cram. <button type="button" class="linkbtn" data-pl-relax="${g.suggestCap}">Re-cap to ${g.suggestCap}/day →</button>`
        : `A feasible split: cap at <b>${g.suggestCap}/day</b> over ~${g.suggestDays} days. <button type="button" class="linkbtn" data-pl-relax="${g.suggestCap}">Re-cap &amp; spread →</button>`;
    gc.innerHTML = `${lead} ${fix} <span class="muted">Better a plan you keep than one you abandon.</span>`;
    v.appendChild(gc);
  }

  /* backward-plan pass timeline (M1/M2/M3) */
  if (plan.mode === "backward") v.appendChild(_plPassTimeline(plan));

  /* the schedule — today + upcoming days, trackable inline */
  v.appendChild(_plSchedule(plan, st));

  /* locked cycles — retrospective follow-up on what wasn't done/reviewed/revised */
  const cyclesList = _plCyclesList();
  if (cyclesList) v.appendChild(cyclesList);

  /* done-diary (derived) */
  v.appendChild(_plDoneDiary(plan));

  /* social accountability — pods · board · partner · snapshot (account-gated) */
  if (typeof _plSocialSection === "function") v.appendChild(_plSocialSection());

  /* footer: scope reminder + delete */
  const foot = el("div", "pl-foot"); foot.dataset.reveal = "";
  foot.innerHTML = `${_plBanksRow()}<div class="cf-note">Completion counts only from real tracked actions — ticking a topic here marks the underlying module attempted on your bank, and the done-diary is built from those timestamps. No vanity hours, no leaderboard. Sign in to share your aggregate with a pod or partner — opt-in, solidarity, never a ranking.</div>`;
  v.appendChild(foot);
}

/* M1/M2/M3 pass cards with date spans + per-pass progress */
function _plPassTimeline(plan) {
  const defs = [
    { k: "M1", t: "M1 · Foundation", s: "First pass — every topic in scope" },
    { k: "M2", t: "M2 · Revision + mocks", s: "Second pass — high & moderate yield" },
    { k: "M3", t: "M3 · Rapid revision", s: "Final pass — top high-yield, last days" },
  ];
  const cards = defs.map(d => {
    const its = (plan.items || []).filter(it => it.pass === d.k);
    if (!its.length) return "";
    const done = its.filter(it => _entityDone(it.entity)).length;
    const dates = its.map(it => it.targetDate).sort();
    const span = dates.length ? `${fmtDay(dates[0])} → ${fmtDay(dates[dates.length - 1])}` : "—";
    return `<div class="pl-passcard pl-${d.k.toLowerCase()}"><div class="pl-pass-h"><span class="pl-pass-t">${esc(d.t)}</span><span class="pl-pass-span num">${esc(span)}</span></div>`
      + `<div class="pl-pass-s">${esc(d.s)}</div>`
      + `<div class="pl-pass-m">${meterHTML(done, its.length)}</div></div>`;
  }).filter(Boolean).join("");
  const wrap = el("div", "pl-passgrid"); wrap.dataset.reveal = "";
  wrap.innerHTML = `<div class="pl-section-h"><h3>Revision passes — counting down to the exam ${epiBadge("directional")}</h3><span class="muted small">High-yield gets multiple passes; everything gets at least one. Date math is local.</span></div><div class="pl-passcards">${cards}</div>`;
  return wrap;
}

/* topic/leaf/video item row inside a day */
function _plItemRow(it) {
  const e = it.entity, t = _entityTopic(e);
  const done = _entityDone(e);
  const lead = t ? impStars(t.tier) : (e.type === "video" ? `<span class="pl-vico">▷</span>` : `<span class="lr-dot" style="--c:var(--ink-4)"></span>`);
  const subj = _entitySubject(e);
  const passTag = it.pass ? `<span class="pl-pass pl-${String(it.pass).toLowerCase()}">${esc(it.pass)}</span>` : "";
  const pips = t ? libCoverageChips(t) : "";
  const titleHtml = t || subj
    ? `<a class="is-link" data-go-subject="${esc(subj)}">${esc(_entityName(e))}</a>`
    : esc(_entityName(e));
  const trackable = t ? !!_topicPrimaryLeaf(t) : (e.type === "leaf" || e.type === "video");
  const doneBtn = trackable
    ? `<button type="button" class="pl-donebtn${done ? " on" : ""}" data-pl-done="${esc(e.type)}" data-pl-eid="${esc(e.id)}" aria-pressed="${done}" title="${done ? "Done — marked on your bank" : "Mark done (marks the module attempted)"}">${done ? "✓ Done" : "Mark done"}</button>`
    : `<span class="pl-untrack" title="No platform maps this topic — track via your notes">no bank</span>`;
  const editBits = plEdit
    ? `<input class="pl-itemdate" type="date" data-pl-date data-pl-eid="${esc(e.id)}" data-pl-etype="${esc(e.type)}" value="${esc(it.targetDate)}" title="Move to a day">`
    + `<button type="button" class="pl-rm" data-pl-rm data-pl-eid="${esc(e.id)}" data-pl-etype="${esc(e.type)}" title="Remove from plan" aria-label="Remove">✕</button>`
    : "";
  return `<div class="lrow pl-item${done ? " done" : ""}">`
    + `<span class="lrow-lead">${lead}</span>`
    + `<span class="lrow-main"><span class="lrow-title">${titleHtml}</span>`
    + `<span class="lrow-sub"><span class="pl-sectag">${esc(subj || "")}</span>${passTag}${pips}</span></span>`
    + `<span class="lrow-trail">${editBits}${doneBtn}</span></div>`;
}

function _plSchedule(plan, st) {
  const today = _today();
  const byDay = {}; (plan.items || []).forEach(it => (byDay[it.targetDate] = byDay[it.targetDate] || []).push(it));
  const wrap = el("section", "panel pl-schedule"); wrap.dataset.reveal = "";

  // any residual overdue (defensive — auto-reschedule should have cleared these)
  const overdueDays = Object.keys(byDay).filter(d => d < today).sort();
  const residual = overdueDays.flatMap(d => byDay[d]).filter(it => !_entityDone(it.entity));

  const futureDays = Object.keys(byDay).filter(d => d >= today).sort();
  const WINDOW = 14;
  const shown = futureDays.slice(0, WINDOW);
  const hiddenDays = futureDays.slice(WINDOW);
  const hiddenItems = hiddenDays.reduce((a, d) => a + byDay[d].length, 0);

  let body = "";
  if (residual.length) {
    body += `<div class="pl-day pl-overdue"><div class="pl-day-h"><span class="pl-day-d">Overdue</span><span class="pl-day-m">${residual.length} item${residual.length === 1 ? "" : "s"}</span></div>`
      + `<div class="lgroup">${residual.map(_plItemRow).join("")}</div></div>`;
  }
  shown.forEach(d => {
    const its = byDay[d];
    const done = its.filter(it => _entityDone(it.entity)).length;
    const isToday = d === today;
    body += `<div class="pl-day${isToday ? " is-today" : ""}"><div class="pl-day-h"><span class="pl-day-d">${esc(fmtDayFull(d))}<span class="pl-day-date num"> ${esc(fmtDay(d))}</span></span><span class="pl-day-m">${meterHTML(done, its.length)}</span></div>`
      + `<div class="lgroup">${its.map(_plItemRow).join("")}</div></div>`;
  });
  if (!shown.length && !residual.length) {
    body += emptyState({ icon: "ledger", title: "Nothing scheduled ahead", body: plEdit ? "Add topics below, or create a new plan." : "Switch on Edit to add topics, or start a new plan." });
  }

  const addRow = plEdit ? `<div class="pl-addrow"><button type="button" class="linkbtn" data-pl-add>+ add a topic</button></div>` : "";
  const moreNote = hiddenItems ? `<div class="cf-note">+ ${hiddenItems} more item${hiddenItems === 1 ? "" : "s"} across ${hiddenDays.length} later day${hiddenDays.length === 1 ? "" : "s"} (showing the next ${WINDOW} days).</div>` : "";

  wrap.innerHTML = `<div class="ph"><div class="ph-l"><h3>Your schedule</h3><span class="muted small">tick what you finish — it logs to the done-diary and lifts adherence</span></div>`
    + `<span class="count-pill">${st.done}/${st.total} done</span></div>`
    + `<div class="pl-days">${body}</div>${addRow}${moreNote}`;
  return wrap;
}

function _plDoneDiary(plan) {
  const diary = _doneDiary(12);
  const planLeaves = _planLeafIds(plan);
  const showHours = !!plan.showHours;
  const wrap = el("section", "panel pl-diary"); wrap.dataset.reveal = "";
  let body;
  if (!diary.length) {
    body = emptyState({ icon: "quill", title: "Your done-diary builds itself", body: "As you tick modules and watch videos anywhere in Calvetra, your real activity appears here, grouped by day — nothing to log by hand." });
  } else {
    const rows = diary.map(dd => {
      const onPlan = [...dd.mods].some(id => planLeaves.has(id));
      const bits = [];
      if (dd.mods.size) bits.push(`${dd.mods.size} module${dd.mods.size === 1 ? "" : "s"}`);
      if (dd.vids.size) bits.push(`${dd.vids.size} video${dd.vids.size === 1 ? "" : "s"}`);
      if (showHours && dd.mins) bits.push(`<span class="pl-mins">${Math.round(dd.mins)}m video</span>`);
      return listRow({
        lead: onPlan ? `<span class="pl-onplan" title="Advanced your plan">●</span>` : `<span class="lr-dot" style="--c:var(--ink-4)"></span>`,
        title: `<span class="pl-diary-d">${esc(fmtDayFull(dd.day))}</span> <span class="muted small num">${esc(fmtDay(dd.day))}</span>`,
        sub: bits.join(" · ") || "—",
        trail: onPlan ? `<span class="pl-onplan-tag">on plan</span>` : "",
      });
    });
    body = groupList(rows, "pl-diarylist");
  }
  wrap.innerHTML = `<div class="ph"><div class="ph-l"><h3>Done-diary ${epiBadge("measured")}</h3><span class="muted small">derived from your real tracking timestamps — not self-reported</span></div>`
    + `<button type="button" class="linkbtn pl-hours${showHours ? " on" : ""}" data-pl-hours>${showHours ? "Hide hours" : "Show hours"}</button></div>`
    + `<div class="panel-body">${body}</div>`
    + (showHours ? `<div class="cf-note">Hours are video minutes only ${epiBadge("measured")} (from captured durations) — MCQ/reading time isn't tracked, so it's never invented. Optional and never ranked, by design.</div>` : "");
  return wrap;
}

/* ============================================================
   ADD-ITEM picker (manual / edit) — two-step sheet: subject → topic.
   ============================================================ */
function _plAddItem() {
  const subs = _scopeSubjects().slice().sort();
  openSheet("Add a topic — pick a subject", subs.map(s => [s, s]), null, subj => {
    const plan = Store.getPlan(); if (!plan) return;
    const have = new Set(plan.items.filter(it => it.entity.type === "topic").map(it => it.entity.id));
    const topics = libTopics(subj).filter(_ownedTopic).filter(t => !have.has(t.id)).slice(0, 60);
    if (!topics.length) { toast("All this subject's topics are already in the plan", true); return; }
    setTimeout(() => openSheet(`Add from ${subj.replace(/ \/.*/, "")}`, topics.map(t => [t.id, `${"★".repeat(t.tier)} ${t.name}`]), null, tid => {
      const p = Store.getPlan(); if (!p) return;
      const items = p.items.slice();
      items.push({ entity: { type: "topic", id: tid }, targetDate: _today() });
      Store.updatePlan({ items });
      toast("Added to today — drag the date to move it");
      renderPlanner();
    }), 60);
  });
}

/* ============================================================
   BUILDER SUBMIT — read the DOM at submit time (no per-keystroke re-render).
   ============================================================ */
function _plReadBuilder() {
  const b = plBuilder; if (!b) return null;
  const cap = Math.max(1, Math.min(40, parseInt(($("#plCap") || {}).value, 10) || (b.mode === "backward" ? 8 : 6)));
  const subjects = $$("#view-planner .pl-chip.on").map(c => c.dataset.plSubj);
  if (b.mode === "backward") {
    const exam = ($("#plExam") || {}).value;
    if (!exam || daysBetween(_today(), exam) < 2) { toast("Pick an exam date at least 2 days out", true); return null; }
    return _genBackward(exam, subjects, cap);
  }
  if (b.mode === "manual") {
    const from = ($("#plFrom") || {}).value || _today();
    const to = ($("#plTo") || {}).value || isoDay(addDays(parseDay(from), 14));
    if (to < from) { toast("End date is before start date", true); return null; }
    return _genManual(from, to, cap);
  }
  // quick / template
  const from = ($("#plFrom") || {}).value || _today();
  const to = ($("#plTo") || {}).value || isoDay(addDays(parseDay(from), 14));
  if (to < from) { toast("End date is before start date", true); return null; }
  if (!subjects.length) { toast("Pick at least one subject", true); return null; }
  if (b.mode === "template") {
    const kind = ($$("#view-planner .seg[data-seg='plTemplate'] button.on")[0] || {}).dataset?.segV || b.template || "hybrid";
    const customPlat = ($("#plCustomPlat") || {}).value;
    return _genTemplate(kind, subjects, from, to, cap, customPlat);
  }
  return _genQuick(subjects, from, to, cap);
}

/* ============================================================
   CYCLE STAT BAR — weekly / monthly planned-vs-done across dates, by
   subject + extent (Done / Reviewed / Revised), with retrospective
   lockable cycles. All figures derive from real tracked actions (the
   same a/r/t + w/v flags), so nothing is self-reported. `measured`.
   ============================================================ */

/* window math — week = Monday-anchored ISO week; month = calendar month */
function _mondayOf(iso) { const d = parseDay(iso); const wd = (d.getDay() + 6) % 7; return isoDay(addDays(d, -wd)); }
function _cycleWindow(span, refIso) {
  const ref = refIso || _today();
  if (span === "month") {
    const d = parseDay(ref);
    const from = isoDay(new Date(d.getFullYear(), d.getMonth(), 1));
    const to = isoDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    return { span: "month", from, to, ref, label: parseDay(from).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) };
  }
  const from = _mondayOf(ref), to = isoDay(addDays(parseDay(from), 6));
  return { span: "week", from, to, ref, label: `Week of ${fmtDay(from)}` };
}
function _winLabel(c) { return _cycleWindow(c.span, c.from).label; }

/* intent (target extent) for an item — from its revision pass; non-backward → "do" */
function _intentOf(it) { const p = it && it.pass; if (p === "M2") return "review"; if (p === "M3" || p === "Revision") return "revise"; return "do"; }
/* achieved extent flags for an entity, from the SAME real tracking the trackers write */
function _extentFlags(e) {
  if (!e) return { done: false, reviewed: false, revised: false };
  if (e.type === "topic") { const t = LIB_TOPIC_BY_ID[e.id]; const u = t ? libTopicUnion(t) : {}; return { done: !!u.started, reviewed: !!u.reviewed, revised: !!u.mastered }; }
  if (e.type === "leaf") { const p = Store.prog(e.id); return { done: !!p.a, reviewed: !!p.r, revised: !!p.t }; }
  if (e.type === "video") { const x = Store.video(e.id); return { done: !!x.w, reviewed: !!x.v, revised: !!x.v }; }
  return { done: false, reviewed: false, revised: false };
}
function _meetsIntent(e, intent) { const f = _extentFlags(e); return intent === "do" ? f.done : intent === "review" ? f.reviewed : f.revised; }
/* revision tally 0..3 (R1 done / R2 reviewed / R3 revised); video caps at 2 honestly */
function _revCount(e) {
  if (e && e.type === "video") { const x = Store.video(e.id); return x.v ? 2 : (x.w ? 1 : 0); }
  const f = _extentFlags(e); return (f.done ? 1 : 0) + (f.reviewed ? 1 : 0) + (f.revised ? 1 : 0);
}

/* the active plan's items that fall inside a window */
function _cyclePlanned(plan, win) { return (plan.items || []).filter(it => it.targetDate >= win.from && it.targetDate <= win.to); }

/* full derived stats for a live window */
function _cycleStats(plan, win) {
  const items = _cyclePlanned(plan, win);
  const bySub = {}, byDay = {};
  items.forEach(it => {
    const s = _entitySubject(it.entity) || "—"; (bySub[s] = bySub[s] || []).push(it);
    const o = byDay[it.targetDate] = byDay[it.targetDate] || { planned: 0, done: 0 };
    o.planned++; if (_extentFlags(it.entity).done) o.done++;
  });
  const met = items.filter(it => _meetsIntent(it.entity, _intentOf(it))).length;
  const notDone = [], notReviewed = [], notRevised = [];
  items.forEach(it => {
    const intent = _intentOf(it), f = _extentFlags(it.entity);
    if (!f.done) notDone.push(it);
    else if ((intent === "review" || intent === "revise") && !f.reviewed) notReviewed.push(it);
    else if (intent === "revise" && !f.revised) notRevised.push(it);
  });
  const subjStats = Object.keys(bySub).map(s => {
    const its = bySub[s];
    const done = its.filter(it => _extentFlags(it.entity).done).length;
    const reviewed = its.filter(it => _extentFlags(it.entity).reviewed).length;
    const revised = its.filter(it => _extentFlags(it.entity).revised).length;
    const m = its.filter(it => _meetsIntent(it.entity, _intentOf(it))).length;
    return { subject: s, items: its, total: its.length, met: m, adher: pct(m, its.length), done, reviewed, revised };
  }).sort((a, b) => b.total - a.total || a.subject.localeCompare(b.subject));
  return {
    items, total: items.length, met, adherence: items.length ? pct(met, items.length) : 0,
    byDay, subjStats, notDone, notReviewed, notRevised,
    behind: subjStats.filter(s => s.adher < 100).length, onTrack: subjStats.filter(s => s.adher >= 100).length,
  };
}

/* forgetting-curve nudge (1-3-7-15): topics DONE ≥7d ago, not yet reviewed. Derived count only. */
function _dueToRevise() {
  const today = parseDay(_today()); let n = 0;
  Object.entries(Store.state.progress || {}).forEach(([id, p]) => {
    if (p && p.a && !p.r && p.ts) { const days = Math.round((today - parseDay(isoDay(new Date(p.ts)))) / 86400000); if (days >= 7) n++; }
  });
  return n;
}

/* build a LEAN locked-cycle record — entity ids + intent + id-array snapshot only
   (subject/name/label are re-derived at render; keeps cycles[] under the blob cap). */
function _buildLockedCycle(plan, win, auto) {
  const items = _cyclePlanned(plan, win);
  const planned = items.map(it => ({ entity: { type: it.entity.type, id: it.entity.id }, intent: _intentOf(it) }));
  const doneIds = [], reviewedIds = [], revisedIds = [];
  items.forEach(it => { const f = _extentFlags(it.entity), id = it.entity.id; if (f.done) doneIds.push(id); if (f.reviewed) reviewedIds.push(id); if (f.revised) revisedIds.push(id); });
  const met = items.filter(it => _meetsIntent(it.entity, _intentOf(it))).length;
  return {
    id: "cyc-" + win.span + "-" + win.from, span: win.span, from: win.from, to: win.to,
    lockedAt: Date.now(), auto: !!auto,
    planned, snapshot: { doneIds, reviewedIds, revisedIds },
    lockAdherence: items.length ? pct(met, items.length) : 0,
  };
}

/* auto-snapshot COMPLETED WEEKS only, idempotent (keyed by window), bounded to the
   plan's lifetime. MUST run before _autoReschedule (which rewrites targetDate and would
   erase the planned history). Month is never auto-locked → no overlapping records. */
function _autoSnapshotCycles(plan) {
  if (!plan || !(plan.items || []).length) return;
  const have = new Set(Store.getCycles().map(c => c.id));
  const dates = (plan.items || []).map(i => i.targetDate).sort();
  const startRef = plan.createdAt || dates[0] || _today();
  const curMonday = _mondayOf(_today());
  let wk = _mondayOf(startRef), guard = 0;
  while (wk < curMonday && guard++ < 130) {           // cap ~2.5y of weeks
    const win = _cycleWindow("week", wk);
    if (!have.has("cyc-week-" + win.from) && _cyclePlanned(plan, win).length) {
      Store.lockCycle(_buildLockedCycle(plan, win, true));
    }
    wk = isoDay(addDays(parseDay(wk), 7));
  }
}

/* live backlog for a LOCKED cycle — re-evaluated against CURRENT tracking, so
   catching up later shrinks it (the frozen lockAdherence is the honest record). */
function _lockedBacklog(cyc) {
  const planned = cyc.planned || [];
  const notDone = [], notReviewed = [], notRevised = [];
  planned.forEach(p => {
    const f = _extentFlags(p.entity), intent = p.intent;
    if (!f.done) notDone.push(p);
    else if ((intent === "review" || intent === "revise") && !f.reviewed) notReviewed.push(p);
    else if (intent === "revise" && !f.revised) notRevised.push(p);
  });
  const met = planned.filter(p => _meetsIntent(p.entity, p.intent)).length;
  return { notDone, notReviewed, notRevised, met, total: planned.length, liveAdherence: planned.length ? pct(met, planned.length) : 0 };
}

/* ── render: the live cycle stat bar ── */
function _plCycleBar(plan) {
  const win = _cycleWindow(plCycleSpan, plCycleRef);
  const cs = _cycleStats(plan, win);
  const wrap = el("section", "panel pl-cycle"); wrap.dataset.reveal = "";

  const seg = `<div class="seg pl-cyc-span">`
    + `<button type="button" data-pl-cyc-span="week" class="${plCycleSpan === "week" ? "on" : ""}" aria-pressed="${plCycleSpan === "week"}">Week</button>`
    + `<button type="button" data-pl-cyc-span="month" class="${plCycleSpan === "month" ? "on" : ""}" aria-pressed="${plCycleSpan === "month"}">Month</button></div>`;
  const nav = `<div class="pl-cyc-nav"><button type="button" class="pl-cyc-arrow" data-pl-cyc-move="-1" aria-label="Previous ${plCycleSpan}">‹</button>`
    + `<span class="pl-cyc-label num">${esc(win.label)}</span>`
    + `<button type="button" class="pl-cyc-arrow" data-pl-cyc-move="1" aria-label="Next ${plCycleSpan}">›</button></div>`;

  // per-date load strip
  const days = _dayRange(win.from, win.to);
  const maxLoad = Math.max(1, ...days.map(d => (cs.byDay[d] || {}).planned || 0));
  const strip = days.map(d => {
    const o = cs.byDay[d] || { planned: 0, done: 0 };
    const h = o.planned ? Math.max(8, Math.round((o.planned / maxLoad) * 100)) : 0;
    const fill = o.planned ? Math.round((o.done / o.planned) * 100) : 0;
    // week: weekday initial on every bar; month: only the 1st + each Monday (keeps ~30 bars legible at 320px)
    let lbl;
    if (plCycleSpan === "week") lbl = parseDay(d).toLocaleDateString("en-IN", { weekday: "narrow" });
    else { const dd = parseDay(d); lbl = (dd.getDate() === 1 || dd.getDay() === 1) ? String(dd.getDate()) : ""; }
    return `<span class="pl-cyc-bar${d === _today() ? " is-today" : ""}${o.done && o.done >= o.planned ? " full" : ""}" title="${esc(fmtDay(d))} · ${o.done}/${o.planned} done">`
      + `<span class="pl-cyc-track"><i style="height:${h}%"><b style="height:${fill}%"></b></i></span>`
      + `<span class="pl-cyc-bd">${esc(lbl)}</span></span>`;
  }).join("");

  // hero tiles (reuse statTile) — all measured
  const backlogN = cs.notDone.length + cs.notReviewed.length + cs.notRevised.length;
  const tiles = `<div class="tiles pl-cyc-tiles">`
    + statTile({ accent: "g", hero: true, value: cs.adherence + "%", label: "Cycle adherence", note: `${cs.met}/${cs.total} planned met`, epi: "measured" })
    + statTile({ accent: backlogN ? "g" : "c", value: fmt(backlogN), label: "Backlog", note: `${cs.notDone.length} do · ${cs.notReviewed.length} review · ${cs.notRevised.length} revise`, epi: "measured" })
    + statTile({ accent: "c", value: `${cs.onTrack}/${cs.subjStats.length || 0}`, label: "Subjects on track", note: cs.behind ? `${cs.behind} behind` : "all caught up", epi: "measured" })
    + `</div>`;

  // subject × extent matrix (the relational viz)
  const legend = plCycleFraming === "extent"
    ? `<span class="pl-cyc-leg"><i class="d"></i>Done <i class="r"></i>Reviewed <i class="v"></i>Revised</span>`
    : `<span class="pl-cyc-leg"><i class="d"></i>R1 <i class="r"></i>R2 <i class="v"></i>R3</span>`;
  const rows = cs.subjStats.map(s => {
    const exp = plCycExpanded.has(s.subject);
    const trail = plCycleFraming === "extent"
      ? `<span class="pl-cyc-rt num">${s.done}/${s.total}</span>`
      : `<span class="pl-cyc-rt num">R3·${s.revised} R2·${s.reviewed} R1·${s.done}</span>`;
    const seg3 = `<span class="pl-cyc-seg3" role="img" aria-label="${s.done} done, ${s.reviewed} reviewed, ${s.revised} revised of ${s.total}">`
      + `<i class="d" style="width:${pct(s.done, s.total)}%"></i><i class="r" style="width:${pct(s.reviewed, s.total)}%"></i><i class="v" style="width:${pct(s.revised, s.total)}%"></i></span>`;
    let head = `<button type="button" class="pl-cyc-row${s.adher < 100 ? " behind" : " ok"}" data-pl-cyc-subj="${esc(s.subject)}" aria-expanded="${exp}">`
      + `<span class="pl-cyc-rs">${esc(s.subject)}</span>${seg3}${trail}<span class="pl-cyc-rx">${exp ? "▾" : "▸"}</span></button>`;
    let kids = "";
    if (exp) kids = `<div class="pl-cyc-kids">` + s.items.map(it => {
      const f = _extentFlags(it.entity), intent = _intentOf(it), ok = _meetsIntent(it.entity, intent);
      const dots = `<span class="pl-cyc-dots" title="intent: ${intent}"><i class="${f.done ? "on" : ""}"></i><i class="${f.reviewed ? "on" : ""}"></i><i class="${f.revised ? "on" : ""}"></i></span>`;
      return `<div class="pl-cyc-kid${ok ? " met" : ""}"><a class="is-link" data-go-subject="${esc(s.subject)}">${esc(_entityName(it.entity))}</a>`
        + `<span class="pl-cyc-kmeta">${it.pass ? `<span class="pl-pass pl-${String(it.pass).toLowerCase()}">${esc(it.pass)}</span>` : ""}${dots}</span></div>`;
    }).join("") + `</div>`;
    return head + kids;
  }).join("");

  // calm callout + lock + due-to-revise
  const due = _dueToRevise();
  const dueChip = due ? `<span class="pl-cyc-due" title="Topics done ≥7 days ago you haven't reviewed (1-3-7-15)">${due} due to revise</span>` : "";
  const lockBtn = `<button type="button" class="pl-btn pl-cyc-lock" data-pl-cyc-lock title="Freeze this ${plCycleSpan} as a retrospective record you can chip away at">⛁ Lock this ${plCycleSpan}</button>`;
  const note = cs.total
    ? (backlogN
      ? `<span class="muted small">Behind is normal — carry the gap forward (aim ~60% new / 40% backlog next ${plCycleSpan}). Lock it to keep chipping at what's left.</span>`
      : `<span class="muted small">All planned work met at its intended depth. Lock it to bank the record.</span>`)
    : `<span class="muted small">Nothing scheduled in this ${plCycleSpan}. Use ◀ ▶ to browse other windows.</span>`;

  wrap.innerHTML =
    `<div class="ph"><div class="ph-l"><h3>This ${plCycleSpan} — planned vs done ${epiBadge("measured")}</h3>`
    + `<span class="muted small">what you set out to do, by subject and depth — and what's still open</span></div></div>`
    + `<div class="pl-cyc-ctl">${seg}${nav}</div>`
    + (cs.total ? `<div class="pl-cyc-strip" data-cyc-span="${plCycleSpan}">${strip}</div>` : "")
    + tiles
    + (cs.subjStats.length
      ? `<div class="pl-cyc-mh"><span class="pl-cyc-mt">By subject &amp; extent</span><div class="seg pl-cyc-frame">`
        + `<button type="button" data-pl-cyc-frame="extent" class="${plCycleFraming === "extent" ? "on" : ""}">Extent</button>`
        + `<button type="button" data-pl-cyc-frame="rev" class="${plCycleFraming === "rev" ? "on" : ""}">Revisions</button></div>${legend}</div>`
        + `<div class="pl-cyc-matrix">${rows}</div>`
      : "")
    + `<div class="pl-cyc-foot">${dueChip}${lockBtn}</div>${note}`;
  return wrap;
}

/* ── render: the locked cycles list (retrospective follow-up) ── */
function _plCyclesList() {
  const cycles = Store.getCycles().slice().sort((a, b) => b.from.localeCompare(a.from) || a.span.localeCompare(b.span));
  if (!cycles.length) return null;
  const wrap = el("section", "panel pl-cycles"); wrap.dataset.reveal = "";
  const rows = cycles.map(c => {
    const bl = _lockedBacklog(c);
    const exp = plLockExpanded.has(c.id);
    const open = bl.notDone.length + bl.notReviewed.length + bl.notRevised.length;
    const backTxt = open
      ? `<span class="pl-lk-back">${bl.notDone.length} not done · ${bl.notReviewed.length} not reviewed · ${bl.notRevised.length} not revised</span>`
      : `<span class="pl-lk-clear">backlog cleared ✓</span>`;
    const grp = (label, arr) => arr.length
      ? `<div class="pl-lk-grp"><span class="pl-lk-gl">${label} (${arr.length})</span>`
        + arr.map(p => `<div class="pl-cyc-kid"><a class="is-link" data-go-subject="${esc(_entitySubject(p.entity))}">${esc(_entityName(p.entity))}</a><span class="pl-cyc-kmeta muted small">${esc(_entitySubject(p.entity) || "")}</span></div>`).join("")
        + `</div>`
      : "";
    const kids = exp
      ? `<div class="pl-lk-kids">` + (open
        ? grp("To do", bl.notDone) + grp("To review", bl.notReviewed) + grp("To revise", bl.notRevised)
        : `<div class="muted small">Everything planned this ${c.span} is now done at its intended depth. Nicely cleared.</div>`)
        + `<div class="pl-lk-actions"><button type="button" class="linkbtn danger" data-pl-cyc-del="${esc(c.id)}">Remove this cycle</button></div></div>`
      : "";
    return `<div class="pl-lk${exp ? " open" : ""}">`
      + `<button type="button" class="pl-lk-h" data-pl-cyc-open="${esc(c.id)}" aria-expanded="${exp}">`
      + `<span class="pl-lk-when"><span class="pl-lk-wl">${esc(_winLabel(c))}</span><span class="pl-lk-span">${c.span}${c.auto ? " · auto" : ""}</span></span>`
      + `<span class="pl-lk-mid"><span class="pl-lk-frozen num" title="Adherence when locked (the honest record)">ended ${c.lockAdherence}%</span>${backTxt}</span>`
      + `<span class="pl-lk-live">${meterHTML(bl.met, bl.total)}</span><span class="pl-cyc-rx">${exp ? "▾" : "▸"}</span></button>${kids}</div>`;
  }).join("");
  wrap.innerHTML = `<div class="ph"><div class="ph-l"><h3>Locked cycles — retrospective ${epiBadge("measured")}</h3>`
    + `<span class="muted small">frozen at lock; the backlog re-checks live, so clearing topics later shrinks it</span></div>`
    + `<span class="count-pill">${cycles.length}</span></div><div class="pl-lk-list">${rows}</div>`;
  return wrap;
}

/* ============================================================
   EVENT WIRING (bound once)
   ============================================================ */
let _plBound = false;
function _plBindOnce() {
  if (_plBound) return; _plBound = true;

  // keep adherence / diary / meters live when tracking changes anywhere. Skip while
  // a render is in flight (auto-reschedule saves mid-render) to avoid re-entrancy;
  // flag it a refresh so the entrance animation never re-plays on a tick.
  document.addEventListener("state-changed", () => { if (currentView === "planner" && !_plRendering) { _plRefresh = true; renderPlanner(); } });

  document.addEventListener("click", e => {
    if (currentView !== "planner") return;
    const within = t => t && $("#view-planner").contains(t);

    // entity links / coverage pips fall through to appClick + routing
    const md = e.target.closest("[data-pl-mode]"); if (md && within(md)) { plBuilder = { mode: md.dataset.plMode }; renderPlanner(); return; }
    if (e.target.closest("[data-pl-cancel]")) { plBuilder = null; renderPlanner(); return; }

    const bank = e.target.closest("[data-pl-bank]"); if (bank && within(bank)) { Store.toggleSub(bank.dataset.plBank); _syncBanksDot(); renderPlanner(); return; }

    const subj = e.target.closest("[data-pl-subj]"); if (subj && within(subj)) { const on = subj.classList.toggle("on"); subj.setAttribute("aria-pressed", on ? "true" : "false"); return; }
    if (e.target.closest("[data-pl-selall]")) { $$("#view-planner .pl-chip").forEach(c => { c.classList.add("on"); c.setAttribute("aria-pressed", "true"); }); return; }
    if (e.target.closest("[data-pl-selnone]")) { $$("#view-planner .pl-chip").forEach(c => { c.classList.remove("on"); c.setAttribute("aria-pressed", "false"); }); return; }

    if (e.target.closest("[data-pl-create]")) { _plCaptureBuilder(); const plan = _plReadBuilder(); if (plan) { Store.setPlan(plan); plBuilder = null; plEdit = false; renderPlanner(); toast("Plan created — edit anything, tick as you go"); } return; }
    if (e.target.closest("[data-pl-seed]")) { const subjs = _scopeSubjects(); Store.setPlan(_genQuick(subjs, _today(), isoDay(addDays(parseDay(_today()), 14)), 6)); plBuilder = null; renderPlanner(); toast("2-week quick plan created from your high-yield gaps"); return; }

    const done = e.target.closest("[data-pl-done]"); if (done && within(done)) { _plToggleDone(done.dataset.plDone, done.dataset.plEid); return; }
    const rm = e.target.closest("[data-pl-rm]"); if (rm && within(rm)) { _plRemoveItem(rm.dataset.plEtype, rm.dataset.plEid); return; }
    if (e.target.closest("[data-pl-edit]")) { plEdit = !plEdit; renderPlanner(); return; }
    if (e.target.closest("[data-pl-add]")) { _plAddItem(); return; }
    const relax = e.target.closest("[data-pl-relax]"); if (relax) { _plRelax(parseInt(relax.dataset.plRelax, 10)); return; }
    if (e.target.closest("[data-pl-hours]")) { const p = Store.getPlan(); if (p) Store.updatePlan({ showHours: !p.showHours }); renderPlanner(); return; }
    if (e.target.closest("[data-pl-rename]")) { _plRename(); return; }
    if (e.target.closest("[data-pl-new]")) {
      if (confirm("Start a new plan? Your current plan will be replaced. (Your tracking and done-diary are kept.)")) { Store.clearPlan(); plBuilder = null; plEdit = false; renderPlanner(); }
      return;
    }
    // ── cycle stat bar controls ──
    const cspan = e.target.closest("[data-pl-cyc-span]");
    if (cspan && within(cspan)) { plCycleSpan = cspan.dataset.plCycSpan; plCycleRef = null; renderPlanner(); return; }
    const cmove = e.target.closest("[data-pl-cyc-move]");
    if (cmove && within(cmove)) {
      const dir = parseInt(cmove.dataset.plCycMove, 10) || 0;
      const win = _cycleWindow(plCycleSpan, plCycleRef);
      if (plCycleSpan === "month") { const d = parseDay(win.from); plCycleRef = isoDay(new Date(d.getFullYear(), d.getMonth() + dir, 1)); }
      else { plCycleRef = isoDay(addDays(parseDay(win.from), dir * 7)); }
      renderPlanner(); return;
    }
    const cframe = e.target.closest("[data-pl-cyc-frame]");
    if (cframe && within(cframe)) { plCycleFraming = cframe.dataset.plCycFrame; renderPlanner(); return; }
    const csubj = e.target.closest("[data-pl-cyc-subj]");
    if (csubj && within(csubj)) { const k = csubj.dataset.plCycSubj; plCycExpanded.has(k) ? plCycExpanded.delete(k) : plCycExpanded.add(k); renderPlanner(); return; }
    if (e.target.closest("[data-pl-cyc-lock]")) {
      const plan = Store.getPlan(); if (!plan) return;
      const win = _cycleWindow(plCycleSpan, plCycleRef);
      if (!_cyclePlanned(plan, win).length) { toast("Nothing planned in this " + plCycleSpan + " to lock", true); return; }
      Store.lockCycle(_buildLockedCycle(plan, win, false));
      plLockExpanded.add("cyc-" + win.span + "-" + win.from);
      renderPlanner(); toast(`${win.label} locked — clear its backlog below as you go`); return;
    }
    const cdel = e.target.closest("[data-pl-cyc-del]");
    if (cdel && within(cdel)) { if (confirm("Remove this locked cycle? Your tracking and plan are untouched.")) { Store.removeCycle(cdel.dataset.plCycDel); renderPlanner(); toast("Cycle removed"); } return; }
    const copen = e.target.closest("[data-pl-cyc-open]");
    if (copen && within(copen)) { const id = copen.dataset.plCycOpen; plLockExpanded.has(id) ? plLockExpanded.delete(id) : plLockExpanded.add(id); renderPlanner(); return; }

    // template intensity change → re-render builder to reveal/hide custom fields (preserve other inputs)
    const seg = e.target.closest(".seg[data-seg='plTemplate'] button[data-seg-v]");
    if (seg && within(seg)) { _plCaptureBuilder(); if (plBuilder) plBuilder.template = seg.dataset.segV; renderPlanner(); return; }
  });

  // move an item to another day (edit mode)
  document.addEventListener("change", e => {
    if (currentView !== "planner") return;
    const di = e.target.closest("[data-pl-date]"); if (!di) return;
    const plan = Store.getPlan(); if (!plan) return;
    const items = plan.items.map(it => (it.entity.type === di.dataset.plEtype && it.entity.id === di.dataset.plEid) ? Object.assign({}, it, { targetDate: di.value }) : it);
    Store.updatePlan({ items }); renderPlanner();
  });
}
/* snapshot the in-progress builder form into plBuilder before a re-render */
function _plCaptureBuilder() {
  if (!plBuilder) return;
  const get = id => ($("#" + id) || {}).value;
  if (get("plFrom") != null) plBuilder.from = get("plFrom");
  if (get("plTo") != null) plBuilder.to = get("plTo");
  if (get("plExam") != null) plBuilder.exam = get("plExam");
  if (get("plCap") != null) plBuilder.cap = parseInt(get("plCap"), 10) || plBuilder.cap;
  if (get("plCustomPlat") != null) plBuilder.customPlat = get("plCustomPlat");
  const chips = $$("#view-planner .pl-chip.on").map(c => c.dataset.plSubj);
  if ($$("#view-planner .pl-chip").length) plBuilder.subjects = chips;
}
function _plToggleDone(type, id) {
  if (type === "topic") { const t = LIB_TOPIC_BY_ID[id]; const leaf = t && _topicPrimaryLeaf(t); if (leaf) Store.toggle(leaf, "a"); /* state-changed → re-render */ return; }
  if (type === "leaf") { Store.toggle(id, "a"); return; }
  if (type === "video") { Store.toggleVideo(id, "w"); return; }
}
function _plRemoveItem(type, id) {
  const plan = Store.getPlan(); if (!plan) return;
  const items = plan.items.filter(it => !(it.entity.type === type && it.entity.id === id));
  Store.updatePlan({ items }); renderPlanner();
}
function _plRelax(cap) {
  const plan = Store.getPlan(); if (!plan || !cap) return;
  const today = _today();
  // keep done items where they are; repack remaining incomplete from today forward at the new cap
  const doneItems = plan.items.filter(it => _entityDone(it.entity));
  const rest = plan.items.filter(it => !_entityDone(it.entity))
    .sort((a, b) => ({ M1: 0, M2: 1, M3: 2, Revision: 1 }[a.pass] || 0) - ({ M1: 0, M2: 1, M3: 2, Revision: 1 }[b.pass] || 0) || a.targetDate.localeCompare(b.targetDate));
  const need = Math.ceil(rest.length / cap);
  const end = plan.examDate ? isoDay(addDays(parseDay(plan.examDate), -1)) : isoDay(addDays(parseDay(today), need - 1));
  const days = _dayRange(today, end > today ? end : isoDay(addDays(parseDay(today), need - 1)));
  let d = 0, c = 0; const repacked = rest.map(it => {
    if (c >= cap && d < days.length - 1) { d++; c = 0; } c++;
    return Object.assign({}, it, { targetDate: days[Math.min(d, days.length - 1)] });
  });
  const patch = { items: doneItems.concat(repacked), dailyCap: cap };
  if (!plan.examDate && plan.range) patch.range = { from: plan.range.from, to: days[days.length - 1] };
  Store.updatePlan(patch); renderPlanner(); toast(`Re-capped to ${cap}/day`);
}
function _plRename() {
  const plan = Store.getPlan(); if (!plan) return;
  const name = window.prompt("Rename this plan:", plan.name);
  if (name && name.trim()) { Store.updatePlan({ name: name.trim() }); renderPlanner(); }
}
function _syncBanksDot() { const b = $("#btnBanks"); if (b) b.classList.toggle("has-dot", Store.subs().length > 0); }

/* My-banks bottom-sheet (opened from the global toolbar button). Multi-select —
   uses its own .pl-bankopt class so it never triggers the single-select sheetPick. */
function openBanksSheet() {
  const sh = $("#sheet"); if (!sh) return;
  $("#sheetTitle").textContent = "My banks — what you own";
  const render = () => {
    const subs = Store.subs();
    $("#sheetBody").innerHTML = PL_PLAT_ORDER.map(id =>
      `<button class="pl-bankopt${subs.includes(id) ? " on" : ""}" data-bankid="${esc(id)}"><span style="color:${platColor(id)}">${esc(platDisplayName(id))}</span>${subs.includes(id) ? '<span class="sheet-tick">✓</span>' : ""}</button>`).join("")
      + `<div class="cf-note" style="padding:10px 4px 2px">Scopes plan generation and the honest-gap signal to the banks you actually pay for. Optional — leave empty to plan across all.</div>`;
  };
  render();
  $("#sheetScrim").classList.add("open"); sh.classList.add("open"); sh.setAttribute("aria-hidden", "false");
  if (!sh.__bankBound) {
    sh.__bankBound = true;
    $("#sheetBody").addEventListener("click", e => {
      const b = e.target.closest(".pl-bankopt"); if (!b) return;
      e.stopPropagation();
      Store.toggleSub(b.dataset.bankid); _syncBanksDot();
      render();
      if (currentView === "planner") renderPlanner();
    });
  }
  setTimeout(() => $("#sheetClose").focus(), 30);
}

/* wrap an HTML string into a [data-reveal] element so animateView reveals it */
function _plFrame(html) { const d = el("div", "pl-frame"); d.dataset.reveal = ""; d.innerHTML = html; return d; }
