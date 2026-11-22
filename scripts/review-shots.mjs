/* MOKSHIFY — self-review screenshots at 375, 768 and 1440 px with the installed Edge.
   node scripts/review-shots.mjs <template>=<route> […]       (server on :8123)
   → review/<template>/<width>.png (full page) and <width>-top.png (first screen).
   With SLUG=1 files are named <route-slug>-<width>.png, for rollout passes.
   Logs horizontal overflow per width — any > 0 is a failure. */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const BASE = process.env.BASE || "http://localhost:8123";
const WIDTHS = (process.env.WIDTHS || "375,768,1440").split(",").map(Number);
const jobs = process.argv.slice(2).map(a => a.split("="));
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ["--disable-gpu", "--hide-scrollbars"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
for (const [tpl, route] of jobs) {
  const dir = join(ROOT, "review", tpl);
  mkdirSync(dir, { recursive: true });
  const name = process.env.SLUG ? (route.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "home") + "-" : "";
  for (const w of WIDTHS) {
    await page.setViewport({ width: w, height: w < 800 ? 812 : 900, deviceScaleFactor: 1, isMobile: w < 800, hasTouch: w < 800 });
    await page.goto(BASE + route, { waitUntil: "networkidle0", timeout: 30000 });
    await page.evaluate(async () => {                       // let reveals and lazy images settle
      document.querySelectorAll("img[loading=lazy]").forEach(i => (i.loading = "eager"));
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      scrollTo(0, 0); document.querySelectorAll(".will-reveal").forEach(e => e.classList.add("is-in"));
      await Promise.all([...document.images].filter(i => i.offsetParent).map(i => { i.loading = "eager"; return i.decode().catch(() => {}); }));
      await new Promise(r => setTimeout(r, 900));
    });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const wide = await page.evaluate(() => [...document.querySelectorAll("body *")]
      .filter(e => e.getBoundingClientRect().right > innerWidth + 1 && getComputedStyle(e).position !== "fixed")
      .slice(0, 3).map(e => e.tagName.toLowerCase() + "." + [...e.classList].join(".")));
    await page.screenshot({ path: join(dir, `${name}${w}-top.png`) });
    await page.screenshot({ path: join(dir, `${name}${w}.png`), fullPage: true });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log(`${tpl} ${route} @${w}: height ${h}, overflow ${over}${over > 0 ? " " + wide.join(" ") : ""}`);
  }
}
if (errors.length) console.log("page errors:", [...new Set(errors)].join(" | "));
await browser.close();
