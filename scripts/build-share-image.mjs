#!/usr/bin/env node
/**
 * Link-preview image (Open Graph / WhatsApp / iMessage / social): public/og-image.jpg, 1200×630.
 *
 *   node scripts/build-share-image.mjs [path/to/photo.jpg]
 *
 * Source photo: media-src/share-source.jpg (the couple at sunset; kept out of git like the film source).
 * The names are lettered in the sky with the same fonts as the site's opening (Mr Dafoe brush script, the
 * Cormorant italic ampersand), rendered in a headless browser so the result matches the site exactly.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = process.argv[2] ?? path.join(root, 'media-src', 'share-source.jpg');
const out = path.join(root, 'public', 'og-image.jpg');
const W = 1200;
const H = 630;

// The photo is portrait, so the card is built in two layers from it:
//  - sky: the cloud-only top of the photo, stretched across the whole card (this is where the names go);
//  - couple: a near-square crop of the couple (forehead kiss and embrace), placed on the right and feathered into
//    the same sky so the seam disappears.
const meta = await sharp(src).metadata();
const SKY_BOTTOM = Math.round(meta.height * 0.42); // above the man's head: clouds only
const skyRaw = await sharp(src).rotate().extract({ left: 0, top: 0, width: meta.width, height: SKY_BOTTOM }).resize(W, H, { fit: 'cover' }).blur(1.2).toBuffer();
const COUPLE_W = 740; // on the card
const cropW = meta.width; // full width: keeps sky to the left of the man's back, so the feather falls on sky
const cropH = Math.round((cropW * H) / COUPLE_W);
const cropTop = Math.min(Math.round(meta.height * 0.41), meta.height - cropH);
const couple = await sharp(src)
  .rotate()
  .extract({ left: meta.width - cropW, top: cropTop, width: cropW, height: cropH })
  .resize(COUPLE_W, H)
  .jpeg({ quality: 92 })
  .toBuffer();

// Colour-match the stretched sky to the couple photo where they meet, so the feathered join shows no band:
// compare the mean colour of the couple's left edge with the sky just under it (sky rows only), and scale the sky per channel.
// Upper part only: the photo's bottom edge has a dark rooftop that would skew the average.
// (Crop to a buffer first: sharp's stats() reads the input image and ignores a preceding extract().)
const mean = async (img, left, width) => {
  const strip = await sharp(img).extract({ left, top: 0, width, height: Math.round(H * 0.55) }).toBuffer();
  return (await sharp(strip).stats()).channels.slice(0, 3).map((c) => c.mean);
};
const target = await mean(couple, 0, 40);
const current = await mean(skyRaw, W - COUPLE_W, 40);
const gain = target.map((t, i) => t / current[i]);
const sky = await sharp(skyRaw).linear(gain, [0, 0, 0]).jpeg({ quality: 92 }).toBuffer();
console.log(`sky colour matched: gain R/G/B = ${gain.map((g) => g.toFixed(3)).join(' / ')}`);

const font = (pkg, file) => readFileSync(path.join(root, 'node_modules', '@fontsource', pkg, 'files', file)).toString('base64');
const fonts = {
  dafoe: font('mr-dafoe', 'mr-dafoe-latin-400-normal.woff2'),
  cormorant: font('cormorant-garamond', 'cormorant-garamond-latin-400-italic.woff2'),
  marcellus: font('marcellus', 'marcellus-latin-400-normal.woff2'),
};

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Dafoe;src:url(data:font/woff2;base64,${fonts.dafoe}) format('woff2')}
@font-face{font-family:Corm;font-style:italic;src:url(data:font/woff2;base64,${fonts.cormorant}) format('woff2')}
@font-face{font-family:Marc;src:url(data:font/woff2;base64,${fonts.marcellus}) format('woff2')}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
.card{position:relative;width:${W}px;height:${H}px;background:url(data:image/jpeg;base64,${sky.toString('base64')}) center/cover}
.couple{position:absolute;right:0;top:0;width:${COUPLE_W}px;height:${H}px;background:url(data:image/jpeg;base64,${couple.toString('base64')}) center/cover;-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 14%);mask-image:linear-gradient(90deg,transparent 0%,#000 14%)}
/* A light warm wash over the sky behind the lettering only; the couple stays untouched. */
.wash{position:absolute;inset:0;background:linear-gradient(90deg,rgba(252,234,206,.35) 0%,rgba(252,234,206,.2) 40%,rgba(252,234,206,0) 55%)}
.text{position:absolute;left:64px;top:0;bottom:0;width:520px;display:flex;flex-direction:column;justify-content:center;color:#3a2516}
.lock{display:inline-grid;grid-template-columns:auto;transform:rotate(-6deg);transform-origin:left center;width:max-content}
.name{font-family:Dafoe;font-size:124px;line-height:.95;text-shadow:0 2px 18px rgba(255,240,215,.55)}
.a{grid-row:1;grid-column:1;justify-self:start}
.b{grid-row:2;grid-column:1;justify-self:end;margin:-.22em 0 0 .72em}
.amp{grid-row:2;grid-column:1;justify-self:start;align-self:center;margin-left:.2em;font-family:Corm;font-style:italic;font-size:62px;color:#a0602c}
.invited{margin:34px 0 0;font-family:Marc;font-size:24px;letter-spacing:.32em;text-transform:uppercase;color:#4a2f1b}
.when{margin:12px 0 0;font-family:Marc;font-size:24px;color:#4a2f1b}
</style></head><body><div class="card"><div class="couple"></div><div class="wash"></div><div class="text">
<div class="lock"><span class="name a">Dileep</span><span class="amp">&amp;</span><span class="name b">Kavya</span></div>
<p class="invited">All are invited</p>
<p class="when">Thursday, 3 December 2026 · Halebeedu</p>
</div></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png' });
await browser.close();

// WhatsApp and some apps skip preview images much over ~300 KB, so keep it well under that.
let quality = 86;
let jpg = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer();
while (jpg.length > 240_000 && quality > 60) {
  quality -= 6;
  jpg = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer();
}
await sharp(jpg).toFile(out);
console.log(`Wrote ${path.relative(root, out)} (${W}×${H}, ${Math.round(jpg.length / 1024)} KB, quality ${quality})`);
