/* ============================================================
   CUA-Lite — an open platform for computer-use agents.
   The same agent operates three platforms, each its own device:
   desktop (a pixel CRT running LibreOffice Calc), browser (web pages in a browser),
   mobile (a phone). The lead words desktop/browser/mobile are the control;
   on load it tours all three once, then rests home and lets you drive.
   Shared engine: think → move → act, GPU-composited cursor.
   Reduced motion: the desktop finished frame, held still.
   ============================================================ */

/* ---------- HF datasets: ONE live source of truth for every surface ----------
   The Hub collections (cua-lite/rollouts, cua-lite/corpora) are the authority for
   which datasets exist. A hardcoded snapshot renders instantly (and covers offline),
   then a single fetch replaces it live. Every surface that lists datasets — the Data
   browser, the SFT picker, the hero-stat popover — subscribes to this ONE source, so
   none can drift from the Hub or from each other. Lives at file scope so all three
   IIFEs below close over it. */
let DATASET_GROUPS = {   // mirrors the public HF collections so offline == the first live paint (no flip)
  Rollouts: ["Lite.OSWorld", "WebGym", "CUAGym_V0", "CUAGym_V1", "CUAGym_V2"],
  Corpora: ["Aguvis", "CAGUI", "GUI-360", "GUIAct", "GUIOdyssey",
            "Multimodal-Mind2Web", "OpenCUA", "ScaleCUA", "UI-Genie-Agent"],
};
const _dsSubs = [];
const onDatasetGroups = (fn) => { _dsSubs.push(fn); fn(DATASET_GROUPS); };   // call now + on every live update

/* The selected benchmark env is ONE state with three views: the eval builder's
   --env-id, the highlighted coverage card, and the leaderboard. All three steer it,
   in both directions; these file-scope hooks let the IIFEs reach each other. */
let lbFollowEnv = null;      // leaderboard registers; builder + cards call it
let builderSetEnv = null;    // eval builder registers; card clicks call it (no-op for envs the agent can't run)
let builderPickPlat = null;  // eval builder registers; platform tabs call it (first runnable env of that platform)
/* Same principle inside the Train section: SFT's "model" and RL's MODEL_ID are the one
   choice ("which open model am I training") behind two tabs — keep them in lockstep. */
let rlSetAgent = null;       // RL builder registers; the SFT model picker calls it
let sftSetModel = null;      // SFT configurator registers; the RL agent picker calls it
(async () => {
  try {
    const parse = async (slug) => {
      const r = await fetch("https://huggingface.co/api/collections/cua-lite/" + slug);
      if (!r.ok) throw new Error(slug);
      return (await r.json()).items.filter((i) => i.type === "dataset").map((i) => i.id.split("/").pop());
    };
    const [rol, cor] = await Promise.all([parse("rollouts"), parse("corpora")]);
    if (rol.length && cor.length) { DATASET_GROUPS = { Rollouts: rol, Corpora: cor }; _dsSubs.forEach((fn) => fn(DATASET_GROUPS)); }
  } catch (e) { /* offline / API change → subscribers keep the snapshot */ }
})();

// Shared by both IIFEs below (the hero's motion choices and the dropdown clamp), so neither
// half owns them and the #stage gate cannot hide one from the other.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
// keep an opened dropdown menu inside the viewport — on a narrow phone a menu
// anchored (left:0) to a right-side token would otherwise spill off the right edge.
// A no-op on desktop, where there's always room.
function clampMenu(slot) {
  const menu = slot.querySelector(".cb-menu"); if (!menu) return;
  menu.style.left = "";                                   // reset to the CSS default (left:0)
  const r = menu.getBoundingClientRect(), margin = 10;
  const over = r.right - (document.documentElement.clientWidth - margin);
  if (over > 0) menu.style.left = -Math.min(over, r.left - margin) + "px";
}

