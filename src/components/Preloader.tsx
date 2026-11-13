import { AnimatePresence, motion, type MotionValue, useMotionValueEvent } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

/** Hard cap: reveal the page after this long even if keyframes are still loading. */
const MAX_MS = 1800;

/**
 * Curtain showing the real share of hero keyframes decoded. Reveals at 100% or after 1.8 s, whichever is first.
 * It is a fixed overlay only: it never locks scrolling. Skipped for reduced motion.
 */
export function Preloader({ onDone, skip, progress }: { onDone: () => void; skip: boolean; progress: MotionValue<number> }) {
  const [pct, setPct] = useState(() => Math.round(progress.get() * 100));
  const [open, setOpen] = useState(!skip);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    setTimeout(() => {
      setOpen(false);
      onDone();
    }, 220);
  };

  useMotionValueEvent(progress, 'change', (v) => {
    if (done.current) return;
    setPct(Math.round(v * 100));
    if (v >= 1) finish();
  });

  useEffect(() => {
    if (skip) {
      done.current = true;
      onDone();
      return;
    }
    if (progress.get() >= 1) finish();
    const t = setTimeout(finish, MAX_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="preloader"
          role="status"
          aria-live="polite"
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
        >
          <p className="preloader-title">HALEBIDU</p>
          <span className="preloader-line" style={{ transform: `scaleX(${pct / 100})` }} />
          <p className="preloader-pct">{pct}</p>
          <span className="sr-only">Loading the invitation</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
