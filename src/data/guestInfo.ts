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
    full: 'Dileep S',
    home: 'D M Kurke, Arsikere Taluk, Hassan District',
  },
  bride: {
    short: 'Kavya',
    full: 'Kavya H Y',
    home: 'M. Hunasekere, Belur Taluk, Hassan District',
  },
  weddingDateLabel: 'Thursday, 3 December 2026',
};

/** No individual names other than the couple appear anywhere on the site (owner's request). */
export const HOSTS = {
  signature: 'Both families',
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
