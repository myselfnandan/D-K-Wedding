# Plan — hero-frames-english

Baseline: nested repo at this folder, commit `4000f5c` (see intent.md). Nothing else is committed.

## Step 0 — tooling (dependency change, needs your OK: intent Q2)
```
npm i -D ffmpeg-static ffprobe-static playwright
npx playwright install chromium
```

## Step 1 — frame pipeline (Change 1a)
| File | Change |
|---|---|
| `scripts/build-hero-frames.mjs` | **new** — probe, locate the watermark, delogo or crop, encode both sets plus posters, enforce the budget, write the JSON, the check image and spot frames (spec §A) |
| `package.json` | add `"frames": "node scripts/build-hero-frames.mjs"`; devDeps from step 0 |
| `.gitignore` | add `media-src/` |
| `public/frames/desktop/*`, `public/frames/mobile/*` | **regenerated** (overwrites the existing frames, intent Q1) |
| `src/data/heroFrames.json` | **regenerated** in the spec shape |
| `work/hero-frames-english/watermark-check.png`, `spot-f000.png`, `spot-f060.png`, `spot-f119.png` | **regenerated / new** |

Then I run `npm run frames`, look at the check image, and decide between delogo and crop (spec §A step 3). If neither is clean, I **stop and ask**.

## Step 2 — English only (Change 2), done before the hero so the hero is written in English from the start
In this order (types first, so `tsc` points at every usage):
1. `src/data/types.ts`
2. `src/data/guestInfo.ts`, `food.ts`, `weddingEvents.ts`, `attractions.ts`
3. `src/sections/InvitationSection.tsx`, `WeddingTimeline.tsx`, `GuestInformation.tsx`, `DestinationExplorer.tsx`, `LocalFoodGuide.tsx`, `StoryFilm.tsx`, `Closing.tsx`, `src/components/Navigation.tsx`
4. `src/utils/itineraryEngine.test.ts` (fixture field only)
5. CSS: `src/styles/global.css`, `src/sections/sections.css`, `story.css`, `hero.css`
6. `npm uninstall @fontsource/noto-serif-kannada`

Checkpoint: `npm run typecheck && npm test`.

## Step 3 — hero film (Change 1b)
| File | Change |
|---|---|
| `src/utils/frameSequence.ts` | **new** — pure helpers (spec §B) |
| `src/utils/frameSequence.test.ts` | **new** — tests for `loadOrder` (keyframes first, a permutation), `nearestLoaded` (exact, outward search, ties, none), `progressToIndex` (clamps), `coverRect` (wide and tall) |
| `src/hooks/useFrameSequence.ts` | **new** — loader, ImageBitmap cache, keyframe progress, set selection |
| `src/sections/HeroFilm.tsx` | **new** — the component (spec §B) |
| `src/sections/hero.css` | rewritten for `.hero-film` / stage / canvas / shade / captions / static variant. The countdown, actions and scroll-cue rules are kept |
| `src/sections/HeroSection.tsx` | **deleted** (replaced by HeroFilm) |
| `src/components/Preloader.tsx` | real keyframe progress, 1.8 s cap |
| `src/App.tsx` | use `useFrameSequence`, render `HeroFilm`, pass progress to `Preloader` |
| `src/sections/Closing.tsx` | footer Gemini line |
| `index.html` | no change planned (the `<picture>` handles poster priority without JS) |

Checkpoint: `npm run typecheck && npm test && npm run build`.

## Step 4 — verification scripts (not shipped; they live in `work/`)
| File | Purpose |
|---|---|
| `work/hero-frames-english/scan-kannada.mjs` | Node scan of `src/`, `index.html` and `dist/` for `[ಀ-೿]`, all text files; lists `dist/assets` font files and fails on any `kannada` name |
| `work/hero-frames-english/verify.mjs` | Playwright against `npm run preview` (shots, canvas pixels, reduced-motion request count, overflow, interactions) |

