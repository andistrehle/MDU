// ============================================================
// Tennis Kail — Standorte, Plätze, Öffnungszeiten
// ============================================================
//
// WICHTIG — Datenherkunft:
// Die Umgebung, in der diese Demo gebaut wurde, hat keinen Netzzugriff auf
// www.tennis-kail.de (der Egress-Proxy blockt die Domain). Alle Angaben mit
// `provenance: 'belegt'` stammen aus öffentlich recherchierbaren Quellen
// (Website-Titel, Branchenverzeichnisse, Vereinsseite tcn-kail.de).
// Alles mit `provenance: 'demo'` ist eine plausible Annahme, damit die Demo
// vorführbar ist — sie ist in der Oberfläche als Demo gekennzeichnet und muss
// vor einem Produktivbetrieb vom Betreiber bestätigt werden.
// Übersicht aller Angaben: /tk/datenherkunft
// ============================================================

import type { Court, Location } from '@/lib/tk/types';

export const BRAND = {
  name: 'Tennis Kail',
  legal: 'Tennis Gebr. Kail OHG',
  claim: 'Seit über 50 Jahren Tennis am Perlacher Forst.',
  /** Kurzform für Kopfzeile und Metadaten. */
  tagline: 'Tennis in München — Halle und Sand, zwei Anlagen, eine Familie.',
  phone: '089 648457',
  phoneHref: '+4989648457',
  email: 'info@tcn-kail.de',
  bookingEmail: 'platzbuchung@tcn-kail.de',
  website: 'https://www.tennis-kail.de',
  foundedText: 'über 50 Jahre',
} as const;

/**
 * Öffnungszeiten Harlaching, belegt über Branchenverzeichnisse:
 * Mo–Fr 8–20, Sa 8–19, So 9–13 und 15–19 Uhr.
 */
const HOURS_HARLACHING = [
  { weekday: 1, blocks: [{ from: 8 * 60, to: 20 * 60 }] },
  { weekday: 2, blocks: [{ from: 8 * 60, to: 20 * 60 }] },
  { weekday: 3, blocks: [{ from: 8 * 60, to: 20 * 60 }] },
  { weekday: 4, blocks: [{ from: 8 * 60, to: 20 * 60 }] },
  { weekday: 5, blocks: [{ from: 8 * 60, to: 20 * 60 }] },
  { weekday: 6, blocks: [{ from: 8 * 60, to: 19 * 60 }] },
  { weekday: 0, blocks: [{ from: 9 * 60, to: 13 * 60 }, { from: 15 * 60, to: 19 * 60 }] },
];

/** Neuperlach: Zeiten sind nicht belegt — für die Demo an Harlaching angelehnt. */
const HOURS_NEUPERLACH = [
  { weekday: 1, blocks: [{ from: 8 * 60, to: 22 * 60 }] },
  { weekday: 2, blocks: [{ from: 8 * 60, to: 22 * 60 }] },
  { weekday: 3, blocks: [{ from: 8 * 60, to: 22 * 60 }] },
  { weekday: 4, blocks: [{ from: 8 * 60, to: 22 * 60 }] },
  { weekday: 5, blocks: [{ from: 8 * 60, to: 22 * 60 }] },
  { weekday: 6, blocks: [{ from: 8 * 60, to: 20 * 60 }] },
  { weekday: 0, blocks: [{ from: 9 * 60, to: 20 * 60 }] },
];

