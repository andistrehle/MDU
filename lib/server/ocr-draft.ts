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
import { NEUE_SAISON, spiele27AlsMatch, findLiga27, team27, venue27 } from '@/lib/data/saison-2027';
import { nominatedRosterRows } from '@/lib/supabase/season-teams';

/** Begegnung zur Kennung: 2026/27 („s27:Heim|Gast"), sonst die alte Spielliste. */
export function findMatch(id: string): GameMatch | null {
  return spiele27AlsMatch().find(m => m.id === id) ?? MATCHES.find(m => m.id === id) ?? null;
}

interface KaderServer { candidates: RosterCandidate[]; captain: string | null }

/** Kader: 2026/27 aus der DB (Anmeldung + Nachmeldungen), ältere Saisons statisch. */
async function roster(teamId: string, seasonId: string): Promise<KaderServer> {
  if (seasonId !== NEUE_SAISON.id || !supabaseAdmin) {
    return {
      candidates: getPlayersForTeamInSeason(teamId, seasonId).map(({ player }) => ({
        id: player.id, name: getPlayerDisplayName(player), passNo: player.licenseNumber ?? null,
      })),
      captain: getCaptainForTeamInSeason(teamId, seasonId),
    };
  }
  const { data } = await supabaseAdmin.from('season_roster_assignments')
    .select('first_name, last_name, license_number, is_captain, player_id')
    .eq('season_id', seasonId).eq('team_id', teamId);
  const rows = ((data ?? []) as { first_name: string | null; last_name: string | null; license_number: string | null; is_captain: boolean; player_id: string | null }[])
    .filter(r => r.player_id && `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim());
  const noms = await nominatedRosterRows(supabaseAdmin, seasonId, rows.map(r => r.player_id), teamId);
  const name = (f: string | null, l: string | null) => `${f ?? ''} ${l ?? ''}`.trim();
  return {
    candidates: [
      ...rows.map(r => ({ id: r.player_id!, name: name(r.first_name, r.last_name), passNo: r.license_number })),
      ...noms.map(n => ({ id: n.player_id, name: name(n.first_name, n.last_name), passNo: n.license_number })),
    ],
    captain: (() => { const c = rows.find(r => r.is_captain); return c ? name(c.first_name, c.last_name) : null; })(),
  };
}

/** Provider- + Parse-Kontext für eine vorab gewählte Begegnung. */
export async function buildOcrContext(match: GameMatch): Promise<{ providerCtx: OcrMatchContext; parseCtx: ParseContext }> {
  const seasonId = match.seasonId;
  const neu = seasonId === NEUE_SAISON.id;
  const [home, guest] = await Promise.all([roster(match.homeTeamId, seasonId), roster(match.awayTeamId, seasonId)]);
  const homeRoster = home.candidates, guestRoster = guest.candidates;
  const leagueLabel = neu ? (findLiga27(match.leagueId)?.name ?? match.leagueId) : (findLeague(match.leagueId)?.name ?? match.leagueId);
  const venue = neu
    ? (venue27(team27(match.homeTeamId)?.venueId)?.name ?? null)
    : ((getVenueForTeamInSeason(match.homeTeamId, seasonId) as { name?: string } | null)?.name ?? null);

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
    homeCaptain: home.captain,
    guestCaptain: guest.captain,
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

  // Eintragender = wer hochlädt (Heim ODER Gast). Bestätigen muss das andere Team.
  const { data: prof } = await supabaseAdmin.from('profiles').select('team_id').eq('id', uploaderId).maybeSingle();
  const uploaderTeam = (prof as { team_id: string | null } | null)?.team_id ?? null;
  const confirmTeam = uploaderTeam && uploaderTeam === header.guest_team_id ? header.home_team_id : header.guest_team_id;

  const row = {
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
  };
  let { data, error } = await supabaseAdmin.from('match_reports').insert({ ...row, confirm_team_id: confirmTeam }).select('id').maybeSingle();
  // Spalte confirm_team_id gibt es erst mit Migration 0042.
  if (error && /confirm_team_id/.test(error.message)) ({ data, error } = await supabaseAdmin.from('match_reports').insert(row).select('id').maybeSingle());

  if (error || !data) {
    const msg = error?.message ?? 'Entwurf konnte nicht angelegt werden.';
    return { id: null, error: /match_reports_fixture_uq|duplicate key/i.test(msg) ? 'Für diese Begegnung gibt es schon einen Spielbericht.' : msg };
  }
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
  const { parseCtx } = await buildOcrContext(params.match);
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
