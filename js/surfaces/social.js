/* ============================================================
   surfaces/social.js — STEP 2: SOCIAL ACCOUNTABILITY
   An account-gated SECTION inside the Planner surface (the retain surface).
   Pods · shared adherence board · accountability partner · WhatsApp snapshot card.

   Privacy model (central): opt-in only; the client computes its OWN tiny aggregate
   summary from the planner's adherence engine and publishes that (never raw state);
   the board is SOLIDARITY (each member vs their own plan), never a leaderboard.
   Local-first is untouched — when signed out this whole section is a calm sign-in
   prompt and the rest of the planner works exactly as before.
   ============================================================ */

/* ── the published summary — derived from the planner's own engine ── */
function _socShortSubj(s) { return String(s || "").replace(/ \/.*/, ""); }
function buildPlannerSummary() {
  const plan = (window.Store && Store.getPlan && Store.getPlan()) || null;
  if (!plan || typeof _planStats !== "function") return null;
  const st = _planStats(plan);
  const wk = _cycleWindow("week", null);                       // always the CURRENT week
  const cs = _cycleStats(plan, wk);
  const onTrack = cs.subjStats.filter(s => s.adher >= 100).map(s => _socShortSubj(s.subject)).slice(0, 12);
  const behind  = cs.subjStats.filter(s => s.adher < 100).map(s => _socShortSubj(s.subject)).slice(0, 12);
  return {
    adherence: st.adherence, coverage: st.coverage,
    subjectsOnTrack: onTrack, subjectsBehind: behind,
    cycleLabel: wk.label, planName: plan.name || "",
  };
}
// hand the builder to the sync module (it owns the publish timing)
if (window.Social) Social.computeSummary = buildPlannerSummary;

/* ── module-local view state ── */
let socBoardOpen = null;             // pod id whose board is expanded (or null)
const socBoardData = {};             // podId -> board json (cached)
const socBoardFetching = new Set();  // in-flight board fetches (de-dupe)
let socPartnerOpen = false;          // accountability-partner panel expanded

function _socRerender() {
  if (typeof currentView !== "undefined" && currentView === "planner" && !_plRendering) {
    _plRefresh = true; renderPlanner();
  }
}

/* ============================================================
   RENDER — the section appended into the active/onboarding planner.
   ============================================================ */
function _plSocialSection() {
  const wrap = el("section", "panel pl-social"); wrap.dataset.reveal = "";
  const head = `<div class="ph"><div class="ph-l"><h3>Pods &amp; accountability</h3>`
    + `<span class="muted small">opt-in · solidarity, never a leaderboard · only your aggregate is shared</span></div></div>`;

  if (!(window.Account && Account.user)) {
    wrap.innerHTML = head
      + `<div class="callout pl-social-signin"><b>Study with a pod.</b> The behaviour that keeps aspirants going is a small study-group and a daily target. `
      + `Sign in to create or join a <b>pod</b> (3–8 people), link an <b>accountability partner</b>, and share a weekly snapshot card to your WhatsApp group. `
      + `<span class="muted">Nothing is shared until you opt in — the rest of Calvetra works fully signed-out, on this device.</span>`
      + `<div class="pl-soc-actions"><button type="button" class="pl-create" data-soc-signin>Sign in to join a pod</button></div></div>`;
    return wrap;
  }

  let html = head;

  /* ── my pods ── */
  const pods = (window.Social && Social.pods) || [];
  let podsHtml = "";
  if (pods.length) {
    podsHtml = pods.map(p => _socPodRow(p)).join("");
  } else {
    podsHtml = `<div class="cf-note">You're not in a pod yet. Create one and share its code, or join with a friend's code.</div>`;
  }
  html += `<div class="pl-soc-block"><div class="pl-soc-bh">Your pods</div><div class="pl-soc-pods">${podsHtml}</div>`
    + `<div class="pl-soc-forms">`
    + `<div class="pl-soc-form"><input class="pl-soc-in" id="socPodName" type="text" maxlength="120" placeholder="New pod name (e.g. Surgery crew)"><button type="button" class="pl-btn" data-soc-create>Create pod</button></div>`
    + `<div class="pl-soc-form"><input class="pl-soc-in" id="socJoinCode" type="text" maxlength="32" placeholder="Paste an invite code to join" autocomplete="off"><button type="button" class="pl-btn" data-soc-join>Join</button></div>`
    + `</div></div>`;

  /* ── accountability partner ── */
  html += _socPartnerBlock();

  /* ── snapshot card (WhatsApp bridge) ── */
  const canShare = buildPlannerSummary();
  html += `<div class="pl-soc-block"><div class="pl-soc-bh">Weekly snapshot card</div>`
    + (canShare
      ? `<div class="cf-note">A calm shareable card — “Adherence ${canShare.adherence}% · ${(canShare.subjectsOnTrack[0] || "—")} done · ${(canShare.subjectsBehind[0] || "—")} behind” — to drop into your WhatsApp study group. Calvetra is the source of truth; WhatsApp is just the surface.</div>`
        + `<div class="pl-soc-actions"><button type="button" class="pl-create" data-soc-share>Share weekly card</button><button type="button" class="pl-btn" data-soc-download>Download image</button></div>`
      : `<div class="cf-note">Create a plan first — the snapshot card is built from your live adherence and this week's subjects.</div>`)
    + `</div>`;

  wrap.innerHTML = html;

  // kick off an async board fetch for the expanded pod (once)
  if (socBoardOpen != null && !socBoardData[socBoardOpen] && !socBoardFetching.has(socBoardOpen) && window.Social) {
    const id = socBoardOpen; socBoardFetching.add(id);
    Social.board(id).then(j => { socBoardFetching.delete(id); if (j && !j._error) { socBoardData[id] = j; _socRerender(); } });
  }
  return wrap;
}

