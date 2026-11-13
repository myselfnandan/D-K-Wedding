import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
await p.goto(process.argv[2]); await p.waitForTimeout(3500);
const out = process.argv[3];
const H = await p.evaluate(() => document.body.scrollHeight);
const ids = await p.evaluate(() => [...document.querySelectorAll('section[id], footer')].map(s => ({ id: s.id || 'footer', top: s.offsetTop, h: s.offsetHeight })));
console.log('page height', H, JSON.stringify(ids));
let n = 0;
for (let y = 0; y < H; y += 760) {
  await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(700);
  await p.screenshot({ path: `${out}/${String(n++).padStart(3, '0')}-y${y}.png` });
}
await b.close();
