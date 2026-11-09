import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, Armchair, Car, Clock, MapPin, ShieldCheck, Sparkles, Timer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { attractions, CATEGORY_LABELS } from '../data/attractions';
import { PLANNER_CONFIG, type Pace } from '../data/config';
import type { AttractionCategory, GuestRecommendation, GuestType } from '../data/types';
import { VENUE } from '../data/guestInfo';
import { weddingEvents } from '../data/weddingEvents';
import { useNow } from '../hooks/useNow';
import { Reveal } from '../components/Reveal';
import { planStay, type WindowPlan } from '../utils/itineraryEngine';
import { countdown, formatDuration, formatTime, istAt, toMs } from '../utils/timeCalculations';
import './itinerary.css';

const INTERESTS: AttractionCategory[] = ['heritage', 'temples', 'nature', 'water', 'food'];
const GROUPS: { id: GuestType; label: string }[] = [
  { id: 'couple', label: 'Couple' },
  { id: 'family', label: 'Family' },
  { id: 'elders', label: 'With elders' },
  { id: 'friends', label: 'Friends' },
  { id: 'solo', label: 'Solo' },
];
const PACES: { id: Pace; label: string }[] = [
  { id: 'quick', label: 'Quick look' },
  { id: 'standard', label: 'Standard' },
  { id: 'relaxed', label: 'Unhurried' },
];
const ARRIVALS = ['07:00', '09:00', '11:00', '13:00', '15:00', '16:30'];

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="seg">
      <legend>{label}</legend>
      <div className="chips">
        {options.map((o) => (
          <button key={o.id} className="chip" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** A to-scale bar of the free window: travel, visit, buffers, spare time. */
function WindowBar({ plan, rec }: { plan: WindowPlan; rec: GuestRecommendation | null }) {
  const reduce = useReducedMotion();
  const { start, end } = plan.window;
  const span = end - start;
  const pct = (a: number, b: number) => `${(Math.max(0, b - a) / span) * 100}%`;
  const M = 60000;
  const segs = rec?.recommendedAttraction
    ? [
        { k: 'idle', w: pct(start, rec.leaveAt), label: `Free until ${formatTime(rec.leaveAt)}` },
        { k: 'drive', w: pct(rec.leaveAt, rec.leaveAt + rec.outboundTravelMinutes * M), label: `Drive ${rec.outboundTravelMinutes} min` },
        { k: 'park', w: pct(rec.leaveAt + rec.outboundTravelMinutes * M, rec.arriveAt), label: 'Parking and getting in' },
        { k: 'visit', w: pct(rec.arriveAt, rec.arriveAt + rec.explorationMinutes * M), label: `Explore ${formatDuration(rec.explorationMinutes)}` },
        { k: 'drive', w: pct(rec.arriveAt + rec.explorationMinutes * M, rec.backAt), label: `Back to the car and drive ${rec.returnTravelMinutes} min` },
        { k: 'spare', w: pct(rec.backAt, rec.returnDeadline), label: `Spare ${formatDuration(rec.spareMinutes)}` },
        { k: 'safety', w: pct(rec.returnDeadline, end), label: `Safety buffer until ${formatTime(end)}` },
      ]
    : [{ k: 'relax', w: '100%', label: 'Time to relax at the venue' }];

  return (
    <div className="wbar" role="img" aria-label={segs.map((s) => s.label).join(', ')}>
      <div className="wbar-track">
        {segs.map((s, i) => (
          <motion.span
            key={`${rec?.recommendedAttraction?.id ?? 'relax'}-${i}`}
            className={`wbar-seg seg-${s.k}`}
            title={s.label}
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: s.w }}
          />
        ))}
      </div>
      <div className="wbar-axis">
        <span>{formatTime(start)}</span>
        {rec?.recommendedAttraction && <span className="wbar-dl">Back by {formatTime(rec.returnDeadline)}</span>}
        <span>{plan.window.nextEvent ? `${plan.window.nextEvent.title} ` : ''}{formatTime(end)}</span>
      </div>
      <ul className="wbar-legend" aria-hidden="true">
        <li><i className="seg-drive" /> Drive</li>
        <li><i className="seg-park" /> Parking & transition</li>
        <li><i className="seg-visit" /> Explore</li>
        <li><i className="seg-spare" /> Spare</li>
        <li><i className="seg-safety" /> Safety buffer</li>
      </ul>
    </div>
  );
}

function ReturnCountdown({ rec, now }: { rec: GuestRecommendation; now: number }) {
  const live = now >= rec.gapStart && now <= rec.gapEnd;
  if (!live) {
    return (
      <p className="return-deadline">
        <Timer size={16} aria-hidden="true" /> Return deadline <strong>{formatTime(rec.returnDeadline)}</strong>
      </p>
    );
  }
  const toLeave = countdown(rec.leaveAt, now);
  const toBack = countdown(rec.returnDeadline, now);
  const late = now > rec.leaveAt;
  return (
    <p className="return-deadline live" role="timer" aria-live="off">
      <Timer size={16} aria-hidden="true" />
      {late ? (
        <>Running late for this one — be back by <strong>{formatTime(rec.returnDeadline)}</strong> ({toBack.hours} h {toBack.minutes} min left)</>
      ) : (
        toLeave.hours === 0 && toLeave.minutes === 0 ? (
          <>Leave <strong>now</strong> · back by {formatTime(rec.returnDeadline)}</>
        ) : (
          <>Leave in <strong>{toLeave.hours > 0 ? `${toLeave.hours} h ` : ''}{toLeave.minutes} min</strong> · back by {formatTime(rec.returnDeadline)}</>
        )
      )}
    </p>
  );
}

function RecCard({
  rec,
  title,
  icon,
  selected,
  onSelect,
  now,
}: {
  rec: GuestRecommendation;
  title: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
  now: number;
}) {
  const a = rec.recommendedAttraction;
  return (
    <motion.article layout className={`rec card ${selected ? 'is-selected' : ''} rec-${rec.kind}`}>
      <header className="rec-head">
        <span className="rec-kind">
          {icon} {title}
        </span>
        {a && <span className="rec-time">{formatTime(rec.leaveAt)} → {formatTime(rec.backAt)}</span>}
      </header>
      {a ? (
        <>
          <h4 className="display h-sm">{a.name}</h4>
          <p className="rec-cats small muted">{a.categories.map((c) => CATEGORY_LABELS[c]).join(' · ')}</p>
          <dl className="rec-math">
            <div><dt>Drive</dt><dd>{rec.outboundTravelMinutes} + {rec.returnTravelMinutes} min</dd></div>
            <div><dt>Explore</dt><dd>{formatDuration(rec.explorationMinutes)}</dd></div>
            <div><dt>Parking</dt><dd>{rec.parkingMinutes} min</dd></div>
            <div><dt>Safety</dt><dd>{rec.safetyBufferMinutes} min</dd></div>
          </dl>
          <ReturnCountdown rec={rec} now={now} />
          <p className="small muted">{rec.suitability}</p>
          {rec.warnings.length > 0 && (
            <ul className="rec-warn">
              {rec.warnings.map((w) => (
                <li key={w}><AlertTriangle size={14} aria-hidden="true" /> {w}</li>
              ))}
            </ul>
          )}
          <div className="rec-actions">
            <a className="btn btn-primary btn-sm" href={a.mapUrl} target="_blank" rel="noreferrer">
              <Car size={16} aria-hidden="true" /> Directions
            </a>
            <button className="btn btn-ghost btn-sm" aria-pressed={selected} onClick={onSelect}>
              {selected ? 'Shown on the bar' : 'Show on the bar'}
            </button>
          </div>
          <p className="tiny muted">Drive time: {a.drivingTimeFromVenue.source}.</p>
        </>
      ) : (
        <>
          <h4 className="display h-sm">Stay and soak it in</h4>
          <p className="muted">
            {rec.availableMinutes < PLANNER_CONFIG.minUsefulWindowMinutes
              ? `Only ${formatDuration(rec.availableMinutes)} free — not enough for a safe outing.`
              : `Catch up with family, find a quiet corner of the hill, or rest before the next celebration.`}
          </p>
          <div className="rec-actions">
            <a className="btn btn-ghost btn-sm" href={VENUE.directionsUrl} target="_blank" rel="noreferrer">
              <MapPin size={16} aria-hidden="true" /> Venue on the map
            </a>
            <button className="btn btn-ghost btn-sm" aria-pressed={selected} onClick={onSelect}>
              {selected ? 'Shown on the bar' : 'Show on the bar'}
            </button>
          </div>
        </>
      )}
    </motion.article>
  );
}

export function SmartItinerary() {
  const [interests, setInterests] = useState<AttractionCategory[]>([]);
  const [guestType, setGuestType] = useState<GuestType>('couple');
  const [pace, setPace] = useState<Pace>('standard');
  const [arrival, setArrival] = useState('07:00');
  const [windowIdx, setWindowIdx] = useState<number | null>(null);
  const [selectedKind, setSelectedKind] = useState<'perfect' | 'short' | 'relax'>('perfect');
  const now = useNow(15000);

  const plan = useMemo(() => {
    const stay = { start: istAt('2026-12-02', arrival), end: toMs(PLANNER_CONFIG.stayEnd) };
    // Before the stay, show the whole plan; once guests are there, plan from the current minute.
    const live = now >= stay.start && now <= stay.end ? Math.floor(now / 60000) * 60000 : undefined;
    return planStay(weddingEvents, attractions, { interests, guestType, pace }, stay, live);
  }, [interests, guestType, pace, arrival, Math.floor(now / 60000)]);

  // Default to the post-Muhurtha window — the one most guests will ask about.
  const defaultIdx = Math.max(0, plan.windows.findIndex((w) => w.window.previousEvent?.id === 'muhurtha'));
  const idx = Math.min(windowIdx ?? defaultIdx, plan.windows.length - 1);
  const current = plan.windows[idx];
  const shown =
    selectedKind === 'perfect' ? current?.perfect ?? current?.relax : selectedKind === 'short' ? current?.short ?? current?.relax : current?.relax;

  const toggleInterest = (c: AttractionCategory) =>
    setInterests((xs) => (xs.includes(c) ? xs.filter((x) => x !== c) : [...xs, c]));

  return (
    <section id="explore" className="section explore" aria-labelledby="explore-title">
      <div className="wrap">
        <div className="section-head">
          <Reveal><p className="eyebrow">Explore between celebrations</p></Reveal>
          <Reveal delay={0.08}>
            <h2 id="explore-title" className="display h-lg">
              How much time do you have? <span className="italic">Here’s what fits.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lede">
              The planner reads the wedding schedule, finds your free windows, then subtracts driving, parking and a{' '}
              {PLANNER_CONFIG.safetyBufferMinutes}-minute safety buffer. It only suggests places that get you back before the next
              ceremony.
            </p>
          </Reveal>
        </div>

        {plan.untimed.length > 0 && (
          <p className="notice">
            <AlertTriangle size={16} aria-hidden="true" />
            {plan.untimed.map((e) => e.title).join(', ')}: time not yet confirmed — not included in these calculations.
          </p>
        )}

        <div className="planner">
          <aside className="planner-controls" aria-label="Your preferences">
            <fieldset className="seg">
              <legend>Your free window</legend>
              <div className="window-list" role="tablist" aria-label="Free windows">
                {plan.windows.map((w, i) => (
                  <button
                    key={w.window.id}
                    role="tab"
                    aria-selected={i === idx}
                    className="window-btn"
                    onClick={() => {
                      setWindowIdx(i);
                      setSelectedKind('perfect');
                    }}
                  >
                    <span className="wb-label">{w.window.label}</span>
                    <span className="wb-time">
                      {formatTime(w.window.start)}–{formatTime(w.window.end)} · {formatDuration((w.window.end - w.window.start) / 60000)}
                    </span>
                    {w.window.usesAssumption && <span className="tag tag-warn">Assumed end time</span>}
                  </button>
                ))}
              </div>
            </fieldset>

            {current?.window.label.startsWith('Wed') && (
              <label className="seg arrival">
                <span className="legend-like">On Wed 2 Dec I’m free in Halebidu from</span>
                <select value={arrival} onChange={(e) => setArrival(e.target.value)}>
                  {ARRIVALS.map((t) => (
                    <option key={t} value={t}>{formatTime(istAt('2026-12-02', t))}</option>
                  ))}
                </select>
              </label>
            )}

            <fieldset className="seg">
              <legend>Interested in</legend>
              <div className="chips">
                <button className="chip" aria-pressed={interests.length === 0} onClick={() => setInterests([])}>Everything</button>
                {INTERESTS.map((c) => (
                  <button key={c} className="chip" aria-pressed={interests.includes(c)} onClick={() => toggleInterest(c)}>
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </fieldset>
            <Segmented label="Travelling as" value={guestType} options={GROUPS} onChange={setGuestType} />
            <Segmented label="Pace" value={pace} options={PACES} onChange={setPace} />
          </aside>

          <div className="planner-results" aria-live="polite">
            {current && (
              <>
                <div className="window-summary">
                  <p className="eyebrow">{current.window.label}</p>
                  <p className="display h-md">
                    {formatDuration((current.window.end - current.window.start) / 60000)} free
                    {current.window.nextEvent && (
                      <span className="muted small ws-next"> · be seated for {current.window.nextEvent.title} by {formatTime(current.window.end)}</span>
                    )}
                  </p>
                </div>
                {shown && <WindowBar plan={current} rec={shown} />}

                <LayoutGroup>
                  <div className="rec-grid">
                    <AnimatePresence mode="popLayout">
                      {current.perfect && (
                        <RecCard
                          key={`p-${current.perfect.recommendedAttraction!.id}`}
                          rec={current.perfect}
                          title="Perfect fit"
                          icon={<Sparkles size={14} aria-hidden="true" />}
                          selected={selectedKind === 'perfect'}
                          onSelect={() => setSelectedKind('perfect')}
                          now={now}
                        />
                      )}
                      {current.short && (
                        <RecCard
                          key={`s-${current.short.recommendedAttraction!.id}`}
                          rec={current.short}
                          title="Short alternative"
                          icon={<Clock size={14} aria-hidden="true" />}
                          selected={selectedKind === 'short'}
                          onSelect={() => setSelectedKind('short')}
                          now={now}
                        />
                      )}
                      <RecCard
                        key="relax"
                        rec={current.relax}
                        title="Relax and enjoy the venue"
                        icon={<Armchair size={14} aria-hidden="true" />}
                        selected={selectedKind === 'relax' || (!current.perfect && !current.short)}
                        onSelect={() => setSelectedKind('relax')}
                        now={now}
                      />
                    </AnimatePresence>
                  </div>
                </LayoutGroup>

                {current.alsoFits.length > 0 && (
                  <details className="also">
                    <summary>Also fits this window ({current.alsoFits.length})</summary>
                    <ul>
                      {current.alsoFits.map((r) => (
                        <li key={r.recommendedAttraction!.id}>
                          <span>{r.recommendedAttraction!.name}</span>
                          <span className="muted small">
                            {formatTime(r.leaveAt)} → {formatTime(r.backAt)} · {formatDuration(r.explorationMinutes)} there
                          </span>
                          <a href={r.recommendedAttraction!.mapUrl} target="_blank" rel="noreferrer">Directions</a>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {!current.perfect && current.relax.availableMinutes >= PLANNER_CONFIG.minUsefulWindowMinutes && (
                  <p className="notice">
                    <ShieldCheck size={16} aria-hidden="true" /> Nothing matching your choices gets you back in time — so we won’t suggest one.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        <p className="planner-foot small muted">
          Drive times are Google Maps estimates from the venue, checked on 9 Nov 2026; real traffic varies. Visit lengths are suggestions.
          Buffers: {PLANNER_CONFIG.parkingMinutes} min parking each way, {PLANNER_CONFIG.safetyBufferMinutes} min safety, and you’re asked
          back early enough to be seated.
        </p>
      </div>
    </section>
  );
}
