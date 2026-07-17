/**
 * optimize-frames.mjs - builds streamable web derivatives of the 4K masters.
 *
 *   node scripts/optimize-frames.mjs        (or: npm run optimize)
 *
 * For every frames/<n>/frame_*.png it writes frames/<n>/web/frame_*.webp
 * (1920px wide, quality 70) plus a manifest.json the site engine prefers.
 * Every frame is converted - none skipped. Masters are never touched.
 * Re-runs are incremental: up-to-date derivatives are left alone.
 */

import { readdir, mkdir, stat, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "frames");
const WIDTH = 1920;
const QUALITY = 70;
const JOBS = Math.max(2, os.cpus().length - 1);

async function fresh(src, dst) {
  try {
    const [a, b] = await Promise.all([stat(src), stat(dst)]);
    return b.mtimeMs >= a.mtimeMs;
  } catch { return false; }
}

async function convertScene(dir) {
  const srcDir = join(ROOT, dir);
  const outDir = join(srcDir, "web");
  const pngs = (await readdir(srcDir)).filter(f => /^frame_\d+\.png$/.test(f)).sort();
  if (!pngs.length) { console.log(`scene ${dir}: no frames - skipped`); return; }
  await mkdir(outDir, { recursive: true });

  let done = 0, skipped = 0, bytes = 0;
  const queue = [...pngs];
  const worker = async () => {
    for (;;) {
      const f = queue.shift();
      if (!f) return;
      const src = join(srcDir, f);
      const dst = join(outDir, f.replace(/\.png$/, ".webp"));
      if (await fresh(src, dst)) { skipped++; continue; }
      const buf = await sharp(src).resize({ width: WIDTH }).webp({ quality: QUALITY }).toBuffer();
      await writeFile(dst, buf);
      bytes += buf.length;
      if (++done % 100 === 0) console.log(`scene ${dir}: ${done + skipped}/${pngs.length}`);
    }
  };
  await Promise.all(Array.from({ length: JOBS }, worker));

  const meta = await sharp(join(outDir, pngs[0].replace(/\.png$/, ".webp"))).metadata();
  const manifest = {
    count: pngs.length,
    pad: 6,
    width: meta.width,
    height: meta.height,
    format: "webp",
    generated: new Date().toISOString().slice(0, 19),
  };
  await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest));
  console.log(`scene ${dir}: ${pngs.length} frames -> web/ (${done} converted, ${skipped} fresh, ${(bytes / 1048576).toFixed(0)} MB new)`);
}

const dirs = (await readdir(ROOT, { withFileTypes: true }))
  .filter(d => d.isDirectory()).map(d => d.name).sort();
console.log(`optimize-frames: ${dirs.join(", ")} | ${WIDTH}px webp q${QUALITY} | ${JOBS} jobs`);
for (const d of dirs) await convertScene(d);
console.log("done - the site now streams web derivatives; 4K masters untouched");
