/* MOKSHIFY - client-side search over search-index.json. Nothing leaves the page. */
(() => {
  "use strict";
  const box = document.querySelector("#q");
  const out = document.querySelector("#sres");
  if (!box) return;
  let idx = null;
  fetch("/search-index.json").then(r => r.json()).then(d => { idx = d; run(); });
  const params = new URLSearchParams(location.search);
  if (params.get("q")) box.value = params.get("q");
  function run() {
    if (!idx) return;
    const q = box.value.trim().toLowerCase();
    if (q.length < 2) { out.innerHTML = ""; return; }
    const terms = q.split(/\s+/);
    const scored = idx.map(p => {
      const hay = (p.t + " " + p.d + " " + p.s).toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (p.t.toLowerCase().includes(t)) score += 3;
        else if (hay.includes(t)) score += 1;
        else return null;
      }
      return { p, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 12);
    out.innerHTML = scored.length
      ? scored.map(({ p }) =>
          `<li><a href="${p.u}"><i>${p.s}</i><b>${p.t}</b><span>${p.d}</span></a></li>`).join("")
      : "<li><a href='/sitemap/'><b>No matches</b><span>Try the full page map instead.</span></a></li>";
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: "site_search", query: q });
  }
  box.addEventListener("input", run);
})();