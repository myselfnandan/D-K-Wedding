// Acceptance 1 + 2: no Kannada script in src/, index.html or dist/, and no Kannada font in dist/assets.
// Usage: node work/hero-frames-english/scan-kannada.mjs   (run after `npm run build`)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const KANNADA = /[ಀ-೿]/gu;
const BINARY = new Set(['.webp', '.avif', '.png', '.jpg', '.jpeg', '.woff', '.woff2', '.ttf', '.otf', '.ico', '.gif']);

function* walk(p) {
  if (statSync(p).isDirectory()) for (const f of readdirSync(p)) yield* walk(join(p, f));
  else yield p;
}

let failures = 0;
for (const root of ['src', 'index.html', 'dist']) {
  let files = 0;
  let hits = 0;
  for (const f of walk(root)) {
    if (BINARY.has(extname(f).toLowerCase())) continue;
    files++;
    const lines = readFileSync(f, 'utf8').split('\n');
    lines.forEach((line, n) => {
      const m = line.match(KANNADA);
      if (m) {
        hits += m.length;
        console.log(`  HIT ${f}:${n + 1}: ${line.trim().slice(0, 100)}`);
      }
    });
  }
  console.log(`${root}: ${files} text files scanned, ${hits} Kannada code points`);
  failures += hits;
}

const fonts = readdirSync('dist/assets').filter((f) => /\.(woff2?|ttf|otf)$/.test(f));
const kannadaFonts = fonts.filter((f) => /kannada/i.test(f));
console.log(`dist/assets fonts: ${fonts.length} files; families: ${[...new Set(fonts.map((f) => f.split('-').slice(0, 2).join('-')))].join(', ')}`);
console.log(`dist/assets Kannada font files: ${kannadaFonts.length}${kannadaFonts.length ? ' → ' + kannadaFonts.join(', ') : ''}`);
failures += kannadaFonts.length;

console.log(failures === 0 ? 'RESULT: PASS' : `RESULT: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
