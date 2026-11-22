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

  /* ── one short fade-and-rise as content enters, below the first screen only ── */
  if (!reduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }, { rootMargin: "0px 0px -8% 0px" });
    for (const el of $$("main .section-head, main .section-body, main .band .wrap, main .work-row")) {
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("will-reveal"); io.observe(el); }
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
