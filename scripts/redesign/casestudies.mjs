/* One-off: the four existing case studies → the Case study template.
   plate hero (the live screenshot) · fact strip · problem → build → result · gallery · stack table · next case study.
   Stack rows restate each page's own "Architecture & stack" paragraph — nothing added.
   Safe to re-run: pages already carrying a plate hero are skipped. */
import { readFileSync, writeFileSync } from "node:fs";
import { frame, bySlug } from "./projects.mjs";

const STACK = {
  fincalix: [["Front end", "React"], ["Shared logic", "One calculation library used by the web app and the Android app, so results agree to the last paisa"],
    ["Services", "Node.js APIs"], ["Data", "PostgreSQL and Redis"], ["Pipeline", "GitHub Actions — tests and an AI review before staged rollout"], ["Delivery", "Static, cache-first pages for low-end devices and slow networks"]],
  "medico-diagnostics": [["Front end", "Mobile-first React, fully server-rendered"], ["Services", "Node.js"],
    ["Data", "PostgreSQL for the test catalogue — tests, panels, packages, preparation rules, pricing — with Redis caching hot queries"],
    ["Gateway", "Nginx"], ["Pipeline", "GitHub Actions — tests and AI review on every release"]],
  "terravion-properties": [["Front end", "Content-forward React, fully crawlable"], ["Services", "Node.js"],
    ["Data", "PostgreSQL for project and enquiry data, Redis for caching"], ["Gateway", "Nginx"], ["Pipeline", "GitHub Actions — tested and AI-reviewed"]],
};
const META = {
  fincalix: { shot: "fincalix", host: "fincalix.com", url: "https://fincalix.com/", industry: "Finance", kind: "Our product", next: "qflow" },
  "medico-diagnostics": { shot: "medico-services", host: "medicodiagnostics.in", url: "https://medicodiagnostics.in/", industry: "Healthcare", kind: "Client website", next: "aj-agritech" },
  "terravion-properties": { shot: "terravion-about", host: "terravionproperties.com", url: "https://terravionproperties.com/", industry: "Real estate", kind: "Client website", next: "medico-diagnostics" },
  "mokshify-website": { shot: "mokshify-website", host: "mokshify.io", url: "https://mokshify.io/", industry: "Engineering", kind: "Our product", next: "next-edge-realty" },
};
const ind = (s, n) => s.split("\n").map(l => (l ? " ".repeat(n) + l : l)).join("\n");
const table = rows => `<table class="spec">\n  <tbody>\n${rows.map(([a, b]) => `    <tr><th scope="row">${a}</th><td>${b}</td></tr>`).join("\n")}\n  </tbody>\n</table>`;
const section = (label, h2, body) => `<section class="section">
  <div class="wrap">
    <header class="section-head">
      <p class="label on-spine">${label}</p>
      ${h2 ? `<h2>${h2}</h2>` : ""}
    </header>
    <div class="section-body wide">
${ind(body, 6)}
    </div>
  </div>
</section>`;

for (const [slug, m] of Object.entries(META)) {
  const f = `work/${slug}/index.html`;
  let s = readFileSync(f, "utf8");
  if (s.includes('class="hero plate hero-case"')) { console.log("skip", slug); continue; }
  const p = { slug, name: "", ...m, line: "", facts: [] };

  // FinCalix: the calculator count and languages from the live site (the brief asks for this update)
  if (slug === "fincalix") {
    s = s.replace("<li><b>30+</b><i>calculators</i></li>", "<li><b>47</b><i>calculators</i></li><li><b>6</b><i>Indian languages</i></li>")
      .replace("and 30+ other calculators", "and 40+ other calculators")
      .replace("<strong>Breadth without bloat.</strong> 30+ calculators", "<strong>Breadth without bloat.</strong> 47 calculators")
      .replace("<li>30+ calculators live, spanning loans, savings, tax and retirement.</li>",
        "<li>47 calculators live, spanning loans, savings, tax and retirement, plus 7 trackers and planners.</li>\n<li>Works offline in the Android app, in six Indian languages, with no ads.</li>\n<!-- TODO(confirm): iOS availability — the owner's brief says live on Google Play and iOS; fincalix.com links only to Google Play on 23 Nov 2026 -->");
  }

  // 1 · hero → plate from the live capture; facts leave the hero for the strip
  const hero = /<header class="hero dark">([\s\S]*?)<\/header>/.exec(s);
  let heroInner = hero[1];
  const facts = (/\s*<ul class="facts">[\s\S]*?<\/ul>/.exec(heroInner) || [""])[0];
  heroInner = heroInner.replace(facts, "").replace(/(\n  <\/div>\n)$/, `\n    <div class="hero-actions"><a class="btn" href="${m.url}" rel="noopener">Open ${m.host} ↗</a></div>$1`);
  s = s.replace(hero[0], () => `<header class="hero plate hero-case">
  <figure class="hero-img"><img src="/assets/sites/${m.shot}-plate.webp" alt="" width="1600" height="1000" fetchpriority="high" decoding="async"></figure>${heroInner}</header>

${section("Fact strip", "", table([["Industry", m.industry], ["Type", m.kind], ["Live at", `<a href="${m.url}" rel="noopener">${m.host}</a>`]]).replace('class="spec"', 'class="spec strip-table"') + (facts ? "\n" + facts.trim() : ""))}`);

  // 2 · the old full-size PNG figure goes; a framed gallery (desktop + phone) follows the results
  s = s.replace(/\s*<figure>\s*<img src="\/assets\/sites\/[a-z]+\.png"[\s\S]*?<\/figure>/, "");
  s = s.replace(/<section class="section">\s*<div class="wrap">\s*<div class="section-body">\s*<\/div>\s*<\/div>\s*<\/section>\s*/g, "");
  const gallery = section("00 / 00 &middot; Gallery", "Gallery", `<div class="gallery">
  <figure>${frame(p)}<figcaption>Desktop, 1440 px — captured from the live site on 23 Nov 2026.</figcaption></figure>
  <figure><div class="frame phone"><div class="frame-view"><img src="/assets/sites/${m.shot}-m.webp" alt="${m.host} on a phone" width="600" height="2597" loading="lazy" decoding="async"></div></div><figcaption>Phone, 390 px.</figcaption></figure>
</div>`);
  const results = [...s.matchAll(/<section class="section(?: dark)?">[\s\S]*?<\/section>/g)].map(x => x[0]).find(x => /<h2>(Results|Performance &amp; deployment)<\/h2>/.test(x));
  if (results) s = s.replace(results, () => results + "\n\n" + gallery);

  // 3 · a stack table at the top of "Architecture & stack"; the prose stays beneath it
  if (STACK[slug]) s = s.replace(/(<h2>Architecture &amp; stack<\/h2>\s*<\/header>\s*<div class="section-body)">/,
    (_, a) => `${a} wide">\n      ${table(STACK[slug]).split("\n").join("\n      ")}`);

  // 4 · next case study, after the CTA band
  s = s.replace("<!-- /include:cta-band -->", `<!-- /include:cta-band -->

${section("Next case study", "", `<!-- include:work-${m.next} -->\n<!-- /include:work-${m.next} -->`).replace('<section class="section">', '<section class="section next-case">')}`);
  s = s.replace('<body class="t-case">', '<body class="t-case">');
  writeFileSync(f, s);
  console.log("done", slug);
}
