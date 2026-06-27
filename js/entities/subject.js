/* ============================================================
   entities/subject.js — renderSubjectPage(canon)   ·  Stage 3b
   The SUBJECT ENTITY PAGE (NOT a tab). One canonical subject seen across
   every integrated platform: coverage × yield heatmap (the cross-platform
   thesis made visual), consensus high-yield topics (≥2 platforms agree),
   WHO TEACHES IT BEST (subjectStrength + faculty, directional/sourced),
   related videos, and YOUR progress. Every figure carries its epistemic
   label + source via chartFrame()/panel(). Desktop = multi-panel; mobile =
   single-panel segmented swap, density tiles, no horizontal scroll.

   OWNS: this file + css/subject.css only. Uses shared ds.js/core.js.
   ============================================================ */

/* per-page UI state: which mobile panel the segmented control shows.
   Desktop ignores this (all panels render in the grid). */
let _subjTab = "coverage";

/* Single source of truth for "are we in single-panel (mobile) mode?".
   Keyed on the SAME 640px breakpoint the CSS uses (css/subject.css).
   We DO NOT stamp [hidden] in markup or rely on a stylesheet to un-hide
   panels on desktop — a missing or late-loading css/subject.css must never
   be able to collapse the multi-panel desktop layout. Instead JS itself
   drives panel/toolbar visibility from this matchMedia state. */
const _subjMQ = (typeof matchMedia === "function") ? matchMedia("(max-width:640px)") : null;
function _subjIsMobile() { return !!(_subjMQ && _subjMQ.matches); }

/* apply current breakpoint state to the live view: in single-panel mode show
   only the active panel + the segmented toolbar; otherwise show every panel
   and hide the (mobile-only) toolbar. Defensive: works with zero CSS. */
function _subjApplyMode(view) {
  const v = view || $("#view-subject"); if (!v) return;
  const mobile = _subjIsMobile();
  v.classList.toggle("single-panel", mobile);
  const tb = v.querySelector(".subj-toolbar");
  if (tb) tb.style.display = mobile ? "" : "none";
  v.querySelectorAll(".subj-panel").forEach(p => {
    p.hidden = mobile ? (p.dataset.panel !== _subjTab) : false;
  });
}

/* one persistent breakpoint listener (module scope, attached once) so we
   reflow on resize/orientation change without stacking a listener per render.
   The sliding indicator is re-seated by the shared placeAllSegInds() machinery
   (ds.js §2.5c) — no bespoke per-render placer here. */
if (_subjMQ) {
  const onChange = () => {
    const v = $("#view-subject"); if (!v || !v.childElementCount) return;
    _subjApplyMode(v);
    if (typeof placeAllSegInds === "function") placeAllSegInds(v); // re-seat indicator (no slide on layout change)
  };
  if (_subjMQ.addEventListener) _subjMQ.addEventListener("change", onChange);
  else if (_subjMQ.addListener) _subjMQ.addListener(onChange); // older Safari
}

/* ---- data assembly for one canonical subject ---------------------------- */
function _subjPlatStats(canonSubj) {
  // measured per-platform MCQ totals + module counts for this canonical subject
  return QBANKS.map(p => {
    const native = SUBJ_BY_CANON[canonSubj] && SUBJ_BY_CANON[canonSubj][p.id];
    const s = native ? p.subjects.find(x => x.subject === native) : null;
    return { id: p.id, name: p.name, native, mcqs: s ? s._mcqs : 0, mods: s ? s.modules.length : 0, has: !!s };
  });
}

/* canonical-subject leaves grouped per platform (fresh = excludes PYQ via canon) */
function _subjLeaves(canonSubj) { return LEAVES.filter(l => l.canon === canonSubj); }

/* the platform subjectStrength names strongest for this subject (directional).
   Returns the strong[] array (may include reputation-only platformId:null). */
function _subjStrong(canonSubj) {
  const row = (CUR.strength && CUR.strength.subjects || []).find(s => canon(s.subject) === canonSubj);
  return row ? (row.strong || []) : [];
}
/* the INTEGRATED platform id reputed strongest (for the heatmap gold ring); else null */
function _strongIntegratedId(canonSubj) {
  const s = _subjStrong(canonSubj).find(x => x.platformId && PLAT_BY_ID[x.platformId]);
  return s ? s.platformId : null;
}

/* consensus high-yield topics: high-yield leaves whose topic ≥2 of the 3
   independent platforms flag high-yield (priority≥2). Density bucketing is a
   PROXY (not measured exam consensus). Returns [{leaf, agree, plats}]. */
