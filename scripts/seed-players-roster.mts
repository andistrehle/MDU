// ============================================================
// Übernahme-Seed: Spieler + Kader in die DB (Migration 0025)
// ============================================================
//
// Schreibt den statischen Spielerstamm (lib/data/players.ts) und die Kader-/
// Team-Zuordnungen (lib/data/assignments.ts) in die DB-Tabellen `players` und
// `player_assignments`. Idempotent (upsert) — kann gefahrlos erneut laufen.
//
// Voraussetzung: Migration 0025 gelaufen, .env.local mit Service-Role-Key.
// Start (aus Repo-Root):  npx tsx scripts/seed-players-roster.mts
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { PLAYERS } from '../lib/data/players';
import { TEAM_PLAYER_ASSIGNMENTS } from '../lib/data/assignments';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Fehlt: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false } });

async function upsertBatched<T>(table: string, rows: T[], onConflict: string) {
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    const { error } = await admin.from(table).upsert(batch as never[], { onConflict });
    if (error) { console.error(`${table} upsert error:`, error.message); process.exit(1); }
  }
}

// ── Spieler ──────────────────────────────────────────────────
const playerRows = PLAYERS.map(p => ({
  id: p.id,
  first_name: p.firstName,
  last_name: p.lastName,
  display_name: p.displayName ?? null,
  nickname: p.nickname ?? null,
  license_number: p.licenseNumber ?? null,
  status: p.status ?? 'active',
  photo_url: p.photoUrl ?? null,
  source: 'dartunion',
}));
await upsertBatched('players', playerRows, 'id');
console.log('players upserted:', playerRows.length);

// ── Kaderzuordnungen ─────────────────────────────────────────
const paRows = TEAM_PLAYER_ASSIGNMENTS.map(a => ({
  id: a.id,
  season_id: a.seasonId,
  team_id: a.teamId,
  player_id: a.playerId,
  status: a.status,
  is_captain: !!a.isCaptain,
  source: 'dartunion',
}));
await upsertBatched('player_assignments', paRows, 'id');
console.log('player_assignments upserted:', paRows.length);

console.log('DONE');
