// ============================================================
// MDC — Rohzeilen der Endrangliste einlesen
// ============================================================
//
// Eine Zeile der offiziellen Auswertung sieht so aus:
//
//   'Platz|Name|Vorname|Anzahl TN|Punkte|%|Trend'
//
// Hier wird sie in Strukturen übersetzt, aus denen sich BEIDES speist:
// der Spielerstamm (`players.ts`) und die Endrangliste (`ranking-final.ts`).
// Beide greifen auf dieselbe Quelle zu — ein Spieler kann also gar nicht in
// der Rangliste stehen und im Stamm fehlen.
//
// Abgeleitet statt gepflegt (und damit nicht falsch pflegbar):
//   • Schnitt   = Punkte / Anzahl TN
//   • Euro      = EZR-Betrag × Prozentsatz
//   • Spieler-ID = Slug aus Vor- und Nachname (bei Namensgleichheit + Passnr.)
// ============================================================

import type { Division, Trend } from './types';
import { slugify, titleCase, venueFromSurname } from '@/lib/mdc/names';

export interface ParsedRow {
  rank: number;
  sharedRank: boolean;
  passNr: number;
  lastName: string;
  firstName: string;
  nickname: string | null;
  tournaments: number;
  points: number;
  payoutPercent: number | null;
  trend: Trend;
  division: Division;
  playerId: string;
  homeVenueId: string | null;
}

/**
 * Dieselbe Person, in zwei Auswertungen unterschiedlich geschrieben. Ohne
 * diese Tabelle würde aus einem Menschen versehentlich zwei — die Spieler-ID
 * entsteht aus dem Namen.
 *
 *   53  „Schul Micky" (25/26) ↔ „Schul Mikky" (Sommer)
 *  153  „Pogremino Jimmy" (25/26) ↔ „Pogremno Jimmy" (Sommer)
 *  312  „Machete Reinhold" (25/26, unter dem Lokalnamen) ↔ „Behrend Reinhold"
 *
 * Für 53 und 153 gilt die Schreibweise der großen Saison-Auswertung, für 312
 * der echte Nachname aus dem Sommer-Ranking.
 */
const CANONICAL_NAMES: Record<number, { lastName: string; firstName: string }> = {
  53: { lastName: 'SCHUL', firstName: 'MICKY' },
  153: { lastName: 'POGREMINO', firstName: 'JIMMY' },
  312: { lastName: 'BEHREND', firstName: 'REINHOLD' },
};

/**
 * Passnummern, die in beiden Auswertungen auf verschiedene Menschen zeigen.
 * Sie werden NICHT zusammengeführt — beide bleiben eigene Spieler, und die
 * Oberfläche weist die Doppelbelegung aus. Was hier stimmt, muss der
 * Betreiber klären; geraten wird nicht.
 */
export const CONFLICTING_PASS_NUMBERS = [84, 303];

function parseTrend(raw: string | undefined): Trend {
  if (raw === 'u') return 'up';
  if (raw === 'd') return 'down';
  return 'same';
}

/** „MARKUS (JACKY)" → { firstName: 'Markus', nickname: 'Jacky' } */
function splitFirstName(raw: string): { firstName: string; nickname: string | null } {
  const match = raw.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!match) return { firstName: titleCase(raw), nickname: null };
  return { firstName: titleCase(match[1]), nickname: titleCase(match[2]) };
}

export function parseRankingRows(rawLines: string[], division: Division): ParsedRow[] {
  const usedIds = new Set<string>();
  let lastRank = 0;

  return rawLines.map(line => {
    const [rankRaw, passRaw, nameRaw, firstRaw, tnRaw, pointsRaw, percentRaw, trendRaw] =
      line.split('|');

    // Leerer Platz = punktgleich mit der Zeile darüber.
    const sharedRank = rankRaw.trim() === '';
    const rank = sharedRank ? lastRank : Number(rankRaw);
    lastRank = rank;

    const passNr = Number(passRaw);
    const canonical = CANONICAL_NAMES[passNr];
    const lastName = titleCase(canonical?.lastName ?? nameRaw);
    const { firstName, nickname } = splitFirstName(canonical?.firstName ?? firstRaw);

    // ID aus dem Namen; nur bei echter Namensgleichheit kommt die Passnummer dazu.
    const base = slugify(`${firstName} ${lastName}`);
    const playerId = usedIds.has(base) ? `${base}-${passNr}` : base;
    usedIds.add(playerId);

    return {
      rank,
      sharedRank,
      passNr,
      lastName,
      firstName,
      nickname,
      tournaments: Number(tnRaw),
      points: Number(pointsRaw),
      payoutPercent: percentRaw ? Number(percentRaw) : null,
      trend: parseTrend(trendRaw),
      division,
      playerId,
      homeVenueId: venueFromSurname(nameRaw),
    };
  });
}
