// ============================================================
// Momentaufnahme Saison 2026/27 — reine Rechnung (Betreiber, 18.11.2026)
// ============================================================
// Die öffentlichen Seiten (Spielplan, Teams, Spielstätten, Ligen) lesen Teams und
// Lokale aus lib/data/saison-2027.generated.json. Änderte jemand im Admin ein Lokal,
// einen Namen, ein Kürzel oder ein Logo, blieb die Datei stehen, bis das Skript von
// Hand lief (Dart's Vaders standen noch im Ambassador). Jetzt baut diese Funktion die
// Momentaufnahme — für das Skript UND für den Server, der sie selbst committet
// (lib/server/saison-snapshot.ts). Keine DB, kein Netz, kein Dateisystem.
// ============================================================

export interface SnapTeam { name: string; short: string; color: string; logoUrl: string | null; venueId: string | null; league: string }
export interface SnapVenue { name: string; address: string | null }
type Spieltag = { nr: number; half: string; weekendIndex: number; bye: string | null; games: { home: string; away: string; derby: boolean }[] };
export interface Snapshot {
  _hinweis: string; seasonId: string; planGeneratedAt: string; snapshotAt: string;
  leagues: { key: string; label: string; teams: string[] }[];
  teams: Record<string, SnapTeam>; venues: Record<string, SnapVenue>;
  weekends: unknown; skipped: unknown; schedule: Record<string, Spieltag[]>;
}
export interface Plan {
  generatedAt: string; weekends: unknown; skipped: unknown;
  leagues: { key: string; label: string; teams: { name: string }[] }[];
  schedule: Record<string, Spieltag[]>;
}
/** Zeile aus season_team_assignments (freigegebene Teams der Saison) mit Team und Lokal. */
export interface TeamZeile {
  team_id: string; assigned_competition_id: string | null;
  teams: { name: string; short_name: string | null; logo_url: string | null };
  venues: { id: string; name: string; address: string | null } | null;
}

const norm = (s: string) => s.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, '');
const WETTBEWERB: Record<string, string> = { la: 'la_liga', a: 'a_liga', b1: 'b_liga', b2: 'b_liga', c: 'c_liga' };

/**
 * Baut die Momentaufnahme. Wirft, wenn ein Team des Plans nicht EINDEUTIG einem Team der Saison
 * zugeordnet werden kann, die Liga nicht passt oder ein Saison-Team im Plan fehlt.
 * Logo: Team-Profil → Team → fester Stamm → das Logo der bisherigen Momentaufnahme (beigelegte Dateien);
 * ein LEERES Feld zählt wie keines.
 */
