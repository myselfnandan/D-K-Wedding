import { chromium } from 'playwright';
const b = await chromium.launch();
// Discover "More" on a phone
{
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await p.goto(process.argv[2]); await p.waitForTimeout(2500);
  const card = p.locator('#discover .place').first();
  await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const before = await card.evaluate((c) => ({ h: Math.round(c.getBoundingClientRect().height), more: getComputedStyle(c.querySelector('.place-more')).display }));
  await card.locator('.place-toggle').click(); await p.waitForTimeout(600);
  const after = await card.evaluate((c) => ({ h: Math.round(c.getBoundingClientRect().height), more: getComputedStyle(c.querySelector('.place-more')).display, exp: c.querySelector('.place-toggle').getAttribute('aria-expanded'), label: c.querySelector('.place-toggle').textContent }));
  await p.screenshot({ path: 'work/mobile-redesign/after/discover-more-open.png' });
  await card.locator('.place-toggle').click(); await p.waitForTimeout(600);
  const closed = await card.evaluate((c) => getComputedStyle(c.querySelector('.place-more')).display);
  console.log(`${after.exp === 'true' && after.more !== 'none' && closed === 'none' ? 'PASS' : 'FAIL'}  Discover "More" opens and closes on a phone\n      closed h=${before.h}px more=${before.more}; open h=${after.h}px more=${after.more} aria-expanded=${after.exp} label="${after.label}"; closed again more=${closed}`);
}
// Desktop pages
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(process.argv[2]); await p.waitForTimeout(2500);
  const H = await p.evaluate(() => document.body.scrollHeight);
  const hasToggle = await p.evaluate(() => getComputedStyle(document.querySelector('.place-toggle')).display);
  console.log(`desktop page height ${H}; desktop "More" toggle display=${hasToggle}`);
  let n = 0;
  for (let y = 0; y < H; y += 800) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(600); await p.screenshot({ path: `work/mobile-redesign/after-desktop/${String(n++).padStart(3, '0')}.png` }); }
}
await b.close();
