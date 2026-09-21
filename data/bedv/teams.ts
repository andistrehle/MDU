// ============================================================
// BeDV-Demo — Mannschaften
// ============================================================
//
// FREI ERFUNDEN. Kein Name stammt von einer bestehenden Mannschaft des BeDV.
// Die Zuordnung Mannschaft → Spielstätte ist so gebaut, wie sie im echten
// Ligabetrieb aussieht: Mehrere Mannschaften teilen sich ein Lokal, innerhalb
// einer Staffel spielt aber jede woanders — sonst wären Heimrecht und
// Anfahrt in der Demo nicht nachvollziehbar.
//
// Wappen gibt es nicht als Bilddatei: Jede Mannschaft bekommt zwei Farben,
// aus denen `components/bedv/teams/team-wappen.tsx` ein Zeichen rechnet. Das
// spart Assets, bleibt scharf auf jedem Bildschirm — und stellt vor allem
// sicher, dass die Demo kein fremdes Logo zeigt.
// ============================================================

import { rngOf, pick } from '@/lib/bedv/rng';
import { slug as slugify } from '@/lib/bedv/format';
import type { Team } from './typen';
import { teamsInLiga } from './ligen';

/** Name, Kurzform, Spielstätte. Reihenfolge = Startaufstellung der Staffel. */
type Eintrag = readonly [name: string, kurz: string, spielstaette: string];

