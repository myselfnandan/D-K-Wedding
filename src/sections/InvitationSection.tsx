import { CategoryArt } from '../components/CategoryArt';
import { Photo } from '../components/Photo';
import { ImageReveal, Reveal } from '../components/Reveal';
import { COUPLE, HOSTS, INVOCATIONS, PANCHANGA } from '../data/guestInfo';
import './sections.css';

export function InvitationSection() {
  return (
    <section id="invitation" className="section invitation" aria-labelledby="invitation-title">
      <div className="wrap invitation-grid">
        <div className="invitation-copy">
          <Reveal>
            <ul className="invocations kn" lang="kn" aria-label="Invocations">
              {INVOCATIONS.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">The invitation</p>
          </Reveal>
          <Reveal delay={0.15}>
            <h2 id="invitation-title" className="display h-lg">
              Two families, <span className="italic">one blessing</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="lede">
              With the blessings of our elders, <strong>{COUPLE.groom.parents}</strong> of {COUPLE.groom.home} request
              your gracious presence at the wedding of their {COUPLE.groom.relation}
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="name-pair">
              <div>
                <p className="display h-md">{COUPLE.groom.full}</p>
                <p className="kn muted" lang="kn">
                  {COUPLE.groom.kn}
                </p>
              </div>
              <span className="name-with italic display" aria-hidden="true">
                with
              </span>
              <div>
                <p className="display h-md">{COUPLE.bride.full}</p>
                <p className="kn muted" lang="kn">
                  {COUPLE.bride.kn}
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="lede">
              {COUPLE.bride.relation.charAt(0).toUpperCase() + COUPLE.bride.relation.slice(1)} of{' '}
              <strong>{COUPLE.bride.parents}</strong>, {COUPLE.bride.home}. Come, bless the couple, and stay a while —
              the wedding is in the heart of Hoysala country.
            </p>
          </Reveal>
          <Reveal delay={0.35}>
            <p className="panchanga small muted">{PANCHANGA} · Lagna: Dhanu</p>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="welcome-by">
              <p className="small muted">With love, awaiting your arrival</p>
              <p className="display h-sm">{HOSTS.awaiting.join(' · ')}</p>
              <p className="small muted">
                {HOSTS.welcome} · <span className="kn" lang="kn">{HOSTS.welcomeKn}</span>
              </p>
            </div>
          </Reveal>
        </div>

        <div className="invitation-art" aria-hidden="false">
          <ImageReveal className="inv-img inv-img-a">
            <Photo
              id="hoysaleswara-carving"
              alt="Carved reliefs on the walls of the Hoysaleswara temple"
              sizes="(max-width: 860px) 70vw, 30vw"
              fallback={<CategoryArt category="heritage" seed={1} label="Hoysaleswara" />}
            />
          </ImageReveal>
          <ImageReveal className="inv-img inv-img-b" from="left">
            <Photo
              id="belur"
              alt="The Chennakeshava temple at Belur"
              sizes="(max-width: 860px) 55vw, 22vw"
              fallback={<CategoryArt category="temples" seed={2} label="Belur" />}
            />
          </ImageReveal>
          <div className="inv-seal display" aria-hidden="true">
            <span>3</span>
            <small>Dec 2026</small>
          </div>
        </div>
      </div>
    </section>
  );
}
