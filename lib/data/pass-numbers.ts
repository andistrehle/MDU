// ============================================================
// Passnummern-Vergabe für nachgemeldete Spieler
// ============================================================
//
// Regel (vom Betreiber festgelegt): Passnummern der Teamkollegen auslesen,
// die höchste + 1 nehmen und die nächste GLOBAL freie Nummer wählen.
//
// WICHTIG (Ehrlichkeitsprinzip): Offiziell vergibt die dartunion die
// Passnummern. Die hier erzeugte Nummer ist daher ausdrücklich VORLÄUFIG
// und von der Ligaleitung überschreibbar, bis die offizielle Nummer vorliegt.
// ============================================================

import { PLAYERS } from './players';
import { getPlayersForTeamInSeason } from './assignments';
import { getCurrentSeason } from './seasons';

/** Numerischen Teil einer Passnummer lesen, z. B. "MDU 26 3701" → 3701. */
export function parseLicenseNumber(license?: string | null): number | null {
  if (!license) return null;
  const groups = license.match(/\d+/g);
  if (!groups || groups.length === 0) return null;
  const n = parseInt(groups[groups.length - 1], 10); // letzte Gruppe = laufende Nummer
  return Number.isFinite(n) ? n : null;
}

/** Alle im bekannten Bestand vergebenen Nummern (für die „frei?"-Prüfung). */
function usedNumbers(extra: number[] = []): Set<number> {
  const s = new Set<number>();
  for (const p of PLAYERS) { const n = parseLicenseNumber(p.licenseNumber); if (n != null) s.add(n); }
  for (const n of extra) s.add(n);
  return s;
}

/** Slug für einen neu angelegten Spieler (kollidiert nicht mit dem statischen Bestand). */
export function nominationPlayerSlug(firstName: string, lastName: string, number: number): string {
  const base = `${firstName} ${lastName}`
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base || 'spieler'}-${number}`;
}

export interface GeneratedPass {
  /** Laufende Nummer. */
  number: number;
  /** Formatierte Passnummer, z. B. "MDU 26 3715". */
  license: string;
}

/**
 * Nächste freie Passnummer für ein Team: höchste Nummer der Teamkollegen + 1,
 * dann so lange hochzählen, bis eine global freie Nummer gefunden ist.
 *
 * @param extraUsed zusätzlich schon vergebene Nummern (z. B. aus früheren
 *                  Nachmeldungen), damit es keine Doppelvergabe gibt.
 */
export function generateNextPassNumber(
  teamId: string,
  opts: { seasonId?: string; extraUsed?: number[] } = {},
): GeneratedPass {
  const season = getCurrentSeason();
  const seasonId = opts.seasonId ?? season.id;
  const extraUsed = opts.extraUsed ?? [];

  const teamNumbers = getPlayersForTeamInSeason(teamId, seasonId)
    .map(tp => parseLicenseNumber(tp.player.licenseNumber))
    .filter((n): n is number => n != null);

  const used = usedNumbers(extraUsed);

  // Basis: höchste Team-Nummer (Regel „Teamkollege + 1"). Ohne Teamkollegen
  // (z. B. brandneues Team) NICHT über den kompletten Bestand, sondern nur über
  // die MDU-lokale 4-stellige Serie — sonst würden vereinzelte große DSB-Nummern
  // (z. B. „MDU 115006") die Basis nach oben ziehen und neue Spieler bekämen
  // 6-stellige Nummern. Die großen Nummern bleiben aber für die Kollisionsprüfung
  // (used) berücksichtigt.
  const LOCAL_SERIES_MAX = 9999; // MDU-lokale Passnummern sind 4-stellig
  const localUsed = [...used].filter(n => n <= LOCAL_SERIES_MAX);
  const base = teamNumbers.length
    ? Math.max(...teamNumbers)
    : (localUsed.length ? Math.max(...localUsed) : 0);

  let next = base + 1;
  while (used.has(next)) next++;

  const seasonShort = String(season.year % 100).padStart(2, '0');
  return { number: next, license: `MDU ${seasonShort} ${next}` };
}
