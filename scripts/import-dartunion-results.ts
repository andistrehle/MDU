#!/usr/bin/env tsx
/**
 * scripts/import-dartunion-results.ts
 *
 * Fetches the match schedule and results for the 6 active MDU leagues from
 * dartunion.de and writes the result to lib/data/imported-matches.json.
 *
 * Usage:
 *   npm run import:dartunion
 *
 * The output file is read by lib/data/matches.ts at build time and merged
 * with the static MATCHES array:
 *   - Scheduled matches that now have a result are upgraded to "completed".
 *   - Brand-new matches (not in the static set) are appended.
 *   - Existing completed results are NEVER overwritten.
 *
 * Safe to run repeatedly. On fetch error for a single league the script
 * continues with the remaining leagues and preserves the previous data for
 * the failed league.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ── League map ────────────────────────────────────────────────
// dartunion.de LigaId → our internal leagueId

const LEAGUE_MAP: Record<number, string> = {
  88: 'la',
  89: 'playoffs-a-aufstieg',
  90: 'playoffs-b-aufstieg',
  91: 'playoffs-a-abstieg',
  92: 'playoffs-b-abstieg',
  94: 'c',
};

// ── Team ID map ───────────────────────────────────────────────
// dartunion.de numeric team ID → our internal slug
// Source: scripts/scrape_players.py TEAMS list

/**
 * dartunion.de numeric IDs that are scheduling placeholders, not real teams.
 * e.g. ID 35 = "...SPIELFREI..." (bye-week slot in odd-team-count leagues).
 * Rows containing these IDs are silently skipped.
 */
const PLACEHOLDER_IDS = new Set([35]);

const TEAM_ID_MAP: Record<number, string> = {
  // La Liga
  137: 'spartans',
  148: 'ohne-jackie',
  73:  'dc-null-bull',
  57:  'jolly-pirates-kts',
  67:  'les-dartagnons',
  143: 'no-maam',
  // A1 Liga / Playoffs A
  139: 'alptraum',
  150: 'dc-animals-ii',
  70:  'gambas',
  157: 'spartans-vi',
  59:  'sound-warriors',
  36:  'game-over',
  // A2 Liga / Playoffs A
  118: 'treff-nix-freimann',
  105: 'silberpfeile-ii',
  93:  'jolly-pirates-v',
  55:  'de-wolperdinga',
  109: 'oldies-co',
  // B1 Liga / Playoffs B
  185: 'flying-fighters',
  106: 'master-of-desaster',
  193: 'flying-seven',
  98:  'lucky-darts-one',
  49:  'de-hutzeldarter',
  187: 'massl-ghabt',
  // B2 Liga / Playoffs B
  125: 'belfort-evolution',
  189: 'fiaker-deife',
  89:  'freibad-bazis',
  188: 'team-desaster',
  196: 'dc-dark-angels',
  141: 'de-vogelwuidn',
  // C Liga
  90:  'wild-indians',
  153: 'muenchen-0815',
  201: 'lucky-darts-two',
  190: 'funny-darters',
  91:  'black-devils',
  84:  'fuenf-sterne-boazn',
};

// ── Display names ─────────────────────────────────────────────

const TEAM_NAMES: Record<string, string> = {
  'spartans':           'Spartans',
  'ohne-jackie':        'Ohne Jackie',
  'dc-null-bull':       'DC Null Bull',
  'jolly-pirates-kts':  "Jolly Pirates KT's",
  'les-dartagnons':     'Les Dartagnons',
  'no-maam':            "No Ma'am",
  'alptraum':           'Alptraum',
  'dc-animals-ii':      'DC Animals II',
  'gambas':             'Gambas',
  'spartans-vi':        'Spartans VI',
  'sound-warriors':     "Sound Warrior's",
  'game-over':          'Game Over',
  'treff-nix-freimann': 'Treff Nix Freimann',
  'silberpfeile-ii':    'Silberpfeile II',
  'jolly-pirates-v':    'Jolly Pirates V',
  'de-wolperdinga':     'De Wolperdinga',
  'oldies-co':          'Oldies & Co',
  'flying-fighters':    'Flying Fighters',
  'master-of-desaster': 'Master of Desaster',
  'flying-seven':       'Flying Seven',
  'lucky-darts-one':    'Lucky Darts One',
  'de-hutzeldarter':    'De Hutzeldarter',
  'massl-ghabt':        'Massl Ghabt',
  'belfort-evolution':  'Belfort Evolution',
  'fiaker-deife':       'Fiaker Deife',
  'freibad-bazis':      'Freibad Bazis',
  'team-desaster':      'Team Desaster',
  'dc-dark-angels':     'DC Dark Angels',
  'de-vogelwuidn':      "De Vogelwuid'n",
  'wild-indians':       'Wild Indians',
  'muenchen-0815':      'München 08/15',
  'lucky-darts-two':    'Lucky Darts Two',
  'funny-darters':      'Funny Darters Munich',
  'black-devils':       'Black Devils',
  'fuenf-sterne-boazn': '5 Sterne Boazn Team',
};

