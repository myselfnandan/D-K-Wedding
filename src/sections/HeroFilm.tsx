import { motion, type MotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { type ReactNode, useEffect, useRef } from 'react';
import { scrollToId } from '../components/Navigation';
import { COUPLE, HOSTS, VENUE } from '../data/guestInfo';
import { MUHURTHA, weddingEvents } from '../data/weddingEvents';
import { type FrameStore, HERO_FRAMES } from '../hooks/useFrameSequence';
import { useNow } from '../hooks/useNow';
import { coverRect, posterUrl } from '../utils/frameSequence';
import { activePanel, anyPanelOpacity, HANDOFF, HANDOFF_DIM, PANELS, panelAnchor, panelOpacity, panelShift } from '../utils/heroPanels';
import { countdown, eventTimeText, formatDateIso, toMs } from '../utils/timeCalculations';
import './hero.css';

const MAX_DPR = 2;
/** In-page anchors inside the scroll track: the nav lands on these panels. */
const ANCHORS: { id: string; panel: number }[] = [
  { id: 'invitation', panel: 1 },
  { id: 'programme', panel: 2 },
];

/** Poster: no JS needed to pick it, so it is the first paint. Mobile sources match the `< 0.8` portrait rule. */
function Poster() {
  const { desktop, mobile } = HERO_FRAMES;
  // React 18 does not know `fetchPriority`; the lowercase attribute is passed through as-is.
  const priority = { fetchpriority: 'high' } as Record<string, string>;
  return (
    <picture className="hero-poster">
      <source media="(max-aspect-ratio: 799/1000)" type="image/avif" srcSet={posterUrl(mobile, 'avif')} />
      <source media="(max-aspect-ratio: 799/1000)" type="image/webp" srcSet={posterUrl(mobile, 'webp')} />
      <source type="image/avif" srcSet={posterUrl(desktop, 'avif')} />
      <img src={posterUrl(desktop, 'webp')} alt="" loading="eager" decoding="async" {...priority} />
    </picture>
  );
}

/* ---------- Panel content (shared by the scrubbed film and the reduced-motion page) ---------- */

function OpeningPanel({ ready, reduce }: { ready: boolean; reduce: boolean }) {
  const now = useNow();
  const cd = countdown(toMs(MUHURTHA.startDateTime!), now);
  const show = ready || reduce;
  const rise = (d: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 30, filter: 'blur(6px)' },
          animate: show ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {},
          transition: { duration: 1.4, delay: d, ease: [0.22, 1, 0.36, 1] as const },
        };
  return (
    <>
      <motion.p className="hero-kicker" {...rise(0.2)}>
        Shubha Vivaha
      </motion.p>
      <motion.p className="eyebrow" {...rise(0.35)}>
        Together with their families
      </motion.p>
      {/* Hand-lettered lock-up: first name on top, second set right and tucked under it, a brush swash beneath. */}
      <h1 className="hero-names" aria-label={`${COUPLE.groom.short} and ${COUPLE.bride.short}`}>
        <span className="hero-lock" aria-hidden="true">
          <motion.span className="hero-name hero-name-a" {...rise(0.55)}>
            {COUPLE.groom.short}
          </motion.span>
          <motion.span className="hero-amp italic" {...rise(0.8)}>
            &amp;
          </motion.span>
          <motion.span className="hero-name hero-name-b" {...rise(1.0)}>
            {COUPLE.bride.short}
          </motion.span>
          <motion.svg
            className="hero-swash"
            viewBox="0 0 400 48"
            preserveAspectRatio="none"
            initial={reduce ? false : { scaleX: 0, opacity: 0 }}
            animate={reduce || show ? { scaleX: 1, opacity: 1 } : undefined}
            transition={{ delay: 1.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ originX: 0 }}
          >
            <defs>
              <filter id="swash-rough" x="-5%" y="-40%" width="110%" height="180%">
                <feTurbulence type="fractalNoise" baseFrequency="0.9 0.06" numOctaves="2" seed="5" />
                <feDisplacementMap in="SourceGraphic" scale="6" />
              </filter>
            </defs>
            <path filter="url(#swash-rough)" d="M6 40 C 90 22, 230 10, 396 8 C 300 16, 180 26, 22 46 Z" />
          </motion.svg>
        </span>
      </h1>
      <motion.div className="hero-meta" {...rise(1.2)}>
        <span>{COUPLE.weddingDateLabel}</span>
        <span className="diamond" aria-hidden="true" />
        <span>Muhurtha 8:30 – 9:30 am</span>
      </motion.div>
      <motion.p className="hero-venue" {...rise(1.3)}>
        {VENUE.name} · Halebidu, Hassan
      </motion.p>
      <motion.div className="countdown" role="timer" aria-label="Time until the Muhurtha" {...rise(1.5)}>
        {cd.done ? (
          <p className="countdown-done">The Muhurtha has begun — with blessings.</p>
        ) : (
          (
            [
              ['Days', cd.days],
              ['Hours', cd.hours],
              ['Minutes', cd.minutes],
              ['Seconds', cd.seconds],
            ] as const
          ).map(([l, v]) => (
            <div key={l} className="cd-cell">
              <span className="cd-num">{String(v).padStart(2, '0')}</span>
              <span className="cd-label">{l}</span>
            </div>
          ))
        )}
      </motion.div>
      <motion.div className="hero-actions" {...rise(1.7)}>
        <a className="btn btn-iris" href="#rsvp">
          RSVP
        </a>
        <a className="btn btn-ghost" href={VENUE.directionsUrl} target="_blank" rel="noreferrer">
          Directions
        </a>
      </motion.div>
    </>
  );
}