/* one pod row + (when expanded) its solidarity board */
function _socPodRow(p) {
  const open = socBoardOpen === p.id;
  const mc = p.memberCount || 1;
  let head = `<div class="pl-soc-pod${open ? " open" : ""}">`
    + `<button type="button" class="pl-soc-podh" data-soc-board="${esc(String(p.id))}" aria-expanded="${open}">`
    + `<span class="pl-soc-podn">${esc(p.name)}</span>`
    + `<span class="pl-soc-podm">${mc} member${mc === 1 ? "" : "s"}</span>`
    + `<span class="pl-cyc-rx">${open ? "▾" : "▸"}</span></button>`
    + `<div class="pl-soc-podtools">`
    + `<button type="button" class="linkbtn" data-soc-copy="${esc(p.inviteCode)}" title="Copy invite code">⧉ Invite code</button>`
    + `<button type="button" class="linkbtn danger" data-soc-leave="${esc(String(p.id))}">Leave</button>`
    + `</div>`;
  let board = "";
  if (open) {
    const data = socBoardData[p.id];
    if (!data) board = `<div class="pl-soc-board"><div class="cf-note">Loading the board…</div></div>`;
    else board = `<div class="pl-soc-board">${_socBoardBody(data)}</div>`;
  }
  return head + board + `</div>`;
}

/* the solidarity board — each member vs THEIR OWN plan; no rank, no sort by volume */
function _socBoardBody(data) {
  const members = (data.members || []);
  if (!members.length) return `<div class="cf-note">No members yet.</div>`;
  const rows = members.map(m => {
    const s = m.summary;
    const name = (m.isSelf ? "You" : (m.name || "Member"));
    if (!s) {
      return listRow({
        lead: `<span class="pl-soc-av">${esc((name[0] || "?").toUpperCase())}</span>`,
        title: `${esc(name)}${m.isSelf ? "" : ""}`,
        sub: `<span class="muted small">${m.optedIn ? "no summary published yet" : "not sharing to this pod"}</span>`,
        trail: `<span class="muted small">—</span>`,
      });
    }
    const onT = (s.subjectsOnTrack || []).slice(0, 4).map(x => `<span class="pl-soc-chip ok">${esc(x)}</span>`).join("");
    const beh = (s.subjectsBehind || []).slice(0, 4).map(x => `<span class="pl-soc-chip behind">${esc(x)}</span>`).join("");
    return listRow({
      lead: `<span class="pl-soc-av${m.isSelf ? " me" : ""}">${esc((name[0] || "?").toUpperCase())}</span>`,
      title: `${esc(name)} <span class="pl-soc-adh num">${s.adherence}%</span> <span class="muted small">adherence to own plan</span>`,
      sub: `<span class="pl-soc-chips">${onT}${beh || (onT ? "" : `<span class="muted small">no subjects this week</span>`)}</span>`,
      trail: `<span class="pl-soc-cov num" title="High-yield covered">${s.coverage}%<span class="pl-soc-covl">HY</span></span>`,
    });
  });
  return groupList(rows, "pl-soc-blist")
    + `<div class="cf-note">Each row is that member's adherence to <b>their own</b> plan this cycle — solidarity, not a ranking. ${esc(data.pod && data.pod.name || "")}</div>`;
}

