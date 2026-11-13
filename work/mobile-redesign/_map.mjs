import { chromium } from 'playwright';
const b = await chromium.launch();
for (const [w, h, dpr, mob] of [[390, 844, 2, true], [1440, 900, 1, false]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: mob, hasTouch: mob });
  await p.goto(process.argv[2]); await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('explore').scrollIntoView());
  await p.waitForTimeout(500);
  await p.screenshot({ path: `work/mobile-redesign/after/map-${w}-anim.png` });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `work/mobile-redesign/after/map-${w}-a.png` });
  await p.locator('.pm-pin[aria-label^="11."]').click();
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelector('.pm-frame').scrollIntoView({ block: 'start' }));
  await p.evaluate(() => scrollBy(0, -70)); await p.waitForTimeout(500);
  await p.screenshot({ path: `work/mobile-redesign/after/map-${w}-b.png` });
  if (mob) { await p.evaluate(() => document.querySelector('.pm-card').scrollIntoView({ block: 'center' })); await p.waitForTimeout(600); await p.screenshot({ path: `work/mobile-redesign/after/map-${w}-card.png` }); }
  const info = await p.evaluate(() => ({ height: document.getElementById('explore').offsetHeight, page: document.body.scrollHeight, sel: document.querySelector('.pm-card h3').textContent, overflow: document.documentElement.scrollWidth - innerWidth }));
  console.log(w, JSON.stringify(info));
  await p.close();
}
await b.close();
