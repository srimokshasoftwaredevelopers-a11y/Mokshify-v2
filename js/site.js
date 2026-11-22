/* MOKSHIFY — the one shell script. Every page reads and navigates without it;
   this only enhances: menus, nav state, tabs, contents tracking, reveals,
   table filters, code copy, the enquiry form, and conversion events. */
(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ── nav: transparent over an oxblood hero, solid once the page moves ── */
  const nav = document.getElementById("site-nav");
  const hero = document.querySelector("main > .hero");
  if (nav) {
    const darkHero = hero && /\b(dark|plate)\b/.test(hero.className);
    const setOver = () => nav.classList.toggle("over", !!darkHero && scrollY < 8);
    setOver();
    addEventListener("scroll", setOver, { passive: true });

    const tops = $$(".nav-top", nav);
    const toggle = nav.querySelector(".nav-toggle");
    const wide = matchMedia("(min-width: 56.3125rem)");
    const closeAll = except => tops.forEach(b => { if (b !== except) b.setAttribute("aria-expanded", "false"); });
    const sheetOpen = () => root.classList.contains("nav-open");
    const setSheet = open => {
      root.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (!open) closeAll();
    };
    tops.forEach(b => b.addEventListener("click", () => {
      const open = b.getAttribute("aria-expanded") === "true";
      closeAll(b);
      b.setAttribute("aria-expanded", String(!open));
    }));
    toggle.addEventListener("click", () => setSheet(!sheetOpen()));
    addEventListener("keydown", e => {
      if (e.key !== "Escape") return;
      const open = tops.find(b => b.getAttribute("aria-expanded") === "true");
      if (open && wide.matches) { closeAll(); open.focus(); }
      else if (sheetOpen()) { setSheet(false); toggle.focus(); }
      else if (open) { closeAll(); open.focus(); }
    });
    document.addEventListener("click", e => { if (wide.matches && !nav.contains(e.target)) closeAll(); });
    nav.addEventListener("focusout", e => {
      if (wide.matches && e.relatedTarget && !nav.contains(e.relatedTarget)) closeAll();
    });
    wide.addEventListener("change", () => setSheet(false));
  }

  /* ── smooth scrolling: Lenis, desktop pointers at 900px+ only; touch keeps native scrolling ── */
  if (!reduced && matchMedia("(pointer: fine) and (min-width: 56.25rem)").matches) {
    const s = document.createElement("script");
    s.src = "/js/vendor/lenis-1.3.27.min.js";
    s.defer = true;
    s.onload = () => {
      if (typeof window.Lenis !== "function") return;
      const navH = () => (document.getElementById("site-nav")?.offsetHeight || 64) + 24;
      const lenis = new window.Lenis({
        lerp: 0.08, autoRaf: true, smoothWheel: true,
        anchors: { offset: -navH() },                                   // in-page links land below the fixed nav
        prevent: node => !!node.closest?.(".toc, .pipeline, .tablist, .delivery, .system, pre, .nav-panel, .nav-main"),
      });
      window.mokshifyLenis = lenis;
      // focus moved by Tab or a skip link scrolls natively; Lenis follows the real scroll position
      addEventListener("focusin", () => lenis.resize(), { passive: true });
    };
    document.head.append(s);
  }

  /* ── home hero: slow-motion video (wide screens, decent connections) or the still's slow zoom ── */
  const heroFig = document.querySelector(".hero.home .hero-img");
  const heroBtn = document.querySelector(".hero-pause");
  if (heroFig && heroBtn && !reduced) {
    const video = heroFig.querySelector(".hero-video");
    const conn = navigator.connection || {};
    const goodNet = !conn.saveData && !/(^|-)(2g|3g)$/.test(conn.effectiveType || "");
    const wideEnough = matchMedia("(min-width: 56.25rem)").matches;
    const ready = heroFig.dataset.heroVideo === "ready";
    let playing = true;
    if (ready && video && wideEnough && goodNet) {
      video.poster = video.dataset.poster;
      for (const [type, key] of [["video/webm", "webm"], ["video/mp4", "mp4"]]) {
        const s = document.createElement("source");
        s.src = video.dataset[key]; s.type = type; video.append(s);
      }
      video.addEventListener("loadedmetadata", () => { video.playbackRate = 0.6; });
      video.addEventListener("playing", () => heroFig.classList.add("has-video"), { once: true });
      video.load();
      video.play().catch(() => {});
    } else if (ready) {
      // narrow screens and Save-Data / 2g / 3g: the poster, never the video
      heroFig.querySelectorAll("source[srcset]").forEach(s => s.remove());
      heroFig.querySelector("img").src = video.dataset.poster;
    }
    heroBtn.hidden = false;
    heroBtn.addEventListener("click", () => {
      playing = !playing;
      if (heroFig.classList.contains("has-video")) { if (playing) video.play().catch(() => {}); else video.pause(); }
      heroFig.classList.toggle("is-paused", !playing);
      heroBtn.setAttribute("aria-pressed", String(!playing));
      heroBtn.querySelector(".sr").textContent = playing ? "Pause background motion" : "Play background motion";
    });
  }

  /* ── tabs (home: work by industry). All panels are in the HTML; without JS they all show ── */
  for (const list of $$("[role=tablist]")) {
    const tabs = $$("[role=tab]", list);
    const select = (tab, focus) => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", e => {
        const k = { ArrowRight: 1, ArrowLeft: -1, Home: -i, End: tabs.length - 1 - i }[e.key];
        if (k === undefined) return;
        e.preventDefault();
        select(tabs[(i + k + tabs.length) % tabs.length], true);
      });
    });
    select(tabs.find(t => t.getAttribute("aria-selected") === "true") || tabs[0]);
    list.closest(".tabs")?.classList.add("is-live");
  }

  /* ── long-form contents: the current section's tick fills on the spine ── */
  const toc = document.querySelector(".toc");
  if (toc && "IntersectionObserver" in window) {
    const links = new Map($$("a[href^='#']", toc).map(a => [a.getAttribute("href").slice(1), a]));
    const heads = [...links.keys()].map(id => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(() => {
      let current = heads[0];
      for (const h of heads) if (h.getBoundingClientRect().top < innerHeight * 0.35) current = h;
      links.forEach((a, id) => a.toggleAttribute("aria-current", id === current.id));
    }, { rootMargin: "0px 0px -60% 0px", threshold: [0, 1] });
    heads.forEach(h => io.observe(h));
  }

  /* ── slow zoom: screenshots and plates settle from 1.06 to 1 as they enter, once ── */
  if (!reduced && "IntersectionObserver" in window) {
    const zio = new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add("is-in"); zio.unobserve(en.target); }
    }, { rootMargin: "0px 0px -6% 0px" });
    for (const el of $$(".work-shot .frame-view, .gallery .frame-view, .hero-case .hero-img, .plate:not(.todo)")) {
      el.classList.add("zoom-in");
      zio.observe(el);
    }
  }

  /* ── one short fade-and-rise as content enters, below the first screen only ── */
  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    // content fades and rises; tools, forms and long-form articles stay still
    const still = el => el.closest(".t-tool, .t-long, .convert-sec") || el.querySelector("form, .est");
    for (const el of $$("main .section-head > :not(h2), main .section-body, main .band .label, main .band-copy > :not(h2), main .band .row")) {
      if (el.getBoundingClientRect().top > innerHeight && !still(el)) { el.classList.add("will-reveal"); io.observe(el); }
    }

    // section headlines reveal line by line behind a clip mask; the markup is restored afterwards
    const hio = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const h = en.target, lines = h.querySelectorAll(".ln").length;
        h.classList.add("is-in"); hio.unobserve(h);
        setTimeout(() => { h.innerHTML = h.dataset.html; h.classList.remove("h-reveal", "is-in"); }, 900 + 110 * (lines - 1) + 80);
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    for (const h of $$("main .section-head h2, main .band h2")) {
      if (h.getBoundingClientRect().top <= innerHeight || h.children.length || still(h)) continue;
      const words = h.textContent.trim().split(/\s+/);
      h.dataset.html = h.innerHTML;
      h.innerHTML = words.map(w => `<span class="w">${w.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>`).join(" ");
      const rows = [];
      for (const w of h.querySelectorAll(".w")) {
        const last = rows[rows.length - 1];
        if (last && Math.abs(last.top - w.offsetTop) < 4) last.words.push(w.textContent); else rows.push({ top: w.offsetTop, words: [w.textContent] });
      }
      h.innerHTML = rows.map((r, i) => `<span class="ln"><span style="--i:${i}">${r.words.join(" ").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span></span>`).join(" ");
      h.classList.add("h-reveal");
      hio.observe(h);
    }
  }

  /* ── the one easing, cubic-bezier(.16,1,.3,1), for motion driven from JS ── */
  const bez = (s, a, b) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  const ease = x => { let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; bez(m, .16, .3) < x ? lo = m : hi = m; } return bez((lo + hi) / 2, 1, 1); };
  const easeInv = y => { let lo = 0, hi = 1; for (let k = 0; k < 24; k++) { const m = (lo + hi) / 2; bez(m, 1, 1) < y ? lo = m : hi = m; } return bez((lo + hi) / 2, .16, .3); };

  if (!reduced && "IntersectionObserver" in window) {
    /* metrics count up over 1.6s on entry; the final value is what the HTML says */
    const parse = t => {
      const m = /^(\D*?)(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(\D*)$/.exec(t.trim());
      return m && !/\d/.test(m[1] + m[3]) ? { pre: m[1], n: parseFloat(m[2].replace(/,/g, "")), dec: (m[2].split(".")[1] || "").length, comma: m[2].includes(","), suf: m[3] } : null;
    };
    const fmt = (v, p) => p.pre + (p.comma ? v.toLocaleString("en-US", { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec }) : v.toFixed(p.dec)) + p.suf;
    const cio = new IntersectionObserver(entries => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target, p = parse(el.dataset.final), t0 = performance.now();
        cio.unobserve(el);
        const step = now => {
          const x = Math.min(1, (now - t0) / 1600);
          el.textContent = x < 1 ? fmt(p.n * ease(x), p) : el.dataset.final;
          if (x < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { rootMargin: "0px 0px -10% 0px" });
    for (const el of $$("main .facts b")) {
      const p = parse(el.textContent);
      if (!p || p.n === 0 || el.getBoundingClientRect().top <= innerHeight || el.closest(".hidden, [hidden]")) continue;
      el.dataset.final = el.textContent;
      el.textContent = fmt(0, p);
      cio.observe(el);
    }

    /* the pipeline line draws left to right over 2s; each step fades in as the line reaches it */
    const pio = new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add("is-in"); pio.unobserve(en.target); }
    }, { rootMargin: "0px 0px -15% 0px" });
    for (const ol of $$("main .pipeline")) {
      if (ol.getBoundingClientRect().top <= innerHeight) continue;
      const steps = [...ol.children], n = steps.length;
      steps.forEach((li, i) => {
        const a = easeInv(i / n) * 2000, b = easeInv((i + 1) / n) * 2000;
        li.style.setProperty("--d", `${Math.round(a)}ms`);
        li.style.setProperty("--len", `${Math.max(1, Math.round(b - a))}ms`);
      });
      ol.classList.add("will-draw");
      pio.observe(ol);
    }
  }

  /* ── filters for reference tables: <div class="filters" data-target="#id"> + rows with data-cat ── */
  for (const bar of $$(".filters[data-target]")) {
    const target = document.querySelector(bar.dataset.target);
    if (!target) continue;
    const items = $$("[data-cat]", target);
    const status = bar.querySelector("[role=status]");
    bar.hidden = false;
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

  /* ── copy buttons on code blocks ── */
  if (navigator.clipboard) for (const pre of $$("main pre")) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "copy"; b.textContent = "Copy";
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(pre.innerText.replace(/\nCopy$/, "")); b.textContent = "Copied"; }
      catch { b.textContent = "Select and copy"; }
      setTimeout(() => (b.textContent = "Copy"), 1800);
    });
    pre.append(b);
  }

  /* ── the enquiry form (/consult/, /contact/) ──
     FORM_ENDPOINT is the one setting: a Web3Forms / Formspree style URL that accepts a JSON POST.
     Empty → the form opens the visitor's mail app with everything filled in (the mailto fallback). */
  const FORM_ENDPOINT = "";
  const FORM_KEY = "";          // Web3Forms access key, if that service is used; leave empty for Formspree
  for (const form of $$("form.enquiry")) {
    const status = form.querySelector(".form-status");
    const say = (msg, kind) => { status.textContent = msg; status.dataset.kind = kind || ""; };
    form.noValidate = true;
    form.addEventListener("submit", async e => {
      e.preventDefault();
      let first = null;
      for (const f of $$("input, textarea", form)) {
        if (f.name === "website") continue;
        const err = form.querySelector(`#${f.id}-err`);
        const bad = !f.checkValidity();
        f.setAttribute("aria-invalid", String(bad));
        if (err) err.textContent = bad ? (f.validity.valueMissing ? "Please fill this in." : "Please check this.") : "";
        if (bad && !first) first = f;
      }
      if (first) { first.focus(); say("A field needs attention.", "error"); return; }
      const data = Object.fromEntries(new FormData(form));
      if (data.website) return;                                  // honeypot: bots fill it, people never see it
      delete data.website;
      const subject = `Project enquiry from ${data.name}${data.company ? " (" + data.company + ")" : ""}`;
      if (!FORM_ENDPOINT) {
        const body = `Name: ${data.name}\nWork email: ${data.email}\nCompany: ${data.company || "-"}\n\n${data.message}`;
        location.href = `mailto:hello@mokshify.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        say("Your mail app should open with the message ready to send. If it doesn't, write to hello@mokshify.io or use WhatsApp.", "info");
        return;
      }
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true; say("Sending…", "info");
      try {
        const payload = { ...data, subject, from_name: "mokshify.io", ...(FORM_KEY ? { access_key: FORM_KEY } : {}) };
        const res = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        form.classList.add("is-sent");
        say("Thank you — your message is with us. An engineer will reply within 24 hours.", "ok");
        if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: "form_submit", form: form.id });
      } catch {
        say("That didn't go through. Please WhatsApp us or write to hello@mokshify.io.", "error");
      } finally { btn.disabled = false; }
    });
  }

  /* ── conversion events: inert until a tag (GTM/GA4) defines window.dataLayer ── */
  const push = (event, data) => { if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...data }); };
  addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a || !a.href) return;
    const h = a.href, label = (a.textContent || "").trim().slice(0, 80);
    if (h.startsWith("tel:")) push("call_click", { label });
    else if (h.startsWith("mailto:")) push("email_click", { label });
    else if (h.includes("wa.me")) push("whatsapp_click", { label });
    else if (a.classList.contains("btn")) push("cta_click", { label, href: h });
    else if (a.host && a.host !== location.host) push("outbound_click", { href: h });
  }, { passive: true });
  const sent = {};
  addEventListener("scroll", () => {
    const max = root.scrollHeight - innerHeight;
    if (max < 200) return;
    const p = (scrollY / max) * 100;
    for (const q of [25, 50, 75, 100]) if (p >= q && !sent[q]) { sent[q] = 1; push("scroll_depth", { percent: q }); }
  }, { passive: true });
})();
