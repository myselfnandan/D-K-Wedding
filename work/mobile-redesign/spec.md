# Spec — mobile-redesign

This assumes the defaults in intent.md (Q1–Q4). Where an answer changes something, the section is marked.

## A. Hero: an invitation that unfolds over the film

The scroll track gets longer so that each panel has room: **mobile 420svh** (scroll range ≈ 3.2 screens) and **desktop 380svh**. The film still scrubs across the whole track. The frame loader, bitmap window and poster are unchanged.

| Panel | Scroll window (in / hold / out) | Content (source) |
|---|---|---|
| 1 Opening | 0 → 0.16 hold, out by 0.22 | Invocation line (small, `INVOCATIONS`), "Shubha Vivaha", names, date · Muhurtha 8:30–9:30 am, countdown, RSVP + Directions |
| 2 Families | 0.24 → 0.44 | "With the blessings of our elders", groom's parents + home, "request your gracious presence at the wedding of their eldest son", **Chi. Ra. Dileep S**, *with*, **Chi. Kum. Sow. Kavya H Y**, eldest daughter of the bride's parents + home (`COUPLE`) |
| 3 Programme | 0.48 → 0.70 | Heading "The celebrations". The 4 events from `weddingEvents` as a compact list: day/date, title, time ("time to be confirmed" when null), place. Muhurtha highlighted. Panchanga line · Lagna: Dhanu. "Full details" link → `#celebrations` |
| 4 Venue & welcome | 0.74 → 0.90 | Venue hall + address (`VENUE`), "With love, awaiting your arrival", `HOSTS.awaiting`, `HOSTS.welcome`, buttons: Directions, RSVP |
| Hand-off | 0.90 → 1 | Film darkens to `--ink`. The next section begins in ink as well, so there is no flat gradient screen (see C) |

- **Layout on a phone:** each panel is bottom-anchored in the sticky stage, max height about 70svh, over an ink shade that follows the panel's opacity (as now). Type: names 56–64 px; panel body 16–17 px with line-height 1.6. Programme rows have a 44 px minimum touch height.
- **Layout on desktop:** the same panels, left-aligned in a 560 px column on the lower left, so the film keeps the right two-thirds.
- **Only the active panel is interactive.** The others get `inert` and `pointer-events: none` (the existing pattern, extended to four panels). Panels are `<section>`-like groups with headings, so a screen reader reads them in document order whatever their opacity.
- **Anchors:** invisible markers inside the track at each panel's scroll position (`#invitation` → panel 2, `#programme` → panel 3). The nav and the "Scroll" cue jump there.
- **Reduced motion:** a static poster stage with the four panels stacked in normal document flow on an ink background. No film, as now.
- The three short captions ("Halebidu · the old Hoysala capital" etc.) are **removed**; the real content replaces them.

New data access: a `programme()` helper in `src/data/weddingEvents.ts`, or reuse `timeText` from WeddingTimeline, moved to `utils/timeCalculations.ts` so that both use one formatter. The hero and the timeline must never disagree on a time.

## B. Sections removed (Q2, Q3)
- `InvitationSection` is removed from `App`. Its unique content (invocations, panchanga, hosts) now lives in hero panels 1/3/4. The file is deleted.
- `StoryFilm` is removed from `App`, and the file and `story.css` are deleted. The `Scene` component stays (used by `Closing`). The nav item "Story" is removed.
- `NAV_ITEMS`: Invitation → `#invitation` (the families panel anchor), Celebrations, Explore, Discover, Travel, Guest info.

## C. Transitions between sections (mobile first)
- **Hero → Celebrations:** the hero ends in ink. Celebrations gets an ink top band (its heading block on ink, about 40svh), fading into its light body with a 120 px gradient. That replaces the full-screen blank gradient.
- **Dark/light seams elsewhere** (Food ↔ Travel, Info → RSVP → Closing): a consistent 64 px gradient seam between ink and cloud sections. No hard edges, no empty screens.
- **Section vertical padding on phones:** `clamp(72px, 11vw, 144px)` → **48 px** under 560 px. Section-head bottom margin 36 → 24 px.
- Reveal animations stay (short opacity/translate). Nothing new animates.

## D. Section-by-section on phones (≤ 560 px unless noted)
- **Celebrations:** unchanged structure, tighter card padding (16 px), date and tag on one line.
- **Explore (planner):** controls stay. The free-window tabs become a horizontal snap row with the active tab scrolled into view. Result cards get 16 px padding. Detailed notes are behind the existing "Details" toggle where present. No logic change.
- **Discover:** a compact card. A 96×96 photo thumbnail sits on the left (or no image on phones if Q4 = no photos). Name, distance · drive time and the Directions button are always visible. Description, hours, "suits", best time and warnings sit behind a "More" disclosure (a `<details>`-like button with `aria-expanded`). Target: each card ≈ 170 px closed. The ruler and filters stay.
- **Food:** placeholder art hidden on phones. With photos (Q4), the coffee photo is shown as a 16:9 image. Dishes as a compact list.
- **Travel / Guest info / RSVP:** tighter padding, buttons full width on phones, unchanged content.
- **Closing:** the copy moves above the illustration into its own ink block. The illustration sits below as a 40svh band behind nothing. Contrast ≥ 4.5:1.
- **Floating nav:** unchanged. Sections keep `scroll-padding-top: 80px` so headings never sit under it.

## E. Photos (Q4)
`npm run images` (existing script; Wikimedia Commons, licences already recorded). Output goes to `public/images/` and `imageManifest.json`; `Photo` already prefers them over the drawings. I'll check the total size and each photo's crop at 390 px. The credits list in the footer already renders whatever is present.

## Risks
- **The longer hero (420svh)** costs about 1.8 more screens of scrolling than now, but replaces the Invitation section (1.7 screens) and the Story film (6 screens). The net page is much shorter.
- **Text over moving film:** frames vary in brightness. The shade follows panel opacity, and criterion 2 is measured on real frames at each panel's position, not the poster.
- **Removing sections** takes their screen-reader landmarks with them. The hero panels carry headings in order (h1 names, h2 "You're invited", h2 "The celebrations", h2 "Venue").
- **Photo download:** depends on Wikimedia being reachable. If it fails, the drawings stay and Discover/Food on phones fall back to text-only cards (no blank slots).
