import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, Car, Clock, Navigation2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CategoryArt } from '../components/CategoryArt';
import { Photo } from '../components/Photo';
import { Reveal } from '../components/Reveal';
import { attractions, CATEGORY_LABELS } from '../data/attractions';
import type { Attraction, AttractionCategory, DistanceBand } from '../data/types';
import { BAND_LABEL, distanceBand } from '../utils/distanceCalculations';
import { formatDuration } from '../utils/timeCalculations';
import './discover.css';

const CATS: (AttractionCategory | 'all')[] = ['all', 'heritage', 'temples', 'nature', 'water', 'family', 'food'];
const BANDS: DistanceBand[] = ['very-close', 'nearby', 'extended'];
const GUEST_LABEL = { solo: 'Solo', couple: 'Couples', family: 'Families', elders: 'Elders', friends: 'Friends' };

/** Drive-time ruler from the venue: square-root scale so the close cluster stays readable. */
function DriveRuler({ items, active, onPick }: { items: Attraction[]; active: string | null; onPick: (id: string) => void }) {
  const max = 210;
  const pos = (m: number) => `${(Math.sqrt(Math.min(m, max)) / Math.sqrt(max)) * 100}%`;
  const ticks = [0, 15, 30, 60, 120, 180];
  return (
    <div className="ruler" aria-label="Drive time from the venue">
      <div className="ruler-line">
        <span className="ruler-band band-close" style={{ width: pos(15) }} />
        <span className="ruler-band band-near" style={{ left: pos(15), width: `calc(${pos(60)} - ${pos(15)})` }} />
        {ticks.map((t) => (
          <span key={t} className="ruler-tick" style={{ left: pos(t) }}>
            <span>{t === 0 ? 'Venue' : t < 60 ? `${t}m` : `${t / 60}h`}</span>
          </span>
        ))}
        {items.map((a, i) => (
          <button
            key={a.id}
            className={`ruler-dot ${active === a.id ? 'is-active' : ''}`}
            style={{ left: pos(a.drivingTimeFromVenue.value), top: `${(i % 3) * 14 - 14}px` }}
            onClick={() => onPick(a.id)}
            aria-label={`${a.name}: ${a.drivingTimeFromVenue.value} min drive`}
          >
            <span className="ruler-tip">{a.name.split(',')[0]} · {a.drivingTimeFromVenue.value}m</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AttractionCard({ a, i, active, onFocus }: { a: Attraction; i: number; active: boolean; onFocus: () => void }) {
  const band = distanceBand(a);
  const reduce = useReducedMotion();
  return (
    <motion.article
      layout={!reduce}
      id={`place-${a.id}`}
      className={`place card ${active ? 'is-active' : ''}`}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={onFocus}
      onFocus={onFocus}
      tabIndex={-1}
    >
      <div className="place-media">
        <Photo
          id={a.image}
          alt={a.imageAlt}
          sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"
          fallback={<CategoryArt category={a.categories[0]} seed={i} />}
        />
        <span className={`place-band band-${band}`}>{BAND_LABEL[band].title}</span>
      </div>
      <div className="place-body">
        <p className="small place-cats">{a.categories.map((c) => CATEGORY_LABELS[c]).join(' · ')}</p>
        <h3 className="display h-sm">{a.name}</h3>
        <p className="place-desc">{a.description}</p>
        <ul className="place-facts">
          <li><Car size={15} aria-hidden="true" /> {a.roadDistanceKm.value} km · {formatDuration(a.drivingTimeFromVenue.value)} drive</li>
          <li><Clock size={15} aria-hidden="true" /> Suggested {formatDuration(a.explorationDuration.min)}–{formatDuration(a.explorationDuration.typical)} there</li>
          <li>
            <Clock size={15} aria-hidden="true" />{' '}
            {a.openingHours
              ? `${a.openingHours.value.open}–${a.openingHours.value.close} ${a.openingHours.verified ? '(official)' : '(unverified)'}`
              : 'Hours not verified'}
          </li>
          <li><Users size={15} aria-hidden="true" /> {a.suitableFor.map((g) => GUEST_LABEL[g]).join(', ')}</li>
        </ul>
        {a.bestVisitTime && <p className="small"><strong>Best time:</strong> {a.bestVisitTime}</p>}
        {(a.seasonalNotes || a.accessibility || a.cautions.length > 0) && (
          <ul className="place-notes">
            {a.seasonalNotes && <li><AlertTriangle size={13} aria-hidden="true" /> {a.seasonalNotes}</li>}
            {a.accessibility && <li><AlertTriangle size={13} aria-hidden="true" /> {a.accessibility}</li>}
            {a.cautions.map((c) => <li key={c}><AlertTriangle size={13} aria-hidden="true" /> {c}</li>)}
          </ul>
        )}
        <a className="btn btn-primary btn-sm place-cta" href={a.mapUrl} target="_blank" rel="noreferrer">
          <Navigation2 size={15} aria-hidden="true" /> Directions from the venue
        </a>
      </div>
    </motion.article>
  );
}

export function DestinationExplorer() {
  const [cat, setCat] = useState<AttractionCategory | 'all'>('all');
  const [band, setBand] = useState<DistanceBand | 'all'>('all');
  const [active, setActive] = useState<string | null>(null);

  const list = useMemo(
    () =>
      attractions
        .filter((a) => cat === 'all' || a.categories.includes(cat))
        .filter((a) => band === 'all' || distanceBand(a) === band)
        .sort((x, y) => x.drivingTimeFromVenue.value - y.drivingTimeFromVenue.value),
    [cat, band],
  );

  const pick = (id: string) => {
    setActive(id);
    const el = document.getElementById(`place-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  };

  return (
    <section id="discover" className="section discover" aria-labelledby="discover-title">
      <div className="wrap">
        <div className="section-head">
          <Reveal><p className="eyebrow">Destination discovery</p></Reveal>
          <Reveal delay={0.08}>
            <h2 id="discover-title" className="display h-lg">
              Hoysala country, <span className="italic">by the clock</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lede">
              Every place measured by real drive time from the venue. Tap a point on the ruler to jump to it.
            </p>
          </Reveal>
        </div>

        <Reveal>
          <DriveRuler items={list} active={active} onPick={pick} />
        </Reveal>

        <div className="filters">
          <div className="chips" role="group" aria-label="Filter by category">
            {CATS.map((c) => (
              <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
                {c === 'all' ? 'All places' : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          <div className="chips" role="group" aria-label="Filter by distance">
            <button className="chip" aria-pressed={band === 'all'} onClick={() => setBand('all')}>Any distance</button>
            {BANDS.map((b) => (
              <button key={b} className="chip" aria-pressed={band === b} onClick={() => setBand(b)}>
                {BAND_LABEL[b].title} <span className="muted small">· {BAND_LABEL[b].hint}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="small muted result-count" aria-live="polite">{list.length} places</p>
        <div className="places">
          <AnimatePresence mode="popLayout">
            {list.map((a, i) => (
              <AttractionCard key={a.id} a={a} i={i} active={active === a.id} onFocus={() => setActive(a.id)} />
            ))}
          </AnimatePresence>
          {list.length === 0 && <p className="muted">No places match both filters — try “Any distance”.</p>}
        </div>
        <p className="small muted planner-foot">
          Distances and drive times: Google Maps from the venue pin, checked 9 Nov 2026. Hours marked “unverified” come from third-party
          listings — please confirm locally. Bettada Bhairaveshwara Temple is not listed because we could not verify its details.
        </p>
      </div>
    </section>
  );
}
