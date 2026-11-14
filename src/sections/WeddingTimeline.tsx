import { useInView, useReducedMotion } from 'motion/react';
import { CalendarPlus, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ART, Still } from '../components/CeremonyArt';
import { Reveal } from '../components/Reveal';
import { VENUE } from '../data/guestInfo';
import type { WeddingEvent } from '../data/types';
import { weddingEvents } from '../data/weddingEvents';
import { downloadIcs } from '../utils/calendar';
import { eventTimeText, formatDateIso } from '../utils/timeCalculations';
import './celebrations.css';


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
              Five moments, <span className="italic">one story</span>
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
