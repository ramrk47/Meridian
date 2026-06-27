/* ============================================================
   surfaces/progress.js — PROGRESS
   Your tracked coverage, told as RELATIONSHIPS not giant numerals:
   small-multiples per subject, a coverage heatmap (where you're weak vs
   where the community calls a platform strongest), an inset-grouped
   ledger, and an exam-accuracy sparkline. All YOUR data → measured/local.
   Owns ONLY this file + css/progress.css. Uses ds.js + core.js helpers.
   ============================================================ */
function renderProgress() {
  resetPlates();
  const v = $("#view-progress"); v.innerHTML = "";
  const CAP = (D.captured || "");

  /* ---- rollups (measured, local — your tracked ticks) ---- */
  const overall = id => { const kids = LEAVES.filter(l => l.platform === id); return { total: kids.length, ...rollup(kids.map(k => k.id)) }; };
  const os = QBANKS.map(p => ({ p, o: overall(p.id) }));
  const tot = os.reduce((a, x) => ({ a: a.a + x.o.a, total: a.total + x.o.total, r: a.r + x.o.r, t: a.t + x.o.t }), { a: 0, total: 0, r: 0, t: 0 });

  /* ---- canonical subject × platform coverage matrix (the relationship spine) ---- */
  const maps = QBANKS.map(p => Object.fromEntries(freshSubjects(p).map(s => [canon(s.subject), s.subject])));
  const subjects = [...new Set(maps.flatMap(m => Object.keys(m)))]
    .map(cs => {
      const perPlat = QBANKS.map((p, i) => maps[i][cs] ? leavesOf(p.id, maps[i][cs]) : []);
      const all = perPlat.flat();
      const att = all.filter(l => Store.prog(l.id).a).length;
      const rev = all.filter(l => Store.prog(l.id).r).length;
      const pcts = perPlat.map(ls => ls.length ? pct(ls.filter(l => Store.prog(l.id).a).length, ls.length) : null);
      const present = pcts.filter(x => x != null);
      const lop = present.length >= 2 && (Math.max(...present) - Math.min(...present) >= 40);
      return { cs, total: all.length, att, rev, comb: pct(att, all.length), pcts, perPlat, lop };
    })
    .sort((a, b) => b.comb - a.comb || b.total - a.total);

  /* community-strongest platform per subject (directional overlay for the heatmap rings) */
  const strongBy = {};
  ((D.subjectStrength && D.subjectStrength.subjects) || []).forEach(s => {
    const top = (s.strong || []).find(x => x.platformId && PLAT_BY_ID[x.platformId]);
    if (top) strongBy[canon(s.subject)] = top.platformId;
  });

  /* ============================================================
     §1  STAT TILES — ≥6 compact, tappable, one hero serif.
     ============================================================ */
  const sg = el("div", "prog-tiles tiles");
  sg.innerHTML =
    statTile({ value: pct(tot.a, tot.total) + "%", label: "Attempted", note: tot.a + "/" + tot.total + " items", accent: "g", epi: "measured", hero: true }) +
    statTile({ value: fmt(tot.r), label: "Reviewed", note: pct(tot.r, tot.total) + "% of items", accent: "c", epi: "measured" }) +
    statTile({ value: fmt(tot.t), label: "Mastered", note: pct(tot.t, tot.total) + "% of items", accent: "k", epi: "measured" }) +
    os.map(({ p, o }) => statTile({
      value: pct(o.a, o.total) + "%", label: p.name, note: o.a + "/" + o.total + " · " + o.r + " rev",
      accent: p.cls, epi: "measured"
    })).join("");
  v.appendChild(sg);
  /* CRAFT: count-up the ONE hero serif numeral (Attempted-%). statTile renders
     the final string ("78%"); we hand motion.js the raw int via data-count so it
     tweens 0→78 once on entrance, then snaps back to the exact "78%" string.
     Reduced-motion / no-IO → motion.js leaves the final text untouched. */
  const heroV = sg.querySelector(".tile.is-hero .tile-v");
  if (heroV) heroV.dataset.count = String(pct(tot.a, tot.total));
  const cap = el("div", "prog-cap");
  cap.innerHTML = `${epiBadge("measured")} <span>Your tracked activity on this device — counts are measured locally, nothing is sent anywhere.</span>`;
  v.appendChild(cap);

  /* ============================================================
     §2  SMALL-MULTIPLES — per-subject progress (the Progress hero).
     Each subject's series = attempted-% across the integrated platforms
     it appears on (left→right Marrow·Cere·Doc) → a coverage shape, not a
     numeral. Weak subjects read flat-and-low; lopsided ones spike.
     ============================================================ */
  const smTracked = subjects.filter(s => s.att > 0);
  const smSource = smTracked.length ? smTracked : subjects;
  const sm = smSource.slice(0, 24).map(s => {
    const series = s.pcts.map((y, i) => y == null ? null : { y, label: QBANKS[i].name }).filter(Boolean);
    return { key: s.cs, label: s.cs, series, value: s.comb + "%", go: "subject:" + s.cs };
  });
  const smPanel = el("section", "panel");
  smPanel.dataset.reveal = "";
  smPanel.innerHTML = chartFrame(
    "Coverage shape, per subject",
    "measured", [], CAP,
    smallMultiples(sm, { unit: "platform" }),
    {
      note: smTracked.length
        ? "One spark per subject — attempted-% across the banks that carry it (M · C · D, left→right). A flat-low spark = barely started; a spike = one bank covered, others ignored. Tap a subject to open it."
        : "Nothing tracked yet. As you tick leaves in the QBank tracker, each subject grows its own coverage spark here.",
      legend: `<span><span class="leg-line"></span>attempted-% by bank</span>`
    }
  );
  /* CRAFT: the two COMPACT plates (coverage-shape + weak↔strong heatmap) share a
     .prog-spread so desktop ≥1024 lays them 2-up (editorial spread); mobile keeps
     them stacked single-column (density preserved — see progress.css §A). */
  const spread = el("div", "prog-spread");
  spread.appendChild(smPanel);
  v.appendChild(spread);

  /* ============================================================
     §3  WEAK ↔ STRONG HEATMAP — subject × platform attempted-%.
     Magnitude = how far YOU are (measured, local). Gold ring = the
     platform the community calls strongest for that subject
     (directional overlay) → "am I weak exactly where it matters?"
     ============================================================ */
  const hmRows = subjects.slice(0, 16).map(s => ({ key: s.cs, label: s.cs, go: "subject:" + s.cs }));
  const hmCols = QBANKS.map(p => ({ id: p.id, label: p.name, color: p.color }));
  const cellByPlat = {};
  subjects.forEach(s => { cellByPlat[s.cs] = {}; QBANKS.forEach((p, i) => { cellByPlat[s.cs][p.id] = { pct: s.pcts[i], leaves: s.perPlat[i].length }; }); });
  const hmVal = (rowKey, colId) => {
    const c = (cellByPlat[rowKey] || {})[colId] || {};
    if (!c.leaves) return { raw: 0 };
    return { v: c.pct + "%", raw: c.pct, t: c.pct / 100 };
  };
  const hmPanel = el("section", "panel");
  hmPanel.dataset.reveal = "";
  const hmLegend =
    `<span><span class="lg-ramp"><i style="background:var(--y0)"></i><i style="background:var(--y1)"></i><i style="background:var(--y2)"></i><i style="background:var(--y3)"></i><i style="background:var(--y4)"></i><i style="background:var(--y5)"></i></span>0→100% attempted</span>` +
    `<span><span class="lg-ring"></span>community-strongest (directional)</span>`;
  hmPanel.innerHTML = chartFrame(
    "Where you are weak vs where it counts",
    "measured", [], CAP,
    heatmap(hmRows, hmCols, hmVal, { ringFn: k => strongBy[k] || null }),
    {
      legend: hmLegend,
      note: `Cell fill = <strong>your</strong> attempted-% on that bank (measured, local). The gold ring marks the platform aspirants most often call strongest for that subject ` +
        `${epiBadge("directional")} ${srcLine((D.subjectStrength && D.subjectStrength.sourceIds) || [], (D.subjectStrength && D.subjectStrength.captured) || CAP)} — a pale ringed cell is a high-stakes gap.`
    }
  );
  spread.appendChild(hmPanel);

  /* ============================================================
     §4  COMBINED LEDGER — inset-grouped rows (NOT cards).
     Trail = per-platform attempted-% chips + lopsided 6px DOT (never a
     shaming bar). Each row links to its Subject page.
     ============================================================ */
  const ledgerRows = subjects.map(s => {
    const platChips = QBANKS.map((p, i) => s.pcts[i] == null
      ? `<span class="lg-plat off">—</span>`
      : `<span class="lg-plat" style="--c:${p.color}" title="${esc(p.name)} ${s.pcts[i]}% attempted">${platInitial(p.id)} ${s.pcts[i]}%</span>`).join("");
    const trail = `<span class="lg-trail">${platChips}`
      + (s.lop ? `<span class="warn-dot" title="Lopsided — covered mainly from one bank"></span>` : "")
      + `<b class="lg-comb num">${s.comb}%</b></span>`;
    return listRow({
      lead: dotLead(yieldFill(s.comb / 100)),
      title: esc(s.cs),
      sub: `${s.total} items · ${s.att} attempted · ${s.rev} reviewed`,
      trail, go: "subject:" + s.cs
    });
  });
  const ledger = el("section", "panel");
  ledger.dataset.reveal = "";
  ledger.innerHTML =
    `<div class="ph"><div class="ph-l"><h3>Combined coverage — both banks per subject ${epiBadge("measured")}</h3></div></div>`
    + `<div class="cf-note ledger-note">Attempted across the union of every integrated bank that carries the subject. A <span class="warn-dot inline"></span> flags a lopsided subject covered mainly from one source. Counts measured locally.</div>`
    + groupList(ledgerRows, "ledger");
  v.appendChild(ledger);

  /* ============================================================
     §5  EXAM-LEVEL ACCURACY SPARKLINE — your scored Grand Tests over
     time (measured, local). Draws only where a real series exists.
     ============================================================ */
  const gtSeries = examAccuracySeries();
  const accPanel = el("section", "panel");
  accPanel.dataset.reveal = "";
  if (gtSeries.length) {
    accPanel.innerHTML = chartFrame(
      "Grand-test accuracy over time",
      "measured", [], CAP,
      sparkline(gtSeries.map(p => ({ y: p.y })), { w: 520, h: 84, unit: "test" }),
      {
        note: gtSeries.length === 1
          ? "One scored grand test so far — no trend yet. Log more in Tests &amp; Scores to grow this line."
          : `Accuracy on your scored grand tests, oldest→newest (${gtSeries.length} tests). Measured from your own entries.`
      }
    );
  } else {
    /* CRAFT richer empty: a calibrated-but-empty gauge — the axis + an
       "awaiting data" midline — reads as a plate awaiting its engraving, not a
       broken box. (emptyState() primitive is integrator-owned; until it lands we
       render this surface-scoped equivalent. See shared-gap note.) */
    accPanel.innerHTML = chartFrame(
      "Grand-test accuracy over time",
      "measured", [], CAP,
      `<div class="acc-empty" aria-hidden="true">`
      + `<svg class="spark acc-empty-axis" viewBox="0 0 520 84" preserveAspectRatio="none" role="img" aria-label="Awaiting your first scored grand test">`
      + `<line class="spk-base" x1="0" y1="78" x2="520" y2="78"/>`
      + `<line class="acc-empty-mid" x1="0" y1="42" x2="520" y2="42"/>`
      + `<text class="spk-tick" x="2" y="12">100</text><text class="spk-tick" x="2" y="76">0</text>`
      + `</svg></div>`,
      {
        note: `No scored grand tests yet — this gauge is calibrated and waiting. Log your first GT in <strong>Tests &amp; Scores</strong> to draw the line.`
      }
    );
  }
  v.appendChild(accPanel);

  labelizeResponsiveTables();
}

