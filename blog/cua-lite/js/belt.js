/* Shared training-env belt + rollout peek viewer — used by the homepage,
   /blog/why-cua-lite/, and /blog/kvm-free-osworld/. One implementation, one manifest.
   Clips + data live under /blog/kvm-free-osworld/assets/ (built by assets/build-manifests.py).
   A page opts in by rendering a .belt-fig (belt) and/or the .peek + .peek-scrim panel (viewer). */

/* ---------- shared rollout viewer ----------
   Clicking any bound clip enlarges it: the task instruction runs along the clip's top,
   the action log sits on the right, and clicking an action seeks the clip to that turn —
   the log highlights whichever turn is on screen as playback runs. Click outside (or the
   clip again, or Escape) to close. */
const Rollouts = (function () {
  "use strict";
  const BASE = "https://cua-lite.github.io/blog/kvm-free-osworld/";
  const abs = (p) => (p && !/^(https?:)?\/\//.test(p) && p[0] !== "/") ? BASE + p : p;
  const ready = fetch(BASE + "assets/rollouts.json")
    .then((r) => r.json())
    .then((d) => {   // rewrite every clip's relative video path to absolute so any page can play it
      [d.hh, d.belt].forEach((grp) => grp && Object.values(grp).forEach((v) => {
        (Array.isArray(v) ? v : Object.values(v)).forEach((c) => { if (c && c.video) c.video = abs(c.video); });
      }));
      return d;
    })
    .catch(() => { document.querySelectorAll(".belt-fig").forEach((f) => { f.classList.add("belt-offline"); const c = f.querySelector(".belt-cap"); if (c) c.textContent = "Rollout clips are served from cua-lite.github.io and could not be loaded."; }); document.querySelectorAll(".hh").forEach((f) => { f.classList.add("hh-offline"); const c = f.querySelector(".hh-cap"); if (c) c.textContent = "Side-by-side rollouts are served from cua-lite.github.io and could not be loaded."; }); return { hh: {}, belt: {} }; });

  const peek = document.querySelector(".peek"), scrim = document.querySelector(".peek-scrim");
  if (!peek || !scrim) return { ready, bind() {} };   // page has no viewer — belt still works, just no peek

  const vid = peek.querySelector(".peek-vid");
  const instr = peek.querySelector(".peek-instr"), domain = peek.querySelector(".peek-domain");
  const list = peek.querySelector(".peek-actions");
  let openKey = null, timer = null, turns = [], marked = -1;

  /* the instruction caps at 3 lines; wrap it so a bottom fade can signal "there's more to scroll"
     (a guaranteed cue on top of the themed scrollbar) */
  const iwrap = document.createElement("div");
  iwrap.className = "peek-instr-wrap";
  instr.parentNode.insertBefore(iwrap, instr);
  iwrap.appendChild(instr);
  const updateMore = () => iwrap.classList.toggle("more", instr.scrollHeight - instr.scrollTop - instr.clientHeight > 2);
  instr.addEventListener("scroll", updateMore);

  /* keep the log in step with playback: highlight the turn currently on screen */
  function sync() {
    if (!turns.length) return;
    const t = vid.currentTime + 0.01;
    let i = 0;
    for (let k = 0; k < turns.length; k++) if (turns[k].t <= t) i = k;
    if (i === marked) return;
    marked = i;
    [...list.children].forEach((li, k) => li.firstChild.classList.toggle("is-on", k === i));
    const row = list.children[i];
    if (row) row.scrollIntoView({ block: "nearest" });
  }

  function seek(i) {
    const t = turns[i].t + 0.05;      // nudge inside the frame so we don't land on its boundary
    vid.currentTime = vid.duration ? Math.min(t, vid.duration - 0.01) : t;
    vid.play().catch(() => {});       // stay playing — the clip runs on from that turn
    marked = -1; sync();
  }

  function open(key, clip) {
    clearTimeout(timer);                     // cancel a pending close, incl. re-entering the same clip
    if (!clip || key === openKey) return;
    openKey = key;
    turns = clip.turns; marked = -1;
    domain.textContent = clip.domain;
    instr.textContent = clip.instruction;
    instr.scrollTop = 0; requestAnimationFrame(updateMore);   // reset scroll + show the "more" fade if the task overflows
    if (vid.getAttribute("src") !== clip.video) vid.src = clip.video;   // same clip re-opens instantly
    vid.play().catch(() => {});
    list.innerHTML = "";
    clip.turns.forEach((t, i) => {
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.className = "peek-act";
      b.innerHTML = '<span class="peek-act-n"></span><span class="peek-act-t"></span>';
      b.firstChild.textContent = i + 1;
      b.lastChild.textContent = t.action;
      b.addEventListener("click", () => seek(i));
      li.appendChild(b); list.appendChild(li);
    });
    peek.hidden = false;
    requestAnimationFrame(() => { peek.classList.add("is-on"); scrim.classList.add("is-on"); });
  }

  function close() {
    clearTimeout(timer);
    peek.classList.remove("is-on"); scrim.classList.remove("is-on");
    openKey = null;
    timer = setTimeout(() => { peek.hidden = true; vid.pause(); }, 180);   // after the fade
  }

  vid.addEventListener("timeupdate", sync);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  document.addEventListener("click", (e) => {   // the scrim is click-through, so a click outside dismisses from here
    if (openKey && !peek.contains(e.target) && !e.target.closest("[data-peek]")) close();
  });

  return {
    ready,
    /* resolve() runs at click time and returns {key, clip}, so tab switches stay live */
    bind(el, resolve) {
      el.dataset.peek = "";
      el.style.cursor = "pointer";
      el.addEventListener("click", () => {
        const r = resolve(); if (!r) return;
        r.key === openKey ? close() : open(r.key, r.clip);   // click a clip to open; click it again (or outside) to close
      });
    },
  };
})();

/* ---------- training-env belt ----------
   A conveyor of looping rollout clips; pills switch the env family. Tiles are labelled with
   the task's app domain and hover into the shared Rollouts peek. */
(function () {
  "use strict";
  const fig = document.querySelector(".belt-fig");
  if (!fig) return;
  const belt = fig.querySelector(".belt"), tabs = [...fig.querySelectorAll(".belt-tab")];
  let DATA = null, active = false;

  /* one-line plain-English gloss per family (source: each env's README) */
  const FAM_DESC = {
    "Lite.OSWorld": "369 benchmark tasks + 2k+ synthesized, across 10 desktop apps.",
    "Lite.ScaleCUA": "20k+ tasks perturbed from OSWorld's evals.",
    "Lite.CUAGym": "Browser and desktop tasks across mock sites and real apps.",
    "Lite.CUAWorld": "40 professional apps across ~25 expert domains.",
  };
  const desc = document.createElement("div");   // a div, not a <p>, so blog `.post-wrap p` rules can't override its size
  desc.className = "belt-fam-desc";
  belt.parentNode.insertBefore(desc, belt);

  const tile = (fam, i, clip) => {
    const d = document.createElement("div"); d.className = "belt-tile";
    d.innerHTML = '<video class="belt-vid" muted loop playsinline preload="auto"></video><span class="belt-live" aria-hidden="true"><i></i><i></i><i></i></span><span class="belt-tag"></span>';
    d.querySelector(".belt-vid").src = clip.video;
    d.querySelector(".belt-tag").textContent = clip.domain;
    Rollouts.bind(d, () => ({ key: "belt:" + fam + ":" + i, clip }));
    return d;
  };

  /* one marquee row: its clips laid twice for a seamless loop; `rev` scrolls it the other way */
  const row = (fam, items, rev) => {
    const tr = document.createElement("div");
    tr.className = "belt-track" + (rev ? " belt-track-rev" : "");
    tr.setAttribute("aria-hidden", "true");
    for (let k = 0; k < 2; k++) items.forEach(([i, c]) => tr.appendChild(tile(fam, i, c)));   // ×2 = seamless loop
    return tr;
  };

  const fill = (fam) => {
    desc.textContent = FAM_DESC[fam] || "";
    belt.innerHTML = "";
    const clips = (DATA.belt && DATA.belt[fam]) || [];
    const top = [], bot = [];
    clips.forEach((c, i) => (i % 2 ? bot : top).push([i, c]));   // interleave so the two rows show different apps
    belt.appendChild(row(fam, top, false));
    belt.appendChild(row(fam, bot, true));                       // second row scrolls the opposite way — the rows stay staggered
    if (active) fig.querySelectorAll(".belt-vid").forEach((v) => v.play().catch(() => {}));
  };

  tabs.forEach((t) => t.addEventListener("click", () => {
    if (t.classList.contains("is-on") || !DATA) return;
    tabs.forEach((o) => { const on = o === t; o.classList.toggle("is-on", on); o.setAttribute("aria-selected", on); });
    fill(t.textContent.trim());
  }));

  const start = () => { active = true; fig.querySelectorAll(".belt-vid").forEach((v) => v.play().catch(() => {})); };

  Rollouts.ready.then((data) => {
    DATA = data;
    fill(tabs.find((t) => t.classList.contains("is-on")).textContent.trim());
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting && !active) { start(); io.disconnect(); }
      }), { rootMargin: "0px 0px -15% 0px" });
      io.observe(fig);
    } else { start(); }
  });
})();
