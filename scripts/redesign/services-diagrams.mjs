/* Regenerate every service delivery diagram from its own aria-label (name + deliverables). */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { diagram } from "./services.mjs";
const un = s => s.replace(/&lt;/g, "<").replace(/&amp;/g, "&");
for (const slug of readdirSync("services", { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)) {
  const f = `services/${slug}/index.html`;
  let s = readFileSync(f, "utf8");
  const m = /<figure class="diagram delivery">[\s\S]*?aria-label="How (.*?) is delivered: [^"]*?At the Engineering stage: (.*?)\.">[\s\S]*?<\/figure>/.exec(s);
  if (!m) { console.log("no diagram", slug); continue; }
  s = s.replace(m[0], () => diagram(un(m[2]).split("; "), un(m[1])));
  writeFileSync(f, s);
}
console.log("diagrams refreshed");
