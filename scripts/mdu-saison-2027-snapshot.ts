// ============================================================
// MDU Saison 2026/2027 — Momentaufnahme für die öffentliche Seite
// ============================================================
// Verbindet den Spielplan-Vorschlag (app/admin/spielplan-vorschlag/spielplan.json,
// Teams per NAME) mit den Teams der Saison aus der DB (IDs, Kürzel, Logos,
// Spielorte) und schreibt lib/data/saison-2027.generated.json.
//
// Ausführen:  npx tsx scripts/mdu-saison-2027-snapshot.ts
// NUR LESEN — nutzt den öffentlichen anon-Schlüssel (RLS: öffentliche Leserechte
// auf teams, venues, season_team_assignments, team_profiles). Schreibt nichts in
// die DB.
//
// Neu laufen lassen, wenn sich Spielplan, Teamnamen, Kürzel, Logos oder
// Spielorte ändern. Bricht ab, wenn ein Team des Plans nicht EINDEUTIG einem
// Team der Saison zugeordnet werden kann (oder umgekehrt eins fehlt).
// ============================================================
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { TEAMS } from '../lib/data/teams';
import { baueSnapshot, type Plan, type Snapshot, type TeamZeile } from '../lib/saison-snapshot';

const SEASON_ID = 'season-2027';
const ROOT = join(__dirname, '..');
const plan = JSON.parse(readFileSync(join(ROOT, 'app/admin/spielplan-vorschlag/spielplan.json'), 'utf8'));

const U = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
const K = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
if (!U || !K) throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY fehlen.');
async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${U}/rest/v1/${path}`, { headers: { apikey: K, Authorization: `Bearer ${K}` } });
  if (!r.ok) throw new Error(`${r.status} ${path}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

async function main() {
  const zeilen = await get<TeamZeile[]>(`season_team_assignments?select=team_id,assigned_competition_id,teams:team_id(name,short_name,logo_url),venues:venue_id(id,name,address)&season_id=eq.${SEASON_ID}&status=eq.approved`);
  const profs = await get<{ team_id: string; logo_url: string | null }[]>(`team_profiles?select=team_id,logo_url&team_id=in.(${zeilen.map(s => `"${s.team_id}"`).join(',')})`);
  const profilLogo = new Map(profs.filter(p => p.logo_url).map(p => [p.team_id, p.logo_url!]));
  const path = join(ROOT, 'lib/data/saison-2027.generated.json');
  // Bisherige Datei: von dort bleiben Logos erhalten, die nur als Datei beiliegen (Gambas, Alptraum, …).
  let vorher: Snapshot | null = null;
  try { vorher = JSON.parse(readFileSync(path, 'utf8')) as Snapshot; } catch { /* erste Erzeugung */ }
  // Rechnung: lib/saison-snapshot.ts (dieselbe nutzt der Server für das automatische Übernehmen).
  const out = baueSnapshot({ seasonId: SEASON_ID, plan: plan as Plan, zeilen, profilLogo, stamm: TEAMS, vorher, jetzt: new Date().toISOString() });
  writeFileSync(path, JSON.stringify(out, null, 2) + '\n');
  console.log(`OK: ${Object.keys(out.teams).length} Teams, ${Object.keys(out.venues).length} Spielorte, ${Object.values(out.schedule).reduce((n, l) => n + l.reduce((m, d) => m + d.games.length, 0), 0)} Spiele → ${path}`);
}
main().catch(e => { console.error(e); process.exit(1); });
