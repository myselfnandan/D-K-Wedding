import { motion, type Transition } from 'motion/react';
import { createContext, type ReactNode, useContext } from 'react';

/**
 * The five ceremony illustrations (Haladhi, Sangeeth, Muhurtha, Aaratakshate, Bhojana): painted splashes and
 * small animations. Used full-size on the celebration cards and as small tiles in the entrance loader.
 * `prefix` keeps SVG filter ids unique when the same illustration is on the page twice.
 */
export type ArtFit = 'card' | 'tile';
export interface ArtProps {
  play: boolean;
  prefix?: string;
  fit?: ArtFit;
}

/* ---------- Painted splashes and small illustrations, one per ceremony ---------- */

/** Reduced motion: every illustration is drawn in its finished state, nothing animates. */
export const Still = createContext(false);

/** Time scale for every illustration animation: 1 on the cards; the entrance loader plays them faster (< 1). */
export const Speed = createContext(1);
function useSpeed() {
  const k = useContext(Speed);
  return (t: Transition): Transition => {
    if (k === 1) return t;
    const { delay, duration } = t as { delay?: number; duration?: number };
    return { ...t, ...(delay != null ? { delay: delay * k } : {}), ...(duration != null ? { duration: duration * k } : {}) } as Transition;
  };
}

/** Watercolour-edged blob: a soft ellipse roughened by the card's turbulence filter. */
function Blob({ cx, cy, rx, ry, fill, delay, play, o = 0.9 }: { cx: number; cy: number; rx: number; ry: number; fill: string; delay: number; play: boolean; o?: number }) {
  const still = useContext(Still);
  const sp = useSpeed();
  return (
    <motion.ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={fill}
      initial={still ? false : { scale: 0, opacity: 0 }}
      animate={play ? { scale: 1, opacity: o } : undefined}
      transition={sp({ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] })}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    />
  );
}

/** Crop of each illustration for a small square tile (the card view uses the full 320×180 canvas). */
const TILE_VIEW: Record<string, string> = {
  haladhi: '150 0 175 150',
  sangeeth: '112 0 222 150',
  muhurtha: '120 0 205 150',
  aaratakshate: '128 0 195 150',
  bhojana: '136 0 186 150',
};

