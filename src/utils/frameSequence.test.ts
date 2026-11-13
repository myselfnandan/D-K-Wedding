import { describe, expect, it } from 'vitest';
import manifest from '../data/heroFrames.json';
import {
  bitmapWindow,
  coverRect,
  frameUrl,
  type HeroFramesManifest,
  keyframeCount,
  loadOrder,
  nearestLoaded,
  pickSet,
  posterUrl,
  progressToIndex,
} from './frameSequence';

const m: HeroFramesManifest = manifest;

describe('manifest', () => {
  it('describes 120 frames per set with the expected URLs', () => {
    expect(m.count).toBe(120);
    expect(frameUrl(m.desktop, 0)).toBe('frames/desktop/f-000.webp');
    expect(frameUrl(m.mobile, 119)).toBe('frames/mobile/f-119.webp');
    expect(posterUrl(m.desktop, 'avif')).toBe('frames/desktop/poster.avif');
  });
});

describe('loadOrder', () => {
  const order = loadOrder(120);
  it('loads every 8th frame first', () => {
    expect(order.slice(0, keyframeCount(120))).toEqual([0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112]);
  });
  it('is a permutation of 0..count-1', () => {
    expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: 120 }, (_, i) => i));
  });
});

describe('progressToIndex', () => {
  it('maps 0..1 onto 0..count-1 and clamps', () => {
    expect(progressToIndex(0, 120)).toBe(0);
    expect(progressToIndex(1, 120)).toBe(119);
    expect(progressToIndex(0.5, 120)).toBe(60);
    expect(progressToIndex(-0.2, 120)).toBe(0);
    expect(progressToIndex(1.4, 120)).toBe(119);
    expect(progressToIndex(Number.NaN, 120)).toBe(0);
  });
});

describe('nearestLoaded', () => {
  const loaded = new Set([0, 8, 16]);
  const has = (i: number) => loaded.has(i);
  it('returns the target when loaded', () => expect(nearestLoaded(8, has, 120)).toBe(8));
  it('searches outwards', () => {
    expect(nearestLoaded(10, has, 120)).toBe(8);
    expect(nearestLoaded(14, has, 120)).toBe(16);
    expect(nearestLoaded(119, has, 120)).toBe(16);
  });
  it('breaks ties towards the lower index', () => expect(nearestLoaded(12, has, 120)).toBe(8));
  it('returns -1 when nothing is loaded', () => expect(nearestLoaded(5, () => false, 120)).toBe(-1));
});

describe('bitmapWindow', () => {
  it('centres on the frame', () => expect(bitmapWindow(60, 24, 120)).toEqual(Array.from({ length: 24 }, (_, k) => 48 + k)));
  it('stays inside the range at both ends', () => {
    expect(bitmapWindow(2, 16, 120)[0]).toBe(0);
    expect(bitmapWindow(118, 16, 120)[15]).toBe(119);
    expect(bitmapWindow(118, 16, 120)).toHaveLength(16);
  });
});

describe('coverRect', () => {
  it('crops the sides of a wide image into a tall box', () => {
    const r = coverRect(1280, 720, 390, 844);
    expect(r.sh).toBeCloseTo(720);
    expect(r.sw).toBeCloseTo((390 / 844) * 720);
    expect(r.sx).toBeCloseTo((1280 - r.sw) / 2);
    expect(r.sy).toBeCloseTo(0);
  });
  it('crops top and bottom of a tall image into a wide box', () => {
    const r = coverRect(405, 720, 1440, 900);
    expect(r.sw).toBeCloseTo(405);
    expect(r.sy).toBeGreaterThan(0);
  });
});

describe('pickSet', () => {
  it('uses the mobile set for portrait viewports', () => {
    expect(pickSet(390, 844)).toBe('mobile');
    expect(pickSet(1440, 900)).toBe('desktop');
    expect(pickSet(768, 1024)).toBe('mobile');
    expect(pickSet(800, 1000)).toBe('desktop');
  });
});
