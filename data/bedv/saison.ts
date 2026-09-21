// ============================================================
// BeDV-Demo — Spielzeiten und Spieltagskalender
// ============================================================

import { heute, plusTage, tagesNummer, wochentagNummer, type Tag } from '@/lib/bedv/format';
import type { Saison } from './typen';

export const SAISONS: Saison[] = [
  {
    id: 'winter-2026-27',
    name: 'Winterliga 2026/27',
    kurz: 'Winter 26/27',
    typ: 'winter',
    aktuell: true,
    demo: true,
  },
  {
    id: 'sommer-2026',
    name: 'Sommerliga 2026',
    kurz: 'Sommer 26',
    typ: 'sommer',
    aktuell: false,
    demo: true,
  },
];

export const SAISON_AKTUELL = SAISONS.find(s => s.aktuell)!;
export const SAISON_ARCHIV = SAISONS.filter(s => !s.aktuell);

export function saisonById(id: string): Saison | undefined {
  return SAISONS.find(s => s.id === id);
}

/** Anzahl Spieltage einer Spielzeit (Hin- und Rückrunde). */
export function anzahlSpieltage(teams: number): number {
  return (teams - 1) * 2;
}

/**
 * Wie viele Spieltage der laufenden Saison sind im Kasten?
 *
 * Fest verdrahtet, damit die Demo immer mitten in der Spielzeit steht: volle
 * Tabellen, echte Formkurven, und trotzdem kommende Begegnungen für die
 * Karten „Nächste Spiele".
 */
export const GESPIELTE_SPIELTAGE = 9;

/**
 * Der Spieltagskalender wird RELATIV ZUM HEUTIGEN TAG gerechnet, nicht fest
 * abgelegt.
 *
 * Grund: Die Demo wird vorgeführt, und zwar irgendwann. Ein fest eingetragener
 * Spielplan wäre nach ein paar Wochen abgelaufen — „Nächste Spiele" stünde
 * dann voller Termine aus der Vergangenheit, und genau das ist der erste
 * Bildschirm, den der Gesprächspartner sieht.
 *
 * Anker ist der letzte Freitag, der nicht in der Zukunft liegt: Das ist der
 * zuletzt gespielte Spieltag (Nummer `GESPIELTE_SPIELTAGE`). Alles davor und
 * danach liegt im Wochenabstand.
 *
 * Preis dieser Lösung: Der erste Spieltag der laufenden Saison liegt dadurch
 * rechnerisch acht Wochen zurück, je nach Vorführtag also im Spätsommer. Für
 * eine Demo ist das der bessere Kompromiss — die Seiten, auf die es ankommt
 * (Startseite, Ergebnisse, nächster Spieltag), stimmen dafür immer.
 */
function letzterFreitag(bezug: Tag): Tag {
  const wt = wochentagNummer(bezug);          // 0 = So … 5 = Fr
  const zurueck = (wt - 5 + 7) % 7;           // Freitag = 5
  return plusTage(bezug, -zurueck);
}

/** Datum des n-ten Spieltags der laufenden Saison (1-basiert). */
export function spieltagDatum(spieltag: number, bezug: Tag = heute()): Tag {
  const anker = letzterFreitag(bezug);
  return plusTage(anker, (spieltag - GESPIELTE_SPIELTAGE) * 7);
}

/**
 * Datum des n-ten Spieltags einer abgeschlossenen Saison.
 *
 * Die Sommerliga liegt geschlossen hinter der laufenden Spielzeit: Ihr letzter
 * Spieltag war vier Wochen vor dem ersten Spieltag der Winterliga.
 */
export function spieltagDatumArchiv(
  spieltag: number,
  spieltageGesamt: number,
  bezug: Tag = heute(),
): Tag {
  const winterStart = spieltagDatum(1, bezug);
  const ende = plusTage(winterStart, -28);
  return plusTage(ende, -(spieltageGesamt - spieltag) * 7);
}

/** Der Spieltag, der als nächstes ansteht (oder `null`, wenn die Saison durch ist). */
export function naechsterSpieltag(spieltageGesamt: number): number | null {
  const n = GESPIELTE_SPIELTAGE + 1;
  return n <= spieltageGesamt ? n : null;
}

/** Nur für Sortierungen: stabile Reihenfolge über Saisons hinweg. */
export function saisonSortierwert(saisonId: string): number {
  return saisonId === SAISON_AKTUELL.id ? 0 : 1;
}

export { tagesNummer };