(function () {
  "use strict";
  const stage = document.getElementById("stage");
  if (!stage) return;

  const capRun = document.getElementById("cap-run");
  const rlLog = document.getElementById("rl-log");
  const plats = [...document.querySelectorAll(".plat")];   // the lead words = the control

  let timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clearAll = () => { timers.forEach(clearTimeout); timers = []; };

  // the rollout streams line by line, like a live log
  const logClear = () => { rlLog.innerHTML = ""; };
  function logLine(text, cls, lat) {
    const prev = rlLog.querySelector(".rl-line.live");
    if (prev) prev.classList.remove("live");
    const el = document.createElement("div");
    el.className = "rl-line " + (cls || "live");
    const mark = /done/.test(cls || "") ? "✓" : /think/.test(cls || "") ? "⋯" : "›";
    const caret = (cls || "").includes("live") ? '<span class="caret"></span>' : "";
    const time = lat ? `<span class="rl-lat">${lat}</span>` : "";
    el.innerHTML = `<span class="rl-mark">${mark}</span><span class="rl-text">${text}${caret}</span>${time}`;
    rlLog.appendChild(el);
    return el;
  }

  /* ---------- shared engine (operates on a per-device ctx) ---------- */
  function ctxFor(deviceEl) {
    const screen = deviceEl.querySelector(".screen, .bw-view, .ph-screen");
    return { el: deviceEl, screen, cursor: screen.querySelector(".mouse-cur"), spark: screen.querySelector(".spark"), cx: 0, cy: 0 };
  }
  function place(ctx, x, y) { ctx.cx = x; ctx.cy = y; ctx.cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`; }
  function centerOf(ctx, t) {
    const el = ctx.screen.querySelector(`[data-t="${t}"]`); if (!el) return null;
    const sr = ctx.screen.getBoundingClientRect(), r = el.getBoundingClientRect();
    // getBoundingClientRect is post-CSS-zoom, but translate3d()/left (used by
    // place() + the click spark) are layout px that zoom then re-scales — so divide
    // the zoom back out here, or the pointer lands zoom× too far in the zoomed GIF.
    const z = ctx.screen.offsetWidth ? sr.width / ctx.screen.offsetWidth : 1;
    return { x: (r.left - sr.left + r.width / 2) / z, y: (r.top - sr.top + r.height / 2) / z, el };
  }
  function moveTo(ctx, t) {
    const c = centerOf(ctx, t); if (!c) return;
    const d = Math.hypot(c.x - ctx.cx, c.y - ctx.cy);
    const dur = Math.min(0.36, Math.max(0.22, d / 700));
    ctx.cursor.style.transitionDuration = dur + "s";
    place(ctx, c.x, c.y);
  }
  function click(ctx, t) {
    const c = centerOf(ctx, t); if (!c) return;
    ctx.spark.style.left = c.x + "px"; ctx.spark.style.top = c.y + "px";
    ctx.spark.classList.remove("go"); void ctx.spark.offsetWidth; ctx.spark.classList.add("go");
    c.el.classList.add("press"); at(150, () => c.el.classList.remove("press"));
  }
  // The logged click([x,y]) is DERIVED from where the cursor actually lands (a fraction
  // of the screen), normalized to a 0-1000 grid — the LiteDesktop/LiteMobile action-space
  // convention (resolution-independent) — so the coordinate always matches the pointer
  // instead of being a hand-picked (and drifting) guess.
  function coordCap(m, ctx, t) {
    const c = centerOf(ctx, t); if (!c) return "";   // c is layout px (zoom already divided out)
    const x = Math.round((c.x / ctx.screen.offsetWidth) * 1000), y = Math.round((c.y / ctx.screen.offsetHeight) * 1000);
    return (m === "mobile" ? "tap" : "click") + "([" + x + ", " + y + "])";
  }
  function typeInto(el, baseCls, text) {
    const base = baseCls ? baseCls + " " : "";
    el.className = base + "typed caret"; let i = 0;
    (function tick() {
      el.textContent = text.slice(0, i);
      if (i++ <= text.length) at(21 + Math.random() * 15, tick);
      else { el.className = base + "typed"; }
    })();
  }

  /* ---------- element refs ---------- */
  const $ = (s) => document.querySelector(s);
  // desktop
  const fbar = $("#fbar"), total = $("#total");
  const cells = ["b2", "b3", "b4", "b5"].map((id) => document.getElementById(id));
  const numOf = (el) => parseInt((el.textContent || "").replace(/[^0-9]/g, ""), 10) || 0;
  const fmt = (n) => n.toLocaleString("en-US");
  const sum = () => cells.reduce((a, e) => a + numOf(e), 0);
  const avg = () => sum() / cells.length;
  // browser
  const wq = $("#wq"), wfield = $(".dev-browser [data-t='search']");
  const ggHome = $("#gg-home"), ggResults = $("#gg-results"), ggSite = $("#gg-site"), bwHost = $("#bw-host");
  // mobile
  const mname = $("#mname"), minput = $(".dev-mobile [data-t='name']"), msave = $(".dev-mobile [data-t='save']");
  const msent = $("#msent");

  /* ---------- the three platforms ---------- */
  const MODES = {
    desktop: {
      // a spreadsheet of CUA-Lite benchmark scores; the agent averages them
      env: "osworld",
      instr: "average the scores",
      device: $(".dev-desktop"),
      reset() {
        fbar.innerHTML = '<span class="mk-ph"></span>'; fbar.className = "sh-formula";
        total.textContent = ""; total.classList.remove("filled", "sel");
      },
      steps: [
        { t: "cell", onAct: () => total.classList.add("sel") },
        { t: "fbar", onAct: () => {} },
        { t: "fbar", noClick: true, cap: 'type("=AVERAGE(B2:B5)")', typeLen: 15, onAct: () => typeInto(fbar, "sh-formula", "=AVERAGE(B2:B5)") },
        { t: "fbar", noClick: true, cap: 'key(["enter"])', onAct: () => at(120, () => { total.textContent = avg().toFixed(1); total.classList.add("filled"); }) },
        { done: true, cap: 'terminate("success")' },
      ],
      finished() { fbar.className = "sh-formula typed"; fbar.textContent = "=AVERAGE(B2:B5)"; total.textContent = avg().toFixed(1); total.classList.add("filled", "sel"); },
    },
    browser: {
      // Google → search "cua-lite" → open this very homepage
      env: "webvoyager",
      instr: "look up cua-lite",
      device: $(".dev-browser"),
      reset() {
        wq.textContent = "Search Google or type a URL"; wq.className = "mk-ph";
        wfield.classList.remove("hot");
        ggHome.classList.add("show"); ggResults.classList.remove("show"); ggSite.classList.remove("show");
        bwHost.textContent = "google.com";
      },
      steps: [
        { t: "search", onAct: () => wfield.classList.add("hot") },
        { t: "search", cap: 'type("cua-lite")', typeLen: 8, onAct: () => typeInto(wq, "", "cua-lite") },
        { t: "go", onAct: () => { ggHome.classList.remove("show"); ggResults.classList.add("show"); bwHost.textContent = "google.com/search?q=cua-lite"; } },
        { t: "open", onAct: () => { ggResults.classList.remove("show"); ggSite.classList.add("show"); bwHost.textContent = "cua-lite.github.io"; } },
        { done: true, cap: 'terminate("success")' },
      ],
      finished() { wq.textContent = "cua-lite"; wq.className = "typed"; ggHome.classList.remove("show"); ggResults.classList.remove("show"); ggSite.classList.add("show"); bwHost.textContent = "cua-lite.github.io"; },
    },
    mobile: {
      // texting ZHZisZZ about why CUA-Lite is good
      env: "androidworld",
      instr: "text about cua-lite",
      device: $(".dev-mobile"),
      reset() {
        mname.textContent = "iMessage"; mname.className = "mk-ph"; minput.classList.remove("hot");
        msent.classList.remove("show"); msave.classList.remove("sent");
      },
      steps: [
        { t: "name", onAct: () => minput.classList.add("hot") },
        { t: "name", cap: 'type("yep — desktop, browser & mobile")', typeLen: 30, onAct: () => typeInto(mname, "", "yep — desktop, browser & mobile 🚀") },
        { t: "save", onAct: () => at(120, () => { msent.classList.add("show"); msave.classList.add("sent"); mname.textContent = "iMessage"; mname.className = "mk-ph"; minput.classList.remove("hot"); }) },
        { done: true, cap: 'terminate("success")' },
      ],
      finished() { msent.classList.add("show"); msave.classList.add("sent"); mname.textContent = "iMessage"; mname.className = "mk-ph"; },
    },
  };
  const ORDER = ["desktop", "browser", "mobile"];

  /* ---------- run one platform's task ---------- */
  const ts = (ms) => (ms / 1000).toFixed(1) + "s";
  function runSeq(ctx, steps, onFinish) {
    clearAll(); logClear();
    let t = 240;
    { const tt = t; at(tt, () => logLine("thinking", "think live", ts(tt))); }   // plan once, then act — briskly
    t += 520;
    steps.forEach((s) => {
      const tt = t;
      if (s.done) { at(tt, () => logLine(typeof s.cap === "function" ? s.cap() : s.cap, "done", ts(tt))); t += 480; return; }
      const isClick = s.t && !s.cap;   // a click/tap step has no caption (type/key steps carry their own); log its live coordinate
      // The cursor sets off now; the trace line + the act (spark/typing) land together
      // 380ms later — so the log is time-aligned with the visible action, not ahead of it.
      at(tt, () => { moveTo(ctx, s.t); const p = rlLog.querySelector(".rl-line.live"); if (p) p.classList.remove("live"); });
      at(tt + 380, () => { if (!s.noClick) click(ctx, s.t); logLine(isClick ? coordCap(mode, ctx, s.t) : s.cap, "live", ts(tt + 380)); s.onAct && s.onAct(); });
      t += 380 + (s.typeLen ? s.typeLen * 30 + 170 : 150) + 170;
    });
    at(t, onFinish);
  }

  /* ---------- mode manager: continuous auto-cycle, steered by the lead words ---------- */
  let mode = "desktop";
  let ctx = ctxFor(MODES.desktop.device);
  let running = false, paused = false, started = false, visible = false;

  function syncPlats() { plats.forEach((p) => p.classList.toggle("on", p.dataset.mode === mode)); }
  function parkCursor() {
    const s = ctx.screen;
    ctx.cursor.style.transition = "none";
    place(ctx, s.clientWidth * 0.7, s.clientHeight * 0.8);
    requestAnimationFrame(() => { ctx.cursor.style.transition = ""; });
  }
  function activate(m, skipReset) {
    const prev = mode;
    mode = m; ctx = ctxFor(MODES[m].device);
    document.querySelectorAll(".stage .device").forEach((d) => {
      const on = d.dataset.mode === m;
      d.classList.toggle("active", on);
      d.classList.toggle("exit", !on && d.dataset.mode === prev && prev !== m);   // outgoing slides out
    });
    syncPlats();
    capRun.innerHTML = `<span class="c-p">$</span> rollout.py <span class="c-flag">--platform</span> <span class="c-env">${m}</span> <span class="c-flag">--instruction</span> <span class="c-val">"${MODES[m].instr}"</span>`;
    if (!skipReset) { MODES[m].reset(); logClear(); }
  }
  // the desktop task, shown already-complete (no re-run): the rest/home state
  function showDesktopDone() {
    MODES.desktop.finished();
    logClear();
    logLine("thinking", "think", "0.2s");
    [[coordCap("desktop", ctx, "cell"), "0.6s"], ['type("=AVERAGE(B2:B5)")', "1.1s"], ['key(["enter"])', "1.6s"]].forEach(([l, tt]) => logLine(l, "past", tt));
    logLine('terminate("success")', "done", "2.0s");
    requestAnimationFrame(() => { ctx.cursor.style.transition = "none"; const c = centerOf(ctx, "fbar"); if (c) place(ctx, c.x, c.y); });
  }
  // the intro tours all three machines ONCE (desktop → browser → mobile), then
  // settles home on the finished desktop and invites you to drive. Calm and
  // confident, not a restless loop — the lead words steer it any time.
  let advances = 0, settled = false;
  function advance() { advances++; const i = ORDER.indexOf(mode); switchTo(ORDER[(i + 1) % ORDER.length]); }
  const held = () => paused || !visible;   // don't advance while hovered or off-screen
  function holdThenAdvance() { at(held() ? 500 : 700, () => { if (held()) holdThenAdvance(); else advance(); }); }
  // land back home without re-running the task — just show it complete + invite
  function settleHome() {
    clearAll(); running = false; settled = true; stage.classList.remove("snappy");
    activate("desktop", true);
    at(360, showDesktopDone);
  }

  function runActive() {
    running = true;
    MODES[mode].reset();
    runSeq(ctx, MODES[mode].steps, () => {
      running = false;
      if (!settled) {
        if (advances < ORDER.length - 1) holdThenAdvance();   // more machines to visit
        else at(1700, settleHome);                            // shown all three → dwell on the finished mobile, then settle home
      }
    });
  }
  // immediate = a user drove this (hover/click a lead word) → respond crisply.
  // the auto-tour leaves it off so its handoff stays calm and unhurried.
  function switchTo(m, immediate) {
    clearAll(); running = false;
    stage.classList.toggle("snappy", !!immediate);
    activate(m); parkCursor();
    at(immediate ? 210 : 420, runActive);
  }
  // you changed a score → the agent re-runs on YOUR numbers. A short focused
  // response (~1s), not the whole select/type/enter ceremony — crisp feedback.
  function recompute() {
    clearAll(); running = true;
    logClear();
    fbar.className = "sh-formula typed"; fbar.textContent = "=AVERAGE(B2:B5)";
    total.textContent = ""; total.classList.remove("filled"); total.classList.add("sel");
    at(60, () => logLine('key(["enter"])', "live", "0.1s"));
    at(520, () => { total.textContent = avg().toFixed(1); total.classList.add("filled"); });
    at(820, () => logLine('terminate("success")', "done", "0.6s"));
    at(1000, () => { running = false; });
  }

  /* ---------- editable desktop cells: edit the numbers, the agent sums YOURS ---------- */
  const editing = () => document.activeElement && document.activeElement.classList && document.activeElement.classList.contains("editable");
  let sheetDirty = false;   // did you actually change a score? only then does the agent re-run
  cells.forEach((el) => {
    el.addEventListener("focus", () => { paused = true; });   // engaged → pause the auto-tour
    el.addEventListener("input", () => { sheetDirty = true; if (mode === "desktop" && !running) { total.textContent = ""; total.classList.remove("filled", "sel"); fbar.innerHTML = '<span class="mk-ph"></span>'; fbar.className = "sh-formula"; } });
    // click away after editing → the agent re-runs on YOUR number (no hidden keypress needed)
    el.addEventListener("blur", () => {
      el.textContent = fmt(numOf(el));
      at(430, () => { if (!editing()) { paused = false; if (sheetDirty) { sheetDirty = false; recompute(); } } });
    });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); el.blur(); } });
  });

  /* ---------- the lead words steer the demo ---------- */
  plats.forEach((p) => {
    const m = p.dataset.mode;
    p.addEventListener("pointerenter", () => { paused = true; if (started && m !== mode) switchTo(m, true); });
    p.addEventListener("pointerleave", () => { paused = false; });
    p.addEventListener("click", () => { paused = false; if (m !== mode) switchTo(m, true); });
    p.setAttribute("tabindex", "0");
    p.addEventListener("focus", () => { if (started && m !== mode) switchTo(m, true); });
  });

  if (reduce) {
    ORDER.forEach((m) => MODES[m].reset());
    activate("desktop", true); showDesktopDone();   // static finished frame + invite
  } else {
    activate("desktop"); parkCursor();
    if ("IntersectionObserver" in window) {
      // persistent: start on first view, and pause the cycle whenever off-screen
      const io = new IntersectionObserver((es) => { es.forEach((e) => {
        visible = e.isIntersecting;
        // first view: let the orchestrated entrance land, THEN the agent boots
        // up and types its first command — a deliberate beat, not a race.
        if (visible && !started) { started = true; at(900, runActive); }
      }); }, { threshold: 0.25 });
      io.observe(stage);
    } else { visible = true; started = true; runActive(); }
  }

  // hover the device to hold the current platform (read it, edit it); leaving resumes the cycle
  if (!reduce) {
    stage.addEventListener("pointerenter", () => { if (started) paused = true; });
    stage.addEventListener("pointerleave", () => { if (!editing()) paused = false; });
  }

})();

/* ================= the page's live components =================================================
   Everything below drives blocks that are NOT the homepage hero: the dataset browser, the three
   command builders, the SFT configurator, the train tabs, the reveal observer and the clocks.
   It used to sit inside the hero's IIFE, behind `if (!stage) return;`, which meant any page
   without the hero — the blog posts, the RDI guest post — got the MARKUP for those components
   and none of the script: dropdowns that never built, `.cb-slot`s that stayed empty, so the
   terminals rendered `--model-id  --env-id` with the values simply missing. Each block here
   guards its own elements (`if (hfFrame)`, empty NodeList `.forEach`, `if (clocks.length)`),
   so on a page that has none of them this whole IIFE is a no-op — which is why the hero's gate
   was never doing any work for it. `reduce` and `clampMenu` were the only two names shared
   across the cut; both now live at file scope, above.
   ============================================================================================ */
(function () {
  "use strict";
  /* ---------- the live HF dataset browser: one quiet dropdown swaps the viewer ---------- */
  const hfFrame = document.getElementById("hf-frame");
  if (hfFrame) {
    let GROUPS;   // filled from the shared source below (snapshot now, live on fetch)
    const sel = document.getElementById("hf-select");
    const trigger = document.getElementById("hf-trigger");
    const menu = document.getElementById("hf-menu");
    const nameEl = document.getElementById("hf-tg-name");
    const openEl = document.getElementById("hf-open");
    let ds = "WebGym", started = false, loadTok = 0;

    function load(name) {
      ds = name;
      const tok = ++loadTok;
      const id = "cua-lite/" + name;
      openEl.href = "https://huggingface.co/datasets/" + id;
      hfFrame.classList.remove("loaded");
      const old = hfFrame.querySelector("iframe");
      if (old) old.remove();
      const f = document.createElement("iframe");
      f.title = name + " dataset viewer on Hugging Face";
      f.loading = "lazy";
      f.src = "https://huggingface.co/datasets/" + id + "/embed/viewer/default/train";
      // the iframe 'load' fires when the HF shell loads; the data streams in a
      // beat later, so hold the dark skeleton a moment more before crossfading.
      f.addEventListener("load", () => setTimeout(() => { if (tok === loadTok) hfFrame.classList.add("loaded"); }, 2200));
      hfFrame.appendChild(f);
    }
    function pick(name) {
      nameEl.textContent = name;
      menu.querySelectorAll(".hf-opt").forEach((o) => o.classList.toggle("active", o.dataset.ds === name));
      if (started) load(name); else ds = name;
    }
    function buildMenu() {
      menu.innerHTML = "";
      for (const g of ["Rollouts", "Corpora"]) {
        const h = document.createElement("div"); h.className = "hf-grp"; h.textContent = g; menu.appendChild(h);
        GROUPS[g].forEach((name) => {
          const o = document.createElement("button");
          o.className = "hf-opt" + (name === ds ? " active" : "");
          o.dataset.ds = name; o.textContent = name; o.setAttribute("role", "option");
          o.addEventListener("click", () => { pick(name); close(); });
          menu.appendChild(o);
        });
      }
    }
    const open = () => { sel.classList.add("open"); trigger.setAttribute("aria-expanded", "true"); };
    const close = () => { sel.classList.remove("open"); trigger.setAttribute("aria-expanded", "false"); };
    trigger.addEventListener("click", (e) => { e.stopPropagation(); sel.classList.contains("open") ? close() : open(); });
    document.addEventListener("click", (e) => { if (!sel.contains(e.target)) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
    // subscribe to the shared source: render now with the snapshot, rebuild live on fetch
    onDatasetGroups((g) => {
      GROUPS = g;
      if (!g.Rollouts.includes(ds) && !g.Corpora.includes(ds)) { ds = g.Rollouts[0]; nameEl.textContent = ds; if (started) load(ds); }
      buildMenu();
    });

    const start = () => { if (!started) { started = true; load(ds); } };
    if ("IntersectionObserver" in window) {
      const hio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { hio.disconnect(); start(); } }), { rootMargin: "500px" });
      hio.observe(hfFrame);
    } else { start(); }
  }

  /* ---------- command builders: the REAL rollout / run_grpo commands ----------
     Any agent × any env — the full matrix, not a curated subset. Model-ids and
     config families are all real (scripts/configs); picking an agent updates its
     --model-id AND the derived --config-path family. Eval envs = the benchmarks
     (docs/eval.md); RL envs = the training gyms. Verified vs README + docs. */
  // Mirrors lite/agents/factory.py — API families (gpt, claude) eval-only; the rest are open-weight (trainable).
  const AGENTS = [
    { model: "gpt-5.5", family: "gpt", api: true },
    { model: "gpt-5.4", family: "gpt", api: true },
    { model: "claude-opus-4-7", family: "claude", api: true },
    { model: "claude-opus-4-6", family: "claude", api: true },
    { model: "claude-sonnet-4-6", family: "claude", api: true },
    { model: "Qwen/Qwen3-VL-8B-Instruct", family: "qwen3_vl" },
    { model: "Qwen/Qwen3-VL-32B-Instruct", family: "qwen3_vl" },
    { model: "Qwen/Qwen3-VL-4B-Instruct", family: "qwen3_vl" },
    { model: "Qwen/Qwen3-VL-2B-Instruct", family: "qwen3_vl" },
    { model: "Qwen/Qwen3.5-4B", family: "qwen3_5" },
    { model: "Qwen/Qwen3.5-9B", family: "qwen3_5" },
    { model: "Qwen/Qwen3.5-27B", family: "qwen3_5" },
    { model: "Qwen/Qwen3.5-2B", family: "qwen3_5" },
    { model: "Qwen/Qwen2.5-VL-7B-Instruct", family: "qwen2_5_vl" },
    { model: "Qwen/Qwen2.5-VL-3B-Instruct", family: "qwen2_5_vl" },
    { model: "microsoft/Fara-7B", family: "fara" },
    { model: "ByteDance-Seed/UI-TARS-1.5-7B", family: "ui_tars_15_v1" },
    { model: "ByteDance-Seed/UI-TARS-7B-DPO", family: "ui_tars" },
    { model: "OpenGVLab/ScaleCUA-7B", family: "scalecua" },
    { model: "xlangai/OpenCUA-7B", family: "opencua" },
    { model: "meituan/EvoCUA-8B-20260105", family: "evocua" },
    { model: "Tongyi-MAI/MAI-UI-8B", family: "mai_ui" },
    { model: "Tongyi-MAI/MAI-UI-2B", family: "mai_ui" },
    { model: "MarsXL/UI-Voyager", family: "ui_voyager" },
    { model: "stepfun-ai/GELab-Zero-4B-preview", family: "step_gui" },
  ];
  // which platforms each family actually supports (from scripts/configs/<family>/default/*.yaml).
  // A mobile-only model can't be paired with a desktop env — the env menu filters to these.
  const ALL_PLATS = ["desktop", "browser", "mobile", "grounding"];
  const FAMILY_PLATS = {
    gpt: ALL_PLATS, claude: ALL_PLATS, qwen3_vl: ALL_PLATS, qwen3_5: ALL_PLATS,
    qwen2_5_vl: ["desktop", "grounding"],
    fara: ["browser", "grounding"],
    ui_tars: ["desktop", "mobile", "grounding"], ui_tars_15_v1: ["desktop", "mobile", "grounding"],
    scalecua: ["desktop", "grounding"], opencua: ["desktop", "grounding"], evocua: ["desktop", "grounding"],
    mai_ui: ["mobile", "grounding"],
    ui_voyager: ["mobile"], step_gui: ["mobile"],
  };
  // each env's platform (grounding benchmarks are cross-platform grounding tasks)
  const ENV_PLAT = {
    "osworld": "desktop", "lite.osworld": "desktop", "osworld_2": "desktop", "cua.bench": "desktop",
    "cuaworld": "desktop",
    "screenspot_pro": "grounding", "osworld_g": "grounding",
    "webgym": "browser", "webharbor.webvoyager": "browser", "online_mind2web": "browser",
    "browsergym.miniwob": "browser", "browsergym.webarena": "browser", "browsergym.visualwebarena": "browser",
    "androidworld": "mobile", "androidlab": "mobile", "mobileworld": "mobile", "mobilegym": "mobile",
  };
  const envsFor = (agent, envs) => envs.filter((e) => FAMILY_PLATS[agent.family].includes(ENV_PLAT[e]));
  // the full benchmark env matrix — shared by the eval builder and the quickstart
  // REPL so their env dropdowns stay identical (one source of truth).
  const ALL_ENVS = ["osworld", "lite.osworld", "osworld_2", "cua.bench", "screenspot_pro", "osworld_g",
                    "webgym", "webharbor.webvoyager", "online_mind2web", "browsergym.miniwob",
                    "browsergym.webarena", "browsergym.visualwebarena",
                    "androidworld", "androidlab", "mobileworld", "mobilegym"];
  const CB_OPTS = {
    eval: {
      agents: AGENTS,
      envs: ALL_ENVS,
      table: true,
    },
    rl: {
      // only open-weight agents can be fine-tuned / reinforced — API models (gpt, claude) can't
      agents: AGENTS.filter((a) => !a.api),
      envs: ["lite.osworld", "webgym", "androidworld", "mobilegym", "screenspot_pro"],   // the grpo.md-documented set
      table: false,
    },
    // the quickstart REPL: a taste of the API, not the whole matrix. Its env slot
    // carries a third `task` slot ("<env>@<task>") — representative real task-ids
    // per env (a trailing … signals "and many more"). No derived --flags, no table.
    quickstart: {
      agents: AGENTS,
      envs: ALL_ENVS,   // same full matrix as the benchmark eval builder
      table: false,
      // real task-ids per env, verbatim from gym.registry.task_ids (a trailing …
      // in the UI signals "and many more").
      tasks: {
        "osworld": ["bb5e4c0d-f964-439c-97b6-bdb9747de3f4", "7b6c7e24-c58a-49fc-a5bb-d57b80e5b4c3",
                    "06fe7178-4491-4589-810f-2e2bc9502122", "e1e75309-3ddb-4d09-92ec-de869c928143"],
        "lite.osworld": ["osworld_chrome_030eeff7", "osworld_chrome_06fe7178", "osworld_chrome_0d8b7de3",
                         "osworld_chrome_12086550", "osworld_chrome_121ba48f"],
        "osworld_2": ["001", "002", "003", "004", "005"],
        "cua.bench": ["click-button/0", "click-button/1", "click-button/2"],
        "screenspot_pro": ["android_studio_macos_0", "android_studio_macos_1", "android_studio_macos_2"],
        "osworld_g": ["0FOB4CLBT2-0", "0FOB4CLBT2-1", "1GTGZ3A3V8-0"],
        "webgym": ["300971", "300813", "300524", "300927", "300643"],
        "webharbor.webvoyager": ["allrecipes.0", "allrecipes.1", "allrecipes.10"],
        "online_mind2web": ["0059adc6b12a3822305deb68929b2de8", "005be9dd91c95669d6ddde9ae667125c",
                            "0170ca95038b05fa58d463fe627ac605"],
        "browsergym.miniwob": ["click-dialog", "click-button", "ascending-numbers", "book-flight"],
        "browsergym.webarena": ["0", "78", "201"],
        "browsergym.visualwebarena": ["0", "132", "298"],
        "androidworld": ["AudioRecorderRecordAudio", "BrowserDraw", "BrowserMaze", "ContactsAddContact"],
        "androidlab": ["bluecoins_1", "bluecoins_10", "bluecoins_11"],
        "mobileworld": ["AcceptMeetingTask", "AdjustBrightnessMaximumTask", "AdjustFontIconMaximumTask"],
        "mobilegym": ["account.Railway12306ChangePassword", "alipay.CalculateMonthlyExpenseTrend",
                      "bilibili.CoinVideoTask", "calendar.ChangeDefaultReminder", "clock.AddAlarmWithSettings"],
      },
    },
  };
  // real env-id -> the proper benchmark name in the coverage table (for the highlight)
  const ENV2ROW = {
    "osworld": "OSWorld", "lite.osworld": "Lite.OSWorld", "osworld_2": "OSWorld-2", "cua.bench": "CUABench",
    "screenspot_pro": "ScreenSpot-Pro", "osworld_g": "OSWorld-G", "webgym": "WebGym",
    "webharbor.webvoyager": "WebVoyager", "online_mind2web": "Online-Mind2Web", "browsergym.miniwob": "MiniWoB",
    "browsergym.webarena": "WebArena", "browsergym.visualwebarena": "VisualWebArena",
    "androidworld": "AndroidWorld", "androidlab": "AndroidLab", "mobileworld": "MobileWorld", "mobilegym": "MobileGym",
  };
  const benchRows = document.querySelectorAll("#benchmarks .row");
  const covTabs = document.querySelectorAll("#benchmarks .cov-tab");
  const covPanels = document.querySelectorAll("#benchmarks .cov-panel");
  const showPlat = (plat) => {
    covTabs.forEach((t) => t.classList.toggle("on", t.dataset.plat === plat));
    covPanels.forEach((p) => p.classList.toggle("on", p.dataset.plat === plat));
  };
  covTabs.forEach((t) => t.addEventListener("click", () => { showPlat(t.dataset.plat); if (builderPickPlat) builderPickPlat(t.dataset.plat); }));
  const capPlat = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
  const highlightBench = (env) => {
    const nm = ENV2ROW[env] || env;
    const plat = capPlat(ENV_PLAT[env]);
    if (plat) showPlat(plat);   // jump the coverage to the env's platform tab
    benchRows.forEach((r) => { const n = r.querySelector(".r-name"); r.classList.toggle("hl", !!n && n.textContent.trim() === nm); });
    if (lbFollowEnv) lbFollowEnv(env);   // the leaderboard shows the same env
  };

  document.querySelectorAll(".cmdbuild").forEach((cb) => {
    const cfg = CB_OPTS[cb.dataset.cmd];
    if (!cfg) return;
    const agentSlot = cb.querySelector('.cb-slot[data-slot="agent"]');
    const envSlot = cb.querySelector('.cb-slot[data-slot="env"]');
    if (!agentSlot || !envSlot) return;
    // the quickstart REPL adds a third `task` slot rendered inline as "<env>@<task>";
    // absent for the eval/sft/rl builders, whose behavior is unchanged.
    const taskSlot = cfg.tasks ? cb.querySelector('.cb-slot[data-slot="task"]') : null;
    const drvFamily = cb.querySelectorAll('.cb-drv[data-drv="family"]');
    const drvEnv = cb.querySelectorAll('.cb-drv[data-drv="env"]');
    const drvAgent = cb.querySelectorAll('.cb-drv[data-drv="agent"]');
    // the SFT builder derives the HF dataset name (env-id -> proper name) for the
    // download step + --data-paths; absent (null-safe) for the other builders.
    const drvDataset = cb.querySelectorAll('.cb-drv[data-drv="dataset"]');
    let agent = cfg.agents[0];
    const allowedEnvs = () => envsFor(agent, cfg.envs);
    let env = allowedEnvs()[0];
    let task = cfg.tasks ? cfg.tasks[env][0] : null;
    const resetTask = () => { if (cfg.tasks) task = cfg.tasks[env][0]; };
    const closeAll = (except) => cb.querySelectorAll(".cb-slot.open").forEach((s) => { if (s !== except) s.classList.remove("open"); });
    const swap = (slot) => { slot.classList.remove("swap"); void slot.offsetWidth; slot.classList.add("swap"); };
    const dimUnsupported = () => {
      const allowed = new Set(allowedEnvs());
      benchRows.forEach((r) => {
        const nm = r.querySelector(".r-name").textContent.trim();
        const envId = Object.keys(ENV2ROW).find((k) => ENV2ROW[k] === nm);
        r.classList.toggle("off", !allowed.has(envId));   // agent can't run this benchmark
      });
    };
    const sync = () => { drvFamily.forEach((e) => (e.textContent = agent.family)); drvEnv.forEach((e) => (e.textContent = env)); drvAgent.forEach((e) => (e.textContent = agent.model)); drvDataset.forEach((e) => (e.textContent = ENV2ROW[env] || env)); if (cfg.table) { highlightBench(env); dimUnsupported(); } };

    const PLAT_ORDER = { Grounding: 0, Desktop: 1, Browser: 2, Mobile: 3 };
    function makeSlot(slot, getList, getLabel, curLabel, onPick, groupBy) {
      const tok = document.createElement("button");
      tok.className = "cb-tok"; tok.type = "button"; tok.setAttribute("aria-haspopup", "listbox"); tok.setAttribute("aria-expanded", "false");
      tok.innerHTML = '<span class="cb-txt"></span><span class="cb-tcaret" aria-hidden="true"></span>';
      const menu = document.createElement("span");
      menu.className = "cb-menu" + (groupBy ? " cb-menu-grp" : ""); menu.setAttribute("role", "listbox");
      function render() {
        tok.querySelector(".cb-txt").textContent = curLabel();
        menu.innerHTML = "";
        let list = getList();
        if (groupBy) list = [...list].sort((a, b) => (PLAT_ORDER[groupBy(a)] ?? 9) - (PLAT_ORDER[groupBy(b)] ?? 9));
        let lastGrp = null;
        list.forEach((v) => {
          if (groupBy) { const g = groupBy(v); if (g !== lastGrp) { const hd = document.createElement("span"); hd.className = "cb-grp"; hd.textContent = g; menu.appendChild(hd); lastGrp = g; } }
          const label = getLabel(v);
          const o = document.createElement("button");
          o.className = "cb-opt" + (label === curLabel() ? " active" : ""); o.type = "button"; o.textContent = label; o.setAttribute("role", "option");
          o.addEventListener("click", (e) => { e.stopPropagation(); slot.classList.remove("open"); tok.setAttribute("aria-expanded", "false"); if (label !== curLabel()) onPick(v); });
          menu.appendChild(o);
        });
      }
      tok.addEventListener("click", (e) => { e.stopPropagation(); const willOpen = !slot.classList.contains("open"); closeAll(slot); slot.classList.toggle("open", willOpen); if (willOpen) clampMenu(slot); tok.setAttribute("aria-expanded", String(willOpen)); });
      slot.appendChild(tok); slot.appendChild(menu);
      slot._render = render; render();
    }

    // flash ONLY the derived fields the changed variable drives — changing the env must
    // not pulse the model-derived <family> in the config-path, and vice versa.
    const flashDrv = (names) => names.forEach((nm) => cb.querySelectorAll('.cb-drv[data-drv="' + nm + '"]').forEach((e) => { e.classList.remove("drv-flash"); void e.offsetWidth; e.classList.add("drv-flash"); }));
    makeSlot(agentSlot, () => cfg.agents, (a) => a.model, () => agent.model, (a) => {
      agent = a;
      // the new agent may not support the current env — fall back to its first supported one
      let envChanged = false;
      if (!allowedEnvs().includes(env)) { env = allowedEnvs()[0]; resetTask(); swap(envSlot); if (taskSlot) swap(taskSlot); envChanged = true; }
      swap(agentSlot); agentSlot._render(); envSlot._render(); if (taskSlot) taskSlot._render(); sync();
      flashDrv(envChanged ? ["family", "agent", "env"] : ["family", "agent"]);   // agent drives family + agent (+ env only if it had to fall back)
      if (cb.dataset.cmd === "rl" && sftSetModel) sftSetModel(a.model);   // the SFT panel trains the same model
    });
    makeSlot(envSlot, allowedEnvs, (e) => e, () => env, (e) => {
      // switching env resets the task to that env's first representative one
      env = e; resetTask(); swap(envSlot); envSlot._render(); if (taskSlot) { taskSlot._render(); swap(taskSlot); } sync();
      flashDrv(["env"]);   // env only drives the <env> field, not the model-derived <family>
    }, (e) => capPlat(ENV_PLAT[e]));   // env menu grouped by platform, like the data viewer's dropdown
    // the task slot lists the env's representative task-ids + a trailing … (a no-op sentinel); it drives no derived field
    if (taskSlot) makeSlot(taskSlot, () => [...cfg.tasks[env], "…"], (t) => t, () => task, (t) => {
      if (t === "…") return; task = t; swap(taskSlot); taskSlot._render(); sync();
    });
    // the eval builder is steerable from the coverage table too (cards + platform tabs),
    // so command ⇄ cards ⇄ leaderboard stay one state in both directions
    if (cfg.table) {
      builderSetEnv = (e) => {
        if (e === env || !allowedEnvs().includes(e)) return;   // grayed-out cards don't build impossible commands
        env = e; resetTask(); swap(envSlot); envSlot._render(); sync(); flashDrv(["env"]);
      };
      builderPickPlat = (plat) => {
        if (capPlat(ENV_PLAT[env]) === plat) return;
        const first = allowedEnvs().find((x) => capPlat(ENV_PLAT[x]) === plat);
        if (first) builderSetEnv(first);
      };
    }
    if (cb.dataset.cmd === "rl") {
      // steered by the SFT panel's model picker (one training choice behind two tabs)
      rlSetAgent = (modelId) => {
        const a = cfg.agents.find((x) => x.model === modelId);
        if (!a || a === agent) return;
        agent = a;
        let envChanged = false;
        if (!allowedEnvs().includes(env)) { env = allowedEnvs()[0]; resetTask(); swap(envSlot); envChanged = true; }
        swap(agentSlot); agentSlot._render(); envSlot._render(); sync();
        flashDrv(envChanged ? ["family", "agent", "env"] : ["family", "agent"]);
      };
    }
    sync();
    document.addEventListener("click", (e) => { if (!cb.contains(e.target)) closeAll(); });
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll(".cb-slot.open").forEach((s) => s.classList.remove("open")); });

  /* ---------- SFT configurator: dataset × model (orthogonal) → the 3-step run_sft ----------
     SFT is dataset + model driven, not env-driven (unlike RL's env+model). Two dropdowns —
     a HF corpus/rollout and an open-weight student — live-derive the whole command: the
     dataset drives hf.download + --data-paths + parquet slug; the model drives --model-id,
     the model-recipe --config (scripts/configs/<family>/recipes/sft/default.yaml — a RECIPE,
     not an env config) and step-3 MODEL_ID. They pair freely (no cross-filter). Dataset
     universe = the shared live HF source (same one the Data browser uses); models = the open-weight AGENTS. */
  (function sftConfigurator() {
    const panel = document.querySelector('[data-train-panel="sft"]');
    if (!panel) return;
    const MODELS = AGENTS.filter((a) => !a.api);   // only open-weight students can be fine-tuned
    let dataset = "ScaleCUA";
    let model = MODELS.find((m) => m.model === "Qwen/Qwen3-VL-8B-Instruct") || MODELS[0];

    const dsSlot = panel.querySelector('.cb-slot[data-sft="dataset"]');
    const mdSlot = panel.querySelector('.cb-slot[data-sft="model"]');
    const drv = (name) => panel.querySelectorAll('.cb-drv[data-drv="' + name + '"]');
    const closeAll = (except) => panel.querySelectorAll(".cb-slot.open").forEach((s) => { if (s !== except) s.classList.remove("open"); });
    const swap = (slot) => { slot.classList.remove("swap"); void slot.offsetWidth; slot.classList.add("swap"); };
    // dataset-slug = the dataset name lowercased (Lite.OSWorld -> lite.osworld, ScaleCUA -> scalecua)
    const sync = () => {
      drv("dataset").forEach((e) => (e.textContent = dataset));
      drv("model").forEach((e) => (e.textContent = model.model));
      drv("family").forEach((e) => (e.textContent = model.family));
      drv("slug").forEach((e) => (e.textContent = dataset.toLowerCase()));
    };

    // reuse the site's native dropdown markup (.cb-tok/.cb-menu/.cb-opt/.cb-grp). `groups`
    // is either a {group: [...]} object (grouped menu) or a flat array of agent objects.
    function build(slot, groups, curLabel, onPick) {
      const tok = document.createElement("button");
      tok.className = "cb-tok"; tok.type = "button"; tok.setAttribute("aria-haspopup", "listbox"); tok.setAttribute("aria-expanded", "false");
      tok.innerHTML = '<span class="cb-txt"></span><span class="cb-tcaret" aria-hidden="true"></span>';
      const menu = document.createElement("span");
      menu.className = "cb-menu" + (Array.isArray(groups) ? "" : " cb-menu-grp"); menu.setAttribute("role", "listbox");
      function render() {
        tok.querySelector(".cb-txt").textContent = curLabel();
        menu.innerHTML = "";
        const entries = Array.isArray(groups) ? [[null, groups]] : Object.entries(groups);
        entries.forEach(([grp, list]) => {
          if (grp) { const hd = document.createElement("span"); hd.className = "cb-grp"; hd.textContent = grp; menu.appendChild(hd); }
          list.forEach((v) => {
            const label = typeof v === "string" ? v : v.model;
            const o = document.createElement("button");
            o.className = "cb-opt" + (label === curLabel() ? " active" : ""); o.type = "button"; o.textContent = label; o.setAttribute("role", "option");
            o.addEventListener("click", (e) => { e.stopPropagation(); slot.classList.remove("open"); tok.setAttribute("aria-expanded", "false"); if (label !== curLabel()) onPick(v); });
            menu.appendChild(o);
          });
        });
      }
      tok.addEventListener("click", (e) => { e.stopPropagation(); const willOpen = !slot.classList.contains("open"); closeAll(slot); slot.classList.toggle("open", willOpen); if (willOpen) clampMenu(slot); tok.setAttribute("aria-expanded", String(willOpen)); });
      slot.appendChild(tok); slot.appendChild(menu);
      slot._render = render; render();
    }

    // flash only the fields the changed selector drives: dataset -> dataset/slug, model -> model/family
    const flashDrv = (names) => names.forEach((nm) => panel.querySelectorAll('.cb-drv[data-drv="' + nm + '"]').forEach((e) => { e.classList.remove("drv-flash"); void e.offsetWidth; e.classList.add("drv-flash"); }));
    // dataset dropdown subscribes to the shared source — rebuilt in place when the live list arrives
    onDatasetGroups((g) => {
      if (!g.Rollouts.includes(dataset) && !g.Corpora.includes(dataset)) dataset = g.Corpora[0] || g.Rollouts[0];
      dsSlot.innerHTML = "";
      build(dsSlot, g, () => dataset, (v) => { dataset = v; swap(dsSlot); dsSlot._render(); sync(); flashDrv(["dataset", "slug"]); });
      sync();
    });
    build(mdSlot, MODELS, () => model.model, (v) => { model = v; swap(mdSlot); mdSlot._render(); sync(); flashDrv(["model", "family"]); if (rlSetAgent) rlSetAgent(v.model); });
    // steered by the RL panel's MODEL_ID picker (one training choice behind two tabs)
    sftSetModel = (modelId) => {
      const m = MODELS.find((x) => x.model === modelId);
      if (!m || m === model) return;
      model = m; swap(mdSlot); mdSlot._render(); sync(); flashDrv(["model", "family"]);
    };
    sync();
    document.addEventListener("click", (e) => { if (!panel.contains(e.target)) closeAll(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
  })();

  /* ---------- Train: SFT | RL toggle ---------- */
  const trainTabs = document.querySelectorAll("#train .train-tab");
  const trainPanels = document.querySelectorAll("#train [data-train-panel]");
  trainTabs.forEach((t) => t.addEventListener("click", () => {
    const which = t.dataset.train;
    trainTabs.forEach((x) => { const on = x.dataset.train === which; x.classList.toggle("on", on); x.setAttribute("aria-selected", String(on)); });
    trainPanels.forEach((p) => p.classList.toggle("cb-hidden", p.dataset.trainPanel !== which));
  }));
  // the data section's "ready to SFT" link jumps to #train — force the SFT tab open
  // (not whatever was last selected) so it lands on the fine-tune flow.
  document.querySelectorAll("[data-goto-sft]").forEach((a) =>
    a.addEventListener("click", () => document.querySelector('#train .train-tab[data-train="sft"]')?.click()));

  /* ---------- scroll reveal ---------- */
  // give the centered sections' headers the same fade-up as their blocks, so each
  // section arrives composed (eyebrow -> headline -> lead) rather than popping in.
  // marked BEFORE js-reveal is set, so they start hidden with no flash.
  document.querySelectorAll(".section.centered").forEach((sec) => {
    const head = sec.querySelectorAll(".eyebrow, h2, .section-lead");
    head.forEach((el, i) => { el.classList.add("reveal"); el.style.setProperty("--rev-delay", (i * 0.09) + "s"); });
  });
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window && !reduce) {
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px 8% 0px", threshold: 0.01 });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- real-time clocks ---------- */
  const clocks = document.querySelectorAll("[data-clock]");
  if (clocks.length) {
    const tick = () => { const d = new Date(); const s = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); clocks.forEach((c) => c.textContent = s); };
    tick(); setInterval(tick, 20000);
  }

  /* ---------- copy the quickstart ---------- */
  const copyBtn = document.getElementById("term-copy");
  const codeEl = document.querySelector(".start-term .term-body");
  if (copyBtn && codeEl && navigator.clipboard) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(codeEl.innerText.trim()).then(() => {
        copyBtn.textContent = "copied ✓"; copyBtn.classList.add("done");
        setTimeout(() => { copyBtn.textContent = "copy"; copyBtn.classList.remove("done"); }, 1600);
      }).catch(() => {});
    });
  }
})();

/* ---------- hero stat popovers — rich, categorized, every item links out ---------- */
(function () {
  const RM = "https://github.com/cua-lite/cua-lite/blob/main/lite/gym/envs/";
  const DS = "https://huggingface.co/datasets/cua-lite/";
  const POP = {
    agents: { groups: [
      { label: "Proprietary", items: [
        ["GPT", "https://platform.openai.com/docs/guides/tools-computer-use"],
        ["Claude", "https://docs.anthropic.com/en/docs/agents-and-tools/computer-use"] ] },
      { label: "Open-weight", items: [
        ["Qwen3-VL", "https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct"],
        ["Qwen3.5", "https://huggingface.co/Qwen/Qwen3.5-4B"],
        ["Qwen2.5-VL", "https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct"],
        ["UI-TARS", "https://huggingface.co/ByteDance-Seed/UI-TARS-7B-DPO"],
        ["UI-TARS-1.5", "https://huggingface.co/ByteDance-Seed/UI-TARS-1.5-7B"],
        ["Fara", "https://huggingface.co/microsoft/Fara-7B"],
        ["OpenCUA", "https://huggingface.co/xlangai/OpenCUA-7B"],
        ["ScaleCUA", "https://huggingface.co/OpenGVLab/ScaleCUA-7B"],
        ["EvoCUA", "https://huggingface.co/meituan/EvoCUA-8B-20260105"],
        ["MAI-UI", "https://huggingface.co/Tongyi-MAI/MAI-UI-8B"],
        ["UI-Voyager", "https://huggingface.co/MarsXL/UI-Voyager"],
        ["GELab", "https://huggingface.co/stepfun-ai/GELab-Zero-4B-preview"] ] } ] },
    // hero benchmark links point to the OFFICIAL upstream repos (extracted from the env READMEs);
    // cua-lite-native ones (Lite.OSWorld, MobileGym) point to the cua-lite env README.
    benchmarks: { groups: [
      { label: "Grounding", items: [["OSWorld-G", "https://github.com/xlang-ai/OSWorld-G"], ["ScreenSpot-Pro", "https://github.com/likaixin2000/ScreenSpot-Pro-GUI-Grounding"]] },
      { label: "Desktop", items: [["OSWorld", "https://github.com/xlang-ai/OSWorld"], ["Lite.OSWorld", RM+"lite/osworld/README.md"], ["OSWorld-2", "https://github.com/xlang-ai/OSWorld"], ["CUABench", "https://github.com/trycua/cua"]] },
      { label: "Browser", items: [["WebGym", "https://github.com/microsoft/webgym"], ["WebVoyager", "https://github.com/MinorJerry/WebVoyager"], ["Online-Mind2Web", "https://github.com/OSU-NLP-Group/Online-Mind2Web"], ["MiniWoB", "https://github.com/Farama-Foundation/miniwob-plusplus"], ["WebArena", "https://github.com/web-arena-x/webarena"], ["VisualWebArena", "https://github.com/web-arena-x/visualwebarena"]] },
      { label: "Mobile", items: [["AndroidWorld", "https://github.com/google-research/android_world"], ["AndroidLab", "https://github.com/THUDM/Android-Lab"], ["MobileWorld", "https://github.com/Tongyi-MAI/MobileWorld"], ["MobileGym", "https://github.com/Purewhiter/mobilegym"]] } ] },
    // groups filled live from the shared HF source below (same one the Data/Train pickers use)
    datasets: { groups: [] },
  };
  const renderPop = (pop) => {
    const d = POP[pop.dataset.pop]; if (!d) return;
    let h = "";
    d.groups.forEach((g) => {
      h += '<span class="pop-grp">';
      if (g.label) h += `<span class="pop-cat">${g.label}</span>`;
      h += '<span class="pop-list">';
      g.items.forEach(([name, href]) => {
        const ext = !href.startsWith("#");
        const attr = ext ? ' target="_blank" rel="noopener"' : "";
        h += `<a class="pop-item" href="${href}"${attr}>${name}${ext ? '<span class="pop-x">↗</span>' : ""}</a>`;
      });
      h += "</span></span>";
    });
    pop.innerHTML = h;
  };
  document.querySelectorAll(".stat-pop[data-pop]").forEach(renderPop);
  // the datasets popover mirrors the same live HF source as the Data/Train pickers
  const dsPop = document.querySelector('.stat-pop[data-pop="datasets"]');
  if (dsPop) onDatasetGroups((g) => {
    POP.datasets.groups = [
      { label: "Rollouts", items: g.Rollouts.map((n) => [n, DS + n]) },
      { label: "Corpora", items: g.Corpora.map((n) => [n, DS + n]) },
    ];
    renderPop(dsPop);
  });
  // hover-persist: open on enter, stay while over the stat OR the panel, close on leave (delayed to bridge the gap)
  const heroHead = document.querySelector(".hero-head");
  document.querySelectorAll(".stat").forEach((stat) => {
    const pop = stat.querySelector(".stat-pop"); let t;
    const open = () => { clearTimeout(t); document.querySelectorAll(".stat.pop-open").forEach((s) => { if (s !== stat) s.classList.remove("pop-open"); }); stat.classList.add("pop-open"); if (heroHead) heroHead.classList.add("stats-pop"); };
    const close = () => { t = setTimeout(() => { stat.classList.remove("pop-open"); if (heroHead && !document.querySelector(".stat.pop-open")) heroHead.classList.remove("stats-pop"); }, 240); };
    stat.addEventListener("pointerenter", open);
    stat.addEventListener("pointerleave", close);
    if (pop) { pop.addEventListener("pointerenter", () => clearTimeout(t)); pop.addEventListener("pointerleave", close); }
  });
})();

/* ---------- benchmark leaderboard — scores served from this site's own assets ----------
   Each eval run's compact snapshot (written by devs/exps/eval/utils/update_run_json.py)
   is copied into assets/exps/eval/<env>/<commit-dir>/run_<n>[_cfg].json, and the
   hand-maintained assets/exps/eval/manifest.json maps each env (and secondary-tab
   config) to its run path — or "pending" for a coming-soon tab; see the "_comment"
   at the top of that file for the schema. The benchmark coverage cards above are the
   selector: clicking one switches the board — envs with no committed run get a ghost
   placeholder. The header README link follows the selected env (the cards' own hrefs,
   so the two can never drift). */
(function () {
  "use strict";
  const body = document.getElementById("lb-body");
  if (!body) return;
  const foot = document.getElementById("lb-foot");
  let lbDown = false;
  const lbOffline = () => { lbDown = true; };
  const envEl = document.getElementById("lb-env");
  const cfgsEl = document.getElementById("lb-cfgs");
  const openEl = document.getElementById("lb-open");
  const lbEl = document.getElementById("lb");
  const infoEl = document.getElementById("lb-info");     // the "composition" chip (box 1 trigger)
  const compEl = document.getElementById("lb-comp");     // box 1: benchmark composition panel
  const rowPopEl = document.getElementById("lb-rowpop"); // box 2: per-model detail panel
  let curRows = [];   // the rows most recently rendered — box 2 reads back by data-idx

  const ROOT = "https://cua-lite.github.io/assets/exps/eval/";
  // the coverage cards are the single source of envs: id, proper name, README href
  const cards = [...document.querySelectorAll("#benchmarks .cov-panel .row[data-env]")];
  const ENVS = {};
  cards.forEach((c) => { ENVS[c.dataset.env] = { name: c.querySelector(".r-name").textContent.trim(), readme: c.href }; });

  let manifest = null;   // env-id -> { config -> "<commit-dir>/run_<n>[_<config>].json" }
  let manifestP = null;  // its in-flight fetch (fetched once)
  const runs = {};       // "env/config" -> fetched run payload
  let cur = "osworld", cfg = "default";   // env matches the eval builder's default, so the two never disagree on first paint
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // each model name links to the YAML it was rolled out with, in the main repo:
  // scripts/configs/<family>/default/<env>.yaml — or, for envs whose configs are a
  // directory of variants, .../<env>/<config>.yaml (the board's active config)
  const CFG_REPO = "https://github.com/cua-lite/cua-lite/blob/main/scripts/configs/";
  const CFG_DIR_ENVS = new Set(["browsergym.miniwob", "browsergym.visualwebarena", "browsergym.webarena",
                                "cua.bench", "webgym", "webharbor.webvoyager"]);
  // model-id -> config family, mirroring lite/agents/factory.py (first match wins,
  // so the more specific patterns sit above the generic ones)
  const FAMILY_RULES = [
    [/^gpt/i, "gpt"], [/^claude/i, "claude"],
    [/Qwen3\.5/, "qwen3_5"], [/Qwen3-VL/, "qwen3_vl"], [/Qwen2\.5-VL/, "qwen2_5_vl"],
    [/UI-TARS-1\.5/, "ui_tars_15_v1"], [/UI-TARS-2/, "ui_tars_15_v2"], [/UI-TARS/, "ui_tars"],
    [/Fara/i, "fara"], [/OpenCUA/i, "opencua"], [/ScaleCUA/i, "scalecua"], [/EvoCUA/i, "evocua"],
    [/MAI-UI/, "mai_ui"], [/UI-Voyager/, "ui_voyager"], [/GELab/, "step_gui"],
  ];
  function cfgPath(model, env, cfgId) {
    const rule = FAMILY_RULES.find(([re]) => re.test(model));
    if (!rule) return null;   // unknown family — leave the name unlinked
    return rule[1] + "/default/" + (CFG_DIR_ENVS.has(env) ? env + "/" + cfgId + ".yaml" : env + ".yaml");
  }

  // ---- box 1 · benchmark composition ---------------------------------------
  // The "why 321?" breakdown behind each board — refined from the devs' filter notes.
  // Keyed by env id (same ids as the coverage cards). To add an env or a new mode,
  // drop in another entry; the panel renders whatever fields are present:
  //   summary  — one-line what-it-is
  //   tally[]  — { label, n, op?: "sub", note?, total?: true }
  //                op:"sub"  → an excluded count, shown as −n and struck toward dim
  //                total:true → the final scored count, emphasized with a rule above it


  const COMPOSITION = {
    osworld_g: { summary: "Single-step click grounding.",
      tally: [{ label: "upstream", n: 564 }, { label: "refusal", n: 54, op: "sub" }, { label: "scored", n: 510, total: true }]},
    screenspot_pro: { summary: "Single-step click grounding on professional high-resolution screens.",
      tally: [{ label: "tasks", n: "~1581", total: true }]},
    osworld: { summary: "OSWorld — 10 real Ubuntu desktop apps.",
      tally: [{ label: "upstream", n: 369 }, { label: "excluded", n: 48, op: "sub", note: "infeasible / broken evaluator" }, { label: "scored", n: 321, total: true }]},
    "lite.osworld": { summary: "Lightweight OSWorld tasks across 10 desktop apps.",
      tally: [{ label: "upstream", n: 369 }, { label: "excluded", n: 48, op: "sub", note: "infeasible / broken evaluator" }, { label: "scored", n: 321, total: true }],},
    osworld_2: { summary: "Capability-graded tasks with float / partial-credit scoring — a separate benchmark from v1.",
      tally: [{ label: "upstream", n: 108 }, { label: "excluded", n: 26, op: "sub", note: "gitlab · human_in_the_loop · multi_phase · volume" }, { label: "scored", n: 82, total: true }],},
    "cua.bench": { summary: "Computer-use tasks, scored by cua-bench's own evaluator.",
      tally: [{ label: "basic", n: 68 }, { label: "kicad", n: 25 }, { label: "workflows", n: 52 }, { label: "total", n: 145, total: true }],},
    webgym: { summary: "Web information-retrieval tasks (Microsoft OmniBoxes).",
      tally: [{ label: "tasks", n: "292k+", total: true }] },
    "webharbor.webvoyager": { summary: "WebVoyager tasks against WebHarbor self-hosted mirrors.",
      tally: [{ label: "tasks", n: 643, total: true }]},
    online_mind2web: { summary: "Live tasks from 136 popular websites across many domains.",
      tally: [{ label: "tasks", n: 300, total: true }]},
    "browsergym.miniwob": { summary: "Tasks over 100 web-interaction environments (MiniWoB++).",
      tally: [{ label: "tasks", n: 125, total: true }]},
    "browsergym.webarena": { summary: "Long-horizon tasks over a self-hosted shop, forum and GitLab.",
      tally: [{ label: "tasks", n: 812, total: true }]},
    "browsergym.visualwebarena": { summary: "Visual web tasks across Classifieds, Shopping and Reddit.",
      tally: [{ label: "tasks", n: 910, total: true }] },
    androidworld: { summary: "The official AndroidWorld task suite.",
      tally: [{ label: "tasks", n: 116, total: true }]},
    androidlab: { summary: "Multi-step tasks across 9 offline Android apps.",
      tally: [{ label: "tasks", n: 138, total: true }]},
    mobileworld: { summary: "The MobileWorld suite — 115 GUI-only + 46 agent-user-interaction tasks.",
      tally: [{ label: "upstream", n: 201 }, { label: "excluded", n: 40, op: "sub", note: "agent-mcp" }, { label: "scored", n: 161, total: true }]},
    mobilegym: { summary: "Parameterized tasks across 28 simulated mobile apps. Reward is progress rate (0–1).",
      tally: [{ label: "eval", n: 256 }, { label: "train", n: 160 }, { label: "total", n: 416, total: true }],
},
  };
  const tallyRow = (label, val, opts = {}) =>
    `<div class="lb-tl-r${opts.total ? " tot" : ""}${opts.sub ? " sub" : ""}">` +
    `<span class="lb-tl-l">${esc(label)}${opts.note ? `<span class="lb-tl-n">${esc(opts.note)}</span>` : ""}</span>` +
    `<span class="lb-tl-v">${esc(val)}</span></div>`;
  // paint box 1 for the active env (called on every env switch, so it's ready before hover)
  function renderComp() {
    const c = COMPOSITION[cur];
    if (!compEl) return;
    if (!c) { compEl.innerHTML = ""; if (infoEl) infoEl.hidden = true; return; }
    if (infoEl) { infoEl.hidden = false; infoEl.title = c.summary; }
    let h = `<div class="lb-pop-k">Composition</div><div class="lb-pop-h">${esc(ENVS[cur].name)}</div>`;
    h += `<p class="lb-pop-sum">${esc(c.summary)}</p>`;
    h += `<div class="lb-tally">` + c.tally.map((t) =>
      tallyRow(t.label, (t.op === "sub" ? "−" : "") + t.n, { total: t.total, sub: t.op === "sub", note: t.note })).join("") + `</div>`;
    if (c.detail) h += `<p class="lb-pop-d">${esc(c.detail)}</p>`;
    if (c.filter) h += `<p class="lb-pop-f">${esc(c.filter)}</p>`;
    if (c.runtime) h += `<div class="lb-pop-run">${esc(c.runtime)}</div>`;
    compEl.innerHTML = h;
  }
  // paint box 2 for one model row (content mirrors the row's title, but expansible)
  function renderRowPop(r, i) {
    const cut = r.model.indexOf("/");
    const org = cut > 0 ? r.model.slice(0, cut + 1) : "", name = cut > 0 ? r.model.slice(cut + 1) : r.model;
    const part = r.status === "partial", left = r.num_tasks - r.num_valid;
    let h = `<div class="lb-pop-h">${org ? `<span class="lb-org">${esc(org)}</span>` : ""}${esc(name)}</div>`;
    h += `<div class="lb-tally">` +
      tallyRow("Rank", "#" + (i + 1)) +
      tallyRow("Score", (r.mean_episode_return * 100).toFixed(1) + "%") +
      tallyRow("Tasks", r.num_valid + " / " + r.num_tasks, { sub: part }) +
      tallyRow("Mean return", (+r.mean_episode_return).toFixed(4), { total: true }) + `</div>`;
    if (part) h += `<p class="lb-pop-note">Partial run — ${left} task${left === 1 ? "" : "s"} still unscored.</p>`;
    rowPopEl.innerHTML = h;
  }

  function render(data, rel) {
    const rows = (data.results || [])
      .filter((r) => r.status !== "empty" && r.mean_episode_return != null)
      // one ranking, by score — a 115/116 partial is comparable to a complete run, so it
      // ranks in place (dimmed + tooltip-flagged) rather than being bucketed to the bottom
      .sort((a, b) => b.mean_episode_return - a.mean_episode_return);
    if (!rows.length) return renderGhost("empty");
    // scale to a round ceiling with headroom, so the leader never hits the wall
    const axis = Math.min(100, Math.ceil((Math.max(...rows.map((r) => r.mean_episode_return * 100)) + 4) / 10) * 10);
    curRows = rows;   // the hover detail panel (box 2) reads back into this by data-idx
    body.innerHTML = rows.map((r, i) => {
      const pct = r.mean_episode_return * 100;
      const cut = r.model.indexOf("/");
      const org = cut > 0 ? r.model.slice(0, cut + 1) : "", name = cut > 0 ? r.model.slice(cut + 1) : r.model;
      const part = r.status === "partial";
      const tip = `${r.model} — ${r.num_valid}/${r.num_tasks} tasks · mean episode return ${(+r.mean_episode_return).toFixed(4)}${part ? " (partial run)" : ""}`;
      const path = cfgPath(r.model, data.env, cfg);
      const label = `${org ? `<span class="lb-org">${esc(org)}</span>` : ""}${esc(name)}`;
      const model = path
        ? `<a href="${esc(CFG_REPO + path)}" target="_blank" rel="noopener" title="${esc("agent config — scripts/configs/" + path)}">${label}</a>`
        : label;
      return `<div class="lb-row${i === 0 ? " top" : ""}${part ? " part" : ""}" role="listitem" data-idx="${i}" style="--w:${(pct / axis).toFixed(4)};--i:${i}" title="${esc(tip)}">` +
        `<span class="lb-rank">${i + 1}</span>` +
        `<span class="lb-model">${model}</span>` +
        `<span class="lb-track"><span class="lb-fill"></span></span>` +
        `<span class="lb-val">${pct.toFixed(1)}<span class="lb-unit">%</span></span></div>`;
    }).join("");
    const jsonUrl = ROOT + data.env + "/" + rel;
    const dir = String(data.commit_dir || "");
    const date = /^\d{4}-\d{2}-\d{2}/.test(dir) ? dir.slice(0, 10) : "";
    const sha = (data.commit && data.commit.short_sha) || dir.split("_").pop() || "";
    foot.innerHTML = `<span>${rows.length} agents</span><span>${Math.max(...rows.map((r) => r.num_tasks))} tasks</span>` +
      `<span>success rate</span><span>${date ? esc(date) + " · " : ""}<a href="${esc(jsonUrl)}" target="_blank" rel="noopener">${esc(rel.split("/").pop() + " @ " + sha.slice(0, 8))}</a></span>`;
  }
  // same card, no numbers yet — a quiet ghost of the board. "loading" shimmers; "empty" says the
  // env has no run at all; "pending" is a declared config tab whose run hasn't been committed yet.
  function renderGhost(kind) {
    const widths = [0.86, 0.74, 0.63, 0.54, 0.46, 0.39];
    const msg = lbDown ? `<span class="lb-none-t">Scores unavailable</span><span class="lb-none-d">this board is served from <a href="https://cua-lite.github.io/#benchmarks" target="_blank" rel="noopener">cua-lite.github.io</a>, which could not be reached.</span>` : kind === "empty"
      ? `<span class="lb-none-t">No committed runs yet</span>` +
        `<span class="lb-none-d">results land here as JSON once ${esc(ENVS[cur].name)} is evaluated — <a href="${esc(ENVS[cur].readme)}" target="_blank" rel="noopener">how to run it ↗</a></span>`
      : kind === "pending"
      ? `<span class="lb-none-t">${esc(cfg)} · coming soon</span>` +
        `<span class="lb-none-d">this ${esc(ENVS[cur].name)} configuration hasn't been evaluated yet — its scores will appear here once committed.</span>`
      : "";
    body.innerHTML = `<div class="lb-none${kind === "loading" ? " loading" : ""}">` +
      widths.map((w, i) => `<div class="lb-row ghost" style="--w:${w};--i:${i}" aria-hidden="true">` +
        `<span class="lb-rank">${i + 1}</span><span class="lb-gname"></span>` +
        `<span class="lb-track"><span class="lb-fill"></span></span><span class="lb-gval"></span></div>`).join("") +
      (msg ? `<div class="lb-none-msg">${msg}</div>` : "") +
      `</div>`;
    foot.innerHTML = lbDown ? `<span>scores unavailable</span><span>served from cua-lite.github.io</span>` : kind === "empty" ? `<span>0 runs</span><span>eval pending</span>`
      : kind === "pending" ? `<span>eval pending</span><span>${esc(cfg)}</span>`
      : `<span>loading committed run…</span>`;
  }
  function getManifest() {
    return manifestP || (manifestP = fetch(ROOT + "manifest.json")
      .then((r) => (r.ok ? r.json() : {})).catch(() => { lbOffline(); return {}; })
      .then((m) => {
        manifest = {};
        // tolerate the older flat form ("<env>": "<path>") as a lone default config
        for (const k in m) manifest[k] = typeof m[k] === "string" ? { default: m[k] } : m[k];
        return manifest;
      }));
  }
  // secondary tabs — the env's config settings (default · som · ...); hidden when there's only one.
  // a "pending" config (no committed run yet) still gets a tab, dimmed, opening a coming-soon state.
  function renderCfgTabs() {
    const cfgs = manifest && manifest[cur] ? manifest[cur] : {};
    const list = Object.keys(cfgs);
    cfgsEl.innerHTML = "";
    if (list.length < 2) return;
    list.forEach((c) => {
      const pending = cfgs[c] === "pending";
      const b = document.createElement("button");
      b.type = "button";
      b.className = "lb-cfg" + (c === cfg ? " on" : "") + (pending ? " pending" : "");
      b.textContent = c;
      if (pending) b.title = "not evaluated yet — coming soon";
      b.addEventListener("click", () => { if (c !== cfg) show(cur, c); });
      cfgsEl.appendChild(b);
    });
  }
  function show(envId, cfgId) {
    if (!ENVS[envId]) return;
    cur = envId;
    envEl.textContent = ENVS[envId].name;
    openEl.href = ENVS[envId].readme;
    if (!manifest) {   // first paint: the manifest is still in flight — re-enter once it lands
      cfgsEl.innerHTML = "";
      renderGhost("loading");
      getManifest().then(() => { if (cur === envId) show(envId, cfgId); });
      return;
    }
    const cfgs = manifest[envId] || {};
    const list = Object.keys(cfgs);
    const real = (c) => cfgs[c] && cfgs[c] !== "pending";   // a config with a committed run
    // land on a config with results — never open on a pending (coming-soon) tab by default
    cfg = list.includes(cfgId) ? cfgId
      : real("default") ? "default"
      : list.find(real) || list[0];
    renderCfgTabs();
    renderComp();   // keep box 1 in sync with the active env
    if (!list.length) return renderGhost("empty");
    const rel = cfgs[cfg];
    if (rel === "pending") return renderGhost("pending");   // placeholder tab — no run committed yet
    const key = envId + "/" + cfg;
    const fresh = () => cur === envId && envId + "/" + cfg === key;   // ignore stale fetches after another switch
    if (runs[key]) return render(runs[key], rel);
    renderGhost("loading");
    fetch(ROOT + envId + "/" + rel)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => {
        if (!data || !Array.isArray(data.results)) throw new Error("bad payload");
        runs[key] = data;
        if (fresh()) render(data, rel);
      })
      .catch(() => { if (fresh()) { renderGhost("empty"); lbOffline(); } });
  }

  // the coverage cards drive the board (their README stays reachable via the header link)
  cards.forEach((c) => c.addEventListener("click", (e) => {
    e.preventDefault();
    if (c.dataset.env !== cur) show(c.dataset.env);
    if (builderSetEnv) builderSetEnv(c.dataset.env);   // …and the eval command follows the card
  }));
  // …and so does the eval builder's --env-id (registered at file scope for the builder's IIFE)
  lbFollowEnv = (envId) => { if (envId !== cur) show(envId); };

  // ---- box 2 · per-model detail (box 1 is resident; see renderComp) ---------
  // Box 1 (composition) is always shown to the card's right. Box 2 opens on row
  // hover and stacks just beneath it. A short close delay lets the pointer cross
  // the gap into the panel without it collapsing. Touch/narrow screens hide both
  // panels and fall back to the native title tooltip.
  if (lbEl && rowPopEl) {
    let rt, activeIdx = -1;   // box 2 close timer + which row it's showing
    const rowShut = () => { rt = setTimeout(() => { lbEl.classList.remove("rowpop-open"); activeIdx = -1; }, 220); };
    body.addEventListener("pointerover", (e) => {
      const row = e.target.closest(".lb-row");
      if (!row || row.classList.contains("ghost") || row.dataset.idx == null) return;
      clearTimeout(rt);
      const i = +row.dataset.idx, r = curRows[i];
      if (!r) return;
      if (i !== activeIdx) {   // moved to a new row — repaint and restack below box 1
        activeIdx = i;
        renderRowPop(r, i);
        rowPopEl.style.top = ((compEl ? compEl.offsetHeight : 0) + 14) + "px";
      }
      lbEl.classList.add("rowpop-open");
    });
    body.addEventListener("pointerleave", rowShut);
    rowPopEl.addEventListener("pointerenter", () => clearTimeout(rt));
    rowPopEl.addEventListener("pointerleave", rowShut);
  }

  renderComp();   // populate box 1 for the default env before the manifest resolves
  show(cur);
})();

/* Sandboxes belt + rollout peek viewer live in js/belt.js — shared with the blog (one implementation). */
/* LiteSample hover popover lives in js/lspop.js — shared with the blog (one implementation). */
