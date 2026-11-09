import { PLANNER_CONFIG } from '../data/config';
import type { Attraction, DistanceBand } from '../data/types';

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Straight-line distance in km. Used only for the map plot, never as a travel estimate. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Bearing in degrees (0 = north), for placing a point on the map. */
export function bearingDeg(lat1: number, lon1: number, lat2: number, lon2: number) {
  const y = Math.sin(rad(lon2 - lon1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lon2 - lon1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function distanceBand(a: Attraction): DistanceBand {
  const t = a.drivingTimeFromVenue.value;
  if (t <= PLANNER_CONFIG.bands.veryCloseMax) return 'very-close';
  if (t <= PLANNER_CONFIG.bands.nearbyMax) return 'nearby';
  return 'extended';
}

export const BAND_LABEL: Record<DistanceBand, { title: string; hint: string }> = {
  'very-close': { title: 'Very close', hint: 'Fits a short gap' },
  nearby: { title: 'Nearby', hint: 'Needs 2–4 hours' },
  extended: { title: 'Extended excursion', hint: 'Arrival day or extra days' },
};
