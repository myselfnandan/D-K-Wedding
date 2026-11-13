/** Source for everything here: the family invitation PDF unless marked otherwise. */

export const VENUE = {
  name: 'Shri Kshetra Pushpagiri Mahasamsthana',
  hall: 'Sri Pushpagiri Mahasamsthana Kalyana Mantapa',
  address: 'Halebeedu, Belur Taluk, Hassan District, Karnataka 573121',
  // Pin resolved from the family's Google Maps link on 9 Nov 2026.
  latitude: 13.1888179,
  longitude: 75.9913076,
  mapUrl: 'https://maps.app.goo.gl/WW6Xn3M1uT3PBuFJ9',
  directionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=13.1888179,75.9913076&travelmode=driving',
};

export const COUPLE = {
  groom: {
    short: 'Dileep',
    full: 'Chi. Ra. Dileep S',
    parents: 'Smt. H A Shashikala & Sri S N Shashidhar',
    home: 'D M Kurke, Arsikere Taluk, Hassan District',
    relation: 'eldest son',
  },
  bride: {
    short: 'Kavya',
    full: 'Chi. Kum. Sow. Kavya H Y',
    parents: 'Smt. Lathamani & Sri Yogesh Achar',
    home: 'M. Hunasekere, Belur Taluk, Hassan District',
    relation: 'eldest daughter',
  },
  weddingDateLabel: 'Thursday, 3 December 2026',
};

export const INVOCATIONS = [
  'Sri Vishwakarma Parabrahmane Namaha',
  'Sri Kalikamba Devi Krupe',
  'Sri Mallikarjuna Swamy Prasanna',
  'Sri Anjaneya Swamy Prasanna',
  'Sri Lakshmi Narasimha Swamy Prasanna',
];

export const PANCHANGA =
  'Shalivahana Shaka 1948 · Parabhava samvatsara · Dakshinayana · Kartika masa, Krishna paksha';

export const HOSTS = {
  welcome: 'The Surachar and Ananthachar families',
  awaiting: ['Smt. Shashikala & Sri Shashidhar', 'Ku. Chinmayi S'],
};

export const CONTACTS = {
  family: { label: 'Family (from the invitation)', phone: '+919449318966', display: '94493 18966' },
  rsvpWhatsApp: { phone: '919980450419', display: '99804 50419' },
};

/** Unknown at time of build — kept explicit so the UI shows "to be shared" rather than guessing. */
export const PENDING = {
  accommodation: null as string | null,
  dressCode: null as string | null,
};

/** A public option, listed for convenience. Not arranged by the family. Source: kstdc.co, checked 9 Nov 2026. */
export const PUBLIC_STAY_OPTIONS = [
  {
    name: 'KSTDC Hotel Mayura Shantala, Halebeedu',
    note: 'Government-run (Karnataka State Tourism Development Corporation) hotel with a restaurant, almost next door to the Hoysaleswara temple. Book only through the official KSTDC site.',
    phone: '+918177273224',
    phoneDisplay: '08177-273224',
    url: 'https://kstdc.co/hotels/hotel-mayura-shantala-halebeedu/',
    source: 'kstdc.co',
  },
];
