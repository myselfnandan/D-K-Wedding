// Mobile-redesign acceptance checks 1–6. Run against `npm run preview`.
// Usage: node work/mobile-redesign/verify-mobile.mjs http://localhost:4173/
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE = process.argv[2] ?? 'http://localhost:4173/';
const results = [];
const record = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n      ${detail}` : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mirrors src/utils/heroPanels.ts (anchor = middle of each panel's hold).
const PANELS = [
  { id: 'opening', at: 0.08, text: ['Dileep', 'Kavya', 'Thursday, 3 December 2026', 'Muhurtha 8:30', 'RSVP', 'Directions'] },
  { id: 'families', at: 0.34, text: ['Dileep S', 'Kavya H Y', 'With the blessings of both families'] },
  { id: 'programme', at: 0.59, text: ['Haladhi', 'From 2:00 pm', 'Sangeeth', 'From 6:00 pm', 'Muhurtha', '8:30 am – 9:30 am', 'Aaratakshate', 'From 11:30 am', 'Bhojana', 'From 12:30 pm'] },
  { id: 'venue', at: 0.88, text: ['Sri Pushpagiri Mahasamsthana Kalyana Mantapa', 'Halebeedu', 'Both families', 'Directions', 'RSVP'] },
];
const PHONES = [
  { label: '390x844', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { label: '360x740', viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

const lum = (r, g, b) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** Contrast of each text box vs the brightest 2% of what is behind it (the text itself hidden). */
async function contrastOf(page, rootSel, textSel) {
  const boxes = await page.evaluate(
    ({ rootSel, textSel }) =>
      [...document.querySelector(rootSel).querySelectorAll(textSel)]
        .filter((el) => !el.closest('.btn') && el.getBoundingClientRect().width > 0 && el.textContent.trim())
        .map((el) => {
          // Measure the glyph line boxes (text-node rects), not the element box: a full-width heading's box runs to the
          // screen edges, far from the words, and would sample background that sits behind no text.
          const rects = [];
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n = w.nextNode(); n; n = w.nextNode()) {
            if (!n.textContent.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(n);
            for (const r of range.getClientRects()) if (r.width > 0) rects.push(r);
          }
          const x0 = Math.min(...rects.map((r) => r.left));
          const y0 = Math.min(...rects.map((r) => r.top));
          const x1 = Math.max(...rects.map((r) => r.right));
          const y1 = Math.max(...rects.map((r) => r.bottom));
          const cs = getComputedStyle(el);
          // WCAG AA: 3:1 for large text (≥ 24px, or ≥ 18.66px bold), 4.5:1 otherwise.
          const px = parseFloat(cs.fontSize);
          const large = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
          return { t: el.textContent.trim().slice(0, 28), need: large ? 3 : 4.5, x: x0, y: y0, w: x1 - x0, h: y1 - y0, color: getComputedStyle(el).color.match(/[\d.]+/g).slice(0, 3).map(Number) };
        }),
    { rootSel, textSel },
  );
  // Hide only the glyphs (and their shadows); keep every background, shade and halo that really sits behind the text.
  const tag = await page.addStyleTag({ content: `${rootSel}, ${rootSel} * { color: transparent !important; text-shadow: none !important; -webkit-text-stroke: 0 !important; }` });
  await sleep(80);
  const shot = await page.screenshot();
  await tag.evaluate((el) => el.remove());
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
  const dpr = info.width / page.viewportSize().width;
  return boxes.map((b) => {
    const ls = [];
    for (let y = Math.max(0, Math.floor(b.y * dpr)); y < Math.min(info.height, (b.y + b.h) * dpr); y += 2)
      for (let x = Math.max(0, Math.floor(b.x * dpr)); x < Math.min(info.width, (b.x + b.w) * dpr); x += 2) {
        const o = (y * info.width + x) * info.channels;
        ls.push(lum(data[o], data[o + 1], data[o + 2]));
      }
    ls.sort((a, c) => a - c);
    return { t: b.t, need: b.need, cr: ratio(lum(...b.color), ls[Math.floor(ls.length * 0.98)] ?? 0) };
  });
}

async function toProgress(page, p) {
  await page.evaluate((p) => {
    const s = document.getElementById('welcome');
    window.scrollTo({ top: s.offsetTop + (s.offsetHeight - innerHeight) * p, behavior: 'instant' });
  }, p);
}

const browser = await chromium.launch();

// ---------- 1 + 2: hero panels on two phones ----------
for (const ph of PHONES) {
  const ctx = await browser.newContext(ph);
  const page = await ctx.newPage();
  await page.goto(`${BASE}?debugFrames`);
  await page.waitForFunction(() => window.__heroFrames && window.__heroFrames.images.filter(Boolean).length === 120, null, { timeout: 30000 });
  await sleep(3800); // opening "rise" finishes
  for (const panel of PANELS) {
    await toProgress(page, panel.at);
    await sleep(1400);
    const st = await page.evaluate(({ id, text }) => {
      const el = document.querySelector(`[data-panel="${id}"]`);
      const r = el.getBoundingClientRect();
      const kids = [...el.children].map((c) => c.getBoundingClientRect()).filter((b) => b.height > 0);
      const top = Math.min(...kids.map((b) => b.top));
      const missing = text.filter((t) => !el.textContent.includes(t)); // textContent: some labels are CSS-uppercased
      const clickables = [...el.querySelectorAll('a, button')];
      const blocked = clickables.filter((a) => {
        const b = a.getBoundingClientRect();
        const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
        return !(hit && (hit === a || a.contains(hit)));
      }).map((a) => a.textContent.trim());
      const others = [...document.querySelectorAll('[data-panel]')].filter((p) => p !== el).map((p) => +getComputedStyle(p).opacity);
      return { opacity: +getComputedStyle(el).opacity, inert: el.hasAttribute('inert'), top: Math.round(top), bottom: Math.round(r.bottom), vh: innerHeight, missing, clickables: clickables.length, blocked, othersMax: Math.max(...others) };
    }, panel);
    const ok = st.opacity >= 0.95 && !st.inert && !st.missing.length && !st.blocked.length && st.top >= 64 && st.bottom <= st.vh && st.othersMax === 0;
    record(
      `[${ph.label}] hero panel "${panel.id}" readable and usable`,
      ok,
      `opacity=${st.opacity} inert=${st.inert} other panels max opacity=${st.othersMax}; content top=${st.top}px (nav pill ends ~64) bottom=${st.bottom}/${st.vh}; missing=[${st.missing.join(' | ')}]; links/buttons=${st.clickables} blocked=[${st.blocked.join(', ')}]`,
    );
    await page.screenshot({ path: `work/mobile-redesign/after/panel-${ph.label}-${panel.id}.png` });
    const cs = await contrastOf(page, `[data-panel="${panel.id}"]`, 'p, h1, h2, li span, .cd-num, .cd-label, .panel-link');
    const worst = cs.reduce((a, b) => (b.cr / b.need < a.cr / a.need ? b : a));
    record(
      `[${ph.label}] hero panel "${panel.id}" contrast meets WCAG AA over the film`,
      cs.every((c) => c.cr >= c.need),
      `${cs.length} text boxes; tightest "${worst.t}" ${worst.cr.toFixed(2)}:1 (needs ${worst.need}:1); median ${cs.map((c) => c.cr).sort((a, b) => a - b)[Math.floor(cs.length / 2)].toFixed(2)}:1`,
    );
  }
  await ctx.close();
}

// ---------- 3 + 4 + 5: empty screens, page height, closing ----------
{
  const ctx = await browser.newContext(PHONES[0]);
  const page = await ctx.newPage();
  await page.goto(BASE);
  await sleep(2500);
  // The entrance (stone doors + monogram) is excluded from the empty-screen check, so wait until it has opened.
  await page.waitForSelector('.preloader', { state: 'detached', timeout: 8000 });
  await sleep(2500);
  const height = await page.evaluate(() => document.body.scrollHeight);
  record('page height at 390×844 ≤ 18,000 px', height <= 18000, `scrollHeight=${height}px (before: 31,238px)`);

  const empty = [];
  let steps = 0;
  for (let y = 0; y < height; y += Math.round(844 * 0.8)) {
    steps++;
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await sleep(700);
    const n = await page.evaluate(() => {
      const visible = (el) => {
        for (let e = el; e && e !== document.body; e = e.parentElement) {
          const s = getComputedStyle(e);
          if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity < 0.5) return false;
        }
        return true;
      };
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let count = 0;
      for (let t = w.nextNode(); t; t = w.nextNode()) {
        const el = t.parentElement;
        if (!t.textContent.trim() || el.closest('.floating-nav, .preloader, .sr-only, [aria-hidden="true"]')) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom > 70 && r.top < innerHeight && r.width > 0 && visible(el)) count++;
      }
      return count;
    });
    if (n === 0) empty.push(y);
  }
  record('no screen without visible text (390×844, 80% steps)', empty.length === 0, `${steps} steps; empty at y=[${empty.join(', ')}]`);

  await page.locator('#closing').scrollIntoViewIfNeeded();
  await sleep(1500);
  const geo = await page.evaluate(() => {
    const c = document.querySelector('.closing-copy').getBoundingClientRect();
    const s = document.querySelector('.closing-scene').getBoundingClientRect();
    return { copyBottom: Math.round(c.bottom), sceneTop: Math.round(s.top) };
  });
  const cs = await contrastOf(page, '.closing-copy', 'p, h2');
  const worst = cs.reduce((a, b) => (b.cr < a.cr ? b : a));
  record(
    'closing: copy clear of the illustration, contrast ≥ 4.5:1',
    geo.copyBottom <= geo.sceneTop && worst.cr >= 4.5,
    `copy bottom=${geo.copyBottom} scene top=${geo.sceneTop}; lowest "${worst.t}" ${worst.cr.toFixed(2)}:1`,
  );
  await ctx.close();
}

// ---------- 6: reduced motion ----------
for (const ph of PHONES) {
  const reqs = [];
  const ctx = await browser.newContext({ ...ph, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('request', (r) => r.url().includes('/frames/') && reqs.push(r.url().split('/frames/')[1]));
  await page.goto(BASE);
  await sleep(1500);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
  });
  const st = await page.evaluate((all) => {
    const s = document.getElementById('welcome');
    const txt = s.textContent;
    return { missing: all.filter((t) => !txt.includes(t)), canvas: !!s.querySelector('canvas'), anchors: ['invitation', 'programme'].every((id) => !!document.getElementById(id)) };
  }, PANELS.flatMap((p) => p.text));
  record(
    `[${ph.label}] reduced motion: all panel content stacked, ≤ 2 frame requests`,
    !st.missing.length && !st.canvas && st.anchors && reqs.length <= 2,
    `missing=[${st.missing.join(' | ')}] canvas=${st.canvas} anchors=${st.anchors}; /frames/ requests=${reqs.length} [${reqs.join(', ')}]`,
  );
  await page.screenshot({ path: `work/mobile-redesign/after/reduced-${ph.label}.png`, fullPage: false });
  await ctx.close();
}

// ---------- Phones: Explore and Travel pick one option at a time with back / forward ----------
for (const ph of PHONES) {
  const ctx = await browser.newContext(ph);
  const page = await ctx.newPage();
  await page.goto(BASE);
  await sleep(2500);
  for (const [sec, stepSel, stripSel, titleSel, n] of [
    ['explore', '.pm-stepper', '.pm-list', '.pm-card h3', 13],
    ['travel', '.travel-stepper', '.travel-tabs', '#travel-panel', null],
  ]) {
    const st = page.locator(`#${sec} ${stepSel}`);
    await st.scrollIntoViewIfNeeded();
    await sleep(600);
    const vis = await page.evaluate(([a, b]) => [getComputedStyle(document.querySelector(a)).display, getComputedStyle(document.querySelector(b)).display], [`#${sec} ${stepSel}`, `#${sec} ${stripSel}`]);
    const read = async () => ({ count: (await st.locator('.pick-count').innerText()).trim(), shown: (await page.locator(`#${sec} ${titleSel}`).innerText()).split('\n')[0].slice(0, 40) });
    const s0 = await read();
    await st.getByRole('button', { name: /^Next/ }).click(); await sleep(500);
    const s1 = await read();
    await st.getByRole('button', { name: /^Previous/ }).click(); await sleep(500);
    const s2 = await read();
    await st.getByRole('button', { name: /^Previous/ }).click(); await sleep(500);
    const s3 = await read();
    const total = +s0.count.split(' of ')[1];
    const box = await st.boundingBox();
    const ok = vis[0] !== 'none' && vis[1] === 'none' && s0.count === `1 of ${total}` && s1.count === `2 of ${total}` && s1.shown !== s0.shown && s2.shown === s0.shown && s3.count === `${total} of ${total}` && (n === null || total === n) && box.x >= 0 && box.x + box.width <= ph.viewport.width;
    record(
      `[${ph.label}] ${sec}: one option at a time with back / forward`,
      ok,
      `stepper display=${vis[0]}, old strip display=${vis[1]}; ${s0.count} "${s0.shown}" → next ${s1.count} "${s1.shown}" → back ${s2.count} → back (wraps) ${s3.count}; stepper x=${Math.round(box.x)}..${Math.round(box.x + box.width)}`,
    );
  }
  await ctx.close();
}

