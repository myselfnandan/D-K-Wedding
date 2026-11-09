import { useMotionValue } from 'motion/react';
import { Reveal } from '../components/Reveal';
import { Scene } from '../components/scene/Scene';
import { COUPLE, HOSTS } from '../data/guestInfo';
import { imageCredits, imageSources } from '../data/images';

export function Closing() {
  const morning = useMotionValue(0.92);
  return (
    <section id="closing" className="closing" aria-labelledby="closing-title">
      <div className="closing-scene" aria-hidden="true">
        <Scene progress={morning} className="scene-svg" />
      </div>
      <div className="wrap closing-copy">
        <Reveal>
          <p className="kn closing-kn" lang="kn">ತಮ್ಮ ಆಗಮನಾಭಿಲಾಷಿಗಳು</p>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 id="closing-title" className="display h-xl">
            Don’t just attend. <span className="italic">Arrive.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="lede closing-lede">
            Come for the Muhurtha, stay for the stone and the hills. Bless us, wander temples carved eight centuries ago, drink the coffee, and
            take home more than a wedding memory.
          </p>
        </Reveal>
        <Reveal delay={0.3}>
          <p className="display h-md">
            {COUPLE.groom.short} <span className="italic">&amp;</span> {COUPLE.bride.short}
          </p>
          <p className="small closing-hosts">With love from {HOSTS.welcome.replace(/^The /, 'the ')}</p>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  const used = imageCredits.filter((c) => imageSources(c.id));
  return (
    <footer className="footer dark">
      <div className="wrap footer-inner">
        <p className="display h-sm">D · K · 03.12.2026</p>
        <p className="small muted">
          Event details from the family’s invitation. Distances and drive times from Google Maps (checked 9 Nov 2026). Opening hours marked
          unverified come from third-party listings.
        </p>
        {used.length > 0 && (
          <details className="credits">
            <summary>Photo credits</summary>
            <ul>
              {used.map((c) => (
                <li key={c.id}>
                  <a href={c.pageUrl} target="_blank" rel="noreferrer">{c.file.replace(/\.[^.]+$/, '')}</a> — {c.author},{' '}
                  <a href={c.licenseUrl} target="_blank" rel="noreferrer">{c.license}</a>, via Wikimedia Commons
                </li>
              ))}
            </ul>
          </details>
        )}
        <p className="small muted">Illustrations drawn for this invitation.</p>
      </div>
    </footer>
  );
}
