/* ===== Storage adapter =====
   Local-first now; swap to the server backend by setting
   window.APP_CONFIG.backend = "server" (see server/ for the PHP API).
   User-state is kept SEPARATE from the source data so it can later be
   scoped per-account and synced/aggregated (ratings -> social layer). */

window.APP_CONFIG = window.APP_CONFIG || {
  backend: "local",            // "local" | "server"
  apiBase: "./server/api.php", // used when backend === "server"
  profile: "me",               // becomes the account id in the multi-user future
  stateVersion: 1,
};

const STATE_KEY = () => `qbank_state_v${APP_CONFIG.stateVersion}_${APP_CONFIG.profile}`;

function blankState() {
  return {
    profile: APP_CONFIG.profile,
    progress: {},     // moduleId -> {a:0|1, r:0|1, t:0|1, ts}
    stars: {},        // moduleId -> 1  (manual override on top of computed priority)
    scores: {},       // testId   -> {right,wrong,skipped,total,diff,notes,date}
    customTests: [],  // user-added GTs / tests
    videos: {},       // videoId  -> {w:0|1, v:0|1, ts}  (watched / revised)
    schedule: [],     // user-added schedule / content entries (legacy seam; kept)
    subs: [],         // My-subscriptions: platform ids the student owns (default empty = opt-in)
    plan: null,       // the active Study Planner plan (local-first; see Store.setPlan)
    cycles: [],       // locked retrospective cycles (week/month snapshots; see Store.lockCycle)
    updatedAt: null,
  };
}

