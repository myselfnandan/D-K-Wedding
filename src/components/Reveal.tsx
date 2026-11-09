import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

/** Fade-and-rise on entering the viewport (Intersection Observer via whileInView). */
export function Reveal({ children, delay = 0, y = 28, className, as = 'div' }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'li' | 'article' }) {
  const reduce = useReducedMotion();
  const C = motion[as];
  if (reduce) return <C className={className}>{children}</C>;
  return (
    <C
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </C>
  );
}

/** Clip-path wipe for images. */
export function ImageReveal({ children, className, from = 'bottom' }: { children: ReactNode; className?: string; from?: 'bottom' | 'left' }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const hidden = from === 'bottom' ? 'inset(100% 0 0 0)' : 'inset(0 100% 0 0)';
  return (
    <motion.div
      className={className}
      initial={{ clipPath: hidden }}
      whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        style={{ width: '100%', height: '100%' }}
        initial={{ scale: 1.15 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
