// ============================================================
// Venues (Spielstätten) — Münchner Dart Union
// ============================================================
//
// Source: dartunion.de · "TC's und Lokale" pages · scraped May 2026
//
// PHONE NUMBERS:
//   Lokal-/Venue-Telefonnummern DÜRFEN hier gespeichert und öffentlich
//   angezeigt werden (öffentlich zugängliche Lokalnummern — bewusste
//   Entscheidung). Trage sie ins optionale Feld `phone` ein.
//   PERSÖNLICHE Nummern (Spieler/Kapitän) gehören NIEMALS hierher — die
//   liegen zugriffsgeschützt in `player_contacts` (Migration 0030) und sind
//   nur für eingeloggte Teamkapitäne sichtbar.
//
// DEDUPLICATION:
//   Several venues are shared by multiple teams across different leagues.
//   Each physical location appears exactly once here.
//   Multiple SeasonTeamAssignments can reference the same venueId.
//
//   Shared venues (≥ 2 teams):
//     fiaker-stueberl         → OHNE JACKIE, GAMBAS, FREIBAD BAZIS,
//                                MASTER OF DESASTER, FLYING FIGHTERS, FIAKER DEIFE (6)
//     spartans-dart-pub       → SPARTANS, BLACK DEVILS, SPARTANS VI, DE VOGELWUID'N (4)
//     wirtshaus-lustiger-bauer → DC NULL BULL, MÜNCHEN 08/15, GAME OVER (3)
//     jolly-roger             → JOLLY PIRATES KT'S, JOLLY PIRATES V, SOUND WARRIOR'S (3)
//     dc-moosach              → NO MA'AM, TEAM DESASTER (2)
//     dis-stueberl            → ALPTRAUM, OLDIES & CO (2)
//     wirtshaus-bei-toni      → SILBERPFEILE II, FLYING SEVEN (2)
//     players                 → LUCKY DARTS ONE, LUCKY DARTS TWO (2)
//     bistro-118              → DE WOLPERDINGA, DE HUTZELDARTER (2)
//
// HOW TO ADD A VENUE:
//   1. Add a Venue record here with a unique id
//   2. Reference the venueId in lib/data/assignments.ts under the
//      relevant SeasonTeamAssignment for that team × season
//
// ============================================================

export interface Venue {
  /** Unique identifier (slug) */
  id: string;
  /** Public display name of the venue */
  name: string;
  /** Street name and number */
  address?: string;
  /** Postal code + city (e.g. '80807 München') */
  city?: string;
  /** Öffentliche Lokal-Telefonnummer (optional). Darf öffentlich angezeigt werden. */
  phone?: string;
  /** Internal notes — NOT rendered in UI */
  notes?: string;
}

// ── Saison 2026 venues · 18 unique locations ─────────────────
export const VENUES: Venue[] = [
  // ── Shared by 6 teams ─────────────────────────────────────
  {
    id: 'fiaker-stueberl',
    name: 'Fiaker Stüberl',
    address: 'Zenettistr. 30',
    city: '80337 München',
    phone: '089 77 65 66',
  },

  // ── Shared by 4 teams ─────────────────────────────────────
  {
    id: 'spartans-dart-pub',
    name: 'Spartans Dart Pub',
    address: 'Korbinianstr. 61',
    city: '80807 München',
    phone: '089 354 56 25',
  },

  // ── Shared by 3 teams ─────────────────────────────────────
  {
    id: 'wirtshaus-lustiger-bauer',
    name: 'Wirtshaus zum Lustigen Bauer',
    address: 'Kantstr. 29',
    city: '80809 München',
    phone: '089 350 85 71',
  },
  {
    id: 'jolly-roger',
    name: 'Jolly Roger',
    address: 'Poststr. 2',
    city: '85586 Poing',
    phone: '0176 577 19 752',
  },

  // ── Shared by 2 teams ─────────────────────────────────────
  {
    id: 'dc-moosach',
    name: 'DC Moosach',
    address: 'Weitlstr. 140',
    city: '80995 München',
    phone: '0172 7805760',
  },
  {
    id: 'dis-stueberl',
    name: "Di's Stüberl",
    address: 'Wundstr. 15',
    city: '80939 München',
    phone: '0160 970 36 996',
  },
  {
    id: 'wirtshaus-bei-toni',
    name: 'Wirtshaus bei Toni',
    address: 'Arnulfstr. 130',
    city: '80634 München',
    phone: '089 16 53 41',
  },
  {
    id: 'players',
    name: 'Players',
    address: 'Schleissheimer Str. 335',
    city: '80809 München',
    phone: '0176 70 55 46 13',
  },
  {
    id: 'bistro-118',
    name: 'Bistro 118',
    address: 'Drygalski-Allee 118',
    city: '81477 München',
  },

  // ── Single-team venues ─────────────────────────────────────
  {
    id: 'jimmys-restaurant',
    name: 'Jimmys Restaurant',
    address: 'Am Stadion 12',
    city: '85435 Erding',
    phone: '08122 90 97 78',
  },
  {
    id: 'gaststaette-esv-freimann',
    name: 'Gaststätte ESV Freimann',
    address: 'Frankplatz 15',
    city: '80939 München',
    phone: '089 323 76 868',
  },
  {
    id: 'kegelkeller',
    name: 'Kegelkeller',
    address: 'Ledergasse 6',
    city: '85567 Grafing',
    phone: '08092 862 21 90',
  },
  {
    id: 'belfort-seven',
    name: 'Belfort Seven',
    address: 'Belfortstr. 7',
    city: '81667 München',
    phone: '089 614 68 444',
  },
  {
    id: 'heuboden-bar',
    name: 'Heuboden Bar',
    address: 'Kapuziener Str. 2',
    city: '85377 München',
  },
  {
    id: 'bistro-48',
    name: 'Bistro 48',
    address: 'Sudetenlandstr. 48',
    city: '85221 Dachau',
  },
  {
    id: 'sportsbar-live',
    name: "Sportsbar 'Live'",
    address: 'Oberhofer Platz 4',
    city: '80807 München',
    phone: '089 209 74 174',
  },
  {
    id: 'trappentreu-stueberl',
    name: 'Trappentreu Stüberl',
    address: 'Trappentreustr. 31',
    city: '80339 München',
    phone: '0174 444 46 42',
  },
  {
    id: 'machete-1',
    name: 'Machete 1',
    address: 'Heimeranplatz 1',
    city: '80339 München',
  },
];

/** Returns a venue by id, or undefined if not found. */
export function findVenue(id: string): Venue | undefined {
  return VENUES.find(v => v.id === id);
}

/** Alias for findVenue — preferred name in helper-heavy call sites. */
export const getVenueById = findVenue;

/**
 * Returns the full street + city address as a single formatted string.
 *
 * Example: "Zenettistr. 30, 80337 München"
 *
 * Falls back to "Noch nicht verfügbar" when both fields are absent.
 */
export function getVenueFullAddress(venue: Venue): string {
  const parts = [venue.address, venue.city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Noch nicht verfügbar';
}