const Store = {
  state: blankState(),
  _timer: null,

  async load() {
    if (APP_CONFIG.backend === "server") {
      try {
        const r = await fetch(`${APP_CONFIG.apiBase}?profile=${encodeURIComponent(APP_CONFIG.profile)}`, { credentials: "include" });
        if (r.ok) { const j = await r.json(); this.state = Object.assign(blankState(), j); return this.state; }
      } catch (e) { console.warn("server load failed, falling back to local", e); }
    }
    try {
      const raw = localStorage.getItem(STATE_KEY());
      if (raw) this.state = Object.assign(blankState(), JSON.parse(raw));
    } catch (e) { console.warn("local load failed", e); }
    return this.state;
  },

  save() {
    this.state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STATE_KEY(), JSON.stringify(this.state)); } catch (e) {}
    if (APP_CONFIG.backend === "server") {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => {
        // edit token is kept in localStorage (never in committed code)
        const token = APP_CONFIG.editToken || localStorage.getItem("qbank_edit_token") || "";
        fetch(`${APP_CONFIG.apiBase}?profile=${encodeURIComponent(APP_CONFIG.profile)}`, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json", "X-Edit-Token": token },
          body: JSON.stringify(this.state),
        }).catch(e => console.warn("server save failed (kept locally)", e));
      }, 600);
    }
    // account sync (no-op unless signed in); local-first — never blocks this call
    if (window.Account) Account.onLocalSave();
    if (window.Social) Social.onLocalSave();   // opt-in summary publish (no-op unless in a pod/partner)
    document.dispatchEvent(new CustomEvent("state-changed"));
  },

  // ---- progress helpers ----
  prog(id) { return this.state.progress[id] || { a: 0, r: 0, t: 0 }; },
  toggle(id, field) {
    const p = Object.assign({ a: 0, r: 0, t: 0 }, this.state.progress[id]);
    p[field] = p[field] ? 0 : 1;
    // sensible cascade: reviewing/retaking implies attempted
    if ((field === "r" || field === "t") && p[field]) p.a = 1;
    p.ts = Date.now();
    if (!p.a && !p.r && !p.t) delete this.state.progress[id];
    else this.state.progress[id] = p;
    this.save();
  },
  star(id) {
    if (this.state.stars[id]) delete this.state.stars[id];
    else this.state.stars[id] = 1;
    this.save();
  },

  // ---- video tracking (watched / revised) ----
  video(id) { return this.state.videos[id] || { w: 0, v: 0 }; },
  toggleVideo(id, field) {
    const x = Object.assign({ w: 0, v: 0 }, this.state.videos[id]);
    x[field] = x[field] ? 0 : 1;
    if (field === "v" && x.v) x.w = 1; // revised implies watched
    x.ts = Date.now();
    if (!x.w && !x.v) delete this.state.videos[id]; else this.state.videos[id] = x;
    this.save();
  },

  // ---- test scoring ----
  score(id) { return this.state.scores[id] || null; },
  setScore(id, patch) {
    const s = Object.assign({ right: null, wrong: null, skipped: null, total: null, diff: 0, notes: "", date: "" }, this.state.scores[id], patch);
    this.state.scores[id] = s;
    this.save();
  },
  clearScore(id) { delete this.state.scores[id]; this.save(); },

  // ---- custom content ----
  addCustomTest(t) { t.id = "ut-" + Date.now(); t.custom = true; this.state.customTests.push(t); this.save(); return t; },
  removeCustomTest(id) { this.state.customTests = this.state.customTests.filter(t => t.id !== id); delete this.state.scores[id]; this.save(); },

  // ---- My-subscriptions (the personal-banks lens; scopes plan generation) ----
  subs() { return this.state.subs || (this.state.subs = []); },
  isSub(id) { return this.subs().includes(id); },
  toggleSub(id) {
    const s = this.subs();
    const i = s.indexOf(id);
    if (i >= 0) s.splice(i, 1); else s.push(id);
    this.save();
  },
  setSubs(ids) { this.state.subs = (ids || []).slice(); this.save(); },

  // ---- study plan (single active plan; local-first, syncs later with user-state) ----
  getPlan() { return this.state.plan || null; },
  setPlan(plan) { this.state.plan = plan || null; this.save(); return this.state.plan; },
  updatePlan(patch) {
    if (!this.state.plan) return null;
    this.state.plan = Object.assign({}, this.state.plan, patch);
    this.save();
    return this.state.plan;
  },
  clearPlan() { this.state.plan = null; this.save(); },

  // ---- locked retrospective cycles (week/month snapshots; lean: ids only) ----
  getCycles() { return this.state.cycles || (this.state.cycles = []); },
  // upsert by id (idempotent — re-locking the same window replaces, never duplicates)
  lockCycle(cycle) {
    if (!cycle || !cycle.id) return null;
    const list = this.getCycles();
    const i = list.findIndex(c => c.id === cycle.id);
    if (i >= 0) list[i] = cycle; else list.push(cycle);
    this.save();
    return cycle;
  },
  removeCycle(id) { this.state.cycles = this.getCycles().filter(c => c.id !== id); this.save(); },

  // ---- backup / portability (bridge to "publish to server") ----
  export() { return JSON.stringify(this.state, null, 2); },
  import(json) {
    const obj = typeof json === "string" ? JSON.parse(json) : json;
    this.state = Object.assign(blankState(), obj);
    this.save();
  },
  reset() { this.state = blankState(); this.save(); },
};

window.Store = Store;

/* ===== Account + state sync (Google OAuth; local-first preserved) =====
   The backend is SYNC + SOCIAL, never a hard dependency. Offline edits persist
   in localStorage and reconcile on reconnect. The server is a dumb versioned
   blob store; the first-login local→account MERGE happens here, client-side. */

const SYNC = { OFF: "off", SYNCED: "synced", SYNCING: "syncing", PENDING: "pending", OFFLINE: "offline" };
const PENDING_KEY = "qbank_pending_sync";

