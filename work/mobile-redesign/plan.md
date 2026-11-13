# Plan — mobile-redesign

## Step 0 — checkpoint (Q1)
`git add -A -- . ':!work/mobile-redesign' && git commit -m "Hero film from frames; English-only site"`, then one commit of the previous task (only if approved). `work/mobile-redesign/` stays uncommitted.

## Step 1 — photos (Q4)
`npm run images`, then `du -sh public/images` and a look at each photo at 390 px. If the download fails: stop and report; the rest proceeds with the drawings hidden on phones.

## Step 2 — hero panels
| File | Change |
|---|---|
| `src/utils/timeCalculations.ts` | add `eventTimeText(e)` (moved from WeddingTimeline's `timeText`) |
| `src/sections/WeddingTimeline.tsx` | use `eventTimeText` (no visual change) |
| `src/sections/HeroFilm.tsx` | 4 panels (Opening, Families, Programme, Venue), panel windows, active-panel `inert`, anchors, captions removed; reduced-motion stacked variant |
| `src/sections/hero.css` | track heights (420svh / 380svh), panel layout mobile + desktop, shade per panel |
| `src/utils/frameSequence.ts` + test | `panelWindows` table + a pure `activePanel(p)` helper, unit-tested (no overlaps, full coverage 0–0.9) |

## Step 3 — remove the duplicated sections (Q2, Q3)
`src/App.tsx` (drop `InvitationSection`, `StoryFilm`); delete `src/sections/InvitationSection.tsx`, `src/sections/StoryFilm.tsx`, `src/sections/story.css`; `src/components/Navigation.tsx` (`NAV_ITEMS`); `src/sections/sections.css` (drop `.invitation*` rules that become unused).

## Step 4 — mobile pass and transitions
`src/styles/global.css` (section padding and section-head on phones, the seam utility), `src/sections/sections.css` (Celebrations, Food, Travel, Info, RSVP, Closing), `src/sections/itinerary.css` (planner), `src/sections/discover.css` + `src/sections/DestinationExplorer.tsx` (compact card with a "More" disclosure), `src/sections/LocalFoodGuide.tsx` (art hidden on phones), `src/sections/Closing.tsx` (copy above the illustration).

Checkpoint after each step: `npm run typecheck && npm test`.

## Step 5 — verification
New script `work/mobile-redesign/verify-mobile.mjs`, plus the existing `work/hero-frames-english/verify.mjs`, updated for the new hero: the RSVP click happens on panel 1, and the caption checks are replaced by panel checks.

| # | Criterion | Check |
|---|---|---|
| 1 | Hero content | at 390×844 and 360×740, scroll to each panel's hold midpoint; assert opacity ≥ 0.95, the expected text present (names, both parents, 4 event titles + times, venue hall), and the buttons clickable |
| 2 | Hero legibility | for each panel: hide its text, screenshot the real frame + shade, contrast of text colour vs the brightest 2% behind each text box ≥ 4.5 |
| 3 | No empty screens | step through the page at 80% viewport; each step has ≥ 1 visible text node with opacity > 0.5 inside the viewport |
| 4 | Page height ≤ 18,000 px at 390×844 | `document.body.scrollHeight` |
| 5 | Closing | contrast measured as in 2; bounding boxes of copy vs illustration don't intersect |
| 6 | Reduced motion | all four panels' text present and visible stacked; `/frames/` requests ≤ 2 |
| 7 | Regressions | `verify.mjs` (overflow, nav, planner, filters, calendar, RSVP, mobile menu, scrub), `scan-kannada.mjs`, `npm run typecheck`, `npm test`, `npm run build`; desktop 1440 screenshots of every section, reviewed by eye |

Plus before/after screenshot sheets at 390×844 (the "before" set is already captured in `work/mobile-redesign/before/`), which I'll look at myself.

## Rollback
Each step is independent and uncommitted on top of the Step 0 checkpoint: `git restore` / `git clean` to the checkpoint; `public/images/` and `imageManifest.json` revert with the same command.

---

## As built (deviations from the plan above, 14 Nov 2026)
- **Panel timing** lives in a new pure module `src/utils/heroPanels.ts` (+ test), not in `frameSequence.ts`. Same idea, clearer separation.
- **The venue panel holds to the end of the hero**, and the film dims to 60% ink rather than to solid ink. The first build left about half a screen of empty, darkened film at the hand-off; this removes it. The hero track is **380svh on all screens** (the plan said 420svh on phones) to save height.
- **Dark/light seams:** only the hero → Celebrations seam was added, plus the Closing restructure. The other dark/light edges are kept as hard edges. None of them produces an empty screen (criterion 3 passes), so no extra gradients were added.
- **Planner (`itinerary.css`):** only spacing on phones; the free-window snap row already existed.
- **Scroll cue:** a bug found in verification. When faded out, it still caught taps over the bottom of each panel. It is now inert once faded.
- **`work/hero-frames-english/verify.mjs`:** the reduced-motion check now measures the poster stage (one screen), since the static hero now stacks all panels by design.