export function baueSnapshot(o: {
  seasonId: string; plan: Plan; zeilen: TeamZeile[]; profilLogo: Map<string, string>;
  stamm: { id: string; short?: string; color?: string; logoUrl?: string }[]; vorher?: Pick<Snapshot, 'teams'> | null; jetzt: string;
}): Snapshot {
  const idJeName = new Map<string, string>();
  const teams: Record<string, SnapTeam> = {};
  const venues: Record<string, SnapVenue> = {};
  for (const lg of o.plan.leagues) {
    for (const t of lg.teams) {
      const treffer = o.zeilen.filter(s => norm(s.teams.name) === norm(t.name));
      if (treffer.length !== 1) throw new Error(`Plan-Team „${t.name}“: ${treffer.length} Treffer in ${o.seasonId}`);
      const s = treffer[0];
      if (s.assigned_competition_id !== WETTBEWERB[lg.key]) throw new Error(`„${t.name}“: Plan ${lg.key}, DB ${s.assigned_competition_id}`);
      const fest = o.stamm.find(x => x.id === s.team_id);
      idJeName.set(t.name, s.team_id);
      teams[s.team_id] = {
        name: s.teams.name.trim(),
        short: (s.teams.short_name ?? fest?.short ?? s.teams.name.slice(0, 3)).trim().toUpperCase(),
        color: fest?.color ?? '#6B7A8F',
        logoUrl: o.profilLogo.get(s.team_id) || s.teams.logo_url || fest?.logoUrl || o.vorher?.teams[s.team_id]?.logoUrl || null,
        venueId: s.venues?.id ?? null,
        league: lg.key,
      };
      if (s.venues) venues[s.venues.id] = { name: s.venues.name.trim(), address: s.venues.address?.trim() || null };
    }
  }
  const fehlen = o.zeilen.filter(s => !teams[s.team_id]).map(s => s.teams.name);
  if (fehlen.length) throw new Error(`Teams der Saison fehlen im Plan: ${fehlen.join(', ')}`);

  const id = (name: string) => idJeName.get(name)!;
  const schedule: Record<string, Spieltag[]> = {};
  for (const [key, tage] of Object.entries(o.plan.schedule)) {
    schedule[key] = tage.map(m => ({
      nr: m.nr, half: m.half, weekendIndex: m.weekendIndex, bye: m.bye ? id(m.bye) : null,
      games: m.games.map(g => ({ home: id(g.home), away: id(g.away), derby: g.derby })),
    }));
  }
  return {
    _hinweis: 'ERZEUGT von scripts/mdu-saison-2027-snapshot.ts bzw. automatisch vom Server (lib/server/saison-snapshot.ts) — nicht von Hand ändern.',
    seasonId: o.seasonId, planGeneratedAt: o.plan.generatedAt, snapshotAt: o.jetzt,
    leagues: o.plan.leagues.map(l => ({ key: l.key, label: l.label, teams: l.teams.map(t => id(t.name)) })),
    teams, venues, weekends: o.plan.weekends, skipped: o.plan.skipped, schedule,
  };
}

/** Was unterscheidet die öffentliche Momentaufnahme vom Stand der Datenbank — in Worten, je Zeile eine Änderung. */
export function unterschiede(alt: Pick<Snapshot, 'teams' | 'venues' | 'schedule' | 'leagues'>, neu: Pick<Snapshot, 'teams' | 'venues' | 'schedule' | 'leagues'>): string[] {
  const aus: string[] = [];
  const lokal = (s: Pick<Snapshot, 'venues'>, id: string | null) => (id ? s.venues[id]?.name ?? 'unbekannt' : 'kein Lokal');
  for (const [id, n] of Object.entries(neu.teams)) {
    const a = alt.teams[id];
    if (!a) { aus.push(`${n.name}: neu dabei`); continue; }
    if (a.name !== n.name) aus.push(`${a.name}: heißt jetzt „${n.name}“`);
    if (lokal(alt, a.venueId) !== lokal(neu, n.venueId) || a.venueId !== n.venueId) aus.push(`${n.name}: Lokal ${lokal(alt, a.venueId)} → ${lokal(neu, n.venueId)}`);
    if (a.short !== n.short) aus.push(`${n.name}: Kürzel ${a.short || '–'} → ${n.short || '–'}`);
    if ((a.logoUrl || '') !== (n.logoUrl || '')) aus.push(`${n.name}: ${n.logoUrl ? 'neues Logo' : 'Logo entfernt'}`);
    if (a.league !== n.league) aus.push(`${n.name}: Liga ${a.league} → ${n.league}`);
  }
  for (const [id, a] of Object.entries(alt.teams)) if (!neu.teams[id]) aus.push(`${a.name}: nicht mehr dabei`);
  for (const [id, n] of Object.entries(neu.venues)) {
    const a = alt.venues[id];
    if (a && (a.name !== n.name || (a.address || '') !== (n.address || ''))) aus.push(`Lokal ${a.name}: ${a.name !== n.name ? `heißt jetzt „${n.name}“` : `Adresse ${n.address || '–'}`}`);
  }
  if (JSON.stringify(alt.schedule) !== JSON.stringify(neu.schedule) || JSON.stringify(alt.leagues) !== JSON.stringify(neu.leagues)) aus.push('Spielplan oder Ligen-Einteilung geändert');
  return aus;
}
