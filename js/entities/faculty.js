/* ============================================================
   entities/faculty.js — renderFacultyPage(id)   ·  Stage 3b
   Entity page (NOT a tab): a faculty member — career timeline (the
   un-buildable-by-incumbents viz) + two DIRECTIONAL ratings (seed) +
   subjects taught + linked platforms + videos by this faculty.
   This page proves the D.faculty[] schema end-to-end.

   NEUTRALITY FIREWALL: aggregate-only, community-sentiment framing, every
   name/affiliation/date/score sourced (directional seed). NEVER a "worst
   faculty" board — only the individual's own community standing.

   GATED: when D.faculty is empty/absent, render an honest empty-state and
   (in main.js) the Faculty nav entry stays hidden. Never a fabricated roster.
   ============================================================ */

/* videos confidently attributed to this faculty (build_data mapped D.videos[].facultyId) */
function facultyVideos(id) {
  return VIDEOS.filter(v => (v.facultyId === id) || (v.facultyIds || []).includes(id));
}
/* span of years active across all affiliations with a known year (directional) */
function _facYears(f) {
  const froms = (f.affiliations || []).map(a => parseInt(a.from, 10)).filter(n => !isNaN(n));
  if (!froms.length) return null;
  const start = Math.min(...froms);
  const now = new Date().getFullYear();
  return Math.max(1, now - start);
}

