// ============================================================
// Teams — Münchner Dart Union · Saison 2026
// Source: dartunion.de (scraped May 2026)
// ============================================================
//
// Teams are permanent entities, NOT tied to a specific season or league.
// Season-specific data (league, venue, captain) lives in:
//   → lib/data/assignments.ts  (SeasonTeamAssignment)
//
// HOW TO ADD A NEW TEAM:
//   1. Add the Team record here with a unique id
//   2. Add a SeasonTeamAssignment in lib/data/assignments.ts to place
//      the team in the correct league for the relevant season
//
// HOW TO MARK A TEAM INACTIVE:
//   Set status: 'inactive'. Do NOT delete the team — historical
//   standings and assignments reference the id.
//
// ============================================================

export type TeamStatus = 'active' | 'inactive';

export interface Team {
  /** Unique slug — used in URLs (/teams/[id]) and as foreign key in assignments */
  id: string;
  /** Full team name */
  name: string;
  /** Short badge code (2–3 uppercase letters) */
  short: string;
  /** Brand color hex */
  color: string;
  /**
   * 'inactive' = withdrew from competition or disbanded.
   * Inactive teams still appear in historical standings.
   */
  status: TeamStatus;
}

// ── Real MDU teams · Saison 2026 · dartunion.de ─────────────
//
// Notes:
//   de-wolperdinga:    withdrew from competition mid-season (Rückzug, Mai 2026)
//   treff-nix-freimann: transferred from A1 to A2 mid-season; see assignments.ts

export const TEAMS: Team[] = [
  // La Liga — 6 teams
  { id: 'spartans',           name: 'Spartans',             short: 'SPA', color: '#D40000', status: 'active' },
  { id: 'ohne-jackie',        name: 'Ohne Jackie',          short: 'OJA', color: '#E8B84A', status: 'active' },
  { id: 'jolly-pirates-kts',  name: "Jolly Pirates KT's",   short: 'JPK', color: '#0EA5E9', status: 'active' },
  { id: 'dc-null-bull',       name: 'DC Null Bull',         short: 'DNB', color: '#8B5CF6', status: 'active' },
  { id: 'no-maam',            name: "No Ma'am",             short: 'NMA', color: '#22C55E', status: 'active' },
  { id: 'les-dartagnons',     name: 'Les Dartagnons',       short: 'LDA', color: '#6B7280', status: 'active' },

  // A1 Liga — 6 teams (treff-nix-freimann transferred to A2)
  { id: 'alptraum',           name: 'Alptraum',             short: 'ALT', color: '#D40000', status: 'active' },
  { id: 'dc-animals-ii',      name: 'DC Animals II',        short: 'DCA', color: '#3B82F6', status: 'active' },
  { id: 'gambas',             name: 'Gambas',               short: 'GMB', color: '#F59E0B', status: 'active' },
  { id: 'spartans-vi',        name: 'Spartans VI',          short: 'SP6', color: '#0EA5E9', status: 'active' },
  { id: 'sound-warriors',     name: "Sound Warrior's",      short: 'SOW', color: '#8B5CF6', status: 'active' },
  { id: 'game-over',          name: 'Game Over',            short: 'GMO', color: '#EF4444', status: 'active' },

  // A2 Liga — 5 teams (incl. treff-nix-freimann, de-wolperdinga inactive)
  { id: 'treff-nix-freimann', name: 'Treff Nix Freimann',  short: 'TNF', color: '#6B7280', status: 'active' },
  { id: 'silberpfeile-ii',    name: 'Silberpfeile II',      short: 'SIL', color: '#C9CCD6', status: 'active' },
  { id: 'jolly-pirates-v',    name: 'Jolly Pirates V',      short: 'JPV', color: '#0EA5E9', status: 'active' },
  { id: 'de-wolperdinga',     name: 'De Wolperdinga',       short: 'DWP', color: '#A78BFA', status: 'inactive' },
  { id: 'oldies-co',          name: 'Oldies & Co',          short: 'OLD', color: '#F59E0B', status: 'active' },

  // B1 Liga — 6 teams
  { id: 'flying-fighters',    name: 'Flying Fighters',      short: 'FLF', color: '#EF4444', status: 'active' },
  { id: 'master-of-desaster', name: 'Master of Desaster',   short: 'MOD', color: '#8B5CF6', status: 'active' },
  { id: 'flying-seven',       name: 'Flying Seven',         short: 'FL7', color: '#0EA5E9', status: 'active' },
  { id: 'lucky-darts-one',    name: 'Lucky Darts One',      short: 'LD1', color: '#E8B84A', status: 'active' },
  { id: 'de-hutzeldarter',    name: 'De Hutzeldarter',      short: 'DHD', color: '#22C55E', status: 'active' },
  { id: 'massl-ghabt',        name: 'Massl Ghabt',          short: 'MSG', color: '#6B7280', status: 'active' },

  // B2 Liga — 6 teams
  { id: 'belfort-evolution',  name: 'Belfort Evolution',    short: 'BEV', color: '#E8B84A', status: 'active' },
  { id: 'fiaker-deife',       name: 'Fiaker Deife',         short: 'FDF', color: '#0EA5E9', status: 'active' },
  { id: 'freibad-bazis',      name: 'Freibad Bazis',        short: 'FBB', color: '#D40000', status: 'active' },
  { id: 'team-desaster',      name: 'Team Desaster',        short: 'TDS', color: '#F59E0B', status: 'active' },
  { id: 'dc-dark-angels',     name: 'DC Dark Angels',       short: 'DDA', color: '#8B5CF6', status: 'active' },
  { id: 'de-vogelwuidn',      name: "De Vogelwuid'n",       short: 'DVN', color: '#22C55E', status: 'active' },

  // C Liga — 6 teams
  { id: 'wild-indians',       name: 'Wild Indians',         short: 'WID', color: '#E8B84A', status: 'active' },
  { id: 'muenchen-0815',      name: 'München 08/15',        short: 'M08', color: '#D40000', status: 'active' },
  { id: 'lucky-darts-two',    name: 'Lucky Darts Two',      short: 'LD2', color: '#22C55E', status: 'active' },
  { id: 'funny-darters',      name: 'Funny Darters Munich', short: 'FDM', color: '#F59E0B', status: 'active' },
  { id: 'black-devils',       name: 'Black Devils',         short: 'BLK', color: '#8B5CF6', status: 'active' },
  { id: 'fuenf-sterne-boazn', name: '5 Sterne Boazn Team',  short: 'FSB', color: '#0EA5E9', status: 'active' },
];

/** Returns a team by id, or undefined if not found. */
export function findTeam(id: string): Team | undefined {
  return TEAMS.find(t => t.id === id);
}
