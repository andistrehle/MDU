// ============================================================
// Server: OCR-Begegnungskontext + Erzeugung des digitalen Entwurfs
// ============================================================
//
// Baut den Validierungs-/Matching-Kontext aus den bekannten Stammdaten und
// legt aus dem geprüften OCR-Ergebnis einen digitalen Spielbericht als ENTWURF
// an (status='draft', source='ocr'). Schreibzugriffe via supabaseAdmin
// (service_role, server-only). Übernahme in Tabelle/Statistik passiert erst
// über den bestehenden Submit-/Bestätigungs-Workflow — hier nicht.
// ============================================================

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  MATCHES, findLeague, getPlayersForTeamInSeason, getPlayerDisplayName,
  getVenueForTeamInSeason, getCaptainForTeamInSeason, type GameMatch,
} from '@/lib/data';
import {
  computeTotals, type ReportHeaderDraft, type ReportPlayer, type ReportGame,
} from '@/lib/supabase/match-reports';
import type { OcrMatchContext } from '@/lib/ocr/provider';
import type { ParseContext } from '@/lib/ocr/parse-match-report';
import type { RosterCandidate } from '@/lib/ocr/match-players';

export function findMatch(id: string): GameMatch | null {
  return MATCHES.find(m => m.id === id) ?? null;
}

function roster(teamId: string, seasonId: string): RosterCandidate[] {
  return getPlayersForTeamInSeason(teamId, seasonId).map(({ player }) => ({
    id: player.id,
    name: getPlayerDisplayName(player),
    passNo: player.licenseNumber ?? null,
  }));
}

/** Provider- + Parse-Kontext für eine vorab gewählte Begegnung. */
export function buildOcrContext(match: GameMatch): { providerCtx: OcrMatchContext; parseCtx: ParseContext } {
  const seasonId = match.seasonId;
  const homeRoster = roster(match.homeTeamId, seasonId);
  const guestRoster = roster(match.awayTeamId, seasonId);
  const leagueLabel = findLeague(match.leagueId)?.name ?? match.leagueId;
  const venue = (getVenueForTeamInSeason(match.homeTeamId, seasonId) as { name?: string } | null)?.name ?? null;

  const providerCtx: OcrMatchContext = {
    season: seasonId,
    league: leagueLabel,
    matchday: match.matchday ?? null,
    date: match.date,
    venue,
    homeTeam: match.homeTeamName,
    guestTeam: match.awayTeamName,
    homeRoster: homeRoster.map(r => r.name),
    guestRoster: guestRoster.map(r => r.name),
  };

  const parseCtx: ParseContext = {
    homeTeamId: match.homeTeamId,
    guestTeamId: match.awayTeamId,
    homeTeamName: match.homeTeamName,
    guestTeamName: match.awayTeamName,
    seasonId,
    leagueLabel,
    matchday: match.matchday ?? null,
    matchDate: match.date,
    venue,
    homeRoster,
    guestRoster,
  };

  return { providerCtx, parseCtx };
}

export interface CreateDraftInput {
  header: ReportHeaderDraft;
  homePlayers: ReportPlayer[];
  guestPlayers: ReportPlayer[];
  games: ReportGame[];
  uploaderId: string;
  uploadId: string;
  ocrResultId: string;
}

/** Legt den OCR-Entwurf (match_reports + Kinder) via service_role an. */
export async function createOcrDraft(input: CreateDraftInput): Promise<{ id: string | null; error: string | null }> {
  if (!supabaseAdmin) return { id: null, error: 'Server-Storage/Service ist nicht konfiguriert.' };
  const { header, homePlayers, guestPlayers, games, uploaderId, uploadId, ocrResultId } = input;
  const totals = computeTotals(games);

  const { data, error } = await supabaseAdmin.from('match_reports').insert({
    season_id: header.season_id,
    league_label: header.league_label,
    matchday: header.matchday,
    match_date: header.match_date,
    venue: header.venue,
    home_team_id: header.home_team_id,
    guest_team_id: header.guest_team_id,
    home_team_name: header.home_team_name,
    guest_team_name: header.guest_team_name,
    tc_home: header.tc_home,
    tc_guest: header.tc_guest,
    protest: header.protest,
    protest_note: header.protest_note,
    highlights: header.highlights ?? [],
    home_captain_user_id: uploaderId,
    status: 'draft',
    source: 'ocr',
    ocr_upload_id: uploadId,
    ocr_result_id: ocrResultId,
    ocr_review_status: 'pending_review',
    ocr_processed_at: new Date().toISOString(),
    spiele_home: totals.spieleHome, spiele_guest: totals.spieleGuest,
    legs_home: totals.legsHome, legs_guest: totals.legsGuest,
    points_home: totals.pointsHome, points_guest: totals.pointsGuest,
  }).select('id').maybeSingle();

  if (error || !data) return { id: null, error: error?.message ?? 'Entwurf konnte nicht angelegt werden.' };
  const reportId = (data as { id: string }).id;

  const playerRows = [...homePlayers, ...guestPlayers]
    .filter(p => p.name.trim())
    .map(p => ({
      report_id: reportId, side: p.side, slot: p.slot, pass_no: p.pass_no || null,
      name: p.name.trim(), player_id: p.player_id || null,
      points: (p.side === 'home' ? totals.homePlayerPoints[p.slot] : totals.guestPlayerPoints[p.slot]) ?? 0,
    }));
  if (playerRows.length) {
    const { error: perr } = await supabaseAdmin.from('match_report_players').insert(playerRows);
    if (perr) return { id: reportId, error: perr.message };
  }

  const gameRows = games.map(g => ({
    report_id: reportId, game_no: g.game_no, game_type: g.game_type,
    home_slot: g.home_slot, guest_slot: g.guest_slot, home_slot2: g.home_slot2, guest_slot2: g.guest_slot2,
    legs_home: g.legs_home, legs_guest: g.legs_guest,
  }));
  const { error: gerr } = await supabaseAdmin.from('match_report_games').insert(gameRows);
  return { id: reportId, error: gerr?.message ?? null };
}