/* accountability partner block */
function _socPartnerBlock() {
  const ps = (window.Social && Social.partners) || null;
  const partners = (ps && ps.partners) || [];
  const pending = ps && ps.pendingInvite;
  let body = "";
  if (partners.length) {
    body = partners.map(pt => {
      const s = pt.summary;
      if (!s) return `<div class="pl-soc-partner"><span class="pl-soc-av">${esc((pt.name[0] || "?").toUpperCase())}</span><span class="pl-soc-pn">${esc(pt.name)}</span><span class="muted small">hasn't shared a summary yet</span></div>`;
      const onT = (s.subjectsOnTrack || []).slice(0, 3).map(x => `<span class="pl-soc-chip ok">${esc(x)}</span>`).join("");
      const beh = (s.subjectsBehind || []).slice(0, 3).map(x => `<span class="pl-soc-chip behind">${esc(x)}</span>`).join("");
      return `<div class="pl-soc-partner"><span class="pl-soc-av">${esc((pt.name[0] || "?").toUpperCase())}</span>`
        + `<span class="pl-soc-pn">${esc(pt.name)} <span class="pl-soc-adh num">${s.adherence}%</span></span>`
        + `<span class="pl-soc-chips">${onT}${beh}</span></div>`;
    }).join("");
  } else {
    body = `<div class="cf-note">A 1:1 buddy who sees your weekly snapshot, and you see theirs — mutual opt-in.</div>`;
  }
  let forms = "";
  if (pending) {
    forms = `<div class="pl-soc-form"><span class="pl-soc-code">${esc(pending)}</span><button type="button" class="linkbtn" data-soc-copy="${esc(pending)}">⧉ Copy your invite</button><span class="muted small">share this code with your partner</span></div>`;
  } else {
    forms = `<div class="pl-soc-form"><button type="button" class="pl-btn" data-soc-pinvite>Invite a partner</button>`
      + `<span class="muted small">or accept theirs →</span></div>`;
  }
  forms += `<div class="pl-soc-form"><input class="pl-soc-in" id="socPartnerCode" type="text" maxlength="32" placeholder="Paste a partner's code" autocomplete="off"><button type="button" class="pl-btn" data-soc-paccept>Accept</button></div>`;
  return `<div class="pl-soc-block"><div class="pl-soc-bh">Accountability partner</div>${body}${forms}</div>`;
}

/* ============================================================
   WHATSAPP SNAPSHOT CARD — canvas → Web Share API (fallback download/copy).
   No WhatsApp integration; the app is the source of truth, the user drops the
   image into their own group.
   ============================================================ */
