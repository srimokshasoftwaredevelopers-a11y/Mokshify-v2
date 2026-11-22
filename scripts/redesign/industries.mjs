/* One-off: industry pages → the Industry detail template, plus the new /industries/agriculture/.
   the problems (existing "what we build" table) · a system diagram drawn from that table ·
   the matching live case study · relevant services as an index list · CTA band.
   Safe to re-run: pages already carrying a system diagram are skipped. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { PLAIN } from "./migrate-shell.mjs";

const MAP = {
  healthcare: { cases: ["medico-diagnostics"], services: ["web-application-development", "custom-software-development", "mobile-app-development", "ai-transformation"] },
  fintech: { cases: ["fincalix"], services: ["mobile-app-development", "web-application-development", "api-development", "saas-development"] },
  "real-estate": { cases: ["next-edge-realty", "terravion-properties"], services: ["web-application-development", "product-design", "custom-software-development", "cloud-engineering"] },
  education: { cases: [], services: ["web-application-development", "mobile-app-development", "saas-development", "product-design"] },
  agriculture: { cases: ["aj-agritech"], services: ["web-application-development", "custom-software-development", "mobile-app-development", "product-design"] },
};
const NAMES = { "web-application-development": "Web Applications", "custom-software-development": "Custom Software", "mobile-app-development": "Mobile Apps",
  "ai-transformation": "AI Transformation", "api-development": "API Development", "saas-development": "SaaS Development",
  "product-design": "Product Design", "cloud-engineering": "Cloud & DevOps" };
const text = s => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();
const xml = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const ind = (s, n) => s.split("\n").map(l => (l ? " ".repeat(n) + l : l)).join("\n");
const wrapWords = (s, max) => s.split(" ").reduce((lines, w) => {
  const last = lines[lines.length - 1];
  if (last && (last + " " + w).length <= max) lines[lines.length - 1] = last + " " + w; else lines.push(w);
  return lines;
}, []);

export function systemDiagram(labels, industry) {
  const nodes = ["Your customers", ...labels.slice(0, 5), "Your team"];
  const n = nodes.length, gap = 16, w = (1080 - gap * (n - 1)) / n, y = 70, h = 92;
  const boxes = nodes.map((t, i) => {
    const x = 20 + i * (w + gap), edge = i === 0 || i === n - 1;
    const lines = wrapWords(t, Math.floor(w / 9.2)).slice(0, 3);
    const ty = y + h / 2 - (lines.length - 1) * 10 + 5;
    return `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" fill="${edge ? "#E4E2DC" : "#F6F5F1"}" stroke="${edge ? "rgb(20 16 18 / .3)" : "#B08D57"}"/>` +
      lines.map((l, k) => `<text x="${(x + w / 2).toFixed(1)}" y="${ty + k * 20}" text-anchor="middle" class="${edge ? "dg-i" : "dg-s"}">${xml(l)}</text>`).join("");
  }).join("\n    ");
  return `<figure class="diagram system">
  <svg viewBox="0 0 1120 200" role="img" aria-label="${xml(industry)} system: ${xml(nodes.join(" → "))}">
    <line x1="20" y1="${y + h / 2}" x2="1100" y2="${y + h / 2}" stroke="#B08D57"/>
    <text x="20" y="40" class="dg-n">ONE SYSTEM, END TO END</text>
    ${boxes}
  </svg>
  <figcaption>What we build for ${xml(industry.toLowerCase())}, as one connected system — from the people you serve to the team that runs it.</figcaption>
</figure>`;
}
const section = (label, h2, body) => `<section class="section">
  <div class="wrap">
    <header class="section-head">
      <p class="label on-spine">${label}</p>
      <h2>${h2}</h2>
    </header>
    <div class="section-body wide">
${ind(body, 6)}
    </div>
  </div>
</section>

`;
const servicesList = slugs => `<div class="grid">\n${slugs.map(s => `  <a class="card" href="/services/${s}/"><b>${NAMES[s].replace("&", "&amp;")}</b><span>${PLAIN[`/services/${s}/`]}</span></a>`).join("\n")}\n</div>`;
const casesBlock = cases => `<div class="work">\n${cases.map(c => `  <!-- include:work-${c} -->\n  <!-- /include:work-${c} -->`).join("\n")}\n</div>`;

/* ── the new agriculture page, built in the shape of the other industry pages ── */
const AG = "industries/agriculture/index.html";
if (!existsSync(AG)) {
  mkdirSync("industries/agriculture", { recursive: true });
  const url = "https://mokshify.io/industries/agriculture/";
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://mokshify.io/" },
      { "@type": "ListItem", position: 2, name: "Industries", item: "https://mokshify.io/industries/" },
      { "@type": "ListItem", position: 3, name: "Agriculture", item: url }] },
    { "@type": "WebPage", "@id": url + "#page", url, name: "Agriculture Software & Websites",
      description: "Websites and catalogues for agri-input companies in Andhra Pradesh and Telangana.", isPartOf: { "@id": "https://mokshify.io/#website" },
      about: { "@id": "https://mokshify.io/#org" }, inLanguage: "en-IN" }] };
  writeFileSync(AG, `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agriculture Software &amp; Websites | Mokshify</title>
<meta name="description" content="Websites and catalogues for agri-input companies in Andhra Pradesh and Telangana: Telugu-first, products by crop, dealer enquiries. Live example: AJ Agritech.">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:title" content="Agriculture Software &amp; Websites | Mokshify">
<meta property="og:description" content="Telugu-first websites and product catalogues for agri-input companies. Live example: AJ Agritech.">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://mokshify.io/assets/sites/aj-agritech-plate.webp">
<meta name="twitter:card" content="summary_large_image">
<!-- include:head -->
<!-- /include:head -->
<script type="application/ld+json">
${JSON.stringify(ld)}
</script>
</head>
<body class="t-industry">
<!-- include:nav -->
<!-- /include:nav -->
<main id="main">
<header class="hero dark">
  <div class="wrap">
    <p class="pkicker on-spine"><a href="/industries/">Industries</a> &middot; Agriculture</p>
    <h1><span class="ln"><span>Agri-input websites,</span></span> <span class="ln"><span>in the farmer's language.</span></span></h1>
    <p class="plain">We build websites for agri-input companies — in Telugu first — so farmers and dealers can find the right product for their crop and reach you in one tap.</p>
  </div>
</header>

<section class="section intro">
  <div class="wrap">
    <div class="section-body">
      <p class="plede intro-text">Farmers and dealers decide season by season, on a phone, in their own language. An agri-input brand online has one job: show which product suits which crop, and make the next call easy.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <header class="section-head">
      <p class="label on-spine">00 / 00</p>
      <h2>What we build for agriculture</h2>
    </header>
    <div class="section-body">
      <table class="spec">
        <tbody>
          <tr><th scope="row">Product catalogues</th><td>products by range and by crop, with pack sizes and the crops each one suits. Live example: <a href="/work/aj-agritech/">AJ Agritech</a>.</td></tr>
          <tr><th scope="row">Local languages</th><td>Telugu by default, with Hindi and English, so the catalogue reads the way customers speak.</td></tr>
          <tr><th scope="row">Dealer and farmer enquiries</th><td>dealer enquiry pages, a farmer helpline and an enquiry form that reaches the company's own mailbox.</td></tr>
          <tr><th scope="row">Admin dashboard</th><td>the company adds and edits its own products without waiting on a developer.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- include:cta-band -->
<!-- slot -->
<h2>Selling to farmers and dealers?</h2>
<p>Tell us about your products and your market in one paragraph. An engineer replies within 24 hours.</p>
<!-- /slot -->
<!-- /include:cta-band -->

<section class="related">
  <div class="wrap">
    <p><strong>Related:</strong> <a href="/work/aj-agritech/">AJ Agritech case study</a> &middot; <a href="/services/web-application-development/">Web applications</a> &middot; <a href="/industries/">All industries</a></p>
  </div>
</section>
</main>
<!-- include:footer -->
<!-- /include:footer -->
</body>
</html>
`);
  console.log("created", AG);
}

