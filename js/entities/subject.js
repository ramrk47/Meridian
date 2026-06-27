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
      body: `<div class="empty small">No high-yield topics flagged for this subject yet (proxy density).</div>` });
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
    roster = `<div class="empty small">Faculty profiles are being seeded (directional, sourced). ${FACULTY.length} profiles live.</div>`;
  }

  return panel({ title: "Who teaches it best", epi: "directional", curated: true,
    sourceIds: CUR.strength ? CUR.strength.sourceIds : [], captured: CUR.strength && CUR.strength.captured,
    body: plat + `<div class="teach-block">${roster}</div>`
      + `<p class="firewall-note">Community reputation, aggregate-only — not a Meridian verdict, never a ranking against peers.</p>` });
}

function _subjVideosPanel(canonSubj, cap) {
  const vids = _subjVideos(canonSubj, 12);
  if (!vids.length) return panel({ title: "Related videos", body: `<div class="empty small">No mapped videos for this subject yet.</div>` });
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
    : `<div class="empty small">No single-subject test scores logged yet — accuracy sparkline appears once you record one.</div>`;

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

  const wrap = (key, html) => `<div class="subj-panel" data-panel="${key}"${key === _subjTab ? "" : ' hidden'}>${html}</div>`;

  v.innerHTML = `
    <div class="entity-head">
      <button class="back" data-jump-subj="${esc(canonSubj)}">‹ Open in QBank Tracker</button>
      <div class="eyebrow">Subjects</div>
      <div class="eh-top">
        <div class="eh-id"><h2 class="sh-name">${esc(canonSubj)}</h2></div>
        <div class="eh-hero">
          <span class="hero-num num">${fmt(totalMCQ)}</span>
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

  // wire the mobile segmented swap (scoped to this view; re-attached each render)
  const seg = v.querySelector('.seg[data-seg="subjtab"]');
  if (seg) seg.addEventListener("click", e => {
    const b = e.target.closest("button[data-seg-v]"); if (!b) return;
    _subjTab = b.dataset.segV;
    seg.querySelectorAll("button").forEach(x => { const on = x.dataset.segV === _subjTab; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); });
    v.querySelectorAll(".subj-panel").forEach(p => { p.hidden = (p.dataset.panel !== _subjTab); });
  });
}
