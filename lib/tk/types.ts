// ============================================================
// Tennis Kail — Demo: Typen
// ============================================================
//
// Diese Typen sind bewusst so geschnitten, dass sie 1:1 als Tabellen einer
// späteren Produktivdatenbank taugen (siehe docs/tennis-kail-demo.md,
// Abschnitt 29 „Datenmodell"). Alles, was in der Demo aus statischen Dateien
// kommt, hat hier schon die Felder, die eine echte Buchungslogik braucht:
// Zeitfenster in Minuten seit Mitternacht, IDs statt verschachtelter Objekte,
// Preise in Cent (keine Fließkomma-Rundungsfehler).
// ============================================================

/** Woher stammt eine Angabe? Steuert, was die Demo als belegt ausweisen darf. */
export type Provenance =
  /** Von der bestehenden Website bzw. öffentlichen Verzeichnissen belegt. */
  | 'belegt'
  /** Plausible Annahme für die Demo — muss vor Produktivbetrieb bestätigt werden. */
  | 'demo';

export type Surface = 'sand' | 'teppich' | 'granulat' | 'hartplatz';
export type CourtKind = 'halle' | 'freiplatz';

export interface Location {
  id: string;
  name: string;
  shortName: string;
  street: string;
  zip: string;
  city: string;
  district: string;
  lat: number;
  lng: number;
  phone?: string;
  email?: string;
  /** Kurzer Absatz für Übersichtskarten. */
  blurb: string;
  /** Öffnungszeiten je Wochentag (0 = Sonntag). */
  hours: OpeningHours[];
  operator: string;
  provenance: Provenance;
  /** Wie kommt man hin — ÖPNV/Auto, kurz gehalten. */
  arrival: string[];
  imageSlot: string;
}

export interface OpeningHours {
  /** 0 = Sonntag … 6 = Samstag */
  weekday: number;
  /** Mehrere Blöcke möglich (Sonntag hat Mittagspause). */
  blocks: { from: number; to: number }[];
}

export interface Court {
  id: string;
  locationId: string;
  name: string;
  kind: CourtKind;
  surface: Surface;
  /** Flutlicht vorhanden? */
  floodlight: boolean;
  /** Beheizt (nur Halle). */
  heated?: boolean;
  /** Tarifgruppe → verweist auf pricing.ts */
  rateGroupId: string;
  provenance: Provenance;
  note?: string;
}

/** Ein Tarif gilt für eine Tarifgruppe in bestimmten Zeitfenstern und Monaten. */
export interface Rate {
  id: string;
  rateGroupId: string;
  label: string;
  /** Preis pro Stunde in Cent. */
  cents: number;
  /** Gültige Wochentage (0–6). */
  weekdays: number[];
  from: number;
  to: number;
  /** Saison, in der der Tarif gilt. */
  season: 'sommer' | 'winter' | 'ganzjaehrig';
  description?: string;
}

export interface PriceCard {
  id: string;
  title: string;
  subtitle: string;
  rows: { label: string; value: string; hint?: string }[];
  highlight?: boolean;
  footnote?: string;
}

export interface Coach {
  id: string;
  name: string;
  role: string;
  /** Kurzprofil, zwei bis drei Sätze. */
  bio: string;
  licences: string[];
  languages: string[];
  focus: string[];
  /** Preis Einzelstunde 60 min in Cent. */
  singleCents: number;
  /** Preis Zweiertraining 60 min in Cent (pro Person). */
  duoCents: number;
  locationIds: string[];
  /** Wochentag → Zeitfenster, in denen der Trainer grundsätzlich arbeitet. */
  availability: { weekday: number; from: number; to: number }[];
  provenance: Provenance;
  imageSlot: string;
  accent: string;
}

export type CourseKind = 'kids' | 'camp' | 'erwachsene' | 'event';

export interface Course {
  id: string;
  kind: CourseKind;
  title: string;
  teaser: string;
  description: string;
  ageFrom?: number;
  ageTo?: number;
  level: 'einsteiger' | 'fortgeschritten' | 'alle';
  locationId: string;
  coachIds: string[];
  /** ISO-Datum des ersten Termins. */
  startDate: string;
  endDate?: string;
  /** Menschliche Beschreibung der Termine. */
  schedule: string;
  seats: number;
  seatsTaken: number;
  priceCents: number;
  imageSlot: string;
  highlights: string[];
  provenance: Provenance;
}

