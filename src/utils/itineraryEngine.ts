/**
 * Wedding-aware sightseeing planner. Pure functions, no UI.
 * The wedding schedule is the source of truth: windows are what is LEFT after every event
 * (plus a be-seated buffer) is blocked out. An outing is suggested only if the guest is back
 * before the window's deadline, which already keeps a safety buffer in hand.
 *
 *   usable = gap − outbound − return − exploration − parking/transition − safety
 *   recommend only if usable ≥ 0
 */
import { PLANNER_CONFIG, type Pace } from '../data/config';
import type {
  Attraction,
  AttractionCategory,
  FreeWindow,
  GuestRecommendation,
  GuestType,
  WeddingEvent,
} from '../data/types';
import { MIN, ceil5, floor5, formatDay, istAt, istDate, toMs } from './timeCalculations';

export type PlannerConfig = typeof PLANNER_CONFIG;

export interface PlannerOptions {
  interests: AttractionCategory[]; // empty = everything
  guestType: GuestType;
  pace: Pace;
  config?: PlannerConfig;
}

export interface BusyBlock {
  start: number;
  end: number;
  events: WeddingEvent[];
  usesAssumption: boolean;
}

/** Events the planner cannot place because the family has not given a time. */
export const untimedEvents = (events: WeddingEvent[]) => events.filter((e) => !e.startDateTime);

export function eventEnd(e: WeddingEvent): { end: number; assumed: boolean } | null {
  if (!e.startDateTime) return null;
  if (e.endDateTime) return { end: toMs(e.endDateTime), assumed: false };
  if (e.assumedEndDateTime) return { end: toMs(e.assumedEndDateTime), assumed: true };
  // No end and no assumption: block one hour, flagged as an assumption.
  return { end: toMs(e.startDateTime) + 60 * MIN, assumed: true };
}

/** Timed events → merged blocks of "must be at the wedding" time (with be-seated buffer). */
export function busyBlocks(events: WeddingEvent[], config: PlannerConfig = PLANNER_CONFIG): BusyBlock[] {
  const raw = events
    .filter((e) => e.startDateTime)
    .map((e) => {
      const { end, assumed } = eventEnd(e)!;
      const start = toMs(e.startDateTime!) - config.beSeatedMinutes[e.priority] * MIN;
      return { start, end: Math.max(end, start), events: [e], usesAssumption: assumed };
    })
    .sort((a, b) => a.start - b.start);

  const merged: BusyBlock[] = [];
  for (const b of raw) {
    const last = merged[merged.length - 1];
    if (last && b.start <= last.end) {
      last.end = Math.max(last.end, b.end);
      last.events.push(...b.events);
      last.usesAssumption = last.usesAssumption || b.usesAssumption;
    } else merged.push({ ...b, events: [...b.events] });
  }
  return merged;
}

function windowLabel(start: number, prev: WeddingEvent | null, next: WeddingEvent | null, sameDayNext: boolean) {
  const day = formatDay(start);
  if (prev && next && sameDayNext) return `${day} · between ${prev.title} and ${next.title}`;
  if (!prev && next && sameDayNext) return `${day} · before ${next.title}`;
  if (prev && istDate(start) === istDate(eventStartOrEnd(prev))) return `${day} · after ${prev.title}`;
  return `${day} · free day`;
}

const eventStartOrEnd = (e: WeddingEvent) => toMs(e.startDateTime!);

/**
 * Free windows inside the guest's stay, outside every busy block, clipped to daylight
 * and split per calendar day.
 */
