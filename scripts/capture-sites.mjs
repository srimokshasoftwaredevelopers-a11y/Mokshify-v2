/* MOKSHIFY — capture the live homepage of every project with a headless browser.
   Writes assets/sites/<slug>.webp (1440 desktop, 1200×2000), <slug>-m.webp (390 phone),
   <slug>-thumb.webp (480×300 first screen) and <slug>-plate.webp (1600×1000 first screen).
   Text of each page goes to $TEXT_DIR for fact-checking.   node scripts/capture-sites.mjs [slug…] */
import puppeteer from "puppeteer-core";
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const OUT = join(ROOT, "assets", "sites");
const TEXT = process.env.TEXT_DIR || join(ROOT, "shots");
mkdirSync(TEXT, { recursive: true });
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SITES = {
  "next-edge-realty": "https://nextedgerealty.com/",
  "aj-agritech": "https://ajagritech.com/",
  "qflow": "https://qflow.in/",
  "fincalix": "https://fincalix.com/",
  "medico": "https://medicodiagnostics.in/",
  "terravion": "https://terravionproperties.com/",
  "terravion-in": "https://terravionproperties.in/",              // the second Terravion site (owner, 23 Nov 2026)
  "terravion-in-gis": "https://terravionproperties.in/gis",        // its GIS master plan page (used at 1440)
  "somallamma": "https://www.srisomaalammatalli.in/",   // Srisomaalammatalli Temple, Mungandapalem (address from the owner, 23 Nov 2026)
  "mokshify-website": process.env.SELF_URL || "http://localhost:8123/",   // this site, from the local server
};
const only = process.argv.slice(2);
const SLOW_ON_PHONE = { "terravion-in": 9000 };   // extra milliseconds before the phone screenshot
// captures in assets/sites/ that were cropped by hand so no availability, prices or names show (23 Nov 2026):
// a plain run skips them; name the slug to recapture, then crop again before using the result
const REDACTED = new Set(["next-edge-realty"]);
const wait = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ["--disable-gpu", "--hide-scrollbars", "--lang=en-IN"] });
const report = [];
for (const [slug, url] of Object.entries(SITES)) {
  if (only.length && !only.includes(slug)) continue;
  if (!only.length && REDACTED.has(slug)) { report.push(`${slug}: skipped (redacted crops in use)`); continue; }
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36");
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    for (let y = 0; y <= 2400; y += 600) { await page.evaluate(v => scrollTo(0, v), y); await wait(350); }
    await page.evaluate(() => scrollTo(0, 0)); await wait(1800);
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    const desk = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: Math.min(2400, h) }, captureBeyondViewport: true });
    const info = await page.evaluate(() => ({
      title: document.title,
      text: document.body.innerText.slice(0, 20000),
      stores: [...document.querySelectorAll("a[href]")].map(a => a.href).filter(h => /play\.google|apps\.apple/.test(h)),
      links: document.querySelectorAll("a[href]").length,
    }));
    writeFileSync(join(TEXT, `${slug}.txt`), `${info.title}\n${url}\nSTORES ${info.stores.join(" ")}\nLINKS ${info.links}\n\n${info.text}`);

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    for (let y = 0; y <= 1700; y += 500) { await page.evaluate(v => scrollTo(0, v), y); await wait(300); }
    // some sites run an intro or loader on phones (terravionproperties.in): give them time to settle
    await page.evaluate(() => scrollTo(0, 0)); await wait(1800 + (SLOW_ON_PHONE[slug] ?? 0));
    const mob = await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 844 * 2 }, captureBeyondViewport: true });
    await page.close();

    const top = await sharp(desk).extract({ left: 0, top: 0, width: 1440, height: 900 }).toBuffer();
    await sharp(desk).resize({ width: 1200 }).webp({ quality: 74 }).toFile(join(OUT, `${slug}.webp`));
    await sharp(mob).resize({ width: 600 }).webp({ quality: 74 }).toFile(join(OUT, `${slug}-m.webp`));
    await sharp(top).resize({ width: 480, height: 300 }).webp({ quality: 72 }).toFile(join(OUT, `${slug}-thumb.webp`));
    await sharp(top).resize({ width: 1600, height: 1000 }).webp({ quality: 70 }).toFile(join(OUT, `${slug}-plate.webp`));
    report.push(`${slug}: ok "${info.title}" stores=${info.stores.length}`);
  } catch (e) {
    report.push(`${slug}: FAILED ${e.message.split("\n")[0]}`);
  }
}
await browser.close();
console.log(report.join("\n"));
