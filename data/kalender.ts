// ============================================================
// MDC — Änderungen am Wochenplan
// ============================================================
//
// GESCHRIEBEN VON DER SEITE SELBST. Die Turnierleitung pflegt das unter
// `/admin/kalender`, von dort wird diese Datei als Commit abgelegt
// (`lib/mdc/kalender-commit.ts`) — genau wie News und Ergebnisse. Von Hand
// bearbeiten ist erlaubt, es ist eine gewöhnliche Datei; nur die Form muss
// stimmen, weil die Verwaltung sie wieder einliest.
//
// Der Wochenplan selbst steht NICHT hier, sondern in den Spielorten: Jedes
// Lokal hat seinen festen Wochentag und seine Uhrzeit, daraus rechnet
// `playDaysFrom` den Plan (`data/venues.ts`). Das kann nicht veralten.
//
// Hier stehen nur die Abweichungen davon, und zwar genau zwei Sorten:
//
//   ABSAGE   An diesem Tag findet im Lokal X kein Ranking statt. Der Termin
//            verschwindet nicht stillschweigend, sondern wird durchgestrichen
//            gezeigt — wer schon hinfahren wollte, soll den Grund sehen.
//
//   ZUSATZ   An diesem Tag gibt es im Lokal X ein Ranking, obwohl dort sonst
//            nicht gespielt wird. Deckt beides ab: das Lokal, das für ein
//            ausgefallenes einspringt, und das spontane Turnier am Freitag,
//            Samstag oder Sonntag.
//
// Der Spielort ist immer eines der elf MDC-Lokale — freie Eingabe gibt es
// bewusst nicht. Gespielt wird nur dort, und ein hingeschriebener Name hätte
// keine Adresse, keine Karte und keine Spielort-Seite.
//
// Vergangene Einträge bleiben stehen: Sie erklären, warum an einem Tag etwas
// anders war als im Plan. Wegräumen kann die Verwaltung sie jederzeit.
// ============================================================

export type TerminArt = 'absage' | 'zusatz';

export interface Terminaenderung {
  /** Sprechende Kennung: „2026-09-10-fiakerstueberl-absage". */
  id: string;
  /** Tag der Änderung, `JJJJ-MM-TT`. */
  date: string;
  /** Eines der elf Lokale (`data/venues.ts`). */
  venueId: string;
  art: TerminArt;
  /**
   * Uhrzeit `HH:MM` — nur bei einem Zusatztermin nötig, weil der nicht die
   * Standardzeit des Lokals haben muss. Bei einer Absage `null`.
   */
  time: string | null;
  /** Kurzer Hinweis, z. B. „Wirt hat zu" oder „Vertretung fürs Fiakerstüberl". */
  note: string | null;
}

export const KALENDER: Terminaenderung[] = [
  {
    "id": "2026-09-08-legendary-zusatz",
    "date": "2026-09-08",
    "venueId": "legendary",
    "art": "zusatz",
    "time": "20:00",
    "note": null
  },
  {
    "id": "2026-09-10-fiakerstueberl-absage",
    "date": "2026-09-10",
    "venueId": "fiakerstueberl",
    "art": "absage",
    "time": null,
    "note": "Toni im Urlaub"
  },
  {
    "id": "2026-09-10-siebziger-zusatz",
    "date": "2026-09-10",
    "venueId": "siebziger",
    "art": "zusatz",
    "time": "19:30",
    "note": "Vertretung Fiaker Stüberl"
  },
  {
    "id": "2026-09-17-fiakerstueberl-absage",
    "date": "2026-09-17",
    "venueId": "fiakerstueberl",
    "art": "absage",
    "time": null,
    "note": "Wg Urlaub"
  },
  {
    "id": "2026-09-17-siebziger-zusatz",
    "date": "2026-09-17",
    "venueId": "siebziger",
    "art": "zusatz",
    "time": "19:30",
    "note": "Vertretung Fiakerstüberl"
  }
];

/** Alle Änderungen an einem Tag. */
export function aenderungenAm(date: string): Terminaenderung[] {
  return KALENDER.filter(t => t.date === date);
}

/** Fällt das Ranking an diesem Tag in diesem Lokal aus? */
export function faelltAus(date: string, venueId: string): Terminaenderung | undefined {
  return KALENDER.find(t => t.date === date && t.venueId === venueId && t.art === 'absage');
}

/** Zusatztermine an einem Tag, nach Uhrzeit. */
export function zusatzAm(date: string): Terminaenderung[] {
  return KALENDER
    .filter(t => t.date === date && t.art === 'zusatz')
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
}

/** Änderungen ab einem Datum, älteste zuerst — für die Verwaltung. */
export function aenderungenAb(fromIso: string): Terminaenderung[] {
  return KALENDER
    .filter(t => t.date >= fromIso)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

/** Gibt es überhaupt Änderungen? Die Oberfläche schaltet sich danach. */
export const HAS_KALENDER = KALENDER.length > 0;
