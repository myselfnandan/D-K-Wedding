import { describe, expect, it } from 'vitest';
import { attractions } from '../data/attractions';
import { bearingFromVenue, CX, CY, layoutPins, MIN_GAP, R_MAX, R_MIN, radiusFor, VIEW } from './placesMap';

describe('drive-time map layout', () => {
  const pins = layoutPins(attractions);

  it('places every attraction once, numbered by drive time', () => {
    expect(pins).toHaveLength(attractions.length);
    expect(pins.map((p) => p.n)).toEqual(attractions.map((_, i) => i + 1));
    for (let i = 1; i < pins.length; i++) expect(pins[i].minutes).toBeGreaterThanOrEqual(pins[i - 1].minutes);
  });

  it('keeps distance from the venue equal to the drive-time radius', () => {
    for (const p of pins) expect(Math.hypot(p.x - CX, p.y - CY)).toBeCloseTo(radiusFor(p.minutes), 5);
  });

  it('never lets two pins overlap', () => {
    for (let i = 0; i < pins.length; i++)
      for (let j = i + 1; j < pins.length; j++)
        expect(Math.hypot(pins[i].x - pins[j].x, pins[i].y - pins[j].y), `${pins[i].id} / ${pins[j].id}`).toBeGreaterThanOrEqual(MIN_GAP - 0.5);
  });

  it('keeps pins inside the map', () => {
    for (const p of pins) {
      for (const v of [p.x, p.y]) {
        expect(v, p.id).toBeGreaterThanOrEqual(40);
        expect(v, p.id).toBeLessThanOrEqual(VIEW - 40);
      }
      expect(Math.hypot(p.x - CX, p.y - CY)).toBeGreaterThanOrEqual(R_MIN);
      expect(Math.hypot(p.x - CX, p.y - CY)).toBeLessThanOrEqual(R_MAX);
    }
  });

  it('computes compass bearings from coordinates', () => {
    expect(bearingFromVenue(13.3, 75.9913076)).toBeCloseTo(0, 5); // due north
    const belur = bearingFromVenue(13.16293, 75.860593);
    expect(belur).toBeGreaterThan(240);
    expect(belur).toBeLessThan(280); // west
  });

  it('keeps the far western places in the west half', () => {
    for (const id of ['sringeri', 'mullayanagiri', 'hebbe', 'manjarabad', 'chikkamagaluru', 'baba-budangiri']) {
      const p = pins.find((x) => x.id === id)!;
      expect(p.x, id).toBeLessThan(CX);
    }
  });
});
