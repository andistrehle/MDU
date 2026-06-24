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
import { dice } from './match-players';
import type { MatchReportExtraction } from './schemas';

export interface MatchResolution {
  match: GameMatch | null;     // eindeutig bestimmt (sicher genug für Auto-Zuordnung)
  candidates: GameMatch[];     // mögliche Begegnungen, beste zuerst (für die Auswahl)
}

export function matchLabel(m: GameMatch): string {
  const day = m.matchday ? `${m.matchday}. Sptg · ` : '';
  const date = m.date ? ` · ${new Date(m.date).toLocaleDateString('de-DE')}` : '';
  return `${day}${m.homeTeamName} – ${m.awayTeamName}${date}`;
}

/** Lockerer Vergleichsschlüssel für Team-Namen (klein, ohne Sonder-/Leerzeichen). */
function normTeam(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '');
}

/**
 * Plausibilität einer Begegnung gegenüber dem Erkennungsergebnis (0..~1.1):
 * Team-Namen (fuzzy, beide Aufstellungs-Richtungen) + Bonus für Spieltag/Datum.
 * Wird für die Vorauswahl der Begegnung genutzt (kein Auto-Commit).
 */
export function scoreMatchAgainstExtraction(m: GameMatch, d: MatchReportExtraction): number {
  const h = normTeam(d.match.homeTeam);
  const g = normTeam(d.match.guestTeam);
  const mh = normTeam(m.homeTeamName);
  const mg = normTeam(m.awayTeamName);

  let score = 0;
  const n = (h ? 1 : 0) + (g ? 1 : 0);
  if (n > 0) {
    const straight = (h ? dice(h, mh) : 0) + (g ? dice(g, mg) : 0);
    const swapped = (h ? dice(h, mg) : 0) + (g ? dice(g, mh) : 0);
    score += (Math.max(straight, swapped) / n) * 0.6;
  }
  if (d.match.matchday != null && m.matchday === d.match.matchday) score += 0.25;
  if (d.match.date && m.date === d.match.date) score += 0.25;
  return score;
}

export function resolveMatchFromExtraction(d: MatchReportExtraction): MatchResolution {
  const home = d.match.homeTeam ? resolveTeamFromName(d.match.homeTeam) : undefined;
  const guest = d.match.guestTeam ? resolveTeamFromName(d.match.guestTeam) : undefined;

  // 1) Exakte Team-Auflösung → sicher genug für automatische Zuordnung.
  if (home && guest) {
    const exact = MATCHES.filter(m =>
      (m.homeTeamId === home.id && m.awayTeamId === guest.id) ||
      (m.homeTeamId === guest.id && m.awayTeamId === home.id));
    if (d.match.date) {
      const byDate = exact.filter(m => m.date === d.match.date);
      if (byDate.length === 1) return { match: byDate[0], candidates: byDate };
    }
    if (exact.length === 1) return { match: exact[0], candidates: exact };
    if (exact.length > 1) {
      const ranked = [...exact].sort((a, b) => scoreMatchAgainstExtraction(b, d) - scoreMatchAgainstExtraction(a, d));
      return { match: null, candidates: ranked };
    }
  }

  // 2) Kein exakter Treffer (z. B. Handschrift) → plausible Begegnungen vorschlagen.
  if (d.match.homeTeam || d.match.guestTeam || d.match.matchday != null || d.match.date) {
    const scored = MATCHES
      .map(m => ({ m, s: scoreMatchAgainstExtraction(m, d) }))
      .filter(x => x.s >= 0.45)
      .sort((a, b) => b.s - a.s);
    if (scored.length) return { match: null, candidates: scored.slice(0, 6).map(x => x.m) };
  }
  return { match: null, candidates: [] };
}
