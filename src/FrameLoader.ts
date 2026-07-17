/**
 * FrameLoader — discovers and addresses the extracted Gemini Flow frames.
 *
 * Preference order:
 *   1. `web/manifest.json` — streamable derivatives (1920px WebP) built by
 *      scripts/optimize-frames.mjs. ~90% lighter than the 4K masters, which
 *      is what makes scroll-speed scrubbing possible.
 *   2. `manifest.json` — the master sequence, described by sync-frames.ps1.
 *   3. runtime probing — exponential + binary search over HEAD requests,
 *      so nothing is ever hardcoded even without manifests.
 */

export interface SequenceInfo {
  dir: string;
  count: number;
  pad: number;
  ext: string;
}

const CANDIDATE_PADS = [6, 5, 4, 3];

function frameName(index: number, pad: number, ext: string): string {
  return `frame_${String(index).padStart(pad, "0")}.${ext}`;
}

async function exists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "force-cache" });
    return res.ok;
  } catch {
    return false;
  }
}

async function readManifest(url: string): Promise<{ count: number; pad?: number; format?: string } | null> {
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) return null;
    const m = await res.json();
    return typeof m.count === "number" && m.count > 0 ? m : null;
  } catch {
    return null;
  }
}

export class FrameLoader {
  readonly baseDir: string;
  private info: SequenceInfo | null = null;
  private discovering: Promise<SequenceInfo> | null = null;

  constructor(dir: string) {
    this.baseDir = dir.replace(/\/+$/, "");
  }

  url(index: number): string {
    const i = this.info;
    return `${i?.dir ?? this.baseDir}/${frameName(index + 1, i?.pad ?? 6, i?.ext ?? "png")}`; // files are 1-based
  }

  get count(): number {
    return this.info?.count ?? 0;
  }

  discover(): Promise<SequenceInfo> {
    if (this.info) return Promise.resolve(this.info);
    if (!this.discovering) this.discovering = this.probe();
    return this.discovering;
  }

  private async probe(): Promise<SequenceInfo> {
    // 1) web derivatives — the fast path
    const web = await readManifest(`${this.baseDir}/web/manifest.json`);
    if (web) {
      this.info = {
        dir: `${this.baseDir}/web`,
        count: web.count,
        pad: web.pad ?? 6,
        ext: web.format ?? "webp",
      };
      return this.info;
    }

    // 2) master manifest
    const master = await readManifest(`${this.baseDir}/manifest.json`);
    if (master) {
      this.info = { dir: this.baseDir, count: master.count, pad: master.pad ?? 6, ext: "png" };
      return this.info;
    }

    // 3) confirm the zero-padding by finding frame #1
    let pad = 0;
    for (const p of CANDIDATE_PADS) {
      if (await exists(`${this.baseDir}/${frameName(1, p, "png")}`)) { pad = p; break; }
    }
    if (!pad) { // folder absent or empty — a dead sequence, not an error
      this.info = { dir: this.baseDir, count: 0, pad: 6, ext: "png" };
      return this.info;
    }

    // exponential growth to bracket the last frame…
    let lo = 1;
    let hi = 2;
    while (await exists(`${this.baseDir}/${frameName(hi, pad, "png")}`)) {
      lo = hi;
      hi *= 2;
      if (hi > 65536) break; // safety valve
    }
    // …then binary search the boundary. Invariant: lo exists, hi doesn't.
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (await exists(`${this.baseDir}/${frameName(mid, pad, "png")}`)) lo = mid;
      else hi = mid;
    }

    this.info = { dir: this.baseDir, count: lo, pad, ext: "png" };
    return this.info;
  }
}