function Art({ id, prefix, fit, children }: { id: string; prefix: string; fit: ArtFit; children: ReactNode }) {
  const tile = fit === 'tile';
  return (
    <svg
      className={tile ? 'ceremony-tile-svg' : 'moment-svg'}
      viewBox={tile ? TILE_VIEW[id] : '0 0 320 180'}
      preserveAspectRatio={tile ? 'xMidYMid meet' : 'xMaxYMid slice'}
      aria-hidden="true"
    >
      <defs>
        <filter id={`${prefix}splash-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed={id.length * 7} />
          <feDisplacementMap in="SourceGraphic" scale="22" />
        </filter>
      </defs>
      {children}
    </svg>
  );
}

/** Haladhi: turmeric splashes and a brass bowl of turmeric paste. */
export function HaladhiArt({ play, prefix = '', fit = 'card' }: ArtProps) {
  const still = useContext(Still);
  const sp = useSpeed();
  return (
    <Art id="haladhi" prefix={prefix} fit={fit}>
      <g filter={`url(#${prefix}splash-haladhi)`}>
        <Blob cx={230} cy={70} rx={95} ry={62} fill="#f6c945" delay={0} play={play} />
        <Blob cx={290} cy={40} rx={50} ry={34} fill="#f2a900" delay={0.15} play={play} />
        <Blob cx={160} cy={40} rx={34} ry={22} fill="#f9dc7c" delay={0.3} play={play} />
        {[
          [120, 96, 7],
          [140, 120, 5],
          [300, 120, 8],
          [190, 128, 5],
        ].map(([x, y, r], i) => (
          <Blob key={i} cx={x} cy={y} rx={r} ry={r} fill="#f2a900" delay={0.5 + i * 0.08} play={play} />
        ))}
      </g>
      <motion.g initial={still ? false : { y: 20, opacity: 0 }} animate={play ? { y: 0, opacity: 1 } : undefined} transition={sp({ delay: 0.55, duration: 0.6 })}>
        <ellipse cx="236" cy="96" rx="34" ry="9" fill="#e9a400" />
        <path d="M202 96 Q236 140 270 96 Z" fill="#b8862b" />
        <path d="M206 98 Q236 132 266 98" fill="none" stroke="#8a6420" strokeWidth="2" />
      </motion.g>
    </Art>
  );
}

/** Sangeeth: an evening of music. Fairy lights switch on one by one, a dholak, and notes floating up. */
export function SangeethArt({ play, prefix = '', fit = 'card' }: ArtProps) {
  const still = useContext(Still);
  const sp = useSpeed();
  const bulbs = Array.from({ length: 11 }, (_, i) => {
    const x = 126 + i * 19;
    const y = 22 + Math.sin((i / 10) * Math.PI) * 26; // the strand sags in the middle
    return { x, y };
  });
  const notes = [
    { x: 168, y: 104, d: 'M0 0 v-16 l10 -3 v16', delay: 1.1 },
    { x: 286, y: 112, d: 'M0 0 v-18', delay: 1.35 },
    { x: 214, y: 120, d: 'M0 0 v-16 l10 -3 v16', delay: 1.6 },
  ];
  return (
    <Art id="sangeeth" prefix={prefix} fit={fit}>
      <g filter={`url(#${prefix}splash-sangeeth)`}>
        <Blob cx={246} cy={72} rx={96} ry={58} fill="#b49cf0" delay={0} play={play} o={0.8} />
        <Blob cx={190} cy={104} rx={46} ry={30} fill="#e05aa8" delay={0.15} play={play} o={0.65} />
        <Blob cx={306} cy={40} rx={30} ry={22} fill="#7b5cd6" delay={0.3} play={play} o={0.7} />
      </g>
      {/* the strand of lights */}
      <path d={`M116 18 Q 222 70 330 18`} fill="none" stroke="#5b4a3a" strokeWidth="1.5" opacity="0.6" />
      {bulbs.map((b, i) => (
        // The wrapper twinkles (CSS); the bulb itself switches on in turn (motion). Their opacities multiply.
        <g key={i} className={play ? 'bulb is-on' : 'bulb'} style={{ animationDelay: `${(i % 4) * 0.35}s` }}>
          <motion.circle
            cx={b.x}
            cy={b.y + 6}
            r="4.2"
            fill={i % 2 ? '#ffd166' : '#ffb3d9'}
            initial={still ? false : { opacity: 0.15 }}
            animate={play ? { opacity: 1 } : undefined}
            transition={sp({ delay: 0.3 + i * 0.08, duration: 0.25 })}
          />
        </g>
      ))}
      {/* dholak */}
      <motion.g initial={still ? false : { y: 16, opacity: 0 }} animate={play ? { y: 0, opacity: 1 } : undefined} transition={sp({ delay: 0.55, duration: 0.6 })}>
        <rect x="214" y="98" width="62" height="30" rx="14" fill="#a8452f" />
        <ellipse cx="214" cy="113" rx="6" ry="15" fill="#f3e2c0" stroke="#7a2f1f" strokeWidth="1.5" />
        <ellipse cx="276" cy="113" rx="6" ry="15" fill="#f3e2c0" stroke="#7a2f1f" strokeWidth="1.5" />
        {[226, 238, 250, 262].map((x) => (
          <path key={x} d={`M${x} 99 L${x + 6} 127`} stroke="#f3c969" strokeWidth="1.4" />
        ))}
      </motion.g>
      {/* notes rising */}
      {notes.map((n, i) => (
        <motion.g
          key={i}
          initial={still ? false : { y: 18, opacity: 0 }}
          animate={play ? { y: 0, opacity: 1 } : undefined}
          transition={sp({ delay: n.delay, duration: 0.8, ease: 'easeOut' })}
        >
          <g transform={`translate(${n.x} ${n.y - 40})`}>
            <path d={n.d} fill="none" stroke="#4b2a8a" strokeWidth="2.2" />
            <ellipse cx="-3" cy="1" rx="4.5" ry="3.4" fill="#4b2a8a" />
            {n.d.includes('l10') && <ellipse cx="7" cy="-2" rx="4.5" ry="3.4" fill="#4b2a8a" />}
          </g>
        </motion.g>
      ))}
    </Art>
  );
}

/** Muhurtha: kumkuma red and arishina yellow, and the taali tied with three knots. */
export function MuhurthaArt({ play, prefix = '', fit = 'card' }: ArtProps) {
  const still = useContext(Still);
  const sp = useSpeed();
  const knots = [
    [196, 58],
    [214, 68],
    [232, 74],
  ];
  return (
    <Art id="muhurtha" prefix={prefix} fit={fit}>
      <g filter={`url(#${prefix}splash-muhurtha)`}>
        <Blob cx={250} cy={60} rx={92} ry={58} fill="#f2b705" delay={0} play={play} />
        <Blob cx={200} cy={92} rx={58} ry={40} fill="#c8102e" delay={0.15} play={play} o={0.85} />
        <Blob cx={300} cy={110} rx={30} ry={22} fill="#c8102e" delay={0.3} play={play} o={0.8} />
        <Blob cx={130} cy={50} rx={14} ry={14} fill="#c8102e" delay={0.45} play={play} />
      </g>
      {/* turmeric-yellow thread */}
      <motion.path
        d="M120 18 C 170 100, 270 100, 318 22"
        fill="none"
        stroke="#ffd34d"
        strokeWidth="4"
        strokeLinecap="round"
        initial={still ? false : { pathLength: 0 }}
        animate={play ? { pathLength: 1 } : undefined}
        transition={sp({ delay: 0.5, duration: 1.1, ease: 'easeInOut' })}
      />
      {/* the three knots */}
      {knots.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="5"
          fill="#fff3c4"
          stroke="#c99a2e"
          strokeWidth="2"
          initial={still ? false : { scale: 0 }}
          animate={play ? { scale: 1 } : undefined}
          transition={sp({ delay: 1.5 + i * 0.25, type: 'spring', stiffness: 400, damping: 12 })}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      ))}
      {/* the taali pendant, swinging into place */}
      <motion.g
        initial={still ? false : { y: -30, opacity: 0, rotate: -18 }}
        animate={play ? { y: 0, opacity: 1, rotate: [18, -10, 5, 0] } : undefined}
        transition={sp({ delay: 2.3, duration: 1.2 })}
        style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
      >
        <line x1="250" y1="80" x2="250" y2="88" stroke="#ffd34d" strokeWidth="3" />
        <circle cx="244" cy="97" r="10" fill="#e3b341" stroke="#9c7316" strokeWidth="2" />
        <circle cx="258" cy="97" r="10" fill="#e3b341" stroke="#9c7316" strokeWidth="2" />
      </motion.g>
    </Art>
  );
}