export interface ClubEvent {
  id: string;
  title: string;
  teaser: string;
  description: string;
  startDate: string;
  endDate?: string;
  time: string;
  locationId: string;
  category: 'turnier' | 'clubabend' | 'saison' | 'familie';
  seats?: number;
  seatsTaken?: number;
  priceCents?: number;
  imageSlot: string;
  provenance: Provenance;
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'schlaeger' | 'baelle' | 'bespannung' | 'zubehoer' | 'service';
  teaser: string;
  priceCents: number;
  /** Streichpreis, falls Aktion. */
  compareCents?: number;
  inStock: boolean;
  /** Nur abholen — die Demo verkauft nichts online. */
  pickupOnly: boolean;
  imageSlot: string;
  badge?: string;
}

export interface Voucher {
  id: string;
  code: string;
  title: string;
  valueCents: number;
  balanceCents: number;
  validUntil: string;
  design: 'sand' | 'halle' | 'kids';
}

/** Eine Buchung — Platz oder Trainerstunde. */
export interface Booking {
  id: string;
  type: 'platz' | 'training' | 'kurs';
  courtId?: string;
  coachId?: string;
  courseId?: string;
  locationId: string;
  /** ISO-Datum (YYYY-MM-DD), lokale Zeit Europe/Berlin. */
  date: string;
  from: number;
  to: number;
  priceCents: number;
  status: 'bestaetigt' | 'offen' | 'storniert' | 'abgeschlossen';
  /** Name des Buchenden — in der Demo Klarnamen von Demo-Personen. */
  customer: string;
  customerId?: string;
  createdAt: string;
  note?: string;
  /** Vom Betreiber gesetzte Sperre statt Kundenbuchung. */
  blocked?: boolean;
}

export interface PartnerRequest {
  id: string;
  name: string;
  initials: string;
  /** Leistungsklasse (LK) im deutschen System, z. B. „LK 14". */
  lk: string;
  age: number;
  preferredLocationId: string;
  /** Frei formulierter Wunsch. */
  text: string;
  slots: { date: string; from: number; to: number }[];
  looksFor: 'einzel' | 'doppel' | 'beides';
  accent: string;
}

export interface Tournament {
  id: string;
  title: string;
  date: string;
  locationId: string;
  mode: string;
  drawSize: number;
  registered: number;
  entryCents: number;
  status: 'anmeldung' | 'ausgelost' | 'laufend' | 'beendet';
  rounds: TournamentRound[];
}

export interface TournamentRound {
  name: string;
  matches: { a: string; b: string; score?: string; winner?: 'a' | 'b' }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  /** ISO-Zeitstempel. */
  at: string;
  channel: 'push' | 'email' | 'sms';
  kind: 'buchung' | 'wetter' | 'kurs' | 'shop' | 'system';
  read: boolean;
}

/** Ein einzelnes Zeitfenster im Buchungsraster. */
export interface Slot {
  courtId: string;
  date: string;
  from: number;
  to: number;
  state: 'frei' | 'belegt' | 'gesperrt' | 'geschlossen' | 'vergangen';
  priceCents: number;
  /** Beschriftung bei belegten/gesperrten Feldern. */
  label?: string;
  /**
   * War das Feld gebucht? Bleibt auch dann true, wenn der Slot inzwischen
   * `vergangen` ist — Auslastung und Umsatz rechnen darüber, nicht über
   * den Anzeigezustand.
   */
  booked?: boolean;
}

export interface WeatherHour {
  /** Minuten seit Mitternacht. */
  minute: number;
  tempC: number;
  /** Regenwahrscheinlichkeit 0–100. */
  rainChance: number;
  /** Niederschlag mm/h. */
  rainMm: number;
  windKmh: number;
  symbol: WeatherSymbol;
}

export type WeatherSymbol = 'sonne' | 'wolkig' | 'bedeckt' | 'schauer' | 'regen' | 'gewitter' | 'schnee';

export interface WeatherDay {
  date: string;
  minC: number;
  maxC: number;
  rainChance: number;
  rainMm: number;
  symbol: WeatherSymbol;
  hours: WeatherHour[];
}

export type CourtCondition = 'bespielbar' | 'feucht' | 'gesperrt' | 'geschlossen';

export interface CourtStatus {
  courtId: string;
  condition: CourtCondition;
  headline: string;
  detail: string;
  /** Empfehlung, falls draußen nichts geht. */
  suggestion?: string;
}

export interface CartLine {
  id: string;
  type: 'platz' | 'training' | 'kurs' | 'shop' | 'gutschein';
  title: string;
  subtitle: string;
  priceCents: number;
  date?: string;
  from?: number;
  to?: number;
  courtId?: string;
  coachId?: string;
  courseId?: string;
}
