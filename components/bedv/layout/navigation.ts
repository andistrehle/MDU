// ============================================================
// BeDV-Demo — die Navigationspunkte an einer Stelle
// ============================================================
//
// Kopfzeile, „Mehr"-Blatt, untere Leiste und Fußzeile greifen auf dieselbe
// Liste zu. Wer eine Seite hinzufügt, trägt sie hier ein — sonst fehlt sie
// irgendwo, und genau das fällt in einer Vorführung auf.
// ============================================================

export interface NavPunkt {
  /** Pfad OHNE `/bedv`-Präfix. */
  pfad: string;
  label: string;
  /** Kurzform für die untere Leiste. */
  kurz?: string;
}

/** Was in der Kopfzeile Platz hat. */
export const HAUPT_NAV: NavPunkt[] = [
  { pfad: '/ligen', label: 'Ligen' },
  { pfad: '/ergebnisse', label: 'Ergebnisse' },
  { pfad: '/pokal', label: 'Pokal' },
  { pfad: '/news', label: 'News' },
  { pfad: '/events', label: 'Termine' },
];

/** Alles Weitere — hinter „Mehr". */
export const WEITERE_NAV: NavPunkt[] = [
  { pfad: '/teams', label: 'Mannschaften' },
  { pfad: '/spieler', label: 'Spieler' },
  { pfad: '/spielstaetten', label: 'Spielstätten' },
  { pfad: '/archiv', label: 'Archiv' },
  { pfad: '/downloads', label: 'Downloads' },
  { pfad: '/verband', label: 'Der Verband' },
  { pfad: '/kontakt', label: 'Kontakt' },
];

/**
 * Ist dieser Navigationspunkt gerade aktiv?
 *
 * Die Startseite braucht einen genauen Vergleich — mit `startsWith` wäre
 * sie auf jeder Unterseite mitmarkiert.
 */
export function istAktiv(pfad: string, aktuell: string): boolean {
  if (pfad === '/') return aktuell === '/';
  return aktuell === pfad || aktuell.startsWith(`${pfad}/`);
}