/** Aaratakshate: marigold and rose, an arati plate with a flame, akshata grains falling. */
export function AaratakshateArt({ play, prefix = '', fit = 'card' }: ArtProps) {
  const still = useContext(Still);
  const sp = useSpeed();
  const grains = [140, 165, 190, 215, 240, 265, 290, 305, 178, 228, 278];
  return (
    <Art id="aaratakshate" prefix={prefix} fit={fit}>
      <g filter={`url(#${prefix}splash-aaratakshate)`}>
        <Blob cx={240} cy={62} rx={96} ry={58} fill="#f7a541" delay={0} play={play} o={0.85} />
        <Blob cx={175} cy={100} rx={50} ry={34} fill="#e8678a" delay={0.15} play={play} o={0.75} />
        <Blob cx={305} cy={108} rx={32} ry={24} fill="#e8678a" delay={0.3} play={play} o={0.7} />
      </g>
      {grains.map((x, i) => {
        const cy = 40 + (i % 4) * 14;
        return (
          // The group falls straight down; the grain inside has a fixed tilt around its own centre.
          <motion.g
            key={i}
            initial={still ? false : { y: -60, opacity: 0 }}
            animate={play ? { y: 0, opacity: 1 } : undefined}
            transition={sp({ delay: 0.5 + i * 0.07, duration: 0.9, ease: 'easeOut' })}
          >
            <ellipse cx={x} cy={cy} rx="4.6" ry="2.4" fill="#ffd75e" stroke="#b8860b" strokeWidth="0.9" transform={`rotate(${(i * 47) % 180} ${x} ${cy})`} />
          </motion.g>
        );
      })}
      {/* arati plate */}
      <ellipse cx="236" cy="128" rx="44" ry="10" fill="#c99a2e" />
      <ellipse cx="236" cy="125" rx="38" ry="7" fill="#e3b341" />
      <path d="M228 122 Q236 132 244 122 Z" fill="#9c7316" />
      <path className={play ? 'flame is-lit' : 'flame'} d="M236 98 C 244 108, 242 118, 236 121 C 230 118, 228 108, 236 98 Z" fill="#ff9f1c" />
      <path className={play ? 'flame flame-core is-lit' : 'flame flame-core'} d="M236 106 C 240 112, 239 117, 236 119 C 233 117, 232 112, 236 106 Z" fill="#ffe08a" />
    </Art>
  );
}