function _socRenderCard(summary) {
  const W = 1080, H = 1080, S = 2;                 // square, retina
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  // calm cream palette (theme-independent — the card reads anywhere)
  const cream = "#f4f1ea", ink = "#2b2620", muted = "#6f675b", line = "#e2dccf";
  const ok = "#3f7d5a", behind = "#b0683a", accent = "#8a6d3b";
  x.fillStyle = cream; x.fillRect(0, 0, W, H);
  // frame
  x.strokeStyle = line; x.lineWidth = 4; x.strokeRect(40, 40, W - 80, H - 80);
  const pad = 96;
  // brand
  x.fillStyle = accent; x.font = "600 40px Georgia, serif";
  x.fillText("Calvetra", pad, 150);
  x.fillStyle = muted; x.font = "400 30px -apple-system, Segoe UI, sans-serif";
  x.fillText("Weekly accountability snapshot", pad, 196);
  x.fillStyle = muted; x.font = "400 28px -apple-system, Segoe UI, sans-serif";
  x.fillText(summary.cycleLabel || "", pad, 244);

  // big adherence
  x.fillStyle = ink; x.font = "700 260px Georgia, serif";
  x.fillText(summary.adherence + "%", pad, 490);
  x.fillStyle = muted; x.font = "400 34px -apple-system, Segoe UI, sans-serif";
  x.fillText("adherence to my plan", pad, 556);

  // coverage
  x.fillStyle = ink; x.font = "600 48px Georgia, serif";
  x.fillText(summary.coverage + "%", W - pad - x.measureText(summary.coverage + "%").width, 500);
  x.fillStyle = muted; x.font = "400 28px -apple-system, Segoe UI, sans-serif";
  const covL = "high-yield covered"; x.fillText(covL, W - pad - x.measureText(covL).width, 540);

  // divider
  x.strokeStyle = line; x.lineWidth = 2; x.beginPath(); x.moveTo(pad, 600); x.lineTo(W - pad, 600); x.stroke();

  // subject chips — ONE row per group with a "+N" overflow, so the card always fits
  let cy = 664;
  const chip = (s, X, Y, col) => {
    const w = x.measureText(s).width + 44;
    x.fillStyle = "#fff"; _socRoundRect(x, X, Y - 38, w, 52, 26); x.fill();
    x.strokeStyle = col; x.lineWidth = 2; _socRoundRect(x, X, Y - 38, w, 52, 26); x.stroke();
    x.fillStyle = col; x.fillText(s, X + 22, Y);
    return w;
  };
  const drawChips = (label, arr, col) => {
    x.fillStyle = muted; x.font = "600 30px -apple-system, Segoe UI, sans-serif";
    x.fillText(label, pad, cy);
    const items = (arr && arr.length ? arr : ["—"]);
    let cx = pad, shown = 0; const lineY = cy + 52;
    x.font = "500 30px -apple-system, Segoe UI, sans-serif";
    for (let i = 0; i < items.length; i++) {
      const w = x.measureText(items[i]).width + 44;
      const reserve = (i < items.length - 1) ? 130 : 0;    // keep room for a "+N" chip
      if (shown > 0 && cx + w > W - pad - reserve) {
        chip("+" + (items.length - shown), cx, lineY, col);
        break;
      }
      cx += chip(items[i], cx, lineY, col) + 16; shown++;
    }
    cy = lineY + 96;
  };
  drawChips("On track", summary.subjectsOnTrack, ok);
  drawChips("Behind", summary.subjectsBehind, behind);

  // footer
  x.fillStyle = muted; x.font = "400 26px -apple-system, Segoe UI, sans-serif";
  const foot = "Solidarity, not a leaderboard · tracked, not self-reported";
  x.fillText(foot, pad, H - 110);
  if (summary.planName) { x.fillStyle = accent; x.font = "400 26px -apple-system, Segoe UI, sans-serif"; x.fillText(summary.planName, pad, H - 70); }
  return c;
}
function _socRoundRect(x, X, Y, w, h, r) {
  x.beginPath();
  x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath();
}
function _socCardText(s) {
  const on = (s.subjectsOnTrack || []).slice(0, 3).join(", ") || "—";
  const beh = (s.subjectsBehind || []).slice(0, 3).join(", ") || "—";
  return `📚 Calvetra · ${s.cycleLabel}\nAdherence ${s.adherence}% · HY covered ${s.coverage}%\n✅ On track: ${on}\n⏳ Behind: ${beh}`;
}
async function _socShareCard(download) {
  const s = buildPlannerSummary();
  if (!s) { toast("Create a plan first", true); return; }
  const canvas = _socRenderCard(s);
  const text = _socCardText(s);
  const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
  if (!blob) { toast("Could not generate the card", true); return; }
  const file = new File([blob], "calvetra-week.png", { type: "image/png" });

  // Web Share API (with files) — the primary path on mobile (drops into WhatsApp)
  if (!download && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text, title: "My week — Calvetra" }); return; }
    catch (e) { if (e && e.name === "AbortError") return; /* else fall through to download */ }
  }
  // Fallback: download the image + copy the text caption
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "calvetra-week.png";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  try { await navigator.clipboard.writeText(text); toast("Card downloaded · caption copied — paste both into WhatsApp"); }
  catch (e) { toast("Card downloaded — drop it into your WhatsApp group"); }
}

