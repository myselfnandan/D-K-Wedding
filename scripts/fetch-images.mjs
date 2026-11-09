#!/usr/bin/env node
/**
 * Downloads the licensed Wikimedia Commons photos listed in src/data/images.ts,
 * makes AVIF + WebP at 640/1280/1920 px into public/images/, and writes
 * src/data/imageManifest.json so the site switches from illustrations to photos.
 *
 *   npm run images
 *
 * Re-runnable: files already present are skipped. Credits render automatically in the footer.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'images');
const manifestPath = path.join(root, 'src', 'data', 'imageManifest.json');
const WIDTHS = [640, 1280, 1920];
const UA = 'DileepKavyaWeddingSite/1.0 (personal wedding invitation; image download script)';

// Parse id + file name pairs out of images.ts so there is one source of truth.
const src = await readFile(path.join(root, 'src', 'data', 'images.ts'), 'utf8');
const entries = [...src.matchAll(/c\('([^']+)',\s*'([^']+)'/g)].map((m) => ({ id: m[1], file: m[2] }));
if (!entries.length) throw new Error('No images found in images.ts');

await mkdir(outDir, { recursive: true });
let manifest = {};
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch {}

const exists = async (p) => access(p).then(() => true, () => false);

for (const { id, file } of entries) {
  const done = await exists(path.join(outDir, `${id}-640.webp`));
  if (done && manifest[id]) {
    console.log(`✓ ${id} (cached)`);
    continue;
  }
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=2400`;
  process.stdout.write(`↓ ${id} … `);
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) {
    console.log(`failed (${res.status}) — the site keeps its illustration for this one`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const widths = WIDTHS.filter((w) => w <= (meta.width ?? 0));
  if (!widths.length) widths.push(meta.width);
  for (const w of widths) {
    const img = sharp(buf).rotate().resize({ width: w, withoutEnlargement: true });
    await img.clone().avif({ quality: 52, effort: 4 }).toFile(path.join(outDir, `${id}-${w}.avif`));
    await img.clone().webp({ quality: 74 }).toFile(path.join(outDir, `${id}-${w}.webp`));
  }
  manifest[id] = { widths, formats: ['avif', 'webp'], ratio: +((meta.width ?? 1) / (meta.height ?? 1)).toFixed(3) };
  console.log(`ok (${widths.join(', ')} px)`);
  await new Promise((r) => setTimeout(r, 400)); // be gentle with Commons
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nManifest updated: ${Object.keys(manifest).length} images. Run "npm run build" to rebuild.`);
