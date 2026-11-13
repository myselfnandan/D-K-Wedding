import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE = process.argv[2];
const SHEETS = process.argv[3];
const out = 'work/mobile-redesign/after/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto(BASE + '?debugFrames');
await p.waitForFunction(() => window.__heroFrames && window.__heroFrames.images.filter(Boolean).length === 120, null, { timeout: 30000 });
await p.waitForTimeout(3500);
await p.screenshot({ path: out + 'stone-p0.png' });
await p.evaluate(() => {
  const s = document.getElementById('welcome');
  scrollTo(0, (s.offsetHeight - innerHeight) * 0.34);
});
await p.waitForTimeout(1500);
await p.screenshot({ path: out + 'stone-p34.png' });
console.log('nav display on phone:', await p.evaluate(() => getComputedStyle(document.querySelector('.floating-nav')).display));
const cards = await p.$$('#celebrations .moment');
for (let i = 0; i < cards.length; i++) {
  await cards[i].scrollIntoViewIfNeeded();
  await p.evaluate(() => scrollBy(0, 120));
  if (i === 1) {
    await p.waitForTimeout(900);
    await p.screenshot({ path: out + 'moment-mid.png' });
  }
  await p.waitForTimeout(3600);
  await cards[i].screenshot({ path: out + `moment-${i}.png` });
}
const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
await d.goto(BASE);
await d.waitForTimeout(1500);
await d.evaluate(() => document.querySelector('#celebrations .moments').scrollIntoView({ block: 'center' }));
await d.waitForTimeout(4200);
await d.screenshot({ path: out + 'moments-1440.png' });
await b.close();

const a = await Promise.all(['stone-p0.png', 'stone-p34.png', 'moment-mid.png'].map((f) => sharp(out + f).resize(390, 844).toBuffer()));
await sharp({ create: { width: 3 * 398, height: 844, channels: 3, background: '#f0f' } })
  .composite(a.map((x, i) => ({ input: x, left: i * 398, top: 0 })))
  .png()
  .toFile(SHEETS + 'stone.png');
const m = await Promise.all([0, 1, 2, 3].map((i) => sharp(out + `moment-${i}.png`).resize({ width: 390 }).toBuffer()));
const H = Math.max(...(await Promise.all(m.map((x) => sharp(x).metadata()))).map((x) => x.height));
await sharp({ create: { width: 4 * 398, height: H, channels: 3, background: '#f0f' } })
  .composite(m.map((x, i) => ({ input: x, left: i * 398, top: 0 })))
  .png()
  .toFile(SHEETS + 'moments.png');
