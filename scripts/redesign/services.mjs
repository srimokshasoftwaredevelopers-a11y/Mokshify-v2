/* One-off: service pages → the Service detail template.
   what you get (spec table) · how it is delivered (diagram) · one case study · engagement options.
   Copy is only re-laid-out; the diagram is built from each page's own deliverables.
   Safe to re-run: pages already carrying a delivery diagram are skipped. */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { splitTop } from "./migrate-shell.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
/* the case study each service shows; "same team" where no project is a direct match */
const CASE = {
  "ai-product-development": ["qflow", "same"], "ai-transformation": ["aj-agritech", "same"],
  "custom-software-development": ["aj-agritech", "match"], "saas-development": ["qflow", "match"],
  "web-application-development": ["next-edge-realty", "match"], "mobile-app-development": ["fincalix", "match"],
  "cloud-engineering": ["medico-diagnostics", "match"], "api-development": ["fincalix", "match"],
  "product-design": ["terravion-properties", "match"], "legacy-modernization": ["next-edge-realty", "same"],
};
const STAGES = ["Idea", "Research", "UX", "Architecture", "Engineering", "Cloud", "Launch", "Scale"];
const text = s => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();
const xml = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const ind = (s, n) => s.split("\n").map(l => (l ? " ".repeat(n) + l : l)).join("\n");

export function diagram(items, name) {
  const x = i => 40 + i * 134;
  const ticks = STAGES.map((s, i) => `<g><line x1="${x(i)}" y1="52" x2="${x(i)}" y2="68" stroke="#B08D57"/><text x="${x(i)}" y="36" class="dg-n">${String(i + 1).padStart(2, "0")}</text><text x="${x(i)}" y="98" class="dg-s">${s}</text></g>`).join("\n    ");
  const ex = x(4), list = items.slice(0, 5);
  const box = list.map((t, i) => `<text x="${ex + 18}" y="${168 + i * 26}" class="dg-i">${xml(t.length > 44 ? t.slice(0, 43) + "…" : t)}</text>`).join("\n    ");
  const h = 150 + list.length * 26;
  return `<figure class="diagram delivery">
  <svg viewBox="0 0 1120 ${h + 20}" role="img" aria-label="How ${xml(name)} is delivered: ${STAGES.join(", ")}. At the Engineering stage: ${xml(list.join("; "))}.">
    <line x1="${x(0)}" y1="60" x2="${x(7)}" y2="60" stroke="#B08D57"/>
    ${ticks}
    <line x1="${ex}" y1="110" x2="${ex}" y2="${h}" stroke="#B08D57"/>
    <rect x="${ex}" y="136" width="${1080 - ex}" height="${h - 120}" fill="none" stroke="rgb(20 16 18 / .16)"/>
    <text x="${ex + 18}" y="132" class="dg-n" dy="-6">WHAT THIS SERVICE ADDS</text>
    ${box}
  </svg>
  <figcaption>Every engagement runs the same eight stages — see <a href="/process/">the process</a>. What changes per service is what gets built at the Engineering stage.</figcaption>
</figure>`;
}
const section = (label, h2, body, extra = "") => `<section class="section${extra}">
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

for (const [slug, [caseSlug, fit]] of Object.entries(CASE)) {
  const file = join(ROOT, "services", slug, "index.html");
  let src = readFileSync(file, "utf8");
  if (src.includes('class="diagram delivery"')) { console.log("skip", slug); continue; }
  const name = text((/<h1>([\s\S]*?)<\/h1>/.exec(src) || [])[1] || slug);

  // the first content section after the intro is "what you get"
  const secs = [...src.matchAll(/<section class="section(?: dark)?">[\s\S]*?<\/section>/g)].filter(m => !m[0].includes("intro-text"));
  const first = secs[0];
  let items = [];
  let firstHtml = first[0];
  const bodyM = /(<div class="section-body[^"]*">)([\s\S]*?)(\n    <\/div>\n  <\/div>\n<\/section>)$/.exec(firstHtml);
  if (bodyM) {
    let inner = bodyM[2].replace(/<details class="more">\s*<summary>Read more<\/summary>([\s\S]*?)<\/details>/, "$1");
    const nodes = splitTop(inner);
    if (nodes.some(n => n.tag === "h3")) {               // h3 + paragraphs → spec rows
      const lead = [], rows = [];
      for (const n of nodes) {
        if (n.tag === "h3") rows.push([n.html.replace(/<\/?h3[^>]*>/g, ""), []]);
        else if (rows.length) rows[rows.length - 1][1].push(n.html.replace(/^<p>|<\/p>$/g, ""));
        else lead.push(n.html);
      }
      const table = `<table class="spec">\n  <tbody>\n${rows.map(([a, b]) => `    <tr><th scope="row">${a}</th><td>${b.join("<br><br>")}</td></tr>`).join("\n")}\n  </tbody>\n</table>`;
      inner = "\n" + ind([...lead, table].join("\n"), 6);
      items = rows.map(r => text(r[0]));
    }
    firstHtml = firstHtml.replace(bodyM[0], bodyM[1] + inner + bodyM[3]).replace('<div class="section-body">', '<div class="section-body wide">');
  }
  if (!items.length) items = [...firstHtml.matchAll(/<th scope="row">([\s\S]*?)<\/th>/g)].map(m => text(m[1]));
  if (!items.length) items = [...firstHtml.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => text(m[1]).split(/[.—:-]/)[0].trim()).filter(Boolean);
  firstHtml = firstHtml.replace(/(<p class="label on-spine">\d\d \/ \d\d)/, "$1 &middot; What you get");
  src = src.replace(first[0], () => firstHtml);

  const delivery = section("00 / 00 &middot; How it is delivered", "How it is delivered", diagram(items, name));
  const caseSec = section(`00 / 00 &middot; ${fit === "match" ? "Recent work" : "Built by the same team"}`,
    fit === "match" ? "Recent work" : "Built by the same team",
    `${fit === "same" ? "<!-- TODO(proof): no published case study for this service yet; this shows the same team's delivery -->\n" : ""}<div class="work">\n  <!-- include:work-${caseSlug} -->\n  <!-- /include:work-${caseSlug} -->\n</div>`);
  const engage = section("00 / 00 &middot; Engagement", "Ways to engage", "<!-- include:engagements -->\n<!-- /include:engagements -->");

  // delivery right after "what you get"; case study + engagement before the FAQ (or the CTA band)
  src = src.replace(firstHtml, () => firstHtml + "\n\n" + delivery.trimEnd());
  const faq = src.search(/<section class="section(?: dark)?">\s*<div class="wrap">\s*<header class="section-head">\s*<p class="label on-spine">[^<]*<\/p>\s*<h2>Common questions/);
  const at = faq >= 0 ? faq : src.indexOf("<!-- include:cta-band -->");
  src = src.slice(0, at) + caseSec + engage + src.slice(at);
  writeFileSync(file, src);
  console.log("done", slug, `(${items.length} deliverables, case ${caseSlug}/${fit})`);
}
