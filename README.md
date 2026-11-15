# Dileep & Kavya — wedding invitation & guest planner

Single-page React (Vite + TypeScript + Motion) site for the wedding on **Thursday 3 December 2026** at Sri Pushpagiri Mahasamsthana Kalyana Mantapa, Halebeedu.

```bash
npm install
npm run images   # one-time: downloads the licensed Wikimedia Commons photos (needs normal internet)
npm run dev      # local preview
npm test         # planner engine + schedule scenarios
npm run build    # static site in dist/ (relative paths — host anywhere)
```

## Where to edit
| What | File |
|---|---|
| Events (master timeline) | `src/data/weddingEvents.ts` — fill `startDateTime` / `endDateTime` when the family confirms; the planner recalculates |
| Names, venue, contacts, accommodation, dress code | `src/data/guestInfo.ts` |
| Places, drive times, hours | `src/data/attractions.ts` (each fact has `verified` + `source`) |
| Travel from cities | `src/data/travelRoutes.ts` |
| Food | `src/data/food.ts` |
| Planner buffers | `src/data/config.ts` |
| Photos & credits | `src/data/images.ts`, then `npm run images` |

## Test the live countdown
Append `?now=2026-12-03T09:40:00%2B05:30` to the URL to freeze the clock inside a free window.

## Data provenance
- Event details: the family's invitation PDF (V7.0).
- Drive times/distances: Google Maps from the venue pin, checked 9 Nov 2026.
- Belur hours and Yagachi season: Karnataka Tourism. Halebeedu hours: third-party listings, marked unverified in the UI.
- Mullayanagiri/Baba Budangiri booking rules: press report; confirm on chikkamagaluru.nic.in.