// ── Statistics: team-name → slug ──────────────────────────────
// Maps the uppercase team names that appear on dartunion.de's
// ranking pages to our internal team IDs.

const TEAM_NAME_TO_ID: Record<string, string> = {
  "OHNE JACKIE":           "ohne-jackie",
  "SPARTANS":              "spartans",
  "JOLLY PIRATES KT'S":   "jolly-pirates-kts",
  "JOLLY PIRATES KT´S": "jolly-pirates-kts", // backtick variant
  "NO MA'AM":              "no-maam",
  "DC NULL BULL":          "dc-null-bull",
  "LES DARTAGNONS":        "les-dartagnons",
  "DC ANIMALS II":         "dc-animals-ii",
  "TREFF NIX FREIMANN":    "treff-nix-freimann",
  "JOLLY PIRATES V":       "jolly-pirates-v",
  "ALPTRAUM":              "alptraum",
  "SILBERPFEILE II":       "silberpfeile-ii",
  "GAMBAS":                "gambas",
  "FREIBAD BAZIS":         "freibad-bazis",
  "FLYING SEVEN":          "flying-seven",
  "BELFORT EVOLUTION":     "belfort-evolution",
  "FIAKER DEIFE":          "fiaker-deife",
  "MASTER OF DESASTER":    "master-of-desaster",
  "FLYING FIGHTERS":       "flying-fighters",
  "SOUND WARRIOR'S":       "sound-warriors",
  "SOUND WARRIORS":        "sound-warriors",
  "OLDIES & CO":           "oldies-co",
  "GAME OVER":             "game-over",
  "SPARTANS VI":           "spartans-vi",
  "TEAM DESASTER":         "team-desaster",
  "DE VOGELWUID'N":        "de-vogelwuidn",
  "LUCKY DARTS ONE":       "lucky-darts-one",
  "DC DARK ANGELS":        "dc-dark-angels",
  "MASSL GHABT":           "massl-ghabt",
  "DE HUTZELDARTER":       "de-hutzeldarter",
  "LUCKY DARTS TWO":       "lucky-darts-two",
  "WILD INDIANS":          "wild-indians",
  "MÜNCHEN 08/15":    "muenchen-0815", // MÜNCHEN with umlaut
  "MUENCHEN 08/15":        "muenchen-0815",
  "FUNNY DARTERS MUNICH":  "funny-darters",
  "BLACK DEVILS":          "black-devils",
  "5 STERNE BOAZN TEAM":   "fuenf-sterne-boazn",
};

// ── Types ─────────────────────────────────────────────────────

interface PlayerStatEntry {
  rank:     number;
  name:     string;
  teamId:   string;
  teamName: string;
  pts:      number;
  wins:     number;
  losses:   number;
}

interface ImportedStandingRow {
  pos:    number;
  team:   string;
  name:   string;
  sp:     number;
  s:      number;
  u:      number;
  n:      number;
  /** Individual game wins:losses, e.g. "223:83" */
  spiele: string;
  legs:   string;
  /** Diff computed from Spiele (SpieleFor − SpieleAgainst) */
  diff:   string;
  pts:    number;
}

interface ImportedMatch {
  id: string;
  seasonId: string;
  leagueId: string;
  matchday?: number;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  date: string | null;
  time: string | null;
  status: 'scheduled' | 'completed';
  result: { home: number; away: number } | null;
  sourceUrl: string;
}

