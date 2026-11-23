/* Self-review screenshots: every listed screen at 390 and 1440 px into review/<phase>/.
   Also reports horizontal overflow and console errors (CSP violations show up here).
     npx tsx scripts/review.ts <phase> /today /leads …      (server on REVIEW_BASE, default http://localhost:3100)
   Signs in with REVIEW_EMAIL / REVIEW_PASSWORD (the local demo owner). "/login" is shot signed out. */
import { mkdirSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";

const [phase = "misc", ...routes] = process.argv.slice(2);
const BASE = process.env.REVIEW_BASE ?? "http://localhost:3100";
const OUT = `review/${phase}`;
mkdirSync(OUT, { recursive: true });
const name = (r: string) => (r.replace(/^\/|\/$/g, "").replace(/[/?=&]+/g, "-") || "root");

async function signIn(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', process.env.REVIEW_EMAIL ?? "owner@example.com");
  await page.fill('input[name="password"]', process.env.REVIEW_PASSWORD ?? "");
  await Promise.all([page.waitForURL(/\/today/), page.click('button:has-text("Sign in")')]);
}

const browser = await chromium.launch({ channel: "msedge" });
const report: string[] = [];
for (const [w, h, mobile] of [[390, 844, true], [1440, 900, false]] as const) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
  page.on("pageerror", e => errors.push(String(e).slice(0, 160)));
  for (const r of routes.filter(x => x === "/login")) {
    await page.goto(BASE + r); await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${name(r)}-${w}.png`, fullPage: true });
  }
  if (routes.some(r => r !== "/login")) await signIn(page);
  for (const r of routes.filter(x => x !== "/login")) {
    errors.length = 0;
    await page.goto(BASE + r, { waitUntil: "load" });
    await page.waitForTimeout(900);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await page.screenshot({ path: `${OUT}/${name(r)}-${w}.png`, fullPage: true });
    report.push(`${w} ${r}: overflow ${overflow}${errors.length ? ` · console errors: ${errors.join(" | ")}` : ""}`);
  }
  await ctx.close();
}
await browser.close();
console.log(report.join("\n"));
