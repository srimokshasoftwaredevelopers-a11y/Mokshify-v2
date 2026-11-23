/* MOKSHIFY — home page only. Runs after site.js. The HTML is complete and still without it;
   this adds: the hero video (once its files exist), one pause control for background motion,
   the hero showcase (rotation, cursor tilt), the pinned work story at 1024px+, and the
   capability-row previews. Everything else on the home page is CSS. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;                                   // reduced motion: the static page, as authored
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const wide = matchMedia("(min-width: 56.25rem)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const paused = () => root.classList.contains("motion-paused");
  const navH = () => document.getElementById("site-nav")?.offsetHeight || 64;

  /* ── hero video: on only once assets/hero/* exist (the build stamps "ready"). The poster is the
        still; on wide screens with decent connections the 0.6× video fades in over it ── */
  const heroFig = document.querySelector(".hero.home .hero-img");
  const video = heroFig?.querySelector(".hero-video");
  if (heroFig && video && heroFig.dataset.heroVideo === "ready") {
    const conn = navigator.connection || {};
    const goodNet = !conn.saveData && !/(^|-)(2g|3g)$/.test(conn.effectiveType || "");
    const pic = document.createElement("picture"), still = new Image();
    still.src = video.dataset.poster; still.alt = ""; still.decoding = "async";
    pic.append(still); heroFig.prepend(pic);
    if (wide.matches && goodNet) {
      video.poster = video.dataset.poster;
      for (const [type, key] of [["video/webm", "webm"], ["video/mp4", "mp4"]]) {
        const s = document.createElement("source");
        s.src = video.dataset[key]; s.type = type; video.append(s);
      }
      video.addEventListener("loadedmetadata", () => { video.playbackRate = 0.6; });
      video.addEventListener("playing", () => heroFig.classList.add("has-video"), { once: true });
      video.load();
      video.play().catch(() => {});
    }
  }

  /* ── one pause control for everything that moves on its own: showcase, light, reel, video ── */
  const pauseBtn = document.querySelector(".hero-pause");
  if (pauseBtn) {
    pauseBtn.hidden = false;
    pauseBtn.addEventListener("click", () => {
      const stop = !paused();
      root.classList.toggle("motion-paused", stop);
      heroFig?.classList.toggle("is-paused", stop);
      if (heroFig?.classList.contains("has-video")) { if (stop) video.pause(); else video.play().catch(() => {}); }
      pauseBtn.setAttribute("aria-pressed", String(stop));
      pauseBtn.querySelector(".sr").textContent = stop ? "Play background motion" : "Pause background motion";
    });
  }

  /* ── hero showcase: every 5s the front card slides back and the next comes forward.
        Holds while the pointer is over it, while anything in it has focus, while paused,
        while the tab is hidden and while it is off screen ── */
  const sc = document.querySelector(".showcase");
  if (sc) {
    const cards = $$(".sc-card", sc), n = cards.length;
    const label = sc.querySelector(".sc-label"), nameEl = sc.querySelector(".sc-name"), indEl = sc.querySelector(".sc-ind");
    let front = 0, hover = false, focus = false, onScreen = true;
    const held = () => hover || focus;
    const sync = () => sc.classList.toggle("is-held", held());
    sc.addEventListener("pointerenter", () => { hover = true; sync(); });
    sc.addEventListener("pointerleave", () => { hover = false; sync(); });
    sc.addEventListener("focusin", () => { focus = true; sync(); });
    sc.addEventListener("focusout", e => { if (!sc.contains(e.relatedTarget)) { focus = false; sync(); } });
    if ("IntersectionObserver" in window) new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; }).observe(sc);
    const advance = () => {
      front = (front + 1) % n;
      cards.forEach((c, i) => { c.dataset.pos = String((i - front + n) % n); });
      label.classList.add("is-swap");
      setTimeout(() => {
        nameEl.textContent = cards[front].dataset.name;
        indEl.textContent = cards[front].dataset.ind;
        label.classList.remove("is-swap");
      }, 350);
    };
    setInterval(() => { if (!held() && !paused() && onScreen && !document.hidden) advance(); }, 5000);
    sc.dataset.live = "";

    /* cursor tilt, desktop pointers only: a few degrees toward the pointer, eased by CSS */
    const stack = sc.querySelector(".sc-stack");
    const hero = sc.closest(".hero");
    let raf = 0, px = 0, py = 0;
    const tilt = () => {
      raf = 0;
      const r = stack.getBoundingClientRect();
      const dx = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / (r.width / 1.4)));
      const dy = Math.max(-1, Math.min(1, (py - (r.top + r.height / 2)) / (r.height / 1.4)));
      stack.style.setProperty("--ry", `${(dx * 5).toFixed(2)}deg`);
      stack.style.setProperty("--rx", `${(-dy * 3.5).toFixed(2)}deg`);
    };
    hero.addEventListener("pointermove", e => {
      if (!wide.matches || !fine.matches || paused()) return;
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(tilt);
    }, { passive: true });
    hero.addEventListener("pointerleave", () => { stack.style.setProperty("--rx", "0deg"); stack.style.setProperty("--ry", "0deg"); });
  }

  /* ── work story, 1024px+: the section pins for the length of the projects; scrolling
        advances the industry and the project on the right. Tabs still work, by click and by
        keyboard, and move the page to their place in the story. Below 1024px: plain tabs ── */
  const box = document.querySelector(".work-by-industry .tabs");
  const list = box?.querySelector("[role=tablist]");
  if (box && list && typeof list.selectTab === "function") {
    const mq = matchMedia("(min-width: 64rem)");
    const tabs = $$("[role=tab]", list);
    const steps = [];                                    // every project in order, with its tab
    tabs.forEach((t, ti) => $$(".work-row", document.getElementById(t.getAttribute("aria-controls"))).forEach(row => steps.push({ row, ti })));
    let on = false, cur = -1, lockTo = null, lockUntil = 0, queued = false;
    const pin = box.querySelector(".story-pin");
    // pinned from when the box reaches the panel's sticky top until the box runs out
    const geom = () => {
      const stickyTop = parseFloat(getComputedStyle(pin).top) || navH();
      const top = box.getBoundingClientRect().top + scrollY - stickyTop;
      return { top, len: Math.max(1, box.offsetHeight - pin.offsetHeight) };
    };
    const show = s => {
      if (s === cur) return;
      cur = s;
      steps.forEach((st, i) => st.row.classList.toggle("is-active", i === s));
      const ti = steps[s].ti;
      if (tabs[ti].getAttribute("aria-selected") !== "true") list.selectTab(ti);
    };
    const onScroll = () => {
      queued = false;
      if (!on) return;
      if (lockTo !== null) {
        if (Math.abs(scrollY - lockTo) > 3 && performance.now() < lockUntil) return;
        lockTo = null;
      }
      const { top, len } = geom();
      const p = Math.min(0.9999, Math.max(0, (scrollY - top) / len));
      show(Math.floor(p * steps.length));
    };
    const yFor = s => { const { top, len } = geom(); return Math.round(top + ((s + 0.5) / steps.length) * len); };
    list.addEventListener("tabchoose", e => {
      if (!on) return;
      const s = steps.findIndex(st => st.ti === e.detail);
      show(s);
      lockTo = yFor(s); lockUntil = performance.now() + 1800;
      if (window.mokshifyLenis) window.mokshifyLenis.scrollTo(lockTo, { duration: 1.1 });
      else scrollTo({ top: lockTo, behavior: "smooth" });
    });
    const apply = () => {
      on = mq.matches;
      box.classList.toggle("story", on);
      box.style.setProperty("--steps", String(steps.length));
      cur = -1;
      if (on) { onScroll(); if (cur < 0) show(0); }
      else steps.forEach(st => st.row.classList.remove("is-active"));
      window.mokshifyLenis?.resize?.();
    };
    mq.addEventListener("change", apply);
    apply();
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(onScroll); } }, { passive: true });
    // a person scrolling takes over from a tab's scroll at once
    const release = () => { lockTo = null; };
    for (const ev of ["wheel", "touchstart"]) addEventListener(ev, release, { passive: true });
    addEventListener("keydown", e => { if (/^(Page|Arrow(Up|Down)$|Home|End| )/.test(e.key) && !list.contains(e.target)) release(); });
    addEventListener("resize", () => { if (on) onScroll(); }, { passive: true });
  }

  /* ── capability rows: a small preview of a related client site follows the cursor ── */
  const caps = $$(".capabilities .card[data-preview]");
  if (caps.length && fine.matches) {
    const pv = document.createElement("div");
    pv.className = "cap-preview"; pv.setAttribute("aria-hidden", "true");
    pv.innerHTML = '<img alt="" width="640" height="400" decoding="async"><span></span>';
    document.body.append(pv);
    const img = pv.querySelector("img"), cap = pv.querySelector("span");
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0, shown = false;
    const aim = e => {
      tx = Math.min(e.clientX + 28, innerWidth - pv.offsetWidth - 16);
      ty = Math.max(16, Math.min(e.clientY - pv.offsetHeight / 2, innerHeight - pv.offsetHeight - 16));
    };
    const loop = () => {
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      pv.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      raf = shown || Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    for (const c of caps) {
      c.addEventListener("pointerenter", e => {
        if (img.getAttribute("src") !== c.dataset.preview) img.src = c.dataset.preview;
        cap.textContent = c.dataset.caption;
        aim(e);
        if (!shown) { x = tx; y = ty; }
        shown = true; pv.classList.add("on");
        if (!raf) raf = requestAnimationFrame(loop);
      });
      c.addEventListener("pointermove", aim, { passive: true });
      c.addEventListener("pointerleave", () => { shown = false; pv.classList.remove("on"); });
    }
    addEventListener("scroll", () => { if (shown) { shown = false; pv.classList.remove("on"); } }, { passive: true });
  }
})();