export function findFreeWindows(
  events: WeddingEvent[],
  config: PlannerConfig = PLANNER_CONFIG,
  stay?: { start: number; end: number },
): FreeWindow[] {
  const stayStart = stay?.start ?? toMs(config.stayStart);
  const stayEnd = stay?.end ?? toMs(config.stayEnd);
  const blocks = busyBlocks(events, config);

  // 1. Subtract blocks from the stay.
  const gaps: { start: number; end: number; prev: BusyBlock | null; next: BusyBlock | null }[] = [];
  let cursor = stayStart;
  let prev: BusyBlock | null = null;
  for (const b of blocks) {
    if (b.end <= stayStart) {
      prev = b;
      continue;
    }
    if (b.start >= stayEnd) {
      gaps.push({ start: cursor, end: stayEnd, prev, next: b });
      cursor = stayEnd;
      break;
    }
    if (b.start > cursor) gaps.push({ start: cursor, end: b.start, prev, next: b });
    cursor = Math.max(cursor, b.end);
    prev = b;
  }
  if (cursor < stayEnd) gaps.push({ start: cursor, end: stayEnd, prev, next: null });

  // 2. Clip to daylight, split by day.
  const out: FreeWindow[] = [];
  for (const g of gaps) {
    let dayCursor = g.start;
    while (dayCursor < g.end) {
      const date = istDate(dayCursor);
      const dayStart = istAt(date, config.dayStart);
      const dayEnd = istAt(date, config.dayEnd);
      const nextMidnight = istAt(date, '00:00') + 24 * 60 * MIN;
      const s = Math.max(dayCursor, dayStart);
      const e = Math.min(g.end, dayEnd);
      if (e - s >= MIN) {
        const prevEvent = g.prev ? g.prev.events[g.prev.events.length - 1] : null;
        const nextEvent = g.next ? g.next.events[0] : null;
        const sameDayNext = !!g.next && e === g.end && istDate(g.next.start) === date;
        out.push({
          id: `w-${s}`,
          start: s,
          end: e,
          previousEvent: prevEvent && istDate(g.prev!.end) === date ? prevEvent : null,
          nextEvent: sameDayNext ? nextEvent : null,
          label: '',
          usesAssumption:
            (!!g.prev && g.prev.usesAssumption && s === g.start) || (sameDayNext && !!g.next?.usesAssumption),
        });
        const w = out[out.length - 1];
        w.label = windowLabel(s, w.previousEvent, w.nextEvent, sameDayNext);
      }
      dayCursor = nextMidnight;
    }
  }
  return out;
}

function opening(a: Attraction, dayMs: number) {
  if (!a.openingHours) return null;
  const date = istDate(dayMs);
  return {
    open: istAt(date, a.openingHours.value.open),
    close: istAt(date, a.openingHours.value.close),
    verified: a.openingHours.verified,
  };
}

/**
 * Plan one outing. Returns null when it does not fit, or the attraction does not suit the group.
 * Displayed times are rounded to 5 minutes — leave rounded later, back rounded later,
 * deadline rounded earlier — and the fit check uses the rounded values.
 */
export function planOuting(
  window: FreeWindow,
  a: Attraction,
  opts: PlannerOptions,
  variant: 'typical' | 'min' = 'typical',
): GuestRecommendation | null {
  const config = opts.config ?? PLANNER_CONFIG;
  if (!a.suitableFor.includes(opts.guestType)) return null;

  const drive = a.drivingTimeFromVenue.value;
  const base = variant === 'typical' ? a.explorationDuration.typical : a.explorationDuration.min;
  const explore = Math.round(variant === 'typical' ? base * config.pace[opts.pace] : base);
  const parkingEach = config.parkingMinutes;
  const group = config.groupTransitionMinutes[opts.guestType];
  const safety = config.safetyBufferMinutes;

  let leave = ceil5(window.start);
  let arrive = leave + (drive + parkingEach + group) * MIN;
  const hours = opening(a, arrive);
  if (hours && arrive < hours.open) {
    leave = ceil5(leave + (hours.open - arrive));
    arrive = leave + (drive + parkingEach + group) * MIN;
  }
  const visitEnd = arrive + explore * MIN;
  if (hours && visitEnd > hours.close) return null;
  const backAt = ceil5(visitEnd + (parkingEach + drive) * MIN);
  const deadline = floor5(window.end - safety * MIN);
  if (backAt > deadline) return null;

  const warnings: string[] = [];
  if (!a.openingHours) warnings.push('Opening hours not verified — check before you leave.');
  else if (!a.openingHours.verified) warnings.push(`Opening hours from ${a.openingHours.source}.`);
  if (a.seasonalNotes) warnings.push(a.seasonalNotes);
  warnings.push(...a.cautions);
  if (window.usesAssumption) warnings.push('This window depends on an assumed end time for an event — confirm with the family.');

  const available = Math.round((window.end - window.start) / MIN);
  return {
    gapId: window.id,
    gapStart: window.start,
    gapEnd: window.end,
    availableMinutes: available,
    kind: 'perfect',
    recommendedAttraction: a,
    leaveAt: leave,
    arriveAt: arrive,
    outboundTravelMinutes: drive,
    explorationMinutes: explore,
    returnTravelMinutes: drive,
    parkingMinutes: parkingEach * 2 + group,
    safetyBufferMinutes: safety,
    backAt,
    returnDeadline: deadline,
    spareMinutes: Math.round((deadline - backAt) / MIN),
    suitability: suitabilityText(a, opts.guestType),
    warnings,
  };
}

