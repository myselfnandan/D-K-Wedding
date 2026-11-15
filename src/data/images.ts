import type { ImageCredit } from './types';
import manifest from './imageManifest.json';

/**
 * Wikimedia Commons files (licence and author checked via the Commons API, 9 Nov 2026).
 * `npm run images` downloads them, makes AVIF/WebP at 640/1280/1920 px and updates imageManifest.json.
 * Until a file is present the UI shows the illustrated fallback — never a broken image.
 */
const BYSA3 = 'https://creativecommons.org/licenses/by-sa/3.0/';
const BYSA4 = 'https://creativecommons.org/licenses/by-sa/4.0/';
const page = (f: string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.replace(/ /g, '_'))}`;

const c = (id: string, file: string, author: string, license: string, licenseUrl: string, alt: string): ImageCredit => ({
  id, file, author, license, licenseUrl, pageUrl: page(file), alt,
});

export const imageCredits: ImageCredit[] = [
  c('hero', 'Hoysaleswara Temple at Halebeedu.jpg', 'Rohit Sharma', 'CC BY-SA 4.0', BYSA4, 'The Hoysaleswara temple at Halebeedu'),
  c('hoysaleswara', 'Hoysaleshwara temple in Monsoon.JPG', 'Karthikbs23', 'CC BY-SA 3.0', BYSA3, 'Hoysaleswara temple after the rains'),
  c('hoysaleswara-carving', 'Reliefs, Sculptures, and Interior of Hoysaleswara Temple Halebeedu DSCN6284 7.jpg', 'Goutam1962', 'CC BY-SA 4.0', BYSA4, 'Carved reliefs on the Hoysaleswara temple wall'),
  c('makara', '1150 CE Hoysaleswara temple Halebeedu Karnataka, Makara mythical animal.jpg', 'Ms Sarah Welch', 'CC0', 'https://creativecommons.org/publicdomain/zero/1.0/', 'Carved makara, a mythical creature, at Hoysaleswara temple'),
  c('kedareshwara', 'Kedareshwara Temple in Halebeedu.jpg', 'Ankush Manuja', 'CC BY-SA 3.0', BYSA3, 'Kedareshwara temple, Halebeedu'),
  c('basadi', 'Parshvanatha Basadi at Halebeedu.jpg', 'Rohit Sharma', 'CC BY-SA 4.0', BYSA4, 'Parshvanatha Basadi, Halebeedu'),
  c('belur', 'Chennakeshava temple Belur 761.jpg', 'Akshatha Inamdar', 'CC BY-SA 4.0', BYSA4, 'Chennakeshava temple, Belur'),
  c('belavadi', 'Sri Veeranarayana Temple , Belavadi North View 01.jpg', 'Bikashrd', 'CC BY-SA 4.0', BYSA4, 'Veera Narayana temple, Belavadi'),
  c('doddagaddavalli', 'Lakshmi Devi Temple, Doddagaddavalli.jpg', 'Bikashrd', 'CC BY-SA 4.0', BYSA4, 'Lakshmi Devi temple, Doddagaddavalli'),
  c('yagachi', 'Boating at Yagachi Dam.JPG', 'Harijibhv', 'CC BY-SA 3.0', BYSA3, 'Boating on the Yagachi reservoir'),
  c('manjarabad', 'Manjarabad Fort 2.jpg', 'Aravind K G', 'CC BY-SA 3.0', BYSA3, 'Manjarabad fort'),
  c('mullayanagiri', 'Mullayanagiri peak.jpg', 'Anvesh1103', 'CC BY-SA 4.0', BYSA4, 'Mullayanagiri peak'),
  c('coffee', 'Traditional shade coffee plantation Chikmagalur 1.jpg', 'Anand Osuri', 'CC BY-SA 4.0', BYSA4, 'Shade-grown coffee in Chikkamagaluru'),
];

type Manifest = Record<string, { widths: number[]; formats: string[]; ratio: number }>;
const available = manifest as Manifest;

export function imageSources(id: string | null | undefined) {
  if (!id || !available[id]) return null;
  const m = available[id];
  const set = (fmt: string) => m.widths.map((w) => `./images/${id}-${w}.${fmt} ${w}w`).join(', ');
  return {
    avif: m.formats.includes('avif') ? set('avif') : null,
    webp: m.formats.includes('webp') ? set('webp') : null,
    fallback: `./images/${id}-${m.widths[Math.min(1, m.widths.length - 1)]}.${m.formats.includes('webp') ? 'webp' : 'jpg'}`,
    ratio: m.ratio,
  };
}

export const creditFor = (id: string) => imageCredits.find((i) => i.id === id);
