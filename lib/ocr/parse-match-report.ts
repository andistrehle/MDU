// ============================================================
// OCR — erkanntes Ergebnis → digitaler Spielbericht (Review-Modell)
// ============================================================
//
// Überführt das Provider-Ergebnis (MatchReportExtraction) in die Strukturen
// des bestehenden digitalen Bogens (ReportHeaderDraft/ReportPlayer/ReportGame/
// HighlightEntry), gleicht Namen mit dem Kader ab und sammelt Feld-Status +
// Validierungshinweise für die Prüfansicht. Erfindet nichts; unsichere
// Zuordnungen bleiben offen.
// ============================================================

import { GAME_SCHEDULE,
  type ReportHeaderDraft, type ReportPlayer, type ReportGame, type HighlightEntry } from '@/lib/supabase/match-reports';
import type { MatchReportExtraction } from './schemas';
import { matchPlayerName, type RosterCandidate, type NameMatch } from './match-players';
import { validateExtraction, type ValidationIssue } from './validate-match-report';

export type FieldLevel = 'ok' | 'review' | 'missing';

export interface OcrFieldRow {
  fieldKey: string;
  label: string;
  detectedValue: string | null;
  confidence: number | null;
  level: FieldLevel;
}

export interface PlayerMatchRow {
  side: 'home' | 'guest';
  slot: number;
  detected: string | null;
  match: NameMatch;
}

export interface ParseContext {
  homeTeamId: string | null;
  guestTeamId: string | null;
  homeTeamName: string;
  guestTeamName: string;
  seasonId: string | null;
  leagueLabel: string | null;
  matchday: number | null;
  matchDate: string | null;
  venue: string | null;
  homeRoster: RosterCandidate[];
  guestRoster: RosterCandidate[];
}

export interface ParsedMatchReport {
  header: ReportHeaderDraft;
  homePlayers: ReportPlayer[];
  guestPlayers: ReportPlayer[];
  games: ReportGame[];
  highlights: HighlightEntry[];
  playerMatches: PlayerMatchRow[];
  fields: OcrFieldRow[];
  issues: ValidationIssue[];
}

const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];

function positionToSlot(pos: string | null | undefined): number | null {
  if (!pos) return null;
  const m = /^[HG](\d)$/i.exec(pos.trim());
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 8 ? n : null;
}

function levelFromConfidence(c: number | null, hasValue: boolean): FieldLevel {
  if (!hasValue) return 'missing';
  if (c == null) return 'review';
  if (c >= 0.9) return 'ok';
  if (c >= 0.7) return 'review';
  return 'missing';
}

export function parseMatchReport(data: MatchReportExtraction, ctx: ParseContext): ParsedMatchReport {
  const playerMatches: PlayerMatchRow[] = [];

  function buildPlayers(side: 'home' | 'guest'): ReportPlayer[] {
    const roster = side === 'home' ? ctx.homeRoster : ctx.guestRoster;
    const lineup = side === 'home' ? data.homeLineup : data.guestLineup;
    return SLOTS.map(slot => {
      const det = lineup.find(p => positionToSlot(p.position) === slot);
      const name = det?.detectedName ?? '';
      const m = matchPlayerName(name || null, roster);
      if (name) playerMatches.push({ side, slot, detected: name, match: m });
      return {
        side, slot,
        pass_no: det?.passNo ?? '',
        name: (m.status === 'certain' ? m.matchedName : null) ?? name ?? '',
        player_id: m.status === 'certain' ? m.matchedPlayerId : null,
        points: 0,
      } satisfies ReportPlayer;
    });
  }

  const homePlayers = buildPlayers('home');
  const guestPlayers = buildPlayers('guest');

  const games: ReportGame[] = GAME_SCHEDULE.map(s => {
    const det = data.games.find(g => g.gameNo === s.no);
    const homeSlots = (det?.homePositions ?? []).map(positionToSlot).filter((x): x is number => x != null);
    const guestSlots = (det?.guestPositions ?? []).map(positionToSlot).filter((x): x is number => x != null);
    return {
      game_no: s.no,
      game_type: s.type,
      home_slot: s.type === 'single' ? (homeSlots[0] ?? s.homeSlot ?? null) : (homeSlots[0] ?? null),
      guest_slot: s.type === 'single' ? (guestSlots[0] ?? s.guestSlot ?? null) : (guestSlots[0] ?? null),
      home_slot2: s.type === 'double' ? (homeSlots[1] ?? null) : null,
      guest_slot2: s.type === 'double' ? (guestSlots[1] ?? null) : null,
      legs_home: det?.legsHome ?? null,
      legs_guest: det?.legsGuest ?? null,
    } satisfies ReportGame;
  });

  const highlights: HighlightEntry[] = data.highlights.flatMap(h => {
    const slot = positionToSlot(h.position);
    if (slot == null) return [];
    return [{ side: h.side, slot, type: h.type, value: h.value }];
  });

  const header: ReportHeaderDraft = {
    season_id: ctx.seasonId,
    league_label: ctx.leagueLabel ?? data.match.league ?? '',
    matchday: ctx.matchday ?? data.match.matchday ?? null,
    match_date: ctx.matchDate ?? data.match.date ?? null,
    venue: ctx.venue ?? data.match.venue ?? '',
    home_team_id: ctx.homeTeamId,
    guest_team_id: ctx.guestTeamId,
    home_team_name: ctx.homeTeamName,
    guest_team_name: ctx.guestTeamName,
    tc_home: data.match.captainHome ?? '',
    tc_guest: data.match.captainGuest ?? '',
    protest: false,
    protest_note: '',
    highlights,
  };

  // ── Feld-Flachliste für die Prüfansicht ──────────────────────
  const m = data.match;
  const fields: OcrFieldRow[] = [
    { fieldKey: 'match.homeTeam', label: 'Heimmannschaft', detectedValue: m.homeTeam, confidence: null, level: levelFromConfidence(null, !!m.homeTeam) },
    { fieldKey: 'match.guestTeam', label: 'Gastmannschaft', detectedValue: m.guestTeam, confidence: null, level: levelFromConfidence(null, !!m.guestTeam) },
    { fieldKey: 'match.league', label: 'Liga', detectedValue: m.league, confidence: null, level: levelFromConfidence(null, !!m.league) },
    { fieldKey: 'match.matchday', label: 'Spieltag', detectedValue: m.matchday != null ? String(m.matchday) : null, confidence: null, level: levelFromConfidence(null, m.matchday != null) },
    { fieldKey: 'match.date', label: 'Datum', detectedValue: m.date, confidence: null, level: levelFromConfidence(null, !!m.date) },
    { fieldKey: 'finalScore', label: 'Gesamtergebnis', detectedValue: data.finalScore.home != null ? `${data.finalScore.home}:${data.finalScore.guest}` : null, confidence: data.finalScore.confidence, level: levelFromConfidence(data.finalScore.confidence, data.finalScore.home != null) },
    ...data.games.map(g => ({
      fieldKey: `game.${g.gameNo}.legs`,
      label: `Spiel ${g.gameNo} (Legs)`,
      detectedValue: g.legsHome != null ? `${g.legsHome}:${g.legsGuest}` : null,
      confidence: g.confidence,
      level: levelFromConfidence(g.confidence, g.legsHome != null),
    })),
  ];

  return {
    header,
    homePlayers,
    guestPlayers,
    games,
    highlights,
    playerMatches,
    fields,
    issues: validateExtraction(data),
  };
}
