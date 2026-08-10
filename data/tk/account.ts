// ============================================================
// Tennis Kail — Demo-Kundenkonto, Gutscheine, Benachrichtigungen
// ============================================================
//
// Alle Personen und Buchungen hier sind erfunden. Das Konto ist das
// Gegenstück zum Betreiber-Dashboard: dieselben Buchungen, andere Sicht.
// ============================================================

import type { Booking, NotificationItem, PartnerRequest, Voucher } from '@/lib/tk/types';

export const DEMO_CUSTOMER = {
  id: 'kd-1042',
  name: 'Anna Wegener',
  firstName: 'Anna',
  email: 'anna.wegener@example.com',
  phone: '+49 170 0000000',
  memberSince: '2019-04-01',
  lk: 'LK 16,4',
  homeLocationId: 'neuperlach',
  /** Guthaben aus 10er-Karte und Gutschriften, in Cent. */
  balanceCents: 8400,
  /** Feste Abo-Stunde in der Halle. */
  subscription: {
    label: 'Winterabo · Halle 2, Neuperlach',
    weekday: 3,
    from: 19 * 60,
    to: 20 * 60,
    validFrom: '2026-10-01',
    validTo: '2027-03-31',
    priceCents: 62000,
  },
  stats: { bookingsThisYear: 38, hoursThisYear: 41, favouriteCourt: 'Platz 3, Neuperlach' },
} as const;

/**
 * Buchungshistorie des Demo-Kontos. Die Datumsangaben sind relativ zum
 * Referenztag gedacht — `todayIso` kommt vom Server, damit Vergangenheit
 * und Zukunft in der Vorführung stimmen (siehe lib/tk/demo-dates.ts).
 */
export const ACCOUNT_BOOKINGS: (Omit<Booking, 'date'> & { dayOffset: number })[] = [
  {
    id: 'b-001', type: 'platz', courtId: 'n-sand-3', locationId: 'neuperlach',
    dayOffset: 1, from: 18 * 60, to: 19 * 60, priceCents: 2100, status: 'bestaetigt',
    customer: 'Anna Wegener', customerId: 'kd-1042', createdAt: '2026-08-05T09:12:00',
    note: 'Doppel mit Familie Frey',
  },
  {
    id: 'b-002', type: 'training', coachId: 'niklas-persson', courtId: 'n-halle-1', locationId: 'neuperlach',
    dayOffset: 4, from: 17 * 60, to: 18 * 60, priceCents: 6500, status: 'bestaetigt',
    customer: 'Anna Wegener', customerId: 'kd-1042', createdAt: '2026-08-06T20:40:00',
    note: 'Aufschlag und Return',
  },
  {
    id: 'b-003', type: 'platz', courtId: 'n-sand-1', locationId: 'neuperlach',
    dayOffset: 9, from: 9 * 60, to: 10 * 60 + 30, priceCents: 3150, status: 'bestaetigt',
    customer: 'Anna Wegener', customerId: 'kd-1042', createdAt: '2026-08-08T07:55:00',
  },
  {
    id: 'b-004', type: 'platz', courtId: 'n-sand-3', locationId: 'neuperlach',
    dayOffset: -3, from: 18 * 60, to: 19 * 60, priceCents: 2100, status: 'abgeschlossen',
    customer: 'Anna Wegener', customerId: 'kd-1042', createdAt: '2026-08-01T11:20:00',
  },
  {
    id: 'b-005', type: 'platz', courtId: 'n-sand-4', locationId: 'neuperlach',
    dayOffset: -6, from: 19 * 60, to: 20 * 60, priceCents: 2100, status: 'storniert',
    customer: 'Anna Wegener', customerId: 'kd-1042', createdAt: '2026-07-28T16:02:00',
    note: 'Regen — automatisch gutgeschrieben',
  },
  {
    id: 'b-006', type: 'kurs', courseId: 'wiedereinstieg', locationId: 'neuperlach',
    dayOffset: -20, from: 18 * 60 + 30, to: 20 * 60, priceCents: 19800, status: 'abgeschlossen',
    customer: 'Anna Wegener', customerId: 'kd-1042', createdAt: '2026-07-15T13:30:00',
  },
];

export const VOUCHERS: Voucher[] = [
  {
    id: 'v-1',
    code: 'KAIL-SAND-2026',
    title: 'Sandplatz-Gutschein',
    valueCents: 5000,
    balanceCents: 5000,
    validUntil: '2027-10-31',
    design: 'sand',
  },
  {
    id: 'v-2',
    code: 'KAIL-HALLE-WINTER',
    title: 'Hallenstunden-Gutschein',
    valueCents: 10000,
    balanceCents: 7100,
    validUntil: '2027-03-31',
    design: 'halle',
  },
  {
    id: 'v-3',
    code: 'KAIL-KIDS-CAMP',
    title: 'Camp-Gutschein für Kinder',
    valueCents: 15000,
    balanceCents: 15000,
    validUntil: '2027-12-31',
    design: 'kids',
  },
];

