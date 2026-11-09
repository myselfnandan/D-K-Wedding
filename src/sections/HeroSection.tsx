import { animate, motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import { Scene } from '../components/scene/Scene';
import { COUPLE, VENUE } from '../data/guestInfo';
import { MUHURTHA } from '../data/weddingEvents';
import { useNow } from '../hooks/useNow';
import { countdown, toMs } from '../utils/timeCalculations';
import './hero.css';

export function HeroSection({ ready }: { ready: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const progress = useMotionValue(reduce ? 0.3 : 0.04);
  const px = useSpring(useMotionValue(0), { stiffness: 40, damping: 18 });
  const py = useSpring(useMotionValue(0), { stiffness: 40, damping: 18 });

  // Cinematic opening: the moon drifts as the scene settles into twilight.
  useEffect(() => {
    if (!ready || reduce) return;
    const c = animate(progress, 0.3, { duration: 4.2, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [ready, reduce, progress]);

  useEffect(() => {
    if (reduce) return;
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (!fine) return;
    const onMove = (e: PointerEvent) => {
      px.set((e.clientX / window.innerWidth) * 2 - 1);
      py.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce, px, py]);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const contentO = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12]);

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
    <header id="welcome" ref={ref} className="hero dark" aria-label="Welcome">
      <motion.div className="hero-scene" style={{ scale: sceneScale }}>
        <Scene progress={progress} px={px} py={py} className="scene-svg" />
        <div className="hero-vignette" />
      </motion.div>

      <motion.div className="hero-content wrap" style={{ y: contentY, opacity: contentO }}>
        <motion.p className="hero-kicker kn" lang="kn" {...rise(0.2)}>
          ಶುಭ ವಿವಾಹ
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
        <motion.p className="hero-names-kn kn" lang="kn" {...rise(1.2)}>
          {COUPLE.groom.shortKn} · {COUPLE.bride.shortKn}
        </motion.p>
        <motion.div className="hero-meta" {...rise(1.4)}>
          <span>{COUPLE.weddingDateLabel}</span>
          <span className="diamond" aria-hidden="true" />
          <span>Muhurtha 8:30 – 9:30 am</span>
        </motion.div>
        <motion.p className="hero-venue" {...rise(1.5)}>
          {VENUE.name} · Halebidu, Hassan
        </motion.p>

        <motion.div className="countdown" role="timer" aria-label="Time until the Muhurtha" {...rise(1.7)}>
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

        <motion.div className="hero-actions" {...rise(1.9)}>
          <a className="btn btn-iris" href="#rsvp">
            RSVP
          </a>
          <a className="btn btn-ghost" href={VENUE.directionsUrl} target="_blank" rel="noreferrer">
            Directions
          </a>
        </motion.div>
      </motion.div>

      <a className="scroll-cue" href="#invitation" aria-label="Scroll to the invitation">
        <span>Scroll to unfold</span>
        <span className="scroll-line" aria-hidden="true" />
      </a>
    </header>
  );
}