// ── Date / time helpers ───────────────────────────────────────

/**
 * Converts dartunion.de date strings to ISO format.
 *
 * The Spielplan page uses two encodings for the dateH field:
 *   - An integer 0–18       → home score (match is completed)
 *   - "30.11.99"            → placeholder, match not yet scheduled (→ null)
 *   - "DD.MM.YY"            → actual scheduled date (e.g. "19.12.25")
 *
 * Returns null for placeholder / unrecognised values.
 */
function parseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s || s === '30.11.99') return null;
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{2})$/);
  if (!m) return null;
  const [, day, month, yr2] = m;
  return `20${yr2}-${month}-${day}`;
}

/**
 * Converts dartunion.de time strings to "HH:MM" or null.
 * Ignores the default placeholder value "20:00" for unscheduled matches
 * only when the accompanying date was also a placeholder.
 */
function parseTime(raw: string): string | null {
  const s = raw.trim();
  if (!s || s === '0') return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, h, min] = m;
  return `${h.padStart(2, '0')}:${min}`;
}

/**
 * Determines whether the dateH / timeH values represent a completed result.
 *
 * On dartunion.de's Spielplan page, completed matches store the score as
 * plain integers in the date and time input fields (the two numbers always
 * sum to 18 — the total legs per match in MDU).
 */
function isResult(dateRaw: string, timeRaw: string): boolean {
  const dStr = dateRaw.trim();
  const tStr = timeRaw.trim();
  // Must be digits-only (no dots → not a date string)
  if (!/^\d+$/.test(dStr) || !/^\d+$/.test(tStr)) return false;
  const d = parseInt(dStr, 10);
  const t = parseInt(tStr, 10);
  return d >= 0 && d <= 18 && t >= 0 && t <= 18 && d + t === 18;
}

// ── HTML parser ───────────────────────────────────────────────

