import { chromium } from 'playwright';
const b = await chromium.launch();
const out = process.argv[3];
for (const [w, h, dpr] of [[390, 844, 2], [360, 740, 2], [1440, 900, 1]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: w < 800, hasTouch: w < 800 });
  const p = await ctx.newPage();
  await p.goto(process.argv[2] + '?debugFrames');
  await p.waitForFunction(() => window.__heroFrames && window.__heroFrames.images.filter(Boolean).length === 120, null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  for (const q of [0.08, 0.34, 0.59, 0.82, 0.97]) {
    await p.evaluate(q => { const s = document.getElementById('welcome'); scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * q); }, q);
    await p.waitForTimeout(1400);
    await p.screenshot({ path: `${out}/hero-${w}x${h}-p${Math.round(q * 100)}.png` });
  }
  await ctx.close();
}
await b.close();
