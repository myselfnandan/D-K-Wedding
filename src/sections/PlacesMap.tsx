import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { Navigation2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CategoryArt } from '../components/CategoryArt';
import { Photo } from '../components/Photo';
import { Reveal } from '../components/Reveal';
import { Stepper } from '../components/Stepper';
import { attractions } from '../data/attractions';
import type { Attraction } from '../data/types';
import { formatDuration } from '../utils/timeCalculations';
import { CX, CY, layoutPins, type Pin, polar, radiusFor, routePath, VIEW, wobblyCircle } from '../utils/placesMap';
import './places-map.css';

/** Ring labels sit at their own bearings in the empty east, clear of the pins. */
const RINGS = [
  { min: 15, label: '15 min', at: 110 },
  { min: 60, label: '1 hr', at: 62 },
  { min: 120, label: '2 hr', at: 42 },
  { min: 180, label: '3 hr', at: 30 },
];
const BY_ID = new Map(attractions.map((a) => [a.id, a]));
const shortName = (a: Attraction) => a.name.split(',')[0];
/** Small gopura silhouette marking the venue. */
const templeGlyph = (x: number, y: number) =>
  `M${x} ${y - 30} L${x + 10} ${y - 12} L${x + 18} ${y + 6} L${x + 22} ${y + 6} L${x + 22} ${y + 22} L${x - 22} ${y + 22} L${x - 22} ${y + 6} L${x - 18} ${y + 6} L${x - 10} ${y - 12} Z`;
const tone = (min: number) => (min <= 15 ? 'near' : min <= 60 ? 'mid' : 'far');

/** Static painted layers: paper, washes, Western Ghats to the north-west, water near Belur. Rendered once. */
function PaintedGround({ pins }: { pins: Pin[] }) {
  const yagachi = pins.find((p) => p.id === 'yagachi');
  const water = yagachi ? polar(yagachi.radius + 8, yagachi.bearing - 10) : { x: 330, y: 500 };
  return (
    <g aria-hidden="true">
      <defs>
        <filter id="pm-rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="12" />
        </filter>
        <filter id="pm-wash" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="3" seed="9" />
          <feDisplacementMap in="SourceGraphic" scale="60" />
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="pm-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.07" />
          </feComponentTransfer>
        </filter>
        <radialGradient id="pm-glow">
          <stop offset="0" stopColor="#b5baff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#b5baff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={VIEW} height={VIEW} className="pm-paper" />
      {/* Watercolour washes */}
      <g filter="url(#pm-wash)">
        <ellipse cx="300" cy="300" rx="300" ry="240" className="pm-wash-hills" />
        <ellipse cx="700" cy="640" rx="280" ry="220" className="pm-wash-plain" />
        <ellipse cx={CX} cy={CY} rx="230" ry="210" className="pm-wash-centre" />
      </g>
      {/* Western Ghats: layered ridges to the north-west, where the hill places are */}
      <g filter="url(#pm-rough)">
        <path className="pm-ridge pm-ridge-back" d="M40 360 L110 250 L160 300 L230 170 L290 260 L340 200 L400 300 L420 360 Z" />
        <path className="pm-ridge pm-ridge-mid" d="M20 430 L90 320 L150 380 L210 270 L270 360 L320 300 L380 400 L400 440 Z" />
        <path className="pm-ridge pm-ridge-front" d="M60 520 L130 430 L180 470 L240 400 L300 480 L350 450 L390 520 Z" />
        {/* Water beside Belur and a river from the hills */}
        <ellipse cx={water.x} cy={water.y} rx="46" ry="26" className="pm-water" />
        <path className="pm-river" d={`M150 560 C 220 600, 250 520, ${water.x - 40} ${water.y + 6} S 360 700, 300 860`} />
      </g>
      <circle cx={CX} cy={CY} r="160" fill="url(#pm-glow)" />
      <rect width={VIEW} height={VIEW} filter="url(#pm-grain)" />
    </g>
  );
}

function Compass() {
  return (
    <g className="pm-compass" transform="translate(915 915)" aria-hidden="true">
      <circle r="40" />
      <path d="M0 -30 L9 4 L0 -3 L-9 4 Z" />
      <text y="30" textAnchor="middle">
        N
      </text>
    </g>
  );
}

