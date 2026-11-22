/* One-off follow-up to services.mjs for three pages whose deliverables are not in the first section. */
import { readFileSync, writeFileSync } from "node:fs";
import { diagram } from "./services.mjs";
const text = s => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();
const FIX = { "mobile-app-development": "What a mobile engagement includes", "cloud-engineering": "What we do", "product-design": "How we design" };
for (const [slug, h2] of Object.entries(FIX)) {
  const f = `services/${slug}/index.html`;
  let s = readFileSync(f, "utf8");
  const secs = [...s.matchAll(/<section class="section(?: dark)?">[\s\S]*?<\/section>\s*/g)].map(m => m[0]);
  const del = secs.find(x => x.includes('class="diagram delivery"'));
  let target = secs.find(x => x.includes(`<h2>${h2}</h2>`));
  if (!del || !target) throw new Error(slug);
  s = s.replace(del, "");
  s = s.replace(" &middot; What you get", "");
  let t2 = target;
  if (/<h3>/.test(t2) && !/<table/.test(t2)) {                 // h3 + paragraphs → spec rows
    t2 = t2.replace(/<details class="more">\s*<summary>Read more<\/summary>([\s\S]*?)<\/details>/, "$1");
    t2 = t2.replace(/((?:\s*<h3>[\s\S]*?<\/h3>\s*(?:<p>[\s\S]*?<\/p>\s*)+)+)/, m => {
      const rows = [...m.matchAll(/<h3>([\s\S]*?)<\/h3>\s*((?:<p>[\s\S]*?<\/p>\s*)+)/g)]
        .map(r => `    <tr><th scope="row">${r[1]}</th><td>${r[2].trim().replace(/^<p>|<\/p>$/g, "").replace(/<\/p>\s*<p>/g, "<br><br>")}</td></tr>`);
      return `\n      <table class="spec">\n  <tbody>\n${rows.join("\n")}\n  </tbody>\n</table>\n`;
    });
  }
  t2 = t2.replace(/(<p class="label on-spine">\d\d \/ \d\d)/, "$1 &middot; What you get").replace('<div class="section-body">', '<div class="section-body wide">');
  const items = [...t2.matchAll(/<th scope="row">([\s\S]*?)<\/th>/g)].map(m => text(m[1]).split(" — ")[0]);
  const name = text((/<h1>([\s\S]*?)<\/h1>/.exec(s) || [])[1]);
  const fresh = del.replace(/<figure class="diagram delivery">[\s\S]*?<\/figure>/, () => diagram(items, name));
  s = s.replace(target, () => t2.trimEnd() + "\n\n" + fresh);
  writeFileSync(f, s);
  console.log(slug, items.length, "deliverables");
}
