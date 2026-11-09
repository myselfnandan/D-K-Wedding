import type { WeddingEvent } from '../data/types';
import { VENUE } from '../data/guestInfo';
import { toMs } from './timeCalculations';

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');

/** iCalendar file for a timed event. Untimed events become all-day entries. */
export function eventToIcs(e: WeddingEvent) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dileep and Kavya//Wedding//EN',
    'BEGIN:VEVENT',
    `UID:${e.id}@dileep-kavya`,
    `DTSTAMP:${stamp(Date.now())}`,
  ];
  if (e.startDateTime) {
    const start = toMs(e.startDateTime);
    const end = e.endDateTime ? toMs(e.endDateTime) : start + 60 * 60_000;
    lines.push(`DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`);
  } else {
    const d = e.date.replace(/-/g, '');
    lines.push(`DTSTART;VALUE=DATE:${d}`);
  }
  lines.push(
    `SUMMARY:${esc(`${e.title} — Dileep & Kavya`)}`,
    `LOCATION:${esc(e.place === 'venue' ? `${VENUE.hall}, ${VENUE.address}` : e.location)}`,
    `DESCRIPTION:${esc(e.description + (e.endDateTime ? '' : '\nEnd time not specified in the invitation.'))}`,
    'END:VEVENT',
    'END:VCALENDAR',
  );
  return lines.join('\r\n');
}

export function downloadIcs(e: WeddingEvent) {
  const blob = new Blob([eventToIcs(e)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${e.id}-dileep-kavya.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