const Account = {
  user: null,            // {id,email,name} when signed in
  csrf: null,
  config: { googleClientId: "", devAuth: false },
  status: SYNC.OFF,
  _timer: null,
  _gisLoaded: false,

  api(action) { return `${APP_CONFIG.apiBase}?action=${action}`; },

  setStatus(s) {
    this.status = s;
    document.dispatchEvent(new CustomEvent("account-changed", { detail: { user: this.user, status: s } }));
  },

  // called once at startup (after Store.load). Never blocks the UI.
  async init() {
    try {
      const r = await fetch(this.api("me"), { credentials: "include" });
      if (!r.ok) throw new Error("me " + r.status);
      const j = await r.json();
      this.config = j.config || this.config;
      if (j.user) {
        this.user = j.user; this.csrf = j.csrf;
        await this.reconcileOnLogin();           // merge server <-> local
      } else {
        this.user = null; this.csrf = null;
        this.setStatus(SYNC.OFF);
      }
    } catch (e) {
      // backend unreachable: stay fully local. If signed-in previously unknown, just OFF.
      this.setStatus(navigator.onLine ? SYNC.OFF : SYNC.OFFLINE);
    }
    window.addEventListener("online", () => { if (this.user) this.flush(); });
    return this;
  },

  // first-login (or re-open) reconcile: merge the server blob with local, push the union up.
  async reconcileOnLogin() {
    this.setStatus(SYNC.SYNCING);
    try {
      const r = await fetch(this.api("state"), { credentials: "include" });
      const server = r.ok ? (await r.json()).state : null;
      const merged = mergeState(server, Store.state);
      Store.state = merged;
      try { localStorage.setItem(STATE_KEY(), JSON.stringify(merged)); } catch (e) {}
      document.dispatchEvent(new CustomEvent("state-changed"));
      await this.push(true);                     // send the merged union to the server
    } catch (e) {
      this.markPending();
    }
    if (window.Social) Social.refresh();         // pull the user's pods + partners (account-gated)
  },

  onLocalSave() {
    if (!this.user) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.push(), 700);   // debounced
  },

  markPending() { try { localStorage.setItem(PENDING_KEY, "1"); } catch (e) {} this.setStatus(SYNC.PENDING); },
  clearPending() { try { localStorage.removeItem(PENDING_KEY); } catch (e) {} },
  hasPending() { try { return localStorage.getItem(PENDING_KEY) === "1"; } catch (e) { return false; } },

  async push(initial, depth) {
    if (!this.user || !this.csrf) return;
    if (!navigator.onLine) { this.markPending(); this.setStatus(SYNC.OFFLINE); return; }
    if (!initial) this.setStatus(SYNC.SYNCING);
    try {
      const r = await fetch(this.api("state"), {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": this.csrf },
        body: JSON.stringify(Store.state),
      });
      if (r.status === 401 || r.status === 403) { // session/csrf lost — go local, surface signed-out
        this.user = null; this.csrf = null; this.markPending(); this.setStatus(SYNC.OFF); return;
      }
      if (!r.ok) throw new Error("state " + r.status);
      const j = await r.json();
      if (j.stale && j.state && (depth || 0) < 2) { // server had a newer copy: merge + re-push (bounded)
        Store.state = mergeState(j.state, Store.state);
        try { localStorage.setItem(STATE_KEY(), JSON.stringify(Store.state)); } catch (e) {}
        document.dispatchEvent(new CustomEvent("state-changed"));
        return this.push(false, (depth || 0) + 1);
      }
      this.clearPending();
      this.setStatus(SYNC.SYNCED);
    } catch (e) {
      this.markPending();                        // kept locally; retried on next save / online
    }
  },

  flush() { if (this.user && this.hasPending()) this.push(); },

  // ---- sign in / out ----
  async loadGIS() {
    if (this._gisLoaded) return true;
    if (!this.config.googleClientId) return false;
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.defer = true;
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    this._gisLoaded = true; return true;
  },

  async signInGoogle() {
    if (!(await this.loadGIS())) { alert("Google sign-in is not configured yet."); return; }
    google.accounts.id.initialize({
      client_id: this.config.googleClientId,
      callback: async (resp) => {
        try {
          const r = await fetch(this.api("google"), {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: resp.credential }),
          });
          if (!r.ok) throw new Error("google " + r.status);
          const j = await r.json();
          this.user = j.user; this.csrf = j.csrf;
          await this.reconcileOnLogin();
        } catch (e) { alert("Sign-in failed."); }
      },
    });
    google.accounts.id.prompt();
  },

  async signInDev() {
    try {
      const r = await fetch(this.api("devlogin"), { method: "POST", credentials: "include" });
      if (!r.ok) throw new Error("devlogin " + r.status);
      const j = await r.json();
      this.user = j.user; this.csrf = j.csrf;
      await this.reconcileOnLogin();
    } catch (e) { alert("Dev sign-in failed (is the PHP server running?)."); }
  },

  async signOut() {
    try {
      await fetch(this.api("logout"), {
        method: "POST", credentials: "include",
        headers: { "X-CSRF-Token": this.csrf || "" },
      });
    } catch (e) { /* ignore; clear locally regardless */ }
    this.user = null; this.csrf = null; this.clearPending();
    this.setStatus(SYNC.OFF);
    if (window.Social) { Social.pods = []; Social.partners = null; Social._lastPublished = null; Social._emit(); }
    // local data stays intact — sign-out is not a reset.
  },
};

