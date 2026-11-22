/* MOKSHIFY — site shell behaviour: navigation, the spine, scroll reveal, table filters.
   Everything here is an enhancement; pages read and navigate without it. */
(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ── navigation: one disclosure open at a time, full-width panel ── */
  const nav = document.getElementById("site-nav");
  if (nav) {
    const tops = $$(".nav-top", nav);
    const toggle = nav.querySelector(".nav-toggle");
    const wide = matchMedia("(min-width: 60rem)");
    const closeAll = except => tops.forEach(b => { if (b !== except) b.setAttribute("aria-expanded", "false"); });
    const menuOpen = () => root.classList.contains("nav-open");
    const setMenu = open => {
      root.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (!open) closeAll();
    };

    tops.forEach(b => b.addEventListener("click", () => {
      const open = b.getAttribute("aria-expanded") === "true";
      closeAll(b);
      b.setAttribute("aria-expanded", String(!open));
    }));
    toggle.addEventListener("click", e => { e.preventDefault(); setMenu(!menuOpen()); });
    toggle.addEventListener("keydown", e => {
      if (e.key === " ") { e.preventDefault(); setMenu(!menuOpen()); }
    });

    addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      const open = tops.find(b => b.getAttribute("aria-expanded") === "true");
      if (open) { closeAll(); open.focus(); }
      else if (menuOpen()) { setMenu(false); toggle.focus(); }
    });
    document.addEventListener("click", e => { if (wide.matches && !nav.contains(e.target)) closeAll(); });
    nav.addEventListener("focusout", e => {
      if (wide.matches && e.relatedTarget && !nav.contains(e.relatedTarget)) closeAll();
    });
    wide.addEventListener("change", () => setMenu(false));
  }

  /* ── the spine: draws down the page as far as the reader has been, once ── */
  const spine = document.querySelector(".spine");
  if (spine) {
    let max = 0, queued = false;
    const draw = () => {
      queued = false;
      const h = spine.offsetHeight || 1;
      const atEnd = root.scrollHeight - (scrollY + innerHeight) < innerHeight * 0.2;
      const p = reduced || atEnd ? 1 : Math.min(1, Math.max(0, (scrollY + innerHeight * 0.82 - spine.offsetTop) / h));
      if (p > max) {
        max = p;
        spine.style.setProperty("--spine-p", max.toFixed(4));
        if (max >= 0.999) spine.style.setProperty("--spine-end-o", "1");
      }
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue, { passive: true });
    requestAnimationFrame(draw);
  }

  /* ── one short fade-and-rise as content enters, below the first screen only ── */
  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    for (const el of $$(".section-head, .section-body, .band .wrap, .plate, .reveal")) {
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("will-reveal"); io.observe(el); }
    }
  }

  /* ── filters for reference tables and galleries:
        <div class="filters" data-target="#id"><button data-filter="cloud">…  rows carry data-cat ── */
  for (const bar of $$(".filters[data-target]")) {
    const target = document.querySelector(bar.dataset.target);
    if (!target) continue;
    const items = $$("[data-cat]", target);
    const status = bar.querySelector("[role=status]");
    bar.addEventListener("click", e => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      const f = btn.dataset.filter;
      $$("button[data-filter]", bar).forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
      let shown = 0;
      for (const it of items) {
        const on = f === "all" || it.dataset.cat.split(" ").includes(f);
        it.hidden = !on;
        if (on) shown++;
      }
      if (status) status.textContent = `${shown} of ${items.length} shown`;
    });
  }
})();
