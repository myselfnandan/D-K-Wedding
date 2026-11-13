import type { WeddingEvent } from './types';
import { VENUE } from './guestInfo';

/**
 * MASTER TIMELINE — source: "Dileep & Kavya V7.0 Content for 900 Invitations" (family PDF),
 * updated by the family on 14 Nov 2026: Haladhi on the evening of 2 December opens the celebrations.
 * Never merge, drop, rename or reorder these. Unknown values stay null.
 * When the family confirms a time, fill startDateTime/endDateTime and the planner recalculates.
 */
export const weddingEvents: WeddingEvent[] = [
  {
    id: 'haladhi',
    order: 1,
    title: 'Haladhi',
    date: '2026-12-02',
    startDateTime: null, // the family has said "evening"; exact time not given yet
    endDateTime: null,
    timeOfDay: 'Evening',
    assumedEndDateTime: null,
    description: 'The haladhi ceremony, on the evening before the wedding.',
    location: VENUE.hall,
    place: 'venue',
    priority: 'high',
    image: null,
    dressCode: null,
    mapUrl: VENUE.mapUrl,
    instructions: ['Exact time to be confirmed by the family.'],
    details: [
      { label: 'Day', value: 'Wednesday, 2 December 2026' },
      { label: 'Time', value: 'Evening' },
    ],
  },
  {
    id: 'muhurtha',
    order: 2,
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
    order: 3,
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
    order: 4,
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
