// ============================================================
// BeDV-Demo — Datentypen
// ============================================================
//
// Die ganze Demo hängt an diesen Typen. Sie sind bewusst so geschnitten,
// wie eine echte Plattform sie auch hätte: Liga → Mannschaft → Spieler,
// Begegnung mit Einzelspielen, Tabelle als Ergebnis einer Rechnung. Wer
// später eine echte Quelle anschließt, tauscht die Erzeugung in
// `data/bedv/*` aus und lässt Typen und Oberfläche stehen.
//
// `demo: true` steht an jedem Datensatz, der frei erfunden ist. In dieser
// Demo ist das jeder einzelne — die bestehende BeDV-Seite war beim Bauen
// nicht abrufbar (Netzsperre der Session), es wurde deshalb NICHTS von dort
// übernommen und auch nichts aus dem Gedächtnis nachgebaut. Das Feld bleibt
// trotzdem im Typ: Sobald echte Ligadaten einfließen, steht dort `false`,
// und die Oberfläche kann beides auseinanderhalten.
// ============================================================

import type { Tag } from '@/lib/bedv/format';

export type SaisonTyp = 'winter' | 'sommer';

export interface Saison {
  id: string;
  /** „Winterliga 2026/27" */
  name: string;
  /** „Winter 26/27" — für enge Stellen */
  kurz: string;
  typ: SaisonTyp;
  /** Läuft diese Saison gerade? Genau eine Saison ist aktuell. */
  aktuell: boolean;
  demo: true;
}

export type LigaStufe = 'bezirksliga' | 'a' | 'b' | 'c';

export interface Liga {
  /** Adressbestandteil, z. B. „b1" → /bedv/ligen/b1 */
  slug: string;
  /** „B1-Liga" */
  name: string;
  /** „B1" — für Abzeichen und enge Tabellen */
  kurz: string;
  stufe: LigaStufe;
  /** 1 = höchste Spielklasse. Steuert Reihenfolge und Farbe. */
  ebene: number;
  saisonId: string;
  /** Ein Satz, der die Liga einordnet. */
  beschreibung: string;
  demo: true;
}

export interface Spielstaette {
  id: string;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  /** Anzahl Automaten — in der E-Dart-Liga die entscheidende Angabe. */
  automaten: number;
  demo: true;
}

export type Wertungsklasse = 'herren' | 'damen';

export interface Spieler {
  id: string;
  vorname: string;
  nachname: string;
  /** Voller Name — überall in der Oberfläche der Anzeigename. */
  name: string;
  /** Spitzname, sofern gepflegt. Nicht jeder hat einen. */
  spitzname?: string;
  teamId: string;
  ligaSlug: string;
  saisonId: string;
  passnummer: string;
  wertung: Wertungsklasse;
  /** Kapitän der Mannschaft? Genau einer je Team. */
  kapitaen: boolean;
  /** Initialen für den Avatar — es gibt keine Fotos in der Demo. */
  initialen: string;
  demo: true;
}

export interface Team {
  id: string;
  name: string;
  /** Kurzform für Tabellen auf schmalen Geräten. */
  kurz: string;
  ligaSlug: string;
  saisonId: string;
  spielstaetteId: string;
  /** Fester Spieltag der Heimspiele. */
  spieltag: string;
  /** „20:00" */
  beginn: string;
  gruendung: number;
  /** Zwei Farben für das gezeichnete Wappen (es gibt keine echten Logos). */
  farben: [string, string];
  demo: true;
}

/** Ein Einzelspiel innerhalb einer Begegnung. */
export interface Einzelspiel {
  nummer: number;
  /** „Einzel" oder „Doppel" */
  art: 'Einzel' | 'Doppel';
  heimSpielerIds: string[];
  gastSpielerIds: string[];
  /** Legs — das Einzelspiel geht über 3 Gewinnlegs. */
  heimLegs: number;
  gastLegs: number;
}

export type BegegnungStatus = 'geplant' | 'gespielt';