/* ── education: proof becomes capabilities (SkillForceHub removed) ── */
const ED = "industries/education/index.html";
let ed = readFileSync(ED, "utf8");
if (ed.includes("skillforcehub")) {
  ed = ed.replace(/ Live example: <a href="\/work\/skillforcehub\/">SkillForceHub<\/a>, a Salesforce training institute in Warangal\./, "")
    .replace(/<h2>The lesson our work proved<\/h2>([\s\S]*?<div class="section-body">)[\s\S]*?(\n    <\/div>\n  <\/div>\n<\/section>)/,
      (_, mid, end) => `<h2>What we would build first</h2>${mid}
      <!-- TODO(proof): add an education case study when one exists; this section is capabilities only -->
      <p>A course catalogue with the details that decide enrolment — duration, syllabus, schedule, fees — published as structured data so search engines and parents can read it.</p>
      <p>Enrolment that works on a phone, batch and instructor management behind it, and an admin the institute runs itself.</p>${end}`)
    .replace(/<summary>What have you actually shipped in education\?<\/summary><p>[\s\S]*?<\/p>/,
      `<summary>What have you actually shipped in education?</summary><p>No live education platform we can show you yet. Our shipped work is in real estate, healthcare, agriculture and finance — open it on <a href="/work/">the work page</a>. The engineering underneath is the same.</p>`)
    .replace(/<a href="\/work\/skillforcehub\/">SkillForceHub case study<\/a>/, `<a href="/work/">All case studies</a>`);
  if (ed.includes("skillforcehub")) throw new Error("education still mentions skillforcehub");
  writeFileSync(ED, ed);
  console.log("education rewritten");
}

