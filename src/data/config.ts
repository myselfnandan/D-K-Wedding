import type { GuestType } from './types';

/** All planner buffers in minutes. Edit here; every recommendation recalculates. */
export const PLANNER_CONFIG = {
  /** Getting out of the car, parking, finding the entrance — applied at the attraction AND on return. */
  parkingMinutes: 10,
  /** Kept free before the deadline, for traffic, punctures, a slow lunch. */
  safetyBufferMinutes: 30,
  /** Guests should be seated this long before a critical/high event. */
  beSeatedMinutes: { critical: 20, high: 10, normal: 0 },
  /** Extra transition per outing by group type (gathering everyone, elders' pace). */
  groupTransitionMinutes: { solo: 0, couple: 0, friends: 5, family: 10, elders: 20 } as Record<GuestType, number>,
  /** Daylight window the planner suggests outings in. */
  dayStart: '07:00',
  dayEnd: '18:30',
  /** Guest stay window (brief: arrive a day before, leave on the wedding day). */
  stayStart: '2026-12-02T07:00:00+05:30',
  stayEnd: '2026-12-03T18:30:00+05:30',
  /** Below this a window is "relax only". */
  minUsefulWindowMinutes: 45,
  /** Pace multipliers on suggested exploration time. */
  pace: { relaxed: 1.3, standard: 1, quick: 0.8 },
  /** Distance bands by one-way drive time. */
  bands: { veryCloseMax: 15, nearbyMax: 60 },
};

export type Pace = keyof typeof PLANNER_CONFIG.pace;
export const TIME_ZONE = 'Asia/Kolkata';
