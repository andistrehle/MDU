// ============================================================
// Tennis Kail — Tarife (DEMO)
// ============================================================
//
// Sämtliche Preise sind Demo-Werte. Sie sind an marktübliche Münchner
// Platzmieten angelehnt, damit die Buchungsstrecke realistisch rechnet —
// sie stammen NICHT von tennis-kail.de. Vor Produktivbetrieb ersetzen.
//
// Aufbau: Tarifgruppe (`rateGroupId` am Platz) + Zeitfenster + Wochentage.
// `rateFor()` sucht den ersten passenden Tarif; das ist bewusst dieselbe
// Logik, die später eine Datenbankabfrage liefern würde.
// ============================================================

import type { PriceCard, Rate } from '@/lib/tk/types';

export const RATES: Rate[] = [
  // ---- Halle -------------------------------------------------------------
  {
    id: 'halle-frueh',
    rateGroupId: 'halle',
    label: 'Halle · Frühtarif',
    cents: 1800,
    weekdays: [1, 2, 3, 4, 5],
    from: 8 * 60,
    to: 15 * 60,
    season: 'ganzjaehrig',
    description: 'Werktags bis 15 Uhr — die günstigste Zeit auf dem Teppich.',
  },
  {
    id: 'halle-prime',
    rateGroupId: 'halle',
    label: 'Halle · Hauptzeit',
    cents: 2900,
    weekdays: [1, 2, 3, 4, 5],
    from: 15 * 60,
    to: 22 * 60,
    season: 'ganzjaehrig',
    description: 'Werktags ab 15 Uhr, die gefragteste Zeit.',
  },
  {
    id: 'halle-we',
    rateGroupId: 'halle',
    label: 'Halle · Wochenende',
    cents: 2600,
    weekdays: [0, 6],
    from: 8 * 60,
    to: 22 * 60,
    season: 'ganzjaehrig',
    description: 'Samstag und Sonntag, ganztags.',
  },
  // ---- Freiplatz ---------------------------------------------------------
  {
    id: 'frei-tag',
    rateGroupId: 'freiplatz',
    label: 'Sandplatz · Tagestarif',
    cents: 1600,
    weekdays: [1, 2, 3, 4, 5],
    from: 8 * 60,
    to: 17 * 60,
    season: 'sommer',
    description: 'Werktags bis 17 Uhr auf dem Sand.',
  },
  {
    id: 'frei-abend',
    rateGroupId: 'freiplatz',
    label: 'Sandplatz · Abend',
    cents: 2100,
    weekdays: [1, 2, 3, 4, 5],
    from: 17 * 60,
    to: 22 * 60,
    season: 'sommer',
    description: 'Ab 17 Uhr, auf den Flutlichtplätzen auch danach.',
  },
  {
    id: 'frei-we',
    rateGroupId: 'freiplatz',
    label: 'Sandplatz · Wochenende',
    cents: 2100,
    weekdays: [0, 6],
    from: 8 * 60,
    to: 22 * 60,
    season: 'sommer',
    description: 'Samstag und Sonntag, ganztags.',
  },
];

/** Preis pro Stunde in Cent für eine Tarifgruppe zu einem Zeitpunkt. */
export function rateFor(rateGroupId: string, weekday: number, minute: number): Rate {
  const hit = RATES.find(
    (r) => r.rateGroupId === rateGroupId && r.weekdays.includes(weekday) && minute >= r.from && minute < r.to,
  );
  if (hit) return hit;
  // Außerhalb definierter Fenster: teuerster Tarif der Gruppe als sichere Annahme.
  const group = RATES.filter((r) => r.rateGroupId === rateGroupId);
  return group.reduce((a, b) => (b.cents > a.cents ? b : a), group[0]);
}

/** Preis für ein Fenster (from–to in Minuten), anteilig auf die Stunde gerechnet. */
export function priceForWindow(rateGroupId: string, weekday: number, from: number, to: number): number {
  const rate = rateFor(rateGroupId, weekday, from);
  return Math.round((rate.cents * (to - from)) / 60);
}

/** Aufbereitete Preistafeln für die Preisseite. */
export const PRICE_CARDS: PriceCard[] = [
  {
    id: 'halle',
    title: 'Halle',
    subtitle: 'Ganzjährig, beheizt, wetterunabhängig',
    highlight: true,
    rows: [
      { label: 'Mo–Fr bis 15 Uhr', value: '18,00 €', hint: 'pro Stunde' },
      { label: 'Mo–Fr ab 15 Uhr', value: '29,00 €', hint: 'pro Stunde' },
      { label: 'Sa und So', value: '26,00 €', hint: 'pro Stunde' },
      { label: 'Saisonabo (Winter)', value: 'ab 620 €', hint: 'feste Stunde, 22 Wochen' },
    ],
    footnote: 'Halle 3 in Harlaching hat Sandgranulat — gleiches Rutschverhalten wie draußen.',
  },
  {
    id: 'freiplatz',
    title: 'Sandplatz',
    subtitle: 'Sommersaison, April bis Oktober',
    rows: [
      { label: 'Mo–Fr bis 17 Uhr', value: '16,00 €', hint: 'pro Stunde' },
      { label: 'Mo–Fr ab 17 Uhr', value: '21,00 €', hint: 'pro Stunde' },
      { label: 'Sa und So', value: '21,00 €', hint: 'pro Stunde' },
      { label: '10er-Karte', value: '190,00 €', hint: 'frei einlösbar' },
    ],
    footnote: 'Bei Regen wird der Platz automatisch gesperrt — die Buchung verfällt nicht.',
  },
  {
    id: 'training',
    title: 'Training',
    subtitle: 'Einzeln, zu zweit oder in der Gruppe',
    rows: [
      { label: 'Einzelstunde 60 min', value: 'ab 55,00 €', hint: 'zzgl. Platzmiete' },
      { label: 'Zweiertraining 60 min', value: 'ab 33,00 €', hint: 'pro Person' },
      { label: 'Gruppe ab 4 Personen', value: 'ab 22,00 €', hint: 'pro Person' },
      { label: 'Kids-Kurs 10 Termine', value: '160,00 €', hint: 'inkl. Platz und Bälle' },
    ],
    footnote: 'Trainerstunden lassen sich direkt mit dem passenden Platz zusammen buchen.',
  },
];

export const PRICE_NOTES = [
  'Alle Preise gelten pro Platz und Stunde, unabhängig von der Anzahl der Spielenden.',
  'Storno bis 24 Stunden vor Spielbeginn kostenlos, danach 50 Prozent.',
  'Sperrt der Platzstatus einen Sandplatz wegen Regen, wird die Buchung automatisch gutgeschrieben.',
  'Abos und Mehrfachkarten laufen über das Kundenkonto und lassen sich dort einsehen.',
];