/** Vorlagen für den Gutschein-Kauf in der Demo. */
export const VOUCHER_PRESETS = [
  { valueCents: 2500, label: 'Eine Stunde Sand' },
  { valueCents: 5000, label: 'Zwei Stunden Halle' },
  { valueCents: 10000, label: 'Training zu zweit' },
  { valueCents: 15000, label: 'Ferien-Camp' },
];

export const NOTIFICATIONS: (Omit<NotificationItem, 'at'> & { hoursAgo: number })[] = [
  {
    id: 'n-1',
    title: 'Platz 3 morgen: Regen wahrscheinlich',
    body: 'Für morgen 18 Uhr meldet der Wetterdienst 70 % Regenwahrscheinlichkeit. Halle 1 ist zur selben Zeit frei — Umbuchung mit einem Tipp.',
    hoursAgo: 2,
    channel: 'push',
    kind: 'wetter',
    read: false,
  },
  {
    id: 'n-2',
    title: 'Buchung bestätigt: Platz 3, morgen 18:00',
    body: 'Deine Buchung ist bestätigt. Storno bis 24 Stunden vorher kostenlos.',
    hoursAgo: 26,
    channel: 'email',
    kind: 'buchung',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Spielpartner gefunden',
    body: 'Sebastian F. (LK 17) sucht Donnerstagabend ein Einzel in Neuperlach — passt zu deinem Profil.',
    hoursAgo: 30,
    channel: 'push',
    kind: 'system',
    read: true,
  },
  {
    id: 'n-4',
    title: 'Kurs „Wiedereinstieg" startet in vier Wochen',
    body: 'Dein Platz ist reserviert. Der erste Termin ist Montag, 14. September, 18:30 Uhr.',
    hoursAgo: 72,
    channel: 'email',
    kind: 'kurs',
    read: true,
  },
  {
    id: 'n-5',
    title: 'Schläger fertig bespannt',
    body: 'Dein Schläger liegt an der Theke bereit. Polyester, 24 kg.',
    hoursAgo: 120,
    channel: 'sms',
    kind: 'shop',
    read: true,
  },
];

/** Voreinstellungen für Benachrichtigungskanäle im Konto. */
export const NOTIFICATION_PREFS = [
  { id: 'buchung', label: 'Buchungsbestätigung und Erinnerung', push: true, email: true, sms: false },
  { id: 'wetter', label: 'Wetterwarnung für gebuchte Freiplätze', push: true, email: false, sms: false },
  { id: 'freiwerdend', label: 'Frei werdende Wunschzeiten', push: true, email: false, sms: false },
  { id: 'kurs', label: 'Kurse, Camps und Wartelisten', push: false, email: true, sms: false },
  { id: 'partner', label: 'Passende Spielpartner-Gesuche', push: true, email: false, sms: false },
  { id: 'shop', label: 'Bespannung fertig, Ware da', push: false, email: false, sms: true },
];

export const PARTNER_REQUESTS: PartnerRequest[] = [
  {
    id: 'p-1', name: 'Sebastian Frey', initials: 'SF', lk: 'LK 17,2', age: 41,
    preferredLocationId: 'neuperlach',
    text: 'Suche regelmäßig ein Einzel unter der Woche abends. Spiele seit 20 Jahren, nehme es sportlich, aber nicht bierernst.',
    slots: [{ date: '', from: 18 * 60, to: 20 * 60 }],
    looksFor: 'einzel', accent: 'clay',
  },
  {
    id: 'p-2', name: 'Miriam Kolb', initials: 'MK', lk: 'LK 21,0', age: 34,
    preferredLocationId: 'harlaching',
    text: 'Wiedereinsteigerin, spiele seit einem Jahr wieder. Suche jemanden für lange Ballwechsel — Gewinnen ist mir egal.',
    slots: [{ date: '', from: 10 * 60, to: 12 * 60 }],
    looksFor: 'beides', accent: 'sun',
  },
  {
    id: 'p-3', name: 'Andreas Lang', initials: 'AL', lk: 'LK 13,8', age: 29,
    preferredLocationId: 'neuperlach',
    text: 'Punktspielvorbereitung, suche Trainingspartner auf ähnlichem Niveau. Gern zweimal die Woche früh morgens.',
    slots: [{ date: '', from: 7 * 60, to: 9 * 60 }],
    looksFor: 'einzel', accent: 'forest',
  },
  {
    id: 'p-4', name: 'Familie Wimmer', initials: 'FW', lk: 'ohne LK', age: 45,
    preferredLocationId: 'harlaching',
    text: 'Wir sind zu dritt und suchen ein viertes für sonntägliche Doppel. Kinder spielen mit, Niveau gemischt.',
    slots: [{ date: '', from: 10 * 60, to: 13 * 60 }],
    looksFor: 'doppel', accent: 'clay',
  },
  {
    id: 'p-5', name: 'Nico Baumgartner', initials: 'NB', lk: 'LK 19,5', age: 23,
    preferredLocationId: 'neuperlach',
    text: 'Student, zeitlich flexibel, suche jemanden für vormittags. Halle im Winter, Sand im Sommer.',
    slots: [{ date: '', from: 9 * 60, to: 13 * 60 }],
    looksFor: 'beides', accent: 'forest',
  },
];
