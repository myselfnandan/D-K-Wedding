# Spec — hero-frames-english

## A. Frame pipeline — `scripts/build-hero-frames.mjs` (`npm run frames`)

**Binaries.** Use `ffmpeg`/`ffprobe` from `PATH` if present. Otherwise use `ffmpeg-static` / `ffprobe-static`. The script fails with a clear message if neither is available.

**Step 1 — probe.** Run `ffprobe` on the video stream: width, height, r_frame_rate, duration, nb_frames, and whether audio is present. Fail if it is not 1280×720 with 240 frames. The script prints the result and I paste it into the report.

**Step 2 — locate the watermark.** Extract frames 0, 120 and 239 as raw RGB (ffmpeg `-f rawvideo`, no extra image library). In the bottom-right quadrant, mark pixels that are bright (luma > 200) and low-saturation (max−min < 25). Take the bounding box of pixels that are set in **all three** frames; the sparkle is static and the floor moves, so this rejects bright stone. Pad by 10 px. If the box is missing, or is far (> 20 px) from the expected centre (1160, 600), fall back to the brief's box, `x=1126 y=566 w=70 h=70`, and log a warning. Then write the chosen box to the console.

**Step 3 — remove it.** Use `METHOD = 'delogo' | 'crop'`, chosen by a CLI flag (`--method=crop`) with `delogo` as the default.
- `delogo`: `delogo=x:y:w:h` applied first in the filter chain.
- `crop`: `crop=1280:560:0:0`. Desktop frames are then 1280×560; the canvas cover-fit absorbs the difference.

How I choose: run `delogo` first, build `watermark-check.png`, and look at it. If I can see a smear or a blurred patch that reads as a "ghost" at hero scale, re-run with `--method=crop` and compare. The report explains the choice with both images. If **neither** is acceptable, I stop and ask; I don't invent a third method.

**Step 4 — encode.**
- Sampling: `select='not(mod(n\,2))'`, `-vsync vfr` → 120 frames, no audio (`-an`).
- Desktop: `scale=1280:-2`, `libwebp -quality Q` (start at 62) → `public/frames/desktop/f-000.webp` … `f-119.webp`.
- Mobile: centre crop `crop=ih*9/16:ih` (405×720), `-quality Q` (start at 60) → `public/frames/mobile/`. Mobile is cropped from the **delogo'd** stream, so the order is the same. In practice the sparkle at x≈1160 lies outside the centre 405 px anyway; with the crop method the mobile frames are 315×560.
- Posters: frame 0 of each set → `poster.webp` (same Q) and `poster.avif` (`libaom-av1`, `-still-picture 1`, crf ~34). If the bundled ffmpeg lacks an AV1 encoder, use `sharp` (already a devDependency) to convert `poster.webp` → `poster.avif`.
- Clean old frames in the output directories before writing.

**Step 5 — budget.** Sum the bytes of each set (frames + posters). If desktop > 7 MB or mobile > 3 MB, drop Q by 4 and re-encode that set (floor 40; fail below that). Print the totals.

**Step 6 — metadata.** Write `src/data/heroFrames.json`:
```json
{ "count": 120,
  "desktop": { "width": 1280, "height": 720, "path": "frames/desktop/" },
  "mobile":  { "width": 405,  "height": 720, "path": "frames/mobile/" },
  "watermarkMethod": "delogo x=… y=… w=… h=…",
  "generatedAt": "ISO-8601" }
```
Paths are relative, with no leading slash, because Vite `base: './'` keeps the build host-anywhere.

**Step 7 — check image.** Crop the padded watermark box, plus a 40 px margin, from processed desktop frames 0, 60 and 119. These are the source frames at the watermark position; with the crop method, I take the equivalent region from the source frame and show that it is outside the kept area. Upscale ×2 and `hstack` → `work/hero-frames-english/watermark-check.png`. Also write three full frames (0, 60, 119) → `work/hero-frames-english/spot-f000.png` etc. for criterion 4.

`.gitignore` gets `media-src/`. The generated `public/frames/**` and `heroFrames.json` are tracked.

## B. `HeroFilm` — `src/sections/HeroFilm.tsx` (replaces `HeroSection.tsx`)

