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

interface ImportedMatch {
  id: string;
  seasonId: string;
  leagueId: string;
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

  const rowRe = /<tr[^>]+id=["']datarow["'][^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRe.exec(html)) !== null) {
    const row = rowMatch[1];

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

    if (isResult(dateRaw, timeRaw)) {
      // Completed match — scores stored as integers in date/time fields
      matches.push({
        id,
        seasonId: 'season-2026',
        leagueId,
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
function parseRanking(html: string, ligaId: number): PlayerStatEntry[] {
  const leagueId = LEAGUE_MAP[ligaId];
  if (!leagueId) return [];

  const players: PlayerStatEntry[] = [];

  // Prefer id="datarow" rows; fall back to all <tr> rows
  const dataRowRe   = /<tr[^>]+id=["']datarow["'][^>]*>([\s\S]*?)<\/tr>/gi;
  const allRowRe    = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const hasDataRows = /<tr[^>]+id=["']datarow["']/i.test(html);
  const rowRe       = hasDataRows ? dataRowRe : allRowRe;

  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRe.exec(html)) !== null) {
    const row = rowMatch[1];

    // Extract text from each <td>
    const cells: string[] = [];
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRe.exec(row)) !== null) {
      cells.push(stripHtml(tdMatch[1]));
    }

    // Drop image-only / blank cells
    const cols = cells.filter(c => c.length > 0);
    if (cols.length < 5) continue;

    // ── Identify each field ───────────────────────────────────

    // Rank: first pure integer in the row (sanity: 1–999)
    const rankIdx = cols.findIndex(c => /^\d+$/.test(c) && +c >= 1 && +c <= 999);
    if (rankIdx < 0) continue;
    const rank = +cols[rankIdx];

    // License: "MDU YY NNNN"
    const licenseIdx = cols.findIndex(c => /^MDU\s+\d+\s+\d+$/i.test(c));

    // Team: first cell that matches a known team name (after rank)
    let teamIdx = -1;
    let teamId  = '';
    let teamName = '';
    for (let i = rankIdx + 1; i < cols.length; i++) {
      if (i === licenseIdx) continue;
      const key = normalizeTeamKey(cols[i]);
      const id  = TEAM_NAME_TO_ID[key];
      if (id) {
        teamIdx  = i;
        teamId   = id;
        teamName = TEAM_NAMES[id] ?? cols[i];
        break;
      }
    }
    if (teamIdx < 0) continue; // unknown team — skip row

    // Player name: first alphabetic, non-rank, non-license, non-numeric
    //              cell between rank and team
    let playerName = '';
    for (let i = rankIdx + 1; i < teamIdx; i++) {
      if (i === licenseIdx) continue;
      const c = cols[i];
      if (/^\d+$/.test(c))       continue; // pure number
      if (/^\d+:\d+$/.test(c))   continue; // wins:losses
      if (/^\(\d+:\d+\)$/.test(c)) continue; // legs
      if (/[a-zA-ZäöüÄÖÜßčšžČŠŽàáâèéêìíîòóôùúû']/.test(c)) {
        playerName = normalizeName(c);
        break;
      }
    }
    if (!playerName) continue;

    // Stats: in columns after the team cell
    const afterTeam = cols.slice(teamIdx + 1).filter(c => !/^\(\d+:\d+\)$/.test(c)); // drop legs

    let pts: number | null    = null;
    let wins: number | null   = null;
    let losses: number | null = null;

    // Case 1: combined wins:losses cell "W:L"
    const wlCell = afterTeam.find(c => /^\d+:\d+$/.test(c));
    if (wlCell) {
      const [w, l] = wlCell.split(':').map(Number);
      wins   = w;
      losses = l;
      // pts = first plain integer before the wins:losses cell
      const wlPos = afterTeam.findIndex(c => /^\d+:\d+$/.test(c));
      for (let i = 0; i < wlPos; i++) {
        if (/^\d+$/.test(afterTeam[i])) { pts = +afterTeam[i]; break; }
      }
    } else {
      // Case 2: pts, wins, losses as separate integer columns
      const nums = afterTeam.filter(c => /^\d+$/.test(c)).map(Number);
      if (nums.length >= 3) {
        [pts, wins, losses] = nums;
      } else if (nums.length === 2) {
        [pts, wins] = nums;
        losses = 0;
      }
    }

    if (pts === null || wins === null || losses === null) continue;

    players.push({ rank, name: playerName, teamId, teamName, pts, wins, losses });
  }

  players.sort((a, b) => a.rank - b.rank);
  return players;
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

  const statsPath = join(process.cwd(), 'lib', 'data', 'imported-statistics.json');

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

  const updatedStats: Record<string, PlayerStatEntry[]> = { ...existingStats };
  let totalStatsFetched = 0;

  for (const ligaIdStr of Object.keys(LEAGUE_MAP)) {
    const ligaId   = Number(ligaIdStr);
    const leagueId = LEAGUE_MAP[ligaId];
    console.log(`\n[Ranking Liga ${ligaId} → ${leagueId}]`);

    try {
      const html   = await fetchRanking(ligaId);
      const parsed = parseRanking(html, ligaId);
      console.log(`  Parsed ${parsed.length} player entries.`);
      totalStatsFetched += parsed.length;

      if (parsed.length > 0) {
        updatedStats[leagueId] = parsed;
      } else {
        process.stderr.write(`  WARN no entries parsed — keeping existing data for ${leagueId}\n`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ERROR fetching ranking Liga ${ligaId}: ${msg}`);
      console.error('  Existing data for this league is preserved.');
    }

    await delay(2000);
  }

  writeFileSync(statsPath, JSON.stringify(updatedStats, null, 2) + '\n', 'utf-8');
  console.log(`\n======================================`);
  console.log(`Fetched ${totalStatsFetched} player entries across all leagues.`);
  console.log(`Written to: ${statsPath}`);
  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