const AUFSTELLUNG: Record<string, readonly Eintrag[]> = {
  bezirksliga: [
    ['Vils Vipers Amberg',        'Vipers',    'oberpfalz-amberg'],
    ['DC Bullseye Nürnberg',      'BUL NBG',   'zur-scheibe-nuernberg'],
    ['Veste Vandalen Coburg',     'Vandalen',  'coburger-eck'],
    ['Oche Rebellen Fürth',       'Rebellen',  'oche-fuerth'],
    ['Donau Sharks Regensburg',   'Sharks',    'bullshack-regensburg'],
    ['Schanzer Pfeile',           'Schanzer',  'checkout-ingolstadt'],
    ['Mainpiraten Würzburg',      'Piraten',   'pfeilstube-wuerzburg'],
    ['Dart Inn Rosenheim',        'Inn RO',    'arena-rosenheim'],
  ],
  'a-liga': [
    ['Triple Trouble Bamberg',    'Triple BA', 'dartkeller-bamberg'],
    ['Isar Bulls Landshut',       'Isar LA',   'doppel-o-landshut'],
    ['Saale Snipers Hof',         'Snipers',   'steel-city-hof'],
    ['Dreiflüsse Darter Passau',  '3-Flüsse',  'treffer-passau'],
    ['Allgäu Arrows Kempten',     'Arrows',    'allgaeu-darts-kempten'],
    ['Gäuboden Gamblers',         'Gamblers',  'gaeuboden-straubing'],
    ['Checkout Crew Schweinfurt', 'Crew SW',   'mainfranken-sw'],
    ['Spessart Spitzen',          'Spitzen',   'spessart-ab'],
  ],
  b1: [
    ['Ghost Darts',               'Ghost',     'triple-20-augsburg'],
    ['Abwurf Astronauten',        'Astro',     'dartpub-180-muenchen'],
    ['Weidener Wurfgemeinschaft', 'WWG',       'nordoberpfalz-weiden'],
    ['Donauwald Dartfreunde',     'DW Darts',  'donauwald-deggendorf'],
    ['Moosach Maniacs Freising',  'Maniacs',   'freisinger-hof'],
    ['Amper Aces Dachau',         'Aces DAH',  'dachauer-bulls'],
    ['Germeringer Goldarme',      'Goldarme',  'germeringer-treff'],
    ['Donaustadl Devils',         'Devils',    'donaustadl-neu-ulm'],
  ],
  b2: [
    ['Memminger Meisterwerfer',   'MMW',       'memminger-oche'],
    ['Chiemgau Checker',          'Checker',   'chiemgau-traunstein'],
    ['Zugspitz Zocker',           'Zocker',    'zugspitz-garmisch'],
    ['Wertach Wölfe',             'Wölfe',     'wertachhalle-kf'],
    ['Rezat Rockets Ansbach',     'Rockets',   'rezat-ansbach'],
    ['Erlanger Einserkandidaten', 'Einser',    'erlanger-oche'],
    ['Bayreuther Bullfighter',    'Bullf.',    'bayreuther-kneipe'],
    ['Pegnitz Pfeilheilige',      'Heilige',   'pegnitz-lauf'],
  ],
  c1: [
    ['Nachtschicht Augsburg',     'Nacht AUG', 'triple-20-augsburg'],
    ['Noris Newcomer',            'Noris',     'zur-scheibe-nuernberg'],
    ['Zielwasser München',        'Zielw. M',  'dartpub-180-muenchen'],
    ['Kleeblatt Darter Fürth',    'Kleeblatt', 'oche-fuerth'],
    ['Steinerne Brücke Darts',    'Brücke',    'bullshack-regensburg'],
    ['Audi-Ring Darter',          'Ring IN',   'checkout-ingolstadt'],
    ['Residenz Rebels Würzburg',  'Rebels WÜ', 'pfeilstube-wuerzburg'],
    ['Mangfall Muffins',          'Muffins',   'arena-rosenheim'],
  ],
  c2: [
    ['Bamberger Bierdeckel',      'Deckel',    'dartkeller-bamberg'],
    ['Landshuter Leichtsinn',     'Leichts.',  'doppel-o-landshut'],
    ['Hofer Hinterhof Darts',     'Hinterhof', 'steel-city-hof'],
    ['Inntal Irrläufer',          'Irrläufer', 'treffer-passau'],
    ['Kemptener Kaltstarter',     'Kaltstart', 'allgaeu-darts-kempten'],
    ['Straubinger Spätzünder',    'Spätz.',    'gaeuboden-straubing'],
    ['Schweinfurter Schrauber',   'Schrauber', 'mainfranken-sw'],
    ['Aschaffenburger Anfänger',  'AB Anf.',   'spessart-ab'],
  ],
  c3: [
    ['Amberger Amateure',         'Amateure',  'oberpfalz-amberg'],
    ['Coburger Chaoten',          'Chaoten',   'coburger-eck'],
    ['Weidener Wackelkandidaten', 'Wackel',    'nordoberpfalz-weiden'],
    ['Deggendorfer Dauerbrenner', 'Dauerbr.',  'donauwald-deggendorf'],
    ['Freisinger Frischlinge',    'Frischl.',  'freisinger-hof'],
    ['Dachauer Doppelfehler',     'Doppelf.',  'dachauer-bulls'],
    ['Germeringer Grünschnäbel',  'Grünschn.', 'germeringer-treff'],
    ['Neu-Ulmer Nervenbündel',    'Nerven',    'donaustadl-neu-ulm'],
  ],

  // ── Sommerliga 2026 (abgeschlossen, je sechs Mannschaften) ──
  'sommer-c1': [
    ['Ghost Darts II',            'Ghost II',  'triple-20-augsburg'],
    ['Noris Newcomer',            'Noris',     'zur-scheibe-nuernberg'],
    ['Zielwasser München',        'Zielw. M',  'dartpub-180-muenchen'],
    ['Sommerloch Fürth',          'Sommerl.',  'oche-fuerth'],
    ['Donau Sharks III',          'Sharks III','bullshack-regensburg'],
    ['Schanzer Pfeile II',        'Schanz. II','checkout-ingolstadt'],
  ],
  'sommer-c2': [
    ['Biergarten Bullies',        'Bullies',   'pfeilstube-wuerzburg'],
    ['Hitzefrei Rosenheim',       'Hitzefrei', 'arena-rosenheim'],
    ['Bamberger Bierdeckel II',   'Deckel II', 'dartkeller-bamberg'],
    ['Isar Bulls III',            'Isar III',  'doppel-o-landshut'],
    ['Saale Snipers II',          'Snipers II','steel-city-hof'],
    ['Passauer Pausenhof',        'Pausenh.',  'treffer-passau'],
  ],
  'sommer-c3': [
    ['Allgäu Arrows II',          'Arrows II', 'allgaeu-darts-kempten'],
    ['Gäuboden Grillmeister',     'Grillm.',   'gaeuboden-straubing'],
    ['Mainfranken Sommerteam',    'MF Sommer', 'mainfranken-sw'],
    ['Spessart Sonnenbrand',      'Sonnenbr.', 'spessart-ab'],
    ['Vils Vipers II',            'Vipers II', 'oberpfalz-amberg'],
    ['Coburger Kurzurlauber',     'Kurzurl.',  'coburger-eck'],
  ],
  'sommer-c4': [
    ['Weidener Wurfgemeinschaft II','WWG II',  'nordoberpfalz-weiden'],
    ['Donauwald Ferienlager',     'Ferienl.',  'donauwald-deggendorf'],
    ['Freisinger Freibadstürmer', 'Freibad',   'freisinger-hof'],
    ['Amper Aces II',             'Aces II',   'dachauer-bulls'],
    ['Germeringer Gartenzwerge',  'Zwerge',    'germeringer-treff'],
    ['Donaustadl Duschgänger',    'Dusch.',    'donaustadl-neu-ulm'],
  ],
  'sommer-c5': [
    ['Memminger Mittagspause',    'Mittagsp.', 'memminger-oche'],
    ['Chiemsee Checker',          'Chiemsee',  'chiemgau-traunstein'],
    ['Zugspitz Zeltplatz Darts',  'Zeltplatz', 'zugspitz-garmisch'],
    ['Wertach Wasserratten',      'Wasserr.',  'wertachhalle-kf'],
    ['Rezat Radler',              'Radler',    'rezat-ansbach'],
    ['Erlanger Eisdielen Darter', 'Eisdiele',  'erlanger-oche'],
  ],
};

