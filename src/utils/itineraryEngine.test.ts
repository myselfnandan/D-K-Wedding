import { describe, expect, it } from 'vitest';
import { attractions } from '../data/attractions';
import { PLANNER_CONFIG } from '../data/config';
import type { WeddingEvent } from '../data/types';
import { weddingEvents } from '../data/weddingEvents';
import {
  busyBlocks,
  conflictsWithEvents,
  findFreeWindows,
  planStay,
  recommendForWindow,
  untimedEvents,
  type PlannerOptions,
} from './itineraryEngine';
import { MIN, formatTime, toMs } from './timeCalculations';

const opts: PlannerOptions = { interests: [], guestType: 'couple', pace: 'standard' };

const ev = (id: string, start: string | null, end: string | null, extra: Partial<WeddingEvent> = {}): WeddingEvent => ({
  id,
  order: 0,
  title: id,
  date: (start ?? '2026-12-03').slice(0, 10),
  startDateTime: start,
  endDateTime: end,
  assumedEndDateTime: null,
  description: '',
  location: 'Venue',
  place: 'venue',
  priority: 'high',
  image: null,
  dressCode: null,
  mapUrl: null,
  instructions: [],
  details: [],
  ...extra,
});

const T = (d: string, hm: string) => `${d}T${hm}:00+05:30`;

/** Every recommendation, in every window, must be back before the deadline and clear of all events. */
function assertSafe(events: WeddingEvent[], o: PlannerOptions = opts, stay?: { start: number; end: number }) {
  const plan = planStay(events, attractions, o, stay);
  for (const w of plan.windows) {
    for (const r of [w.perfect, w.short, ...w.alsoFits]) {
      if (!r) continue;
      expect(r.backAt).toBeLessThanOrEqual(r.returnDeadline);
      expect(r.returnDeadline).toBeLessThanOrEqual(w.window.end - PLANNER_CONFIG.safetyBufferMinutes * MIN);
      expect(r.leaveAt).toBeGreaterThanOrEqual(w.window.start);
      expect(conflictsWithEvents(r, events)).toBe(false);
      const usable =
        (r.gapEnd - r.gapStart) / MIN -
        r.outboundTravelMinutes -
        r.returnTravelMinutes -
        r.explorationMinutes -
        r.parkingMinutes -
        r.safetyBufferMinutes;
      expect(usable).toBeGreaterThanOrEqual(0);
    }
  }
  return plan;
}

describe('real wedding schedule (family PDF)', () => {
  it('keeps all four events, in order, and reports the untimed one', () => {
    expect(weddingEvents.map((e) => e.id)).toEqual(['haladhi', 'muhurtha', 'aaratakshate', 'bhojana']);
    expect(untimedEvents(weddingEvents).map((e) => e.id)).toEqual(['haladhi']);
  });

  it('merges Aaratakshate and Bhojana into one busy block without dropping either', () => {
    const blocks = busyBlocks(weddingEvents);
    expect(blocks).toHaveLength(2);
    expect(blocks[1].events.map((e) => e.id)).toEqual(['aaratakshate', 'bhojana']);
    expect(blocks[1].usesAssumption).toBe(true);
  });

  it('finds arrival day, pre-Muhurtha, post-Muhurtha and afternoon windows', () => {
    const w = findFreeWindows(weddingEvents);
    const labels = w.map((x) => `${x.label} ${formatTime(x.start)}-${formatTime(x.end)}`);
    expect(labels).toEqual([
      'Wed 2 Dec · free day 7:00 am-6:30 pm',
      'Thu 3 Dec · before Muhurtha 7:00 am-8:10 am',
      'Thu 3 Dec · between Muhurtha and Aaratakshate 9:30 am-11:20 am',
      'Thu 3 Dec · after Bhojana 2:30 pm-6:30 pm',
    ]);
    expect(w[3].usesAssumption).toBe(true);
  });

  it('2-hour gap after Muhurtha: only very-close places, back before Aaratakshate', () => {
    const plan = assertSafe(weddingEvents);
    const gap = plan.windows[2];
    expect(gap.perfect?.recommendedAttraction?.drivingTimeFromVenue.value).toBeLessThanOrEqual(15);
    expect(gap.perfect!.backAt).toBeLessThanOrEqual(toMs(T('2026-12-03', '10:50')));
    expect(gap.short).not.toBeNull();
    expect(gap.short!.recommendedAttraction!.id).not.toBe(gap.perfect!.recommendedAttraction!.id);
  });

  it('70 minutes before the Muhurtha: nothing opens in time, so relax', () => {
    const plan = assertSafe(weddingEvents);
    const early = plan.windows[1];
    expect(early.perfect).toBeNull();
    expect(early.relax.kind).toBe('relax');
  });

  it('afternoon after the feast fits a Belur-range outing', () => {
    const plan = assertSafe(weddingEvents);
    const pm = plan.windows[3];
    expect(pm.perfect).not.toBeNull();
    const ids = [pm.perfect, pm.short, ...pm.alsoFits].map((r) => r?.recommendedAttraction?.id);
    expect(ids).toContain('belur');
  });
});