function suitabilityText(a: Attraction, g: GuestType) {
  const who: Record<GuestType, string> = {
    solo: 'travelling solo',
    couple: 'couples',
    family: 'families',
    elders: 'groups with elders',
    friends: 'friends',
  };
  return `Suits ${who[g]}${a.accessibility ? ` · ${a.accessibility}` : ''}`;
}

/** Experience value: time on site, less a penalty for time in the car. */
const score = (r: GuestRecommendation) => r.explorationMinutes - r.outboundTravelMinutes;

export interface WindowPlan {
  window: FreeWindow;
  perfect: GuestRecommendation | null;
  short: GuestRecommendation | null;
  relax: GuestRecommendation;
  alsoFits: GuestRecommendation[];
}

export function recommendForWindow(window: FreeWindow, attractions: Attraction[], opts: PlannerOptions): WindowPlan {
  const config = opts.config ?? PLANNER_CONFIG;
  const available = Math.round((window.end - window.start) / MIN);
  const relax: GuestRecommendation = {
    gapId: window.id,
    gapStart: window.start,
    gapEnd: window.end,
    availableMinutes: available,
    kind: 'relax',
    recommendedAttraction: null,
    leaveAt: window.start,
    arriveAt: window.start,
    outboundTravelMinutes: 0,
    explorationMinutes: 0,
    returnTravelMinutes: 0,
    parkingMinutes: 0,
    safetyBufferMinutes: 0,
    backAt: window.start,
    returnDeadline: window.end,
    spareMinutes: available,
    suitability: 'Everyone',
    warnings: [],
  };

  if (available < config.minUsefulWindowMinutes) {
    return { window, perfect: null, short: null, relax, alsoFits: [] };
  }

  const pool = attractions.filter(
    (a) => opts.interests.length === 0 || a.categories.some((c) => opts.interests.includes(c)),
  );

  const fits: GuestRecommendation[] = [];
  for (const a of pool) {
    const full = planOuting(window, a, opts, 'typical');
    if (full) fits.push(full);
    else {
      const quick = planOuting(window, a, opts, 'min');
      if (quick) fits.push(quick);
    }
  }
  if (fits.length === 0) return { window, perfect: null, short: null, relax, alsoFits: [] };

  const byScore = [...fits].sort(
    (a, b) => score(b) - score(a) || a.outboundTravelMinutes - b.outboundTravelMinutes,
  );
  const perfect = { ...byScore[0], kind: 'perfect' as const };

  // Short alternative: a different place, preferring the quickest version, most time in hand.
  let short: GuestRecommendation | null = null;
  for (const a of pool) {
    if (a.id === perfect.recommendedAttraction!.id) continue;
    const r = planOuting(window, a, opts, 'min');
    if (r && (!short || r.backAt < short.backAt || (r.backAt === short.backAt && score(r) > score(short)))) short = r;
  }
  if (short) short = { ...short, kind: 'short' };

  const alsoFits = byScore
    .slice(1)
    .filter((r) => r.recommendedAttraction!.id !== short?.recommendedAttraction?.id);

  return { window, perfect, short, relax, alsoFits };
}

/** Whole plan for the stay. Recalculates from scratch whenever events change. */
export function planStay(
  events: WeddingEvent[],
  attractions: Attraction[],
  opts: PlannerOptions,
  stay?: { start: number; end: number },
  now?: number,
) {
  let windows = findFreeWindows(events, opts.config ?? PLANNER_CONFIG, stay);
  if (now !== undefined) {
    // Live mode: windows already over are dropped; the current one starts from now.
    windows = windows
      .filter((w) => w.end > now)
      .map((w) => (w.start < now ? { ...w, start: now, label: `${w.label} · from now` } : w));
  }
  return {
    windows: windows.map((w) => recommendForWindow(w, attractions, opts)),
    untimed: untimedEvents(events),
  };
}

/** Safety net used by tests and the UI: does an outing overlap any timed event? */
export function conflictsWithEvents(r: GuestRecommendation, events: WeddingEvent[]) {
  if (!r.recommendedAttraction) return false;
  return events.some((e) => {
    if (!e.startDateTime) return false;
    const s = toMs(e.startDateTime);
    const end = eventEnd(e)!.end;
    return r.leaveAt < end && r.backAt > s;
  });
}
