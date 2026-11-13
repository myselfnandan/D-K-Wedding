/**
 * Layout for the painted "drive-time" map. Pure, so it is unit-tested.
 *
 * The map is illustrative, not to scale: the venue sits at the centre, a place's distance from the centre is its
 * real drive time (Google Maps, see attractions.ts), and its direction is its compass bearing from the venue.
 */
import type { Attraction } from '../data/types';

export const VIEW = 1000;
/**
 * The venue sits low and to the right: almost every place lies north or west of Halebidu, so this lets them fill
 * the frame instead of leaving the east and south empty. Outer rings run off the right edge, as on a cropped map.
 */
export const CX = 620;
export const CY = 580;
/** Radius of the innermost pin orbit (keeps the close cluster off the venue) and of the outermost ring. */
export const R_MIN = 90;
export const R_MAX = 560;
/** Drive time that maps to R_MAX. */
export const T_MAX = 210;
/** Minimum distance between two pin centres, in viewBox units. */
export const MIN_GAP = 88;

const VENUE = { lat: 13.1888179, lon: 75.9913076 };

/**
 * Approximate compass bearings (degrees, 0 = north, clockwise) for places whose exact coordinates are not in the
 * data. Taken from each town's general direction from Halebidu, used only to place a pin on the illustrative map.
 */
export const APPROX_BEARING: Record<string, number> = {
  kedareshwara: 14, // in Halebidu, beside the Hoysaleswara temple
  'basadi-halli': 2, // Basadi Halli, just north of the Hoysaleswara temple
  yagachi: 276, // the reservoir beside Belur
  chikkamagaluru: 300,
  'baba-budangiri': 316,
  mullayanagiri: 308,
};

/** Compass bearing from the venue, from coordinates where known. */
export function bearingFromVenue(lat: number, lon: number): number {
  const dLat = lat - VENUE.lat;
  const dLon = (lon - VENUE.lon) * Math.cos((VENUE.lat * Math.PI) / 180);
  const deg = (Math.atan2(dLon, dLat) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export function bearingOf(a: Pick<Attraction, 'id' | 'latitude' | 'longitude'>): number {
  if (a.latitude != null && a.longitude != null) return bearingFromVenue(a.latitude, a.longitude);
  return APPROX_BEARING[a.id] ?? 0;
}

/** Ring radius for a drive time in minutes (square-root scale, so the close places get room). */
export function radiusFor(minutes: number): number {
  return R_MIN + (R_MAX - R_MIN) * Math.sqrt(Math.min(Math.max(minutes, 0), T_MAX) / T_MAX);
}

export function polar(radius: number, bearingDeg: number) {
  const t = (bearingDeg * Math.PI) / 180;
  return { x: CX + radius * Math.sin(t), y: CY - radius * Math.cos(t) };
}

export interface Pin {
  id: string;
  n: number;
  minutes: number;
  radius: number;
  bearing: number;
  x: number;
  y: number;
}

/**
 * Pins numbered by drive time. Radii are fixed by drive time; where two pins would overlap, their bearings are
 * nudged apart (never their radii), so the drive-time reading stays true.
 */
export function layoutPins(places: Pick<Attraction, 'id' | 'latitude' | 'longitude' | 'drivingTimeFromVenue'>[]): Pin[] {
  const pins = [...places]
    .sort((a, b) => a.drivingTimeFromVenue.value - b.drivingTimeFromVenue.value)
    .map((a, i) => ({ id: a.id, n: i + 1, minutes: a.drivingTimeFromVenue.value, radius: radiusFor(a.drivingTimeFromVenue.value), bearing: bearingOf(a), x: 0, y: 0 }));

  for (let iter = 0; iter < 400; iter++) {
    let moved = false;
    for (let i = 0; i < pins.length; i++)
      for (let j = i + 1; j < pins.length; j++) {
        const a = polar(pins[i].radius, pins[i].bearing);
        const b = polar(pins[j].radius, pins[j].bearing);
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d >= MIN_GAP) continue;
        moved = true;
        // Signed angular difference j − i in (−180, 180]; push the two apart along their orbits.
        let diff = ((pins[j].bearing - pins[i].bearing + 540) % 360) - 180;
        if (diff === 0) diff = 1;
        const r = (pins[i].radius + pins[j].radius) / 2;
        const step = Math.max(0.5, (((MIN_GAP - d) / r) * 180) / Math.PI / 2 + 0.2);
        pins[i].bearing = (pins[i].bearing - Math.sign(diff) * step + 360) % 360;
        pins[j].bearing = (pins[j].bearing + Math.sign(diff) * step + 360) % 360;
      }
    if (!moved) break;
  }
  return pins.map((p) => ({ ...p, ...polar(p.radius, p.bearing) }));
}

/** A hand-drawn ring: a circle with a slight, deterministic wobble. */
export function wobblyCircle(radius: number, seed = 0, steps = 96): string {
  const pts: string[] = [];
  for (let k = 0; k <= steps; k++) {
    const t = (k / steps) * Math.PI * 2;
    const r = radius * (1 + 0.009 * Math.sin(5 * t + seed) + 0.006 * Math.sin(11 * t + seed * 2.3));
    pts.push(`${(CX + r * Math.sin(t)).toFixed(1)},${(CY - r * Math.cos(t)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Gently curved route from the venue to a pin (control point offset to one side of the straight line). */
export function routePath(x: number, y: number): string {
  const mx = (CX + x) / 2;
  const my = (CY + y) / 2;
  const dx = x - CX;
  const dy = y - CY;
  const k = 0.22;
  return `M${CX},${CY} Q${(mx - dy * k).toFixed(1)},${(my + dx * k).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
}