/* Build the GT accuracy series from YOUR scored grand tests, oldest→newest.
   Uses only tests with a parseable single date + a recorded right/wrong. */
function examAccuracySeries() {
  const out = [];
  (D.tests && D.tests.gt2026 || []).forEach(t => {
    const s = Store.score(t.id); if (!s || s.right == null) return;
    const att = (s.right || 0) + (s.wrong || 0) + (s.skipped || 0); if (!att) return;
    out.push({ d: _progDate(t.date), y: pct(s.right, att) });
  });
  // CoreBTR scored tests have no calendar date → append after dated ones, in listed order
  (D.tests && D.tests.corebtr || []).forEach(t => {
    const s = Store.score(t.id); if (!s || s.right == null) return;
    const att = (s.right || 0) + (s.wrong || 0) + (s.skipped || 0); if (!att) return;
    out.push({ d: 0, y: pct(s.right, att) });
  });
  return out.sort((a, b) => a.d - b.d);
}
/* parse the messy "DD-DD Mon YYYY" / "DD Mon YYYY" gt2026 date → sortable ms (0 if unparseable) */
function _progDate(str) {
  if (!str) return 0;
  const m = String(str).match(/(\d{1,2})(?:-\d{1,2})?\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (!m) return 0;
  const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const mo = months[m[2].slice(0, 3).toLowerCase()];
  if (mo == null) return 0;
  return new Date(+m[3], mo, +m[1]).getTime();
}