// ---------- Phones: no top bar, no scroll cue, no individual names; animations replay on every visit ----------
{
  const ctx = await browser.newContext(PHONES[0]);
  const page = await ctx.newPage();
  await page.goto(`${BASE}?debugFrames`);
  await sleep(3500);
  const bar = await page.evaluate(() => [getComputedStyle(document.querySelector('.floating-nav')).display, getComputedStyle(document.querySelector('.progress-bar')).display]);
  record('phones show no top bar', bar[0] === 'none' && bar[1] === 'none', `floating nav display=${bar[0]}, progress bar display=${bar[1]}`);
  const cue = await page.evaluate(() => ({ el: !!document.querySelector('.scroll-cue'), text: document.body.textContent.includes('Scroll to unfold') }));
  record('no "Scroll to unfold" cue', !cue.el && !cue.text, JSON.stringify(cue));
  // Owner: no individual names except the couple anywhere on the page.
  const names = await page.evaluate(() => ['Shashikala', 'Shashidhar', 'Chinmayi', 'Lathamani', 'Yogesh', 'Surachar', 'Ananthachar'].filter((n) => document.body.textContent.includes(n)));
  record('no individual names besides the couple', names.length === 0, `found=[${names.join(', ')}]`);

  // Replay: scroll a celebration card into view, away, and back; the fade-in and the illustration must run again.
  const card = page.locator('#celebrations .moment-muhurtha');
  await card.scrollIntoViewIfNeeded();
  await sleep(3000);
  const seen = await card.evaluate((c) => +getComputedStyle(c.querySelector('.moment-body')).opacity);
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);
  const away = await card.evaluate((c) => +getComputedStyle(c.querySelector('.moment-body')).opacity);
  await card.scrollIntoViewIfNeeded();
  await sleep(250);
  const early = await card.evaluate((c) => {
    // The taali knots appear 1.5 s into the illustration; a knot with ~zero size just after re-entry means it restarted.
    const knot = c.querySelector('.moment-svg circle[fill="#fff3c4"]');
    return { body: +getComputedStyle(c.querySelector('.moment-body')).opacity, knot: Math.round(knot.getBoundingClientRect().width * 10) / 10 };
  });
  await sleep(3200);
  const back = await card.evaluate((c) => +getComputedStyle(c.querySelector('.moment-body')).opacity);
  const knotSettled = await card.evaluate((c) => Math.round(c.querySelector('.moment-svg circle[fill="#fff3c4"]').getBoundingClientRect().width * 10) / 10);
  record(
    'animations replay when a section comes back on screen',
    seen > 0.95 && away < 0.5 && early.body < 0.95 && early.knot < 1 && back > 0.95,
    `card text opacity: first view=${seen}, scrolled away=${away}, just back=${early.body}, settled=${back}; taali knot width just back=${early.knot}px, settled=${knotSettled}px`,
  );
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? '; FAILED: ' + failed.map((f) => f.name).join(' | ') : ''}`);
process.exit(failed.length ? 1 : 0);
