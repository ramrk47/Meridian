/* ============================================================
   surfaces/planner.js — STUDY PLANNER  ·  DO-NEXT INTELLIGENCE
   Reframed from "how much content exists" → "what to do next, and why".
   Judgment, not inventory:
     · density-weighted MASS REMAINING per subject (the do-next signal)
     · weakest subjects (your tracking vs. the bank's weight)
     · untracked high-yield topics (★★★ density you haven't started)
   Relational viz (mandatory here):
     · Pl.1  rankedBars — MCQ mass REMAINING by subject, weak-first,
              fill = untracked share (proxy), mark = consensusMark, → Subject pages.
   Tiers become inset groupLists (NOT floating cards). Weekly rhythm kept.
   Every curated figure carries epi (proxy/measured/directional) + source via
   chartFrame/panel. Tracking behavior + Store seam untouched.
   ============================================================ */

/* canonical subject -> best directional platform from D.subjectStrength */
function _planStrongest() {
  const out = {};
  ((CUR.strength && CUR.strength.subjects) || []).forEach(r => {
    const top = (r.strong || [])[0];
    if (top && top.platformId && PLAT_BY_ID[top.platformId]) out[canon(r.subject)] = top.platformId;
  });
  return out;
}

function renderPlanner() {
  resetPlates();
  const v = $("#view-planner"); v.innerHTML = "";

  const CAP = D.captured;
  const SS_CAP = (CUR.strength && CUR.strength.captured) || D.captured;
  const SS_SRC = (CUR.strength && CUR.strength.sourceIds) || [];
  const strongBy = _planStrongest();

  /* ── per-subject combined MCQ weight (measured counts; bucketing = proxy) ── */
  const subjMaps = QBANKS.map(p => Object.fromEntries(freshSubjects(p).map(s => [canon(s.subject), s._mcqs])));
  const subjTotal = cs => subjMaps.reduce((a, m) => a + (m[cs] || 0), 0);
  const subjects = [...new Set(subjMaps.flatMap(m => Object.keys(m)))];

  /* ── do-next math: per-subject untracked MASS (the planner's core judgment) ──
     For each canonical subject, sum MCQ mass of leaves you have NOT attempted.
     This is the "mass remaining" — where your effort still has to go. */
  const stat = {};   // cs -> { total, attempted, remaining, leaves }
  subjects.forEach(cs => stat[cs] = { total: 0, attempted: 0, remaining: 0, leaves: 0, done: 0 });
  LEAVES.forEach(l => {
    const s = stat[l.canon]; if (!s) return;
    s.total += l.mcqs; s.leaves++;
    if (Store.prog(l.id).a) { s.attempted += l.mcqs; s.done++; }
    else s.remaining += l.mcqs;
  });

  /* ── untracked high-yield topics: ★★★ density leaves you haven't started ── */
  const hyAll = LEAVES.filter(l => l.priority === 3);
  const hyUntracked = hyAll.filter(l => { const p = Store.prog(l.id); return !p.a && !p.r && !p.t; });
  hyUntracked.sort((a, b) => b.mcqs - a.mcqs);

  /* ── weak subjects: most untracked MASS first (largest do-next debt) ── */
  const weak = subjects.slice()
    .filter(cs => stat[cs].remaining > 0)
    .sort((a, b) => stat[b].remaining - stat[a].remaining);

  const totalRemaining = subjects.reduce((a, cs) => a + stat[cs].remaining, 0);
  const totalAttempted = QBANK_MCQ - totalRemaining;
  const topGap = weak[0];

  /* ── INTRO callout — what this surface is, honestly framed ── */
  v.appendChild(el("div", "callout plan-intro",
    `<b>Do-next, not a content dump.</b> Subjects are ranked by the MCQ <b>mass you still have to attempt</b> ${epiBadge("proxy")} —
     a density proxy for where your effort goes next, not measured exam yield. Reputation names the strongest bank per subject ${epiBadge("directional")};
     your progress is tracked on this device ${epiBadge("measured")}.
     <span class="muted">Click any subject to open it. Full method → How we rate, on Overview.</span>`));

  /* ── 6 stat-tiles (mobile 2/3-col, 84–104px). One hero serif numeral. ── */
  const tiles = el("div", "tiles plan-tiles");
  tiles.innerHTML =
    statTile({ accent: "g", hero: true, value: fmt(totalRemaining), label: "MCQs remaining", note: `of ${fmt(QBANK_MCQ)} combined`, epi: "proxy" }) +
    statTile({ accent: "m", value: pct(totalAttempted, QBANK_MCQ) + "%", label: "Mass attempted", note: `${fmt(totalAttempted)} MCQs done`, epi: "measured" }) +
    statTile({ accent: "c", value: fmt(hyUntracked.length), label: "Untracked high-yield", note: "★★★ density, not started", epi: "proxy" }) +
    statTile({ accent: "k", value: fmt(weak.length), label: "Subjects with debt", note: "still have mass left", epi: "measured" }) +
    statTile({ accent: "g", value: topGap ? fmt(stat[topGap].remaining) : "—", label: "Biggest gap", note: topGap ? esc(topGap) : "all caught up", epi: "proxy", go: topGap ? "subject:" + topGap : undefined }) +
    statTile({ accent: "m", value: Math.max(1, Math.round(totalRemaining / 100)), label: "Days @ 100/day", note: "to clear remaining", epi: "proxy" });
  v.appendChild(tiles);

  /* ──────────────────────────────────────────────────────────
     Pl.1 — RELATIONAL HERO: MCQ mass REMAINING by subject (weak-first).
     value = untracked MCQ mass (measured count of not-attempted leaves);
     bar fill = untracked SHARE of the subject (proxy magnitude 0..1) — a
     fuller bar = more of that subject still ahead of you. mark = how many
     banks flag ★★★ in it (consensusMark) + reputed-strongest chip.
     Names → Subject pages. This is the "where to spend" judgment.
     ────────────────────────────────────────────────────────── */
  const items = weak.map(cs => {
    const s = stat[cs];
    const shareLeft = s.total ? s.remaining / s.total : 0;
    // banks that flag this subject ★★★ (any leaf priority 3) — consensus pips
    const plats = QBANKS.map(p => ({
      id: p.id,
      on: LEAVES.some(l => l.platform === p.id && l.canon === cs && l.priority === 3),
    }));
    const agree = plats.filter(x => x.on).length;
    const strongPid = strongBy[cs];
    const mark = consensusMark(agree, plats)
      + (strongPid ? ` <span class="pl-best" style="color:${platColor(strongPid)}" title="Community-reputed strongest (directional)">${esc(platName(strongPid))}</span>` : "");
    return {
      label: cs, value: s.remaining, t: shareLeft, go: "subject:" + cs, mark,
      sub: `${pct(s.remaining, s.total)}% left`,
    };
  });

  const legend =
    `<span class="lg-ramp"><i class="r0"></i><i class="r1"></i><i class="r2"></i><i class="r3"></i><i class="r4"></i><i class="r5"></i><span>share left</span></span>`
    + `<span class="lg-con"><span class="cpip on" style="border-color:var(--gold);background:var(--con-all)"></span>banks flag ★★★ (proxy)</span>`
    + `<span class="lg-best"><span class="pl-best">●</span>reputed strongest (directional)</span>`;

  // No sourceIds: this figure is your-tracking remaining mass (measured local) +
  // density proxy + an internal consensus computation — the reputation comparison
  // sources (SS_SRC) do not substantiate it, so attaching them would lend false
  // third-party authority. Method is disclosed by the proxy badge + note below;
  // SS_SRC stays where it belongs (the reputed-strongest chip / tiers).
  v.appendChild(_planFrame(chartFrame(
    "MCQ mass remaining by subject — weak-first", "proxy",
    undefined, SS_CAP,
    rankedBars(items, { nosort: true }),
    {
      legend, plateNo: 1,
      note: `Bar length = MCQ mass you have not attempted (measured count) · fill = share of that subject still ahead (proxy) · pips = how many of ${QBANKS.length} banks flag ★★★ in it (proxy) · gold name = community-reputed strongest bank (directional). Clear the longest, deepest bars first.`,
    })));

  /* ──────────────────────────────────────────────────────────
     Do-next inset group — untracked high-yield topics (★★★ density,
     not started). The single sharpest "next move": biggest mass first.
     Row → topic drawer (data-open-leaf; tracking preserved).
     ────────────────────────────────────────────────────────── */
  if (hyUntracked.length) {
    const rows = hyUntracked.slice(0, 14).map(l => {
      const others = bestCrossByPlat(l);
      const plats = QBANKS.map(p => ({ id: p.id, on: p.id === l.platform ? l.priority === 3 : !!(others[p.id] && others[p.id].priority === 3) }));
      const agree = plats.filter(x => x.on).length;
      const trail = `${consensusMark(agree, plats, { glyph: true })}<span class="pl-q num">${fmt(l.mcqs)}</span>`;
      return listRow({
        lead: `<span class="hy">★★★</span>`,
        title: esc(l.name),
        sub: `<a class="echip" data-go-subject="${esc(l.canon)}">${esc(l.canon)}</a> · <span style="color:${platColor(l.platform)}">${esc(platName(l.platform))}</span>`,
        trail,
      }).replace('class="lrow"', `class="lrow is-link" data-open-leaf="${esc(l.id)}" role="button" tabindex="0"`);
    });
    v.appendChild(_planFrame(panel({
      title: "Start here — untracked high-yield",
      epi: "proxy",
      sourceIds: undefined,
      captured: CAP,
      curated: true,
      actions: `<span class="count-pill">${hyUntracked.length} topics</span>`,
      body: groupList(rows, "plan-donext")
        + `<div class="cf-note">★★★ topics (top MCQ-density tier within their subject — a proxy, not measured exam yield) that you have not attempted on any bank. Glyph shows how many banks agree. Click to track it or jump to the bank.</div>`,
    })));
  }

  /* ──────────────────────────────────────────────────────────
     TIERS — inset groupLists (NOT floating cards). Subjects tiered by
     combined MCQ weight (proxy for exam weight). Each row: subject →
     Subject page; sub = reputed-strongest bank (directional) + your %;
     trail = combined mass (measured) + remaining.
     ────────────────────────────────────────────────────────── */
  const byWeight = subjects.slice().sort((a, b) => subjTotal(b) - subjTotal(a));
  const n = byWeight.length;
  const cut1 = Math.ceil(n / 3), cut2 = Math.ceil(2 * n / 3);
  const tierDefs = [
    { cls: "hi", title: "Tier 1 · Heavy", sub: "Full first pass in the bigger bank + every subject test", arr: byWeight.slice(0, cut1) },
    { cls: "mid", title: "Tier 2 · Medium", sub: "First pass + targeted high-yield topics", arr: byWeight.slice(cut1, cut2) },
    { cls: "lo", title: "Tier 3 · Light", sub: "Revision-only / second-pass filter + PYQs", arr: byWeight.slice(cut2) },
  ];

  const tierGrid = el("div", "plan-tier-grid");
  tierDefs.forEach(td => {
    const rows = td.arr.map(cs => {
      const s = stat[cs];
      const strongPid = strongBy[cs];
      const subBits = [];
      if (strongPid) subBits.push(`<span style="color:${platColor(strongPid)}">${esc(platName(strongPid))}</span>`);
      subBits.push(`${pct(s.attempted, s.total)}% done`);
      const trail = `<span class="pl-tier-v num">${fmt(s.total)}</span>`
        + `<span class="pl-tier-rem num" title="MCQ mass remaining (proxy)">${fmt(s.remaining)} left</span>`;
      return listRow({
        lead: dotLead(strongPid ? platColor(strongPid) : "var(--ink-4)"),
        title: esc(cs),
        sub: subBits.join(" · "),
        trail,
        go: "subject:" + cs,
      });
    });
    const sec = el("section", "panel plan-tier " + td.cls);
    sec.innerHTML = `<div class="ph"><div class="ph-l"><h3>${esc(td.title)} ${epiBadge("proxy")}</h3>`
      + `<span class="muted pl-tsub">${esc(td.sub)}</span></div>`
      + `<span class="count-pill">${td.arr.length} subjects</span></div>`
      + (SS_SRC.length ? srcLine(SS_SRC, SS_CAP) : "")
      + `<div class="panel-body">${groupList(rows, "plan-tierlist")}</div>`;
    tierGrid.appendChild(sec);
  });
  v.appendChild(tierGrid);

  /* ──────────────────────────────────────────────────────────
     Weekly rhythm — kept (function preserved), re-skinned via panel().
     Plan cadence, not a curated figure → measured/local counts only.
     ────────────────────────────────────────────────────────── */
  const pyqMarrow = (() => {
    const p = PLAT_BY_ID.marrow;
    const pyq = p && p.subjects.find(s => s.subject === PYQ);
    return pyq ? pyq.modules.reduce((a, m) => a + m.mcqs, 0) : null;
  })();
  const rhythmBody =
    `<table class="resp plan-rhythm"><thead><tr><th>Day</th><th>Focus</th><th>Test layer</th></tr></thead><tbody>
      <tr><td>Mon–Tue</td><td>Tier-1 subject — new modules in primary bank</td><td>Subject test (50 Q)</td></tr>
      <tr><td>Wed</td><td>Cross-check same subject in the other bank (gaps only)</td><td>Mini Test</td></tr>
      <tr><td>Thu–Fri</td><td>Tier-2 subject pass</td><td>Subject test + error log</td></tr>
      <tr><td>Sat</td><td>Tier-3 revision + PYQ papers${pyqMarrow ? ` (Marrow ${fmt(pyqMarrow)} PYQ MCQs)` : ""}</td><td>—</td></tr>
      <tr><td>Sun</td><td>Full review of the week's error log</td><td><b>Grand Test (200 Q)</b> — rotate platforms</td></tr>
    </tbody></table>
    <div class="plan-kpis">
      <div class="pl-kpi"><b class="num">${fmt(QBANK_MCQ)}</b><span>MCQs total ${epiBadge("measured")}</span></div>
      <div class="pl-kpi"><b class="num">${fmt(totalRemaining)}</b><span>remaining ${epiBadge("proxy")}</span></div>
      <div class="pl-kpi"><b class="num">${Math.max(1, Math.round(totalRemaining / 100))}</b><span>days @ 100/day to clear ${epiBadge("proxy")}</span></div>
      <div class="pl-kpi"><b class="num">${Math.max(1, Math.round(totalRemaining / 150))}</b><span>days @ 150/day ${epiBadge("proxy")}</span></div>
    </div>`;
  v.appendChild(el("div", "plan-rhythm-wrap", panel({
    title: "Suggested weekly rhythm",
    body: rhythmBody,
  })));

  labelizeResponsiveTables();
}

/* wrap a chartFrame/panel string into an element so we can appendChild */
function _planFrame(html) { const d = el("div", "pl-frame"); d.innerHTML = html; return d; }
