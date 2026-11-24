// Englische Datenbank-Meldungen in verständliches Deutsch (Betreiber, 24.11.2026: Toni bekam beim Eintragen eines
// Spielers in den Kader „duplicate key value violates unique constraint …“ und verstand nicht, was los ist).
// Unbekanntes bleibt, wie es ist — lieber die Originalmeldung als eine erfundene.

const BEKANNT: [RegExp, string][] = [
  [/sra_season_license_uniq|players_license_uniq/i,
    'Diese Passnummer ist schon vergeben – der Spieler steht vermutlich schon in einem Kader dieser Saison. Bitte dort nachsehen, statt ihn noch einmal anzulegen.'],
  [/player_nominations.*(uniq|unique)|duplicate key.*nomination/i, 'Dieser Spieler wurde schon nachgemeldet.'],
  [/duplicate key value violates unique constraint/i, 'Diesen Eintrag gibt es schon (doppelt).'],
  [/violates foreign key constraint/i, 'Der Eintrag hängt an etwas, das es nicht (mehr) gibt.'],
  [/row-level security|permission denied/i, 'Dafür fehlt die Berechtigung.'],
];

export function dbFehler(msg: string | null | undefined): string | null {
  if (!msg) return null;
  for (const [re, text] of BEKANNT) if (re.test(msg)) return text;
  return msg;
}
