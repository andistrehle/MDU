// ============================================================
// Anmerkungen der Ligaleitung zu offenen Begegnungen im Spieltagsbericht
// ============================================================
// Schlüssel = Begegnung Heim|Gast (begegnungKey). Der Text ersetzt im
// Spieltagsbericht (lib/server/spieltag-bericht.ts) das automatische „Bericht
// steht noch aus“ — nur solange es kein Ergebnis gibt und kein späterer Termin
// eingetragen ist (dann steht dort „verlegt auf …“). Erledigte Einträge können
// stehen bleiben, sie wirken dann nicht mehr.
// ============================================================

export const SPIELTAG_HINWEISE_2027: Record<string, string> = {
  // Betreiber, 27.10.2026
  'jolly-pirates-kts|spartans': 'hat nicht stattgefunden – bitte zeitnah einen neuen Termin nachtragen',
  'muenchen-0815|master-of-desaster': 'noch keine Rückmeldung – bitte Spielbericht eintragen oder neuen Termin nachtragen',
};
