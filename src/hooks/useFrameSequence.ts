import { type MotionValue, useMotionValue } from 'motion/react';
import { useEffect, useState } from 'react';
import manifestJson from '../data/heroFrames.json';
import {
  bitmapWindow,
  type FrameSetKind,
  frameUrl,
  type HeroFrameSet,
  type HeroFramesManifest,
  isKeyframe,
  keyframeCount,
  loadOrder,
  nearestLoaded,
  pickSet,
} from '../utils/frameSequence';

export const HERO_FRAMES: HeroFramesManifest = manifestJson;

/** Bitmaps kept at once, in a window around the current frame. Everything else stays as a decoded <img>. */
const BITMAP_WINDOW: Record<FrameSetKind, number> = { desktop: 24, mobile: 16 };
const CONCURRENCY = 6;

export type FrameSource = ImageBitmap | HTMLImageElement;

/**
 * Loads one frame set: keyframes first, then the rest. All frames are held as decoded HTMLImageElements;
 * a small window around the current frame is promoted to ImageBitmaps for cheap draws.
 */
export class FrameStore {
  readonly images: (HTMLImageElement | undefined)[];
  private readonly bitmaps = new Map<number, ImageBitmap>();
  private readonly pending = new Set<number>();
  private window = new Set<number>();
  private disposed = false;
  private keysLoaded = 0;
  private readonly keysTotal: number;
  private readonly listeners = new Set<() => void>();

  constructor(
    readonly kind: FrameSetKind,
    readonly set: HeroFrameSet,
    readonly count: number,
    private readonly onKeyProgress: (share: number) => void,
  ) {
    this.images = new Array(count);
    this.keysTotal = keyframeCount(count);
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  async start() {
    const queue = loadOrder(this.count);
    const worker = async () => {
      while (!this.disposed) {
        const i = queue.shift();
        if (i === undefined) return;
        await this.loadOne(i);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  }

  private async loadOne(i: number) {
    const img = new Image();
    img.decoding = 'async';
    img.src = frameUrl(this.set, i);
    try {
      await img.decode();
    } catch {
      return; // A missing frame is covered by its nearest loaded neighbour.
    }
    if (this.disposed) return;
    this.images[i] = img;
    if (isKeyframe(i)) this.onKeyProgress(++this.keysLoaded / this.keysTotal);
    if (this.window.has(i)) this.promote(i);
    this.notify();
  }

  /** Move the bitmap window to `center`: evict bitmaps outside it, create the missing ones inside it. */
  setCenter(center: number) {
    const next = new Set(bitmapWindow(center, BITMAP_WINDOW[this.kind], this.count));
    this.window = next;
    for (const [i, bmp] of this.bitmaps) {
      if (!next.has(i)) {
        bmp.close();
        this.bitmaps.delete(i);
      }
    }
    next.forEach((i) => this.promote(i));
  }

  private promote(i: number) {
    const img = this.images[i];
    if (!img || this.bitmaps.has(i) || this.pending.has(i) || typeof createImageBitmap !== 'function') return;
    this.pending.add(i);
    createImageBitmap(img)
      .then((bmp) => {
        this.pending.delete(i);
        if (this.disposed || !this.window.has(i)) return bmp.close();
        this.bitmaps.set(i, bmp);
        this.notify();
      })
      .catch(() => this.pending.delete(i));
  }

  /** Best source for frame `target`: its bitmap, else its decoded image, else the nearest loaded frame. */
  source(target: number): { index: number; src: FrameSource; bitmap: boolean } | null {
    const index = this.images[target] ? target : nearestLoaded(target, (i) => !!this.images[i], this.count);
    if (index < 0) return null;
    const bmp = this.bitmaps.get(index);
    return bmp ? { index, src: bmp, bitmap: true } : { index, src: this.images[index]!, bitmap: false };
  }

  get bitmapCount() {
    return this.bitmaps.size;
  }

  dispose() {
    this.disposed = true;
    this.bitmaps.forEach((b) => b.close());
    this.bitmaps.clear();
    this.listeners.clear();
  }
}

function currentKind(): FrameSetKind {
  return typeof window === 'undefined' ? 'desktop' : pickSet(window.innerWidth, window.innerHeight);
}

/**
 * Owns the frame store for the current viewport shape. Disabled (no requests at all) for reduced motion.
 * `keyProgress` is the share of keyframes decoded (0..1) and drives the preloader.
 */
export function useFrameSequence(enabled: boolean): { store: FrameStore | null; keyProgress: MotionValue<number> } {
  const keyProgress = useMotionValue(0);
  const [kind, setKind] = useState<FrameSetKind>(currentKind);
  const [store, setStore] = useState<FrameStore | null>(null);

  useEffect(() => {
    const onResize = () => setKind(currentKind());
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStore(null);
      return;
    }
    const s = new FrameStore(kind, HERO_FRAMES[kind], HERO_FRAMES.count, (v) => keyProgress.set(v));
    setStore(s);
    void s.start();
    if (import.meta.env.DEV || new URLSearchParams(location.search).has('debugFrames')) {
      (window as unknown as { __heroFrames?: FrameStore }).__heroFrames = s;
    }
    return () => s.dispose();
  }, [enabled, kind, keyProgress]);

  return { store, keyProgress };
}