function MapPin({ pin, selected, onSelect, delay, animate }: { pin: Pin; selected: boolean; onSelect: () => void; delay: number; animate: boolean }) {
  const a = BY_ID.get(pin.id)!;
  return (
    <motion.g
      className={`pm-pin pm-${tone(pin.minutes)} ${selected ? 'is-selected' : ''}`}
      style={{ transformOrigin: `${pin.x}px ${pin.y}px`, transformBox: 'view-box' }}
      initial={animate ? { scale: 0, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay }}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${pin.n}. ${a.name}, ${formatDuration(pin.minutes)} drive`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <circle className="pm-hit" cx={pin.x} cy={pin.y} r="58" />
      {selected && <circle className="pm-halo" cx={pin.x} cy={pin.y} r="50" />}
      <circle className="pm-dot" cx={pin.x} cy={pin.y} r={selected ? 36 : 30} />
      <text className="pm-num" x={pin.x} y={pin.y} dy="0.36em" textAnchor="middle">
        {pin.n}
      </text>
    </motion.g>
  );
}

export function PlacesMap() {
  const pins = useMemo(() => layoutPins(attractions), []);
  const [selectedId, setSelectedId] = useState(pins[0].id);
  const reduce = !!useReducedMotion();
  const mapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(mapRef, { amount: 0.3 });
  const play = !reduce && inView;
  // Rings and pins redraw each time the map comes back on screen (the chosen place is kept).
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    if (inView) setVisit((v) => v + 1);
  }, [inView]);
  const pin = pins.find((p) => p.id === selectedId)!;
  const a = BY_ID.get(selectedId)!;

  const select = (id: string) => setSelectedId(id);

  return (
    <section id="explore" className="section places" aria-labelledby="places-title">
      <div className="wrap">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">Explore</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="places-title" className="display h-lg">
              Around <span className="italic">Halebidu</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lede">Temples, hills and water near the venue. Tap a number to see the place.</p>
          </Reveal>
        </div>

        <div className="places-layout">
          <div className="pm-frame" ref={mapRef}>
            <svg className="pm-svg" viewBox={`0 0 ${VIEW} ${VIEW}`} role="group" aria-label="Map of places around the venue by drive time">
              <PaintedGround pins={pins} />

              {/* Drive-time rings, drawn in each time the map is on screen */}
              <g key={`rings-${visit}`}>
              {RINGS.map((r, i) => {
                const rad = radiusFor(r.min);
                const lp = polar(rad, r.at);
                return (
                  <g key={r.min} className="pm-ring" aria-hidden="true">
                    <motion.path
                      d={wobblyCircle(rad, i * 1.7)}
                      initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                      animate={play || reduce ? { pathLength: 1, opacity: 1 } : undefined}
                      transition={{ duration: 1.4, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] }}
                    />
                    <text x={lp.x} y={lp.y} dy="0.35em" textAnchor="middle">
                      {r.label}
                    </text>
                  </g>
                );
              })}
              </g>

              {/* Route from the venue to the selected place */}
              <AnimatePresence mode="wait">
                <motion.path
                  key={pin.id}
                  className="pm-route"
                  d={routePath(pin.x, pin.y)}
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  aria-hidden="true"
                />
              </AnimatePresence>

              {/* Venue */}
              <g className="pm-venue" aria-hidden="true">
                {!reduce && <circle className="pm-pulse" cx={CX} cy={CY} r="40" />}
                <circle cx={CX} cy={CY} r="44" className="pm-venue-disc" />
                <path
                  className="pm-venue-temple"
                  d={templeGlyph(CX, CY)}
                />
                <text x={CX} y={CY + 78} textAnchor="middle" className="pm-venue-label">
                  Venue
                </text>
              </g>

              <g key={`pins-${visit}`}>
              {pins.map((p, i) => (
                <MapPin key={p.id} pin={p} selected={p.id === selectedId} onSelect={() => select(p.id)} delay={0.6 + i * 0.07} animate={play} />
              ))}
              </g>

              <Compass />
            </svg>
            {/* Name of the selected place, in a corner where it can never cover a pin */}
            <AnimatePresence mode="wait">
              <motion.p
                key={pin.id}
                className={`pm-tag pm-${tone(pin.minutes)}`}
                initial={reduce ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
                transition={{ duration: 0.25 }}
                aria-hidden="true"
              >
                <span className="pm-tag-n">{pin.n}</span>
                {shortName(a)} · {formatDuration(pin.minutes)}
              </motion.p>
            </AnimatePresence>
            <p className="pm-note">Not to scale: distance from the centre is drive time from the venue.</p>
          </div>

          <div className="places-side">
            <ol className="pm-list" aria-label="Places by drive time">
              {pins.map((p) => {
                const x = BY_ID.get(p.id)!;
                return (
                  <li key={p.id}>
                    <button type="button" className={`pm-chip pm-${tone(p.minutes)}`} aria-pressed={p.id === selectedId} onClick={() => select(p.id)}>
                      <span className="pm-chip-n">{p.n}</span>
                      <span className="pm-chip-name">{shortName(x)}</span>
                      <span className="pm-chip-time">{formatDuration(p.minutes)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {/* Phones: one place at a time with back / forward, so no option hides off-screen. */}
            <Stepper
              className="pm-stepper"
              index={pin.n - 1}
              count={pins.length}
              onChange={(i) => select(pins[i].id)}
              label="Choose a place"
              noun="place"
            >
              <span className={`pm-chip-n pm-${tone(pin.minutes)}`}>{pin.n}</span>
              <span>{shortName(a)}</span>
              <span className="pm-chip-time">{formatDuration(pin.minutes)}</span>
            </Stepper>

            <AnimatePresence mode="wait">
              <motion.article
                key={a.id}
                className="pm-card"
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                aria-live="polite"
              >
                <div className="pm-card-media">
                  <Photo id={a.image} alt={a.imageAlt} sizes="(max-width: 900px) 100vw, 420px" fallback={<CategoryArt category={a.categories[0]} seed={pin.n} />} />
                </div>
                <div className="pm-card-body">
                  <p className="pm-card-meta">
                    {pin.n} · {a.roadDistanceKm.value} km · {formatDuration(a.drivingTimeFromVenue.value)} drive
                  </p>
                  <h3 className="display h-sm">{a.name}</h3>
                  <p className="pm-card-desc">{a.description}</p>
                  <p className="pm-card-small">
                    Suggested {formatDuration(a.explorationDuration.min)}–{formatDuration(a.explorationDuration.typical)} there ·{' '}
                    {a.openingHours
                      ? `${a.openingHours.value.open}–${a.openingHours.value.close}${a.openingHours.verified ? '' : ' (unverified)'}`
                      : 'hours not verified'}
                  </p>
                  {a.cautions.length > 0 && <p className="pm-card-note">{a.cautions[0]}</p>}
                  <a className="btn btn-primary btn-sm" href={a.mapUrl} target="_blank" rel="noreferrer">
                    <Navigation2 size={15} aria-hidden="true" /> Directions from the venue
                  </a>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>

        <p className="small muted places-foot">
          Drive times: Google Maps from the venue, checked 9 Nov 2026. Opening hours marked unverified come from third-party listings; please
          confirm locally.
        </p>
      </div>
    </section>
  );
}
