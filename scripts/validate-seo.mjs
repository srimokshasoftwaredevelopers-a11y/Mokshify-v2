import { readFileSync } from "node:fs";
import puppeteer from "puppeteer-core";

const html = readFileSync("d:/Mokshify/index.html", "utf8");
const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
const g = JSON.parse(m[1]);
console.log("JSON-LD OK —", g["@graph"].length, "nodes:", g["@graph"].map(n => n["@type"]).join(", "));

const b = await puppeteer.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true, args: ["--disable-gpu"],
});
const pg = await b.newPage();
const errs = [];
pg.on("pageerror", e => errs.push(e.message));
await pg.setViewport({ width: 1440, height: 900 });
await pg.goto("http://localhost:8123/index.html?v=seo" + Date.now(), { waitUntil: "load", timeout: 25000 });
await new Promise(r => setTimeout(r, 2500));
const ok = await pg.evaluate(() => ({
  title: document.title,
  canvas: !!document.querySelector(".cinema-canvas"),
  heroOn: document.querySelector(".hero-title").classList.contains("on"),
  manifest: !!document.querySelector("link[rel=manifest]"),
  og: document.querySelector('meta[property="og:image"]').content,
  hreflang: document.querySelectorAll("link[hreflang]").length,
}));
console.log(JSON.stringify(ok), "pageErrors:", errs.length ? errs : "none");
await b.close();
process.exit(0);
