/* One-off: move every inner page onto the new shell.
   - head assets, nav and footer become include regions (scripts/build.mjs fills them)
   - <main class="pwrap"> becomes hero + sections (+ CTA band + related links)
   - every "Book a strategy call" goes to /consult/
   Copy, metadata and JSON-LD are not touched. Safe to re-run: migrated pages are skipped.

   node scripts/redesign/migrate-shell.mjs [--dry] */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKIP = new Set(["node_modules", ".git", "frames", "assets", "assets-test", "scripts", "src",
  "docs", "marketing", "partials", "css", "js", ".well-known", ".claude", ".agents", "shots"]);
const dry = process.argv.includes("--dry");

export const template = route => {
  if (/^\/(services|industries|work|engineering|resources|library|guides)\/$/.test(route)) return "hub";
  if (route.startsWith("/services/")) return "service";
  if (route.startsWith("/industries/")) return "industry";
  if (route.startsWith("/work/")) return "case";
  if (/^\/(library|guides|legal)\/.+/.test(route) || route === "/journal/" || route === "/decisions/") return "long";
  if (/^\/(stack|benchmarks|architecture|devops)\/$/.test(route)) return "reference";
  if (route === "/estimate/" || route.startsWith("/tools/")) return "tool";
  if (/^\/(about|process|enterprise|security|careers|brand|quality)\/$/.test(route)) return "company";
  if (/^\/(consult|contact)\/$/.test(route)) return "conversion";
  return "utility";
};
// hero variant per template: case studies get a plate later (screenshot), long-form reads on paper
const HERO = { long: "paper", reference: "dark compact", tool: "dark compact", utility: "dark compact", case: "dark" };

/* one plain sentence a shop owner understands, above the existing (technical) lede */
export const PLAIN = {
  "/services/": "We design, build and run websites, mobile apps and business software — and stay to keep them working.",
  "/industries/": "We have built live websites for property developers, diagnostic labs, an agri-inputs company and a temple. Here is what each one needed.",
  "/work/": "Every project on this page is a real website or app that is live today. Open it and check.",
  "/engineering/": "This is where our engineers write down how we build software, so you can check our thinking before you hire us.",
  "/resources/": "Free checklists and guides to help you plan a software project. No sign-up needed.",
  "/library/": "Plain explanations of how good software is put together, written by the people who build ours.",
  "/services/ai-product-development/": "We build software that uses AI to do real work — answering questions, reading documents, drafting replies — and we test it so the answers are correct.",
  "/services/ai-transformation/": "We find the slow, repetitive work in your business and use AI to take it off your team's hands, with a person still checking what matters.",
  "/services/custom-software-development/": "When ready-made software doesn't fit how your business works, we build software that does.",
  "/services/saas-development/": "We build online software that many customers can sign up for and use, ready to grow from the first customer.",
  "/services/web-application-development/": "We build the websites and web apps your customers and staff use every day — catalogues, bookings, dashboards and admin panels.",
  "/services/mobile-app-development/": "We build Android and iPhone apps from one codebase, connected to the same system as your website.",
  "/services/cloud-engineering/": "We set up and look after the servers your website and apps run on, so they stay fast, safe and online.",
  "/services/api-development/": "We connect your software to other systems — payments, apps, partners — so data moves between them without manual work.",
  "/services/product-design/": "We design how your website or app looks and works before we build it, so customers find what they need without help.",
  "/services/legacy-modernization/": "If your old software is slow, fragile or hard to change, we improve it step by step without stopping your business.",
  "/industries/healthcare/": "We build websites for diagnostic labs and clinics where patients can find a test, check the price and book.",
  "/industries/fintech/": "We build financial calculators and money apps that give people exact answers they can trust.",
  "/industries/real-estate/": "We build property websites that show every project and plot clearly and turn visitors into enquiries.",
  "/industries/education/": "We build websites and learning platforms for training institutes, schools and coaching centres.",
};

