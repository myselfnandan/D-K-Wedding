import { Coffee, Phone } from 'lucide-react';
import { CategoryArt } from '../components/CategoryArt';
import { Photo } from '../components/Photo';
import { ImageReveal, Reveal } from '../components/Reveal';
import { foodNotes, namedPlaces, regionalDishes } from '../data/food';

/** On phones: photo, a two-column grid of dishes (name + one line), the feast note and one restaurant row. */
export function LocalFoodGuide() {
  return (
    <section id="food" className="section food dark" aria-labelledby="food-title">
      <div className="wrap">
        <div className="section-head">
          <Reveal><p className="eyebrow">Food & local experiences</p></Reveal>
          <Reveal delay={0.08}>
            <h2 id="food-title" className="display h-lg">
              Eat like <span className="italic">Malnad</span>
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lede">The flavours of Hassan and Chikkamagaluru, and the coffee country next door.</p>
          </Reveal>
        </div>

        <div className="food-grid">
          <ul className="dishes">
            {regionalDishes.map((d, i) => (
              <Reveal as="li" key={d.name} delay={i * 0.05} className="dish">
                <p className="display h-sm dish-name">{d.name}</p>
                <p className="muted dish-note">{d.note}</p>
                <p className="dish-short">{d.short}</p>
              </Reveal>
            ))}
          </ul>
          <aside className="food-side">
            <ImageReveal className="food-img">
              <Photo id="coffee" alt="Shade-grown coffee in Chikkamagaluru" sizes="(max-width: 860px) 100vw, 40vw" fallback={<CategoryArt category="food" seed={3} label="Coffee country" />} />
            </ImageReveal>
            <ul className="food-notes">
              {foodNotes.map((n) => (
                <li key={n}><Coffee size={16} aria-hidden="true" /> {n}</li>
              ))}
            </ul>
            {namedPlaces.map((p) => (
              <div key={p.name} className="food-place">
                <div className="food-place-text">
                  <p className="eyebrow">Near the Hoysaleswara temple</p>
                  <p className="display h-sm">{p.name}</p>
                  <p className="muted small food-place-more">{p.where}. {p.note}</p>
                </div>
                <a className="btn btn-ghost btn-sm" href={`tel:${p.phone}`}>
                  <Phone size={15} aria-hidden="true" /> {p.phoneDisplay}
                </a>
                <p className="tiny muted food-place-more">Source: {p.source}</p>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