### Pure helpers — `src/utils/frameSequence.ts` (unit-tested)
- `loadOrder(count, step=8)` → keyframes `0,8,16,…,(count−1 if not included)` first, then the remaining indices in ascending order. No duplicates; it is a permutation of `0..count−1`.
- `nearestLoaded(target, loaded: (i)=>boolean, count)` → the closest index that is loaded, searching outwards (ties go to the lower index); −1 if none is loaded.
- `progressToIndex(p, count)` → `clamp(round(p*(count−1)), 0, count−1)`.
- `frameUrl(set, i)` → `${set.path}f-${pad3(i)}.webp`.
- `coverRect(srcW, srcH, dstW, dstH)` → `{sx, sy, sw, sh}` for a cover-fit draw.

### Loader — `src/hooks/useFrameSequence.ts`
- Input: `enabled` (false under reduced motion). The set is chosen by `innerWidth/innerHeight < 0.8 ? mobile : desktop`, re-evaluated on resize. Changing set starts a new load; the old set's cache is dropped.
- Loads in `loadOrder` with a small concurrency (6). For each frame: `new Image()`, then `decode()`, then `createImageBitmap(img)`, stored in an array (`ImageBitmap | undefined`). If `createImageBitmap` is missing, the decoded `HTMLImageElement` is stored instead.
- It exposes a stable `framesRef`, `keyframeProgress` (a motion value from 0 to 1, the share of keyframes loaded), and `set`.
- It aborts on unmount: an `AbortController` flag, and loaded bitmaps are closed.
- It lives in `App`, because both `Preloader` and `HeroFilm` need it, and is passed down by props.

