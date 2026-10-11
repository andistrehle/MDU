// ============================================================
// Saison 2026/27 — feste Termine (Datum + Uhrzeit) je Begegnung
// ============================================================
// Quelle: Masterpläne der TC-Sitzung (11.10.2026). Bis sie eingetragen sind,
// ist diese Liste leer und überall steht das Spielwochenende (Fr–So) aus dem
// vorläufigen Plan.
//
// Schlüssel ist die Begegnung (Heim-ID|Gast-ID, siehe begegnungKey in
// saison-2027.ts) — in der Doppelrunde gibt es jede Paarung mit festem
// Heimrecht genau einmal. Ein Termin außerhalb des Plan-Wochenendes (z. B.
// in eine spielfreie Woche verlegt) ist erlaubt; der Spieltag bleibt derselbe.
// ============================================================

export interface Termin27 {
  /** YYYY-MM-DD */
  datum: string;
  /** HH:MM, fehlt = „Uhrzeit folgt" */
  uhrzeit?: string;
  /** Im Masterplan mit „??" markiert: Termin wird noch geprüft. */
  vorlaeufig?: boolean;
}

// Heimrechttausch (HRT, Masterpläne 11.10.2026): Bei diesen Paarungen ist das
// Heimrecht in BEIDEN Spielen gegenüber dem generierten Plan getauscht — der
// Spieltag bleibt, nur Heim und Gast wechseln (saison-2027.ts wendet das auf
// den Plan an, bevor irgendetwas daraus gelesen wird). Die Termine unten
// stehen unter der tatsächlichen Begegnung (Heim|Gast nach dem Tausch).
export const HEIMRECHT_GETAUSCHT: [string, string][] = [
  ['oldies-co', 'freibad-bazis'],                          // A Liga
  ['black-devils', 'funny-darters'],                       // C Liga
  ['team-dartpromillos--841baa', 'fuenf-sterne-boazn'],    // C Liga
  ['fuenf-sterne-boazn', 'team-jolly-pirates-vii-3156af'], // C Liga
];