/** Bhojana: a banana leaf, served one dish at a time. */
export function BhojanaArt({ play, prefix = '', fit = 'card' }: ArtProps) {
  const still = useContext(Still);
  const sp = useSpeed();
  const dishes = [
    { cx: 214, cy: 92, r: 18, fill: '#fffaf0', stroke: '#e8e0cc' }, // rice
    { cx: 248, cy: 78, r: 9, fill: '#d9822b' }, // sambar
    { cx: 268, cy: 98, r: 8, fill: '#b5402a' }, // rasam
    { cx: 186, cy: 74, r: 7, fill: '#7cb342' }, // palya
    { cx: 170, cy: 96, r: 6, fill: '#f3d9a4' }, // payasa
    { cx: 292, cy: 82, r: 6, fill: '#c62828' }, // pickle
    { cx: 236, cy: 112, r: 7, fill: '#e9b44c' }, // holige
  ];
  return (
    <Art id="bhojana" prefix={prefix} fit={fit}>
      <g filter={`url(#${prefix}splash-bhojana)`}>
        <Blob cx={250} cy={60} rx={90} ry={54} fill="#cfe8b0" delay={0} play={play} o={0.8} />
      </g>
      <g transform="translate(0 -16)">
      <motion.g
        initial={still ? false : { scale: 0.6, opacity: 0, rotate: -8 }}
        animate={play ? { scale: 1, opacity: 1, rotate: -8 } : undefined}
        transition={sp({ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] })}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <path d="M140 92 C 170 40, 300 36, 316 70 C 320 110, 210 140, 140 92 Z" fill="#3f8f45" />
        <path d="M144 92 C 200 82, 270 70, 314 70" fill="none" stroke="#2e6b33" strokeWidth="3" />
        {[0, 1, 2, 3, 4].map((k) => (
          <path key={k} d={`M${170 + k * 28} ${86 - k * 3} L${182 + k * 28} ${60 - k * 2}`} stroke="#5aa65c" strokeWidth="1.5" />
        ))}
      </motion.g>
      {dishes.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r={d.r}
          fill={d.fill}
          stroke={d.stroke}
          strokeWidth={d.stroke ? 2 : 0}
          initial={still ? false : { scale: 0, opacity: 0 }}
          animate={play ? { scale: 1, opacity: 1 } : undefined}
          transition={sp({ delay: 0.9 + i * 0.16, type: 'spring', stiffness: 360, damping: 16 })}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      ))}
      </g>
    </Art>
  );
}

export const ART: Record<string, (p: ArtProps) => ReactNode> = {
  haladhi: HaladhiArt,
  sangeeth: SangeethArt,
  muhurtha: MuhurthaArt,
  aaratakshate: AaratakshateArt,
  bhojana: BhojanaArt,
};