function renderFacultyPage(id) {
  const v = $("#view-faculty"); if (!v) return;
  resetPlates();

  /* ---- GATED empty-state: no seeded roster (or unknown id) ---- */
  if (!FACULTY.length) {
    v.innerHTML = `<div class="entity-head">
        <div class="eyebrow"><button class="linkbtn back" data-go-overview>‹ Home</button> · FACULTY</div>
        <h2 class="sh-name">Faculty</h2>
      </div>
      ${panel({
        title: "Faculty profiles are being seeded",
        epi: "directional",
        body: `<p class="muted">A first-class faculty layer — career history + neutral, gated community ratings — is being seeded from public sources. <b>0 profiles live.</b></p>
          <p class="muted small">Every name, affiliation, date and score will trace to a real source (directional seed). Aggregate-only · community-sentiment · never a ranking of "worst" faculty.</p>`
      })}`;
    return;
  }

  const f = facById(id);
  if (!f) {
    v.innerHTML = `<div class="entity-head">
        <div class="eyebrow"><button class="linkbtn back" data-go-overview>‹ Home</button> · FACULTY</div>
        <h2 class="sh-name">Faculty profile not found</h2>
      </div>
      ${panel({ title: "Not in the seed yet", epi: "directional",
        body: `<p class="muted">${FACULTY.length} faculty profiles are live (directional seed). This one isn't among them yet.</p>` })}`;
    return;
  }

  /* ---- derived (all directional / measured-local) ---- */
  const subs = [...new Set((f.subjects || []).map(canon))];
  const linkedPlats = (f.platforms || []).map(p => p.platformId).filter(pid => PLAT_BY_ID[pid]);
  const vids = facultyVideos(f.id);
  const years = _facYears(f);
  const r = f.ratings || {};
  const profScore = r.profile && r.profile.score != null ? r.profile.score : null;
  const vidAvgs = (r.videoByPlatform || []).map(x => x.avg).filter(x => x != null);
  const vidAvg = vidAvgs.length ? (vidAvgs.reduce((a, b) => a + b, 0) / vidAvgs.length) : null;
  const facCap = "2026-06-27"; // faculty seed capture (directional)

  /* ---- HERO numeral: prefer real community ★; while votes are seeding (all null),
     fall back to a datum the seed actually supports (years active — directional, sourced)
     rather than a hollow "—". The label + epistemic badge adapt to whichever it is, so the
     reader is never misled about what the single hero number means.
     heroCount = the integer to count up to (CRAFT: motion.js countUp), set ONLY when the
     hero number is a whole-integer datum (years active). Star ratings are decimals/seed
     placeholders, so they animate to their exact final string with no count-up — never a
     misleading tick through fabricated values. ---- */
  let heroNum, heroLbl, heroEpi, heroNote, heroCount = null;
  if (profScore != null) {
    heroNum = profScore; heroLbl = "community ★"; heroEpi = "directional";
    heroNote = (r.profile.count || 0) + " votes · seed";
  } else if (vidAvg != null) {
    heroNum = vidAvg.toFixed(1); heroLbl = "video ★ (rolled up)"; heroEpi = "directional";
    heroNote = "verified voting opens with accounts";
  } else if (years != null) {
    heroNum = years + "y"; heroLbl = "years active"; heroEpi = "directional";
    heroNote = "community ★ opens with verified voting"; heroCount = years;
  } else {
    heroNum = "—"; heroLbl = "community ★"; heroEpi = "directional";
    heroNote = "seed · verified voting opens with accounts";
  }

  /* ---- entity header: breadcrumb + name + aka + ONE hero number (community ★) ---- */
  const aka = (f.aka && f.aka.length) ? `<span class="sh-aka">aka “${esc(f.aka[0])}”</span>` : "";
  const head = `<div class="entity-head">
      <div class="eyebrow"><button class="linkbtn back" data-go-overview>‹ Home</button> · FACULTY</div>
      <div class="eh-top">
        <div class="eh-id"><h2 class="sh-name">${esc(f.name)}</h2>${aka}
          <div class="eh-tags">${subs.map(s => `<a class="echip is-link" role="link" tabindex="0" data-go-subject="${esc(s)}">${esc(s)}</a>`).join("")}</div>
        </div>
        <div class="eh-hero">
          <span class="hero-num num"${heroCount != null ? ` data-count="${heroCount}"` : ""}>${esc(String(heroNum))}</span>
          <span class="hero-lbl">${esc(heroLbl)} ${epiBadge(heroEpi)}</span>
          <span class="hero-note muted small">${esc(heroNote)}</span>
        </div>
      </div>
    </div>`;

  /* ---- 6-tile strip (mobile density; tappable where relational) ---- */
  const tiles = `<div class="tiles">`
    + statTile({ value: linkedPlats.length || "—", label: "PLATFORMS", note: linkedPlats.map(platName).join(" · ") || "reputation only" })
    + statTile({ value: subs.length, label: "SUBJECTS", note: subs.join(" · ") })
    + statTile({ value: years != null ? years + "y" : "—", label: "YEARS ACTIVE", note: years != null ? "since earliest known" : "dates approx.", epi: "directional" })
    + statTile({ value: profScore != null ? profScore : "—", label: "PROFILE ★", note: profScore != null ? (r.profile.count + " votes") : "gated · seed", epi: "directional" })
    + statTile({ value: vidAvg != null ? vidAvg.toFixed(1) : "—", label: "VIDEO ★", note: vidAvg != null ? "rolled up" : "rolled up · seed", epi: "directional" })
    + statTile({ value: vids.length, label: "VIDEOS", note: vids.length ? "inferred by subject" : "none inferred yet", epi: "proxy" })
    + `</div>`;

  /* ---- Pl.1 — CAREER TIMELINE (the moat) ---- */
  const tlSources = [...new Set((f.affiliations || []).flatMap(a => a.sourceIds || []).concat(f.sourceIds || []))];
  const timeline = chartFrame(
    "Career timeline — affiliations over time",
    "directional", tlSources, facCap,
    facultyTimeline(f),
    {
      legend: `<span class="cf-key"><span class="lg-seg st-current"></span>current</span>`
        + `<span class="cf-key"><span class="lg-seg st-past"></span>past</span>`
        + `<span class="cf-key"><span class="lg-seg st-solo"></span>solo / superspecialty</span>`,
      note: "Career history from public sources (directional seed). Movement between platforms is the story no incumbent can show. Aggregate · community-sentiment · not endorsement."
    }
  );

  /* ---- Pl.2 — TWO RATINGS (directional, gated, aggregate-only) ---- */
  const ratings = chartFrame(
    "Two community ratings",
    "directional", f.sourceIds || [], facCap,
    ratingScorecard(f.ratings || {}, "faculty"),
    { note: "Profile votes are gated by in-app activity (opens with accounts). Video rating is rolled up from this faculty's videos. Aggregate-only — never a ranking of faculty against one another." }
  );

  /* ---- SUBJECTS + LINKED PLATFORMS (the triangle) ---- */
  const platChips = (f.affiliations || []).map(a => {
    const pid = a.platformId;
    if (pid && PLAT_BY_ID[pid]) return `<a class="echip plat is-link" role="link" tabindex="0" data-go-platform="${esc(pid)}" style="--c:${platColor(pid)}">${esc(platName(pid))}<span class="echip-st">${esc(a.status || "")}</span></a>`;
    const offName = pid ? platDisplayName(pid) : (a.name || "Independent");
    return `<span class="echip off" title="Named in public sources; not yet integrated in Calvetra">${esc(offName)}<span class="echip-st">${esc(a.status || "")}</span></span>`;
  }).join("");
  const links = panel({
    title: "Subjects taught · linked platforms",
    body: `<div class="fac-links">
        <div class="fl-block"><span class="fl-h">Subjects</span><div class="echips">${subs.map(s => `<a class="echip is-link" role="link" tabindex="0" data-go-subject="${esc(s)}">${esc(s)}</a>`).join("")}</div></div>
        <div class="fl-block"><span class="fl-h">Affiliations</span><div class="echips">${platChips}</div></div>
      </div>
      ${f.bio ? `<p class="fac-bio muted small">${esc(f.bio)}</p>` : ""}`,
    epi: "directional", sourceIds: f.sourceIds || [], captured: facCap
  });

  /* ---- VIDEOS by this faculty (confident attribution) ---- */
  let videos = "";
  if (vids.length) {
    const rows = vids.slice(0, 12).map(vi => listRow({
      lead: dotLead(platColor("cerebellum")),
      title: esc(vi.topic),
      sub: `CoreBTR · ${esc(vi.subject)}${vi.durMin ? " · " + vi.durMin + " min" : ""}`,
      trail: confTag(vi.confidence || "")
    }));
    videos = panel({
      title: `Likely clips by ${esc(f.name)} (inferred)`,
      body: groupList(rows)
        + (vids.length > 12 ? `<p class="muted small" style="margin-top:8px">+${vids.length - 12} more inferred</p>` : "")
        + `<p class="muted small" style="margin-top:8px">Attribution is by unique-subject inference — not source-confirmed per clip.</p>`,
      epi: "proxy"
    });
  }

  /* CRAFT entrance: wrap each grid child in [data-reveal] so animateView()
     (called by renderFacultyView after this render) gives panels a gentle,
     staggered rise-in ONCE. Charts inside still expose .cframe.plate, so
     chartIntro() finds + animates them independently (timeline rail draw +
     node stagger, ratings star-meters). Reduced-motion firewall collapses
     both to final state — every datum, label and source stays visible. */
  const rv = html => `<div data-reveal>${html}</div>`;
  v.innerHTML = head + tiles
    + `<div class="panel-grid">${rv(timeline)}${rv(ratings)}</div>`
    + `<div class="inst-grid">${rv(links)}${videos ? rv(videos) : ""}</div>`;
}