function _consensusTopics(canonSubj, limit) {
  const hy = _subjLeaves(canonSubj).filter(l => l.priority === 3);
  // de-dupe near-identical cross-platform topics: keep the first (highest mcqs) seen per cross-cluster
  const seen = new Set();
  const out = [];
  hy.slice().sort((a, b) => (b.mcqs || 0) - (a.mcqs || 0)).forEach(l => {
    if (seen.has(l.id)) return;
    const byPlat = bestCrossByPlat(l);          // {platformId: matchedLeaf} confident matches
    // platforms that flag this topic high-yield: own platform (it's priority 3) + matches with priority≥2
    const plats = QBANKS.map(p => {
      let on = false;
      if (p.id === l.platform) on = true;
      else { const m = byPlat[p.id]; if (m && (m.priority || 0) >= 2) on = true; }
      return { id: p.id, on };
    });
    Object.values(byPlat).forEach(m => seen.add(m.id));
    seen.add(l.id);
    const agree = plats.filter(p => p.on).length;
    out.push({ leaf: l, agree, plats });
  });
  // surface true consensus first (≥2 agree float up), then by mass
  out.sort((a, b) => (b.agree - a.agree) || ((b.leaf.mcqs || 0) - (a.leaf.mcqs || 0)));
  return out.slice(0, limit || 8);
}

/* videos for a canonical subject (CoreBTR subjects map via BTR_CANON) */
function _subjVideos(canonSubj, limit) {
  const vids = VIDEOS.filter(v => (BTR_CANON[v.subject] || canon(v.subject)) === canonSubj);
  return limit ? vids.slice(0, limit) : vids;
}

