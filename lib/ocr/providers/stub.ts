// ============================================================
// OCR-Provider: Stub (Testdaten, ohne Key/Kosten)
// ============================================================
//
// Erzeugt ein plausibles, deterministisches Erkennungsergebnis — damit der
// komplette Fluss (Upload → Erkennen → Prüfen → Zuordnen → Übernehmen) ohne
// echten Provider testbar ist. Mit Vorauswahl wird der Begegnungskontext
// genutzt; OHNE Vorauswahl wählt der Stub eine echte Beispiel-Begegnung samt
// Kader inkl. Pass-Nummern, damit auch Auto-Zuordnung und Pass-Nr.-Matching
// demonstrierbar sind. Aktivierung über OCR_PROVIDER=stub.
// ============================================================

import 'server-only';
import { GAME_SCHEDULE } from '@/lib/supabase/match-reports';
import { MATCHES, getPlayersForTeamInSeason, getPlayerDisplayName, findLeague, type GameMatch } from '@/lib/data';
import type { MatchReportExtraction, OcrPlayer, OcrGame } from '../schemas';
import type { OcrProvider, OcrInputPage, OcrMatchContext, OcrExtractionResult } from '../provider';

interface StubPlayer { name: string; passNo: string | null }

function lineup(players: StubPlayer[], prefix: 'H' | 'G'): OcrPlayer[] {
  return [1, 2, 3, 4].map(n => {
    const p = players[n - 1];
    return {
      position: `${prefix}${n}`,
      detectedName: p?.name ?? null,
      passNo: p?.passNo ?? null,
      confidence: p ? 0.86 : null,
    } satisfies OcrPlayer;
  });
}

function games(): OcrGame[] {
  return GAME_SCHEDULE.map((g, i) => {
    const homeWins = i % 3 !== 0;
    return {
      gameNo: g.no, type: g.type,
      homePositions: g.type === 'double' ? [] : [`H${g.homeSlot}`],
      guestPositions: g.type === 'double' ? [] : [`G${g.guestSlot}`],
      legsHome: homeWins ? 2 : (i % 2),
      legsGuest: homeWins ? (i % 2) : 2,
      confidence: 0.8,
    } satisfies OcrGame;
  });
}

function playersOf(teamId: string, seasonId: string): StubPlayer[] {
  return getPlayersForTeamInSeason(teamId, seasonId).slice(0, 4).map(({ player }) => ({
    name: getPlayerDisplayName(player),
    passNo: player.licenseNumber ?? null,
  }));
}

/** Beispiel-Begegnung mit mind. 4 Spielern je Team (für den „ohne Auswahl"-Test). */
function pickSampleMatch(): GameMatch | null {
  return MATCHES.find(m =>
    getPlayersForTeamInSeason(m.homeTeamId, m.seasonId).length >= 4 &&
    getPlayersForTeamInSeason(m.awayTeamId, m.seasonId).length >= 4) ?? MATCHES[0] ?? null;
}

export class StubProvider implements OcrProvider {
  readonly name = 'stub';

  async extract(_pages: OcrInputPage[], ctx: OcrMatchContext): Promise<OcrExtractionResult> {
    let header = {
      season: ctx.season, league: ctx.league, matchday: ctx.matchday, date: ctx.date,
      venue: ctx.venue, homeTeam: ctx.homeTeam, guestTeam: ctx.guestTeam,
      captainHome: null as string | null, captainGuest: null as string | null,
    };
    let homePlayers: StubPlayer[] = ctx.homeRoster.map(n => ({ name: n, passNo: null }));
    let guestPlayers: StubPlayer[] = ctx.guestRoster.map(n => ({ name: n, passNo: null }));

    // Keine Vorauswahl → Beispiel-Begegnung mit Pass-Nummern verwenden.
    if (!ctx.homeTeam) {
      const m = pickSampleMatch();
      if (m) {
        header = {
          season: m.seasonId, league: findLeague(m.leagueId)?.name ?? m.leagueId,
          matchday: m.matchday ?? null, date: m.date, venue: null,
          homeTeam: m.homeTeamName, guestTeam: m.awayTeamName, captainHome: null, captainGuest: null,
        };
        homePlayers = playersOf(m.homeTeamId, m.seasonId);
        guestPlayers = playersOf(m.awayTeamId, m.seasonId);
      }
    }

    const g = games();
    const home = g.filter(x => (x.legsHome ?? 0) > (x.legsGuest ?? 0)).length;
    const structured: MatchReportExtraction = {
      documentType: 'mdu_match_report',
      templateVersion: '1.0',
      match: header,
      homeLineup: lineup(homePlayers, 'H'),
      guestLineup: lineup(guestPlayers, 'G'),
      games: g,
      substitutions: [],
      highlights: [],
      finalScore: { home, guest: g.length - home, confidence: 0.75 },
      signatures: { homePresent: true, guestPresent: true },
      warnings: ['Testdaten (Stub-Provider) — kein echtes OCR. Bitte alle Werte prüfen.'],
    };
    return {
      rawText: 'STUB OCR – Beispiel-Erkennung.',
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
