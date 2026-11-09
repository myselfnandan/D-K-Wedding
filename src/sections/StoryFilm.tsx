import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';
import { useRef, useState } from 'react';
import { Photo } from '../components/Photo';
import { imageSources } from '../data/images';
import { Scene } from '../components/scene/Scene';
import { scrollToId } from '../components/Navigation';
import './story.css';

interface Chapter {
  n: string;
  kicker: string;
  title: string;
  kn?: string;
  body: string;
  photo?: string;
  photoAlt?: string;
  cta?: { label: string; target: string };
}

const CHAPTERS: Chapter[] = [
  {
    n: '01',
    kicker: 'The journey begins',
    title: 'Every road leads to Halebidu',
    body: 'From Bengaluru, Mysuru, Chikkamagaluru, Hassan and Mangaluru, our families travel into the old Hoysala heartland.',
  },
  {
    n: '02',
    kicker: 'The old capital',
    title: 'Where stone learned to dance',
    body: 'Halebidu was the Hoysala capital. Its temples, with Belur’s, are part of the UNESCO World Heritage “Sacred Ensembles of the Hoysalas”.',
    photo: 'hero',
    photoAlt: 'The Hoysaleswara temple at Halebidu',
  },
  {
    n: '03',
    kicker: 'The venue',
    title: 'Pushpagiri, on the hill',
    kn: 'ಶ್ರೀ ಪುಷ್ಪಗಿರಿ ಮಹಾಸಂಸ್ಥಾನ',
    body: 'We marry at the Sri Pushpagiri Mahasamsthana Kalyana Mantapa — about seven minutes’ drive from the Hoysaleswara temple.',
    photo: 'hoysaleswara',
    photoAlt: 'The Hoysaleswara temple',
  },
  {
    n: '04',
    kicker: 'Tuesday · 1 December',
    title: 'Devatha Karya',
    kn: 'ದೇವತಾಕಾರ್ಯ',
    body: 'The celebrations open at the groom’s home with prayers to the family deities.',
  },
  {
    n: '05',
    kicker: 'Thursday · 3 December · 8:30 am',
    title: 'The Muhurtha',
    kn: 'ಮುಹೂರ್ತ · ಧನು ಲಗ್ನ',
    body: 'In Dhanu lagna, as the morning light comes up over the hills, two families become one.',
    photo: 'makara',
    photoAlt: 'A carved makara on the Hoysaleswara temple',
  },
  {
    n: '06',
    kicker: 'From 11:30 am',
    title: 'Aaratakshate & Bhojana',
    kn: 'ಆರತಕ್ಷತೆ · ಭೋಜನ',
    body: 'Bless the couple at the reception, then sit down to the wedding feast from 12:30. Afterwards, the destination is yours.',
    cta: { label: 'Plan your free time', target: 'explore' },
  },
];

function ChapterText({ c, i, p, total }: { c: Chapter; i: number; p: MotionValue<number>; total: number }) {
  const a = i / total;
  const b = (i + 1) / total;
  const pad = 0.2 / total;
  const first = i === 0;
  const last = i === total - 1;
  // Out fully before the next chapter fades in — no overlapping text.
  const opacity = useTransform(p, [a, a + pad, b - pad, b], [first ? 1 : 0, 1, 1, last ? 1 : 0]);
  const y = useTransform(p, [a, a + pad, b - pad, b], [first ? 0 : 36, 0, 0, last ? 0 : -36]);
  const pe = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  return (
    <motion.article className="chapter" style={{ opacity, y, pointerEvents: pe }} aria-label={`Chapter ${c.n}: ${c.title}`}>
      <p className="chapter-n display">{c.n}</p>
      <p className="eyebrow">{c.kicker}</p>
      <h3 className="display h-lg">{c.title}</h3>
      {c.kn && (
        <p className="kn chapter-kn" lang="kn">
          {c.kn}
        </p>
      )}
      <p className="chapter-body">{c.body}</p>
      {c.cta && (
        <button className="btn btn-iris" onClick={() => scrollToId(c.cta!.target)}>
          {c.cta.label}
        </button>
      )}
    </motion.article>
  );
}

function ChapterPhoto({ c, i, p, total }: { c: Chapter; i: number; p: MotionValue<number>; total: number }) {
  const a = i / total;
  const b = (i + 1) / total;
  const pad = 0.3 / total;
  const opacity = useTransform(p, [a - pad, a + pad, b - pad, b + pad], [0, 1, 1, 0]);
  const scale = useTransform(p, [a, b], [1.12, 1]);
  if (!c.photo || !imageSources(c.photo)) return null;
  return (
    <motion.div className="arch-photo" style={{ opacity }} aria-hidden="true">
      <motion.div style={{ scale, width: '100%', height: '100%' }}>
        <Photo id={c.photo} alt={c.photoAlt ?? ''} sizes="(max-width: 760px) 60vw, 28vw" fallback={null} />
      </motion.div>
    </motion.div>
  );
}

export function StoryFilm() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });
  const [active, setActive] = useState(0);
  const total = CHAPTERS.length;
  useMotionValueEvent(scrollYProgress, 'change', (v) => setActive(Math.min(total - 1, Math.floor(v * total))));

  const staticP = useMotionValue(0.72);

  const jump = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + range * ((i + 0.5) / total), behavior: 'smooth' });
  };

  if (reduce) {
    return (
      <section id="story" className="story-static dark" aria-labelledby="story-title">
        <div className="story-static-scene">
          <Scene progress={staticP} className="scene-svg" />
        </div>
        <div className="wrap story-static-list">
          <h2 id="story-title" className="eyebrow">
            Our story, in six chapters
          </h2>
          {CHAPTERS.map((c) => (
            <article key={c.n} className="chapter static">
              <p className="chapter-n display">{c.n}</p>
              <p className="eyebrow">{c.kicker}</p>
              <h3 className="display h-md">{c.title}</h3>
              {c.kn && <p className="kn chapter-kn" lang="kn">{c.kn}</p>}
              <p className="chapter-body">{c.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="story" ref={ref} className="story dark" style={{ height: `${total * 100}svh` }} aria-labelledby="story-title">
      <div className="story-sticky">
        <Scene progress={p} dolly className="scene-svg story-scene" />
        <div className="story-shade" aria-hidden="true" />
        <h2 id="story-title" className="sr-only">
          Our story, in six chapters
        </h2>
        <div className="arch-frame" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <ChapterPhoto key={c.n} c={c} i={i} p={p} total={total} />
          ))}
        </div>
        <div className="wrap chapters">
          {CHAPTERS.map((c, i) => (
            <ChapterText key={c.n} c={c} i={i} p={p} total={total} />
          ))}
        </div>
        <nav className="chapter-rail" aria-label="Story chapters">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.n}
              onClick={() => jump(i)}
              aria-current={active === i ? 'step' : undefined}
              aria-label={`Chapter ${c.n}: ${c.title}`}
            >
              <span className="rail-n">{c.n}</span>
              <span className="rail-dot" aria-hidden="true" />
            </button>
          ))}
        </nav>
        <p className="story-hint" aria-hidden="true">
          {active < total - 1 ? 'Keep scrolling' : 'Continue to the celebrations'}
        </p>
      </div>
    </section>
  );
}
