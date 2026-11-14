import { describe, expect, it } from 'vitest';
import { weddingEvents } from '../data/weddingEvents';
import { activePanel, anyPanelOpacity, PANELS, panelAnchor, panelOpacity, panelShift } from './heroPanels';
import { eventTimeText } from './timeCalculations';

const steps = Array.from({ length: 1001 }, (_, k) => k / 1000);

describe('hero panels', () => {
  it('opens fully visible on the first panel', () => {
    expect(panelOpacity(0, 0)).toBe(1);
    expect(activePanel(0)).toBe(0);
  });

  it('never shows two panels at once', () => {
    for (const p of steps) {
      const visible = PANELS.filter((_, i) => panelOpacity(i, p) > 0);
      expect(visible.length, `p=${p}`).toBeLessThanOrEqual(1);
    }
  });

  it('gives every panel a full-opacity hold, in order', () => {
    PANELS.forEach((_, i) => {
      expect(panelOpacity(i, panelAnchor(i))).toBe(1);
      expect(activePanel(panelAnchor(i))).toBe(i);
    });
    const anchors = PANELS.map((_, i) => panelAnchor(i));
    expect([...anchors].sort((a, b) => a - b)).toEqual(anchors);
  });

  it('keeps the venue panel up through the hand-off, so the hero never ends empty', () => {
    expect(activePanel(0.95)).toBe(3);
    expect(activePanel(1)).toBe(3);
    expect(anyPanelOpacity(1)).toBe(1);
  });

  it('has a panel or a fade in progress at every point', () => {
    for (const p of steps) {
      const gap = PANELS.every((_, i) => panelOpacity(i, p) === 0);
      // The only all-zero moments are the instants where one window hands to the next.
      if (gap) expect(PANELS.some((x) => x.win[0] === p || x.win[3] === p), `p=${p}`).toBe(true);
    }
  });

  it('moves panels up as they leave and down before they arrive', () => {
    expect(panelShift(1, 0.23)).toBeGreaterThan(0);
    expect(panelShift(1, panelAnchor(1))).toBe(0);
    expect(panelShift(1, 0.45)).toBeLessThan(0);
  });
});

describe('eventTimeText', () => {
  it('formats the invitation times', () => {
    const t = Object.fromEntries(weddingEvents.map((e) => [e.id, eventTimeText(e)]));
    expect(t.haladhi).toBe('From 2:00 pm');
    expect(t.sangeeth).toBe('From 6:00 pm');
    expect(t.muhurtha).toBe('8:30 am – 9:30 am');
    expect(t.aaratakshate).toBe('From 11:30 am');
    expect(t.bhojana).toBe('From 12:30 pm');
  });
});
