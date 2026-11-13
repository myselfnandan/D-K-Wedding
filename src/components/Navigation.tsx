import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export const NAV_ITEMS = [
  { id: 'invitation', label: 'Invitation' },
  { id: 'celebrations', label: 'Celebrations' },
  { id: 'explore', label: 'Explore' },
  { id: 'travel', label: 'Travel' },
  { id: 'info', label: 'Guest info' },
];

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', `#${id}`);
}

export function Navigation() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string>('');
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    NAV_ITEMS.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollToId(id);
  };

  return (
    <>
      <motion.div className="progress-bar" style={{ scaleX: bar }} aria-hidden="true" />
      <nav className={`floating-nav ${visible ? 'is-visible' : ''}`} aria-label="Sections">
        <a href="#welcome" className="nav-mark" onClick={go('welcome')} aria-label="Back to top">
          D <span>·</span> K
        </a>
        <ul className="nav-links">
          {NAV_ITEMS.map((n) => (
            <li key={n.id}>
              <a href={`#${n.id}`} onClick={go(n.id)} aria-current={active === n.id ? 'true' : undefined}>
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#rsvp" className="btn btn-primary btn-sm nav-rsvp" onClick={go('rsvp')}>
          RSVP
        </a>
        <button className="nav-burger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          <Menu size={20} aria-hidden="true" />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="menu-sheet dark"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: 'circle(0% at 92% 6%)' }}
            animate={{ clipPath: 'circle(150% at 92% 6%)' }}
            exit={{ clipPath: 'circle(0% at 92% 6%)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <button className="menu-close" aria-label="Close menu" onClick={() => setOpen(false)} autoFocus>
              <X size={22} aria-hidden="true" />
            </button>
            <ul>
              {[...NAV_ITEMS, { id: 'rsvp', label: 'RSVP' }].map((n, i) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                >
                  <a href={`#${n.id}`} onClick={go(n.id)} className="display">
                    {n.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <p className="menu-foot">
              Dileep · Kavya · 03-12-2026
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
