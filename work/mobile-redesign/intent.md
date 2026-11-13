# Intent — mobile-redesign

**Tier:** Non-trivial (multi-section redesign, content restructure, one asset download). No auth, money or data changes.

## The request (from the owner, 13 Nov 2026)
1. The opening section should show the real invitation (the couple's names, both families, the invitation text and the programme) instead of mostly the Hoysaleswara temple film with a few captions, so that it doesn't look plain.
2. Mobile comes first, across every section and every transition between sections. Most guests will open this on a phone.

## What a phone shows today (390×844, measured from the current uncommitted build)
The page is **31,238 px tall, about 37 screens.**

| Section | Height | Problem on a phone |
|---|---|---|
| Hero (`#welcome`) | 2,026 | After the names fade there are ~2 screens of film with one short caption, then a full screen of blank ink→white gradient |
| Invitation | 1,425 | Families text is small and dense. About 1 screen of flat placeholder art |
| Story film | 5,064 | 6 screens of a mostly empty night-sky illustration with 3 lines of text each. Repeats the programme and venue |
| Celebrations | 1,772 | Fine; slightly loose spacing |
| Explore (planner) | 3,129 | Works; long, loose spacing |
| Discover | 10,596 | 13 tall cards, each with a ~200 px placeholder drawing, every fact and warning always open |
| Food | 2,227 | About 1 screen of placeholder art |
| Travel / Info / RSVP | 3,942 | Fine; loose spacing |
| Closing | 776 | Headline and paragraph overlap the temple illustration; low contrast |

Every photo slot shows a placeholder drawing because `public/images/` is empty: `npm run images` (licensed Wikimedia Commons photos, credits already in the footer) has never been run.

## Scope
- The hero becomes an **unfolding invitation over the film**: four real-content panels in turn: opening, families, programme, venue and welcome. They are driven by the same scroll and use data from `guestInfo.ts` / `weddingEvents.ts`, so nothing is retyped.
- Remove the duplication the new hero creates (the Invitation section and the Story film; see the open questions).
- Mobile-first pass on every remaining section: spacing, type scale, compact Discover cards, placeholder art kept off phones, the Closing overlap fixed.
- Clean hand-offs between sections. Nowhere does a phone screen show no content.

## Non-goals
- No new facts or copy beyond what the invitation data already holds. No invented content.
- No change to the planner engine, the data, or the frame assets.
- No re-theme. Palette, fonts and the indigo/periwinkle identity stay.
- No commit, push or deploy unless the owner says so.

## Acceptance criteria
1. **Hero content:** at 390×844 and 360×740, each panel (names + date + countdown + RSVP; both families' invitation text; all four programme events with date/time; venue + hosts + Directions) reaches full opacity at its scroll point, and its buttons are clickable there.
2. **Hero legibility:** every hero panel's text is ≥ 4.5:1 against the brightest 2% of real film pixels behind it, at that panel's scroll position (real frames, not the poster).
3. **No empty screens:** stepping through the whole page at 390×844 in 80%-of-viewport steps, every step shows at least one visible text element.
4. **Shorter on phones:** total page height at 390×844 ≤ **18,000 px** (from 31,238), with all sections that remain still functional.
5. **Closing:** the headline and paragraph have ≥ 4.5:1 contrast and no overlap with the illustration.
6. **Reduced motion:** the hero renders every panel's content stacked in normal flow over the poster, with zero frame requests beyond the poster.
7. **Regressions:** no horizontal overflow at 360/390/768/1440. Nav, planner, filters, calendar download, the RSVP WhatsApp link and the mobile menu all still pass. The Kannada scan is still zero. `typecheck`, `test` and `build` pass. Desktop at 1440 has no broken layout (reviewed in screenshots).

## Open questions (my default in bold)
- **Q1. Commit the previous change first.** The hero-film + English-only work is still uncommitted. **Commit it as one checkpoint before starting**, so this redesign is a separate, readable diff. The alternative is to stack the redesign on top uncommitted.
- **Q2. The Invitation section:** once the hero carries the families and invitation text, **remove the section**. The invocation line and panchanga move into the hero, and the nav item "Invitation" jumps to the families panel. The alternative is to keep it as a short text section.
- **Q3. The Story film (6 screens):** its chapters repeat the programme and venue. **Remove it from the page.** Alternatives: keep it on desktop only, or show it on phones as the compact static chapter list it already has for reduced motion. (Last time you asked me to leave its Scene alone; this is your call.)
- **Q4. Photos:** **run `npm run images`** to download the 13 Wikimedia Commons photos the site already credits. This needs the network, adds roughly 5–10 MB of AVIF/WebP to `public/images/`, and photos replace the placeholder drawings everywhere. The alternative is to keep the drawings and hide them on phones.
