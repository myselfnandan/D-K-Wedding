import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

/** Short curtain (≤ 1.6 s) while fonts load. Never blocks scrolling once dismissed; skipped for reduced motion. */
export function Preloader({ onDone, skip }: { onDone: () => void; skip: boolean }) {
  const [pct, setPct] = useState(0);
  const [open, setOpen] = useState(!skip);

  useEffect(() => {
    if (skip) {
      onDone();
      return;
    }
    let raf = 0;
    const start = performance.now();
    let fontsReady = false;
    document.fonts?.ready.then(() => (fontsReady = true));
    const tick = (t: number) => {
      const elapsed = t - start;
      const target = fontsReady ? 100 : Math.min(90, (elapsed / 1200) * 90);
      setPct((p) => Math.min(100, Math.max(p, Math.round(p + (target - p) * 0.18))));
      if ((fontsReady && elapsed > 700) || elapsed > 1600) {
        setPct(100);
        setTimeout(() => {
          setOpen(false);
          onDone();
        }, 220);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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
