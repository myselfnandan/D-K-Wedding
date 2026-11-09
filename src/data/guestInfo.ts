/** Source for everything here: the family invitation PDF unless marked otherwise. */

export const VENUE = {
  name: 'Shri Kshetra Pushpagiri Mahasamsthana',
  nameKn: 'ಶ್ರೀ ಪುಷ್ಪಗಿರಿ ಮಹಾಸಂಸ್ಥಾನ',
  hall: 'Sri Pushpagiri Mahasamsthana Kalyana Mantapa',
  hallKn: 'ಶ್ರೀ ಪುಷ್ಪಗಿರಿ ಮಹಾಸಂಸ್ಥಾನ ಕಲ್ಯಾಣ ಮಂಟಪ',
  address: 'Halebeedu, Belur Taluk, Hassan District, Karnataka 573121',
  addressKn: 'ಹಳೇಬೀಡು, ಬೇಲೂರು ತಾ., ಹಾಸನ ಜಿ.',
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
    kn: 'ಚಿ. ರಾ. ದಿಲೀಪ್ ಎಸ್',
    shortKn: 'ದಿಲೀಪ್',
    parents: 'Smt. H A Shashikala & Sri S N Shashidhar',
    parentsKn: 'ಶ್ರೀಮತಿ ಎಚ್ ಎ ಶಶಿಕಲಾ ಶ್ರೀ ಎಸ್ ಎನ್ ಶಶಿಧರ್',
    home: 'D M Kurke, Arsikere Taluk, Hassan District',
    relation: 'eldest son',
  },
  bride: {
    short: 'Kavya',
    full: 'Chi. Kum. Sow. Kavya H Y',
    kn: 'ಚಿ. ಕುಂ. ಸೌ. ಕಾವ್ಯ ಹೆಚ್ ವೈ',
    shortKn: 'ಕಾವ್ಯ',
    parents: 'Smt. Lathamani & Sri Yogesh Achar',
    parentsKn: 'ಶ್ರೀಮತಿ ಲತಾಮಣಿ ಶ್ರೀ ಯೋಗೇಶ್ ಆಚಾರ್',
    home: 'M. Hunasekere, Belur Taluk, Hassan District',
    relation: 'eldest daughter',
  },
  weddingDateLabel: 'Thursday, 3 December 2026',
  weddingDateKn: '03-12-2026 ನೇ ಗುರುವಾರ',
};

export const INVOCATIONS = [
  'ಶ್ರೀ ವಿಶ್ವಕರ್ಮ ಪರಬ್ರಹ್ಮಣೇ ನಮಃ',
  'ಶ್ರೀ ಕಾಳಿಕಾಂಬ ದೇವಿ ಕೃಪೆ',
  'ಶ್ರೀ ಮಲ್ಲಿಕಾರ್ಜುನ ಸ್ವಾಮಿ ಪ್ರಸನ್ನ',
  'ಶ್ರೀ ಆಂಜನೇಯ ಸ್ವಾಮಿ ಪ್ರಸನ್ನ',
  'ಶ್ರೀ ಲಕ್ಷ್ಮಿ ನರಸಿಂಹಸ್ವಾಮಿ ಪ್ರಸನ್ನ',
];

export const PANCHANGA =
  'Shalivahana Shaka 1948 · Parabhava samvatsara · Dakshinayana · Kartika masa, Krishna paksha';

export const HOSTS = {
  welcome: 'The Surachar and Ananthachar families',
  welcomeKn: 'ಸೂರಾಚಾರ್ ವಂಶಸ್ಥರು ಮತ್ತು ಅನಂತಾಚಾರ್ ವಂಶಸ್ಥರು',
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
