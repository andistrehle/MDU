// ============================================================
// Kader-Hinweis: 26/27-Liga (Auf-/Abstieg) + „war davor bei …"
// ============================================================
//
// Aus dem Vorsaison-Team eines Spielers abgeleitet. Für neue Spieler (nicht im
// statischen Bestand / keine Vorsaison-Zuordnung) wird ein leerer String
// zurückgegeben. Genutzt in der Anmeldungsprüfung und bei den Saison-Teams.
// ============================================================

import {
  getPredeterminedLeagueForTeam,
  findTeam,
  isLeagueDowngrade,
  MAIN_LEAGUE_LABELS,
  type MainLeague,
} from '@/lib/data';
import { getTeamForPlayer } from '@/lib/auth/player-match';

/**
 * Neuer Spieler = keine Vorsaison-Zuordnung (oder noch gar kein Profil). Für diese
 * gibt es keinen Liga-Hinweis; stattdessen kann „neu" angezeigt werden.
 */
export function isNewPlayer(playerId: string | null | undefined): boolean {
  if (!playerId) return true;
  return !getTeamForPlayer(playerId);
}

export function playerLeagueHint(playerId: string | null | undefined, currentTeamId: string | null | undefined): string {
  if (!playerId) return '';
  const lastTeam = getTeamForPlayer(playerId);
  if (!lastTeam) return '';                     // neuer Spieler → kein Hinweis
  const league = getPredeterminedLeagueForTeam(lastTeam)?.label ?? null;
  const changed = currentTeamId ? lastTeam !== currentTeamId : true;
  let s = league ? `, ${league}` : '';
  if (changed) s += ` (war davor bei ${findTeam(lastTeam)?.name ?? lastTeam})`;
  return s;
}

/**
 * Vorbestimmte 26/27-Liga eines Spielers, abgeleitet aus seinem Vorsaison-Team.
 * Null für neue Spieler ohne Vorsaison-Zuordnung.
 */
export function playerPredeterminedLeague(playerId: string | null | undefined): MainLeague | null {
  if (!playerId) return null;
  const lastTeam = getTeamForPlayer(playerId);
  if (!lastTeam) return null;
  return getPredeterminedLeagueForTeam(lastTeam)?.league ?? null;
}

export interface MajorityHigherLeague {
  /** Häufigste höhere Liga unter den betroffenen Spielern. */
  league: MainLeague;
  label: string;
  /** Kaderspieler, die eigentlich höher spielen sollten. */
  count: number;
  /** Gesamtzahl der Kaderspieler (Basis für die 50-%-Schwelle). */
  total: number;
}

/**
 * Prüft, ob mehr als die Hälfte der Kaderspieler laut Auf-/Abstieg der Vorsaison
 * eigentlich in einer HÖHEREN Liga als der gewählten spielen müsste. Neue Spieler
 * (ohne Vorsaison-Zuordnung) zählen mit in die Gesamtzahl, aber nicht als „höher".
 * Gibt die häufigste betroffene höhere Liga zurück – oder null, wenn die Schwelle
 * nicht überschritten wird.
 */
export function majorityHigherLeague(
  players: { player_id?: string | null }[],
  chosen: MainLeague | null | undefined,
): MajorityHigherLeague | null {
  const total = players.length;
  if (!chosen || total === 0) return null;

  const higher: MainLeague[] = [];
  for (const p of players) {
    const lg = playerPredeterminedLeague(p.player_id);
    if (!lg) continue;                          // neuer/unbekannter Spieler
    if (isLeagueDowngrade(chosen, lg)) higher.push(lg); // gewählt < vorbestimmt ⇒ gehört höher
  }
  if (higher.length * 2 <= total) return null;  // nicht > 50 %

  const counts = new Map<MainLeague, number>();
  for (const lg of higher) counts.set(lg, (counts.get(lg) ?? 0) + 1);
  let best = higher[0];
  let bestN = 0;
  for (const [lg, n] of counts) if (n > bestN) { best = lg; bestN = n; }

  return { league: best, label: MAIN_LEAGUE_LABELS[best], count: higher.length, total };
}
