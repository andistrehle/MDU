// ============================================================
// Season Assignments — Münchner Dart Union
// ============================================================
//
// This file defines WHICH team plays in WHICH league during WHICH season,
// along with their venue and captain for that specific season.
//
// WHY THIS EXISTS:
//   Teams can move between leagues, change venues, and swap captains
//   every season. Storing these here (instead of on the team entity)
//   allows historical lookups to remain accurate, and makes it trivial
//   to set up a new season without changing team records.
//
// ── HOW TO SET UP A NEW SEASON ──────────────────────────────
//   1. Create the season in lib/data/seasons.ts
//   2. For each team, add a SeasonTeamAssignment with:
//        seasonId  → the new season's id
//        leagueId  → the league they play in (may differ from last season)
//        teamId    → references Team.id in lib/data/teams.ts
//        venueId   → (optional) references Venue.id in lib/data/venues.ts
//        captain   → (optional) string name
//   3. Teams NOT listed for a season are considered absent that season.
//
// ── HOW TO ARCHIVE A SEASON ─────────────────────────────────
//   1. Set the season status to 'archived' in lib/data/seasons.ts
//   2. Do NOT delete old SeasonTeamAssignments — they are the
//      historical record of who played where.
//
// ── HOW TO IMPORT FROM CSV/JSON ─────────────────────────────
//   Parse your CSV/JSON and generate SeasonTeamAssignment objects
//   with the fields below. Each row in the CSV corresponds to one
//   assignment: team, league, season, venue (optional), captain (optional).
//
// ============================================================

import type { LeagueCode } from './leagues';
import { LEAGUES } from './leagues';
import { TEAMS, type Team } from './teams';
import { VENUES, type Venue } from './venues';
import { PLAYERS, type Player } from './players';

export interface SeasonTeamAssignment {
  /** Unique identifier for this assignment record */
  id: string;
  /** References Season.id in lib/data/seasons.ts */
  seasonId: string;
  /** References League.id — the league this team plays in this season */
  leagueId: LeagueCode;
  /** References Team.id in lib/data/teams.ts */
  teamId: string;
  /** References Venue.id in lib/data/venues.ts — optional until venue data is available */
  venueId?: string;
  /** Captain name for this season — optional until data is available */
  captain?: string;
  /** Free-text notes (e.g. mid-season transfer, withdrawal from competition) */
  notes?: string;
}

export interface TeamPlayerAssignment {
  /** Unique identifier */
  id: string;
  /** References Season.id */
  seasonId: string;
  /** References Team.id */
  teamId: string;
  /** References Player.id in lib/data/players.ts */
  playerId: string;
  /** Player's role/status within the team for this season */
  status: 'active' | 'inactive' | 'substitute' | 'unknown';
  /** True if this player is the team captain for this season */
  isCaptain?: boolean;
}

// ── Saison 2026 · season-2026 ────────────────────────────────
// Source: dartunion.de · "TC's und Lokale" · scraped May 2026
//
// PRIVACY: Phone numbers from dartunion.de are NOT stored here.
//          Do NOT add phone numbers. Do NOT render them in the UI.
//
// Special cases:
//   treff-nix-freimann  — Started Saison 2026 in A1 (4 games, 0 pts, relegated early).
//                          Now assigned to A2 for the remainder of the season / playoffs.
//   de-wolperdinga      — Withdrew from competition mid-season (Rückzug, Mai 2026).
//                          Kept in A2 assignment for historical accuracy; team status: inactive.

export const SEASON_TEAM_ASSIGNMENTS: SeasonTeamAssignment[] = [
  // ── La Liga ───────────────────────────────────────────────
  { id: 'sta-2026-la-spartans',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'spartans',
    venueId: 'spartans-dart-pub', captain: 'Karolina Mauerer' },
  { id: 'sta-2026-la-ohne-jackie',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'ohne-jackie',
    venueId: 'fiaker-stueberl', captain: 'Toni Bauer' },
  { id: 'sta-2026-la-jolly-pirates-kts',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'jolly-pirates-kts',
    venueId: 'jolly-roger', captain: 'Melanie Preisendörfer' },
  { id: 'sta-2026-la-dc-null-bull',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'dc-null-bull',
    venueId: 'wirtshaus-lustiger-bauer', captain: 'Dieter Rogge' },
  { id: 'sta-2026-la-no-maam',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'no-maam',
    venueId: 'dc-moosach', captain: 'Zlatko Juric' },
  { id: 'sta-2026-la-les-dartagnons',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'les-dartagnons',
    venueId: 'jimmys-restaurant', captain: 'Hubert Kandlbinder' },

  // ── A1 Liga ───────────────────────────────────────────────
  { id: 'sta-2026-a1-alptraum',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'alptraum',
    venueId: 'dis-stueberl', captain: 'Thomas Wagner' },
  { id: 'sta-2026-a1-dc-animals-ii',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'dc-animals-ii',
    venueId: 'kegelkeller', captain: 'Alex Mückstein' },
  { id: 'sta-2026-a1-gambas',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'gambas',
    venueId: 'fiaker-stueberl', captain: 'Gerhart Romboy' },
  { id: 'sta-2026-a1-spartans-vi',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'spartans-vi',
    venueId: 'spartans-dart-pub', captain: 'Thomas Hofstetter' },
  { id: 'sta-2026-a1-sound-warriors',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'sound-warriors',
    venueId: 'jolly-roger', captain: 'Christian Rock' },
  { id: 'sta-2026-a1-game-over',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'game-over',
    venueId: 'wirtshaus-lustiger-bauer', captain: 'Annett Meyer' },

  // ── A2 Liga ───────────────────────────────────────────────
  // treff-nix-freimann: relegated from A1 early in season, now plays in A2
  { id: 'sta-2026-a2-treff-nix-freimann',
    seasonId: 'season-2026', leagueId: 'a2', teamId: 'treff-nix-freimann',
    venueId: 'gaststaette-esv-freimann', captain: 'Manuel Buchholz',
    notes: 'Transferred from A1 to A2 mid-season after early relegation (4 games in A1, 0 pts)' },
  { id: 'sta-2026-a2-silberpfeile-ii',
    seasonId: 'season-2026', leagueId: 'a2', teamId: 'silberpfeile-ii',
    venueId: 'wirtshaus-bei-toni', captain: 'Maik Koenig' },
  { id: 'sta-2026-a2-jolly-pirates-v',
    seasonId: 'season-2026', leagueId: 'a2', teamId: 'jolly-pirates-v',
    venueId: 'jolly-roger', captain: 'Harry Spitzenberger' },
  { id: 'sta-2026-a2-oldies-co',
    seasonId: 'season-2026', leagueId: 'a2', teamId: 'oldies-co',
    venueId: 'dis-stueberl', captain: 'Ute Hofmann' },
  { id: 'sta-2026-a2-de-wolperdinga',
    seasonId: 'season-2026', leagueId: 'a2', teamId: 'de-wolperdinga',
    venueId: 'bistro-118', captain: 'Mario Vaccaro',
    notes: 'Rückzug aus dem Spielbetrieb (Mai 2026)' },

  // ── B1 Liga ───────────────────────────────────────────────
  { id: 'sta-2026-b1-flying-fighters',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'flying-fighters',
    venueId: 'fiaker-stueberl', captain: 'Stephanie Vaccaro' },
  { id: 'sta-2026-b1-master-of-desaster',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'master-of-desaster',
    venueId: 'fiaker-stueberl', captain: 'Thomas Gämmerler' },
  { id: 'sta-2026-b1-flying-seven',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'flying-seven',
    venueId: 'wirtshaus-bei-toni', captain: 'Thomas Reisinger' },
  { id: 'sta-2026-b1-lucky-darts-one',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'lucky-darts-one',
    venueId: 'players', captain: 'Torsten Bauer' },
  { id: 'sta-2026-b1-de-hutzeldarter',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'de-hutzeldarter',
    venueId: 'bistro-118', captain: 'Christian Fürsicht' },
  { id: 'sta-2026-b1-massl-ghabt',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'massl-ghabt',
    venueId: 'heuboden-bar', captain: 'Markus Kniehl' },

  // ── B2 Liga ───────────────────────────────────────────────
  { id: 'sta-2026-b2-belfort-evolution',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'belfort-evolution',
    venueId: 'belfort-seven', captain: 'Dietmar Poppe' },
  { id: 'sta-2026-b2-fiaker-deife',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'fiaker-deife',
    venueId: 'fiaker-stueberl', captain: 'Christian Matejka' },
  { id: 'sta-2026-b2-freibad-bazis',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'freibad-bazis',
    venueId: 'fiaker-stueberl', captain: 'Andreas Strehle' },
  { id: 'sta-2026-b2-team-desaster',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'team-desaster',
    venueId: 'dc-moosach', captain: 'Stefan Fischer' },
  { id: 'sta-2026-b2-dc-dark-angels',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'dc-dark-angels',
    venueId: 'bistro-48', captain: 'Franz Eberl' },
  { id: 'sta-2026-b2-de-vogelwuidn',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'de-vogelwuidn',
    venueId: 'spartans-dart-pub', captain: 'Horst Sänger' },

  // ── C Liga ────────────────────────────────────────────────
  { id: 'sta-2026-c-wild-indians',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'wild-indians',
    venueId: 'machete-1', captain: 'Markus Steyer' },
  { id: 'sta-2026-c-muenchen-0815',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'muenchen-0815',
    venueId: 'wirtshaus-lustiger-bauer', captain: 'Lukasz Wiacek' },
  { id: 'sta-2026-c-lucky-darts-two',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'lucky-darts-two',
    venueId: 'players', captain: 'Susanne Bauer' },
  { id: 'sta-2026-c-funny-darters',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'funny-darters',
    venueId: 'sportsbar-live', captain: 'Marcus Kampmann' },
  { id: 'sta-2026-c-black-devils',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'black-devils',
    venueId: 'spartans-dart-pub', captain: 'Petra Rödl' },
  { id: 'sta-2026-c-fuenf-sterne-boazn',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'fuenf-sterne-boazn',
    venueId: 'trappentreu-stueberl', captain: 'Jutta Lachner' },
];