## Verify commands (run in this order, all reported with real output)
```
ffprobe (via the script's probe output; also `npx ffprobe-static`-path direct call on media-src/hero-source.mp4)
npm run frames
du -sh public/frames/*
npm run typecheck
npm test
npm run build
node work/hero-frames-english/scan-kannada.mjs
npm run preview -- --port 4173 --strictPort   (background)
node work/hero-frames-english/verify.mjs http://localhost:4173/
git diff --stat 4000f5c && git status   (then read the full diff)
```

## Criterion → check
| # | Criterion | Check |
|---|---|---|
| 1 | Zero Kannada in src, index.html, dist | `scan-kannada.mjs` (after build) |
| 2 | No Kannada font in dist/assets | `scan-kannada.mjs` font listing; `npm ls @fontsource/noto-serif-kannada` is empty |
| 3 | Scrubs 120 frames forwards and backwards, desktop + mobile | `frameSequence.test.ts` (index mapping); `verify.mjs`: at 1440×900 and 390×844, sample the canvas at p=0.1, 0.5 and 0.9, then scroll back to 0.1. The frames must differ between positions, and the return to 0.1 must match the first 0.1 sample (rewind). It also records the drawn frame index exposed through `data-frame` on the canvas |
| 4 | No watermark | `watermark-check.png` + `spot-f000/060/119.png`, viewed and described by me |
| 5 | Poster first paint with readable names; budgets | `verify.mjs` screenshot with JS frame requests blocked (poster only) + a contrast ratio computed from pixels behind the names; `npm run frames` totals + `du -sh` |
| 6 | Reduced motion: static, ≤ 2 `/frames/` requests | `verify.mjs` context with `reducedMotion:'reduce'`, counting requests, plus a check that there is no canvas |
| 7 | No overflow at 360/390/768/1440; interactions | `verify.mjs`: `scrollWidth <= innerWidth` at each width; nav link click → hash/scroll position; mobile menu opens and closes; planner interaction; filters change the count; the calendar download fires a `download` event; the RSVP `href` starts with `https://wa.me/919980450419` |
| 8 | typecheck/test/build | the commands above |

Screenshots: `work/hero-frames-english/shots/{390x844,1440x900}-p{0,30,60,95}.png`.

## Rollback
Everything is uncommitted on top of `4000f5c`. To roll back: `git restore . && git clean -fd -- src public scripts`, then `npm install` to restore the Kannada font dependency and drop the new devDependencies. The pre-existing frames are in the baseline commit and in `hero-frames.tgz`.

---

## Amendments approved 9 Nov 2026 (these supersede the plan above where they differ)
- **No frame pipeline.** The committed frames, posters and `src/data/heroFrames.json` are the final assets (watermark already removed upstream). There is no `scripts/build-hero-frames.mjs`, no `"frames"` script, and no delogo/crop code. `HeroFilm` reads the manifest as it is (`pattern`, `indexPad`, `poster`, `bytes`), typed as `HeroFramesManifest` in `src/utils/frameSequence.ts`.
- **Dependencies:** only `playwright` was added (dev), plus the Chromium download. `@fontsource/noto-serif-kannada` was removed.
- **Memory:** all 120 frames are kept as decoded `HTMLImageElement`s. At most 24 (desktop) or 16 (mobile) `ImageBitmap`s live at once, in a window around the current frame; the rest are evicted with `close()`. A draw uses the frame's bitmap, else its `<img>`, else the nearest loaded frame. The JS heap is measured after two full scrubs.
- **`.gitignore`:** adds `media-src/`, `*.tgz` and `vite.config.ts.timestamp-*.mjs`.
- **Watermark evidence:** the existing `watermark-check.png`, plus `spot-check-frames-0-60-119.png` (full frames and 2× bottom-right crops), which is new.
- Pre-flight asset check: 120 frames + `poster.avif` + `poster.webp` per set, and frames 0/60/119 decode. **Passed.**