function FamiliesPanel() {
  return (
    <>
      <h2 className="eyebrow">The invitation</h2>
      <p className="panel-text">You are invited to the wedding of</p>
      <p className="panel-name display">{COUPLE.groom.full}</p>
      <p className="panel-with display italic">and</p>
      <p className="panel-name display">{COUPLE.bride.full}</p>
      <p className="panel-small">With the blessings of both families</p>
    </>
  );
}

function ProgrammePanel() {
  const events = [...weddingEvents].sort((a, b) => a.order - b.order);
  const go = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToId('celebrations');
  };
  return (
    <>
      <h2 className="eyebrow">The celebrations</h2>
      <ol className="programme">
        {events.map((e) => (
          <li key={e.id} className={e.priority === 'critical' ? 'is-key' : undefined}>
            <span className="pg-when">
              {formatDateIso(e.date)} · {eventTimeText(e)}
            </span>
            <span className="pg-title display">{e.title}</span>
          </li>
        ))}
      </ol>
      <p className="panel-small">All at {VENUE.hall}.</p>
      <a className="panel-link" href="#celebrations" onClick={go}>
        Times, directions and calendar reminders
      </a>
    </>
  );
}

function VenuePanel() {
  return (
    <>
      <h2 className="eyebrow">The venue</h2>
      <p className="panel-name display">{VENUE.hall}</p>
      <p className="panel-text">{VENUE.address}</p>
      <p className="panel-small">With love, awaiting your arrival</p>
      <p className="panel-hosts display">{HOSTS.signature}</p>
      <div className="hero-actions">
        <a className="btn btn-iris" href={VENUE.directionsUrl} target="_blank" rel="noreferrer">
          Directions
        </a>
        <a className="btn btn-ghost" href="#rsvp">
          RSVP
        </a>
      </div>
    </>
  );
}

/* ---------- Scrubbed film ---------- */

/** Draws the nearest available frame for the smoothed scroll index, only when what would be drawn changes. */
function useCanvasScrub(canvasRef: React.RefObject<HTMLCanvasElement>, store: FrameStore | null, index: MotionValue<number>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !store) return;
    let raf = 0;
    let lastKey = '';
    let lastCenter = -1;

    const draw = () => {
      raf = 0;
      const target = Math.round(index.get());
      if (target !== lastCenter) {
        lastCenter = target;
        store.setCenter(target);
      }
      const s = store.source(target);
      if (!s) return; // Nothing decoded yet: the canvas stays transparent and the poster shows through.
      const key = `${s.index}:${s.bitmap ? 'b' : 'i'}:${canvas.width}x${canvas.height}`;
      if (key === lastKey) return;
      lastKey = key;
      const { sx, sy, sw, sh } = coverRect(s.src.width, s.src.height, canvas.width, canvas.height);
      ctx.drawImage(s.src, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      canvas.dataset.frame = String(s.index);
    };
    const request = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (w && h && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w; // Resizing clears the canvas, so the draw key includes the size.
        canvas.height = h;
        ctx.imageSmoothingQuality = 'high';
        request();
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const unsubIndex = index.on('change', request);
    const unsubStore = store.subscribe(request);
    request();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      unsubIndex();
      unsubStore();
    };
  }, [canvasRef, store, index]);
}