function parseSpielplan(html: string, ligaId: number): ImportedMatch[] {
  const leagueId = LEAGUE_MAP[ligaId];
  if (!leagueId) return [];

  const sourceUrl = `https://dartunion.de/playplantableExtern_display.php?ddSelectLiga=${ligaId}`;
  const matches: ImportedMatch[] = [];
  const seenPairs = new Set<string>(); // prevent duplicates within one fetch

  // Walk ALL <tr> elements in document order so we can detect matchday heading
  // rows that appear between groups of data rows (e.g. "1. Spieltag").
  let currentMatchday: number | null = null;
  const trRe = /<tr([^>]*)>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;

  while ((trMatch = trRe.exec(html)) !== null) {
    const attrs = trMatch[1];
    const body  = trMatch[2];

    // ── Matchday heading detection ────────────────────────────
    // Heading rows typically contain text like "1. Spieltag" and are NOT
    // tagged with id="datarow". We check heading rows first and skip them.
    if (!/id=["']datarow["']/i.test(attrs)) {
      const mdMatch = body.match(/\b(\d+)\.\s*Spieltag\b/i);
      if (mdMatch) {
        currentMatchday = parseInt(mdMatch[1], 10);
      }
      continue;
    }

    const row = body;

    // Selected option in home-team select
    const homeSel = row.match(
      /<select[^>]+name="ddSelectTeamH[^"]*"[^>]*>[\s\S]*?<option[^>]+selected="selected"[^>]+value="([^"]+)"/i,
    );
    // Selected option in away-team select
    const awaySel = row.match(
      /<select[^>]+name="ddSelectTeamG[^"]*"[^>]*>[\s\S]*?<option[^>]+selected="selected"[^>]+value="([^"]+)"/i,
    );
    // Date / score field
    const dateInp = row.match(/<input[^>]+name="dateH[^"]*"[^>]+value="([^"]*)"/i);
    // Time / score field
    const timeInp = row.match(/<input[^>]+name="timeH[^"]*"[^>]+value="([^"]*)"/i);

    if (!homeSel || !awaySel || !dateInp || !timeInp) continue;

    const homeNumId = homeSel[1];
    const awayNumId = awaySel[1];
    const dateRaw   = dateInp[1];
    const timeRaw   = timeInp[1];

    // Skip empty/placeholder rows
    if (homeNumId === 'leer' || awayNumId === 'leer') continue;

    const homeNum = parseInt(homeNumId, 10);
    const awayNum = parseInt(awayNumId, 10);

    // Skip bye-week / SPIELFREI slots silently
    if (PLACEHOLDER_IDS.has(homeNum) || PLACEHOLDER_IDS.has(awayNum)) continue;

    // Map numeric dartunion IDs to internal slugs
    const homeTeamId = TEAM_ID_MAP[homeNum];
    const awayTeamId = TEAM_ID_MAP[awayNum];

    if (!homeTeamId || !awayTeamId) {
      process.stderr.write(
        `  WARN unknown team IDs: home=${homeNumId}, away=${awayNumId} (liga=${ligaId})\n`,
      );
      continue;
    }

    // Deduplicate within this league page
    const pairKey = `${homeTeamId}|${awayTeamId}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    const homeTeamName = TEAM_NAMES[homeTeamId] ?? homeTeamId;
    const awayTeamName = TEAM_NAMES[awayTeamId] ?? awayTeamId;
    const id = `imp-${leagueId}-${homeTeamId}-${awayTeamId}`;
    const matchday = currentMatchday ?? undefined;

    if (isResult(dateRaw, timeRaw)) {
      // Completed match — scores stored as integers in date/time fields
      matches.push({
        id,
        seasonId: 'season-2026',
        leagueId,
        matchday,
        homeTeamId,
        awayTeamId,
        homeTeamName,
        awayTeamName,
        date: null, // completed matches may not carry an exact date here
        time: null,
        status: 'completed',
        result: { home: parseInt(dateRaw.trim(), 10), away: parseInt(timeRaw.trim(), 10) },
        sourceUrl,
      });
    } else {
      const date = parseDate(dateRaw);
      const time = date ? parseTime(timeRaw) : null; // time is meaningless for placeholder dates

      matches.push({
        id,
        seasonId: 'season-2026',
        leagueId,
        matchday,
        homeTeamId,
        awayTeamId,
        homeTeamName,
        awayTeamName,
        date,
        time,
        status: 'scheduled',
        result: null,
        sourceUrl,
      });
    }
  }

  return matches;
}

// ── Merge ─────────────────────────────────────────────────────

/**
 * Merges an existing set of imported matches with newly fetched data.
 *
 * Rules:
 *   - New match (ID not seen before): add it.
 *   - Existing "scheduled" + incoming "completed": upgrade to completed.
 *   - Existing "completed": never overwrite (preserve manual corrections).
 */
function mergeMatches(
  existing: ImportedMatch[],
  incoming: ImportedMatch[],
): ImportedMatch[] {
  const byId = new Map<string, ImportedMatch>(existing.map(m => [m.id, m]));

  for (const next of incoming) {
    const prev = byId.get(next.id);
    if (!prev) {
      byId.set(next.id, next);
    } else if (prev.status === 'scheduled' && next.status === 'completed') {
      byId.set(next.id, next);
    }
    // If prev is completed → keep it as-is
  }

  return Array.from(byId.values());
}

// ── Statistics helpers ────────────────────────────────────────

/**
 * Normalises a team name for lookup in TEAM_NAME_TO_ID.
 * Uppercases, collapses whitespace and normalises backtick/smart apostrophes.
 */
function normalizeTeamKey(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[`´‘’‚‛]/g, "'") // curly/backtick → straight
    .replace(/\s*\/\s*/g, '/') // "08 / 15" → "08/15"
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts a dartunion.de player name to title-case display format.
 * Handles two formats:
 *   "FIRSTNAME, LASTNAME"  → "Firstname Lastname"
 *   "FIRSTNAME LASTNAME"   → "Firstname Lastname"
 * Preserves hyphens: "PAINTNER-TUITE" → "Paintner-Tuite"
 */
function normalizeName(raw: string): string {
  const parts = raw.includes(',')
    ? raw.split(',').map(p => p.trim())   // ["FIRSTNAME", "LASTNAME"]
    : raw.split(' ');                      // ["FIRSTNAME", "LASTNAME", ...]
  return parts
    .filter(Boolean)
    .map(word =>
      word.split('-').map(w =>
        w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''
      ).join('-'),
    )
    .join(' ');
}

/**
 * Strips all HTML tags from a string and decodes common HTML entities.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g,   '&')
    .replace(/&uuml;/g,  'ü').replace(/&Uuml;/g,  'Ü')
    .replace(/&ouml;/g,  'ö').replace(/&Ouml;/g,  'Ö')
    .replace(/&auml;/g,  'ä').replace(/&Auml;/g,  'Ä')
    .replace(/&szlig;/g, 'ß')
    .replace(/&eacute;/g,'é').replace(/&egrave;/g,'è')
    .replace(/&nbsp;/g,  ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses the Einzelrangliste HTML page for a given liga and returns an
 * array of PlayerStatEntry objects.
 *
 * dartunion.de ranking pages use a table with rows that, after stripping
 * HTML and empty cells, have this approximate structure:
 *   [rank]  [name]  [license]  [team]  [pts]  [wins:losses or wins]  [losses?]  [legs?]
 *
 * The parser:
 *  1. Prefers <tr id="datarow"> rows (same convention as the Spielplan page).
 *  2. Falls back to all <tr> rows if none are found.
 *  3. Identifies cells by content type rather than strict position, so it
 *     remains robust against minor layout changes.
 */
/**
 * Builds a map of team crest image hash → internal team slug by scanning the
 * standings rows on a ranking01.php page (those rows contain both the crest
 * image AND the team name as text).
 *
 * Player ranking rows on the same page show the team ONLY as a crest image,
 * so this map is required to resolve a player's team.
 */
function buildTeamImageMap(html: string): Record<string, string> {
  const map: Record<string, string> = {};
  const rowRe = /<tr[^>]+id=["']datarow["'][^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRe.exec(html)) !== null) {
    const row = rowMatch[1];
    // Standings rows are identified by their g/u/v cell
    if (!/\d+\s*\/\s*\d+\s*\/\s*\d+/.test(stripHtml(row))) continue;

    const img = row.match(/images\/teams\/([^"'.\s]+)\./i);
    if (!img) continue;

    // Team name = first non-empty text cell that maps to a known team
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRe.exec(row)) !== null) {
      const text = stripHtml(tdMatch[1]);
      if (!text) continue;
      const teamId = TEAM_NAME_TO_ID[normalizeTeamKey(text)];
      if (teamId) {
        map[img[1]] = teamId;
        break;
      }
    }
  }

  return map;
}

function parseRanking(html: string, ligaId: number): PlayerStatEntry[] {
  const leagueId = LEAGUE_MAP[ligaId];
  if (!leagueId) return [];

  // Crest image hash → team slug (built from the standings table on this page)
  const teamImgMap = buildTeamImageMap(html);

  const players: PlayerStatEntry[] = [];
  const rowRe = /<tr[^>]+id=["']datarow["'][^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRe.exec(html)) !== null) {
    const row = rowMatch[1];

    // Skip standings rows (they have a g/u/v cell)
    if (/\d+\s*\/\s*\d+\s*\/\s*\d+/.test(stripHtml(row))) continue;

    // Extract raw + text content of each <td>
    const rawCells:  string[] = [];
    const textCells: string[] = [];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRe.exec(row)) !== null) {
      rawCells.push(tdMatch[1]);
      textCells.push(stripHtml(tdMatch[1]));
    }

    const cols = textCells.filter(c => c.length > 0);
    if (cols.length < 4) continue;

    // Rank: first pure integer (sanity: 1–999)
    const rankIdx = cols.findIndex(c => /^\d+$/.test(c) && +c >= 1 && +c <= 999);
    if (rankIdx < 0) continue;
    const rank = +cols[rankIdx];

    // License: "MDU 3711" or legacy "MDU 26 2003"
    const licenseIdx = cols.findIndex(c => /^MDU(\s+\d+)+$/i.test(c));

    // ── Team ──────────────────────────────────────────────────
    // Preferred: crest image (current page layout shows no team text).
    // Fallback: a text cell matching a known team name (legacy layout).
    let teamId = '';
    const teamImg = row.match(/images\/teams\/([^"'.\s]+)\./i);
    if (teamImg && teamImgMap[teamImg[1]]) {
      teamId = teamImgMap[teamImg[1]];
    } else {
      for (let i = rankIdx + 1; i < cols.length; i++) {
        if (i === licenseIdx) continue;
        const id = TEAM_NAME_TO_ID[normalizeTeamKey(cols[i])];
        if (id) { teamId = id; break; }
      }
    }
    if (!teamId) {
      process.stderr.write(
        `  WARN player row without resolvable team (liga=${ligaId}): ${JSON.stringify(cols)}\n`,
      );
      continue;
    }
    const teamName = TEAM_NAMES[teamId] ?? teamId;

    // ── Player name ───────────────────────────────────────────
    // First alphabetic cell after rank that is not the license and not a
    // known team name ("ZLATKO, LOZANCIC" → "Zlatko Lozancic").
    let playerName = '';
    for (let i = rankIdx + 1; i < cols.length; i++) {
      if (i === licenseIdx) continue;
      const c = cols[i];
      if (/^\d+$/.test(c))               continue; // pure number
      if (/^\d+\s*:\s*\d+$/.test(c))     continue; // wins:losses
      if (/^\(\d+\s*:\s*\d+\)$/.test(c)) continue; // legs
      if (/^MDU\b/i.test(c))             continue; // license-ish
      if (TEAM_NAME_TO_ID[normalizeTeamKey(c)]) continue; // team name
      if (/[a-zA-ZäöüÄÖÜßčšžČŠŽàáâèéêìíîòóôùúû']/.test(c)) {
        playerName = normalizeName(c);
        break;
      }
    }
    if (!playerName) {
      process.stderr.write(
        `  WARN player row without name (liga=${ligaId}): ${JSON.stringify(cols)}\n`,
      );
      continue;
    }

    // ── Stats ─────────────────────────────────────────────────
    // Layout: P. (points) | Sp. ("W : L") | Legs ("(x : y)")
    const statCells = cols
      .filter((_, i) => i !== rankIdx && i !== licenseIdx)
      .filter(c => !/^\(\d+\s*:\s*\d+\)$/.test(c)); // drop legs

    let pts: number | null    = null;
    let wins: number | null   = null;
    let losses: number | null = null;

    const wlCell = statCells.find(c => /^\d+\s*:\s*\d+$/.test(c));
    if (wlCell) {
      const [w, l] = wlCell.split(':').map(s => parseInt(s.trim(), 10));
      wins   = w;
      losses = l;
      // pts = first plain integer cell (other than rank/license, both excluded)
      const ptsCell = statCells.find(c => /^\d+$/.test(c));
      if (ptsCell !== undefined) pts = +ptsCell;
    } else {
      // Legacy layout: pts, wins, losses as separate integer columns
      const nums = statCells.filter(c => /^\d+$/.test(c)).map(Number);
      if (nums.length >= 3) {
        [pts, wins, losses] = nums;
      } else if (nums.length === 2) {
        [pts, wins] = nums;
        losses = 0;
      }
    }

    if (pts === null || wins === null || losses === null) {
      process.stderr.write(
        `  WARN player row without parseable stats (liga=${ligaId}): ${JSON.stringify(cols)}\n`,
      );
      continue;
    }

    players.push({ rank, name: playerName, teamId, teamName, pts, wins, losses });
  }

  players.sort((a, b) => a.rank - b.rank);
  return players;
}

/**
 * Parses the official standings table on a ranking01.php page.
 *
 * Table structure (header row: Wappen | Team | Sp.Tage | Punkte | Spiele | Legs | g/u/v):
 *   <tr id="datarow">
 *     <td>1</td> <td><img …></td> <td>SPARTANS</td>
 *     <td>17</td> <td>46</td> <td>223 : 83</td> <td>490 : 244</td> <td>15 / 1 / 1</td>
 *   </tr>
 *
 * Mapping (per spec): Sp.Tage → sp · g/u/v → s/u/n · Punkte → pts ·
 * Spiele → spiele · Legs → legs · diff = SpieleFor − SpieleAgainst.
 *
 * Rows that don't match this shape (e.g. Einzelrangliste player rows on the
 * same page) are skipped silently.
 */
function parseStandings(html: string, ligaId: number): ImportedStandingRow[] {
  const leagueId = LEAGUE_MAP[ligaId];
  if (!leagueId) return [];

  const rows: ImportedStandingRow[] = [];
  const rowRe = /<tr[^>]+id=["']datarow["'][^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRe.exec(html)) !== null) {
    const row = rowMatch[1];

    const cells: string[] = [];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRe.exec(row)) !== null) {
      cells.push(stripHtml(tdMatch[1]));
    }

    // Standings rows have a g/u/v cell — player ranking rows don't.
    const guvIdx = cells.findIndex(c => /^\d+\s*\/\s*\d+\s*\/\s*\d+$/.test(c));
    if (guvIdx < 0) continue;

    const cols = cells.filter(c => c.length > 0);
    // Expected: [pos, TEAM, Sp.Tage, Punkte, Spiele, Legs, g/u/v]
    if (cols.length < 7) {
      process.stderr.write(`  WARN unexpected standings row (liga=${ligaId}): ${JSON.stringify(cols)}\n`);
      continue;
    }

    const [posStr, teamRaw, spStr, ptsStr, spieleRaw, legsRaw, guvRaw] = cols;

    if (!/^\d+$/.test(posStr) || !/^\d+$/.test(spStr) || !/^\d+$/.test(ptsStr)) {
      process.stderr.write(`  WARN unparseable standings row (liga=${ligaId}): ${JSON.stringify(cols)}\n`);
      continue;
    }

    const teamId = TEAM_NAME_TO_ID[normalizeTeamKey(teamRaw)];
    if (!teamId) {
      process.stderr.write(`  WARN unknown team in standings (liga=${ligaId}): "${teamRaw}"\n`);
      continue;
    }

    const spieleM = spieleRaw.match(/^(\d+)\s*:\s*(\d+)$/);
    const legsM   = legsRaw.match(/^(\d+)\s*:\s*(\d+)$/);
    const guvM    = guvRaw.match(/^(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)$/);
    if (!spieleM || !legsM || !guvM) {
      process.stderr.write(`  WARN unparseable standings cells (liga=${ligaId}): ${JSON.stringify(cols)}\n`);
      continue;
    }

    const spieleFor     = +spieleM[1];
    const spieleAgainst = +spieleM[2];
    const d = spieleFor - spieleAgainst;

    rows.push({
      pos:    +posStr,
      team:   teamId,
      name:   TEAM_NAMES[teamId] ?? teamRaw,
      sp:     +spStr,
      s:      +guvM[1],
      u:      +guvM[2],
      n:      +guvM[3],
      spiele: `${spieleFor}:${spieleAgainst}`,
      legs:   `${+legsM[1]}:${+legsM[2]}`,
      diff:   d > 0 ? `+${d}` : `${d}`,
      pts:    +ptsStr,
    });
  }

  rows.sort((a, b) => a.pos - b.pos);
  return rows;
}

// ── Network ───────────────────────────────────────────────────

async function fetchRanking(ligaId: number): Promise<string> {
  const url = `https://dartunion.de/ranking01.php?LigaId=${ligaId}`;
  process.stdout.write(`  GET ${url}\n`);

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'User-Agent': 'MDU-Platform-Importer/1.0' },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.text();
}

async function fetchSpielplan(ligaId: number): Promise<string> {
  const url = `https://dartunion.de/playplantableExtern_display.php?ddSelectLiga=${ligaId}`;
  process.stdout.write(`  GET ${url}\n`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'MDU-Platform-Importer/1.0',
    },
    body: '',
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('MDU Importer — dartunion.de Spielplan');
  console.log('======================================');

  const outputPath = join(process.cwd(), 'lib', 'data', 'imported-matches.json');

  // Load existing data (preserve any manual corrections)
  let existing: ImportedMatch[] = [];
  if (existsSync(outputPath)) {
    try {
      existing = JSON.parse(readFileSync(outputPath, 'utf-8')) as ImportedMatch[];
      console.log(`Loaded ${existing.length} existing matches from ${outputPath}`);
    } catch {
      console.warn('Could not parse existing file — starting with empty set.');
    }
  }

  let merged = [...existing];
  let totalFetched = 0;

  for (const ligaIdStr of Object.keys(LEAGUE_MAP)) {
    const ligaId = Number(ligaIdStr);
    const leagueId = LEAGUE_MAP[ligaId];
    console.log(`\n[Liga ${ligaId} → ${leagueId}]`);

    try {
      const html = await fetchSpielplan(ligaId);
      const parsed = parseSpielplan(html, ligaId);
      console.log(`  Parsed ${parsed.length} unique match rows.`);
      totalFetched += parsed.length;

      // Merge incrementally (so a later failure doesn't lose earlier fetches)
      merged = mergeMatches(merged, parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR fetching Liga ${ligaId}: ${msg}`);
      console.error('  Existing data for this league is preserved.');
    }

    // Polite delay between requests
    await delay(2000);
  }

  // Write matches result
  writeFileSync(outputPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  console.log(`\n======================================`);
  console.log(`Fetched ${totalFetched} rows across all leagues.`);
  console.log(`Total in file: ${merged.length} matches.`);
  console.log(`Written to: ${outputPath}`);

  // ── Statistics import ───────────────────────────────────────
  console.log('\n======================================');
  console.log('MDU Importer — Einzelranglisten (Statistics)');
  console.log('======================================');

  const statsPath     = join(process.cwd(), 'lib', 'data', 'imported-statistics.json');
  const standingsPath = join(process.cwd(), 'lib', 'data', 'imported-standings.json');

  // Load existing data to preserve any leagues we fail to fetch
  let existingStats: Record<string, PlayerStatEntry[]> = {};
  if (existsSync(statsPath)) {
    try {
      existingStats = JSON.parse(readFileSync(statsPath, 'utf-8')) as Record<string, PlayerStatEntry[]>;
      console.log(`Loaded existing stats for ${Object.keys(existingStats).length} leagues.`);
    } catch {
      console.warn('Could not parse existing statistics file — starting fresh.');
    }
  }

  let existingStandings: Record<string, ImportedStandingRow[]> = {};
  if (existsSync(standingsPath)) {
    try {
      existingStandings = JSON.parse(readFileSync(standingsPath, 'utf-8')) as Record<string, ImportedStandingRow[]>;
      console.log(`Loaded existing standings for ${Object.keys(existingStandings).length} leagues.`);
    } catch {
      console.warn('Could not parse existing standings file — starting fresh.');
    }
  }

  const updatedStats:     Record<string, PlayerStatEntry[]>     = { ...existingStats };
  const updatedStandings: Record<string, ImportedStandingRow[]> = { ...existingStandings };
  let totalStatsFetched = 0;
  let totalStandingRows = 0;

  for (const ligaIdStr of Object.keys(LEAGUE_MAP)) {
    const ligaId   = Number(ligaIdStr);
    const leagueId = LEAGUE_MAP[ligaId];
    console.log(`\n[Ranking Liga ${ligaId} → ${leagueId}]`);

    try {
      const html   = await fetchRanking(ligaId);

      // Einzelrangliste (player statistics)
      const parsed = parseRanking(html, ligaId);
      console.log(`  Parsed ${parsed.length} player entries.`);
      totalStatsFetched += parsed.length;

      if (parsed.length > 0) {
        updatedStats[leagueId] = parsed;
      } else {
        process.stderr.write(`  WARN no entries parsed — keeping existing data for ${leagueId}\n`);
      }

      // Official standings table (same page)
      const standings = parseStandings(html, ligaId);
      console.log(`  Parsed ${standings.length} standings rows.`);
      totalStandingRows += standings.length;

      if (standings.length > 0) {
        updatedStandings[leagueId] = standings;
      } else {
        process.stderr.write(`  WARN no standings parsed — keeping existing data for ${leagueId}\n`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR fetching ranking Liga ${ligaId}: ${msg}`);
      console.error('  Existing data for this league is preserved.');
    }

    await delay(2000);
  }

  writeFileSync(statsPath, JSON.stringify(updatedStats, null, 2) + '\n', 'utf-8');
  writeFileSync(standingsPath, JSON.stringify(updatedStandings, null, 2) + '\n', 'utf-8');
  console.log(`\n======================================`);
  console.log(`Fetched ${totalStatsFetched} player entries across all leagues.`);
  console.log(`Written to: ${statsPath}`);
  console.log(`Fetched ${totalStandingRows} standings rows across all leagues.`);
  console.log(`Written to: ${standingsPath}`);
  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
