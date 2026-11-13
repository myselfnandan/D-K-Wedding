import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { CalendarPlus, ChevronDown, Clock, MapPin } from 'lucide-react';
import { useRef, useState } from 'react';
import type { WeddingEvent } from '../data/types';
import { weddingEvents } from '../data/weddingEvents';
import { downloadIcs } from '../utils/calendar';
import { formatDateIso, formatTime, toMs } from '../utils/timeCalculations';
import { Reveal } from '../components/Reveal';

function timeText(e: WeddingEvent) {
  if (!e.startDateTime) return 'Time to be confirmed';
  const s = formatTime(toMs(e.startDateTime));
  if (e.endDateTime) return `${s} – ${formatTime(toMs(e.endDateTime))}`;
  return `From ${s}`;
}

function EventCard({ e, index }: { e: WeddingEvent; index: number }) {
  const [open, setOpen] = useState(e.priority === 'critical');
  const panelId = `ev-${e.id}`;
  const reduce = useReducedMotion();
  return (
    <Reveal as="li" className={`event ${e.priority === 'critical' ? 'is-critical' : ''}`} delay={index * 0.05}>
      <span className="event-node" aria-hidden="true" />
      <div className="event-card">
        <div className="event-top">
          <p className="event-date">{formatDateIso(e.date)}</p>
          {e.priority === 'critical' && <span className="tag">The main ceremony</span>}
          {!e.startDateTime && <span className="tag tag-warn">Time to be confirmed</span>}
        </div>
        <h3 className="display h-md event-title">
          {e.title}
        </h3>
        <p className="event-when">
          <Clock size={16} aria-hidden="true" /> {timeText(e)}
        </p>
        <p className="event-where">
          <MapPin size={16} aria-hidden="true" /> {e.location}
        </p>

        <button className="event-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide details' : 'Details'}
          <ChevronDown size={16} aria-hidden="true" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }} />
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              className="event-panel"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduce ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <p>{e.description}</p>
              <dl className="event-details">
                {e.details.map((d) => (
                  <div key={d.label}>
                    <dt>{d.label}</dt>
                    <dd>{d.value}</dd>
                  </div>
                ))}
                <div>
                  <dt>Dress code</dt>
                  <dd>{e.dressCode ?? 'Not specified'}</dd>
                </div>
                {e.startDateTime && !e.endDateTime && (
                  <div>
                    <dt>Ends</dt>
                    <dd>Not specified in the invitation</dd>
                  </div>
                )}
              </dl>
              {e.instructions.length > 0 && (
                <ul className="event-notes">
                  {e.instructions.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
              <div className="event-actions">
                {e.mapUrl && (
                  <a className="btn btn-ghost btn-sm" href={e.mapUrl} target="_blank" rel="noreferrer">
                    <MapPin size={16} aria-hidden="true" /> Open in Maps
                  </a>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => downloadIcs(e)}>
                  <CalendarPlus size={16} aria-hidden="true" /> Add to calendar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

export function WeddingTimeline() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 60%'] });
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);
  // Order exactly as the family's invitation lists them.
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
            <p className="lede">Every ceremony from the invitation, in order. Tap any event for details, directions and a calendar reminder.</p>
          </Reveal>
        </div>
        <ol className="timeline" ref={ref}>
          <span className="timeline-track" aria-hidden="true">
            <motion.span className="timeline-fill" style={{ scaleY: line }} />
          </span>
          {events.map((e, i) => (
            <EventCard key={e.id} e={e} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}
