import { useMotionValue } from 'motion/react';
import { Reveal } from '../components/Reveal';
import { Scene } from '../components/scene/Scene';
import { COUPLE, HOSTS } from '../data/guestInfo';

export function Closing() {
  const morning = useMotionValue(0.92);
  return (
    <section id="closing" className="closing" aria-labelledby="closing-title">
      <div className="wrap closing-copy">
        <Reveal>
          <p className="closing-kicker">Awaiting your arrival</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 id="closing-title" className="display h-xl">
            {COUPLE.groom.short} <span className="italic">&amp;</span> {COUPLE.bride.short}
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="small closing-hosts">With love from {HOSTS.signature.toLowerCase()}</p>
        </Reveal>
      </div>
      <div className="closing-scene" aria-hidden="true">
        <Scene progress={morning} className="scene-svg" />
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer dark">
      <div className="wrap footer-inner">
        <p className="display h-sm">D · K · 03.12.2026</p>
        <p className="eyebrow">A few notes for our guests</p>
        <ul className="footer-notes">
          <li>Please be seated a little before 8:30 am for the Muhurtha.</li>
          <li>December mornings in the hills can be cool; carry a light layer.</li>
          <li>
            Kindly <a href="#rsvp">RSVP on WhatsApp</a> so the family can plan for you.
          </li>
        </ul>
      </div>
    </footer>
  );
}
