import { AnimatePresence, motion } from 'motion/react';
import { Car, Navigation2, Plane, TrainFront } from 'lucide-react';
import { useState } from 'react';
import { Reveal } from '../components/Reveal';
import { Stepper } from '../components/Stepper';
import { VENUE } from '../data/guestInfo';
import { travelRoutes } from '../data/travelRoutes';
import { formatDuration } from '../utils/timeCalculations';

const ICON = { city: Car, rail: TrainFront, air: Plane };

export function TravelGuide() {
  const [sel, setSel] = useState(travelRoutes[0].id);
  const r = travelRoutes.find((x) => x.id === sel)!;
  const Icon = ICON[r.kind];
  return (
    <section id="travel" className="section travel" aria-labelledby="travel-title">
      <div className="wrap">
        <div className="section-head">
          <Reveal><p className="eyebrow">Your journey</p></Reveal>
          <Reveal delay={0.08}>
            <h2 id="travel-title" className="display h-lg">
              Getting to <span className="italic">Pushpagiri</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lede">
              Choose where you’re starting from. Times are Google Maps driving estimates — leave room for breaks and ghat roads, and aim to
              arrive the day before.
            </p>
          </Reveal>
        </div>

        <div className="travel-grid">
          <div className="travel-tabs" role="tablist" aria-label="Starting point">
            {travelRoutes.map((t) => {
              const I = ICON[t.kind];
              return (
                <button
                  key={t.id}
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={sel === t.id}
                  aria-controls="travel-panel"
                  className="travel-tab"
                  onClick={() => setSel(t.id)}
                >
                  <I size={16} aria-hidden="true" />
                  <span>{t.from}</span>
                  <span className="muted small">{formatDuration(t.driveMinutes.value)}</span>
                </button>
              );
            })}
          </div>
          {/* Phones: one starting point at a time with back / forward, so no option hides off-screen. */}
          <Stepper
            className="travel-stepper"
            index={travelRoutes.findIndex((x) => x.id === sel)}
            count={travelRoutes.length}
            onChange={(i) => setSel(travelRoutes[i].id)}
            label="Choose where you are starting from"
            noun="starting point"
          >
            <Icon size={16} aria-hidden="true" />
            <span>{r.from}</span>
            <span className="muted small">{formatDuration(r.driveMinutes.value)}</span>
          </Stepper>
          <div id="travel-panel" role="tabpanel" aria-labelledby={`tab-${r.id}`} className="travel-panel card">
            <AnimatePresence mode="wait">
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                <p className="eyebrow"><Icon size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> From {r.from}</p>
                <div className="travel-stats">
                  <div><span className="display h-lg">{r.distanceKm.value}</span><span className="muted">km by road</span></div>
                  <div><span className="display h-lg">{formatDuration(r.driveMinutes.value)}</span><span className="muted">typical drive</span></div>
                </div>
                <p>Route: {r.via}</p>
                {r.notes.map((n) => <p key={n} className="muted">{n}</p>)}
                <a className="btn btn-primary" href={r.mapUrl} target="_blank" rel="noreferrer">
                  <Navigation2 size={16} aria-hidden="true" /> Navigate in Google Maps
                </a>
                <p className="tiny muted" style={{ marginTop: 12 }}>{r.distanceKm.source}.</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="travel-facts">
          <Reveal className="card fact">
            <TrainFront size={20} aria-hidden="true" />
            <h3 className="display h-sm">Nearest railway</h3>
            <p className="muted">Hassan Junction, about 51 minutes by road (32.6 km). Arrange a taxi onward to Halebidu.</p>
          </Reveal>
          <Reveal className="card fact" delay={0.05}>
            <Plane size={20} aria-hidden="true" />
            <h3 className="display h-sm">Airports</h3>
            <p className="muted">Mangaluru (about 4 h) or Bengaluru Kempegowda (about 4 h 10 min) — both by road from there.</p>
          </Reveal>
          <Reveal className="card fact" delay={0.1}>
            <Car size={20} aria-hidden="true" />
            <h3 className="display h-sm">Getting around</h3>
            <p className="muted">
              Karnataka Tourism recommends a taxi or your own vehicle around Belur and Halebidu; buses run from Hassan to Belur.
            </p>
          </Reveal>
          <Reveal className="card fact" delay={0.15}>
            <Navigation2 size={20} aria-hidden="true" />
            <h3 className="display h-sm">Venue pin</h3>
            <p className="muted">{VENUE.address}</p>
            <a className="btn btn-ghost btn-sm" href={VENUE.mapUrl} target="_blank" rel="noreferrer">Open the family’s map link</a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
