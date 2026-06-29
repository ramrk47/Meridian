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
