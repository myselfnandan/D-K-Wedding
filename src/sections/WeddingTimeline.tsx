import { motion, useInView, useReducedMotion } from 'motion/react';
import { CalendarPlus, MapPin } from 'lucide-react';
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { Reveal } from '../components/Reveal';
import { VENUE } from '../data/guestInfo';
import type { WeddingEvent } from '../data/types';
import { weddingEvents } from '../data/weddingEvents';
import { downloadIcs } from '../utils/calendar';
import { eventTimeText, formatDateIso } from '../utils/timeCalculations';
import './celebrations.css';

/* ---------- Painted splashes and small illustrations, one per ceremony ---------- */

/** Reduced motion: every illustration is drawn in its finished state, nothing animates. */
const Still = createContext(false);

/** Watercolour-edged blob: a soft ellipse roughened by the card's turbulence filter. */
function Blob({ cx, cy, rx, ry, fill, delay, play, o = 0.9 }: { cx: number; cy: number; rx: number; ry: number; fill: string; delay: number; play: boolean; o?: number }) {
  const still = useContext(Still);
  return (
    <motion.ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill={fill}
      initial={still ? false : { scale: 0, opacity: 0 }}
      animate={play ? { scale: 1, opacity: o } : undefined}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    />
  );
}

function Art({ id, children }: { id: string; children: ReactNode }) {
  return (
    <svg className="moment-svg" viewBox="0 0 320 180" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <filter id={`splash-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed={id.length * 7} />
          <feDisplacementMap in="SourceGraphic" scale="22" />
        </filter>
      </defs>
      {children}
    </svg>
  );
}

/** Haladhi: turmeric splashes and a brass bowl of turmeric paste. */
function HaladhiArt({ play }: { play: boolean }) {
  const still = useContext(Still);
  return (
    <Art id="haladhi">
      <g filter="url(#splash-haladhi)">
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
      <motion.g initial={still ? false : { y: 20, opacity: 0 }} animate={play ? { y: 0, opacity: 1 } : undefined} transition={{ delay: 0.55, duration: 0.6 }}>
        <ellipse cx="236" cy="96" rx="34" ry="9" fill="#e9a400" />
        <path d="M202 96 Q236 140 270 96 Z" fill="#b8862b" />
        <path d="M206 98 Q236 132 266 98" fill="none" stroke="#8a6420" strokeWidth="2" />
      </motion.g>
    </Art>
  );
}

/** Muhurtha: kumkuma red and arishina yellow, and the taali tied with three knots. */
function MuhurthaArt({ play }: { play: boolean }) {
  const still = useContext(Still);
  const knots = [
    [196, 58],
    [214, 68],
    [232, 74],
  ];
  return (
    <Art id="muhurtha">
      <g filter="url(#splash-muhurtha)">
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
        transition={{ delay: 0.5, duration: 1.1, ease: 'easeInOut' }}
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
          transition={{ delay: 1.5 + i * 0.25, type: 'spring', stiffness: 400, damping: 12 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      ))}
      {/* the taali pendant, swinging into place */}
      <motion.g
        initial={still ? false : { y: -30, opacity: 0, rotate: -18 }}
        animate={play ? { y: 0, opacity: 1, rotate: [18, -10, 5, 0] } : undefined}
        transition={{ delay: 2.3, duration: 1.2 }}
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
function AaratakshateArt({ play }: { play: boolean }) {
  const still = useContext(Still);
  const grains = [140, 165, 190, 215, 240, 265, 290, 305, 178, 228, 278];
  return (
    <Art id="aaratakshate">
      <g filter="url(#splash-aaratakshate)">
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
            transition={{ delay: 0.5 + i * 0.07, duration: 0.9, ease: 'easeOut' }}
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
function BhojanaArt({ play }: { play: boolean }) {
  const still = useContext(Still);
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
    <Art id="bhojana">
      <g filter="url(#splash-bhojana)">
        <Blob cx={250} cy={60} rx={90} ry={54} fill="#cfe8b0" delay={0} play={play} o={0.8} />
      </g>
      <g transform="translate(0 -16)">
      <motion.g
        initial={still ? false : { scale: 0.6, opacity: 0, rotate: -8 }}
        animate={play ? { scale: 1, opacity: 1, rotate: -8 } : undefined}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
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
          transition={{ delay: 0.9 + i * 0.16, type: 'spring', stiffness: 360, damping: 16 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        />
      ))}
      </g>
    </Art>
  );
}

const ART: Record<string, (p: { play: boolean }) => ReactNode> = {
  haladhi: HaladhiArt,
  muhurtha: MuhurthaArt,
  aaratakshate: AaratakshateArt,
  bhojana: BhojanaArt,
};

/** One short fact per card, from the data. */
function keyNote(e: WeddingEvent): string | null {
  if (!e.startDateTime && e.timeOfDay) return 'Exact time to be confirmed';
  const lagna = e.details.find((d) => d.label === 'Lagna');
  if (lagna) return `The main ceremony · Lagna: ${lagna.value}`;
  return null;
}

function MomentCard({ e, index }: { e: WeddingEvent; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const reduce = !!useReducedMotion();
  const inView = useInView(ref, { amount: 0.35 });
  const play = reduce || inView;
  // Each time the card comes back on screen the illustration remounts, so its animation plays again.
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    if (inView) setVisit((v) => v + 1);
  }, [inView]);
  const Illustration = ART[e.id];
  const note = keyNote(e);
  return (
    <li ref={ref} className={`moment moment-${e.id}`}>
      <Still.Provider value={reduce}>
        <div className="moment-art">{Illustration && <Illustration key={visit} play={play} />}</div>
      </Still.Provider>
      <Reveal className="moment-body" delay={index * 0.05}>
        <p className="moment-when">
          {formatDateIso(e.date)} · {eventTimeText(e)}
        </p>
        <h3 className="display moment-title">{e.title}</h3>
        <p className="moment-desc">{e.description}</p>
        {note && <p className="moment-note">{note}</p>}
        <div className="moment-actions">
          <button className="btn btn-sm moment-btn" onClick={() => downloadIcs(e)}>
            <CalendarPlus size={16} aria-hidden="true" /> Add to calendar
          </button>
          {e.mapUrl && (
            <a className="btn btn-sm moment-btn moment-btn-ghost" href={e.mapUrl} target="_blank" rel="noreferrer">
              <MapPin size={16} aria-hidden="true" /> Map
            </a>
          )}
        </div>
      </Reveal>
    </li>
  );
}

export function WeddingTimeline() {
  // Order exactly as the family lists them.
  const events = [...weddingEvents].sort((a, b) => a.order - b.order);
  return (
    <section id="celebrations" className="section celebrations" aria-labelledby="celebrations-title">
      <div className="wrap">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">The celebrations</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="celebrations-title" className="display h-lg">
              Four moments, <span className="italic">one story</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lede">All at {VENUE.hall}.</p>
          </Reveal>
        </div>
        <ol className="moments">
          {events.map((e, i) => (
            <MomentCard key={e.id} e={e} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}
