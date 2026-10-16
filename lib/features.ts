// ============================================================
// Freischaltungen für Funktionen in Erprobung
// ============================================================
//
// „Team Manager“ (Deckname, vom Betreiber am 13.10.2026 festgelegt): Zu- und
// Absagen, Spieltag-Seite, Aufstellung, Treffzeit, Notizen/Aufgaben — soll als
// PREMIUM-Funktion angeboten werden, weitere Funktionen kommen dazu.
// Zu- und Absagen je Spieltag (/mein-team/zusagen): vom Betreiber am
// 12.10.2026 zunächst NUR für sein eigenes Team und die Ligaleitung
// freigegeben — wird überarbeitet, evtl. später als Premium-Funktion.
// Für alle anderen gibt es weder Kachel noch Hinweis, die Seite sagt
// „noch nicht freigeschaltet“ und die Glocke bleibt still.
// Freischalten = Team-ID hier ergänzen UND in der DB-Tabelle
// availability_enabled_teams (Migration 0043) — die DB sperrt das Schreiben.
// ============================================================

import { hasMinRole, type UserProfile } from '@/lib/auth/roles';

export const ZUSAGEN_TEAMS: readonly string[] = ['freibad-bazis'];

export const zusagenFuerTeam = (teamId: string | null | undefined) => !!teamId && ZUSAGEN_TEAMS.includes(teamId);

export function zusagenFreigeschaltet(user: Pick<UserProfile, 'role' | 'teamId'> | null | undefined): boolean {
  if (!user) return false;
  return zusagenFuerTeam(user.teamId) || hasMinRole(user as UserProfile, 'league_admin');
}

/**
 * Druckvorlagen „Für die TC-Sitzung drucken“ unter Mein Spielplan (Team-Blatt,
 * Masterplan). Vom Betreiber am 16.10.2026 ausgeblendet — die TC-Sitzung
 * 2026/27 ist vorbei. Code bleibt; zur nächsten Saison wieder auf true.
 * Die Ligaleitung druckt weiter im Admin-Bereich.
 */
export const TC_SITZUNG_DRUCK = false;
