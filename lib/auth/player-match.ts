// ============================================================
// Spieler-/Team-Erkennung bei Registrierung (Vorname + Nachname)
// ============================================================
//
// NUR Erkennung/Vorschlag — niemals automatische Rollen-/Rechtevergabe.
// Der Admin bestätigt die finale Verknüpfung (player_id/team_id) und Rolle.
// ============================================================

import { PLAYERS, TEAMS, getCurrentSeason, getPlayersForTeamInSeason } from '@/lib/data';

export type MatchConfidence = 'exact' | 'likely' | 'ambiguous' | 'none';

export interface MatchSuggestion {
  matchedPlayerId: string | null;
  matchedTeamId: string | null;
  confidence: MatchConfidence;
}

// ── Normalisierung ────────────────────────────────────────────

/** Normalisiert einen Namen robust: Umlaute, Kleinschreibung, Sonderzeichen. */
export function normalizePersonName(input: string): string {
  return (input ?? '')
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // restliche Diakritika
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// ── Spieler → Team (aktuelle Saison), einmal aufgebaut ───────

let playerTeamMap: Map<string, string> | null = null;
function getPlayerTeamMap(): Map<string, string> {
  if (playerTeamMap) return playerTeamMap;
  const season = getCurrentSeason();
  const m = new Map<string, string>();
  for (const team of TEAMS) {
    for (const { player } of getPlayersForTeamInSeason(team.id, season.id)) {
      if (!m.has(player.id)) m.set(player.id, team.id);
    }
  }
  playerTeamMap = m;
  return m;
}

/** Team-Slug des Spielers in der aktuellen Saison, oder null. */
export function getTeamForPlayer(playerId: string): string | null {
  return getPlayerTeamMap().get(playerId) ?? null;
}

// ── Matching ──────────────────────────────────────────────────

/** Alle Spieler, deren Vor- UND Nachname (normalisiert) exakt passen. */
export function findPlayerMatchesByName(firstName: string, lastName: string): string[] {
  const nf = normalizePersonName(firstName);
  const nl = normalizePersonName(lastName);
  if (!nf || !nl) return [];
  return PLAYERS
    .filter(p => normalizePersonName(p.firstName) === nf && normalizePersonName(p.lastName) === nl)
    .map(p => p.id);
}

/** Spieler, deren kompletter Name (normalisiert, ohne Vor/Nach-Trennung) passt. */
function findByFullName(firstName: string, lastName: string): string[] {
  const full = normalizePersonName(`${firstName} ${lastName}`);
  if (!full) return [];
  return PLAYERS
    .filter(p => normalizePersonName(`${p.firstName} ${p.lastName}`) === full)
    .map(p => p.id);
}

/**
 * Liefert einen Match-Vorschlag.
 *   exact     — Vor- und Nachname eindeutig 1 Spieler
 *   likely    — kompletter Name eindeutig (z. B. andere Trennung)
 *   ambiguous — mehrere Treffer → keine Verknüpfung
 *   none      — kein Treffer
 */
export function getRegistrationMatchSuggestion(firstName: string, lastName: string): MatchSuggestion {
  const exactIds = findPlayerMatchesByName(firstName, lastName);
  if (exactIds.length === 1) {
    return { matchedPlayerId: exactIds[0], matchedTeamId: getTeamForPlayer(exactIds[0]), confidence: 'exact' };
  }
  if (exactIds.length > 1) {
    return { matchedPlayerId: null, matchedTeamId: null, confidence: 'ambiguous' };
  }

  const fullIds = findByFullName(firstName, lastName);
  if (fullIds.length === 1) {
    return { matchedPlayerId: fullIds[0], matchedTeamId: getTeamForPlayer(fullIds[0]), confidence: 'likely' };
  }
  if (fullIds.length > 1) {
    return { matchedPlayerId: null, matchedTeamId: null, confidence: 'ambiguous' };
  }

  return { matchedPlayerId: null, matchedTeamId: null, confidence: 'none' };
}

export const MATCH_CONFIDENCE_LABELS: Record<MatchConfidence, string> = {
  exact:     'exakt',
  likely:    'wahrscheinlich',
  ambiguous: 'mehrdeutig',
  none:      'kein Treffer',
};
