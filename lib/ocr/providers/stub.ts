// ============================================================
// OCR-Provider: Stub (Testdaten, ohne Key/Kosten)
// ============================================================
//
// Erzeugt ein plausibles, deterministisches Erkennungsergebnis aus dem
// bekannten Begegnungskontext — damit der komplette Fluss (Upload → Erkennen →
// Prüfen → Übernehmen) ohne echten Provider im Preview testbar ist.
// Aktivierung über OCR_PROVIDER=stub. Markiert sich selbst als unsicher.
// ============================================================

import 'server-only';
import { GAME_SCHEDULE } from '@/lib/supabase/match-reports';
import type { MatchReportExtraction, OcrPlayer, OcrGame } from '../schemas';
import type { OcrProvider, OcrInputPage, OcrMatchContext, OcrExtractionResult } from '../provider';

function lineup(roster: string[], prefix: 'H' | 'G'): OcrPlayer[] {
  return [1, 2, 3, 4].map(n => ({
    position: `${prefix}${n}`,
    detectedName: roster[n - 1] ?? null,
    passNo: null,
    confidence: roster[n - 1] ? 0.86 : null,
  }));
}

function games(): OcrGame[] {
  // Deterministische Beispiel-Ergebnisse; Doppel-Positionen bleiben offen.
  return GAME_SCHEDULE.map((g, i) => {
    const homeWins = i % 3 !== 0;
    return {
      gameNo: g.no,
      type: g.type,
      homePositions: g.type === 'double' ? [] : [`H${g.homeSlot}`],
      guestPositions: g.type === 'double' ? [] : [`G${g.guestSlot}`],
      legsHome: homeWins ? 2 : (i % 2),
      legsGuest: homeWins ? (i % 2) : 2,
      confidence: 0.8,
    } satisfies OcrGame;
  });
}

export class StubProvider implements OcrProvider {
  readonly name = 'stub';

  async extract(_pages: OcrInputPage[], ctx: OcrMatchContext): Promise<OcrExtractionResult> {
    const g = games();
    const home = g.filter(x => (x.legsHome ?? 0) > (x.legsGuest ?? 0)).length;
    const structured: MatchReportExtraction = {
      documentType: 'mdu_match_report',
      templateVersion: '1.0',
      match: {
        season: ctx.season, league: ctx.league, matchday: ctx.matchday, date: ctx.date,
        venue: ctx.venue, homeTeam: ctx.homeTeam, guestTeam: ctx.guestTeam,
        captainHome: null, captainGuest: null,
      },
      homeLineup: lineup(ctx.homeRoster, 'H'),
      guestLineup: lineup(ctx.guestRoster, 'G'),
      games: g,
      substitutions: [],
      highlights: [],
      finalScore: { home, guest: g.length - home, confidence: 0.75 },
      signatures: { homePresent: true, guestPresent: true },
      warnings: ['Testdaten (Stub-Provider) — kein echtes OCR. Bitte alle Werte prüfen.'],
    };
    return {
      rawText: 'STUB OCR – Beispiel-Erkennung aus dem Begegnungskontext.',
      structuredData: structured,
      fields: [],
      confidence: 0.78,
      warnings: structured.warnings,
      provider: this.name,
      modelVersion: 'stub-1',
      providerRequestId: null,
    };
  }
}
