import { AnimatePresence, motion, type MotionValue, useMotionValueEvent } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ART, Speed } from './CeremonyArt';
import { weddingEvents } from '../data/weddingEvents';

/** The entrance holds for 2 s while the loader steps through the five ceremonies, then the doors open once the film is ready. */
const MIN_MS = 2000;
/** Hard cap: open the doors after this long even if the film's keyframes are still loading. */
const MAX_MS = 2600;
const EASE = [0.22, 1, 0.36, 1] as const;
/** The five ceremony illustrations, in order. Shown without names. */
const STEPS = [...weddingEvents].sort((a, b) => a.order - b.order).map((e) => e.id);
const STEP_MS = MIN_MS / STEPS.length;
/** The illustrations are drawn for ~2.5 s on the cards; here each has STEP_MS (0.4 s), so play them much faster. */
const LOADER_SPEED = 0.14;

/** Centred loader: one ceremony illustration at a time inside a ring that fills over the 2 seconds. */
function CeremonyLoader() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS);
    return () => clearInterval(t);
  }, []);
  const id = STEPS[step];
  const Illustration = ART[id];
  return (
    <div className="entry-loader" aria-hidden="true">
      <svg className="entry-ring" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="47" className="entry-ring-track" />
        <motion.circle
          cx="50"
          cy="50"
          r="47"
          className="entry-ring-fill"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: MIN_MS / 1000, ease: 'linear' }}
        />
      </svg>
      <div className="entry-loader-art">
        <AnimatePresence initial={false}>
          <motion.div
            key={id}
            className="entry-loader-slide"
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <Speed.Provider value={LOADER_SPEED}>{Illustration && <Illustration play prefix={`entry-${id}-`} fit="tile" />}</Speed.Provider>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Entrance: a static D & K monogram, a short line, a centred loader of the five ceremony illustrations, and two
 * stone doors that open onto the film. Waits for the film's keyframes (or the cap). Never locks scrolling.
 * Skipped for reduced motion.
 */
export function Preloader({ onDone, skip, progress }: { onDone: () => void; skip: boolean; progress: MotionValue<number> }) {
  const [open, setOpen] = useState(!skip);
  const state = useRef({ done: false, minPassed: false, loaded: progress.get() >= 1 });

  const finish = () => {
    if (state.current.done) return;
    state.current.done = true;
    setOpen(false);
    onDone();
  };
  const maybeFinish = () => {
    if (state.current.minPassed && state.current.loaded) finish();
  };

  useMotionValueEvent(progress, 'change', (v) => {
    if (v >= 1) {
      state.current.loaded = true;
      maybeFinish();
    }
  });

  useEffect(() => {
    if (skip) {
      state.current.done = true;
      onDone();
      return;
    }
    const tMin = setTimeout(() => {
      state.current.minPassed = true;
      maybeFinish();
    }, MIN_MS);
    const tMax = setTimeout(finish, MAX_MS);
    return () => {
      clearTimeout(tMin);
      clearTimeout(tMax);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="preloader" role="status" aria-live="polite" exit={{ opacity: 1, transition: { duration: 1.1 } }}>
          {/* Stone doors: they part to the left and right to reveal the opening film. */}
          <motion.div className="door door-l" aria-hidden="true" exit={{ x: '-101%', transition: { duration: 1.05, ease: EASE, delay: 0.1 } }} />
          <motion.div className="door door-r" aria-hidden="true" exit={{ x: '101%', transition: { duration: 1.05, ease: EASE, delay: 0.1 } }} />

          <motion.div className="entry" exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.35 } }}>
            {/* Static monogram and lines (no animation). */}
            <p className="entry-mono" aria-hidden="true">
              <span className="entry-d">D</span>
              <span className="entry-amp">&amp;</span>
              <span className="entry-k">K</span>
            </p>
            <p className="entry-tag">Not your average wedding</p>
            <p className="entry-sub">Don’t just visit. Live it, and explore at your own pace.</p>
            <CeremonyLoader />
            <span className="sr-only">Loading the invitation of Dileep and Kavya</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