/* pages whose copy describes the homepage film: one dated line, copy untouched */
export const FILM_PAGES = new Set(["/work/mokshify-website/", "/benchmarks/", "/journal/", "/about/", "/legal/accessibility/",
  "/architecture/", "/brand/", "/security/", "/services/cloud-engineering/", "/services/product-design/", "/sitemap/",
  "/work/", "/library/caching-strategy/", "/library/observability/", "/devops/"]);
const FILM_NOTE = `<p class="note"><span class="label">Updated 23 Nov 2026</span> The scroll film this page describes was retired from the homepage in the November 2026 redesign. The text below is kept as the record of how it was built.</p>`;

/* <ul> where every item opens with <strong> → a two-column spec table */
function specTable(ulHtml) {
  const items = splitTop(ulHtml.replace(/^<ul[^>]*>/, "").replace(/<\/ul>$/, ""));
  if (items.length < 2 || !items.every(n => n.tag === "li")) return null;
  const rows = [];
  for (const li of items) {
    const m = /^\s*<strong>([\s\S]*?)<\/strong>\s*(?:[—–-]|:)?\s*([\s\S]*)$/.exec(inner(li));
    if (!m) return null;
    const label = m[1].replace(/[.:]\s*$/, "").trim();
    rows.push(`<tr><th scope="row">${label}</th><td>${m[2].trim() || ""}</td></tr>`);
  }
  return `<table class="spec">\n  <tbody>\n${rows.map(r => "    " + r).join("\n")}\n  </tbody>\n</table>`;
}
/* the same list, on a hub, where each item is one link → an index list */
function indexList(ulHtml) {
  const items = splitTop(ulHtml.replace(/^<ul[^>]*>/, "").replace(/<\/ul>$/, ""));
  if (items.length < 2 || !items.every(n => n.tag === "li")) return null;
  const rows = [];
  for (const li of items) {
    const m = /^\s*<strong><a href="([^"]+)">([\s\S]*?)<\/a><\/strong>\s*(?:[—–-]|:)?\s*([\s\S]*)$/.exec(inner(li));
    if (!m || /<a\b/.test(m[3])) return null;
    rows.push(`<a class="card" href="${m[1]}"><b>${m[2]}</b><span>${m[3].trim()}</span></a>`);
  }
  return `<div class="grid index">\n${rows.map(r => "  " + r).join("\n")}\n</div>`;
}
const LISTY = new Set(["hub", "service", "industry", "company", "conversion", "reference", "case"]);
function relist(nodes, tpl) {
  if (!LISTY.has(tpl)) return nodes;
  return nodes.map(n => {
    if (n.tag !== "ul") return n;
    const html = (tpl === "hub" && indexList(n.html)) || specTable(n.html);
    return html ? { ...n, tag: html.startsWith("<table") ? "table" : "div", html } : n;
  });
}
/* long sections on owner-facing pages: first two blocks stay, the rest folds behind "Read more" */
const FOLDABLE = new Set(["p", "h3", "ul", "ol", "blockquote"]);
function fold(nodes, tpl) {
  if (!["service", "industry", "company", "case"].includes(tpl)) return nodes;
  const chars = nodes.reduce((a, n) => a + text(n.html).length, 0);
  if (nodes.length < 4 || chars < 1100) return nodes;
  let keep = 2;
  if (nodes[1] && nodes[1].tag === "h3") keep = 3;
  const rest = nodes.slice(keep);
  if (!rest.every(n => FOLDABLE.has(n.tag))) return nodes;
  return [...nodes.slice(0, keep), { tag: "details", attrs: "", html:
    `<details class="more">\n  <summary>Read more</summary>\n${ind(rest.map(n => n.html).join("\n"), 2)}\n</details>` }];
}
/* "Title <em>accent.</em>" → two clip-reveal lines; the words are unchanged */
function lines(h1) {
  const m = /^<h1([^>]*)>([\s\S]*?)<\/h1>$/.exec(h1.trim());
  if (!m) return h1;
  const parts = m[2].split(/(<em>[\s\S]*?<\/em>)/).map(s => s.replace(/<\/?em>/g, "").trim()).filter(Boolean);
  return `<h1${m[1]}>${parts.map(p => `<span class="ln"><span>${p}</span></span>`).join(" ")}</h1>`;
}

