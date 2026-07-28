// ============================================================
// Kader-Hinweis: 26/27-Liga (Auf-/Abstieg) + „war davor bei …"
// ============================================================
//
// Aus dem Vorsaison-Team eines Spielers abgeleitet. Für neue Spieler (nicht im
// statischen Bestand / keine Vorsaison-Zuordnung) wird ein leerer String
// zurückgegeben. Genutzt in der Anmeldungsprüfung und bei den Saison-Teams.
// ============================================================

import { getPredeterminedLeagueForTeam, findTeam } from '@/lib/data';
import { getTeamForPlayer } from '@/lib/auth/player-match';

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
