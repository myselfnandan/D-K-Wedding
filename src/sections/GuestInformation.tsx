import { AnimatePresence, motion } from 'motion/react';
import { BedDouble, Check, MapPin, MessageCircle, Phone, Shirt } from 'lucide-react';
import { useState } from 'react';
import { Reveal } from '../components/Reveal';
import { CONTACTS, PENDING, PUBLIC_STAY_OPTIONS, VENUE } from '../data/guestInfo';

export function GuestInformation() {
  return (
    <section id="info" className="section info" aria-labelledby="info-title">
      <div className="wrap">
        <div className="section-head">
          <Reveal><p className="eyebrow">Guest information</p></Reveal>
          <Reveal delay={0.08}>
            <h2 id="info-title" className="display h-lg">Good to know</h2>
          </Reveal>
        </div>
        <div className="info-grid">
          <Reveal className="card info-card">
            <MapPin size={20} aria-hidden="true" />
            <h3 className="display h-sm">Venue</h3>
            <p><strong>{VENUE.hall}</strong></p>
            <p className="muted">{VENUE.address}</p>
            <a className="btn btn-primary btn-sm" href={VENUE.directionsUrl} target="_blank" rel="noreferrer">Navigate to the venue</a>
          </Reveal>
          <Reveal className="card info-card" delay={0.05}>
            <Phone size={20} aria-hidden="true" />
            <h3 className="display h-sm">Contact the family</h3>
            <p className="muted">For anything on the day — directions, timings, help.</p>
            <div className="info-actions">
              <a className="btn btn-primary btn-sm" href={`tel:${CONTACTS.family.phone}`}>
                <Phone size={15} aria-hidden="true" /> {CONTACTS.family.display}
              </a>
              <a className="btn btn-ghost btn-sm" href={`https://wa.me/${CONTACTS.rsvpWhatsApp.phone}`} target="_blank" rel="noreferrer">
                <MessageCircle size={15} aria-hidden="true" /> WhatsApp {CONTACTS.rsvpWhatsApp.display}
              </a>
            </div>
          </Reveal>
          <Reveal className="card info-card" delay={0.1}>
            <BedDouble size={20} aria-hidden="true" />
            <h3 className="display h-sm">Accommodation</h3>
            <p className="muted">{PENDING.accommodation ?? 'Details from the family will be shared here. Please check with them before booking.'}</p>
            {PUBLIC_STAY_OPTIONS.map((o) => (
              <div key={o.name} className="stay-opt">
                <p className="small"><strong>{o.name}</strong> — a public option, not arranged by the family.</p>
                <p className="small muted">{o.note}</p>
                <div className="info-actions">
                  <a className="btn btn-ghost btn-sm" href={o.url} target="_blank" rel="noreferrer">Official site</a>
                  <a className="btn btn-ghost btn-sm" href={`tel:${o.phone}`}>{o.phoneDisplay}</a>
                </div>
              </div>
            ))}
          </Reveal>
          <Reveal className="card info-card" delay={0.15}>
            <Shirt size={20} aria-hidden="true" />
            <h3 className="display h-sm">Dress code & notes</h3>
            <p className="muted">{PENDING.dressCode ?? 'No dress code has been specified.'}</p>
            <ul className="info-list">
              <li>The Muhurtha is at 8:30 am on Thursday — plan to be seated a little before.</li>
              <li>Belur’s Chennakeshava is a working temple; dress for worship if you visit.</li>
              <li>December mornings in the hills can be cool — carry a light layer.</li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function RSVPSection() {
  const [name, setName] = useState('');
  const [count, setCount] = useState(2);
  const [attending, setAttending] = useState<'yes' | 'no' | ''>('');
  const [arrival, setArrival] = useState('Wed 2 Dec');
  const [from, setFrom] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const message = () => {
    const lines = [
      `RSVP — Dileep & Kavya, 3 Dec 2026`,
      `Name: ${name.trim()}`,
      attending === 'yes' ? `Attending: Yes, ${count} ${count === 1 ? 'guest' : 'guests'}` : 'Attending: Sorry, cannot make it',
    ];
    if (attending === 'yes') {
      lines.push(`Arriving: ${arrival}`);
      if (from.trim()) lines.push(`Travelling from: ${from.trim()}`);
    }
    if (note.trim()) lines.push(`Note: ${note.trim()}`);
    return lines.join('\n');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please add your name.');
    if (!attending) return setError('Please tell us whether you can attend.');
    setError('');
    const url = `https://wa.me/${CONTACTS.rsvpWhatsApp.phone}?text=${encodeURIComponent(message())}`;
    window.open(url, '_blank', 'noopener');
    setSent(true);
  };

  return (
    <section id="rsvp" className="section rsvp dark" aria-labelledby="rsvp-title">
      <div className="wrap rsvp-grid">
        <div>
          <Reveal><p className="eyebrow">RSVP</p></Reveal>
          <Reveal delay={0.08}>
            <h2 id="rsvp-title" className="display h-lg">Will you <span className="italic">join us?</span></h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="lede">
              Fill this in and we’ll open WhatsApp with your reply ready to send to {CONTACTS.rsvpWhatsApp.display}. Nothing is stored on this
              site.
            </p>
          </Reveal>
        </div>
        <form className="rsvp-form" onSubmit={submit} noValidate>
          <label>
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </label>
          <fieldset>
            <legend>Can you attend?</legend>
            <div className="chips">
              <button type="button" className="chip" aria-pressed={attending === 'yes'} onClick={() => setAttending('yes')}>Joyfully, yes</button>
              <button type="button" className="chip" aria-pressed={attending === 'no'} onClick={() => setAttending('no')}>Sadly, no</button>
            </div>
          </fieldset>
          <AnimatePresence initial={false}>
            {attending === 'yes' && (
              <motion.div className="rsvp-more" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <label>
                  <span>Number of guests</span>
                  <div className="stepper">
                    <button type="button" aria-label="Fewer guests" onClick={() => setCount((c) => Math.max(1, c - 1))}>−</button>
                    <output aria-live="polite">{count}</output>
                    <button type="button" aria-label="More guests" onClick={() => setCount((c) => Math.min(20, c + 1))}>+</button>
                  </div>
                </label>
                <label>
                  <span>Arriving</span>
                  <select value={arrival} onChange={(e) => setArrival(e.target.value)}>
                    <option>Wed 2 Dec</option>
                    <option>Thu 3 Dec morning</option>
                  </select>
                </label>
                <label>
                  <span>Travelling from (optional)</span>
                  <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. Bengaluru" />
                </label>
              </motion.div>
            )}
          </AnimatePresence>
          <label>
            <span>A note for the couple (optional)</span>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-primary">
            <MessageCircle size={16} aria-hidden="true" /> Send RSVP on WhatsApp
          </button>
          {sent && (
            <p className="form-ok" role="status"><Check size={16} aria-hidden="true" /> WhatsApp opened with your message — just press send.</p>
          )}
        </form>
      </div>
    </section>
  );
}
