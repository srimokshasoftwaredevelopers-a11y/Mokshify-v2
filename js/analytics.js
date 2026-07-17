/* ═══════════════════════════════════════════════════════════════
   MOKSHIFY — conversion event preparation
   Inert until a real tag (GTM/GA4) defines window.dataLayer.
   No IDs live here; connect Google Tag Manager and these events
   appear ready-named: call_click, email_click, whatsapp_click,
   cta_click, outbound_click, scroll_depth.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  "use strict";
  const push = (event, data) => {
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...data });
  };

  addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a || !a.href) return;
    const h = a.href;
    const label = (a.textContent || "").trim().slice(0, 80);
    if (h.startsWith("tel:")) push("call_click", { label });
    else if (h.startsWith("mailto:")) push("email_click", { label });
    else if (h.includes("wa.me")) push("whatsapp_click", { label });
    else if (a.classList.contains("btn") || a.classList.contains("cta"))
      push("cta_click", { label, href: h });
    else if (a.host && a.host !== location.host)
      push("outbound_click", { href: h });
  }, { passive: true });

  const sent = {};
  addEventListener("scroll", () => {
    const max = document.body.scrollHeight - innerHeight;
    if (max < 200) return;
    const p = (scrollY / max) * 100;
    for (const q of [25, 50, 75, 100])
      if (p >= q && !sent[q]) { sent[q] = 1; push("scroll_depth", { percent: q }); }
  }, { passive: true });
  // dropdown menus: Escape releases keyboard focus so :focus-within closes them
  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const el = document.activeElement;
    if (el && el.closest && el.closest(".nav-explore, .pnav .grp")) el.blur();
  });
})();