/* test-score accuracy series for this subject over time (measured · local) */
function _subjScoreSeries(canonSubj) {
  return relatedTests(canonSubj)
    .map(t => { const sc = Store.score(t.id); if (!sc || sc.right == null) return null;
      const tot = (sc.right || 0) + (sc.wrong || 0); if (!tot) return null;
      return { date: sc.date || "", y: pct(sc.right, tot), label: t.name }; })
    .filter(Boolean)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

/* ---- local empty-state engraving -----------------------------------------
   Reads as "a plate awaiting its engraving", not a missing thing: plate ground
   + engraved hairline, a monochrome STROKE-ONLY mark (never colour), serif
   title, meta body, optional linkbtn CTA. NOTE for integrator: this duplicates
   the intended shared emptyState({icon,title,body,action}) primitive (spec §4)
   which does not yet exist in ds.js — promote + dedupe when it lands. Keeps the
   honest "forthcoming"/count framing for the gated-faculty firewall. */
const _SUBJ_MARKS = {
  // stroke-only inline SVG marks — quill / open ledger / film / compass
  quill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 4S8 6 5 15l4 4C18 16 20 4 20 4Z"/><path d="M5 19l3.5-3.5"/></svg>`,
  ledger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6C9 4 5 4 3 5v14c2-1 6-1 9 1 3-2 7-2 9-1V5c-2-1-6-1-9 1Z"/><path d="M12 6v14"/></svg>`,
  film: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M7 5v14M17 5v14"/></svg>`,
  gauge: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14a8 8 0 0 1 16 0"/><path d="M12 14l4-3"/><path d="M4 14h2M18 14h2M12 6v2"/></svg>`,
};
function _subjEmpty(o) {
  o = o || {};
  const mark = _SUBJ_MARKS[o.mark] || _SUBJ_MARKS.quill;
  return `<div class="subj-empty"><span class="se-mark" aria-hidden="true">${mark}</span>`
    + `<div class="se-title">${esc(o.title || "Awaiting engraving")}</div>`
    + (o.body ? `<p class="se-body">${o.body}</p>` : "")
    + `</div>`;
}

/* ---- panel builders (each returns a chartFrame/panel string) ------------ */

function _subjCoveragePanel(canonSubj, stats, cap) {
  // heatmap: ONE subject row × the 3 integrated platforms. counts measured;
  // within-row density bucketing is proxy. gold ring = community-reputed strongest (directional).
  const maxM = Math.max(1, ...stats.map(s => s.mcqs));
  const cols = QBANKS.map(p => ({ id: p.id, label: p.name }));
  const rows = [{ key: canonSubj, label: canonSubj }]; // single row, no self-link
  const valueFn = (_k, colId) => { const s = stats.find(x => x.id === colId) || {};
    return { v: s.mcqs ? fmt(s.mcqs) : "", raw: s.mcqs || 0, t: (s.mcqs || 0) / maxM }; };
  const ringId = _strongIntegratedId(canonSubj);
  const ringFn = ringId ? () => ringId : null;

  const legend = `<span class="lg-ramp"><i style="background:var(--y1)"></i><i style="background:var(--y3)"></i><i style="background:var(--y5)"></i>`
    + ` <span class="lg-t">low → high MCQ density</span></span>`
    + (ringId ? `<span class="lg-ring"><i></i> community-reputed strongest ${epiBadge("directional")}</span>` : "");
  const note = `Cells are measured MCQ counts; the colour ramp buckets them within this subject (proxy). `
    + (ringId ? `Gold ring = ${esc(platName(ringId))}, the platform aspirants most often call strongest here (directional). ` : "")
    + srcLine(CUR.strength ? CUR.strength.sourceIds : [], CUR.strength && CUR.strength.captured);

  const hm = heatmap(rows, cols, valueFn, { ringFn });
  // per-platform "open this subject" links underneath the heatmap (the triangle)
  const links = `<div class="cov-links">` + stats.filter(s => s.has).map(s =>
    `<button class="echip plat is-link" style="--c:${platColor(s.id)}" data-go-platform="${esc(s.id)}">${esc(s.name)} · ${fmt(s.mcqs)} MCQs</button>`).join("") + `</div>`;

  return chartFrame("Coverage × yield — this subject across platforms", "proxy",
    CUR.strength ? CUR.strength.sourceIds : [], cap, hm + links, { legend, note });
}

function _subjConsensusPanel(canonSubj, cap) {
  const topics = _consensusTopics(canonSubj, 8);
  if (!topics.length) {
    return panel({ title: "Consensus high-yield topics", epi: "proxy", curated: true,
      sourceIds: [], captured: cap,
      body: _subjEmpty({ mark: "ledger", title: "No consensus yet",
        body: `No high-yield topics are flagged for this subject across platforms so far. Consensus is a proxy density heuristic ${epiBadge("proxy")} — it fills in as more platforms agree.` }) });
  }
  const rows = topics.map(tp => {
    const l = tp.leaf;
    const mark = consensusMark(tp.agree, tp.plats);
    const strong = tp.agree >= 2;
    const flag = strong ? `<span class="con-flag">${tp.agree}×</span>` : "";
    return listRow({
      lead: dotLead(platColor(l.platform)),
      title: esc(l.name),
      sub: `${esc(platName(l.platform))} · ${fmt(l.mcqs)} MCQs · ${strong ? tp.agree + " platforms agree" : "lone signal"}`,
      trail: `${flag}${mark}`,
    });
  });
  const note = `“Consensus” = how many of the 3 independent platforms flag a topic high-yield by MCQ density — `
    + `a proxy + cross-match heuristic, explicitly NOT measured exam consensus.`;
  return chartFrame("Consensus high-yield topics", "proxy", [], cap, groupList(rows, "consensus"), { note });
}

function _subjTeachersPanel(canonSubj, cap) {
  const strong = _subjStrong(canonSubj);
  const facs = facultyForSubject(canonSubj);

  // best-platform (directional, community reputation) — integrated link or muted reputation chip
  let plat = "";
  if (strong.length) {
    plat = `<div class="teach-block"><span class="tb-h">Most-reputed platform</span><div class="echips">`
      + strong.map(x => x.platformId && PLAT_BY_ID[x.platformId]
        ? `<button class="echip plat is-link" style="--c:${platColor(x.platformId)}" data-go-platform="${esc(x.platformId)}">${esc(x.platform)}</button>`
        : `<span class="echip off" title="Named in community reputation; not yet integrated">${esc(x.platform)} · not yet integrated</span>`).join("")
      + `</div>${srcLine(CUR.strength ? CUR.strength.sourceIds : [], CUR.strength && CUR.strength.captured)}</div>`;
  }

  // faculty roster (gated — directional seed). aggregate, community-sentiment; never a "worst" board.
  let roster;
  if (facs.length) {
    roster = `<span class="tb-h">Faculty who teach ${esc(canonSubj)}</span>` + groupList(facs.map(f => {
      const cur = (f.affiliations || []).find(a => a.status === "current");
      const where = cur ? (cur.platformId && PLAT_BY_ID[cur.platformId] ? platName(cur.platformId) : (cur.platformId ? platDisplayName(cur.platformId) : (cur.name || "Independent"))) : "";
      const pr = f.ratings && f.ratings.profile;
      return listRow({
        lead: dotLead(cur && cur.platformId ? platColor(cur.platformId) : "var(--ink-3)"),
        title: esc(f.name),
        sub: (where ? esc(where) + " · " : "") + (cur ? esc(cur.role || "") : (f.subjects || []).map(esc).join(", ")),
        trail: pr && pr.score != null ? `<span class="num">${pr.score}★</span>` : `<span class="muted small">seed</span>`,
        go: "faculty:" + f.id,
      });
    }), "teachers");
  } else {
    roster = `<span class="tb-h">Faculty who teach ${esc(canonSubj)}</span>`
      + _subjEmpty({ mark: "quill", title: "Profiles forthcoming",
        body: `No faculty profiles map to this subject yet — the people layer is being seeded from public sources (directional). <b>${FACULTY.length}</b> profile${FACULTY.length === 1 ? "" : "s"} live across Calvetra so far. Aggregate-only · community-sentiment · never a ranking of peers.` });
  }

  return panel({ title: "Who teaches it best", epi: "directional", curated: true,
    sourceIds: CUR.strength ? CUR.strength.sourceIds : [], captured: CUR.strength && CUR.strength.captured,
    body: plat + `<div class="teach-block">${roster}</div>`
      + `<p class="firewall-note">Community reputation, aggregate-only — not a Calvetra verdict, never a ranking against peers.</p>` });
}

function _subjVideosPanel(canonSubj, cap) {
  const vids = _subjVideos(canonSubj, 12);
  if (!vids.length) return panel({ title: "Related videos",
    body: _subjEmpty({ mark: "film", title: "No videos mapped yet",
      body: `No lectures are mapped to this subject so far. The video layer grows as faculty teaching is sourced and tagged.` }) });
  const rows = vids.map(v => {
    const fac = (v.facultyIds || (v.facultyId ? [v.facultyId] : [])).map(facById).filter(Boolean)[0];
    const st = Store.video(v.id);
    return listRow({
      lead: `<span class="vdot ${st.v ? "done" : st.w ? "watch" : ""}"></span>`,
      title: esc(v.topic || v.name || "Video"),
      sub: `${esc(v.subject)}${v.durMin ? " · " + v.durMin + " min" : ""}` + (fac ? "" : ""),
      trail: fac ? `<button class="echip is-link" data-go-faculty="${esc(fac.id)}">${esc(fac.name)}</button>` : "",
    });
  });
  return panel({ title: "Related videos", actions: `<span class="muted small">${vids.length} mapped</span>`,
    body: groupList(rows, "videos") });
}

function _subjProgressPanel(canonSubj, cap) {
  const ls = _subjLeaves(canonSubj);
  const ro = rollupLeaves(ls);
  const series = _subjScoreSeries(canonSubj);
  const acc = subjectAccuracy().find(a => a.cs === canonSubj);

  const meter = bigMeter(ro);
  const sparkBody = series.length
    ? chartFrame("Your accuracy on " + esc(canonSubj) + " tests", "measured", [], cap,
        sparkline(series.map(s => ({ y: s.y })), { unit: "test" }),
        { note: `Tracked on this device — single-subject tests only. ${acc ? acc.pct + "% across " + acc.tests + " test(s)." : ""}` })
    : _subjEmpty({ mark: "gauge", title: "Awaiting your first score",
        body: `Your accuracy trend draws here once you log a single-subject test in the Tests tab — tracked locally on this device ${epiBadge("measured")}.` });

  return panel({ title: "Your progress", epi: "measured", curated: true, sourceIds: [], captured: cap,
    body: `<div class="prog-meter">${meter}<div class="pm-key muted small">${ro.a}/${ro.total} topics attempted · ${ro.r} reviewed · ${ro.t} mastered — measured, this device</div></div>`
      + sparkBody });
}

/* ---- the page ----------------------------------------------------------- */
function renderSubjectPage(canonSubj) {
  const v = $("#view-subject"); if (!v) return;
  resetPlates();
  const cap = D.captured;
  const stats = _subjPlatStats(canonSubj);
  const totalMCQ = stats.reduce((a, s) => a + s.mcqs, 0);

  // density leader (proxy) + best-reputed platform (directional)
  const leader = stats.slice().sort((a, b) => b.mcqs - a.mcqs)[0];
  const strongName = (_subjStrong(canonSubj)[0] || {}).platform || "—";
  const facs = facultyForSubject(canonSubj);
  const vids = _subjVideos(canonSubj);
  const ro = rollupLeaves(_subjLeaves(canonSubj));

  // 6 density stat-tiles (mobile fold). ONE hero serif numeral (combined MCQs, measured).
  const tiles = [
    statTile({ accent: "g", value: fmt(totalMCQ), label: "MCQs · " + esc(canonSubj), note: stats.filter(s => s.has).map(s => platName(s.id)).join(" + "), epi: "measured" }),
    statTile({ accent: platCls(leader.id), value: leader.has ? leader.name : "—", label: "Most topics", note: leader.has ? fmt(leader.mcqs) + " MCQs (density)" : "—", epi: "proxy", go: leader.has ? "platform:" + leader.id : undefined }),
    statTile({ accent: "m", value: esc(strongName), label: "Most reputed", note: "community reputation", epi: "directional" }),
    statTile({ accent: "k", value: pct(ro.a, ro.total) + "%", label: "You attempted", note: ro.a + "/" + ro.total + " topics", epi: "measured" }),
    statTile({ accent: "c", value: facs.length, label: "Faculty", note: facs.length ? "tap a panel below" : "seeding", epi: "directional" }),
    statTile({ accent: "g", value: vids.length, label: "Videos", note: vids.length ? "mapped" : "none yet" }),
  ].join("");

  // segmented mobile toolbar — swaps which panel is visible (single-panel density).
  const segs = [
    { v: "coverage", label: "Coverage" }, { v: "consensus", label: "Consensus" },
    { v: "teachers", label: "Teachers" }, { v: "videos", label: "Videos" }, { v: "you", label: "You" },
  ];

  // build each panel once; desktop shows all in the grid, mobile shows the active one.
  const pCoverage = _subjCoveragePanel(canonSubj, stats, cap);
  const pConsensus = _subjConsensusPanel(canonSubj, cap);
  const pTeachers = _subjTeachersPanel(canonSubj, cap);
  const pVideos = _subjVideosPanel(canonSubj, cap);
  const pProgress = _subjProgressPanel(canonSubj, cap);

  // Render every panel VISIBLE by default (no [hidden] in markup). _subjApplyMode()
  // below decides single-panel vs multi-panel from JS state, so a missing/late
  // css/subject.css can never hide desktop content.
  const wrap = (key, html) => `<div class="subj-panel" data-panel="${key}" data-reveal>${html}</div>`;

  v.innerHTML = `
    <div class="entity-head">
      <button class="back" data-jump-subj="${esc(canonSubj)}">‹ Open in QBank Tracker</button>
      <div class="eyebrow">Subjects</div>
      <div class="eh-top">
        <div class="eh-id"><h2 class="sh-name">${esc(canonSubj)}</h2></div>
        <div class="eh-hero">
          <span class="hero-num num" data-count="${totalMCQ}">${fmt(totalMCQ)}</span>
          <span class="hero-lbl">MCQs across platforms ${epiBadge("measured")}</span>
        </div>
      </div>
    </div>

    <div class="tiles subj-tiles">${tiles}</div>

    <div class="subj-toolbar">${segmented(segs, _subjTab, "subjtab")}</div>

    <div class="subj-desk">
      <div class="panel-grid">
        ${wrap("coverage", pCoverage)}
        ${wrap("consensus", pConsensus)}
      </div>
      <div class="inst-grid subj-band">
        ${wrap("teachers", pTeachers)}
        ${wrap("videos", pVideos)}
        ${wrap("you", pProgress)}
      </div>
    </div>`;

  // wire the mobile segmented swap (scoped to this view; re-attached each render).
  // The sliding indicator + its initial seat / resize re-seat / slide-on-click are
  // all handled by the shared placeSegInd() machinery (ds.js §2.5c) — this handler
  // only owns subject's own concern: which single panel is visible on mobile.
  const seg = v.querySelector('.seg[data-seg="subjtab"]');
  if (seg) {
    seg.addEventListener("click", e => {
      const b = e.target.closest("button[data-seg-v]"); if (!b) return;
      _subjTab = b.dataset.segV;
      seg.querySelectorAll("button").forEach(x => { const on = x.dataset.segV === _subjTab; x.classList.toggle("on", on); x.setAttribute("aria-checked", on); });
      // single-panel mode: show only the active panel. (No-op visually on desktop,
      // where _subjApplyMode keeps every panel visible.)
      v.querySelectorAll(".subj-panel").forEach(p => { p.hidden = _subjIsMobile() && (p.dataset.panel !== _subjTab); });
    });
  }

  // apply the current breakpoint state now that the panels are in the DOM.
  // Desktop -> all panels visible (independent of any stylesheet); mobile ->
  // active panel only + sticky toolbar.
  _subjApplyMode(v);
}