### Component structure
```
<section id="welcome" class="hero-film dark" aria-label="Welcome">     300svh desktop / 240svh mobile (CSS)
  <div class="hero-stage">                                                sticky top:0; height 100svh; overflow hidden
    <picture class="hero-poster"> avif + webp sources by media query, <img fetchpriority="high" loading="eager" decoding="async" alt="">
    <canvas class="hero-canvas" aria-hidden>                               absolutely over the poster
    <div class="hero-shade">                                               indigo gradient at the bottom (--ink), always on
    <motion.div class="hero-darken">                                       --ink, opacity 0→1 over p 0.9→1
    <motion.div class="hero-content">  kicker "Shubha Vivaha", eyebrow, h1 names, meta, venue, countdown, RSVP/Directions
    <motion.p class="hero-caption"> ×3                                     one at a time over 0.45–0.9
    <a class="scroll-cue">                                                 fades out by p 0.1
```
- The poster `<picture>` uses `media="(max-aspect-ratio: 4/5)"` for the mobile sources, which matches the `< 0.8` rule, so first paint needs no JS.
- **Scrub:** `useScroll({ target: sectionRef, offset: ['start start','end end'] })` → `useTransform(p, v => v*(count−1))` → `useSpring(…, { stiffness:120, damping:30 })`. A `useMotionValueEvent(spring,'change')` stores the target index. One rAF loop draws only when `round(target)` differs from the last drawn index, **or** when a closer frame has finished loading, **or** after a resize. It always draws `nearestLoaded(target)`. If nothing has loaded yet, it draws nothing and the poster underneath stays visible. The canvas is therefore never blank over the poster: it is transparent until its first draw.
- **Canvas sizing:** `dpr = min(devicePixelRatio, 2)`. A `ResizeObserver` on the stage sets the backing-store size. Each draw is `drawImage(bmp, …coverRect)`.
- **Overlays** (all `useTransform` on raw `scrollYProgress`):
  - Title block: opacity `[0, .15, .45] → [1, 1, 0]`, y `[.15, .45] → [0, −80]`; `pointer-events: none` when opacity < .5, so the hidden buttons can't be clicked.
  - Captions: windows `[.45,.60]`, `[.60,.75]`, `[.75,.90]`, each fading in and out with an 0.03 ramp so they never overlap.
  - Darken: `[.9, 1] → [0, 1]` to `--ink`.
  - Readability: `.hero-shade` is `linear-gradient(to top, rgba(22,26,53,.88) 0%, rgba(22,26,53,.6) 45%, transparent 75%)`, and the title block sits in the lower half, so `--on-dark` (#eef1ff) on at least ~.6 ink keeps ≥ 4.5:1 even over the brightest pixels. I verify this numerically on the screenshots: the darkest text colour against the brightest sampled background behind the text block.
- The first-load stagger ("rise") animation is kept, gated on `ready` as now.
- **Reduced motion** (`useReducedMotion()`): render `<section id="welcome" class="hero-film hero-static">` at `min-height: 100svh`, containing only the poster `<picture>`, the shade, and the same title block and buttons. No canvas, no captions, the loader is disabled (`enabled=false`), so no frame requests are made. The preloader is already skipped under reduced motion.
- No `<video>` anywhere.

### Preloader — `src/components/Preloader.tsx`
- New prop `progress: MotionValue<number>` (keyframe share). The bar and number show `round(progress*100)`.
- It reveals when keyframes reach 100%, **or** after a hard cap of 1.8 s from mount, whichever comes first. Exit is unchanged, and it never sets `overflow` on the body, so scrolling is never blocked. It is skipped under reduced motion, as now.
- The `document.fonts` wait is dropped; fonts are no longer the long pole.

### Footer — `src/sections/Closing.tsx`
- Add `<p className="small muted">Opening film generated with Google Gemini.</p>` next to "Illustrations drawn for this invitation."

## C. English only

| Location | Change |
|---|---|
| `data/types.ts` | Remove `titleKn` (WeddingEvent) and `nameKn?` (Attraction) |
| `data/guestInfo.ts` | Remove `nameKn`, `hallKn`, `addressKn`, `kn`, `shortKn`, `parentsKn`, `weddingDateKn`, `HOSTS.welcomeKn`. `INVOCATIONS` becomes the five English strings from the brief |
| `data/food.ts` | Remove the `kn` fields |
| `data/weddingEvents.ts` | Remove `titleKn`. Location → "Groom’s residence". Lagna detail value `'Dhanu (ಧನು)'` → `'Dhanu'` |
| `data/attractions.ts` | Remove `nameKn` |
| `sections/StoryFilm.tsx` | Remove `kn` from `Chapter` and the four chapters (each duplicates the English title), plus both render sites |
| `sections/InvitationSection.tsx` | Invocations become one `<p className="invocations">` with the brief's line joined by " · ". Remove the two `COUPLE.*.kn` lines and the `welcomeKn` span (with its " · ") |
| `sections/WeddingTimeline.tsx` | Remove the `event-kn` span |
| `sections/GuestInformation.tsx` | Remove the `hallKn, addressKn` line |
| `sections/DestinationExplorer.tsx` | Remove the `nameKn` line |
| `sections/LocalFoodGuide.tsx` | Remove the `kn` span |
| `sections/Closing.tsx` | Kicker → "Awaiting your arrival" (class `closing-kn` renamed to `closing-kicker`, keeps its styling, `.kn` font dropped) |
| `components/Navigation.tsx` | Menu footer → "Dileep · Kavya · 03-12-2026", without `.kn` |
| Hero | Kicker "Shubha Vivaha". Kannada names line removed |
| CSS | Remove `--f-kn`, `.kn`, `.chapter-kn`, `.event-kn`, `.dish .kn` and `.hero-names-kn`, and the two Kannada `@import`s. Rename `.closing-kn` → `.closing-kicker`. `.invocations` list styles become paragraph styles, with checks for leftover gaps |
| `package.json` / lock | `npm uninstall @fontsource/noto-serif-kannada` |
| `utils/itineraryEngine.test.ts` | Remove `titleKn: id` from the fixture. No assertion changes |

## Assumptions and risks
- **`delogo` quality:** on moving stone floor it may leave a soft blur that is visible as a patch. That is the main visual risk, and the crop fallback is the mitigation.
- **Memory (the main engineering risk):** the brief asks for an `ImageBitmap` cache. Decoded RGBA is 1280×720×4 ≈ 3.7 MB per desktop frame, so all 120 ≈ **440 MB**. Mobile is 405×720 ≈ 1.2 MB per frame, so ≈ **140 MB**. Mobile is tolerable; desktop is heavy. **Mitigation built in:** desktop bitmaps are created with `resizeWidth = min(1280, canvas backing width)`, which cuts the total on small or 1× windows. If the Playwright run shows a memory or jank problem, I'd switch to keeping decoded `HTMLImageElement`s, whose decoded pixels the browser can evict. That would be a deviation, so I'd stop and tell you first.
- **Countdown:** it re-renders the hero every second. The canvas draw is in a ref-driven rAF, not React state, so this does not cause redraws.
- **Removing `<header>`:** `#welcome` becomes a `<section>`, as the brief asks. The nav "Back to top" link targets `#welcome` and still works.
- **Reduced-motion request count:** `<picture>` fetches exactly one poster (avif or webp), so expect 1 request against the ≤ 2 limit.
