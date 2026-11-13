/** Where a fact came from. Every number shown to guests carries one. */
export interface Sourced<T> {
  value: T;
  /** true only when taken from an official or first-hand source (family PDF, Google Maps query, official tourism site). */
  verified: boolean;
  source: string;
}

export type EventPriority = 'critical' | 'high' | 'normal';
export type EventPlace = 'venue' | 'groom-home';

export interface WeddingEvent {
  id: string;
  /** Order in the family's invitation. The timeline never reorders, merges or drops events. */
  order: number;
  title: string;
  /** ISO 8601 with +05:30 offset, or null when the family has not given a time. */
  startDateTime: string | null;
  endDateTime: string | null;
  /** Used ONLY by the planner when endDateTime is null. Always shown to guests as an assumption. */
  assumedEndDateTime: string | null;
  /** Calendar date (YYYY-MM-DD) — always known. */
  date: string;
  description: string;
  location: string;
  place: EventPlace;
  priority: EventPriority;
  image: string | null;
  dressCode: string | null;
  mapUrl: string | null;
  instructions: string[];
  /** Extra detail lines from the invitation (e.g. lagna). */
  details: { label: string; value: string }[];
}

export type AttractionCategory =
  | 'heritage'
  | 'temples'
  | 'nature'
  | 'water'
  | 'family'
  | 'food';

export type DistanceBand = 'very-close' | 'nearby' | 'extended';

export type GuestType = 'solo' | 'couple' | 'family' | 'elders' | 'friends';

export interface OpeningHours {
  /** "HH:MM" 24h, local time. */
  open: string;
  close: string;
}

export interface Attraction {
  id: string;
  name: string;
  categories: AttractionCategory[];
  latitude: number | null;
  longitude: number | null;
  description: string;
  image: string | null;
  imageAlt: string;
  roadDistanceKm: Sourced<number>;
  drivingTimeFromVenue: Sourced<number>; // minutes, one way
  /** Suggested time on site, minutes. A planning suggestion, not a fact. */
  explorationDuration: { min: number; typical: number };
  openingHours: Sourced<OpeningHours> | null;
  bestVisitTime: string | null;
  seasonalNotes: string | null;
  accessibility: string | null;
  suitableFor: GuestType[];
  mapUrl: string;
  /** Things a guest must know before going (bookings, entry rules). */
  cautions: string[];
}

export interface GuestRecommendation {
  gapId: string;
  gapStart: number;
  gapEnd: number;
  availableMinutes: number;
  kind: 'perfect' | 'short' | 'relax';
  recommendedAttraction: Attraction | null;
  leaveAt: number;
  arriveAt: number;
  outboundTravelMinutes: number;
  explorationMinutes: number;
  returnTravelMinutes: number;
  parkingMinutes: number;
  safetyBufferMinutes: number;
  backAt: number;
  returnDeadline: number;
  spareMinutes: number;
  suitability: string;
  warnings: string[];
}

export interface FreeWindow {
  id: string;
  start: number;
  end: number;
  /** The event guests must be back for, if any. */
  nextEvent: WeddingEvent | null;
  previousEvent: WeddingEvent | null;
  label: string;
  /** True when a boundary came from an assumed end time. */
  usesAssumption: boolean;
}

export interface TravelRoute {
  id: string;
  from: string;
  kind: 'city' | 'rail' | 'air';
  distanceKm: Sourced<number>;
  driveMinutes: Sourced<number>;
  via: string;
  notes: string[];
  mapUrl: string;
}

export interface ImageCredit {
  id: string;
  file: string;
  author: string;
  license: string;
  licenseUrl: string;
  pageUrl: string;
  alt: string;
}
