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
const norm = (s: string) => s.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');

type Sta = { team_id: string; assigned_competition_id: string | null; teams: { name: string; short_name: string | null; logo_url: string | null }; venues: { id: string; name: string; address: string | null } | null };

async function main() {
  const sta = await get<Sta[]>(`season_team_assignments?select=team_id,assigned_competition_id,teams:team_id(name,short_name,logo_url),venues:venue_id(id,name,address)&season_id=eq.${SEASON_ID}&status=eq.approved`);
  const profs = await get<{ team_id: string; logo_url: string | null }[]>(`team_profiles?select=team_id,logo_url&team_id=in.(${sta.map(s => `"${s.team_id}"`).join(',')})`);
  const profLogo = new Map(profs.filter(p => p.logo_url).map(p => [p.team_id, p.logo_url!]));

  const idByName = new Map<string, string>();
  const teams: Record<string, { name: string; short: string; color: string; logoUrl: string | null; venueId: string | null; league: string }> = {};
  const venues: Record<string, { name: string; address: string | null }> = {};
  const MAIN: Record<string, string> = { la: 'la_liga', a: 'a_liga', b1: 'b_liga', b2: 'b_liga', c: 'c_liga' };

  for (const lg of plan.leagues as { key: string; teams: { name: string }[] }[]) {
    for (const t of lg.teams) {
      const hits = sta.filter(s => norm(s.teams.name) === norm(t.name));
      if (hits.length !== 1) throw new Error(`Plan-Team „${t.name}“: ${hits.length} Treffer in ${SEASON_ID}`);
      const s = hits[0];
      if (s.assigned_competition_id !== MAIN[lg.key]) throw new Error(`„${t.name}“: Plan ${lg.key}, DB ${s.assigned_competition_id}`);
      const stat = TEAMS.find(x => x.id === s.team_id);
      idByName.set(t.name, s.team_id);
      teams[s.team_id] = {
        name: s.teams.name.trim(),
        short: (s.teams.short_name ?? stat?.short ?? s.teams.name.slice(0, 3)).trim().toUpperCase(),
        color: stat?.color ?? '#6B7A8F',
        logoUrl: profLogo.get(s.team_id) ?? s.teams.logo_url ?? stat?.logoUrl ?? null,
        venueId: s.venues?.id ?? null,
        league: lg.key,
      };
      if (s.venues) venues[s.venues.id] = { name: s.venues.name.trim(), address: s.venues.address?.trim() ?? null };
    }
  }
  const missing = sta.filter(s => !teams[s.team_id]).map(s => s.teams.name);
  if (missing.length) throw new Error(`Teams der Saison fehlen im Plan: ${missing.join(', ')}`);

  const id = (name: string) => idByName.get(name)!;
  const schedule: Record<string, { nr: number; half: string; weekendIndex: number; bye: string | null; games: { home: string; away: string; derby: boolean }[] }[]> = {};
  for (const [key, mds] of Object.entries(plan.schedule as Record<string, { nr: number; half: string; weekendIndex: number; bye: string | null; games: { home: string; away: string; derby: boolean }[] }[]>)) {
    schedule[key] = mds.map(m => ({
      nr: m.nr, half: m.half, weekendIndex: m.weekendIndex, bye: m.bye ? id(m.bye) : null,
      games: m.games.map(g => ({ home: id(g.home), away: id(g.away), derby: g.derby })),
    }));
  }

  const out = {
    _hinweis: 'ERZEUGT von scripts/mdu-saison-2027-snapshot.ts — nicht von Hand ändern, Skript neu laufen lassen.',
    seasonId: SEASON_ID,
    planGeneratedAt: plan.generatedAt,
    snapshotAt: new Date().toISOString(),
    leagues: (plan.leagues as { key: string; label: string; teams: { name: string }[] }[]).map(l => ({ key: l.key, label: l.label, teams: l.teams.map(t => id(t.name)) })),
    teams, venues,
    weekends: plan.weekends,
    skipped: plan.skipped,
    schedule,
  };
  const path = join(ROOT, 'lib/data/saison-2027.generated.json');
  writeFileSync(path, JSON.stringify(out, null, 2) + '\n');
  console.log(`OK: ${Object.keys(teams).length} Teams, ${Object.keys(venues).length} Spielorte, ${Object.values(schedule).reduce((n, l) => n + l.reduce((m, d) => m + d.games.length, 0), 0)} Spiele → ${path}`);
}
main().catch(e => { console.error(e.message ?? e); process.exit(1); });
