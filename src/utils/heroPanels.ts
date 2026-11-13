/**
 * Choreography for the hero's four invitation panels over the film. Pure, so it is unit-tested,
 * and the component, the shades and the "inert" logic all read the same numbers.
 */

export type PanelId = 'opening' | 'families' | 'programme' | 'venue';

/**
 * [fade-in start, fully in, hold end, fully out], as hero scroll progress 0..1. Windows touch but never overlap.
 * The last panel holds to the end (its fade-out lies beyond 1, which scroll progress never reaches), so the
 * hero never shows an empty film: the venue and its buttons stay up while the stage scrolls away.
 */
export const PANELS: { id: PanelId; win: [number, number, number, number] }[] = [
  { id: 'opening', win: [0, 0, 0.16, 0.22] },
  { id: 'families', win: [0.22, 0.26, 0.42, 0.46] },
  { id: 'programme', win: [0.46, 0.5, 0.68, 0.72] },
  { id: 'venue', win: [0.72, 0.76, 1, 1.1] },
];

/** The film dims towards ink over this range (to HANDOFF_DIM) as the hero hands over to the next section. */
export const HANDOFF: [number, number] = [0.86, 1];
export const HANDOFF_DIM = 0.6;

/** Where a link to a panel should land: the middle of its hold. */
export function panelAnchor(i: number): number {
  const [, a, b] = PANELS[i].win;
  return (a + b) / 2;
}

/** Opacity of panel `i` at progress `p` (piecewise linear). */
export function panelOpacity(i: number, p: number): number {
  const [a, b, c, d] = PANELS[i].win;
  if (p < a || p > d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p <= c) return 1;
  return (d - p) / (d - c);
}

/** Vertical offset in px: rises in from below, leaves upwards. */
export function panelShift(i: number, p: number, dist = 28): number {
  const [, b, c] = PANELS[i].win;
  const hidden = 1 - panelOpacity(i, p);
  if (p < b) return hidden * dist;
  if (p > c) return -hidden * dist;
  return 0;
}

/** The panel that can be read and clicked at `p` (opacity ≥ 0.5), or -1 between panels and after the last. */
export function activePanel(p: number): number {
  for (let i = 0; i < PANELS.length; i++) if (panelOpacity(i, p) >= 0.5) return i;
  return -1;
}

/** Strongest panel opacity at `p` (drives the shade behind the reading panels). */
export function anyPanelOpacity(p: number, from = 0): number {
  let m = 0;
  for (let i = from; i < PANELS.length; i++) m = Math.max(m, panelOpacity(i, p));
  return m;
}
