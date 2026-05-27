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

// ── Types ─────────────────────────────────────────────────────

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

// ── Network ───────────────────────────────────────────────────

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

  // Write result
  writeFileSync(outputPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
  console.log(`\n======================================`);
  console.log(`Fetched ${totalFetched} rows across all leagues.`);
  console.log(`Total in file: ${merged.length} matches.`);
  console.log(`Written to: ${outputPath}`);
  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
