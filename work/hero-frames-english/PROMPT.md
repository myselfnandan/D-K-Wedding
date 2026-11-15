# Claude Code prompt — Scroll-scrubbed hero film + English-only site

> Run from `~/src/dileep-kavya-wedding`. The source video is already at `media-src/hero-source.mp4`.

---

You are working in the React + Vite + TypeScript wedding site in this folder (Dileep & Kavya, 3 Dec 2026). Read `README.md` first.

## Process (mandatory) — AI-Native SDLC, tier: **Non-trivial**

Run these stages in order: **intent → spec → plan → implement → verify → hand off**.

1. Run `git status` and `git log --oneline -10`. If the folder isn't a git repo, run `git init` and make **one baseline commit of the current state, and only that**, so the diff can be reviewed later. Don't commit anything else.
2. Write `work/hero-frames-english/intent.md`, `spec.md` and `plan.md`. The plan lists every file you'll change, the order you'll change them in, the exact verify commands, and which check covers which acceptance criterion.
3. **STOP and wait for my approval of the plan** before touching application code. If the plan turns out wrong partway through, stop again and explain the deviation.
4. Report every check as **passed / failed / blocked / not run**, with the command and the real output. Never say "should pass".
5. Do **not** push, deploy or publish. Commit only if I say so.

## Change 1 — The hero becomes a scroll-scrubbed film made from the video's frames

### Source facts (already measured; re-verify them with `ffprobe`)
- File: `media-src/hero-source.mp4`. Video stream: 1280×720, 24 fps, 10.0 s, 240 frames. It also has an audio track, which you drop.
- Content: a slow camera dolly towards a Hoysala temple doorway, ending inside its pillared hall. Warm golden-hour light.
- **Watermark:** a Gemini four-point sparkle in the bottom-right corner, centred at about **x = 1160, y = 600**, roughly 48×48 px, on plain stone floor in every frame. This is our own generated video and we're removing the corner logo for a clean hero.

### Frame pipeline — `scripts/build-hero-frames.mjs` plus an npm script `"frames"`
- Use the system `ffmpeg`. If it's missing, use the `ffmpeg-static` devDependency.
- **Remove the watermark first:** `delogo=x=1126:y=566:w=70:h=70`. Re-derive the box from a frame before relying on it:
  - Extract frames 0, 120 and 239.
  - Locate the bright, low-saturation sparkle in the bottom-right quadrant.
  - Pad the box by 10 px.
  - If `delogo` leaves a visible smear, fall back to cropping that corner out: `crop=1280:560:0:0`, then rely on the canvas's cover-fit. Explain which method you chose and why.
