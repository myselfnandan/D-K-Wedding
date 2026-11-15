// Browser verification for hero-frames-english. Run against `npm run preview`.
// Usage: node work/hero-frames-english/verify.mjs http://localhost:4173/
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const OUT = 'work/hero-frames-english/shots';
mkdirSync(OUT, { recursive: true });
const results = [];
const record = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n      ${detail}` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};

const browser = await chromium.launch();

async function open(ctxOpts, url = BASE, setup) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  if (setup) await setup(page, ctx);
  await page.goto(url, { waitUntil: 'load' });
  // The entrance holds ~4 s and its doors take ~1 s to open.
  await page.waitForSelector('.preloader', { state: 'detached', timeout: 9000 }).catch(() => {});
  return { ctx, page };
}

/** Scroll so the hero's scroll progress is `p` (0..1). */
async function toProgress(page, p) {
  await page.evaluate((p) => {
    const s = document.getElementById('welcome');
    const range = s.offsetHeight - innerHeight;
    window.scrollTo({ top: s.offsetTop + range * p, behavior: 'instant' });
  }, p);
}

async function waitAllFrames(page) {
  await page.waitForFunction(() => {
    const s = window.__heroFrames;
    return s && s.images.filter(Boolean).length === s.count;
  }, null, { timeout: 30000 });
}

/** 32×18 downsample of the canvas as a flat RGB array. */
async function canvasSig(page) {
  return page.evaluate(() => {
    const c = document.querySelector('.hero-canvas');
    const o = document.createElement('canvas');
    o.width = 32;
    o.height = 18;
    const x = o.getContext('2d');
    x.drawImage(c, 0, 0, 32, 18);
    const d = x.getImageData(0, 0, 32, 18).data;
    const out = [];
    for (let i = 0; i < d.length; i += 4) out.push(d[i], d[i + 1], d[i + 2]);
    return { px: out, frame: c.dataset.frame ?? null };
  });
}
const meanDiff = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length;

async function heapMB(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.collectGarbage');
  await cdp.send('Performance.enable');
  const { metrics } = await cdp.send('Performance.getMetrics');
  const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
  return { used: (m.JSHeapUsedSize / 1048576).toFixed(1), total: (m.JSHeapTotalSize / 1048576).toFixed(1) };
}

// ---------- 1. Scrub, screenshots, pixels, smoothness, heap (desktop + mobile) ----------
for (const [label, opts] of Object.entries(VIEWPORTS)) {
  const { ctx, page } = await open(opts, `${BASE}?debugFrames`);
  const { width, height } = opts.viewport;
  await waitAllFrames(page);
  const kind = await page.evaluate(() => window.__heroFrames.kind);
  record(`[${label}] frame set chosen`, kind === label, `kind=${kind}`);

  // Screenshots at the four progress points.
  for (const p of [0, 0.3, 0.6, 0.95]) {
    await toProgress(page, p);
    await sleep(1400);
    await page.screenshot({ path: `${OUT}/${width}x${height}-p${Math.round(p * 100)}.png` });
  }

  // Canvas pixels differ between positions, and rewinding restores the earlier frame.
  const sigs = {};
  for (const p of [0.1, 0.5, 0.9, 0.1]) {
    await toProgress(page, p);
    await sleep(1400);
    const s = await canvasSig(page);
    sigs[p] = sigs[p] ? { ...sigs[p], back: s } : s;
  }
  const d1 = meanDiff(sigs[0.1].px, sigs[0.5].px);
  const d2 = meanDiff(sigs[0.5].px, sigs[0.9].px);
  const back = meanDiff(sigs[0.1].px, sigs[0.1].back.px);
  record(
    `[${label}] canvas frames differ by scroll position`,
    d1 > 5 && d2 > 5,
    `frame@0.1=${sigs[0.1].frame} frame@0.5=${sigs[0.5].frame} frame@0.9=${sigs[0.9].frame}; mean |Δ| 0.1→0.5=${d1.toFixed(1)}, 0.5→0.9=${d2.toFixed(1)}`,
  );
  record(
    `[${label}] scrolling back rewinds`,
    sigs[0.1].back.frame === sigs[0.1].frame && back < 1,
    `frame back@0.1=${sigs[0.1].back.frame}; mean |Δ| vs first visit=${back.toFixed(2)}`,
  );

  // Smoothness: slow scroll down then up, recording every frame actually drawn.
  await toProgress(page, 0);
  await sleep(1200);
  await page.evaluate(() => {
    window.__drawn = [];
    const c = document.querySelector('.hero-canvas');
    new MutationObserver(() => window.__drawn.push(+c.dataset.frame)).observe(c, { attributes: true, attributeFilter: ['data-frame'] });
  });
  const STEPS = 160;
  for (let k = 0; k <= STEPS; k++) {
    await toProgress(page, k / STEPS);
    await sleep(25);
  }
  await sleep(1000);
  const fwd = await page.evaluate(() => window.__drawn.splice(0));
  for (let k = STEPS; k >= 0; k--) {
    await toProgress(page, k / STEPS);
    await sleep(25);
  }
  await sleep(1000);
  const bwd = await page.evaluate(() => window.__drawn.splice(0));
  const stats = (seq, dir) => {
    let reversals = 0;
    let maxJump = 0;
    for (let i = 1; i < seq.length; i++) {
      const d = seq[i] - seq[i - 1];
      if (Math.sign(d) === -dir) reversals++;
      maxJump = Math.max(maxJump, Math.abs(d));
    }
    return { draws: seq.length, distinct: new Set(seq).size, first: seq[0], last: seq.at(-1), reversals, maxJump };
  };
  const f = stats(fwd, 1);
  const b = stats(bwd, -1);
  record(
    `[${label}] forward scrub covers the film`,
    f.distinct >= 100 && f.last === 119 && f.reversals === 0,
    JSON.stringify(f),
  );
  record(`[${label}] backward scrub rewinds to frame 0`, b.distinct >= 100 && b.last === 0 && b.reversals === 0, JSON.stringify(b));

  // Heap after scrubbing the whole film twice (down, up, down, up).
  for (let rep = 0; rep < 2; rep++) {
    for (const dir of [1, -1]) {
      for (let k = 0; k <= 60; k++) {
        await toProgress(page, dir === 1 ? k / 60 : 1 - k / 60);
        await sleep(20);
      }
    }
  }
  await sleep(1200);
  const heap = await heapMB(page);
  const bmps = await page.evaluate(() => ({ bitmaps: window.__heroFrames.bitmapCount, images: window.__heroFrames.images.filter(Boolean).length }));
  const cap = label === 'desktop' ? 24 : 16;
  record(
    `[${label}] bitmap window capped after 2 full scrubs`,
    bmps.bitmaps <= cap,
    `JS heap used=${heap.used} MB (total ${heap.total} MB); live ImageBitmaps=${bmps.bitmaps} (cap ${cap}); decoded <img>=${bmps.images}`,
  );
  await ctx.close();
}

// ---------- 2. First paint: poster only (frame requests blocked), names readable ----------
const lum = (r, g, b) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
for (const [label, opts] of Object.entries(VIEWPORTS)) {
  const { width, height } = opts.viewport;
  const { ctx, page } = await open(opts, BASE, (page) => page.route(/\/frames\/(desktop|mobile)\/f-\d+\.webp/, (r) => r.abort()));
  await sleep(3800); // Title "rise" animation finishes.
  const posterOk = await page.evaluate(() => {
    const img = document.querySelector('.hero-poster img');
    return { complete: img.complete && img.naturalWidth > 0, src: img.currentSrc.split('/').slice(-3).join('/'), fp: img.getAttribute('fetchpriority'), loading: img.getAttribute('loading'), frameDrawn: document.querySelector('.hero-canvas').dataset.frame ?? null };
  });
  await page.screenshot({ path: `${OUT}/${width}x${height}-firstpaint-poster-only.png` });
  record(`[${label}] poster painted without any frame`, posterOk.complete && posterOk.frameDrawn === null && posterOk.fp === 'high', JSON.stringify(posterOk));

  // Contrast: text colour vs the brightest 2% of background pixels behind each text box (text hidden).
  const boxes = await page.evaluate(() =>
    ['.hero-kicker', '.hero-content .eyebrow', '.hero-names', '.hero-meta', '.hero-venue', '.cd-label'].map((sel) => {
      const el = document.querySelector(sel);
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const c = cs.color.match(/\d+/g).map(Number);
      // WCAG AA: 3:1 for large text (≥ 24px, or ≥ 18.66px bold), 4.5:1 otherwise.
      const px = parseFloat(cs.fontSize);
      const need = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700) ? 3 : 4.5;
      return { sel, need, x: r.x, y: r.y, w: r.width, h: r.height, color: c };
    }),
  );
  // Hide only the glyphs; keep the shades and halo that really sit behind the text.
  await page.addStyleTag({ content: '.hero-content, .hero-content *, .scroll-cue, .scroll-cue * { color: transparent !important; text-shadow: none !important; } .scroll-line { visibility: hidden !important; }' });
  await sleep(100);
  const bg = await page.screenshot();
  const { data, info } = await sharp(bg).raw().toBuffer({ resolveWithObject: true });
  const dpr = info.width / width;
  const lines = [];
  let failing = 0;
  for (const b of boxes) {
    const ls = [];
    for (let y = Math.floor(b.y * dpr); y < (b.y + b.h) * dpr; y += 2)
      for (let x = Math.floor(b.x * dpr); x < (b.x + b.w) * dpr; x += 2) {
        const o = (y * info.width + x) * info.channels;
        ls.push(lum(data[o], data[o + 1], data[o + 2]));
      }
    ls.sort((a, b) => a - b);
    const p98 = ls[Math.floor(ls.length * 0.98)];
    const cr = ratio(lum(...b.color), p98);
    if (cr < b.need) failing++;
    lines.push(`${b.sel} ${cr.toFixed(2)}:1 (needs ${b.need})`);
  }
  record(`[${label}] title text contrast meets WCAG AA over the poster`, failing === 0, lines.join(', '));
  await ctx.close();
}

// ---------- 3. Reduced motion: static hero, ≤ 2 /frames/ requests ----------
for (const [label, opts] of Object.entries(VIEWPORTS)) {
  const reqs = [];
  const { ctx, page } = await open({ ...opts, reducedMotion: 'reduce' }, BASE, (page) =>
    page.on('request', (r) => r.url().includes('/frames/') && reqs.push(r.url().split('/frames/')[1])),
  );
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await sleep(1000);
  const shape = await page.evaluate(() => {
    const s = document.getElementById('welcome');
    // Since mobile-redesign the static hero is one poster screen followed by the stacked panels; the stage is what must stay one screen.
    return { canvas: !!document.querySelector('canvas'), video: !!document.querySelector('video'), height: s.querySelector('.hero-stage').offsetHeight, vh: innerHeight, cls: s.className };
  });
  await page.screenshot({ path: `${OUT}/${opts.viewport.width}x${opts.viewport.height}-reduced-motion.png` });
  record(
    `[${label}] reduced motion: static hero, ≤ 2 frame requests`,
    reqs.length <= 2 && !shape.canvas && !shape.video && shape.height < shape.vh * 1.5,
    `/frames/ requests=${reqs.length} [${reqs.join(', ')}]; ${JSON.stringify(shape)}`,
  );
  await ctx.close();
}

// ---------- 4. No <video>, no horizontal overflow at four widths ----------
for (const w of [360, 390, 768, 1440]) {
  const { ctx, page } = await open({ viewport: { width: w, height: 800 } });
  // Real overflow = the page can scroll sideways. html/body use `overflow-x: clip`, so body.scrollWidth also counts
  // clipped content; it is reported for information only.
  const r = await page.evaluate(async () => {
    let doc = 0;
    let sx = 0;
    let body = 0;
    for (let y = 0; y <= document.body.scrollHeight; y += Math.round(innerHeight * 0.8)) {
      window.scrollTo(500, y);
      await new Promise((r) => setTimeout(r, 80));
      doc = Math.max(doc, document.documentElement.scrollWidth - innerWidth);
      sx = Math.max(sx, window.scrollX);
      body = Math.max(body, document.body.scrollWidth - innerWidth);
    }
    return { doc, sx, body, videos: document.querySelectorAll('video').length };
  });
  record(
    `[${w}px] no horizontal overflow`,
    r.doc <= 0 && r.sx === 0 && r.videos === 0,
    `html scrollWidth − innerWidth=${r.doc}px; max scrollX after scrollTo(500,·)=${r.sx}; clipped body excess (info)=${r.body}px; <video>=${r.videos}`,
  );
  await ctx.close();
}

// ---------- 5. Interactions ----------
{
  const { ctx, page } = await open(VIEWPORTS.desktop, BASE, (page) =>
    page.addInitScript(() => {
      window.__opened = [];
      window.open = (u) => (window.__opened.push(String(u)), null);
    }),
  );
  // Navigation: floating nav appears after scrolling; click a link and land on the section.
  await page.evaluate(() => window.scrollTo(0, innerHeight * 4));
  await sleep(800);
  await page.click('.nav-links a[href="#celebrations"]');
  await sleep(1800);
  const navTop = await page.evaluate(() => Math.round(document.getElementById('celebrations').getBoundingClientRect().top));
  record('nav link scrolls to its section', Math.abs(navTop) < 140, `#celebrations top after click=${navTop}px`);

  // Back to top lands on the hero.
  await page.click('.nav-mark');
  await sleep(1800);
  const topY = await page.evaluate(() => Math.round(scrollY));
  record('"Back to top" returns to the hero', topY < 10, `scrollY=${topY}`);

  // Hero RSVP button jumps to #rsvp.
  await page.click('.hero-actions a[href="#rsvp"]');
  await sleep(1500);
  const rsvpTop = await page.evaluate(() => Math.round(document.getElementById('rsvp').getBoundingClientRect().top));
  record('hero RSVP button jumps to #rsvp', Math.abs(rsvpTop) < 140, `#rsvp top=${rsvpTop}px`);

  // Calendar download.
  await page.locator('#celebrations').scrollIntoViewIfNeeded();
  const dlP = page.waitForEvent('download', { timeout: 5000 });
  // Since the celebrations redesign the calendar button sits directly on each card.
  await page.locator('#celebrations .moment button:has-text("Add to calendar")').first().click();
  const dl = await dlP.catch(() => null);
  record('calendar download', !!dl && dl.suggestedFilename().endsWith('.ics'), `file=${dl?.suggestedFilename()}`);

  // Explore map (replaced the planner and filters): 13 pins; a pin and a list chip each select a place.
  await page.locator('#explore .pm-frame').scrollIntoViewIfNeeded();
  await sleep(2500); // pins pop in
  const nPins = await page.locator('#explore .pm-pin').count();
  await page.locator('#explore .pm-pin[aria-label^="12."]').click();
  await sleep(700);
  const viaPin = await page.locator('#explore .pm-card h3').innerText();
  const pinPressed = await page.locator('#explore .pm-pin[aria-label^="12."]').getAttribute('aria-pressed');
  await page.locator('#explore .pm-chip').nth(4).click();
  await sleep(700);
  const viaChip = await page.locator('#explore .pm-card h3').innerText();
  const dirHref = await page.locator('#explore .pm-card a.btn').getAttribute('href');
  record(
    'explore map: pin and list select a place',
    nPins === 13 && pinPressed === 'true' && viaPin === 'Hebbe Falls' && viaChip === 'Lakshmi Devi Temple, Doddagaddavalli' && dirHref.startsWith('https://www.google.com/maps/dir/'),
    `pins=${nPins}; pin 12 → "${viaPin}" (aria-pressed=${pinPressed}); chip 5 → "${viaChip}"; directions=${dirHref.slice(0, 45)}…`,
  );

  // RSVP form opens WhatsApp with the right number.
  await page.locator('#rsvp').scrollIntoViewIfNeeded();
  await page.fill('#rsvp input[autocomplete="name"]', 'Test Guest');
  await page.click('#rsvp button:has-text("Joyfully, yes")');
  await sleep(500);
  await page.click('#rsvp button:has-text("Yes, please arrange")');
  await page.click('#rsvp button[type="submit"]');
  await sleep(300);
  const opened = await page.evaluate(() => window.__opened);
  const waHref = await page.locator('#info a[href^="https://wa.me/"]').first().getAttribute('href');
  const msg = opened[0] ? decodeURIComponent(opened[0].split('?text=')[1]) : '';
  const card = await page.locator('#info').innerText();
  record(
    'RSVP opens the WhatsApp link, with the accommodation choice',
    opened.length === 1 && opened[0].startsWith('https://wa.me/919980450419?text=') && waHref === 'https://wa.me/919980450419' && msg.includes('Accommodation: Needed, please arrange'),
    `message lines: ${msg.split('\n').join(' | ')}; info link=${waHref}`,
  );
  record(
    'accommodation card asks guests to tell the family in advance',
    card.includes('Need a room? Please let the family know in advance.') && !card.includes('Details from the family will be shared here'),
    card.split('\n').find((l) => l.includes('Need a room')) ?? '(not found)',
  );
  const footer = await page.locator('footer').innerText();
  // Owner asked (14 Nov 2026) to drop the credits list, the illustrations line and the Gemini line from the footer.
  // The CC photo credits now sit on each photo instead.
  const gone = ['Photo credits', 'Illustrations drawn', 'Google Gemini'].filter((t) => footer.includes(t));
  const credits = await page.$$eval('.photo-credit', (a) => a.map((x) => x.textContent));
  record('footer lines removed; photos carry their own credit', gone.length === 0 && credits.length > 0 && credits.every((c) => /^Photo: .+, (CC|Public)/.test(c)), `still in footer=[${gone.join(', ')}]; on-photo credits=${credits.length} e.g. "${credits[0]}"`);
  await ctx.close();
}
{
  // The top bar is hidden on phones (owner request); the menu still exists from tablet width, so test it there.
  const { ctx, page } = await open({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.evaluate(() => window.scrollTo(0, innerHeight * 3));
  await sleep(800);
  await page.click('.nav-burger');
  await sleep(800);
  const dialog = await page.locator('.menu-sheet[role="dialog"]').isVisible();
  const foot = await page.locator('.menu-foot').innerText();
  const lockedOpen = await page.evaluate(() => document.body.style.overflow);
  await page.screenshot({ path: `${OUT}/820x1180-menu-open.png` });
  await page.click('.menu-sheet a[href="#explore"]');
  await sleep(1800);
  const closed = await page.locator('.menu-sheet').count();
  const top = await page.evaluate(() => Math.round(document.getElementById('explore').getBoundingClientRect().top));
  const lockedAfter = await page.evaluate(() => document.body.style.overflow);
  record(
    'mobile menu opens, navigates and closes',
    dialog && closed === 0 && Math.abs(top) < 140 && lockedOpen === 'hidden' && lockedAfter === '' && foot === 'Dileep · Kavya · 03-12-2026',
    `dialog=${dialog}, footer="${foot}", body overflow open/after="${lockedOpen}"/"${lockedAfter}", #explore top=${top}px`,
  );
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? '; FAILED: ' + failed.map((f) => f.name).join(' | ') : ''}`);
process.exit(failed.length ? 1 : 0);
