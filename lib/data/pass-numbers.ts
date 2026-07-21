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
import { TEAMS } from './teams';
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
/** Block-Basis eines Teams aus dem statischen Bestand (historisch, 25/26):
 *  Modus der Hunderter der 4-stelligen Nummern (größter Cluster).
 *  null, wenn das Team keine 4-stellige Nummer hat (z. B. brandneu). */
export function staticTeamBlock(teamId: string): number | null {
  const clean = getPlayersForTeamInSeason(teamId, getCurrentSeason().id)
    .map(tp => parseLicenseNumber(tp.player.licenseNumber))
    .filter((n): n is number => n != null && n >= 1000 && n < 10000);
  if (!clean.length) return null;
  const cnt = new Map<number, number>();
  for (const n of clean) { const b = Math.floor(n / 100) * 100; cnt.set(b, (cnt.get(b) ?? 0) + 1); }
  return [...cnt.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
}

/** Alle von statischen Teams belegten 100er-Blöcke. */
function usedBlocks(): Set<number> {
  const s = new Set<number>();
  for (const t of TEAMS) { const b = staticTeamBlock(t.id); if (b != null) s.add(b); }
  return s;
}

/**
 * Nächster global freier 100er-Block (Basis 1000, 1100, …) für ein NEUES Team
 * ohne eigene Nummern. `extraUsedBlocks` für bereits (z. B. in der DB) belegte
 * Blöcke, die im statischen Bestand nicht auftauchen.
 */
export function nextFreeBlock(extraUsedBlocks: number[] = []): number {
  const used = usedBlocks();
  for (const b of extraUsedBlocks) used.add(b);
  for (let b = 1000; b < 100000; b += 100) if (!used.has(b)) return b;
  return 1000;
}

/**
 * Nächste Passnummer nach der Block-Systematik (Betreiber-Regel, ab 2026/2027):
 *   MDU XX YYYY — je Team ein 100er-Block, TC bevorzugt auf …01, sonst der
 *   nächste freie Platz im Block; global eindeutig.
 * `blockBase` kann explizit gesetzt werden (z. B. für ein neues DB-Team, dessen
 * freier Block dort ermittelt wird); sonst aus dem statischen Bestand abgeleitet,
 * andernfalls der nächste freie Block.
 * `seasonYear` steuert das Präfix (z. B. 2027 → „27"); Default = aktuelle Saison.
 */
export function generateNextPassNumber(
  teamId: string,
  opts: { seasonId?: string; seasonYear?: number; extraUsed?: number[]; isCaptain?: boolean; blockBase?: number } = {},
): GeneratedPass {
  const season = getCurrentSeason();
  const yy = String((opts.seasonYear ?? season.year) % 100).padStart(2, '0');
  const used = usedNumbers(opts.extraUsed ?? []);

  const B = opts.blockBase
    ?? staticTeamBlock(teamId)
    ?? nextFreeBlock((opts.extraUsed ?? []).map(n => Math.floor(n / 100) * 100));

  const mk = (n: number): GeneratedPass => ({ number: n, license: `MDU ${yy} ${n}` });
  // TC bevorzugt …01
  if (opts.isCaptain && !used.has(B + 1)) return mk(B + 1);
  for (let i = 1; i <= 99; i++) if (!used.has(B + i)) return mk(B + i);
  // Block voll → nächste global freie Nummer darüber (Notfall).
  let n = B + 100;
  while (used.has(n)) n++;
  return mk(n);
}
