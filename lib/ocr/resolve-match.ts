// ============================================================
// OCR — Begegnung aus dem Erkennungsergebnis ableiten
// ============================================================
//
// Wird genutzt, wenn der Kapitän die Partie NICHT vorab gewählt hat: aus den
// erkannten Team-Namen (+ Datum) wird die passende Begegnung im Spielplan
// vorgeschlagen. Eindeutig → direkt; mehrere/keine → Auswahl durch den Nutzer.
// Reine Logik (kein server-only): auch in der Prüfansicht (Client) nutzbar.
// ============================================================

import { MATCHES, resolveTeamFromName, type GameMatch } from '@/lib/data';
import type { MatchReportExtraction } from './schemas';

export interface MatchResolution {
  match: GameMatch | null;     // eindeutig bestimmt
  candidates: GameMatch[];     // mögliche Begegnungen (für die Auswahl)
}

export function matchLabel(m: GameMatch): string {
  const day = m.matchday ? `${m.matchday}. Sptg · ` : '';
  const date = m.date ? ` · ${new Date(m.date).toLocaleDateString('de-DE')}` : '';
  return `${day}${m.homeTeamName} – ${m.awayTeamName}${date}`;
}

export function resolveMatchFromExtraction(d: MatchReportExtraction): MatchResolution {
  const home = d.match.homeTeam ? resolveTeamFromName(d.match.homeTeam) : undefined;
  const guest = d.match.guestTeam ? resolveTeamFromName(d.match.guestTeam) : undefined;
  if (!home || !guest) return { match: null, candidates: [] };

  const candidates = MATCHES.filter(m =>
    (m.homeTeamId === home.id && m.awayTeamId === guest.id) ||
    (m.homeTeamId === guest.id && m.awayTeamId === home.id));

  if (d.match.date) {
    const byDate = candidates.filter(m => m.date === d.match.date);
    if (byDate.length === 1) return { match: byDate[0], candidates: byDate };
  }
  if (candidates.length === 1) return { match: candidates[0], candidates };
  return { match: null, candidates };
}
