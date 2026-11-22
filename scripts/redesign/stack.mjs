/* One-off: /stack/ → the Reference template: one filterable table instead of six card sections. */
import { readFileSync, writeFileSync } from "node:fs";
const f = "stack/index.html";
let s = readFileSync(f, "utf8");
if (s.includes('id="stack-table"')) { console.log("skip"); process.exit(0); }
const CATS = ["Frontend", "Backend", "Intelligence", "Cloud", "Platform", "Data"];
const starts = [...s.matchAll(/<section class="section(?: dark)?">/g)].map(m => m.index);
const stop = s.indexOf("<!-- include:cta-band -->");
const secs = starts.map((a, i) => { const b = Math.min(starts[i + 1] ?? stop, stop > a ? stop : Infinity); const t = s.slice(a, b); return Object.assign([t], { index: a, 0: t }); });
const rows = [];
let first = null, last = null;
for (const m of secs) {
  const h = /<h2>([^<]+)<\/h2>/.exec(m[0]);
  if (!h || !CATS.includes(h[1])) continue;
  first ??= m.index; last = m.index + m[0].length;
  const cat = h[1].toLowerCase();
  for (const c of m[0].matchAll(/<section><i>([\s\S]*?)<\/i><h3>([\s\S]*?)<\/h3>([\s\S]*?)<\/section>/g))
    rows.push(`    <tr data-cat="${cat}"><th scope="row">${c[2]}</th><td data-th="Role">${h[1]} &middot; ${c[1]}</td><td data-th="Why">${c[3].replace(/^<p>|<\/p>$/g, "").replace(/<\/p>\s*<p>/g, " ")}</td></tr>`);
}
if (!rows.length || first === null) throw new Error("no stack sections found");
const table = `<section class="section">
  <div class="wrap">
    <header class="section-head">
      <p class="label on-spine">00 / 00 &middot; Reference</p>
      <h2>Every technology we run</h2>
    </header>
    <div class="section-body wide">
      <div class="filters" data-target="#stack-table" hidden>
        <button type="button" data-filter="all" aria-pressed="true">All</button>
${CATS.map(c => `        <button type="button" data-filter="${c.toLowerCase()}" aria-pressed="false">${c}</button>`).join("\n")}
        <span role="status">${rows.length} of ${rows.length} shown</span>
      </div>
      <table class="spec ref-table stack" id="stack-table">
  <thead><tr><th scope="col">Technology</th><th scope="col">Role</th><th scope="col">Why we use it</th></tr></thead>
  <tbody>
${rows.join("\n")}
  </tbody>
</table>
    </div>
  </div>
</section>
`;
s = s.slice(0, first) + table + s.slice(last);
writeFileSync(f, s);
console.log("stack table:", rows.length, "rows");
