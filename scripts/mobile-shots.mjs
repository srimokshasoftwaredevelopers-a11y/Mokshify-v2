/* QA: true mobile-emulation freeze-frame screenshots via the installed Edge.
   Usage: node scripts/mobile-shots.mjs [widthxheight] [outPrefix]
   Shots land in the directory given by SHOT_DIR (default ./shots). */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const size = (process.argv[2] || "390x844").split("x").map(Number);
const prefix = process.argv[3] || "q";
const outDir = process.env.SHOT_DIR || "shots";
mkdirSync(outDir, { recursive: true });

const SHOTS = [
  ["hero", 0.001], ["ch1", 0.05], ["ch2", 0.14], ["ch3", 0.21],
  ["ch5_mac", 0.36], ["ch5_tab", 0.372], ["ch5_ph", 0.386], ["ch5_term", 0.4],
  ["ch6_a", 0.44], ["ch6_b", 0.5], ["ch7", 0.675], ["ch8", 0.76],
  ["ch9_a", 0.83], ["ch9_b", 0.852], ["ch10", 0.95],
];
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({
  width: size[0], height: size[1],
  deviceScaleFactor: 2, isMobile: true, hasTouch: true,
});

for (const [name, f] of SHOTS) {
  if (only && !only.includes(name)) continue;
  await page.goto(`http://localhost:8123/index.html?f=${f}&v=qa${Date.now()}`, {
    waitUntil: "load", timeout: 30000,
  });
  await new Promise(r => setTimeout(r, 3200)); // frames decode + entrances settle
  await page.screenshot({ path: join(outDir, `${prefix}_${name}.png`) });
  console.log(`${prefix}_${name}.png  f=${f}`);
}
await browser.close();