/** Farbpaare für die gezeichneten Wappen — kräftig, aber nicht grell. */
const WAPPEN_FARBEN: readonly [string, string][] = [
  ['#1E5FBF', '#0B2E63'], ['#C2410C', '#7C2D12'], ['#047857', '#064E3B'],
  ['#7C3AED', '#4C1D95'], ['#B91C1C', '#7F1D1D'], ['#0E7490', '#164E63'],
  ['#A16207', '#713F12'], ['#BE185D', '#831843'], ['#15803D', '#14532D'],
  ['#4338CA', '#312E81'], ['#0F766E', '#134E4A'], ['#9A3412', '#7C2D12'],
];

const SPIELTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'] as const;

function baueTeams(): Team[] {
  const out: Team[] = [];
  const vergebeneIds = new Set<string>();

  for (const [ligaSlug, eintraege] of Object.entries(AUFSTELLUNG)) {
    const soll = teamsInLiga(ligaSlug);
    if (eintraege.length !== soll) {
      throw new Error(`Liga ${ligaSlug}: ${eintraege.length} Mannschaften, erwartet ${soll}`);
    }
    const saisonId = ligaSlug.startsWith('sommer-') ? 'sommer-2026' : 'winter-2026-27';

    eintraege.forEach(([name, kurz, spielstaetteId], i) => {
      // Die Adresse entsteht aus dem Namen. Zwei Mannschaften können in
      // verschiedenen Spielzeiten gleich heißen (z. B. „Noris Newcomer" im
      // Winter und im Sommer) — dann hängt die Saison hinten dran, sonst
      // zeigten beide Ligen auf dieselbe Seite.
      let id = slugify(name);
      if (vergebeneIds.has(id)) id = `${id}-${saisonId === 'sommer-2026' ? 'sommer' : 'winter'}`;
      vergebeneIds.add(id);

      const rnd = rngOf(`team:${id}`);
      out.push({
        id,
        name,
        kurz,
        ligaSlug,
        saisonId,
        spielstaetteId,
        spieltag: pick(rnd, SPIELTAGE),
        beginn: pick(rnd, ['19:00', '19:30', '20:00', '20:00', '20:30']),
        gruendung: 1988 + Math.floor(rnd() * 36),
        farben: WAPPEN_FARBEN[(i * 5 + ligaSlug.length) % WAPPEN_FARBEN.length],
        demo: true,
      });
    });
  }
  return out;
}

export const TEAMS: Team[] = baueTeams();

const NACH_ID = new Map(TEAMS.map(t => [t.id, t]));

export function teamById(id: string): Team | undefined {
  return NACH_ID.get(id);
}

export function teamsDerLiga(ligaSlug: string): Team[] {
  return TEAMS.filter(t => t.ligaSlug === ligaSlug);
}

export function teamsDerSaison(saisonId: string): Team[] {
  return TEAMS.filter(t => t.saisonId === saisonId);
}