// Eingetragen am 11.10.2026 aus den Masterplänen aller fünf Ligen.
// Vom Betreiber bestätigt: „26" bei Terminen ab Januar = 2027; Flying
// Fighters – Leider Geil am 30.10. (verlegt, nicht 23.10. wie im Masterplan);
// A Liga: Jolly Pirates V –
// Belfort ohne Termin („?“), Jolly Pirates V – Oldies vorläufig 30.10.
export const TERMINE_2027: Record<string, Termin27> = {
  // ── La Liga ──
  "jolly-pirates-kts|spartans": { datum: '2026-10-23', uhrzeit: '20:00' }, // Jolly Pirates Kneipenterroristen – Spartans München
  "gambas|ohne-jackie": { datum: '2026-10-23', uhrzeit: '20:00' }, // Gambas – Ohne Jackie
  "silberpfeile-ii|alptraum": { datum: '2026-11-14', uhrzeit: '20:00' }, // Silberpfeile II – Alptraum
  "silberpfeile-ii|gambas": { datum: '2026-11-20', uhrzeit: '20:00' }, // Silberpfeile II – Gambas
  "ohne-jackie|jolly-pirates-kts": { datum: '2026-11-20', uhrzeit: '20:00' }, // Ohne Jackie – Jolly Pirates Kneipenterroristen
  "alptraum|spartans": { datum: '2026-11-27', uhrzeit: '20:00' }, // Alptraum – Spartans München
  "spartans|gambas": { datum: '2026-12-04', uhrzeit: '20:00', vorlaeufig: true }, // Spartans München – Gambas
  "ohne-jackie|silberpfeile-ii": { datum: '2026-12-04', uhrzeit: '20:00' }, // Ohne Jackie – Silberpfeile II
  "alptraum|jolly-pirates-kts": { datum: '2026-12-11', uhrzeit: '20:00' }, // Alptraum – Jolly Pirates Kneipenterroristen
  "jolly-pirates-kts|silberpfeile-ii": { datum: '2026-12-12', uhrzeit: '20:00' }, // Jolly Pirates Kneipenterroristen – Silberpfeile II
  "spartans|ohne-jackie": { datum: '2026-12-18', uhrzeit: '20:00' }, // Spartans München – Ohne Jackie
  "gambas|alptraum": { datum: '2026-12-19', uhrzeit: '20:00' }, // Gambas – Alptraum
  "alptraum|ohne-jackie": { datum: '2027-01-22', uhrzeit: '20:00' }, // Alptraum – Ohne Jackie (Jahr 26→27)
  "gambas|jolly-pirates-kts": { datum: '2027-01-23', uhrzeit: '20:00' }, // Gambas – Jolly Pirates Kneipenterroristen
  "spartans|jolly-pirates-kts": { datum: '2027-01-29', uhrzeit: '20:00' }, // Spartans München – Jolly Pirates Kneipenterroristen
  "ohne-jackie|gambas": { datum: '2027-01-29', uhrzeit: '20:00' }, // Ohne Jackie – Gambas
  "alptraum|silberpfeile-ii": { datum: '2027-01-29', uhrzeit: '20:00' }, // Alptraum – Silberpfeile II
  "silberpfeile-ii|spartans": { datum: '2027-02-06', uhrzeit: '20:00' }, // Silberpfeile II – Spartans München
  "gambas|silberpfeile-ii": { datum: '2027-02-19', uhrzeit: '20:00' }, // Gambas – Silberpfeile II
  "spartans|alptraum": { datum: '2027-02-26', uhrzeit: '20:00' }, // Spartans München – Alptraum (Jahr 26→27)
  "jolly-pirates-kts|ohne-jackie": { datum: '2027-02-26', uhrzeit: '20:00' }, // Jolly Pirates Kneipenterroristen – Ohne Jackie
  "gambas|spartans": { datum: '2027-03-12', uhrzeit: '20:00' }, // Gambas – Spartans München
  "jolly-pirates-kts|alptraum": { datum: '2027-03-12', uhrzeit: '20:00' }, // Jolly Pirates Kneipenterroristen – Alptraum (Jahr 26→27)
  "silberpfeile-ii|ohne-jackie": { datum: '2027-03-13', uhrzeit: '20:00' }, // Silberpfeile II – Ohne Jackie
  "ohne-jackie|spartans": { datum: '2027-04-16', uhrzeit: '20:00' }, // Ohne Jackie – Spartans München
  "alptraum|gambas": { datum: '2027-04-16', uhrzeit: '20:00' }, // Alptraum – Gambas
  "silberpfeile-ii|jolly-pirates-kts": { datum: '2027-04-17', uhrzeit: '20:00' }, // Silberpfeile II – Jolly Pirates Kneipenterroristen
  "spartans|silberpfeile-ii": { datum: '2027-05-07', uhrzeit: '20:00', vorlaeufig: true }, // Spartans München – Silberpfeile II
  "ohne-jackie|alptraum": { datum: '2027-05-07', uhrzeit: '20:00' }, // Ohne Jackie – Alptraum (Jahr 26→27)
  "jolly-pirates-kts|gambas": { datum: '2027-05-07', uhrzeit: '20:00', vorlaeufig: true }, // Jolly Pirates Kneipenterroristen – Gambas
  // ── A Liga ──
  "dc-animals-ii|treff-nix-freimann": { datum: '2026-10-23', uhrzeit: '20:30' }, // DC Animals – Treff Nix Freimann
  "freibad-bazis|fiaker-deife": { datum: '2026-10-23', uhrzeit: '20:00' }, // Freibad Bazis – Fiaker Deife
  "spartans-vi|jolly-pirates-v": { datum: '2026-10-24', uhrzeit: '20:30' }, // Spartans VI – Jolly Pirates V
  "team-illuminati--28d702|oldies-co": { datum: '2026-10-24', uhrzeit: '20:00' }, // Illuminati – Oldies & Co
  "jolly-pirates-v|oldies-co": { datum: '2026-10-30', vorlaeufig: true }, // Jolly Pirates V – Oldies & Co
  "oldies-co|fiaker-deife": { datum: '2026-11-13', uhrzeit: '20:00' }, // Oldies & Co – Fiaker Deife
  "freibad-bazis|dc-animals-ii": { datum: '2026-11-13', uhrzeit: '20:30' }, // Freibad Bazis – DC Animals
  "jolly-pirates-v|team-illuminati--28d702": { datum: '2026-11-14', uhrzeit: '20:00' }, // Jolly Pirates V – Illuminati
  "treff-nix-freimann|belfort-evolution": { datum: '2026-11-14', uhrzeit: '20:00' }, // Treff Nix Freimann – Belfort Evolution
  "belfort-evolution|spartans-vi": { datum: '2026-11-21', uhrzeit: '20:00' }, // Belfort Evolution – Spartans VI
  "team-illuminati--28d702|freibad-bazis": { datum: '2026-11-21', uhrzeit: '20:00' }, // Illuminati – Freibad Bazis
  "fiaker-deife|treff-nix-freimann": { datum: '2026-11-21', uhrzeit: '20:00' }, // Fiaker Deife – Treff Nix Freimann
  "oldies-co|spartans-vi": { datum: '2026-11-27', uhrzeit: '20:00' }, // Oldies & Co – Spartans VI
  "dc-animals-ii|belfort-evolution": { datum: '2026-11-27', uhrzeit: '20:30' }, // DC Animals – Belfort Evolution
  "freibad-bazis|jolly-pirates-v": { datum: '2026-11-27', uhrzeit: '20:00' }, // Freibad Bazis – Jolly Pirates V
  "team-illuminati--28d702|treff-nix-freimann": { datum: '2026-11-28', uhrzeit: '20:00' }, // Illuminati – Treff Nix Freimann
  "spartans-vi|dc-animals-ii": { datum: '2026-12-04', uhrzeit: '20:30' }, // Spartans VI – DC Animals
  "treff-nix-freimann|jolly-pirates-v": { datum: '2026-12-04', uhrzeit: '20:00' }, // Treff Nix Freimann – Jolly Pirates V
  "freibad-bazis|oldies-co": { datum: '2026-12-05', uhrzeit: '20:00' }, // Freibad Bazis – Oldies & Co (HRT)
  "fiaker-deife|belfort-evolution": { datum: '2026-12-05', uhrzeit: '20:00' }, // Fiaker Deife – Belfort Evolution
  "spartans-vi|freibad-bazis": { datum: '2026-12-11', uhrzeit: '20:00' }, // Spartans VI – Freibad Bazis
  "treff-nix-freimann|oldies-co": { datum: '2026-12-11', uhrzeit: '20:00' }, // Treff Nix Freimann – Oldies & Co
  "dc-animals-ii|fiaker-deife": { datum: '2026-12-12', uhrzeit: '20:30' }, // DC Animals – Fiaker Deife
  "belfort-evolution|team-illuminati--28d702": { datum: '2026-12-12', uhrzeit: '20:00' }, // Belfort Evolution – Illuminati
  "freibad-bazis|treff-nix-freimann": { datum: '2026-12-18', uhrzeit: '20:00' }, // Freibad Bazis – Treff Nix Freimann
  "fiaker-deife|spartans-vi": { datum: '2026-12-19', uhrzeit: '20:00' }, // Fiaker Deife – Spartans VI
  "team-illuminati--28d702|dc-animals-ii": { datum: '2026-12-19', uhrzeit: '20:30' }, // Illuminati – DC Animals
  "dc-animals-ii|jolly-pirates-v": { datum: '2027-01-09', uhrzeit: '20:30' }, // DC Animals – Jolly Pirates V
  "treff-nix-freimann|spartans-vi": { datum: '2027-01-16', uhrzeit: '20:00' }, // Treff Nix Freimann – Spartans VI
  "team-illuminati--28d702|fiaker-deife": { datum: '2027-01-16', uhrzeit: '20:00' }, // Illuminati – Fiaker Deife
  "belfort-evolution|oldies-co": { datum: '2027-01-16', uhrzeit: '20:00' }, // Belfort Evolution – Oldies & Co
  "spartans-vi|team-illuminati--28d702": { datum: '2027-01-22', uhrzeit: '20:00' }, // Spartans VI – Illuminati
  "freibad-bazis|belfort-evolution": { datum: '2027-01-22', uhrzeit: '20:00' }, // Freibad Bazis – Belfort Evolution
  "oldies-co|dc-animals-ii": { datum: '2027-01-22', uhrzeit: '20:30' }, // Oldies & Co – DC Animals
  "jolly-pirates-v|fiaker-deife": { datum: '2027-01-23', uhrzeit: '20:00' }, // Jolly Pirates V – Fiaker Deife
  "jolly-pirates-v|spartans-vi": { datum: '2027-01-29', uhrzeit: '20:00' }, // Jolly Pirates V – Spartans VI
  "treff-nix-freimann|dc-animals-ii": { datum: '2027-01-30', uhrzeit: '20:30' }, // Treff Nix Freimann – DC Animals
  "fiaker-deife|freibad-bazis": { datum: '2027-01-30', uhrzeit: '20:00' }, // Fiaker Deife – Freibad Bazis
  "oldies-co|team-illuminati--28d702": { datum: '2027-02-12', uhrzeit: '20:00' }, // Oldies & Co – Illuminati
  "team-illuminati--28d702|jolly-pirates-v": { datum: '2027-02-20', uhrzeit: '20:00' }, // Illuminati – Jolly Pirates V
  "belfort-evolution|treff-nix-freimann": { datum: '2027-02-20', uhrzeit: '20:00' }, // Belfort Evolution – Treff Nix Freimann
  "fiaker-deife|oldies-co": { datum: '2027-02-20', uhrzeit: '20:00' }, // Fiaker Deife – Oldies & Co
  "dc-animals-ii|freibad-bazis": { datum: '2027-02-20', uhrzeit: '20:30' }, // DC Animals – Freibad Bazis
  "oldies-co|jolly-pirates-v": { datum: '2027-02-26', uhrzeit: '20:00' }, // Oldies & Co – Jolly Pirates V
  "spartans-vi|belfort-evolution": { datum: '2027-02-27', uhrzeit: '20:00' }, // Spartans VI – Belfort Evolution
  "freibad-bazis|team-illuminati--28d702": { datum: '2027-02-27', uhrzeit: '20:00' }, // Freibad Bazis – Illuminati
  "treff-nix-freimann|fiaker-deife": { datum: '2027-02-27', uhrzeit: '20:00' }, // Treff Nix Freimann – Fiaker Deife
  "spartans-vi|oldies-co": { datum: '2027-03-05', uhrzeit: '20:00' }, // Spartans VI – Oldies & Co
  "belfort-evolution|dc-animals-ii": { datum: '2027-03-06', uhrzeit: '20:30' }, // Belfort Evolution – DC Animals
  "jolly-pirates-v|freibad-bazis": { datum: '2027-03-06', uhrzeit: '20:00' }, // Jolly Pirates V – Freibad Bazis
  "treff-nix-freimann|team-illuminati--28d702": { datum: '2027-03-06', uhrzeit: '20:00' }, // Treff Nix Freimann – Illuminati
  "oldies-co|freibad-bazis": { datum: '2027-03-12', uhrzeit: '20:00' }, // Oldies & Co – Freibad Bazis (HRT)
  "jolly-pirates-v|treff-nix-freimann": { datum: '2027-03-12', uhrzeit: '20:00' }, // Jolly Pirates V – Treff Nix Freimann
  "dc-animals-ii|spartans-vi": { datum: '2027-03-13', uhrzeit: '20:30' }, // DC Animals – Spartans VI
  "belfort-evolution|fiaker-deife": { datum: '2027-03-13', uhrzeit: '20:00' }, // Belfort Evolution – Fiaker Deife
  "jolly-pirates-v|dc-animals-ii": { datum: '2027-04-03', uhrzeit: '20:30' }, // Jolly Pirates V – DC Animals
  "freibad-bazis|spartans-vi": { datum: '2027-04-09', uhrzeit: '20:00' }, // Freibad Bazis – Spartans VI
  "oldies-co|treff-nix-freimann": { datum: '2027-04-09', uhrzeit: '20:00' }, // Oldies & Co – Treff Nix Freimann
  "fiaker-deife|dc-animals-ii": { datum: '2027-04-10', uhrzeit: '20:30' }, // Fiaker Deife – DC Animals
  "team-illuminati--28d702|belfort-evolution": { datum: '2027-04-10', uhrzeit: '20:00' }, // Illuminati – Belfort Evolution
  "spartans-vi|fiaker-deife": { datum: '2027-04-16', uhrzeit: '20:00' }, // Spartans VI – Fiaker Deife
  "treff-nix-freimann|freibad-bazis": { datum: '2027-04-17', uhrzeit: '20:00' }, // Treff Nix Freimann – Freibad Bazis
  "dc-animals-ii|team-illuminati--28d702": { datum: '2027-04-17', uhrzeit: '20:30' }, // DC Animals – Illuminati
  "belfort-evolution|jolly-pirates-v": { datum: '2027-04-17', uhrzeit: '20:00' }, // Belfort Evolution – Jolly Pirates V
  "oldies-co|belfort-evolution": { datum: '2027-04-23', uhrzeit: '20:00' }, // Oldies & Co – Belfort Evolution
  "spartans-vi|treff-nix-freimann": { datum: '2027-04-24', uhrzeit: '20:00' }, // Spartans VI – Treff Nix Freimann
  "fiaker-deife|team-illuminati--28d702": { datum: '2027-04-24', uhrzeit: '20:00' }, // Fiaker Deife – Illuminati
  "team-illuminati--28d702|spartans-vi": { datum: '2027-05-08', uhrzeit: '20:00' }, // Illuminati – Spartans VI
  "fiaker-deife|jolly-pirates-v": { datum: '2027-05-08', uhrzeit: '20:00' }, // Fiaker Deife – Jolly Pirates V
  "belfort-evolution|freibad-bazis": { datum: '2027-05-08', uhrzeit: '20:00' }, // Belfort Evolution – Freibad Bazis
  "dc-animals-ii|oldies-co": { datum: '2027-05-08', uhrzeit: '20:30' }, // DC Animals – Oldies & Co
  // ── B1 Liga ──
  "muenchen-0815|master-of-desaster": { datum: '2026-10-23', uhrzeit: '20:30' }, // München 08/15 – Master of Desaster
  "team-dart-s-vaders-48de8a|game-over": { datum: '2026-10-24', uhrzeit: '20:00' }, // Dart's Vaders – Game Over
  "team-black-storm-02eed0|de-hutzeldarter": { datum: '2026-10-24', uhrzeit: '20:00' }, // Black Storm – De Hutzeldarter
  "wild-indians|lucky-darts-one": { datum: '2026-10-24', uhrzeit: '20:00' }, // Wild Indians – Lucky Darts One
  "de-hutzeldarter|muenchen-0815": { datum: '2026-11-13', uhrzeit: '20:00' }, // De Hutzeldarter – München 08/15
  "game-over|team-black-storm-02eed0": { datum: '2026-11-14', uhrzeit: '20:00' }, // Game Over – Black Storm
  "wild-indians|team-dart-s-vaders-48de8a": { datum: '2026-11-14', uhrzeit: '20:00' }, // Wild Indians – Dart's Vaders
  "master-of-desaster|lucky-darts-one": { datum: '2026-11-14', uhrzeit: '20:00' }, // Master of Desaster – Lucky Darts One
  "de-hutzeldarter|game-over": { datum: '2026-11-27', uhrzeit: '20:00' }, // De Hutzeldarter – Game Over
  "muenchen-0815|wild-indians": { datum: '2026-11-27', uhrzeit: '20:30' }, // München 08/15 – Wild Indians
  "lucky-darts-one|team-dart-s-vaders-48de8a": { datum: '2026-11-28', uhrzeit: '20:00' }, // Lucky Darts One – Dart's Vaders
  "team-black-storm-02eed0|master-of-desaster": { datum: '2026-11-28', uhrzeit: '20:00' }, // Black Storm – Master of Desaster
  "master-of-desaster|de-hutzeldarter": { datum: '2026-12-04', uhrzeit: '20:00' }, // Master of Desaster – De Hutzeldarter
  "game-over|lucky-darts-one": { datum: '2026-12-05', uhrzeit: '20:00' }, // Game Over – Lucky Darts One
  "team-dart-s-vaders-48de8a|muenchen-0815": { datum: '2026-12-05', uhrzeit: '20:00' }, // Dart's Vaders – München 08/15
  "wild-indians|team-black-storm-02eed0": { datum: '2026-12-05', uhrzeit: '20:00' }, // Wild Indians – Black Storm
  "de-hutzeldarter|wild-indians": { datum: '2026-12-11', uhrzeit: '20:00' }, // De Hutzeldarter – Wild Indians
  "game-over|master-of-desaster": { datum: '2026-12-12', uhrzeit: '20:00' }, // Game Over – Master of Desaster
  "lucky-darts-one|muenchen-0815": { datum: '2026-12-12', uhrzeit: '20:00' }, // Lucky Darts One – München 08/15
  "team-black-storm-02eed0|team-dart-s-vaders-48de8a": { datum: '2026-12-12', uhrzeit: '20:00' }, // Black Storm – Dart's Vaders
  "muenchen-0815|game-over": { datum: '2027-01-15', uhrzeit: '20:30' }, // München 08/15 – Game Over
  "wild-indians|master-of-desaster": { datum: '2027-01-16', uhrzeit: '20:00' }, // Wild Indians – Master of Desaster
  "lucky-darts-one|team-black-storm-02eed0": { datum: '2027-01-16', uhrzeit: '20:00' }, // Lucky Darts One – Black Storm
  "team-dart-s-vaders-48de8a|de-hutzeldarter": { datum: '2027-01-16', uhrzeit: '20:00' }, // Dart's Vaders – De Hutzeldarter
  "wild-indians|game-over": { datum: '2027-01-22', uhrzeit: '20:00' }, // Wild Indians – Game Over
  "master-of-desaster|team-dart-s-vaders-48de8a": { datum: '2027-01-22', uhrzeit: '20:00' }, // Master of Desaster – Dart's Vaders (Jahr 26→27)
  "de-hutzeldarter|lucky-darts-one": { datum: '2027-01-22', uhrzeit: '20:30' }, // De Hutzeldarter – Lucky Darts One
  "team-black-storm-02eed0|muenchen-0815": { datum: '2027-01-23', uhrzeit: '20:00' }, // Black Storm – München 08/15
  "de-hutzeldarter|team-black-storm-02eed0": { datum: '2027-01-29', uhrzeit: '20:00' }, // De Hutzeldarter – Black Storm
  "game-over|team-dart-s-vaders-48de8a": { datum: '2027-01-30', uhrzeit: '20:00' }, // Game Over – Dart's Vaders
  "lucky-darts-one|wild-indians": { datum: '2027-01-30', uhrzeit: '20:00' }, // Lucky Darts One – Wild Indians
  "master-of-desaster|muenchen-0815": { datum: '2027-01-30', uhrzeit: '20:00' }, // Master of Desaster – München 08/15
  "muenchen-0815|de-hutzeldarter": { datum: '2027-02-19', uhrzeit: '20:30' }, // München 08/15 – De Hutzeldarter
  "team-black-storm-02eed0|game-over": { datum: '2027-02-20', uhrzeit: '20:00' }, // Black Storm – Game Over
  "team-dart-s-vaders-48de8a|wild-indians": { datum: '2027-02-20', uhrzeit: '20:00' }, // Dart's Vaders – Wild Indians
  "lucky-darts-one|master-of-desaster": { datum: '2027-02-20', uhrzeit: '20:00' }, // Lucky Darts One – Master of Desaster
  "game-over|de-hutzeldarter": { datum: '2027-03-06', uhrzeit: '20:00' }, // Game Over – De Hutzeldarter
  "team-dart-s-vaders-48de8a|lucky-darts-one": { datum: '2027-03-06', uhrzeit: '20:00' }, // Dart's Vaders – Lucky Darts One
  "master-of-desaster|team-black-storm-02eed0": { datum: '2027-03-06', uhrzeit: '20:00' }, // Master of Desaster – Black Storm
  "wild-indians|muenchen-0815": { datum: '2027-03-06', uhrzeit: '20:00' }, // Wild Indians – München 08/15
  "de-hutzeldarter|master-of-desaster": { datum: '2027-03-12', uhrzeit: '20:00' }, // De Hutzeldarter – Master of Desaster
  "muenchen-0815|team-dart-s-vaders-48de8a": { datum: '2027-03-12', uhrzeit: '20:30' }, // München 08/15 – Dart's Vaders
  "lucky-darts-one|game-over": { datum: '2027-03-13', uhrzeit: '20:00' }, // Lucky Darts One – Game Over
  "team-black-storm-02eed0|wild-indians": { datum: '2027-03-13', uhrzeit: '20:00' }, // Black Storm – Wild Indians
  "muenchen-0815|lucky-darts-one": { datum: '2027-04-09', uhrzeit: '20:30' }, // München 08/15 – Lucky Darts One
  "master-of-desaster|game-over": { datum: '2027-04-10', uhrzeit: '20:00' }, // Master of Desaster – Game Over
  "wild-indians|de-hutzeldarter": { datum: '2027-04-10', uhrzeit: '20:00' }, // Wild Indians – De Hutzeldarter
  "team-dart-s-vaders-48de8a|team-black-storm-02eed0": { datum: '2027-04-10', uhrzeit: '20:00' }, // Dart's Vaders – Black Storm
  "master-of-desaster|wild-indians": { datum: '2027-04-23', uhrzeit: '20:00' }, // Master of Desaster – Wild Indians
  "de-hutzeldarter|team-dart-s-vaders-48de8a": { datum: '2027-04-23', uhrzeit: '20:00' }, // De Hutzeldarter – Dart's Vaders
  "game-over|muenchen-0815": { datum: '2027-04-24', uhrzeit: '20:00' }, // Game Over – München 08/15
  "team-black-storm-02eed0|lucky-darts-one": { datum: '2027-04-24', uhrzeit: '20:00' }, // Black Storm – Lucky Darts One
  "muenchen-0815|team-black-storm-02eed0": { datum: '2027-05-07', uhrzeit: '20:30' }, // München 08/15 – Black Storm
  "game-over|wild-indians": { datum: '2027-05-08', uhrzeit: '20:00' }, // Game Over – Wild Indians
  "team-dart-s-vaders-48de8a|master-of-desaster": { datum: '2027-05-08', uhrzeit: '20:00' }, // Dart's Vaders – Master of Desaster
  "lucky-darts-one|de-hutzeldarter": { datum: '2027-05-08', uhrzeit: '20:00' }, // Lucky Darts One – De Hutzeldarter
  // ── B2 Liga ──
  "lucky-darts-two|team-wakan-tanka-fff298": { datum: '2026-10-24', uhrzeit: '20:00' }, // Lucky Darts Two – Wakan Tanka
  "team-desaster|de-vogelwuidn": { datum: '2026-10-24', uhrzeit: '20:00' }, // Team Desaster – De Vogelwuid'n
  "flying-fighters|team-leider-geil-dec512": { datum: '2026-10-30', uhrzeit: '20:00' }, // Flying Fighters – Leider Geil
  "de-vogelwuidn|lucky-darts-two": { datum: '2026-11-13', uhrzeit: '20:30' }, // De Vogelwuid'n – Lucky Darts Two
  "team-desaster|flying-fighters": { datum: '2026-11-13', uhrzeit: '20:00' }, // Team Desaster – Flying Fighters
  "team-wakan-tanka-fff298|sound-warriors": { datum: '2026-11-21', uhrzeit: '20:00' }, // Wakan Tanka – Jolly Pirates Sound Warrior's
  "de-vogelwuidn|team-wakan-tanka-fff298": { datum: '2026-11-27', uhrzeit: '20:00' }, // De Vogelwuid'n – Wakan Tanka
  "flying-fighters|lucky-darts-two": { datum: '2026-11-27', uhrzeit: '20:30' }, // Flying Fighters – Lucky Darts Two
  "sound-warriors|team-leider-geil-dec512": { datum: '2026-11-28', uhrzeit: '20:00' }, // Jolly Pirates Sound Warrior's – Leider Geil
  "team-leider-geil-dec512|team-desaster": { datum: '2026-12-04', uhrzeit: '20:30' }, // Leider Geil – Team Desaster
  "team-wakan-tanka-fff298|flying-fighters": { datum: '2026-12-04', uhrzeit: '20:00' }, // Wakan Tanka – Flying Fighters
  "flying-fighters|de-vogelwuidn": { datum: '2026-12-11', uhrzeit: '20:00' }, // Flying Fighters – De Vogelwuid'n
  "lucky-darts-two|team-leider-geil-dec512": { datum: '2026-12-11', uhrzeit: '20:30' }, // Lucky Darts Two – Leider Geil
  "sound-warriors|de-vogelwuidn": { datum: '2026-12-18', uhrzeit: '20:00' }, // Jolly Pirates Sound Warrior's – De Vogelwuid'n
  "team-desaster|sound-warriors": { datum: '2026-12-19', uhrzeit: '20:00' }, // Team Desaster – Jolly Pirates Sound Warrior's
  "flying-fighters|sound-warriors": { datum: '2027-01-15', uhrzeit: '20:00' }, // Flying Fighters – Jolly Pirates Sound Warrior's
  "lucky-darts-two|team-desaster": { datum: '2027-01-15', uhrzeit: '20:30' }, // Lucky Darts Two – Team Desaster
  "team-leider-geil-dec512|team-wakan-tanka-fff298": { datum: '2027-01-15', uhrzeit: '20:30' }, // Leider Geil – Wakan Tanka
  "sound-warriors|lucky-darts-two": { datum: '2027-01-22', uhrzeit: '20:30' }, // Jolly Pirates Sound Warrior's – Lucky Darts Two
  "team-desaster|team-wakan-tanka-fff298": { datum: '2027-01-22', uhrzeit: '20:00' }, // Team Desaster – Wakan Tanka
  "de-vogelwuidn|team-leider-geil-dec512": { datum: '2027-01-22', uhrzeit: '20:30' }, // De Vogelwuid'n – Leider Geil
  "de-vogelwuidn|team-desaster": { datum: '2027-01-29', uhrzeit: '20:00' }, // De Vogelwuid'n – Team Desaster
  "team-wakan-tanka-fff298|lucky-darts-two": { datum: '2027-01-30', uhrzeit: '20:00' }, // Wakan Tanka – Lucky Darts Two
  "team-leider-geil-dec512|flying-fighters": { datum: '2027-01-30', uhrzeit: '20:00' }, // Leider Geil – Flying Fighters
  "lucky-darts-two|de-vogelwuidn": { datum: '2027-02-19', uhrzeit: '20:30' }, // Lucky Darts Two – De Vogelwuid'n
  "flying-fighters|team-desaster": { datum: '2027-02-19', uhrzeit: '20:00' }, // Flying Fighters – Team Desaster
  "sound-warriors|team-wakan-tanka-fff298": { datum: '2027-02-20', uhrzeit: '20:00' }, // Jolly Pirates Sound Warrior's – Wakan Tanka
  "team-leider-geil-dec512|sound-warriors": { datum: '2027-03-05', uhrzeit: '20:30' }, // Leider Geil – Jolly Pirates Sound Warrior's
  "team-wakan-tanka-fff298|de-vogelwuidn": { datum: '2027-03-05', uhrzeit: '20:00' }, // Wakan Tanka – De Vogelwuid'n
  "lucky-darts-two|flying-fighters": { datum: '2027-03-06', uhrzeit: '20:00' }, // Lucky Darts Two – Flying Fighters
  "de-vogelwuidn|sound-warriors": { datum: '2027-03-13', uhrzeit: '20:00' }, // De Vogelwuid'n – Jolly Pirates Sound Warrior's
  "team-desaster|team-leider-geil-dec512": { datum: '2027-03-13', uhrzeit: '20:00' }, // Team Desaster – Leider Geil
  "flying-fighters|team-wakan-tanka-fff298": { datum: '2027-03-13', uhrzeit: '20:00' }, // Flying Fighters – Wakan Tanka
  "de-vogelwuidn|flying-fighters": { datum: '2027-04-09', uhrzeit: '20:00' }, // De Vogelwuid'n – Flying Fighters
  "team-leider-geil-dec512|lucky-darts-two": { datum: '2027-04-09', uhrzeit: '20:30' }, // Leider Geil – Lucky Darts Two
  "sound-warriors|team-desaster": { datum: '2027-04-10', uhrzeit: '20:00' }, // Jolly Pirates Sound Warrior's – Team Desaster
  "sound-warriors|flying-fighters": { datum: '2027-04-23', uhrzeit: '20:00' }, // Jolly Pirates Sound Warrior's – Flying Fighters
  "team-wakan-tanka-fff298|team-leider-geil-dec512": { datum: '2027-04-24', uhrzeit: '20:00' }, // Wakan Tanka – Leider Geil
  "team-desaster|lucky-darts-two": { datum: '2027-05-01', uhrzeit: '20:00' }, // Team Desaster – Lucky Darts Two
  "lucky-darts-two|sound-warriors": { datum: '2027-05-07', uhrzeit: '20:30' }, // Lucky Darts Two – Jolly Pirates Sound Warrior's
  "team-leider-geil-dec512|de-vogelwuidn": { datum: '2027-05-07', uhrzeit: '20:30' }, // Leider Geil – De Vogelwuid'n
  "team-wakan-tanka-fff298|team-desaster": { datum: '2027-05-08', uhrzeit: '20:00' }, // Wakan Tanka – Team Desaster
  // ── C Liga ──
  "funny-darters|black-devils": { datum: '2026-10-23', uhrzeit: '19:30' }, // Funny Darters Munich – Black Devils (HRT)
  "team-team-desaster-m-dels-418268|fuenf-sterne-boazn": { datum: '2026-10-24', uhrzeit: '20:00' }, // Team Desaster Mädels – 5 Sterne Boazn Team
  "team-w-rmtal-bazis-d22210|team-jolly-pirates-vii-3156af": { datum: '2026-10-30', uhrzeit: '20:00' }, // Würmtal Bazis – Jolly Pirates VII
  "black-devils|team-team-desaster-m-dels-418268": { datum: '2026-11-13', uhrzeit: '20:00' }, // Black Devils – Team Desaster Mädels
  "team-dartpromillos--841baa|team-jolly-pirates-vii-3156af": { datum: '2026-11-14', uhrzeit: '20:00' }, // DartPromillos – Jolly Pirates VII
  "funny-darters|team-w-rmtal-bazis-d22210": { datum: '2026-11-14', uhrzeit: '19:00' }, // Funny Darters Munich – Würmtal Bazis
  "fuenf-sterne-boazn|black-devils": { datum: '2026-11-21', uhrzeit: '20:00' }, // 5 Sterne Boazn Team – Black Devils
  "team-jolly-pirates-vii-3156af|funny-darters": { datum: '2026-11-27', uhrzeit: '20:00' }, // Jolly Pirates VII – Funny Darters Munich
  "fuenf-sterne-boazn|team-dartpromillos--841baa": { datum: '2026-11-28', uhrzeit: '20:00' }, // 5 Sterne Boazn Team – DartPromillos (HRT)
  "team-team-desaster-m-dels-418268|team-w-rmtal-bazis-d22210": { datum: '2026-11-29', uhrzeit: '15:00' }, // Team Desaster Mädels – Würmtal Bazis
  "team-jolly-pirates-vii-3156af|team-team-desaster-m-dels-418268": { datum: '2026-12-04', uhrzeit: '20:00' }, // Jolly Pirates VII – Team Desaster Mädels
  "funny-darters|team-dartpromillos--841baa": { datum: '2026-12-05', uhrzeit: '19:00' }, // Funny Darters Munich – DartPromillos
  "black-devils|team-dartpromillos--841baa": { datum: '2026-12-11', uhrzeit: '20:00' }, // Black Devils – DartPromillos
  "team-team-desaster-m-dels-418268|funny-darters": { datum: '2026-12-11', uhrzeit: '20:00' }, // Team Desaster Mädels – Funny Darters Munich
  "team-w-rmtal-bazis-d22210|fuenf-sterne-boazn": { datum: '2026-12-12', uhrzeit: '20:00' }, // Würmtal Bazis – 5 Sterne Boazn Team
  "team-jolly-pirates-vii-3156af|team-w-rmtal-bazis-d22210": { datum: '2027-01-09', uhrzeit: '20:00' }, // Jolly Pirates VII – Würmtal Bazis
  "team-dartpromillos--841baa|team-team-desaster-m-dels-418268": { datum: '2027-01-15', uhrzeit: '20:00' }, // DartPromillos – Team Desaster Mädels
  "team-w-rmtal-bazis-d22210|black-devils": { datum: '2027-01-15', uhrzeit: '20:00' }, // Würmtal Bazis – Black Devils
  "team-jolly-pirates-vii-3156af|fuenf-sterne-boazn": { datum: '2027-01-15', uhrzeit: '20:00' }, // Jolly Pirates VII – 5 Sterne Boazn Team (HT)
  "team-dartpromillos--841baa|team-w-rmtal-bazis-d22210": { datum: '2027-01-23', uhrzeit: '20:00' }, // DartPromillos – Würmtal Bazis
  "black-devils|team-jolly-pirates-vii-3156af": { datum: '2027-01-23', uhrzeit: '20:00' }, // Black Devils – Jolly Pirates VII
  "funny-darters|fuenf-sterne-boazn": { datum: '2027-01-23', uhrzeit: '19:00' }, // Funny Darters Munich – 5 Sterne Boazn Team
  "fuenf-sterne-boazn|team-team-desaster-m-dels-418268": { datum: '2027-01-29', uhrzeit: '20:00' }, // 5 Sterne Boazn Team – Team Desaster Mädels
  "black-devils|funny-darters": { datum: '2027-02-05', uhrzeit: '20:00' }, // Black Devils – Funny Darters Munich (HRT)
  "team-jolly-pirates-vii-3156af|team-dartpromillos--841baa": { datum: '2027-02-20', uhrzeit: '20:00' }, // Jolly Pirates VII – DartPromillos
  "team-w-rmtal-bazis-d22210|funny-darters": { datum: '2027-02-20', uhrzeit: '19:30' }, // Würmtal Bazis – Funny Darters Munich
  "team-team-desaster-m-dels-418268|black-devils": { datum: '2027-02-20', uhrzeit: '20:00' }, // Team Desaster Mädels – Black Devils
  "team-w-rmtal-bazis-d22210|team-team-desaster-m-dels-418268": { datum: '2027-03-05', uhrzeit: '20:00' }, // Würmtal Bazis – Team Desaster Mädels
  "team-dartpromillos--841baa|fuenf-sterne-boazn": { datum: '2027-03-06', uhrzeit: '20:00' }, // DartPromillos – 5 Sterne Boazn Team (HRT)
  "funny-darters|team-jolly-pirates-vii-3156af": { datum: '2027-03-06', uhrzeit: '19:00' }, // Funny Darters Munich – Jolly Pirates VII
  "black-devils|fuenf-sterne-boazn": { datum: '2027-03-12', uhrzeit: '20:00' }, // Black Devils – 5 Sterne Boazn Team
  "team-dartpromillos--841baa|funny-darters": { datum: '2027-03-13', uhrzeit: '20:00' }, // DartPromillos – Funny Darters Munich
  "team-team-desaster-m-dels-418268|team-jolly-pirates-vii-3156af": { datum: '2027-03-13', uhrzeit: '20:00' }, // Team Desaster Mädels – Jolly Pirates VII
  "fuenf-sterne-boazn|team-w-rmtal-bazis-d22210": { datum: '2027-04-09', uhrzeit: '20:00' }, // 5 Sterne Boazn Team – Würmtal Bazis
  "team-dartpromillos--841baa|black-devils": { datum: '2027-04-10', uhrzeit: '20:00' }, // DartPromillos – Black Devils
  "funny-darters|team-team-desaster-m-dels-418268": { datum: '2027-04-10', uhrzeit: '19:00' }, // Funny Darters Munich – Team Desaster Mädels
  "black-devils|team-w-rmtal-bazis-d22210": { datum: '2027-04-23', uhrzeit: '20:00' }, // Black Devils – Würmtal Bazis
  "team-team-desaster-m-dels-418268|team-dartpromillos--841baa": { datum: '2027-04-24', uhrzeit: '20:00' }, // Team Desaster Mädels – DartPromillos
  "fuenf-sterne-boazn|team-jolly-pirates-vii-3156af": { datum: '2027-04-24', uhrzeit: '20:00' }, // 5 Sterne Boazn Team – Jolly Pirates VII (HT)
  "team-jolly-pirates-vii-3156af|black-devils": { datum: '2027-05-07', uhrzeit: '20:00' }, // Jolly Pirates VII – Black Devils
  "fuenf-sterne-boazn|funny-darters": { datum: '2027-05-08', uhrzeit: '19:00' }, // 5 Sterne Boazn Team – Funny Darters Munich
  "team-w-rmtal-bazis-d22210|team-dartpromillos--841baa": { datum: '2027-05-09', uhrzeit: '15:00' }, // Würmtal Bazis – DartPromillos
};