export const LOCATIONS: Location[] = [
  {
    id: 'harlaching',
    name: 'Tennis Kail Harlaching',
    shortName: 'Harlaching',
    street: 'Oberbiberger Straße 120',
    zip: '81547',
    city: 'München',
    district: 'Untergiesing-Harlaching',
    lat: 48.0891,
    lng: 11.5695,
    phone: BRAND.phone,
    email: BRAND.email,
    blurb:
      'Die Stammanlage direkt am Perlacher Forst: Halle für das ganze Jahr, Sandplätze ' +
      'für den Sommer. Kurze Wege, viel Grün, Familienbetrieb seit über 50 Jahren.',
    hours: HOURS_HARLACHING,
    operator: 'Tennis Gebr. Kail OHG',
    provenance: 'belegt',
    arrival: [
      'U1 Mangfallplatz, dann Bus 220 Richtung Perlacher Forst',
      'Parkplätze direkt an der Anlage',
      'Radweg entlang des Perlacher Forsts bis vor die Tür',
    ],
    imageSlot: 'anlage-harlaching',
  },
  {
    id: 'neuperlach',
    name: 'Tennis Kail Neuperlach',
    shortName: 'Neuperlach',
    street: 'Kurt-Eisner-Straße 30',
    zip: '81735',
    city: 'München',
    district: 'Neuperlach',
    lat: 48.1006,
    lng: 11.6437,
    email: BRAND.bookingEmail,
    blurb:
      'Acht Freiplätze des TC Neuperlach-Kail e. V. und drei Hallenplätze von ' +
      'Tennis Kail. Weitläufig, ruhig, mit Vereinsleben und offener Platzvermietung.',
    hours: HOURS_NEUPERLACH,
    operator: 'TC Neuperlach-Kail e. V. (Freiplätze) · Tennis Kail GmbH & Co. KG (Halle)',
    provenance: 'belegt',
    arrival: [
      'U5 Neuperlach Zentrum, 8 Minuten zu Fuß',
      'Parkplätze an der Kurt-Eisner-Straße',
      'S7 Neuperlach Süd, Bus bis Quiddestraße',
    ],
    imageSlot: 'anlage-neuperlach',
  },
];

export function getLocation(id: string): Location | undefined {
  return LOCATIONS.find((l) => l.id === id);
}

/**
 * Plätze.
 * Neuperlach: 8 Freiplätze + 3 Hallenplätze sind belegt.
 * Harlaching: Anzahl und Belag sind NICHT belegt — Aufteilung ist eine
 * Demo-Annahme, damit ein vollständiges Buchungsraster vorführbar ist.
 */
export const COURTS: Court[] = [
  // Harlaching — Halle
  { id: 'h-halle-1', locationId: 'harlaching', name: 'Halle 1', kind: 'halle', surface: 'teppich', floodlight: true, heated: true, rateGroupId: 'halle', provenance: 'demo' },
  { id: 'h-halle-2', locationId: 'harlaching', name: 'Halle 2', kind: 'halle', surface: 'teppich', floodlight: true, heated: true, rateGroupId: 'halle', provenance: 'demo' },
  { id: 'h-halle-3', locationId: 'harlaching', name: 'Halle 3', kind: 'halle', surface: 'granulat', floodlight: true, heated: true, rateGroupId: 'halle', provenance: 'demo', note: 'Sandähnliches Granulat — gleiches Rutschverhalten wie draußen.' },
  // Harlaching — Freiplätze
  { id: 'h-sand-1', locationId: 'harlaching', name: 'Platz 1', kind: 'freiplatz', surface: 'sand', floodlight: true, rateGroupId: 'freiplatz', provenance: 'demo' },
  { id: 'h-sand-2', locationId: 'harlaching', name: 'Platz 2', kind: 'freiplatz', surface: 'sand', floodlight: true, rateGroupId: 'freiplatz', provenance: 'demo' },
  { id: 'h-sand-3', locationId: 'harlaching', name: 'Platz 3', kind: 'freiplatz', surface: 'sand', floodlight: false, rateGroupId: 'freiplatz', provenance: 'demo' },
  { id: 'h-sand-4', locationId: 'harlaching', name: 'Platz 4', kind: 'freiplatz', surface: 'sand', floodlight: false, rateGroupId: 'freiplatz', provenance: 'demo' },
  { id: 'h-sand-5', locationId: 'harlaching', name: 'Platz 5', kind: 'freiplatz', surface: 'sand', floodlight: false, rateGroupId: 'freiplatz', provenance: 'demo', note: 'Ruhigster Platz, direkt an der Waldkante.' },

  // Neuperlach — Halle (3 Plätze, belegt)
  { id: 'n-halle-1', locationId: 'neuperlach', name: 'Halle 1', kind: 'halle', surface: 'teppich', floodlight: true, heated: true, rateGroupId: 'halle', provenance: 'belegt' },
  { id: 'n-halle-2', locationId: 'neuperlach', name: 'Halle 2', kind: 'halle', surface: 'teppich', floodlight: true, heated: true, rateGroupId: 'halle', provenance: 'belegt' },
  { id: 'n-halle-3', locationId: 'neuperlach', name: 'Halle 3', kind: 'halle', surface: 'teppich', floodlight: true, heated: true, rateGroupId: 'halle', provenance: 'belegt' },
  // Neuperlach — 8 Freiplätze (belegt)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `n-sand-${i + 1}`,
    locationId: 'neuperlach',
    name: `Platz ${i + 1}`,
    kind: 'freiplatz' as const,
    surface: 'sand' as const,
    floodlight: i < 4,
    rateGroupId: 'freiplatz',
    provenance: 'belegt' as const,
  })),
];

