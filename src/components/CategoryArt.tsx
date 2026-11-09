import type { AttractionCategory } from '../data/types';

/** Illustrated stand-in used until a licensed photograph is available. Decorative. */
export function CategoryArt({ category, seed = 0, label }: { category: AttractionCategory | 'wedding'; seed?: number; label?: string }) {
  const hue = seed % 2 === 0;
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id={`g-${category}-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hue ? '#a6c8e2' : '#b5baff'} />
          <stop offset="1" stopColor={hue ? '#e9edfb' : '#eef0ff'} />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#g-${category}-${seed})`} />
      <circle cx={hue ? 290 : 110} cy="150" r="46" fill="#ffffff" opacity="0.7" />
      <path d="M0 360 Q100 300 200 340 T400 320 V500 H0Z" fill="#7c9fc6" opacity="0.45" />
      {(category === 'heritage' || category === 'temples' || category === 'wedding') && (
        <g fill="#2f3670">
          <path d="M150 400 V370 H162 V352 H174 V334 H186 V316 H194 V298 L200 284 L206 298 V316 H214 V334 H226 V352 H238 V370 H250 V400Z" />
          <rect x="110" y="400" width="180" height="16" />
          <rect x="96" y="416" width="208" height="14" />
          <g stroke="#b5baff" strokeWidth="1" opacity="0.7">
            <line x1="110" y1="408" x2="290" y2="408" />
            <line x1="96" y1="423" x2="304" y2="423" />
          </g>
        </g>
      )}
      {(category === 'nature' || category === 'family') && (
        <g>
          <path d="M0 420 L90 300 L150 370 L230 260 L320 380 L400 330 V500 H0Z" fill="#2f3670" />
          <path d="M0 450 Q120 410 220 440 T400 430 V500 H0Z" fill="#222850" />
        </g>
      )}
      {category === 'water' && (
        <g fill="none" stroke="#2f3670" strokeWidth="3" strokeLinecap="round">
          <path d="M40 400 q20 -12 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" />
          <path d="M60 430 q20 -12 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" opacity="0.7" />
          <path d="M40 460 q20 -12 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" opacity="0.45" />
        </g>
      )}
      {category === 'food' && (
        <g>
          <ellipse cx="200" cy="420" rx="120" ry="26" fill="#2f3670" />
          <path d="M150 330 h100 v40 a50 30 0 0 1 -100 0z" fill="#ffffff" stroke="#2f3670" strokeWidth="3" />
          <path d="M180 300 q10 -20 0 -40 M210 300 q10 -20 0 -40" stroke="#2f3670" strokeWidth="2" fill="none" />
        </g>
      )}
      {label && (
        <text x="200" y="480" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="13" fill="#eef1ff" letterSpacing="2">
          {label.toUpperCase()}
        </text>
      )}
    </svg>
  );
}