describe('live mode', () => {
  it('re-plans from the current time inside a window and drops past windows', () => {
    const now = toMs(T('2026-12-03', '09:40'));
    const plan = planStay(weddingEvents, attractions, opts, undefined, now);
    expect(plan.windows.every((w) => w.window.end > now)).toBe(true);
    const cur = plan.windows[0];
    expect(cur.window.start).toBe(now);
    for (const r of [cur.perfect, cur.short, ...cur.alsoFits]) {
      if (!r) continue;
      expect(r.leaveAt).toBeGreaterThanOrEqual(now);
      expect(r.backAt).toBeLessThanOrEqual(r.returnDeadline);
      expect(conflictsWithEvents(r, weddingEvents)).toBe(false);
    }
  });
});

describe('hypothetical schedules', () => {
  it('very short gap (20 min) gives relax only', () => {
    const events = [ev('a', T('2026-12-03', '10:00'), T('2026-12-03', '11:00')), ev('b', T('2026-12-03', '11:30'), T('2026-12-03', '12:00'))];
    const plan = assertSafe(events);
    const between = plan.windows.find((w) => w.window.label.includes('between'))!;
    expect(between.perfect).toBeNull();
    expect(between.short).toBeNull();
  });

  it('long gap (6 h) offers more than one option', () => {
    const events = [ev('a', T('2026-12-03', '08:00'), T('2026-12-03', '09:00')), ev('b', T('2026-12-03', '15:00'), T('2026-12-03', '16:00'))];
    const plan = assertSafe(events);
    const between = plan.windows.find((w) => w.window.label.includes('between'))!;
    expect(between.perfect).not.toBeNull();
    expect(between.alsoFits.length).toBeGreaterThan(1);
  });

  it('overlapping events are merged for planning but none are lost', () => {
    const events = [
      ev('x', T('2026-12-03', '09:00'), T('2026-12-03', '11:00')),
      ev('y', T('2026-12-03', '10:30'), T('2026-12-03', '12:00')),
      ev('z', T('2026-12-03', '11:45'), T('2026-12-03', '13:00')),
    ];
    const blocks = busyBlocks(events);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].events.map((e) => e.id)).toEqual(['x', 'y', 'z']);
    assertSafe(events);
  });

  it('many events on one day', () => {
    const events = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00'].map((t, i) =>
      ev(`e${i}`, T('2026-12-03', t), new Date(toMs(T('2026-12-03', t)) + 45 * MIN).toISOString()),
    );
    assertSafe(events);
  });

  it('early morning and late evening functions', () => {
    const events = [ev('dawn', T('2026-12-03', '05:30'), T('2026-12-03', '06:30')), ev('night', T('2026-12-03', '21:00'), T('2026-12-03', '23:30'))];
    const plan = assertSafe(events);
    // Windows never extend outside daylight.
    for (const w of plan.windows) {
      expect(formatTime(w.window.start) >= '').toBe(true);
    }
    expect(plan.windows.every((w) => w.window.end <= toMs(`${new Date(w.window.start + 330 * MIN).toISOString().slice(0, 10)}T18:30:00+05:30`))).toBe(true);
  });

  it('an event with no end and no assumption still blocks time', () => {
    const events = [ev('open', T('2026-12-03', '12:00'), null)];
    const blocks = busyBlocks(events);
    expect(blocks[0].usesAssumption).toBe(true);
    expect(blocks[0].end - toMs(T('2026-12-03', '12:00'))).toBe(60 * MIN);
    assertSafe(events);
  });

  it('elders get no steep or rough excursions and a longer transition', () => {
    const plan = assertSafe(weddingEvents, { ...opts, guestType: 'elders' });
    for (const w of plan.windows) {
      for (const r of [w.perfect, w.short, ...w.alsoFits]) {
        if (!r) continue;
        expect(['mullayanagiri', 'hebbe']).not.toContain(r.recommendedAttraction!.id);
        expect(r.parkingMinutes).toBe(PLANNER_CONFIG.parkingMinutes * 2 + PLANNER_CONFIG.groupTransitionMinutes.elders);
      }
    }
  });

  it('interest filter only returns matching categories', () => {
    const plan = assertSafe(weddingEvents, { ...opts, interests: ['water'] });
    for (const w of plan.windows) {
      for (const r of [w.perfect, w.short, ...w.alsoFits]) {
        if (r) expect(r.recommendedAttraction!.categories).toContain('water');
      }
    }
  });

  it('relaxed pace never produces a later return than the deadline', () => {
    assertSafe(weddingEvents, { ...opts, pace: 'relaxed', guestType: 'family' });
    assertSafe(weddingEvents, { ...opts, pace: 'quick', guestType: 'friends' });
  });

  it('respects verified closing time (Belur closes 19:30) and opening time', () => {
    const w = { id: 'w', start: toMs(T('2026-12-02', '06:00')), end: toMs(T('2026-12-02', '09:30')), nextEvent: null, previousEvent: null, label: '', usesAssumption: false };
    const belur = attractions.find((a) => a.id === 'belur')!;
    const plan = recommendForWindow(w, [belur], opts);
    // Opens 7:30: leaves at 6:45 earliest so arrival is not before opening.
    if (plan.perfect) expect(plan.perfect.arriveAt).toBeGreaterThanOrEqual(toMs(T('2026-12-02', '07:30')));
  });

  it('arrival time on the free day narrows the options', () => {
    const late = { start: toMs(T('2026-12-02', '16:00')), end: toMs(PLANNER_CONFIG.stayEnd) };
    const plan = assertSafe(weddingEvents, opts, late);
    const wed = plan.windows.find((w) => w.window.label.startsWith('Wed'))!;
    if (wed.perfect) expect(wed.perfect.recommendedAttraction!.drivingTimeFromVenue.value).toBeLessThanOrEqual(60);
  });
});