- **Desktop set:** 120 frames (every 2nd frame) at 1280 px wide, WebP at quality ~62. Write them to `public/frames/desktop/f-000.webp` … `f-119.webp`.
- **Mobile set:** the same 120 frames, center-cropped to portrait 9:16 (`crop=ih*9/16:ih`, 405×720), WebP at quality ~60. Write them to `public/frames/mobile/`.
- **Poster:** frame 0 of each set as AVIF + WebP (`poster.avif` / `poster.webp`).
- Write `src/data/heroFrames.json` containing: `{ count, desktop: { width, height, path }, mobile: { ... }, watermarkMethod, generatedAt }`.
- Print the total bytes of each set. **Budget:** desktop ≤ 7 MB, mobile ≤ 3 MB. Lower the quality until they fit.
- Add `media-src/` to `.gitignore`. Generated frames **are** committed (they're static assets).
- Verification: write `work/hero-frames-english/watermark-check.png`, a 3-up crop of the watermark area from frames 0, 60 and 119 after processing. Look at it yourself and describe what you see. **No sparkle may remain.**

### `HeroFilm` component — replaces the current `HeroSection` scene
- **Layout:** `<section id="welcome">` about `300svh` tall on desktop and `240svh` on mobile, with a sticky `100svh` stage containing a `<canvas>`.
- **Loading:**
  - Draw the poster immediately; it's eager and gets `fetchpriority="high"`.
  - Then load keyframes first (every 8th frame), then fill in the rest in the background.
  - Use `Image.decode()` and an `ImageBitmap` cache.
  - While scrubbing, always draw the **nearest loaded** frame. Never draw a blank frame.
- **Scrubbing:**
  - `useScroll({ target, offset: ['start start', 'end end'] })` gives progress 0..1.
  - Map progress to a frame index, smoothed with `useSpring` (stiffness ~120, damping ~30).
  - Draw inside `requestAnimationFrame`, only when the index changes.
  - Draw with cover-fit and `devicePixelRatio` capped at 2. Redraw on resize.
  - Pick the mobile frame set when the viewport is portrait (`innerWidth / innerHeight < 0.8`).
- **Overlays:** keep the current content (names, date, Muhurtha time, venue, countdown, RSVP and Directions buttons, scroll cue), but choreograph it over the film:
  - From 0 to 0.15: the title block is fully visible over a soft indigo gradient at the bottom (palette `--ink`), so the text keeps at least 4.5:1 contrast.
  - From 0.15 to 0.45: it fades and rises out.
  - From 0.45 to 0.9: three short captions appear in turn, matching the camera moving in: "Halebeedu · the old Hoysala capital", "Thursday, 3 December 2026", "Step inside — you're invited".
  - From 0.9 to 1: the film darkens and dissolves into the Invitation section.
- **Preloader:** replace the fake percentage with the real share of keyframes loaded. Hard cap of 1.8 s, then reveal anyway. It must never block scrolling.
- **`prefers-reduced-motion`:** a single static poster-frame hero (normal height, no scrubbing, no frame downloads beyond the poster), with the same text and buttons.
- **No `<video>` element on the page.** Frames only.
- Leave the existing SVG `Scene` in `StoryFilm` and `Closing` untouched. Their visual relationship to the new hero is a follow-up for me to decide, not for you.
- Add one line to the footer: "Opening film generated with Google Gemini." This keeps the AI-origin disclosure now that the corner logo is gone.

## Change 2 — English only: remove every piece of Kannada text

The current Kannada script lives in:
- `src/data/guestInfo.ts` (65 runs): `nameKn`, `hallKn`, `addressKn`, `kn`, `shortKn`, `parentsKn`, `weddingDateKn`, `HOSTS.welcomeKn`, `INVOCATIONS`
- `src/data/food.ts` (13): the `kn` fields
- `src/data/weddingEvents.ts` (7): `titleKn` and the location text "(ವರನ ಸ್ವಗೃಹದಲ್ಲಿ)"
- `src/data/attractions.ts` (7): `nameKn`
- `src/sections/StoryFilm.tsx` (9), `HeroSection.tsx` (2: the "ಶುಭ ವಿವಾಹ" kicker and the names line), `Closing.tsx` (2), `components/Navigation.tsx` (2: the menu footer)
- Also the JSX that renders these: `InvitationSection`, `WeddingTimeline` (`event-kn`), `GuestInformation` (`hallKn`), `DestinationExplorer` (`nameKn`), `LocalFoodGuide`

Rules:
- Delete the Kannada fields from the **types** (`titleKn`, `nameKn`) and the data, and every JSX usage, including `lang="kn"` and `className="kn"`.
- Where the Kannada carried meaning, render it in **English (Latin script)**:
  - Invocations become a single line: "Sri Vishwakarma Parabrahmane Namaha · Sri Kalikamba Devi Krupe · Sri Mallikarjuna Swamy Prasanna · Sri Anjaneya Swamy Prasanna · Sri Lakshmi Narasimha Swamy Prasanna".
  - Hero kicker: "Shubha Vivaha".
  - Closing kicker: "Awaiting your arrival".
  - Event detail "Lagna: Dhanu" stays as it is.
  - Where the Kannada only duplicated an English name, remove it.
- Remove `@fontsource/noto-serif-kannada` (the package and the CSS imports), the `.kn` and `--f-kn` CSS, and any layout gaps left behind.
- Update the tests if they reference removed fields. The engine tests must still pass unchanged in intent.

## Acceptance criteria
1. A Kannada-script search (`[ಀ-೿]`) over `src/`, `index.html` **and** the built `dist/` returns **zero** matches. Use a short Node/Python script, because some greps can't handle that range.
2. No Kannada font is in `dist/assets`.
3. The hero scrubs smoothly forwards and backwards through 120 frames on desktop and mobile. Scrolling up rewinds the film.
4. The watermark is not visible in any frame (shown by `watermark-check.png` plus three spot checks of a full frame).
5. The first paint shows the poster with the names readable. The frame sets stay within the 7 MB / 3 MB budgets.
6. Reduced motion shows a static hero and makes zero frame requests beyond the poster.
7. No horizontal overflow at 360, 390, 768 and 1440 px. All existing interactions still work: navigation, planner, filters, calendar download, the WhatsApp RSVP link, and the mobile menu.
8. `npm run typecheck`, `npm test` and `npm run build` all pass.

## Verification to run and report
- `npm run frames`, `npm run typecheck`, `npm test`, `npm run build`, the Kannada scan over `src` and `dist`, and `du -sh public/frames/*`.
- Playwright (already available through npm; install it if it's missing) against `npm run preview`:
  - Screenshots at 390×844 and 1440×900 at hero progress 0, 0.3, 0.6 and 0.95. Save them to `work/hero-frames-english/shots/`.
  - Read the canvas pixels at two scroll positions to prove the frames differ.
  - A reduced-motion run that counts `/frames/` network requests (must be ≤ 2).
  - Check overflow at the four widths.
  - Click through the nav, planner, filters, calendar and RSVP.
- Read the full diff before you report.

## Final report
1. Files changed or created
2. Each acceptance criterion: met or not
3. Each check with its status and real output
4. Watermark method chosen and evidence
5. Open items
6. Whether human review is needed, and what to look at

The safe default is to tell me what changed and stop. No commit, push or deploy.
