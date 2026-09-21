// ============================================================
// BeDV-Demo — Spielstätten
// ============================================================
//
// FREI ERFUNDEN. Lokalnamen, Straßen und Hausnummern sind Demo-Angaben; die
// Orte sind echte bayerische Städte, damit die Verteilung über den Freistaat
// stimmt und die Demo nicht wie eine Münchner Stadtliga wirkt.
//
// In einer echten Plattform käme diese Liste aus der Verbandsverwaltung —
// mit ihr hängen Heimspiele, Anfahrt und die Zahl der Automaten zusammen.
// ============================================================

import type { Spielstaette } from './typen';

function s(
  id: string, name: string, strasse: string, plz: string, ort: string, automaten: number,
): Spielstaette {
  return { id, name, strasse, plz, ort, automaten, demo: true };
}

export const SPIELSTAETTEN: Spielstaette[] = [
  s('triple-20-augsburg',   'Sportsbar Triple 20',     'Lindenweg 14',        '86153', 'Augsburg',      4),
  s('zur-scheibe-nuernberg','Gasthaus Zur Scheibe',    'Bahnhofstraße 72',    '90402', 'Nürnberg',      3),
  s('dartpub-180-muenchen', 'Dartpub 180',             'Gruberstraße 8',      '80337', 'München',       6),
  s('oche-fuerth',          'Oche Fürth',              'Färberweg 3',         '90762', 'Fürth',         3),
  s('bullshack-regensburg', 'Bull Shack',              'Donaupromenade 21',   '93047', 'Regensburg',    4),
  s('checkout-ingolstadt',  'Checkout Lounge',         'Schanzer Ring 9',     '85049', 'Ingolstadt',    4),
  s('pfeilstube-wuerzburg', 'Pfeilstube am Main',      'Mainuferweg 5',       '97070', 'Würzburg',      3),
  s('dartkeller-bamberg',   'Dartkeller Bamberg',      'Kesslerstraße 17',    '96047', 'Bamberg',       2),
  s('doppel-o-landshut',    'Doppel Null',             'Isargasse 4',         '84028', 'Landshut',      3),
  s('arena-rosenheim',      'Dart-Arena Rosenheim',    'Innfeldstraße 33',    '83022', 'Rosenheim',     5),
  s('steel-city-hof',       'Steel & Soft Hof',        'Saaleweg 11',         '95028', 'Hof',           2),
  s('treffer-passau',       'Sportsbar Treffer',       'Domplatz 6',          '94032', 'Passau',        3),
  s('allgaeu-darts-kempten','Allgäu Darts Lounge',     'Illerstraße 28',      '87435', 'Kempten',       4),
  s('gaeuboden-straubing',  'Gäubodenstube',           'Ludwigsplatz 2',      '94315', 'Straubing',     2),
  s('mainfranken-sw',       'Mainfranken Sportsbar',   'Hafenstraße 40',      '97421', 'Schweinfurt',   3),
  s('spessart-ab',          'Spessart Dartclub',       'Bergweg 19',          '63739', 'Aschaffenburg', 3),
  s('oberpfalz-amberg',     'Oberpfalz-Treff',         'Vilsstraße 7',        '92224', 'Amberg',        2),
  s('coburger-eck',         'Coburger Dart-Eck',       'Veste-Allee 13',      '96450', 'Coburg',        2),
  s('nordoberpfalz-weiden', 'Nordoberpfalz Lounge',    'Ringstraße 55',       '92637', 'Weiden',        3),
  s('donauwald-deggendorf', 'Donauwald Sportsbar',     'Am Stadtpark 12',     '94469', 'Deggendorf',    3),
  s('freisinger-hof',       'Freisinger Dart-Hof',     'Moosachweg 6',        '85354', 'Freising',      3),
  s('dachauer-bulls',       'Bulls Dachau',            'Amperstraße 24',      '85221', 'Dachau',        4),
  s('germeringer-treff',    'Germeringer Dart-Treff',  'Parkstraße 3',        '82110', 'Germering',     3),
  s('donaustadl-neu-ulm',   'Donaustadl',              'Uferpromenade 18',    '89231', 'Neu-Ulm',       3),
  s('memminger-oche',       'Memminger Oche',          'Westertorplatz 9',    '87700', 'Memmingen',     2),
  s('chiemgau-traunstein',  'Chiemgau Dartlounge',     'Salinenweg 31',       '83278', 'Traunstein',    3),
  s('zugspitz-garmisch',    'Zugspitz Sportsbar',      'Loisachstraße 2',     '82467', 'Garmisch',      2),
  s('wertachhalle-kf',      'Wertach Dartstube',       'Wertachweg 27',       '87600', 'Kaufbeuren',    2),
  s('rezat-ansbach',        'Rezat Sportsbar',         'Schlossgasse 15',     '91522', 'Ansbach',       3),
  s('erlanger-oche',        'Erlanger Oche',           'Regnitzstraße 44',    '91052', 'Erlangen',      4),
  s('bayreuther-kneipe',    'Bayreuther Dartstube',    'Maximilianweg 8',     '95444', 'Bayreuth',      3),
  s('pegnitz-lauf',         'Pegnitz Dartclub',        'Mühlgasse 10',        '91207', 'Lauf',          2),
];

const NACH_ID = new Map(SPIELSTAETTEN.map(v => [v.id, v]));

export function spielstaetteById(id: string): Spielstaette | undefined {
  return NACH_ID.get(id);
}

/** Adresse einer Zeile — für Karten und Fußzeilen. */
export function adresse(v: Spielstaette): string {
  return `${v.strasse}, ${v.plz} ${v.ort}`;
}

/** Suchadresse für Kartendienste (die Demo verlinkt bewusst nichts Externes). */
export function kartenSuche(v: Spielstaette): string {
  return `${v.name}, ${v.strasse}, ${v.plz} ${v.ort}`;
}
