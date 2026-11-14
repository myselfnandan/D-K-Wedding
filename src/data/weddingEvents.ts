import type { WeddingEvent } from './types';
import { VENUE } from './guestInfo';

/**
 * MASTER TIMELINE — source: "Dileep & Kavya V7.0 Content for 900 Invitations" (family PDF),
 * updated by the family on 14 Nov 2026: Haladhi (from 2 pm) and Sangeeth (from 6 pm) on 2 December open the celebrations.
 * Never merge, drop, rename or reorder these. Unknown values stay null.
 * When the family confirms a time, fill startDateTime/endDateTime; the hero, the cards and the calendar files follow.
 */
export const weddingEvents: WeddingEvent[] = [
  {
    id: 'haladhi',
    order: 1,
    title: 'Haladhi',
    date: '2026-12-02',
    startDateTime: '2026-12-02T14:00:00+05:30',
    endDateTime: null, // "from 2 pm"
    assumedEndDateTime: null,
    description: 'The haladhi ceremony, on the afternoon before the wedding.',
    location: VENUE.hall,
    place: 'venue',
    priority: 'high',
    image: null,
    dressCode: null,
    mapUrl: VENUE.mapUrl,
    instructions: [],
    details: [{ label: 'Day', value: 'Wednesday, 2 December 2026' }],
  },
  {
    id: 'sangeeth',
    order: 2,
    title: 'Sangeeth',
    date: '2026-12-02',
    startDateTime: '2026-12-02T18:00:00+05:30',
    endDateTime: null, // "from 6 pm"
    assumedEndDateTime: null,
    description: 'An evening of music and dance.',
    location: VENUE.hall, // place not stated by the family; assumed the venue, like Haladhi
    place: 'venue',
    priority: 'high',
    image: null,
    dressCode: null,
    mapUrl: VENUE.mapUrl,
    instructions: [],
    details: [{ label: 'Day', value: 'Wednesday, 2 December 2026' }],
  },
  {
    id: 'muhurtha',
    order: 3,
    title: 'Muhurtha',
    date: '2026-12-03',
    startDateTime: '2026-12-03T08:30:00+05:30',
    endDateTime: '2026-12-03T09:30:00+05:30',
    assumedEndDateTime: null,
    description: 'The wedding ceremony.',
    location: VENUE.hall,
    place: 'venue',
    priority: 'critical',
    image: 'hoysaleswara-carving',
    dressCode: null,
    mapUrl: VENUE.mapUrl,
    instructions: ['Please be seated a little before 8:30 am.'],
    details: [
      { label: 'Lagna', value: 'Dhanu' },
      { label: 'Day', value: 'Thursday, 3 December 2026' },
    ],
  },
  {
    id: 'aaratakshate',
    order: 4,
    title: 'Aaratakshate',
    date: '2026-12-03',
    startDateTime: '2026-12-03T11:30:00+05:30',
    endDateTime: null, // invitation says "from 11:30"
    assumedEndDateTime: '2026-12-03T14:30:00+05:30',
    description: 'The reception.',
    location: VENUE.hall,
    place: 'venue',
    priority: 'high',
    image: null,
    dressCode: null,
    mapUrl: VENUE.mapUrl,
    instructions: [],
    details: [{ label: 'Day', value: 'Thursday, 3 December 2026' }],
  },
  {
    id: 'bhojana',
    order: 5,
    title: 'Bhojana',
    date: '2026-12-03',
    startDateTime: '2026-12-03T12:30:00+05:30',
    endDateTime: null, // invitation says "from 12:30"
    assumedEndDateTime: '2026-12-03T14:30:00+05:30',
    description: 'The wedding feast.',
    location: VENUE.hall,
    place: 'venue',
    priority: 'high',
    image: null,
    dressCode: null,
    mapUrl: VENUE.mapUrl,
    instructions: [],
    details: [{ label: 'Day', value: 'Thursday, 3 December 2026' }],
  },
];

export const MUHURTHA = weddingEvents.find((e) => e.id === 'muhurtha')!;