// ── Team-player assignments · Saison 2026 ──────────────────
// Source: dartunion.de · scraped 22.05.2026
// isCaptain confirmed from dartunion.de Kapitän column.
export const TEAM_PLAYER_ASSIGNMENTS: TeamPlayerAssignment[] = [

  // ── LA LIGA ─────────────────────────────────────────────
  // SPARTANS
  { id: 'tpa-2026-spa-thomas-fraundorfer', seasonId: 'season-2026', teamId: 'spartans', playerId: 'thomas-fraundorfer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-spa-jason-jedlicka', seasonId: 'season-2026', teamId: 'spartans', playerId: 'jason-jedlicka', status: 'active', isCaptain: false },
  { id: 'tpa-2026-spa-dejan-kovrilja', seasonId: 'season-2026', teamId: 'spartans', playerId: 'dejan-kovrilja', status: 'active', isCaptain: false },
  { id: 'tpa-2026-spa-silvi-lindner', seasonId: 'season-2026', teamId: 'spartans', playerId: 'silvi-lindner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-spa-antun-madaros', seasonId: 'season-2026', teamId: 'spartans', playerId: 'antun-madaros', status: 'active', isCaptain: false },
  { id: 'tpa-2026-spa-karolina-mauerer', seasonId: 'season-2026', teamId: 'spartans', playerId: 'karolina-mauerer', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-spa-stefan-schiegg', seasonId: 'season-2026', teamId: 'spartans', playerId: 'stefan-schiegg', status: 'active', isCaptain: false },
  { id: 'tpa-2026-spa-markus-schneider', seasonId: 'season-2026', teamId: 'spartans', playerId: 'markus-schneider', status: 'active', isCaptain: false },
  { id: 'tpa-2026-spa-hansi-sliwanski', seasonId: 'season-2026', teamId: 'spartans', playerId: 'hansi-sliwanski', status: 'active', isCaptain: false },
  { id: 'tpa-2026-spa-florian-steckermeier', seasonId: 'season-2026', teamId: 'spartans', playerId: 'florian-steckermeier', status: 'active', isCaptain: false },
  { id: 'tpa-2026-spa-andrej-tereschenko', seasonId: 'season-2026', teamId: 'spartans', playerId: 'andrej-tereschenko', status: 'active', isCaptain: false },
  { id: 'tpa-2026-spa-nico-vasiliadis', seasonId: 'season-2026', teamId: 'spartans', playerId: 'nico-vasiliadis', status: 'active', isCaptain: false },
  { id: 'tpa-2026-spa-dirk-wegner', seasonId: 'season-2026', teamId: 'spartans', playerId: 'dirk-wegner', status: 'active', isCaptain: false },
  // OHNE JACKIE
  { id: 'tpa-2026-oj-toni-bauer', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'toni-bauer', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-oj-nicklas-bernhardt', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'nicklas-bernhardt', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-guenes-cam', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'guenes-cam', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-stephan-ducke', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'stephan-ducke', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-manfred-eischer', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'manfred-eischer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-martin-lehner', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'martin-lehner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-zlatko-lozancic', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'zlatko-lozancic', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-chriss-lwowski', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'chriss-lwowski', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-richi-pankratz', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'richi-pankratz', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-jimmy-pogremno', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'jimmy-pogremno', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-alex-rall', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'alex-rall', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-patrick-ruhland', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'patrick-ruhland', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-chris-schaeffer', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'chris-schaeffer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-peter-seidl', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'peter-seidl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-oj-bene-wolf', seasonId: 'season-2026', teamId: 'ohne-jackie', playerId: 'bene-wolf', status: 'active', isCaptain: false },
  // DC NULL BULL
  { id: 'tpa-2026-dnb-oorri-arsen', seasonId: 'season-2026', teamId: 'dc-null-bull', playerId: 'oorri-arsen', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dnb-arben-halitjaha', seasonId: 'season-2026', teamId: 'dc-null-bull', playerId: 'arben-halitjaha', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dnb-fatmir-hasanaj', seasonId: 'season-2026', teamId: 'dc-null-bull', playerId: 'fatmir-hasanaj', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dnb-efraim-idrizi', seasonId: 'season-2026', teamId: 'dc-null-bull', playerId: 'efraim-idrizi', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dnb-dimos-katsikas', seasonId: 'season-2026', teamId: 'dc-null-bull', playerId: 'dimos-katsikas', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dnb-avni-loshi', seasonId: 'season-2026', teamId: 'dc-null-bull', playerId: 'avni-loshi', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dnb-dado-pajdakovic', seasonId: 'season-2026', teamId: 'dc-null-bull', playerId: 'dado-pajdakovic', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dnb-dieter-rogge', seasonId: 'season-2026', teamId: 'dc-null-bull', playerId: 'dieter-rogge', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-dnb-zoran-subotic', seasonId: 'season-2026', teamId: 'dc-null-bull', playerId: 'zoran-subotic', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dnb-bobby-vayrynen', seasonId: 'season-2026', teamId: 'dc-null-bull', playerId: 'bobby-vayrynen', status: 'active', isCaptain: false },
  // JOLLY PIRATES KT'S
  { id: 'tpa-2026-jpk-sascha-bernardi', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'sascha-bernardi', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-maximilian-burgis', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'maximilian-burgis', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-steven-eisenhofer', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'steven-eisenhofer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-stjepan-feljan', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'stjepan-feljan', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-geli-galatovic', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'geli-galatovic', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-stjpan-holetic', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'stjpan-holetic', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-mladen-obrstar', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'mladen-obrstar', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-florian-preis', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'florian-preis', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-melanie-preisendoerfer', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'melanie-preisendoerfer', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-jpk-christian-reiter', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'christian-reiter', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-moritz-richter', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'moritz-richter', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-christian-schmidkunz', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'christian-schmidkunz', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-johannes-schwaiger', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'johannes-schwaiger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-dirk-steinbrueck', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'dirk-steinbrueck', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-philipp-steinbrueck', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'philipp-steinbrueck', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-alex-strigl', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'alex-strigl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpk-claus-ziebuhr', seasonId: 'season-2026', teamId: 'jolly-pirates-kts', playerId: 'claus-ziebuhr', status: 'active', isCaptain: false },
  // LES DARTAGNONS
  { id: 'tpa-2026-ld-michael-haimmerer', seasonId: 'season-2026', teamId: 'les-dartagnons', playerId: 'michael-haimmerer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld-hubert-kandlbinder', seasonId: 'season-2026', teamId: 'les-dartagnons', playerId: 'hubert-kandlbinder', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-ld-andreas-knoblauch', seasonId: 'season-2026', teamId: 'les-dartagnons', playerId: 'andreas-knoblauch', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld-dieter-rauschmeier', seasonId: 'season-2026', teamId: 'les-dartagnons', playerId: 'dieter-rauschmeier', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld-alexander-resch', seasonId: 'season-2026', teamId: 'les-dartagnons', playerId: 'alexander-resch', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld-daniel-resch', seasonId: 'season-2026', teamId: 'les-dartagnons', playerId: 'daniel-resch', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld-thomas-samhuber', seasonId: 'season-2026', teamId: 'les-dartagnons', playerId: 'thomas-samhuber', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld-ina-schaper', seasonId: 'season-2026', teamId: 'les-dartagnons', playerId: 'ina-schaper', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld-florian-schreiner', seasonId: 'season-2026', teamId: 'les-dartagnons', playerId: 'florian-schreiner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld-regina-ziegltrum', seasonId: 'season-2026', teamId: 'les-dartagnons', playerId: 'regina-ziegltrum', status: 'active', isCaptain: false },
  // NO MA'AM
  { id: 'tpa-2026-nm-martin-degel', seasonId: 'season-2026', teamId: 'no-maam', playerId: 'martin-degel', status: 'active', isCaptain: false },
  { id: 'tpa-2026-nm-markus-hartmann', seasonId: 'season-2026', teamId: 'no-maam', playerId: 'markus-hartmann', status: 'active', isCaptain: false },
  { id: 'tpa-2026-nm-dragan-herceg', seasonId: 'season-2026', teamId: 'no-maam', playerId: 'dragan-herceg', status: 'active', isCaptain: false },
  { id: 'tpa-2026-nm-zlatko-juric', seasonId: 'season-2026', teamId: 'no-maam', playerId: 'zlatko-juric', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-nm-patrick-mueller', seasonId: 'season-2026', teamId: 'no-maam', playerId: 'patrick-mueller', status: 'active', isCaptain: false },
  { id: 'tpa-2026-nm-andre-schwarz', seasonId: 'season-2026', teamId: 'no-maam', playerId: 'andre-schwarz', status: 'active', isCaptain: false },
  { id: 'tpa-2026-nm-christian-sowitsch', seasonId: 'season-2026', teamId: 'no-maam', playerId: 'christian-sowitsch', status: 'active', isCaptain: false },
  { id: 'tpa-2026-nm-wolfgang-straubinger', seasonId: 'season-2026', teamId: 'no-maam', playerId: 'wolfgang-straubinger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-nm-florian-wimmer', seasonId: 'season-2026', teamId: 'no-maam', playerId: 'florian-wimmer', status: 'active', isCaptain: false },

  // ── A1 LIGA ─────────────────────────────────────────────
  // ALPTRAUM
  { id: 'tpa-2026-alt-martin-helmbrecht', seasonId: 'season-2026', teamId: 'alptraum', playerId: 'martin-helmbrecht', status: 'active', isCaptain: false },
  { id: 'tpa-2026-alt-stefan-piperea', seasonId: 'season-2026', teamId: 'alptraum', playerId: 'stefan-piperea', status: 'active', isCaptain: false },
  { id: 'tpa-2026-alt-thomas-ponzlet', seasonId: 'season-2026', teamId: 'alptraum', playerId: 'thomas-ponzlet', status: 'active', isCaptain: false },
  { id: 'tpa-2026-alt-hans-reinicke', seasonId: 'season-2026', teamId: 'alptraum', playerId: 'hans-reinicke', status: 'active', isCaptain: false },
  { id: 'tpa-2026-alt-ralf-schricker', seasonId: 'season-2026', teamId: 'alptraum', playerId: 'ralf-schricker', status: 'active', isCaptain: false },
  { id: 'tpa-2026-alt-martin-steiner', seasonId: 'season-2026', teamId: 'alptraum', playerId: 'martin-steiner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-alt-sanel-tokalic', seasonId: 'season-2026', teamId: 'alptraum', playerId: 'sanel-tokalic', status: 'active', isCaptain: false },
  { id: 'tpa-2026-alt-thomas-wagner', seasonId: 'season-2026', teamId: 'alptraum', playerId: 'thomas-wagner', status: 'active', isCaptain: true  },
  // DC ANIMALS II
  { id: 'tpa-2026-dca-reinhard-brunnthaler', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'reinhard-brunnthaler', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-steven-distelberger', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'steven-distelberger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-lilo-ernst', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'lilo-ernst', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-ronja-frisch', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'ronja-frisch', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-tatjana-frisch', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'tatjana-frisch', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-alex-gerhartsreiter', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'alex-gerhartsreiter', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-joerg-konrad', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'joerg-konrad', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-natascha-lausch', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'natascha-lausch', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-kevin-loeffler', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'kevin-loeffler', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-frank-maik', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'frank-maik', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-alex-mueckstein', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'alex-mueckstein', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-dca-patrick-spaeth', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'patrick-spaeth', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-ivan-stanisic', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'ivan-stanisic', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dca-lutz-stockner', seasonId: 'season-2026', teamId: 'dc-animals-ii', playerId: 'lutz-stockner', status: 'active', isCaptain: false },
  // GAMBAS
  { id: 'tpa-2026-gmb-rickey-eiseb', seasonId: 'season-2026', teamId: 'gambas', playerId: 'rickey-eiseb', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmb-peter-grosswieser', seasonId: 'season-2026', teamId: 'gambas', playerId: 'peter-grosswieser', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmb-thomas-hackl', seasonId: 'season-2026', teamId: 'gambas', playerId: 'thomas-hackl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmb-axel-heider', seasonId: 'season-2026', teamId: 'gambas', playerId: 'axel-heider', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmb-romano-kaspar', seasonId: 'season-2026', teamId: 'gambas', playerId: 'romano-kaspar', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmb-douglas-kelterborn', seasonId: 'season-2026', teamId: 'gambas', playerId: 'douglas-kelterborn', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmb-michael-klos', seasonId: 'season-2026', teamId: 'gambas', playerId: 'michael-klos', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmb-harald-rathgeb', seasonId: 'season-2026', teamId: 'gambas', playerId: 'harald-rathgeb', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmb-gerhart-romboy', seasonId: 'season-2026', teamId: 'gambas', playerId: 'gerhart-romboy', status: 'active', isCaptain: true  },
  // SPARTANS VI
  { id: 'tpa-2026-sp6-stefano-bernecker', seasonId: 'season-2026', teamId: 'spartans-vi', playerId: 'stefano-bernecker', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sp6-michael-boekel', seasonId: 'season-2026', teamId: 'spartans-vi', playerId: 'michael-boekel', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sp6-martina-boekel', seasonId: 'season-2026', teamId: 'spartans-vi', playerId: 'martina-boekel', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sp6-franz-gegenfurtner', seasonId: 'season-2026', teamId: 'spartans-vi', playerId: 'franz-gegenfurtner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sp6-steven-gnade', seasonId: 'season-2026', teamId: 'spartans-vi', playerId: 'steven-gnade', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sp6-markus-hecht', seasonId: 'season-2026', teamId: 'spartans-vi', playerId: 'markus-hecht', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sp6-thomas-hofstetter', seasonId: 'season-2026', teamId: 'spartans-vi', playerId: 'thomas-hofstetter', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-sp6-ludwig-ploetz', seasonId: 'season-2026', teamId: 'spartans-vi', playerId: 'ludwig-ploetz', status: 'active', isCaptain: false },
  // SOUND WARRIOR'S
  { id: 'tpa-2026-sow-ursu-alexandru-florin', seasonId: 'season-2026', teamId: 'sound-warriors', playerId: 'ursu-alexandru-florin', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sow-christian-bartl', seasonId: 'season-2026', teamId: 'sound-warriors', playerId: 'christian-bartl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sow-thorsten-edelmann', seasonId: 'season-2026', teamId: 'sound-warriors', playerId: 'thorsten-edelmann', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sow-phillip-edelmann', seasonId: 'season-2026', teamId: 'sound-warriors', playerId: 'phillip-edelmann', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sow-jasmin-elmer', seasonId: 'season-2026', teamId: 'sound-warriors', playerId: 'jasmin-elmer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sow-florian-fink', seasonId: 'season-2026', teamId: 'sound-warriors', playerId: 'florian-fink', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sow-christian-kabermann', seasonId: 'season-2026', teamId: 'sound-warriors', playerId: 'christian-kabermann', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sow-herbert-ohlenforst', seasonId: 'season-2026', teamId: 'sound-warriors', playerId: 'herbert-ohlenforst', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sow-christian-rock', seasonId: 'season-2026', teamId: 'sound-warriors', playerId: 'christian-rock', status: 'active', isCaptain: true  },
  // GAME OVER
  { id: 'tpa-2026-gmo-sonja-krieger', seasonId: 'season-2026', teamId: 'game-over', playerId: 'sonja-krieger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmo-bosko-lebar', seasonId: 'season-2026', teamId: 'game-over', playerId: 'bosko-lebar', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmo-annett-meyer', seasonId: 'season-2026', teamId: 'game-over', playerId: 'annett-meyer', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-gmo-andre-meyer', seasonId: 'season-2026', teamId: 'game-over', playerId: 'andre-meyer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmo-gabriele-pintaric', seasonId: 'season-2026', teamId: 'game-over', playerId: 'gabriele-pintaric', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmo-manuel-schaeffler', seasonId: 'season-2026', teamId: 'game-over', playerId: 'manuel-schaeffler', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmo-reiner-schlutow', seasonId: 'season-2026', teamId: 'game-over', playerId: 'reiner-schlutow', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmo-michael-schoeppe', seasonId: 'season-2026', teamId: 'game-over', playerId: 'michael-schoeppe', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmo-robert-vasev', seasonId: 'season-2026', teamId: 'game-over', playerId: 'robert-vasev', status: 'active', isCaptain: false },
  { id: 'tpa-2026-gmo-denise-wiche', seasonId: 'season-2026', teamId: 'game-over', playerId: 'denise-wiche', status: 'active', isCaptain: false },

  // ── A2 LIGA ─────────────────────────────────────────────
  // TREFF NIX FREIMANN
  { id: 'tpa-2026-tnf-markus-attenberger', seasonId: 'season-2026', teamId: 'treff-nix-freimann', playerId: 'markus-attenberger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tnf-bernhard-brunner', seasonId: 'season-2026', teamId: 'treff-nix-freimann', playerId: 'bernhard-brunner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tnf-manuel-buchholz', seasonId: 'season-2026', teamId: 'treff-nix-freimann', playerId: 'manuel-buchholz', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-tnf-julia-freudensprung', seasonId: 'season-2026', teamId: 'treff-nix-freimann', playerId: 'julia-freudensprung', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tnf-markus-groetsch', seasonId: 'season-2026', teamId: 'treff-nix-freimann', playerId: 'markus-groetsch', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tnf-maximilian-halemba', seasonId: 'season-2026', teamId: 'treff-nix-freimann', playerId: 'maximilian-halemba', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tnf-markus-haratsch', seasonId: 'season-2026', teamId: 'treff-nix-freimann', playerId: 'markus-haratsch', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tnf-thomas-kueblboeck', seasonId: 'season-2026', teamId: 'treff-nix-freimann', playerId: 'thomas-kueblboeck', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tnf-rainer-langhof', seasonId: 'season-2026', teamId: 'treff-nix-freimann', playerId: 'rainer-langhof', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tnf-zoltan-toth', seasonId: 'season-2026', teamId: 'treff-nix-freimann', playerId: 'zoltan-toth', status: 'active', isCaptain: false },
  // SILBERPFEILE II
  { id: 'tpa-2026-sil-mario-bauriedl', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'mario-bauriedl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sil-christian-cohnen', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'christian-cohnen', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sil-michael-daxenberger', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'michael-daxenberger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sil-axel-hilger', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'axel-hilger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sil-maxi-holzhaeuser', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'maxi-holzhaeuser', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sil-friedhelm-jenemann', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'friedhelm-jenemann', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sil-maik-koenig', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'maik-koenig', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-sil-robert-plesa', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'robert-plesa', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sil-michael-plesa', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'michael-plesa', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sil-heike-schwarz', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'heike-schwarz', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sil-mandy-walter', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'mandy-walter', status: 'active', isCaptain: false },
  { id: 'tpa-2026-sil-hans-ziegler', seasonId: 'season-2026', teamId: 'silberpfeile-ii', playerId: 'hans-ziegler', status: 'active', isCaptain: false },
  // JOLLY PIRATES V
  { id: 'tpa-2026-jpv-stefan-armbruster', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'stefan-armbruster', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpv-sven-armbruster', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'sven-armbruster', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpv-willi-blomann', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'willi-blomann', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpv-heribert-kraus', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'heribert-kraus', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpv-sophie-mayrhofer', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'sophie-mayrhofer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpv-robert-mendl', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'robert-mendl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpv-miki-nyiri', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'miki-nyiri', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpv-alina-preisendoerfer', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'alina-preisendoerfer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpv-tim-schreiber', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'tim-schreiber', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpv-andree-sonntag', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'andree-sonntag', status: 'active', isCaptain: false },
  { id: 'tpa-2026-jpv-harry-spitzenberger', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'harry-spitzenberger', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-jpv-theodoros-tsirikos', seasonId: 'season-2026', teamId: 'jolly-pirates-v', playerId: 'theodoros-tsirikos', status: 'active', isCaptain: false },
  // DE WOLPERDINGA
  { id: 'tpa-2026-dwp-mehmet-bahadir', seasonId: 'season-2026', teamId: 'de-wolperdinga', playerId: 'mehmet-bahadir', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dwp-tom-kugler', seasonId: 'season-2026', teamId: 'de-wolperdinga', playerId: 'tom-kugler', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dwp-addy-speier', seasonId: 'season-2026', teamId: 'de-wolperdinga', playerId: 'addy-speier', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dwp-frank-steininger', seasonId: 'season-2026', teamId: 'de-wolperdinga', playerId: 'frank-steininger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dwp-mario-vaccaro', seasonId: 'season-2026', teamId: 'de-wolperdinga', playerId: 'mario-vaccaro', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-dwp-franz-weiller', seasonId: 'season-2026', teamId: 'de-wolperdinga', playerId: 'franz-weiller', status: 'active', isCaptain: false },
  // OLDIES & CO
  { id: 'tpa-2026-old-diethard-elling', seasonId: 'season-2026', teamId: 'oldies-co', playerId: 'diethard-elling', status: 'active', isCaptain: false },
  { id: 'tpa-2026-old-fabian-hilse', seasonId: 'season-2026', teamId: 'oldies-co', playerId: 'fabian-hilse', status: 'active', isCaptain: false },
  { id: 'tpa-2026-old-thomas-hilse', seasonId: 'season-2026', teamId: 'oldies-co', playerId: 'thomas-hilse', status: 'active', isCaptain: false },
  { id: 'tpa-2026-old-ute-hofmann', seasonId: 'season-2026', teamId: 'oldies-co', playerId: 'ute-hofmann', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-old-peter-sonntag', seasonId: 'season-2026', teamId: 'oldies-co', playerId: 'peter-sonntag', status: 'active', isCaptain: false },

  // ── B1 LIGA ─────────────────────────────────────────────
  // FLYING FIGHTERS
  { id: 'tpa-2026-flf-andy-benda', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'andy-benda', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-uli-biber', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'uli-biber', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-dominik-brengel', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'dominik-brengel', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-martin-fischer', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'martin-fischer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-alexander-jaworeck', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'alexander-jaworeck', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-markus-kuchenbaur', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'markus-kuchenbaur', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-nikola-masic', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'nikola-masic', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-yves-muehrer', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'yves-muehrer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-ralf-mueller', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'ralf-mueller', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-jochen-schick', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'jochen-schick', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-philipp-urban', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'philipp-urban', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-stephanie-vaccaro', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'stephanie-vaccaro', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-flf-klaus-wasner', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'klaus-wasner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-flf-julia-wolf', seasonId: 'season-2026', teamId: 'flying-fighters', playerId: 'julia-wolf', status: 'active', isCaptain: false },
  // MASTER OF DESASTER
  { id: 'tpa-2026-mod-deniz-firat', seasonId: 'season-2026', teamId: 'master-of-desaster', playerId: 'deniz-firat', status: 'active', isCaptain: false },
  { id: 'tpa-2026-mod-sabine-bine-firat', seasonId: 'season-2026', teamId: 'master-of-desaster', playerId: 'sabine-bine-firat', status: 'active', isCaptain: false },
  { id: 'tpa-2026-mod-thomas-gammerler', seasonId: 'season-2026', teamId: 'master-of-desaster', playerId: 'thomas-gammerler', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-mod-jan-groves', seasonId: 'season-2026', teamId: 'master-of-desaster', playerId: 'jan-groves', status: 'active', isCaptain: false },
  { id: 'tpa-2026-mod-angela-hirt', seasonId: 'season-2026', teamId: 'master-of-desaster', playerId: 'angela-hirt', status: 'active', isCaptain: false },
  { id: 'tpa-2026-mod-christiane-kopp', seasonId: 'season-2026', teamId: 'master-of-desaster', playerId: 'christiane-kopp', status: 'active', isCaptain: false },
  { id: 'tpa-2026-mod-benjamin-kouhi', seasonId: 'season-2026', teamId: 'master-of-desaster', playerId: 'benjamin-kouhi', status: 'active', isCaptain: false },
  { id: 'tpa-2026-mod-klaus-rother', seasonId: 'season-2026', teamId: 'master-of-desaster', playerId: 'klaus-rother', status: 'active', isCaptain: false },
  { id: 'tpa-2026-mod-thomas-schmid', seasonId: 'season-2026', teamId: 'master-of-desaster', playerId: 'thomas-schmid', status: 'active', isCaptain: false },
  { id: 'tpa-2026-mod-andre-widl', seasonId: 'season-2026', teamId: 'master-of-desaster', playerId: 'andre-widl', status: 'active', isCaptain: false },
  // FLYING SEVEN
  { id: 'tpa-2026-fl7-franz-freinberger', seasonId: 'season-2026', teamId: 'flying-seven', playerId: 'franz-freinberger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fl7-carmen-bianca-loedl', seasonId: 'season-2026', teamId: 'flying-seven', playerId: 'carmen-bianca-loedl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fl7-thomas-reisinger', seasonId: 'season-2026', teamId: 'flying-seven', playerId: 'thomas-reisinger', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-fl7-erika-reisinger', seasonId: 'season-2026', teamId: 'flying-seven', playerId: 'erika-reisinger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fl7-daniela-schmelzer', seasonId: 'season-2026', teamId: 'flying-seven', playerId: 'daniela-schmelzer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fl7-patrick-schmelzer', seasonId: 'season-2026', teamId: 'flying-seven', playerId: 'patrick-schmelzer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fl7-stefan-witteck', seasonId: 'season-2026', teamId: 'flying-seven', playerId: 'stefan-witteck', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fl7-stefan-zueckert', seasonId: 'season-2026', teamId: 'flying-seven', playerId: 'stefan-zueckert', status: 'active', isCaptain: false },
  // LUCKY DARTS ONE
  { id: 'tpa-2026-ld1-roberto-altavilla', seasonId: 'season-2026', teamId: 'lucky-darts-one', playerId: 'roberto-altavilla', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld1-torsten-bauer', seasonId: 'season-2026', teamId: 'lucky-darts-one', playerId: 'torsten-bauer', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-ld1-ciaran-dugdale', seasonId: 'season-2026', teamId: 'lucky-darts-one', playerId: 'ciaran-dugdale', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld1-michael-exner', seasonId: 'season-2026', teamId: 'lucky-darts-one', playerId: 'michael-exner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld1-stefan-friedel', seasonId: 'season-2026', teamId: 'lucky-darts-one', playerId: 'stefan-friedel', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld1-christian-haumer', seasonId: 'season-2026', teamId: 'lucky-darts-one', playerId: 'christian-haumer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld1-marvin-kommescher', seasonId: 'season-2026', teamId: 'lucky-darts-one', playerId: 'marvin-kommescher', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ld1-lucas-ruhland', seasonId: 'season-2026', teamId: 'lucky-darts-one', playerId: 'lucas-ruhland', status: 'active', isCaptain: false },
  // DE HUTZELDARTER
  { id: 'tpa-2026-dhd-stefan-arnold', seasonId: 'season-2026', teamId: 'de-hutzeldarter', playerId: 'stefan-arnold', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dhd-hans-burkhardt', seasonId: 'season-2026', teamId: 'de-hutzeldarter', playerId: 'hans-burkhardt', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dhd-christian-fuersicht', seasonId: 'season-2026', teamId: 'de-hutzeldarter', playerId: 'christian-fuersicht', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-dhd-robert-hoppe', seasonId: 'season-2026', teamId: 'de-hutzeldarter', playerId: 'robert-hoppe', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dhd-christoph-loeb', seasonId: 'season-2026', teamId: 'de-hutzeldarter', playerId: 'christoph-loeb', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dhd-thomas-loeffler', seasonId: 'season-2026', teamId: 'de-hutzeldarter', playerId: 'thomas-loeffler', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dhd-patrick-meyer', seasonId: 'season-2026', teamId: 'de-hutzeldarter', playerId: 'patrick-meyer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dhd-fritz-mueller', seasonId: 'season-2026', teamId: 'de-hutzeldarter', playerId: 'fritz-mueller', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dhd-beatrix-paintner-tuite', seasonId: 'season-2026', teamId: 'de-hutzeldarter', playerId: 'beatrix-paintner-tuite', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dhd-nebojsa-bole-petrovic', seasonId: 'season-2026', teamId: 'de-hutzeldarter', playerId: 'nebojsa-bole-petrovic', status: 'active', isCaptain: false },
  // MASSL GHABT
  { id: 'tpa-2026-msg-michael-doerner', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'michael-doerner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-msg-peter-duerrbeck', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'peter-duerrbeck', status: 'active', isCaptain: false },
  { id: 'tpa-2026-msg-florian-erhard', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'florian-erhard', status: 'active', isCaptain: false },
  { id: 'tpa-2026-msg-markus-kniehl', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'markus-kniehl', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-msg-erdal-memet', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'erdal-memet', status: 'active', isCaptain: false },
  { id: 'tpa-2026-msg-oliver-pabel', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'oliver-pabel', status: 'active', isCaptain: false },
  { id: 'tpa-2026-msg-ioannis-pechlivanidis', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'ioannis-pechlivanidis', status: 'active', isCaptain: false },
  { id: 'tpa-2026-msg-ely-reiter', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'ely-reiter', status: 'active', isCaptain: false },
  { id: 'tpa-2026-msg-josef-stahl', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'josef-stahl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-msg-franz-thoma', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'franz-thoma', status: 'active', isCaptain: false },
  { id: 'tpa-2026-msg-mirek-wasi-watzlawek', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'mirek-wasi-watzlawek', status: 'active', isCaptain: false },
  { id: 'tpa-2026-msg-damaris-wilcox', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'damaris-wilcox', status: 'active', isCaptain: false },
  { id: 'tpa-2026-msg-denise-wudtke-kniehl', seasonId: 'season-2026', teamId: 'massl-ghabt', playerId: 'denise-wudtke-kniehl', status: 'active', isCaptain: false },

  // ── B2 LIGA ─────────────────────────────────────────────
  // BELFORT EVOLUTION
  { id: 'tpa-2026-bev-marcellino-berg', seasonId: 'season-2026', teamId: 'belfort-evolution', playerId: 'marcellino-berg', status: 'active', isCaptain: false },
  { id: 'tpa-2026-bev-georg-bleicher', seasonId: 'season-2026', teamId: 'belfort-evolution', playerId: 'georg-bleicher', status: 'active', isCaptain: false },
  { id: 'tpa-2026-bev-manuela-dinkel', seasonId: 'season-2026', teamId: 'belfort-evolution', playerId: 'manuela-dinkel', status: 'active', isCaptain: false },
  { id: 'tpa-2026-bev-edith-jaeger', seasonId: 'season-2026', teamId: 'belfort-evolution', playerId: 'edith-jaeger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-bev-manfred-kling', seasonId: 'season-2026', teamId: 'belfort-evolution', playerId: 'manfred-kling', status: 'active', isCaptain: false },
  { id: 'tpa-2026-bev-christine-pluta', seasonId: 'season-2026', teamId: 'belfort-evolution', playerId: 'christine-pluta', status: 'active', isCaptain: false },
  { id: 'tpa-2026-bev-dominik-poppe', seasonId: 'season-2026', teamId: 'belfort-evolution', playerId: 'dominik-poppe', status: 'active', isCaptain: false },
  { id: 'tpa-2026-bev-dietmar-poppe', seasonId: 'season-2026', teamId: 'belfort-evolution', playerId: 'dietmar-poppe', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-bev-daniel-richter', seasonId: 'season-2026', teamId: 'belfort-evolution', playerId: 'daniel-richter', status: 'active', isCaptain: false },
  { id: 'tpa-2026-bev-heinz-roggan', seasonId: 'season-2026', teamId: 'belfort-evolution', playerId: 'heinz-roggan', status: 'active', isCaptain: false },
  { id: 'tpa-2026-bev-walter-steckermeier', seasonId: 'season-2026', teamId: 'belfort-evolution', playerId: 'walter-steckermeier', status: 'active', isCaptain: false },
  // FIAKER DEIFE
  { id: 'tpa-2026-fdf-sven-albrecht', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'sven-albrecht', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fdf-bernhard-hoffmann', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'bernhard-hoffmann', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fdf-tamara-karnoll', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'tamara-karnoll', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fdf-markus-kirschner', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'markus-kirschner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fdf-timo-lewerenz', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'timo-lewerenz', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fdf-christian-matejka', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'christian-matejka', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-fdf-christian-otto', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'christian-otto', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fdf-annika-pfaffenzeller', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'annika-pfaffenzeller', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fdf-yves-scherer', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'yves-scherer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fdf-dani-schmidhammer', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'dani-schmidhammer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fdf-joerg-schmidt', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'joerg-schmidt', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fdf-michael-schreil', seasonId: 'season-2026', teamId: 'fiaker-deife', playerId: 'michael-schreil', status: 'active', isCaptain: false },
  // FREIBAD BAZIS
  { id: 'tpa-2026-fbb-moritz-becker', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'moritz-becker', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fbb-brendan-koeniger', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'brendan-koeniger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fbb-christian-kuntscher', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'christian-kuntscher', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fbb-matthias-mayring', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'matthias-mayring', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fbb-denis-nokic', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'denis-nokic', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fbb-christoph-preiss', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'christoph-preiss', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fbb-manuel-rauch', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'manuel-rauch', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fbb-sebastian-rogge', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'sebastian-rogge', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fbb-andreas-strehle', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'andreas-strehle', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-fbb-julia-strehle', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'julia-strehle', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fbb-andreas-walter', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'andreas-walter', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fbb-tim-weber', seasonId: 'season-2026', teamId: 'freibad-bazis', playerId: 'tim-weber', status: 'active', isCaptain: false },
  // TEAM DESASTER
  { id: 'tpa-2026-tds-florian-dospil', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'florian-dospil', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tds-stefan-fischer', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'stefan-fischer', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-tds-helmut-folie', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'helmut-folie', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tds-reiner-heckmann', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'reiner-heckmann', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tds-markus-hiermann', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'markus-hiermann', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tds-mario-krauss', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'mario-krauss', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tds-uli-kurz', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'uli-kurz', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tds-markus-kurz', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'markus-kurz', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tds-anita-lux', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'anita-lux', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tds-benjamin-schuy', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'benjamin-schuy', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tds-stephan-soos', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'stephan-soos', status: 'active', isCaptain: false },
  { id: 'tpa-2026-tds-tamara-weinberger', seasonId: 'season-2026', teamId: 'team-desaster', playerId: 'tamara-weinberger', status: 'active', isCaptain: false },
  // DC DARK ANGELS
  { id: 'tpa-2026-dda-sabine-eberl', seasonId: 'season-2026', teamId: 'dc-dark-angels', playerId: 'sabine-eberl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dda-franz-eberl', seasonId: 'season-2026', teamId: 'dc-dark-angels', playerId: 'franz-eberl', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-dda-justin-marco-eberl', seasonId: 'season-2026', teamId: 'dc-dark-angels', playerId: 'justin-marco-eberl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dda-robert-walter', seasonId: 'season-2026', teamId: 'dc-dark-angels', playerId: 'robert-walter', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dda-karin-walter', seasonId: 'season-2026', teamId: 'dc-dark-angels', playerId: 'karin-walter', status: 'active', isCaptain: false },
  // DE VOGELWUID'N
  { id: 'tpa-2026-dvn-armin-abraham', seasonId: 'season-2026', teamId: 'de-vogelwuidn', playerId: 'armin-abraham', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dvn-petra-bachmair', seasonId: 'season-2026', teamId: 'de-vogelwuidn', playerId: 'petra-bachmair', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dvn-sylwester-gnatowski', seasonId: 'season-2026', teamId: 'de-vogelwuidn', playerId: 'sylwester-gnatowski', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dvn-daniel-leitze', seasonId: 'season-2026', teamId: 'de-vogelwuidn', playerId: 'daniel-leitze', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dvn-steve-lewik', seasonId: 'season-2026', teamId: 'de-vogelwuidn', playerId: 'steve-lewik', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dvn-martin-marcinko', seasonId: 'season-2026', teamId: 'de-vogelwuidn', playerId: 'martin-marcinko', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dvn-karin-oellerer', seasonId: 'season-2026', teamId: 'de-vogelwuidn', playerId: 'karin-oellerer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dvn-petra-rohr', seasonId: 'season-2026', teamId: 'de-vogelwuidn', playerId: 'petra-rohr', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dvn-horst-saenger', seasonId: 'season-2026', teamId: 'de-vogelwuidn', playerId: 'horst-saenger', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-dvn-ralf-schweitzer', seasonId: 'season-2026', teamId: 'de-vogelwuidn', playerId: 'ralf-schweitzer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-dvn-pawel-szymanski', seasonId: 'season-2026', teamId: 'de-vogelwuidn', playerId: 'pawel-szymanski', status: 'active', isCaptain: false },

  // ── C LIGA ─────────────────────────────────────────────
  // WILD INDIANS
  { id: 'tpa-2026-wid-juergen-baumstark', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'juergen-baumstark', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-reinhold-behrend', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'reinhold-behrend', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-stephan-brunner', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'stephan-brunner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-gisi-cornelius', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'gisi-cornelius', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-franz-cornelius', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'franz-cornelius', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-peter-keil', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'peter-keil', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-marion-koehler', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'marion-koehler', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-monika-maier', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'monika-maier', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-linda-maier', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'linda-maier', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-nik-preis', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'nik-preis', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-eike-schuster', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'eike-schuster', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-markus-steyer', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'markus-steyer', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-wid-roman-treichel', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'roman-treichel', status: 'active', isCaptain: false },
  { id: 'tpa-2026-wid-claudia-vaszi', seasonId: 'season-2026', teamId: 'wild-indians', playerId: 'claudia-vaszi', status: 'active', isCaptain: false },
  // MÜNCHEN 08/15
  { id: 'tpa-2026-m08-michael-gross', seasonId: 'season-2026', teamId: 'muenchen-0815', playerId: 'michael-gross', status: 'active', isCaptain: false },
  { id: 'tpa-2026-m08-andreas-kirschbauer', seasonId: 'season-2026', teamId: 'muenchen-0815', playerId: 'andreas-kirschbauer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-m08-waltraud-kranabetter', seasonId: 'season-2026', teamId: 'muenchen-0815', playerId: 'waltraud-kranabetter', status: 'active', isCaptain: false },
  { id: 'tpa-2026-m08-herbert-kranabetter', seasonId: 'season-2026', teamId: 'muenchen-0815', playerId: 'herbert-kranabetter', status: 'active', isCaptain: false },
  { id: 'tpa-2026-m08-erwin-listl', seasonId: 'season-2026', teamId: 'muenchen-0815', playerId: 'erwin-listl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-m08-brane-sikimic', seasonId: 'season-2026', teamId: 'muenchen-0815', playerId: 'brane-sikimic', status: 'active', isCaptain: false },
  { id: 'tpa-2026-m08-robert-stelzig', seasonId: 'season-2026', teamId: 'muenchen-0815', playerId: 'robert-stelzig', status: 'active', isCaptain: false },
  { id: 'tpa-2026-m08-kostas-tsopanoglou', seasonId: 'season-2026', teamId: 'muenchen-0815', playerId: 'kostas-tsopanoglou', status: 'active', isCaptain: false },
  { id: 'tpa-2026-m08-lukasz-wiacek', seasonId: 'season-2026', teamId: 'muenchen-0815', playerId: 'lukasz-wiacek', status: 'active', isCaptain: true  },
  // LUCKY DARTS TWO
  { id: 'tpa-2026-ldt-johanna-attenberger', seasonId: 'season-2026', teamId: 'lucky-darts-two', playerId: 'johanna-attenberger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ldt-stefanie-attenberger', seasonId: 'season-2026', teamId: 'lucky-darts-two', playerId: 'stefanie-attenberger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ldt-susanne-bauer', seasonId: 'season-2026', teamId: 'lucky-darts-two', playerId: 'susanne-bauer', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-ldt-lea-bauer', seasonId: 'season-2026', teamId: 'lucky-darts-two', playerId: 'lea-bauer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ldt-benjamin-bauer', seasonId: 'season-2026', teamId: 'lucky-darts-two', playerId: 'benjamin-bauer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ldt-michaela-exner', seasonId: 'season-2026', teamId: 'lucky-darts-two', playerId: 'michaela-exner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ldt-fabian-mahr', seasonId: 'season-2026', teamId: 'lucky-darts-two', playerId: 'fabian-mahr', status: 'active', isCaptain: false },
  { id: 'tpa-2026-ldt-jessica-von-mahren', seasonId: 'season-2026', teamId: 'lucky-darts-two', playerId: 'jessica-von-mahren', status: 'active', isCaptain: false },
  // FUNNY DARTERS MUNICH
  { id: 'tpa-2026-fd-despina-assimenidu', seasonId: 'season-2026', teamId: 'funny-darters', playerId: 'despina-assimenidu', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fd-joerg-hirschfeld', seasonId: 'season-2026', teamId: 'funny-darters', playerId: 'joerg-hirschfeld', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fd-marcus-kampmann', seasonId: 'season-2026', teamId: 'funny-darters', playerId: 'marcus-kampmann', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-fd-athanasios-karagkiozdis', seasonId: 'season-2026', teamId: 'funny-darters', playerId: 'athanasios-karagkiozidis', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fd-panos-moraitis', seasonId: 'season-2026', teamId: 'funny-darters', playerId: 'panos-moraitis', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fd-vassilios-papadopoulos', seasonId: 'season-2026', teamId: 'funny-darters', playerId: 'vassilios-papadopoulos', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fd-dimitrios-papadopoulos', seasonId: 'season-2026', teamId: 'funny-darters', playerId: 'dimitrios-papadopoulos', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fd-michael-sigl', seasonId: 'season-2026', teamId: 'funny-darters', playerId: 'michael-sigl', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fd-iordanis-tertioglou', seasonId: 'season-2026', teamId: 'funny-darters', playerId: 'iordanis-tertioglou', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fd-iannis-tertiroglou', seasonId: 'season-2026', teamId: 'funny-darters', playerId: 'iannis-tertiroglou', status: 'active', isCaptain: false },
  // BLACK DEVILS
  { id: 'tpa-2026-blk-michael-berger', seasonId: 'season-2026', teamId: 'black-devils', playerId: 'michael-berger', status: 'active', isCaptain: false },
  { id: 'tpa-2026-blk-alexandra-brunner', seasonId: 'season-2026', teamId: 'black-devils', playerId: 'alexandra-brunner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-blk-mita-burdulea', seasonId: 'season-2026', teamId: 'black-devils', playerId: 'mita-burdulea', status: 'active', isCaptain: false },
  { id: 'tpa-2026-blk-karsten-dassler', seasonId: 'season-2026', teamId: 'black-devils', playerId: 'karsten-dassler', status: 'active', isCaptain: false },
  { id: 'tpa-2026-blk-patricia-duesing', seasonId: 'season-2026', teamId: 'black-devils', playerId: 'patricia-duesing', status: 'active', isCaptain: false },
  { id: 'tpa-2026-blk-daniel-foerster', seasonId: 'season-2026', teamId: 'black-devils', playerId: 'daniel-foerster', status: 'active', isCaptain: false },
  { id: 'tpa-2026-blk-torsten-gruner', seasonId: 'season-2026', teamId: 'black-devils', playerId: 'torsten-gruner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-blk-maria-hofner', seasonId: 'season-2026', teamId: 'black-devils', playerId: 'maria-hofner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-blk-martina-kabilka', seasonId: 'season-2026', teamId: 'black-devils', playerId: 'martina-kabilka', status: 'active', isCaptain: false },
  { id: 'tpa-2026-blk-petra-roedl', seasonId: 'season-2026', teamId: 'black-devils', playerId: 'petra-roedl', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-blk-christoph-weinberger', seasonId: 'season-2026', teamId: 'black-devils', playerId: 'christoph-weinberger', status: 'active', isCaptain: false },
  // 5 STERNE BOAZN TEAM
  { id: 'tpa-2026-fsb-stefan-bayer', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'stefan-bayer', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fsb-sebastian-kadjurek', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'sebastian-kadjurek', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fsb-erwin-kammergruber', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'erwin-kammergruber', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fsb-peter-kerklau', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'peter-kerklau', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fsb-georgi-ketiashvili', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'georgi-ketiashvili', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fsb-rebecca-kranabetter', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'rebecca-kranabetter', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fsb-stefan-kugler', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'stefan-kugler', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fsb-jutta-lachner', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'jutta-lachner', status: 'active', isCaptain: true  },
  { id: 'tpa-2026-fsb-alexander-lachner', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'alexander-lachner', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fsb-domenik-nachtmann', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'domenik-nachtmann', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fsb-wolfgang-rettke', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'wolfgang-rettke', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fsb-christian-schmidt', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'christian-schmidt', status: 'active', isCaptain: false },
  { id: 'tpa-2026-fsb-stefan-veitinger', seasonId: 'season-2026', teamId: 'fuenf-sterne-boazn', playerId: 'stefan-veitinger', status: 'active', isCaptain: false },
];

// ── Helper functions ──────────────────────────────────────────

/**
 * Returns the SeasonTeamAssignment for a given team in a given season.
 * Each team has at most one primary assignment per season.
 */
export function getTeamAssignment(
  teamId: string,
  seasonId: string,
): SeasonTeamAssignment | undefined {
  return SEASON_TEAM_ASSIGNMENTS.find(
    a => a.teamId === teamId && a.seasonId === seasonId,
  );
}

/**
 * Returns all SeasonTeamAssignments for a given league in a given season,
 * in the order they appear in SEASON_TEAM_ASSIGNMENTS.
 */
export function getAssignmentsForLeague(
  leagueId: LeagueCode,
  seasonId: string,
): SeasonTeamAssignment[] {
  return SEASON_TEAM_ASSIGNMENTS.filter(
    a => a.leagueId === leagueId && a.seasonId === seasonId,
  );
}

/**
 * Returns the TeamPlayerAssignments for a team in a season.
 * Empty array means no player data is available for that team/season.
 */
export function getPlayerAssignmentsForTeam(
  teamId: string,
  seasonId: string,
): TeamPlayerAssignment[] {
  return TEAM_PLAYER_ASSIGNMENTS.filter(
    a => a.teamId === teamId && a.seasonId === seasonId,
  );
}

export interface PlayerWithAssignment {
  player: Player;
  assignment: TeamPlayerAssignment;
}

/**
 * Returns the resolved Player + TeamPlayerAssignment pairs for a team in a season.
 * Players whose id cannot be resolved in PLAYERS are silently skipped.
 */
export function getPlayersForTeamInSeason(
  teamId: string,
  seasonId: string,
): PlayerWithAssignment[] {
  const assignments = getPlayerAssignmentsForTeam(teamId, seasonId);
  return assignments.flatMap(a => {
    const player = PLAYERS.find(p => p.id === a.playerId);
    return player ? [{ player, assignment: a }] : [];
  });
}

// ── Grouped view helpers ──────────────────────────────────────

export interface TeamWithAssignment {
  team: Team;
  assignment: SeasonTeamAssignment;
  venue: Venue | null;
}

export interface LeagueGrouping {
  league: (typeof LEAGUES)[number];
  teams: TeamWithAssignment[];
}

/**
 * Returns regular-season leagues with their assigned teams for a given season,
 * sorted by league.sortOrder (La Liga first, C Liga last).
 *
 * Playoff leagues are excluded — they have no SeasonTeamAssignments.
 * Use this to render "Teams grouped by league" (Teams page, Spielstätten page).
 */
export function getLeagueGroupings(seasonId: string): LeagueGrouping[] {
  return [...LEAGUES]
    .filter(l => l.type !== 'playoff')          // exclude playoff rounds
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(league => {
      const assignments = getAssignmentsForLeague(league.id, seasonId);
      const teams: TeamWithAssignment[] = assignments
        .map(a => {
          const team = TEAMS.find(t => t.id === a.teamId);
          if (!team) return null;
          const venue = a.venueId ? (VENUES.find(v => v.id === a.venueId) ?? null) : null;
          return { team, assignment: a, venue };
        })
        .filter((x): x is TeamWithAssignment => x !== null);
      return { league, teams };
    });
}

// ── Venue-centric helpers ─────────────────────────────────────

/**
 * Returns the resolved Venue entity for a team in a given season.
 * Returns null if the team has no venue assignment or the venueId is unknown.
 */
export function getVenueForTeamInSeason(
  teamId: string,
  seasonId: string,
): Venue | null {
  const a = getTeamAssignment(teamId, seasonId);
  if (!a?.venueId) return null;
  return VENUES.find(v => v.id === a.venueId) ?? null;
}

/**
 * Returns the captain name for a team in a given season.
 * Returns null if no captain has been recorded.
 */
export function getCaptainForTeamInSeason(
  teamId: string,
  seasonId: string,
): string | null {
  return getTeamAssignment(teamId, seasonId)?.captain ?? null;
}

/**
 * One venue entry in the Spielstätten grouped view.
 * venue is null only when a team has no venueId assigned.
 */
export interface VenueWithTeams {
  venue: Venue | null;
  teams: TeamWithAssignment[];
}

/**
 * One league entry for the Spielstätten page.
 * venues groups all teams in this league by their shared venue.
 */
export interface LeagueVenueGrouping {
  league: (typeof LEAGUES)[number];
  venues: VenueWithTeams[];
}

/**
 * Returns venues with their assigned teams for a single league + season.
 *
 * Each venue appears ONCE; teams that share the same venue are listed
 * together under that venue. Teams with no venue are grouped under a
 * null-venue entry (sorted last).
 *
 * Use this to render the per-league section of the Spielstätten page.
 */
export function getVenueGroupingsForLeague(
  leagueId: LeagueCode,
  seasonId: string,
): VenueWithTeams[] {
  const assignments = getAssignmentsForLeague(leagueId, seasonId);
  const venueMap = new Map<string, VenueWithTeams>();

  for (const a of assignments) {
    const team = TEAMS.find(t => t.id === a.teamId);
    if (!team) continue;

    const key   = a.venueId ?? '__no-venue__';
    const venue = a.venueId ? (VENUES.find(v => v.id === a.venueId) ?? null) : null;

    if (!venueMap.has(key)) {
      venueMap.set(key, { venue, teams: [] });
    }
    venueMap.get(key)!.teams.push({ team, assignment: a, venue });
  }

  // Venues with data first (sorted A→Z by name), unknown venue last
  return Array.from(venueMap.values()).sort((a, b) => {
    if (a.venue && !b.venue) return -1;
    if (!a.venue && b.venue) return  1;
    return (a.venue?.name ?? '').localeCompare(b.venue?.name ?? '', 'de');
  });
}

/**
 * Returns regular-season leagues with venue-grouped teams for a given season,
 * sorted by league.sortOrder (La Liga first, C Liga last).
 *
 * Playoff leagues are excluded (no separate venue assignments).
 * Use this on the Spielstätten page to render:
 *   league → venues → teams
 */
export function getLeagueVenueGroupings(seasonId: string): LeagueVenueGrouping[] {
  return [...LEAGUES]
    .filter(l => l.type !== 'playoff')          // exclude playoff rounds
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(league => ({
      league,
      venues: getVenueGroupingsForLeague(league.id, seasonId),
    }));
}