export interface Begegnung {
  id: string;
  saisonId: string;
  ligaSlug: string;
  spieltag: number;
  datum: Tag;
  /** „20:00" */
  uhrzeit: string;
  heimTeamId: string;
  gastTeamId: string;
  spielstaetteId: string;
  status: BegegnungStatus;
  /** Gewonnene Einzelspiele. Eine Begegnung geht über 18 Einzelspiele. */
  heimPunkte: number;
  gastPunkte: number;
  demo: true;
}

/** Eine Zeile der Ligatabelle — immer gerechnet, nie abgelegt. */
export interface TabellenZeile {
  platz: number;
  teamId: string;
  spiele: number;
  siege: number;
  unentschieden: number;
  niederlagen: number;
  /** Gewonnene Einzelspiele */
  spieleFuer: number;
  spieleGegen: number;
  differenz: number;
  punkte: number;
  /** Ergebnisse der letzten fünf Begegnungen, neueste zuerst. */
  form: ('S' | 'U' | 'N')[];
}

/** Eine Zeile der Einzelrangliste. */
export interface RanglistenZeile {
  platz: number;
  spielerId: string;
  teamId: string;
  ligaSlug: string;
  spiele: number;
  siege: number;
  niederlagen: number;
  legsFuer: number;
  legsGegen: number;
  /** Siegquote in Prozent, gerundet. */
  quote: number;
  punkte: number;
}

export interface HighlightZeile {
  platz: number;
  spielerId: string;
  teamId: string;
  ligaSlug: string;
  /** 180er-Anzahl, Finish-Höhe oder Darts im kürzesten Leg. */
  wert: number;
}

export interface Highlights {
  hundertachtziger: HighlightZeile[];
  einhunderteinundsiebzig: HighlightZeile[];
  highFinish: HighlightZeile[];
  shortLeg: HighlightZeile[];
}

export type PokalRunde = 'achtelfinale' | 'viertelfinale' | 'halbfinale' | 'finale';

export interface PokalPaarung {
  id: string;
  runde: PokalRunde;
  /** Position innerhalb der Runde — bestimmt die Lage im Turnierbaum. */
  position: number;
  heimTeamId: string | null;
  gastTeamId: string | null;
  hinspiel: { datum: Tag; heim: number; gast: number } | null;
  rueckspiel: { datum: Tag; heim: number; gast: number } | null;
  /** Wer ist weiter? `null`, solange nicht gespielt. */
  siegerTeamId: string | null;
  demo: true;
}

export interface NewsBeitrag {
  slug: string;
  titel: string;
  datum: Tag;
  kategorie: 'Ligabetrieb' | 'Pokal' | 'Verband' | 'Termine' | 'Digitales';
  teaser: string;
  /** Absätze. `**fett**` ist die einzige Auszeichnung. */
  absaetze: string[];
  /** Zwei Farben für das gezeichnete Beitragsbild. */
  bildFarben: [string, string];
  demo: true;
}

export interface Termin {
  slug: string;
  titel: string;
  datum: Tag;
  /** „19:00" — leer, wenn ganztägig. */
  uhrzeit?: string;
  ort: string;
  kategorie: 'Finale' | 'Turnier' | 'Verband' | 'Schulung' | 'Feier';
  beschreibung: string;
  /** Was der Knopf auf der Karte tut (nur Demo). */
  aktion: string;
  demo: true;
}

export interface Download {
  slug: string;
  titel: string;
  beschreibung: string;
  kategorie: 'Spielbetrieb' | 'Meldung' | 'Regelwerk' | 'Verband';
  dateityp: 'PDF' | 'DOCX' | 'XLSX';
  groesseKb: number;
  stand: Tag;
  demo: true;
}

export type DemoRolle = 'spieler' | 'kapitaen' | 'ligaleitung' | 'admin';

export interface Benachrichtigung {
  id: string;
  /** Für welche Rollen ist die Nachricht gedacht? */
  rollen: DemoRolle[];
  titel: string;
  text: string;
  /** Wie viele Tage ist sie alt? Das Datum entsteht daraus beim Rendern. */
  vorTagen: number;
  art: 'info' | 'aktion' | 'erfolg';
  /** Pfad ohne Präfix, z. B. '/mein-bereich/spielbericht'. */
  ziel?: string;
}
