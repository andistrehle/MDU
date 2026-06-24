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
import { parseMatchReport, type ParseContext } from '@/lib/ocr/parse-match-report';
import type { RosterCandidate } from '@/lib/ocr/match-players';
import type { ValidationIssue } from '@/lib/ocr/validate-match-report';
import type { MatchReportExtraction } from '@/lib/ocr/schemas';

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
    homeCaptain: getCaptainForTeamInSeason(match.homeTeamId, seasonId),
    guestCaptain: getCaptainForTeamInSeason(match.awayTeamId, seasonId),
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

/**
 * Parst ein gespeichertes OCR-Strukturergebnis gegen eine (jetzt bekannte)
 * Begegnung, schreibt die Felder, legt den Entwurf an und verknüpft alles.
 * Genutzt von der OCR-Route (Begegnung vorab/auto erkannt) und der assign-Route
 * (Begegnung nachträglich zugeordnet).
 */
export async function finalizeDraftFromStructured(params: {
  uploadId: string;
  ocrResultId: string;
  uploaderId: string;
  match: GameMatch;
  structured: MatchReportExtraction;
}): Promise<{ reportId: string | null; issues: ValidationIssue[]; status: 'completed' | 'needs_review'; error: string | null }> {
  if (!supabaseAdmin) return { reportId: null, issues: [], status: 'needs_review', error: 'Server-Service ist nicht konfiguriert.' };
  const { parseCtx } = buildOcrContext(params.match);
  const parsed = parseMatchReport(params.structured, parseCtx);

  if (parsed.fields.length) {
    await supabaseAdmin.from('match_report_ocr_fields').insert(parsed.fields.map(f => ({
      ocr_result_id: params.ocrResultId, field_key: f.fieldKey, detected_value: f.detectedValue,
      normalized_value: f.detectedValue, confidence: f.confidence,
      status: f.level === 'missing' ? 'unresolved' : 'detected',
    })));
  }

  const draft = await createOcrDraft({
    header: parsed.header, homePlayers: parsed.homePlayers, guestPlayers: parsed.guestPlayers,
    games: parsed.games, uploaderId: params.uploaderId, uploadId: params.uploadId, ocrResultId: params.ocrResultId,
  });
  if (draft.error || !draft.id) return { reportId: null, issues: parsed.issues, status: 'needs_review', error: draft.error ?? 'Entwurf konnte nicht angelegt werden.' };

  await supabaseAdmin.from('match_report_ocr_results').update({ match_report_id: draft.id }).eq('id', params.ocrResultId);

  const status: 'completed' | 'needs_review' = parsed.issues.some(i => i.level === 'error') ? 'needs_review' : 'completed';
  await supabaseAdmin.from('match_report_uploads').update({
    ocr_status: status, ocr_completed_at: new Date().toISOString(),
    match_id: params.match.id, match_report_id: draft.id,
  }).eq('id', params.uploadId);

  return { reportId: draft.id, issues: parsed.issues, status, error: null };
}
