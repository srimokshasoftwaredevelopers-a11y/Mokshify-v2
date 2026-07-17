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
  private bitmaps = new Map<number, ImageBitmap>();
  private inflight = new Map<number, Promise<ImageBitmap | null>>();
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

  get(index: number): ImageBitmap | undefined {
    return this.bitmaps.get(index);
  }

  /** nearest decoded frame to `index` — the no-flicker fallback */
  nearest(index: number): { index: number; bitmap: ImageBitmap } | null {
    let best: number | null = null;
    let bestDist = Infinity;
    for (const k of this.bitmaps.keys()) {
      const d = Math.abs(k - index);
      if (d < bestDist) { bestDist = d; best = k; }
    }
    return best === null ? null : { index: best, bitmap: this.bitmaps.get(best)! };
  }

  /** fetch + decode one frame; deduped; budget-evicted */
  load(index: number, url: string): Promise<ImageBitmap | null> {
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

  private async fetchDecode(url: string): Promise<ImageBitmap | null> {
    await ImageCache.gate();
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (!res.ok) return null;
      const blob = await res.blob();
      if (this.opts.resizeWidth && "createImageBitmap" in window) {
        return await createImageBitmap(blob, {
          resizeWidth: this.opts.resizeWidth,
          resizeQuality: "high",
        });
      }
      return await createImageBitmap(blob);
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
      this.bitmaps.get(k)?.close();
      this.bitmaps.delete(k);
    }
  }

  clear(): void {
    for (const b of this.bitmaps.values()) b.close();
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
