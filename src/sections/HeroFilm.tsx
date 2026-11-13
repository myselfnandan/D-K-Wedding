import { motion, type MotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import { COUPLE, VENUE } from '../data/guestInfo';
import { MUHURTHA } from '../data/weddingEvents';
import { type FrameStore, HERO_FRAMES } from '../hooks/useFrameSequence';
import { useNow } from '../hooks/useNow';
import { coverRect, posterUrl } from '../utils/frameSequence';
import { countdown, toMs } from '../utils/timeCalculations';
import './hero.css';

const CAPTIONS = ['Halebidu · the old Hoysala capital', 'Thursday, 3 December 2026', 'Step inside — you’re invited'];
/** Each caption owns a third of 0.45–0.9 and fades in and out within it, so two never overlap. */
const CAPTION_WINDOWS: [number, number][] = [
  [0.45, 0.6],
  [0.6, 0.75],
  [0.75, 0.9],
];
const MAX_DPR = 2;

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

function TitleBlock({ ready, reduce }: { ready: boolean; reduce: boolean }) {
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
      <h1 className="hero-names display">
        <motion.span className="hero-name" {...rise(0.55)}>
          {COUPLE.groom.short}
        </motion.span>
        <motion.span className="hero-amp italic" {...rise(0.8)} aria-label="and">
          &amp;
        </motion.span>
        <motion.span className="hero-name" {...rise(1.0)}>
          {COUPLE.bride.short}
        </motion.span>
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

function Caption({ text, win, p }: { text: string; win: [number, number]; p: MotionValue<number> }) {
  const [a, b] = win;
  const ramp = 0.03;
  const opacity = useTransform(p, [a, a + ramp, b - ramp, b], [0, 1, 1, 0]);
  const y = useTransform(p, [a, a + ramp, b - ramp, b], [24, 0, 0, -24]);
  return (
    <motion.p className="hero-caption display" style={{ opacity, y }} aria-hidden="true">
      {text}
    </motion.p>
  );
}

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

function ScrubbedHero({ ready, store }: { ready: boolean; store: FrameStore | null }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const count = HERO_FRAMES.count;

  const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const rawIndex = useTransform(p, (v) => Math.min(1, Math.max(0, v)) * (count - 1));
  const index = useSpring(rawIndex, { stiffness: 120, damping: 30 });
  useCanvasScrub(canvasRef, store, index);

  const titleOpacity = useTransform(p, [0, 0.15, 0.45], [1, 1, 0]);
  const titleY = useTransform(p, [0.15, 0.45], [0, -80]);
  // Hidden buttons must not catch clicks or focus.
  useMotionValueEvent(titleOpacity, 'change', (o) => {
    const el = titleRef.current;
    if (!el) return;
    const hidden = o < 0.5;
    el.style.pointerEvents = hidden ? 'none' : '';
    if (hidden) el.setAttribute('inert', '');
    else el.removeAttribute('inert');
  });
  const cueOpacity = useTransform(p, [0, 0.08], [1, 0]);
  const darken = useTransform(p, [0.9, 1], [0, 1]);
  const dissolve = useTransform(p, [0.95, 1], [0, 1]);

  return (
    <section id="welcome" ref={sectionRef} className="hero-film dark" aria-label="Welcome">
      <div className="hero-stage">
        <Poster />
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
        <div className="hero-shade-base" aria-hidden="true" />
        <motion.div className="hero-shade" style={{ opacity: titleOpacity }} aria-hidden="true" />
        {CAPTIONS.map((t, i) => (
          <Caption key={t} text={t} win={CAPTION_WINDOWS[i]} p={p} />
        ))}
        <motion.div className="hero-darken" style={{ opacity: darken }} aria-hidden="true" />
        <motion.div className="hero-dissolve" style={{ opacity: dissolve }} aria-hidden="true" />
        <motion.div ref={titleRef} className="hero-content wrap" style={{ opacity: titleOpacity, y: titleY }}>
          <TitleBlock ready={ready} reduce={false} />
        </motion.div>
        <motion.a className="scroll-cue" href="#invitation" aria-label="Scroll to the invitation" style={{ opacity: cueOpacity }}>
          <span>Scroll to unfold</span>
          <span className="scroll-line" aria-hidden="true" />
        </motion.a>
      </div>
    </section>
  );
}

function StaticHero() {
  return (
    <section id="welcome" className="hero-film hero-static dark" aria-label="Welcome">
      <div className="hero-stage">
        <Poster />
        <div className="hero-shade" aria-hidden="true" />
        <div className="hero-content wrap">
          <TitleBlock ready reduce />
        </div>
      </div>
    </section>
  );
}

/** Opening film: frames scrubbed by scroll on a sticky canvas. Reduced motion gets the poster frame only. */
export function HeroFilm({ ready, store }: { ready: boolean; store: FrameStore | null }) {
  const reduce = useReducedMotion();
  return reduce ? <StaticHero /> : <ScrubbedHero ready={ready} store={store} />;
}