/* ── every industry page: diagram after "what we build", then live work + services before the FAQ/CTA ── */
for (const [slug, m] of Object.entries(MAP)) {
  const f = `industries/${slug}/index.html`;
  let s = readFileSync(f, "utf8");
  if (s.includes('class="diagram system"')) { console.log("skip", slug); continue; }
  const industry = text((/<p class="pkicker[^"]*">[\s\S]*?&middot;\s*([^<]+)<\/p>/.exec(s) || [])[1] || slug);
  const secs = [...s.matchAll(/<section class="section">[\s\S]*?<\/section>/g)].map(x => x[0]);
  const what = secs.find(x => /<h2>What we build/.test(x));
  if (!what) throw new Error("no what-we-build on " + slug);
  const labels = [...what.matchAll(/<th scope="row">([\s\S]*?)<\/th>/g)].map(x => text(x[1]));
  const what2 = what.replace(/(<p class="label on-spine">\d\d \/ \d\d)/, "$1 &middot; The problems").replace('<div class="section-body">', '<div class="section-body wide">');
  const diag = section("00 / 00 &middot; The system", "How it fits together", systemDiagram(labels, industry));
  s = s.replace(what, () => what2 + "\n\n" + diag.trimEnd());
  const add = (m.cases.length ? section("00 / 00 &middot; Live work", m.cases.length > 1 ? "Built and live" : "Built and live", casesBlock(m.cases)) :
      section("00 / 00 &middot; Live work", "Our live work, elsewhere", `<!-- TODO(proof): no ${industry.toLowerCase()} case study yet -->\n<p>No ${industry.toLowerCase()} project to show yet. Every project we have shipped is live and open to inspect on <a href="/work/">the work page</a>.</p>`))
    + section("00 / 00 &middot; Services", "Services that fit", servicesList(m.services));
  const faq = s.search(/<section class="section(?: dark)?">\s*<div class="wrap">\s*<header class="section-head">\s*<p class="label on-spine">[^<]*<\/p>\s*<h2>Common questions/);
  const at = faq >= 0 ? faq : s.indexOf("<!-- include:cta-band -->");
  s = s.slice(0, at) + add + s.slice(at);
  writeFileSync(f, s);
  console.log("done", slug, labels.length, "labels");
}
