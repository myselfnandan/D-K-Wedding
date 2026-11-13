/** Pure helpers for the scroll-scrubbed hero film. No DOM access, so they are unit-tested. */

/** One frame set as described by `src/data/heroFrames.json` (the file is the source of truth). */
export interface HeroFrameSet {
  width: number;
  height: number;
  /** Relative URL with an `{i}` placeholder, e.g. `frames/desktop/f-{i}.webp`. */
  pattern: string;
  indexPad: number;
  /** Relative URL without extension; `.avif` and `.webp` exist. */
  poster: string;
  bytes: number;
}

export interface HeroFramesManifest {
  count: number;
  sourceFps: number;
  sampledEvery: number;
  source: string;
  desktop: HeroFrameSet;
  mobile: HeroFrameSet;
  watermark: string;
  generatedAt: string;
}

export type FrameSetKind = 'desktop' | 'mobile';

/** Portrait viewports (width / height < 0.8) use the 9:16 mobile set. */
export const PORTRAIT_RATIO = 0.8;
export const KEYFRAME_STEP = 8;

export function pickSet(width: number, height: number): FrameSetKind {
  return height > 0 && width / height < PORTRAIT_RATIO ? 'mobile' : 'desktop';
}

export function frameUrl(set: HeroFrameSet, i: number): string {
  return set.pattern.replace('{i}', String(i).padStart(set.indexPad, '0'));
}

export function posterUrl(set: HeroFrameSet, ext: 'avif' | 'webp'): string {
  return `${set.poster}.${ext}`;
}

export function isKeyframe(i: number, step = KEYFRAME_STEP): boolean {
  return i % step === 0;
}

/** Keyframes (every `step`th frame) first, then the rest in ascending order. A permutation of 0..count-1. */
export function loadOrder(count: number, step = KEYFRAME_STEP): number[] {
  const keys: number[] = [];
  const rest: number[] = [];
  for (let i = 0; i < count; i++) (isKeyframe(i, step) ? keys : rest).push(i);
  return keys.concat(rest);
}

export function keyframeCount(count: number, step = KEYFRAME_STEP): number {
  return Math.ceil(count / step);
}

export function progressToIndex(p: number, count: number): number {
  if (count <= 0) return 0;
  const v = Number.isFinite(p) ? p : 0;
  return Math.min(count - 1, Math.max(0, Math.round(v * (count - 1))));
}

/** Closest index for which `has(i)` is true, searching outwards from `target`; ties go to the lower index. -1 if none. */
export function nearestLoaded(target: number, has: (i: number) => boolean, count: number): number {
  const t = Math.min(count - 1, Math.max(0, Math.round(target)));
  for (let d = 0; d < count; d++) {
    if (t - d >= 0 && has(t - d)) return t - d;
    if (t + d < count && has(t + d)) return t + d;
  }
  return -1;
}

/** Indices of the bitmap window around `center`: `size` frames, shifted to stay inside 0..count-1. */
export function bitmapWindow(center: number, size: number, count: number): number[] {
  const n = Math.min(size, count);
  let start = Math.round(center) - Math.floor(n / 2);
  start = Math.min(Math.max(0, start), count - n);
  return Array.from({ length: n }, (_, k) => start + k);
}

/** Source rectangle that cover-fits a `srcW`×`srcH` image into a `dstW`×`dstH` box (centred crop). */
export function coverRect(srcW: number, srcH: number, dstW: number, dstH: number) {
  const scale = Math.max(dstW / srcW, dstH / srcH);
  const sw = dstW / scale;
  const sh = dstH / scale;
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh };
}