/* Merge two state blobs without losing local ticks. Base = newer top-level
   updatedAt; per-entry newest-ts wins for progress/videos; unions for sets. */
function mergeState(a, b) {
  if (!a) return b || blankState();
  if (!b) return a;
  const ta = Date.parse(a.updatedAt || 0) || 0;
  const tb = Date.parse(b.updatedAt || 0) || 0;
  const base = tb >= ta ? b : a;          // base wins ties → keep local
  const other = tb >= ta ? a : b;
  const out = Object.assign(blankState(), JSON.parse(JSON.stringify(base)));

  const mergeTsMap = (key) => {
    const o = other[key] || {}, r = out[key] || (out[key] = {});
    for (const id in o) {
      if (!r[id]) r[id] = o[id];
      else if ((o[id].ts || 0) > (r[id].ts || 0)) r[id] = o[id];
    }
  };
  mergeTsMap("progress");
  mergeTsMap("videos");

  // scores: fill ids the base lacks (don't clobber base's measured entries)
  const os = other.scores || {}; out.scores = out.scores || {};
  for (const id in os) if (!(id in out.scores)) out.scores[id] = os[id];

  // stars: union
  const ost = other.stars || {}; out.stars = out.stars || {};
  for (const id in ost) out.stars[id] = 1;

  // subs: union (set)
  out.subs = Array.from(new Set([...(base.subs || []), ...(other.subs || [])]));

  // customTests: union by id
  const seen = new Set((out.customTests || []).map(t => t.id));
  (other.customTests || []).forEach(t => { if (!seen.has(t.id)) { out.customTests.push(t); seen.add(t.id); } });

  // plan: keep base's; fall back to other's if base has none
  if (!out.plan && other.plan) out.plan = other.plan;

  // cycles: union by id (locked retrospective snapshots; a lock on either device is kept).
  // On id-collision keep the later lockedAt so a re-lock wins.
  const cyc = {};
  [...(base.cycles || []), ...(other.cycles || [])].forEach(c => {
    if (!c || !c.id) return;
    const prev = cyc[c.id];
    if (!prev || (c.lockedAt || 0) > (prev.lockedAt || 0)) cyc[c.id] = c;
  });
  out.cycles = Object.values(cyc);

  // the merged union must WIN going forward: stamp it strictly newer than both
  // inputs (guards against device clock skew making a reconcile loop forever).
  out.updatedAt = new Date(Math.max(Date.now(), ta, tb) + 1).toISOString();
  return out;
}

window.Account = Account;
window.mergeState = mergeState;