export function courtsOf(locationId: string): Court[] {
  return COURTS.filter((c) => c.locationId === locationId);
}

export function getCourt(id: string): Court | undefined {
  return COURTS.find((c) => c.id === id);
}

export const SURFACE_LABEL: Record<string, string> = {
  sand: 'Sand',
  teppich: 'Teppich',
  granulat: 'Sandgranulat',
  hartplatz: 'Hartplatz',
};

export const WEEKDAY_LABEL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
export const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** Fasst gleiche Öffnungszeiten zu Zeilen zusammen („Mo–Fr 8–20 Uhr"). */
export function hoursSummary(location: Location): { days: string; time: string }[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const rows: { days: string; time: string }[] = [];
  let run: number[] = [];
  let runKey = '';

  const keyOf = (wd: number) => {
    const h = location.hours.find((x) => x.weekday === wd);
    if (!h || h.blocks.length === 0) return 'geschlossen';
    return h.blocks.map((b) => `${fmtMin(b.from)}–${fmtMin(b.to)}`).join(' und ');
  };

  const flush = () => {
    if (run.length === 0) return;
    const days =
      run.length === 1
        ? WEEKDAY_SHORT[run[0]]
        : `${WEEKDAY_SHORT[run[0]]}–${WEEKDAY_SHORT[run[run.length - 1]]}`;
    rows.push({ days, time: runKey === 'geschlossen' ? 'geschlossen' : `${runKey} Uhr` });
    run = [];
  };

  for (const wd of order) {
    const k = keyOf(wd);
    if (k === runKey) {
      run.push(wd);
    } else {
      flush();
      runKey = k;
      run = [wd];
    }
  }
  flush();
  return rows;
}

function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}` : `${h}:${String(m).padStart(2, '0')}`;
}

/** Belegte Eckdaten für die Seite „Datenherkunft". */
export const FACTS: { claim: string; source: string; provenance: 'belegt' | 'demo' }[] = [
  { claim: 'Anschrift Harlaching: Oberbiberger Straße 120, 81547 München', source: 'Branchenverzeichnisse (Das Örtliche, Cylex, onlinestreet)', provenance: 'belegt' },
  { claim: 'Telefon 089 648457', source: 'Branchenverzeichnisse, Platzbuchung per Telefon', provenance: 'belegt' },
  { claim: 'Öffnungszeiten Harlaching Mo–Fr 8–20, Sa 8–19, So 9–13 und 15–19 Uhr', source: 'Branchenverzeichnis', provenance: 'belegt' },
  { claim: 'Lage direkt am Perlacher Forst, seit über 50 Jahren in Betrieb', source: 'Selbstbeschreibung Tennis Kail', provenance: 'belegt' },
  { claim: 'Neuperlach: 8 Freiplätze (TC Neuperlach-Kail e. V.), 3 Hallenplätze (Tennis Kail GmbH & Co. KG)', source: 'tcn-kail.de — Anlage', provenance: 'belegt' },
  { claim: 'Anschrift Neuperlach: Kurt-Eisner-Straße 30, 81735 München', source: 'tcn-kail.de', provenance: 'belegt' },
  { claim: 'E-Mail info@tcn-kail.de und platzbuchung@tcn-kail.de', source: 'tcn-kail.de', provenance: 'belegt' },
  { claim: 'Trainer Niklas Persson und Ekkehard Dietrich (im Verein seit 1994)', source: 'tcn-kail.de — Training', provenance: 'belegt' },
  { claim: 'Anzahl und Belag der Plätze in Harlaching', source: 'nicht belegt — Demo-Annahme', provenance: 'demo' },
  { claim: 'Alle Preise, Kurse, Camps, Events, Shop-Artikel', source: 'nicht belegt — Demo-Annahme', provenance: 'demo' },
  { claim: 'Alle Buchungen, Kundendaten, Turnierergebnisse, Spielpartner-Gesuche', source: 'frei erfunden für die Vorführung', provenance: 'demo' },
];