function Panel({ i, p, className, children, refs }: { i: number; p: MotionValue<number>; className: string; children: ReactNode; refs: React.MutableRefObject<(HTMLDivElement | null)[]> }) {
  const opacity = useTransform(p, (v) => panelOpacity(i, v));
  const y = useTransform(p, (v) => panelShift(i, v));
  return (
    <motion.div
      ref={(el) => {
        refs.current[i] = el;
      }}
      className={`hero-panel ${className}`}
      data-panel={PANELS[i].id}
      style={{ opacity, y }}
    >
      {children}
    </motion.div>
  );
}

function ScrubbedHero({ ready, store }: { ready: boolean; store: FrameStore | null }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const count = HERO_FRAMES.count;

  const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const rawIndex = useTransform(p, (v) => Math.min(1, Math.max(0, v)) * (count - 1));
  const index = useSpring(rawIndex, { stiffness: 120, damping: 30 });
  useCanvasScrub(canvasRef, store, index);

  // Only the panel being read can be clicked or focused; the others are inert.
  const setLive = (el: HTMLElement | null, live: boolean) => {
    if (!el) return;
    el.style.pointerEvents = live ? '' : 'none';
    if (live) el.removeAttribute('inert');
    else el.setAttribute('inert', '');
  };
  const syncInert = (v: number) => {
    const active = activePanel(v);
    panelRefs.current.forEach((el, i) => setLive(el, i === active));
  };
  useMotionValueEvent(p, 'change', syncInert);
  useEffect(() => syncInert(p.get()), []); // eslint-disable-line react-hooks/exhaustive-deps

  const titleShade = useTransform(p, (v) => panelOpacity(0, v));
  const readShade = useTransform(p, (v) => anyPanelOpacity(v, 1));
  const darken = useTransform(p, HANDOFF, [0, HANDOFF_DIM]);

  return (
    <section id="welcome" ref={sectionRef} className="hero-film dark" aria-label="Welcome">
      {ANCHORS.map((a) => (
        <span
          key={a.id}
          id={a.id}
          className="hero-anchor"
          style={{ '--at': panelAnchor(a.panel) } as React.CSSProperties}
          aria-hidden="true"
        />
      ))}
      <div className="hero-stage">
        <Poster />
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
        <motion.div className="hero-shade" style={{ opacity: titleShade }} aria-hidden="true" />
        <motion.div className="hero-shade-read" style={{ opacity: readShade }} aria-hidden="true" />
        <motion.div className="hero-darken" style={{ opacity: darken }} aria-hidden="true" />
        <Panel i={0} p={p} className="hero-content wrap" refs={panelRefs}>
          <OpeningPanel ready={ready} reduce={false} />
        </Panel>
        <Panel i={1} p={p} className="hero-read wrap" refs={panelRefs}>
          <FamiliesPanel />
        </Panel>
        <Panel i={2} p={p} className="hero-read wrap" refs={panelRefs}>
          <ProgrammePanel />
        </Panel>
        <Panel i={3} p={p} className="hero-read wrap" refs={panelRefs}>
          <VenuePanel />
        </Panel>
      </div>
    </section>
  );
}

/* ---------- Reduced motion: the same content, stacked in normal flow over the poster ---------- */

function StaticHero() {
  return (
    <section id="welcome" className="hero-film hero-static dark" aria-label="Welcome">
      <div className="hero-stage">
        <Poster />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content wrap">
          <OpeningPanel ready reduce />
        </div>
      </div>
      <div className="hero-static-more wrap">
        <div id="invitation" className="hero-read">
          <FamiliesPanel />
        </div>
        <div id="programme" className="hero-read">
          <ProgrammePanel />
        </div>
        <div className="hero-read">
          <VenuePanel />
        </div>
      </div>
    </section>
  );
}

/** Opening film: the invitation unfolds in four panels over scroll-scrubbed frames. Reduced motion gets the poster and a stacked page. */
export function HeroFilm({ ready, store }: { ready: boolean; store: FrameStore | null }) {
  const reduce = useReducedMotion();
  return reduce ? <StaticHero /> : <ScrubbedHero ready={ready} store={store} />;
}