async function _socCopy(textOrCode) {
  try { await navigator.clipboard.writeText(textOrCode); toast("Copied — share it with your pod"); }
  catch (e) { toast("Copy failed — code: " + textOrCode, true); }
}

/* ============================================================
   EVENT WIRING (bound once; scoped to the planner view's social section)
   ============================================================ */
let _socBound = false;
function _socBindOnce() {
  if (_socBound) return; _socBound = true;

  document.addEventListener("social-changed", () => _socRerender());

  document.addEventListener("click", async e => {
    if (typeof currentView === "undefined" || currentView !== "planner") return;
    const within = t => t && $("#view-planner") && $("#view-planner").contains(t);

    const signin = e.target.closest("[data-soc-signin]");
    if (signin && within(signin)) { const b = $("#btnAccount"); if (b) b.click(); return; }

    const create = e.target.closest("[data-soc-create]");
    if (create && within(create)) {
      const inp = $("#socPodName"); const name = (inp && inp.value || "").trim();
      if (!name) { toast("Give your pod a name", true); return; }
      create.disabled = true;
      const r = await Social.createPod(name);
      create.disabled = false;
      if (r && !r._error) { toast("Pod created — share the invite code"); renderPlanner(); }
      else toast((r && r.error) || "Could not create the pod", true);
      return;
    }
    const join = e.target.closest("[data-soc-join]");
    if (join && within(join)) {
      const inp = $("#socJoinCode"); const code = (inp && inp.value || "").trim();
      if (!code) { toast("Paste an invite code", true); return; }
      join.disabled = true;
      const r = await Social.joinPod(code);
      join.disabled = false;
      if (r && !r._error) { toast("Joined the pod"); renderPlanner(); }
      else toast(r && r._error === 404 ? "That invite code isn't valid" : ((r && r.error) || "Could not join"), true);
      return;
    }
    const board = e.target.closest("[data-soc-board]");
    if (board && within(board)) { const id = +board.dataset.socBoard; socBoardOpen = (socBoardOpen === id ? null : id); renderPlanner(); return; }

    const copy = e.target.closest("[data-soc-copy]");
    if (copy && within(copy)) { _socCopy(copy.dataset.socCopy); return; }

    const leave = e.target.closest("[data-soc-leave]");
    if (leave && within(leave)) {
      if (!confirm("Leave this pod? Your summary is removed from its board. (Your plan and tracking stay.)")) return;
      const id = +leave.dataset.socLeave;
      const r = await Social.leavePod(id);
      if (socBoardOpen === id) socBoardOpen = null; delete socBoardData[id];
      if (r && !r._error) { toast("Left the pod"); renderPlanner(); } else toast("Could not leave", true);
      return;
    }
    const pinvite = e.target.closest("[data-soc-pinvite]");
    if (pinvite && within(pinvite)) {
      pinvite.disabled = true;
      const r = await Social.partnerInvite();
      pinvite.disabled = false;
      if (r && !r._error) { toast("Invite ready — copy the code to your partner"); renderPlanner(); }
      else toast("Could not create an invite", true);
      return;
    }
    const paccept = e.target.closest("[data-soc-paccept]");
    if (paccept && within(paccept)) {
      const inp = $("#socPartnerCode"); const code = (inp && inp.value || "").trim();
      if (!code) { toast("Paste your partner's code", true); return; }
      paccept.disabled = true;
      const r = await Social.partnerAccept(code);
      paccept.disabled = false;
      if (r && !r._error) { toast("Partner linked"); renderPlanner(); }
      else toast(r && r._error === 404 ? "That code isn't valid" : ((r && r.error) || "Could not accept"), true);
      return;
    }
    const share = e.target.closest("[data-soc-share]");
    if (share && within(share)) { _socShareCard(false); return; }
    const dl = e.target.closest("[data-soc-download]");
    if (dl && within(dl)) { _socShareCard(true); return; }
  });
}
_socBindOnce();
