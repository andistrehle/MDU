// ============================================================
// Tennis Kail — Trainerteam
// ============================================================
//
// Niklas Persson und Ekkehard Dietrich sind über die Vereinsseite belegte
// Trainer (Ekkehard Dietrich seit 1994 dabei). Ihre Kurzprofile, Preise und
// Verfügbarkeiten sind für die Demo gesetzt und NICHT belegt.
// Die dritte Trainerin ist eine Demo-Person, damit die Buchungsstrecke
// mehrere Profile und Kollisionen zeigen kann.
// ============================================================

import type { Coach } from '@/lib/tk/types';

/** Werktags-Fenster als Kurzform. */
const weekdays = (from: number, to: number) =>
  [1, 2, 3, 4, 5].map((weekday) => ({ weekday, from, to }));

export const COACHES: Coach[] = [
  {
    id: 'niklas-persson',
    name: 'Niklas Persson',
    role: 'Cheftrainer',
    bio:
      'Niklas trainiert Einzelne und Gruppen — vom ersten Aufschlag bis zur Matchvorbereitung. ' +
      'Sein Training ist offen für alle, auch ohne Vereinsmitgliedschaft. Er arbeitet gern über ' +
      'lange Ballwechsel statt über Theorie.',
    licences: ['DTB-B-Trainer', 'Leistungssport-Lizenz'],
    languages: ['Deutsch', 'Englisch', 'Schwedisch'],
    focus: ['Technik', 'Matchtaktik', 'Erwachsene', 'Leistungskurs'],
    singleCents: 6500,
    duoCents: 3800,
    locationIds: ['neuperlach', 'harlaching'],
    availability: [...weekdays(9 * 60, 20 * 60), { weekday: 6, from: 9 * 60, to: 14 * 60 }],
    provenance: 'belegt',
    imageSlot: 'trainer-persson',
    accent: 'clay',
  },
  {
    id: 'ekkehard-dietrich',
    name: 'Ekkehard Dietrich',
    role: 'Trainer, seit 1994 an der Anlage',
    bio:
      'Ekkehard kennt die Plätze länger als die meisten Mitglieder. Er nimmt sich Zeit für ' +
      'Wiedereinsteiger, für Menschen mit Bandscheibe und für alle, die nach Jahren Pause ' +
      'wieder anfangen. Ruhig im Ton, genau im Blick.',
    licences: ['DTB-C-Trainer'],
    languages: ['Deutsch'],
    focus: ['Wiedereinstieg', 'Technikkorrektur', 'Ü50', 'Doppel'],
    singleCents: 5500,
    duoCents: 3300,
    locationIds: ['neuperlach'],
    availability: [
      { weekday: 1, from: 10 * 60, to: 17 * 60 },
      { weekday: 3, from: 10 * 60, to: 17 * 60 },
      { weekday: 5, from: 10 * 60, to: 16 * 60 },
      { weekday: 6, from: 10 * 60, to: 15 * 60 },
    ],
    provenance: 'belegt',
    imageSlot: 'trainer-dietrich',
    accent: 'forest',
  },
  {
    id: 'mara-hoefer',
    name: 'Mara Höfer',
    role: 'Kinder- und Jugendtraining (Demo-Person)',
    bio:
      'Mara betreut die Bambini und die Jugendgruppen. Kleinfeld, rote und orange Bälle, ' +
      'viel Bewegung, wenig Stillstehen. Sie plant die Ferien-Camps und begleitet die ' +
      'Jugendmannschaften zu den Punktspielen.',
    licences: ['DTB-C-Trainer Breitensport', 'Kids-Tennis-Lizenz'],
    languages: ['Deutsch', 'Englisch'],
    focus: ['Kinder 4–12', 'Jugend', 'Camps', 'Einsteiger'],
    singleCents: 5000,
    duoCents: 3000,
    locationIds: ['harlaching', 'neuperlach'],
    availability: [
      { weekday: 2, from: 14 * 60, to: 19 * 60 },
      { weekday: 3, from: 14 * 60, to: 19 * 60 },
      { weekday: 4, from: 14 * 60, to: 19 * 60 },
      { weekday: 6, from: 9 * 60, to: 13 * 60 },
    ],
    provenance: 'demo',
    imageSlot: 'trainer-hoefer',
    accent: 'sun',
  },
];

export function getCoach(id: string): Coach | undefined {
  return COACHES.find((c) => c.id === id);
}
