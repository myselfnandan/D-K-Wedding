// Film scrubs in Chromium (Chrome/Edge) and WebKit (Safari/iPhone), with and without "reduce motion";
// the hero background is stone; growing the viewport mid-scroll (a phone's browser bar hiding) leaves no gap.
import { chromium, webkit } from 'playwright';

const URL = process.argv[2];
let bad = 0;
for (const [name, engine, opts] of [
  ['Chrome/Edge phone', chromium, { viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['Safari/iPhone (WebKit)', webkit, { viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 }],
  ['Edge desktop, reduce motion on', chromium, { viewport: { width: 1440, height: 860 }, reducedMotion: 'reduce' }],
  ['Chrome/Edge phone, reduce motion on', chromium, { viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' }],
  ['Safari/iPhone, reduce motion on', webkit, { viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, reducedMotion: 'reduce' }],
]) {
  const b = await engine.launch();
  const p = await b.newPage(opts);
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(URL + '?debugFrames');
  await p.waitForFunction(() => window.__heroFrames && window.__heroFrames.images.filter(Boolean).length === 120, null, { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(3500);
  const at = async (q) =>
    p.evaluate(async (q) => {
      const s = document.getElementById('welcome');
      window.scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * q);
      await new Promise((r) => setTimeout(r, 1300));
      return document.querySelector('.hero-canvas')?.dataset.frame ?? null;
    }, q);
  const f0 = await at(0.02);
  const f1 = await at(0.5);
  const f2 = await at(0.95);
  const back = await at(0.5);
  // Browser bar hides: the viewport grows by 64px while the stage is pinned.
  const vp = p.viewportSize();
  await p.setViewportSize({ width: vp.width, height: vp.height + 64 });
  await p.waitForTimeout(700);
  const fit = await p.evaluate(() => {
    const st = document.querySelector('.hero-stage').getBoundingClientRect();
    return { stageBottom: Math.round(st.bottom), viewport: innerHeight, heroBg: getComputedStyle(document.getElementById('welcome')).backgroundColor, preloader: !!document.querySelector('.preloader') };
  });
  const ok = f0 !== null && +f1 > +f0 && +f2 > +f1 && Math.abs(+back - +f1) <= 1 && fit.stageBottom >= fit.viewport && fit.heroBg === 'rgb(34, 32, 28)' && errors.length === 0;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: frames top/middle/end/back=${f0}/${f1}/${f2}/${back}; after bar hides: stage bottom ${fit.stageBottom} vs viewport ${fit.viewport}; hero bg ${fit.heroBg}${errors.length ? `; ERRORS ${errors.join(' | ')}` : ''}`);
  await b.close();
}
console.log(bad ? `${bad} FAILED` : 'all passed');
