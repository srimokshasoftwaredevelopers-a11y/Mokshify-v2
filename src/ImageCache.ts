export type Frame = ImageBitmap | HTMLImageElement;

/**
 * ImageCache — decoded-frame memory manager.
 *
 * 1920×1080 RGBA is ~8.3 MB per decoded frame, so the cache is the real
 * engineering here: a budgeted store of ImageBitmaps, evicted by distance
 * from the playhead, with de-duplicated in-flight fetches and a small
 * concurrency gate so scroll bursts never queue hundreds of requests.
 */

export interface CacheOptions {
  /** max decoded frames kept alive */
  budget: number;
  /** optional decode-time downscale (mobile memory relief) */
  resizeWidth?: number;
}

export class ImageCache {
  private bitmaps = new Map<number, Frame>();
  private inflight = new Map<number, Promise<Frame | null>>();
  private opts: CacheOptions;
  private playhead = 0;
  private static active = 0;
  private static readonly MAX_PARALLEL = 10;
  private static waiters: (() => void)[] = [];

  constructor(opts: CacheOptions) {
    this.opts = opts;
  }

  /** the index eviction distances are measured from */
  setPlayhead(index: number): void {
    this.playhead = index;
  }

  has(index: number): boolean {
    return this.bitmaps.has(index);
  }

  get(index: number): Frame | undefined {
    return this.bitmaps.get(index);
  }

  /** nearest decoded frame to `index` — the no-flicker fallback */
  nearest(index: number): { index: number; bitmap: Frame } | null {
    let best: number | null = null;
    let bestDist = Infinity;
    for (const k of this.bitmaps.keys()) {
      const d = Math.abs(k - index);
      if (d < bestDist) { bestDist = d; best = k; }
    }
    return best === null ? null : { index: best, bitmap: this.bitmaps.get(best)! };
  }

  /** fetch + decode one frame; deduped; budget-evicted */
  load(index: number, url: string): Promise<Frame | null> {
    if (this.bitmaps.has(index)) return Promise.resolve(this.bitmaps.get(index)!);
    const pending = this.inflight.get(index);
    if (pending) return pending;

    const p = this.fetchDecode(url)
      .then(bmp => {
        this.inflight.delete(index);
        if (!bmp) return null;
        this.bitmaps.set(index, bmp);
        this.evict();
        return bmp;
      })
      .catch(() => {
        this.inflight.delete(index);
        return null;
      });
    this.inflight.set(index, p);
    return p;
  }

  private async fetchDecode(url: string): Promise<Frame | null> {
    await ImageCache.gate();
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) return null;
      const blob = await res.blob();
      // decode ladder: some browsers (older Safari notably) throw on the
      // createImageBitmap options form, or lack the API — every rung falls
      // through so a decode failure can never take the whole film down
      if ("createImageBitmap" in window) {
        if (this.opts.resizeWidth) {
          try {
            return await createImageBitmap(blob, {
              resizeWidth: this.opts.resizeWidth,
              resizeQuality: "high",
            });
          } catch { /* options unsupported — plain form next */ }
        }
        try {
          return await createImageBitmap(blob);
        } catch { /* fall through to the universal path */ }
      }
      // universal fallback: HTMLImageElement decodes everywhere
      const objUrl = URL.createObjectURL(blob);
      try {
        const img = new Image();
        img.src = objUrl;
        if (img.decode) await img.decode();
        else await new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(new Error("img")); });
        return img;
      } finally {
        URL.revokeObjectURL(objUrl);
      }
    } finally {
      ImageCache.release();
    }
  }

  /** drop the frames farthest from the playhead until inside budget */
  private evict(): void {
    if (this.bitmaps.size <= this.opts.budget) return;
    const keys = [...this.bitmaps.keys()]
      .sort((a, b) => Math.abs(b - this.playhead) - Math.abs(a - this.playhead));
    while (this.bitmaps.size > this.opts.budget && keys.length) {
      const k = keys.shift()!;
      const f = this.bitmaps.get(k);
      if (f instanceof ImageBitmap) f.close();
      this.bitmaps.delete(k);
    }
  }

  clear(): void {
    for (const b of this.bitmaps.values()) if (b instanceof ImageBitmap) b.close();
    this.bitmaps.clear();
  }

  /* ── tiny global fetch-concurrency gate ── */
  private static gate(): Promise<void> {
    if (ImageCache.active < ImageCache.MAX_PARALLEL) {
      ImageCache.active++;
      return Promise.resolve();
    }
    return new Promise(res => ImageCache.waiters.push(() => {
      ImageCache.active++;
      res();
    }));
  }

  private static release(): void {
    ImageCache.active--;
    ImageCache.waiters.shift()?.();
  }
}