const VOID = new Set(["img", "br", "hr", "input", "meta", "link", "source", "wbr", "col"]);
/* split an HTML fragment into its top-level nodes */
export function splitTop(html) {
  const nodes = [];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let m, depth = 0, start = 0, last = 0, open = null;
  while ((m = re.exec(html))) {
    if (m[0].startsWith("<!--")) continue;
    const tag = m[2].toLowerCase(), closing = m[1] === "/";
    const self = VOID.has(tag) || /\/\s*$/.test(m[3]);
    if (!closing) {
      if (depth === 0) {
        const text = html.slice(last, m.index).trim();
        if (text) nodes.push({ tag: "#text", attrs: "", html: text });
        start = m.index; open = { tag, attrs: m[3] };
      }
      if (self) { if (depth === 0) { nodes.push({ ...open, html: html.slice(start, re.lastIndex) }); last = re.lastIndex; } }
      else depth++;
    } else if (--depth === 0) {
      nodes.push({ ...open, html: html.slice(start, re.lastIndex) });
      last = re.lastIndex;
    }
  }
  const tail = html.slice(last).trim();
  if (tail) nodes.push({ tag: "#text", attrs: "", html: tail });
  if (depth !== 0) throw new Error("unbalanced markup, depth " + depth);
  return nodes;
}
const cls = n => (/class="([^"]*)"/.exec(n.attrs) || [, ""])[1].split(/\s+/);
const has = (n, c) => cls(n).includes(c);
const inner = n => n.html.replace(/^<[^>]*>/, "").replace(/<\/[^>]*>$/, "");
const text = s => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&[a-z#0-9]+;/g, " ").trim();
const slug = s => text(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
const pad2 = n => String(n).padStart(2, "0");
const ind = (s, n) => s.split("\n").map(l => (l ? " ".repeat(n) + l : l)).join("\n");

/* the old palette, as drawn into inline SVG diagrams → the token colours */
const RECOLOUR = {
  "#5A1423": "#4A1422", "#3E0D18": "#2A0A12", "#7A2233": "#4A1422",
  "#F1EAE1": "#E4E2DC", "#FDFBF7": "#F6F5F1", "#F7F2EC": "#F6F5F1", "#F6E3D4": "#F6F5F1",
  "#D9CBBB": "#B9B6AE", "#C9917B": "#B08D57", "#E8C4AE": "#B08D57",
  "#25180F": "#141012", "#5C4A3D": "#4E4A4B", "#8A7060": "#4E4A4B",
};
const recolour = html => html
  .replace(/#[0-9A-Fa-f]{6}\b/g, h => RECOLOUR[h.toUpperCase()] || h)
  .replace(/IBM Plex Mono/g, "JetBrains Mono");

/* the page's CTA copy goes into the cta-band partial's slot; buttons come from the partial */
function band(node, route, log) {
  const kids = splitTop(inner(node));
  const row = kids.find(k => has(k, "row"));
  const copy = kids.filter(k => k !== row).map(k => k.html);
  const also = [];
  if (row) for (const a of row.html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const [, href, label] = a;
    if (/strategy\s+call/i.test(label) || /wa\.me/.test(href) || href.startsWith("/consult/")) continue;
    also.push(`<a href="${href}"${/^https?:/.test(href) ? ' rel="noopener"' : ""}>${label.trim()}</a>`);
  }
  log.also += also.length;
  if (also.length) copy.push(`<p class="also">Or: ${also.join(" &middot; ")}</p>`);
  return `<!-- include:cta-band -->\n<!-- slot -->\n${copy.join("\n")}\n<!-- /slot -->\n<!-- /include:cta-band -->`;
}

function rebuildMain(mainInner, route, log) {
  const tpl = template(route);
  let nodes = splitTop(mainInner);

  // hero: kicker, h1, lede, byline, fact strip — whatever opens the page
  const isHero = n => has(n, "pkicker") || n.tag === "h1" || has(n, "plede") || has(n, "pmeta") || has(n, "facts");
  let i = 0;
  const heroNodes = [];
  while (i < nodes.length && isHero(nodes[i])) heroNodes.push(nodes[i++]);
  nodes = nodes.slice(i);
  const plain = PLAIN[route];
  const lede = plain ? heroNodes.filter(n => has(n, "plede")) : [];
  const heroHtml = heroNodes.filter(n => !lede.includes(n)).map(n => {
    if (has(n, "pkicker")) return n.html.replace('class="pkicker"', 'class="pkicker on-spine"');
    if (n.tag === "h1") return lines(n.html) + (plain ? `\n<p class="plain">${plain}</p>` : "");
    return n.html;
  }).join("\n");
  const surface = HERO[tpl] || "dark";
  const out = [`<header class="hero ${surface}">\n  <div class="wrap">\n${ind(heroHtml, 4)}\n  </div>\n</header>`];
  // the technical lede moves just below the hero, intact
  if (lede.length) out.push(`<section class="section intro">\n  <div class="wrap">\n    <div class="section-body">\n${ind(lede.map(n => n.html.replace('class="plede"', 'class="plede intro-text"')).join("\n"), 6)}\n    </div>\n  </div>\n</section>`);
  if (FILM_PAGES.has(route)) nodes.unshift({ tag: "p", attrs: ' class="note"', html: FILM_NOTE });

  // tail: CTA band, then related links after an <hr>
  let bandNode = null, related = [];
  const bi = nodes.findIndex(n => has(n, "pcta"));
  if (bi >= 0) { bandNode = nodes[bi]; related = nodes.slice(bi + 1); nodes = nodes.slice(0, bi); }
  else {
    let hi = -1;
    for (let k = nodes.length - 1; k >= 0; k--) if (nodes[k].tag === "hr") { hi = k; break; }
    if (hi >= 0 && nodes.slice(hi + 1).every(n => n.tag === "p")) { related = nodes.slice(hi); nodes = nodes.slice(0, hi); }
  }
  related = related.filter(n => n.tag !== "hr");

  if (tpl === "long") {
    const toc = [];
    const body = nodes.map(n => {
      if (n.tag !== "h2") return n.html;
      let id = (/id="([^"]*)"/.exec(n.attrs) || [])[1];
      let html = n.html;
      if (!id) { id = slug(inner(n)); html = html.replace(/^<h2/, `<h2 id="${id}"`); }
      toc.push(`<li><a href="#${id}">${text(inner(n))}</a></li>`);
      return html;
    }).join("\n");
    const tocHtml = toc.length > 1
      ? `<nav class="toc" aria-label="On this page">\n  <p class="label on-spine">On this page</p>\n  <ol>\n${ind(toc.join("\n"), 4)}\n  </ol>\n</nav>\n` : "";
    out.push(`<div class="wrap long">\n${ind(tocHtml, 2)}  <article class="prose">\n${ind(body, 4)}\n  </article>\n</div>`);
  } else {
    // group the remaining nodes into sections at every <h2>
    const groups = [];
    for (const n of nodes) {
      if (n.tag === "h2" || !groups.length) groups.push({ h2: n.tag === "h2" ? n : null, body: n.tag === "h2" ? [] : [n] });
      else groups[groups.length - 1].body.push(n);
    }
    let num = 0, sec = 0;
    const total = groups.filter(g => g.h2).length;
    for (const g of groups) {
      sec++;
      const dark = tpl === "company" && sec % 2 === 0 ? " dark" : "";
      const label = g.h2 ? `${pad2(++num)} / ${pad2(total)}` : "";
      const head = g.h2
        ? `    <header class="section-head">\n      <p class="label on-spine">${label}</p>\n      ${g.h2.html}\n    </header>\n` : "";
      const wide = tpl === "reference" || tpl === "tool" ? " wide" : "";
      const body = fold(relist(g.body, tpl), tpl);
      out.push(`<section class="section${dark}">\n  <div class="wrap">\n${head}    <div class="section-body${wide}">\n${ind(body.map(n => n.html).join("\n"), 6)}\n    </div>\n  </div>\n</section>`);
    }
  }
  if (bandNode) out.push(band(bandNode, route, log));
  if (related.length) out.push(`<section class="related">\n  <div class="wrap">\n${ind(related.map(n => n.html).join("\n"), 4)}\n  </div>\n</section>`);
  return out.join("\n\n");
}

const pages = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (!SKIP.has(e)) walk(p); }
    else if (e === "index.html" && dir !== ROOT) pages.push(p);
  }
})(ROOT);

