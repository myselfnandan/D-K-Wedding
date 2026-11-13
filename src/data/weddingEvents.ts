import type { WeddingEvent } from './types';
import { VENUE } from './guestInfo';

/**
 * MASTER TIMELINE — source: "Dileep & Kavya V7.0 Content for 900 Invitations" (family PDF).
 * Never merge, drop, rename or reorder these. Unknown values stay null.
 * When the family confirms a time, fill startDateTime/endDateTime and the planner recalculates.
 */
export const weddingEvents: WeddingEvent[] = [
  {
    id: 'devatha-karya',
    order: 1,
    title: 'Devatha Karya',
    date: '2026-12-01',
    startDateTime: null, // not given in the invitation
    endDateTime: null,
    assumedEndDateTime: null,
    description:
      'Prayers to the family deities that open the wedding celebrations, held at the groom’s home.',
    location: 'Groom’s residence',
    place: 'groom-home',
    priority: 'high',
    image: null,
    dressCode: null,
    mapUrl: null,
    instructions: ['Time to be confirmed by the family.'],
    details: [{ label: 'Day', value: 'Tuesday, 1 December 2026' }],
  },
  {
    id: 'muhurtha',
    order: 2,
    title: 'Muhurtha',
    date: '2026-12-03',
    startDateTime: '2026-12-03T08:30:00+05:30',
    endDateTime: '2026-12-03T09:30:00+05:30',
    assumedEndDateTime: null,
    description:
      'The auspicious hour of the wedding, in Dhanu lagna. The moment the family gathers for.',
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
    description: 'The reception — bless the couple and celebrate with both families.',
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