/* ===== Social accountability (Step 2 — pods · board · partner · snapshot) =====
   Account-gated: every method is a no-op (returns null) when signed out, so the
   local-first solo app is completely unaffected. Reuses the server-verified session
   cookie + Account.csrf on writes (the same hardened auth core). Publishes only a
   TINY aggregate summary (adherence %, on-track/behind subjects, cycle label) — never
   raw state — and only when the user has actually opted into a pod or partner. */
const Social = {
  pods: [],                 // pods the user belongs to (from pod_list)
  partners: null,           // {partners:[…], pendingInvite} (from partner_snapshot)
  _pubTimer: null,
  _lastPublished: null,     // de-dupe identical publishes

  api(action) { return `${APP_CONFIG.apiBase}?action=${action}`; },
  get on() { return !!(window.Account && Account.user); },
  // any audience to publish to? (avoids pointless writes for a solo signed-in user)
  get hasAudience() { return (this.pods && this.pods.length > 0) || !!(this.partners && this.partners.partners && this.partners.partners.length); },

  async _get(action, qs) {
    if (!this.on) return null;
    try {
      const r = await fetch(this.api(action) + (qs ? "&" + qs : ""), { credentials: "include" });
      if (!r.ok) return { _error: r.status };
      return await r.json();
    } catch (e) { return { _error: 0 }; }
  },
  async _post(action, body) {
    if (!this.on || !Account.csrf) return null;
    try {
      const r = await fetch(this.api(action), {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": Account.csrf },
        body: JSON.stringify(body || {}),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return { _error: r.status, error: j.error };
      return j;
    } catch (e) { return { _error: 0 }; }
  },

  // ---- pulls (refresh local view of the user's pods + partners) ----
  async refresh() {
    if (!this.on) { this.pods = []; this.partners = null; this._emit(); return; }
    const [pl, ps] = await Promise.all([this._get("pod_list"), this._get("partner_snapshot")]);
    if (pl && !pl._error) this.pods = pl.pods || [];
    if (ps && !ps._error) this.partners = ps;
    this._emit();
    // freshen our own published summary now that we know the audience
    if (this.hasAudience) this.publishNow();
  },
  async board(podId) { return this._get("pod_board", "pod_id=" + encodeURIComponent(podId)); },

  // ---- writes ----
  async createPod(name) { const r = await this._post("pod_create", { name }); if (r && !r._error) await this.refresh(); return r; },
  async joinPod(code)  { const r = await this._post("pod_join", { invite_code: code }); if (r && !r._error) await this.refresh(); return r; },
  async leavePod(podId){ const r = await this._post("pod_leave", { pod_id: podId }); if (r && !r._error) await this.refresh(); return r; },
  async partnerInvite(){ const r = await this._post("partner_invite", {}); if (r && !r._error) await this.refresh(); return r; },
  async partnerAccept(code){ const r = await this._post("partner_accept", { invite_code: code }); if (r && !r._error) await this.refresh(); return r; },

  // ---- publish my own summary (opt-in, debounced) ----
  // computeSummary is provided by the planner surface (it owns the adherence engine).
  computeSummary: null,
  publishNow() {
    if (!this.on || !this.hasAudience || typeof this.computeSummary !== "function") return;
    const summary = this.computeSummary();
    if (!summary) return;
    const sig = JSON.stringify(summary);
    if (sig === this._lastPublished) return;     // nothing changed
    this._lastPublished = sig;
    this._post("publish_summary", { summary });
  },
  onLocalSave() {                                // called from Store.save (debounced)
    if (!this.on || !this.hasAudience) return;
    clearTimeout(this._pubTimer);
    this._pubTimer = setTimeout(() => this.publishNow(), 1500);
  },

  _emit() { document.dispatchEvent(new CustomEvent("social-changed", { detail: { pods: this.pods, partners: this.partners } })); },
};

window.Social = Social;
