import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type ReactNode, useRef } from 'react';
import './stepper.css';

/**
 * One option at a time with back / forward buttons and an "n of N" count.
 * Used on phones, where a side-scrolling strip hides the options off-screen.
 * Wraps from the last option to the first (and back), and takes the left / right arrow keys.
 */
export function Stepper({
  index,
  count,
  onChange,
  label,
  noun,
  className = '',
  children,
}: {
  index: number;
  count: number;
  onChange: (i: number) => void;
  /** Accessible name of the control, e.g. "Choose a place". */
  label: string;
  /** What is being counted, e.g. "place". */
  noun: string;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const dir = useRef(1);
  const go = (d: number) => {
    dir.current = d;
    onChange((index + d + count) % count);
  };
  return (
    <div
      className={`pick ${className}`}
      role="group"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') go(-1);
        if (e.key === 'ArrowRight') go(1);
      }}
    >
      <button type="button" className="pick-btn" aria-label={`Previous ${noun}`} onClick={() => go(-1)}>
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <div className="pick-current" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={index}
            className="pick-item"
            initial={reduce ? false : { opacity: 0, x: 24 * dir.current }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -24 * dir.current }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <span className="pick-count">
          {index + 1} of {count}
        </span>
      </div>
      <button type="button" className="pick-btn" aria-label={`Next ${noun}`} onClick={() => go(1)}>
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
