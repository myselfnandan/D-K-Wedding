# Intent — hero-frames-english

**Tier:** Non-trivial (multi-file feature, a new asset pipeline, dependency changes). Source brief: `PROMPT.md` in this folder.

## Problem
1. The hero is an animated SVG `Scene`. The couple have a real 10 s generated film (a dolly into a Hoysala doorway) that should become the opening: it plays forwards and backwards as the guest scrolls. The film has a Gemini corner sparkle that must go. The AI-origin disclosure moves to the footer.
2. The site mixes Kannada script into English copy. The couple want it in English only, with no Kannada script and no Kannada web font.

## Scope
- A reproducible frame pipeline (`npm run frames`). It turns `media-src/hero-source.mp4` into desktop and mobile WebP frame sets plus posters and `src/data/heroFrames.json`, with the watermark removed.
- A `HeroFilm` component that replaces `HeroSection`: a canvas scrubbed by scroll, the poster on first paint, choreographed overlays, a preloader driven by real keyframe loading, and a static reduced-motion variant.
- A footer line: "Opening film generated with Google Gemini."
- Removal of all Kannada: data, types, JSX, `lang="kn"` / `.kn`, CSS, and the `@fontsource/noto-serif-kannada` package. English replacements where the Kannada carried meaning.

## Non-goals
- No change to the SVG `Scene` used in `StoryFilm` and `Closing`, or to how they relate visually to the new hero.
- No `<video>` element and no audio.
- No commit beyond the baseline. No push, deploy or publish.
- No tidying of unrelated code.

## Acceptance criteria (from the brief, with how each is tested)
1. Zero `[ಀ-೿]` matches in `src/`, `index.html` and `dist/` (Node scan script).
2. No Kannada font file in `dist/assets` (file-name check plus the scan above).
3. The hero scrubs through 120 frames on desktop and mobile, and scrolling up rewinds (Playwright reads canvas pixels at several positions, forwards then backwards).
4. No watermark in any frame (`watermark-check.png` plus three full-frame spot checks, which I inspect visually).
5. First paint shows the poster with readable names. Desktop frames ≤ 7 MB and mobile frames ≤ 3 MB (`du`, the pipeline's byte print, a Playwright first-paint screenshot, and a contrast calculation).
6. Reduced motion shows a static hero and makes ≤ 2 `/frames/` requests (Playwright with `reducedMotion: 'reduce'`).
7. No horizontal overflow at 360, 390, 768 and 1440 px. Navigation, planner, filters, calendar download, the WhatsApp RSVP link and the mobile menu all work (Playwright).
8. `npm run typecheck`, `npm test` and `npm run build` pass.

## What I found that changes the picture (please read)
- **This folder was not its own git repo.** It sat untracked inside the git repo rooted at your home directory (`/Users/nandanr`). I ran `git init` here, which creates a nested repo, and made one baseline commit, `4000f5c`. I kept three things out of that commit using `.git/info/exclude`, which is local and not committed: `media-src/` (7.3 MB source video), `hero-frames.tgz` (8.1 MB archive) and a stray `vite.config.ts.timestamp-*.mjs`. Everything else is in the baseline exactly as it was.
- **Frames already exist.** `public/frames/{desktop,mobile}` (120 + poster each, 5.6 MB / 2.3 MB), `src/data/heroFrames.json` and `work/.../watermark-check.png` are already present, apparently unpacked from `hero-frames.tgz`. They were made by a pipeline that is *not* in this repo ("inverse alpha blending + edge inpaint"), and their JSON shape differs from the spec. The existing check image looks clean. Nothing imports these files yet.
- **`ffmpeg`/`ffprobe` and Playwright are not installed.** The pipeline needs the `ffmpeg-static` devDependency (plus `ffprobe-static` for the ffprobe re-check). Verification needs `playwright` plus a Chromium download.

## Open questions (decisions for you, defaults in bold)
- **Q1. The existing frames:** **overwrite them with the output of the new in-repo script**, so the assets are reproducible from the source. The alternative is to keep the existing frames and only write the script. Note that the existing inverse-alpha method is likely cleaner than `delogo`. If `delogo` smears, the brief's fallback is the crop, not that method.
- **Q2. New devDependencies:** **`ffmpeg-static`, `ffprobe-static`, `playwright`** (plus about 150 MB of Chromium in `~/Library/Caches/ms-playwright`). The `@fontsource/noto-serif-kannada` dependency is removed.
- **Q3. Menu footer** "ದಿಲೀಪ್ · ಕಾವ್ಯ · 03-12-2026" → **"Dileep · Kavya · 03-12-2026"** (it is the only date/name mark in the open menu, so I keep it in English rather than deleting it).
- **Q4. Hero names line** (Kannada names under the English names) → **removed**, since it only duplicates the English.