const log = { done: 0, skipped: 0, also: 0, problems: [] };
for (const file of pages) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const route = "/" + rel.replace(/index\.html$/, "");
  let src = readFileSync(file, "utf8");
  if (src.includes("<!-- include:nav -->")) { log.skipped++; continue; }
  try {
    const before = text(src.replace(/<head>[\s\S]*?<\/head>/, "").replace(/<nav class="pnav"[\s\S]*?<\/nav>/, "").replace(/<footer class="pfoot"[\s\S]*?<\/footer>/, ""));

    // head: one include replaces the per-page font, icon and stylesheet lines
    src = src
      .replace(/^[ \t]*<meta name="theme-color"[^>]*>\r?\n/m, "")
      .replace(/^[ \t]*<link rel="icon"[^>]*>\r?\n/m, "")
      .replace(/^[ \t]*<link rel="apple-touch-icon"[^>]*>\r?\n/m, "")
      .replace(/^[ \t]*<link rel="preconnect"[^>]*>\r?\n/gm, "")
      .replace(/^[ \t]*<link href="https:\/\/fonts\.googleapis\.com[^>]*>\r?\n/m, "");
    if (!/<link rel="stylesheet" href="\/css\/pages\.css">/.test(src)) throw new Error("no pages.css link");
    src = src.replace(/<link rel="stylesheet" href="\/css\/pages\.css">/, "<!-- include:head -->\n<!-- /include:head -->");

    const tpl = template(route);
    src = src.replace(/<body>/, `<body class="t-${tpl}${tpl === "long" ? " paper" : ""}">`);
    if (!/<nav class="pnav"[\s\S]*?<\/nav>/.test(src)) throw new Error("no nav");
    src = src.replace(/<nav class="pnav"[\s\S]*?<\/nav>/, "<!-- include:nav -->\n<!-- /include:nav -->\n");
    if (!/<footer class="pfoot"[\s\S]*?<\/footer>/.test(src)) throw new Error("no footer");
    src = src.replace(/<footer class="pfoot"[\s\S]*?<\/footer>\s*(<script src="\/js\/analytics\.js" defer><\/script>)?/, () => "<!-- include:footer -->\n<!-- /include:footer -->");
    src = src.replace(/^[ \t]*<script src="\/js\/analytics\.js" defer><\/script>\r?\n/m, "");

    const mm = /<main class="pwrap">([\s\S]*?)<\/main>/.exec(src);
    if (!mm) throw new Error("no <main class=pwrap>");
    let main = rebuildMain(mm[1], route, log);
    main = recolour(main).replace(/ style="margin:2\.4em 0"/g, "");
    src = src.replace(mm[0], () => `<main id="main">\n${main}\n</main>\n`);

    // every strategy-call CTA points at /consult/
    src = src.replace(/href="mailto:[^"]*"([^>]*>\s*Book (?:a )?[Ss]trategy [Cc]all)/g, 'href="/consult/"$1');

    // nothing a reader sees may be lost (band buttons and <hr> aside)
    const after = text(src.replace(/<head>[\s\S]*?<\/head>/, ""));
    const norm = s => s.replace(/Book a strategy call|WhatsApp us|Next step|On this page|\bOr:|·|\b\d\d\b/g, "").replace(/\s+/g, "");
    const lost = norm(before).length - norm(after).length;
    if (lost > 80 || lost < -700) log.problems.push(`${route}: visible text changed by ${-lost} chars`);

    if (!dry) writeFileSync(file, src);
    log.done++;
  } catch (e) { log.problems.push(`${route}: ${e.message}`); }
}
console.log(JSON.stringify({ ...log, problems: log.problems.length }), "\n" + log.problems.join("\n"));
