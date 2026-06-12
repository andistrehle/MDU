// ============================================================
// Players — Münchner Dart Union
// ============================================================
//
// Source: dartunion.de/player_main_public.php?ddSelectTeam=XX
// Scraped: 22.05.2026
//
// DO NOT invent or add players not verified from dartunion.de.
//
// ============================================================

export type PlayerStatus = 'active' | 'inactive' | 'substitute' | 'unknown';

export interface Player {
  /** Unique slug identifier (e.g. 'max-mustermann') */
  id: string;
  firstName: string;
  lastName: string;
  /** Optional display name override (e.g. nickname). Falls back to "firstName lastName". */
  displayName?: string;
  /** Optional nickname / Spitzname, shown as a secondary label on the player card. */
  nickname?: string;
  /** License number as shown on dartunion.de, e.g. "MDU 26 2003". Null if unavailable. */
  licenseNumber?: string;
  status: PlayerStatus;
  /** Path to player photo in /public, e.g. '/player-photos/max-mustermann.jpg'. */
  photoUrl?: string;
}

// ── Player roster — Saison 2026 ──────────────────────────────
export const PLAYERS: Player[] = [

  // ── LA LIGA ─────────────────────────────────────────────
  // SPARTANS
  { id: 'thomas-fraundorfer', firstName: 'Thomas', lastName: 'Fraundorfer', licenseNumber: 'MDU 26 5707', status: 'active', photoUrl: '/player-photos/thomas-fraundorfer.jpg' },
  { id: 'jason-jedlicka', firstName: 'Jason', lastName: 'Jedlicka', licenseNumber: 'MDU 26 3705', status: 'active', photoUrl: '/player-photos/jason-jedlicka.jpg' },
  { id: 'dejan-kovrilja', firstName: 'Dejan', lastName: 'Kovrilja', licenseNumber: 'MDU 3709', status: 'active', photoUrl: '/player-photos/dejan-kovrilja.jpg' },
  { id: 'silvi-lindner', firstName: 'Silvi', lastName: 'Lindner', licenseNumber: 'MDU 26 3703', status: 'active', photoUrl: '/player-photos/silvi-lindner.jpg' },
  { id: 'antun-madaros', firstName: 'Antun', lastName: 'Madaros', licenseNumber: 'MDU 3710', status: 'active', photoUrl: '/player-photos/antun-madaros.jpg' },
  { id: 'karolina-mauerer', firstName: 'Karolina', lastName: 'Mauerer', licenseNumber: 'MDU 26 3701', status: 'active' }, // TC
  { id: 'stefan-schiegg', firstName: 'Stefan', lastName: 'Schiegg', licenseNumber: 'MDU 3714', status: 'active', photoUrl: '/player-photos/stefan-schiegg.jpg' },
  { id: 'markus-schneider', firstName: 'Markus', lastName: 'Schneider', licenseNumber: 'MDU 3703', status: 'active', photoUrl: '/player-photos/markus-schneider.jpg' },
  { id: 'hansi-sliwanski', firstName: 'Hansi', lastName: 'Sliwanski', licenseNumber: 'MDU 26 3702', status: 'active', photoUrl: '/player-photos/hansi-sliwanski.jpg' },
  { id: 'florian-steckermeier', firstName: 'Florian', lastName: 'Steckermeier', licenseNumber: 'MDU 26 3706', status: 'active', photoUrl: '/player-photos/florian-steckermeier.jpg' },
  { id: 'andrej-tereschenko', firstName: 'Andrej', lastName: 'Tereschenko', licenseNumber: 'MDU 3713', status: 'active', photoUrl: '/player-photos/andrej-tereschenko.jpg' },
  { id: 'nico-vasiliadis', firstName: 'Nico', lastName: 'Vasiliadis', licenseNumber: 'MDU 26 3704', status: 'active', photoUrl: '/player-photos/nico-vasiliadis.jpg' },
  { id: 'dirk-wegner', firstName: 'Dirk', lastName: 'Wegner', licenseNumber: 'MDU 3716', status: 'active', photoUrl: '/player-photos/dirk-wegner.png' },  
  // OHNE JACKIE
  { id: 'toni-bauer', firstName: 'Toni', lastName: 'Bauer', licenseNumber: 'MDU 50001', status: 'active', photoUrl: '/player-photos/toni-bauer.jpg' },    // TC
  { id: 'nicklas-bernhardt', firstName: 'Nicklas', lastName: 'Bernhardt', licenseNumber: 'MDU 7113', status: 'active' },
  { id: 'guenes-cam', firstName: 'Guenes', lastName: 'Cam', licenseNumber: 'MDU 7108', status: 'active', photoUrl: '/player-photos/guenes-cam.jpg' },
  { id: 'stephan-ducke', firstName: 'Stephan', lastName: 'Ducke', licenseNumber: 'MDU 1642', status: 'active', photoUrl: '/player-photos/stephan-ducke.jpg' },
  { id: 'manfred-eischer', firstName: 'Manfred', lastName: 'Eischer', licenseNumber: 'MDU 1643', status: 'active', photoUrl: '/player-photos/manfred-eischer.jpg' },
  { id: 'martin-lehner', firstName: 'Martin', lastName: 'Lehner', licenseNumber: 'MDU 7112', status: 'active', photoUrl: '/player-photos/martin-lehner.jpg' },
  { id: 'zlatko-lozancic', firstName: 'Zlatko', lastName: 'Lozancic', licenseNumber: 'MDU 3711', status: 'active', photoUrl: '/player-photos/zlatko-lozancic.jpg' },
  { id: 'chriss-lwowski', firstName: 'Chriss', lastName: 'Lwowski', licenseNumber: 'MDU 7107', status: 'active', photoUrl: '/player-photos/chriss-lwowski.jpg' },
  { id: 'richi-pankratz', firstName: 'Richi', lastName: 'Pankratz', licenseNumber: 'MDU 7111', status: 'active', photoUrl: '/player-photos/richi-pankratz.jpg' },
  { id: 'jimmy-pogremno', firstName: 'Jimmy', lastName: 'Pogremno', licenseNumber: 'MDU 71099', status: 'active', photoUrl: '/player-photos/jimmy-pogremno.jpg' },
  { id: 'alex-rall', firstName: 'Alex', lastName: 'Rall', licenseNumber: 'MDU 7106', status: 'active', photoUrl: '/player-photos/alex-rall.jpg' },
  { id: 'patrick-ruhland', firstName: 'Patrick', lastName: 'Ruhland', licenseNumber: 'MDU 71066', status: 'active', photoUrl: '/player-photos/patrick-ruhland.jpg' },
  { id: 'chris-schaeffer', firstName: 'Chris', lastName: 'Schaeffer', licenseNumber: 'MDU 2699', status: 'active', photoUrl: '/player-photos/chris-schaeffer.jpg' },
  { id: 'peter-seidl', firstName: 'Peter', lastName: 'Seidl', licenseNumber: 'MDU 115006', status: 'active' },
  { id: 'bene-wolf', firstName: 'Bene', lastName: 'Wolf', licenseNumber: 'MDU 1639', status: 'active', photoUrl: '/player-photos/bene-wolf.jpg' },  
  // DC NULL BULL
  { id: 'oorri-arsen', firstName: 'Oorri', lastName: 'Arsen', licenseNumber: 'MDU 26 1010', status: 'active', photoUrl: '/player-photos/oorri-arsen.jpg' },
  { id: 'arben-halitjaha', firstName: 'Arben', lastName: 'Halitjaha', licenseNumber: 'MDU 26 1011', status: 'active', photoUrl: '/player-photos/arben-halitjaha.jpg' },
  { id: 'fatmir-hasanaj', firstName: 'Fatmir', lastName: 'Hasanaj', licenseNumber: 'MDU 26 1007', status: 'active', photoUrl: '/player-photos/fatmir-hasanaj.jpg' },
  { id: 'efraim-idrizi', firstName: 'Efraim', lastName: 'Idrizi', licenseNumber: 'MDU 26 1009', status: 'active' },
  { id: 'dimos-katsikas', firstName: 'Dimos', lastName: 'Katsikas', licenseNumber: 'MDU 007', status: 'active' },
  { id: 'avni-loshi', firstName: 'Avni', lastName: 'Loshi', licenseNumber: 'MDU 26 1006', status: 'active', photoUrl: '/player-photos/avni-loshi.jpg' },
  { id: 'dado-pajdakovic', firstName: 'Dado', lastName: 'Pajdakovic', licenseNumber: 'MDU 26 1003', status: 'active', photoUrl: '/player-photos/dado-pajdakovic.jpg' },
  { id: 'dieter-rogge', firstName: 'Dieter', lastName: 'Rogge', licenseNumber: 'MDU 26 1001', status: 'active', photoUrl: '/player-photos/dieter-rogge.jpg' },    // TC
  { id: 'zoran-subotic', firstName: 'Zoran', lastName: 'Subotic', licenseNumber: 'MDU 26 1012', status: 'active', photoUrl: '/player-photos/zoran-subotic.jpg' },
  { id: 'bobby-vayrynen', firstName: 'Bobby', lastName: 'Vayrynen', licenseNumber: 'MDU 26 1004', status: 'active', photoUrl: '/player-photos/bobby-vayrynen.jpg' },  
  // JOLLY PIRATES KT'S
  { id: 'sascha-bernardi', firstName: 'Sascha', lastName: 'Bernardi', licenseNumber: 'MDU 26 5507', status: 'active', photoUrl: '/player-photos/sascha-bernardi.jpg' },
  { id: 'maximilian-burgis', firstName: 'Maximilian', lastName: 'Burgis', licenseNumber: 'MDU 26 5512', status: 'active', photoUrl: '/player-photos/maximilian-burgis.jpg' },
  { id: 'steven-eisenhofer', firstName: 'Steven', lastName: 'Eisenhofer', licenseNumber: 'MDU 26 5504', status: 'active', photoUrl: '/player-photos/steven-eisenhofer.jpg' },
  { id: 'stjepan-feljan', firstName: 'Stjepan', lastName: 'Feljan', licenseNumber: 'MDU 26 5510', status: 'active', photoUrl: '/player-photos/stjepan-feljan.jpg' },
  { id: 'geli-galatovic', firstName: 'Geli', lastName: 'Galatovic', licenseNumber: 'MDU 26 5502', status: 'active', photoUrl: '/player-photos/geli-galatovic.jpg' },
  { id: 'stjpan-holetic', firstName: 'Stjpan', lastName: 'Holetic', licenseNumber: 'MDU 26 5509', status: 'active' },
  { id: 'mladen-obrstar', firstName: 'Mladen', lastName: 'Obrstar', licenseNumber: 'MDU 26 5517', status: 'active', photoUrl: '/player-photos/mladen-obrstar.jpg' },
  { id: 'florian-preis', firstName: 'Florian', lastName: 'Preis', licenseNumber: 'MDU 26 5514', status: 'active', photoUrl: '/player-photos/florian-preis.jpg' },
  { id: 'melanie-preisendoerfer', firstName: 'Melanie', lastName: 'Preisendörfer', licenseNumber: 'MDU 26 5501', status: 'active', photoUrl: '/player-photos/melanie-preisendoerfer.jpg' },    // TC
  { id: 'christian-reiter', firstName: 'Christian', lastName: 'Reiter', licenseNumber: 'MDU 26 5505', status: 'active', photoUrl: '/player-photos/christian-reiter.jpg' },
  { id: 'moritz-richter', firstName: 'Moritz', lastName: 'Richter', licenseNumber: 'MDU 26 5513', status: 'active' },
  { id: 'christian-schmidkunz', firstName: 'Christian', lastName: 'Schmidkunz', licenseNumber: 'MDU 26 5508', status: 'active' },
  { id: 'johannes-schwaiger', firstName: 'Johannes', lastName: 'Schwaiger', licenseNumber: 'MDU 26 5506', status: 'active', photoUrl: '/player-photos/johannes-schwaiger.jpg' },
  { id: 'dirk-steinbrueck', firstName: 'Dirk', lastName: 'Steinbrück', licenseNumber: 'MDU 26 5515', status: 'active', photoUrl: '/player-photos/dirk-steinbrueck.jpg' },
  { id: 'philipp-steinbrueck', firstName: 'Philipp', lastName: 'Steinbrück', licenseNumber: 'MDU 26 5516', status: 'active', photoUrl: '/player-photos/philipp-steinbrueck.jpg' },
  { id: 'alex-strigl', firstName: 'Alex', lastName: 'Strigl', licenseNumber: 'MDU 26 5511', status: 'active', photoUrl: '/player-photos/alex-strigl.jpg' },
  { id: 'claus-ziebuhr', firstName: 'Claus', lastName: 'Ziebuhr', licenseNumber: 'MDU 26 5503', status: 'active', photoUrl: '/player-photos/claus-ziebuhr.jpg' },  
  // LES DARTAGNONS
  { id: 'michael-haimmerer', firstName: 'Michael', lastName: 'Haimmerer', licenseNumber: 'MDU 26 5305', status: 'active' },
  { id: 'hubert-kandlbinder', firstName: 'Hubert', lastName: 'Kandlbinder', licenseNumber: 'MDU 26 5301', status: 'active', photoUrl: '/player-photos/hubert-kandlbinder.jpg' },    // TC
  { id: 'andreas-knoblauch', firstName: 'Andreas', lastName: 'Knoblauch', licenseNumber: 'MDU 26 5306', status: 'active', photoUrl: '/player-photos/andreas-knoblauch.jpg' },
  { id: 'dieter-rauschmeier', firstName: 'Dieter', lastName: 'Rauschmeier', licenseNumber: 'MDU 26 5308', status: 'active' },
  { id: 'alexander-resch', firstName: 'Alexander', lastName: 'Resch', licenseNumber: 'MDU 26 5310', status: 'active', photoUrl: '/player-photos/alexander-resch.jpg' },
  { id: 'daniel-resch', firstName: 'Daniel', lastName: 'Resch', licenseNumber: 'MDU 26 5309', status: 'active', photoUrl: '/player-photos/daniel-resch.jpg' },
  { id: 'thomas-samhuber', firstName: 'Thomas', lastName: 'Samhuber', licenseNumber: 'MDU 26 5304', status: 'active', photoUrl: '/player-photos/thomas-samhuber.jpg' },
  { id: 'ina-schaper', firstName: 'Ina', lastName: 'Schäper', licenseNumber: 'MDU 26 5303', status: 'active', photoUrl: '/player-photos/ina-schaper.jpg' },
  { id: 'florian-schreiner', firstName: 'Florian', lastName: 'Schreiner', licenseNumber: 'MDU 26 5307', status: 'active' },
  { id: 'regina-ziegltrum', firstName: 'Regina', lastName: 'Ziegltrum', licenseNumber: 'MDU 26 5302', status: 'active' },
  // NO MA'AM
  { id: 'martin-degel', firstName: 'Martin', lastName: 'Degel', licenseNumber: 'MDU 26 6208', status: 'active', photoUrl: '/player-photos/martin-degel.jpg' },
  { id: 'markus-hartmann', firstName: 'Markus', lastName: 'Hartmann', licenseNumber: 'MDU 26 6203', status: 'active', photoUrl: '/player-photos/markus-hartmann.jpg' },
  { id: 'dragan-herceg', firstName: 'Dragan', lastName: 'Herceg', licenseNumber: 'MDU 26 6205', status: 'active', photoUrl: '/player-photos/dragan-herceg.jpg' },
  { id: 'zlatko-juric', firstName: 'Zlatko', lastName: 'Juric', licenseNumber: 'MDU 26 6201', status: 'active', photoUrl: '/player-photos/zlatko-juric.jpg' },    // TC
  { id: 'patrick-mueller', firstName: 'Patrick', lastName: 'Müller', licenseNumber: 'MDU 26 6209', status: 'active' },
  { id: 'andre-schwarz', firstName: 'Andre', lastName: 'Schwarz', licenseNumber: 'MDU 26 6204', status: 'active', photoUrl: '/player-photos/andre-schwarz.jpg' },
  { id: 'christian-sowitsch', firstName: 'Christian', lastName: 'Sowitsch', licenseNumber: 'MDU 26 6206', status: 'active', photoUrl: '/player-photos/christian-sowitsch.jpg' },
  { id: 'wolfgang-straubinger', firstName: 'Wolfgang', lastName: 'Straubinger', licenseNumber: 'MDU 26 6202', status: 'active', photoUrl: '/player-photos/wolfgang-straubinger.jpg' },
  { id: 'florian-wimmer', firstName: 'Florian', lastName: 'Wimmer', licenseNumber: 'MDU 26 6207', status: 'active', photoUrl: '/player-photos/florian-wimmer.jpg' },  

  // ── A1 LIGA ─────────────────────────────────────────────
  // ALPTRAUM
  { id: 'martin-helmbrecht', firstName: 'Martin', lastName: 'Helmbrecht', licenseNumber: 'MDU 26 2003', status: 'active', photoUrl: '/player-photos/martin-helmbrecht.jpg' },
  { id: 'stefan-piperea', firstName: 'Stefan', lastName: 'Piperea', licenseNumber: 'MDU 26 2008', status: 'active', photoUrl: '/player-photos/stefan-piperea.jpg' },
  { id: 'thomas-ponzlet', firstName: 'Thomas', lastName: 'Ponzlet', licenseNumber: 'MDU 26 2004', status: 'active' },
  { id: 'hans-reinicke', firstName: 'Hans', lastName: 'Reinicke', licenseNumber: 'MDU 26 2002', status: 'active', photoUrl: '/player-photos/hans-reinicke.jpg' },
  { id: 'ralf-schricker', firstName: 'Ralf', lastName: 'Schricker', licenseNumber: 'MDU 26 2005', status: 'active', photoUrl: '/player-photos/ralf-schricker.jpg' },
  { id: 'martin-steiner', firstName: 'Martin', lastName: 'Steiner', licenseNumber: 'MDU 26 2007', status: 'active' },
  { id: 'sanel-tokalic', firstName: 'Sanel', lastName: 'Tokalic', licenseNumber: 'MDU 26 2006', status: 'active', photoUrl: '/player-photos/sanel-tokalic.jpg' },
  { id: 'thomas-wagner', firstName: 'Thomas', lastName: 'Wagner', licenseNumber: 'MDU 26 2001', status: 'active', photoUrl: '/player-photos/thomas-wagner.jpg' },    // TC
  // DC ANIMALS II
  { id: 'reinhard-brunnthaler', firstName: 'Reinhard', lastName: 'Brunnthaler', licenseNumber: 'MDU 26 4703', status: 'active' },
  { id: 'steven-distelberger', firstName: 'Steven', lastName: 'Distelberger', licenseNumber: 'MDU 26 4704', status: 'active' },
  { id: 'lilo-ernst', firstName: 'Lilo', lastName: 'Ernst', licenseNumber: 'MDU 26 4702', status: 'active', photoUrl: '/player-photos/lilo-ernst.jpg' },
  { id: 'ronja-frisch', firstName: 'Ronja', lastName: 'Frisch', licenseNumber: 'MDU 26 4705', status: 'active' },
  { id: 'tatjana-frisch', firstName: 'Tatjana', lastName: 'Frisch', licenseNumber: 'MDU 26 4706', status: 'active' },
  { id: 'alex-gerhartsreiter', firstName: 'Alex', lastName: 'Gerhartsreiter', licenseNumber: 'MDU 26 4707', status: 'active' },
  { id: 'joerg-konrad', firstName: 'Jörg', lastName: 'Konrad', licenseNumber: 'MDU 26 4708', status: 'active', photoUrl: '/player-photos/joerg-konrad.jpg' },
  { id: 'natascha-lausch', firstName: 'Natascha', lastName: 'Lausch', licenseNumber: 'MDU 26 4709', status: 'active', photoUrl: '/player-photos/natascha-lausch.jpg' },
  { id: 'kevin-loeffler', firstName: 'Kevin', lastName: 'Löffler', licenseNumber: 'MDU 26 4713', status: 'active' },
  { id: 'frank-maik', firstName: 'Frank', lastName: 'Maik', licenseNumber: 'MDU 26 4714', status: 'active' },
  { id: 'alex-mueckstein', firstName: 'Alex', lastName: 'Mückstein', licenseNumber: 'MDU 26 4701', status: 'active' }, // TC
  { id: 'patrick-spaeth', firstName: 'Patrick', lastName: 'Späth', licenseNumber: 'MDU 26 4710', status: 'active', photoUrl: '/player-photos/patrick-spaeth.jpg' },
  { id: 'ivan-stanisic', firstName: 'Ivan', lastName: 'Stanisic', licenseNumber: 'MDU 26 4711', status: 'active' },
  { id: 'lutz-stockner', firstName: 'Lutz', lastName: 'Stockner', licenseNumber: 'MDU 26 4712', status: 'active', photoUrl: '/player-photos/lutz-stockner.jpg' },  
  // GAMBAS
  { id: 'rickey-eiseb', firstName: 'Rickey', lastName: 'Eiseb', licenseNumber: 'MDU 6009', status: 'active', photoUrl: '/player-photos/rickey-eiseb.jpg' },
  { id: 'peter-grosswieser', firstName: 'Peter', lastName: 'Grosswieser', licenseNumber: 'MDU 6004', status: 'active', photoUrl: '/player-photos/peter-grosswieser.png' },
  { id: 'thomas-hackl', firstName: 'Thomas', lastName: 'Hackl', licenseNumber: 'MDU 6008', status: 'active', photoUrl: '/player-photos/thomas-hackl.jpg' },
  { id: 'axel-heider', firstName: 'Axel', lastName: 'Heider', licenseNumber: 'MDU 6002', status: 'active', photoUrl: '/player-photos/axel-heider.png' },
  { id: 'romano-kaspar', firstName: 'Romano', lastName: 'Kaspar', licenseNumber: 'MDU 6007', status: 'active', photoUrl: '/player-photos/romano-kaspar.jpg' },
  { id: 'douglas-kelterborn', firstName: 'Douglas', lastName: 'Kelterborn', licenseNumber: 'MDU 6010', status: 'active', photoUrl: '/player-photos/douglas-kelterborn.jpg' },
  { id: 'michael-klos', firstName: 'Michael', lastName: 'Klos', licenseNumber: 'MDU 6006', status: 'active', photoUrl: '/player-photos/michael-klos.jpg' },
  { id: 'harald-rathgeb', firstName: 'Harald', lastName: 'Rathgeb', licenseNumber: 'MDU 6005', status: 'active', photoUrl: '/player-photos/harald-rathgeb.jpg' },
  { id: 'gerhart-romboy', firstName: 'Gerhart', lastName: 'Romboy', licenseNumber: 'MDU 26 6001', status: 'active', photoUrl: '/player-photos/gerhart-romboy.jpg' },    // TC
  // SPARTANS VI
  { id: 'stefano-bernecker', firstName: 'Stefano', lastName: 'Bernecker', licenseNumber: 'MDU 26 4302', status: 'active', photoUrl: '/player-photos/stefano-bernecker.jpg' },
  { id: 'michael-boekel', firstName: 'Michael', lastName: 'Bökel', licenseNumber: 'MDU 26 4304', status: 'active' },
  { id: 'martina-boekel', firstName: 'Martina', lastName: 'Bökel', licenseNumber: 'MDU 26 4303', status: 'active', photoUrl: '/player-photos/martina-boekel.jpg' },
  { id: 'franz-gegenfurtner', firstName: 'Franz', lastName: 'Gegenfurtner', licenseNumber: 'MDU 26 4305', status: 'active', photoUrl: '/player-photos/franz-gegenfurtner.jpg' },
  { id: 'steven-gnade', firstName: 'Steven', lastName: 'Gnade', licenseNumber: 'MDU 26 4306', status: 'active' },
  { id: 'markus-hecht', firstName: 'Markus', lastName: 'Hecht', licenseNumber: 'MDU 26 4308', status: 'active', photoUrl: '/player-photos/markus-hecht.jpg' },
  { id: 'thomas-hofstetter', firstName: 'Thomas', lastName: 'Hofstetter', licenseNumber: 'MDU 26 4301', status: 'active', photoUrl: '/player-photos/thomas-hofstetter.jpg' },    // TC
  { id: 'ludwig-ploetz', firstName: 'Ludwig', lastName: 'Ploetz', licenseNumber: 'MDU 26 4307', status: 'active', photoUrl: '/player-photos/ludwig-ploetz.jpg' },  
  // SOUND WARRIOR'S
  { id: 'ursu-alexandru-florin', firstName: 'Ursu', lastName: 'Alexandru Florin', licenseNumber: 'MDU 26 8707', status: 'active' },
  { id: 'christian-bartl', firstName: 'Christian', lastName: 'Bartl', licenseNumber: 'MDU 26 8706', status: 'active' },
  { id: 'thorsten-edelmann', firstName: 'Thorsten', lastName: 'Edelmann', licenseNumber: 'MDU 26 8704', status: 'active', photoUrl: '/player-photos/thorsten-edelmann.jpg' },
  { id: 'phillip-edelmann', firstName: 'Phillip', lastName: 'Edelmann', licenseNumber: 'MDU 26 8705', status: 'active', photoUrl: '/player-photos/phillip-edelmann.jpg' },
  { id: 'jasmin-elmer', firstName: 'Jasmin', lastName: 'Elmer', licenseNumber: 'MDU 26 8708', status: 'active' },
  { id: 'florian-fink', firstName: 'Florian', lastName: 'Fink', licenseNumber: 'MDU 26 8703', status: 'active', photoUrl: '/player-photos/florian-fink.jpg' },
  { id: 'christian-kabermann', firstName: 'Christian', lastName: 'Kabermann', licenseNumber: 'MDU 26 8702', status: 'active', photoUrl: '/player-photos/christian-kabermann.jpg' },
  { id: 'herbert-ohlenforst', firstName: 'Herbert', lastName: 'Ohlenforst', licenseNumber: 'MDU 26 8709', status: 'active', photoUrl: '/player-photos/herbert-ohlenforst.jpg' },
  { id: 'christian-rock', firstName: 'Christian', lastName: 'Rock', licenseNumber: 'MDU 26 8701', status: 'active', photoUrl: '/player-photos/christian-rock.jpg' },    // TC
  // GAME OVER
  { id: 'sonja-krieger', firstName: 'Sonja', lastName: 'Krieger', licenseNumber: 'MDU 26 1502', status: 'active' },
  { id: 'bosko-lebar', firstName: 'Bosko', lastName: 'Lebar', licenseNumber: 'MDU 26 1507', status: 'active', photoUrl: '/player-photos/bosko-lebar.jpg' },
  { id: 'annett-meyer', firstName: 'Annett', lastName: 'Meyer', licenseNumber: 'MDU 26 1501', status: 'active', photoUrl: '/player-photos/annett-meyer.jpg' },    // TC
  { id: 'andre-meyer', firstName: 'Andre', lastName: 'Meyer', licenseNumber: 'MDU 26 1506', status: 'active', photoUrl: '/player-photos/andre-meyer.jpg' },
  { id: 'gabriele-pintaric', firstName: 'Gabriele', lastName: 'Pintaric', licenseNumber: 'MDU 26 1504', status: 'active', photoUrl: '/player-photos/gabriele-pintaric.jpg' },
  { id: 'manuel-schaeffler', firstName: 'Manuel', lastName: 'Schäffler', licenseNumber: 'MDU 26 1509', status: 'active', photoUrl: '/player-photos/manuel-schaeffler.jpg' },
  { id: 'reiner-schlutow', firstName: 'Reiner', lastName: 'Schlutow', licenseNumber: 'MDU 26 1508', status: 'active', photoUrl: '/player-photos/reiner-schlutow.jpg' },
  { id: 'michael-schoeppe', firstName: 'Michael', lastName: 'Schöppe', licenseNumber: 'MDU 26 1505', status: 'active', photoUrl: '/player-photos/michael-schoeppe.jpg' },
  { id: 'robert-vasev', firstName: 'Robert', lastName: 'Vasev', licenseNumber: 'MDU 26 1510', status: 'active' },
  { id: 'denise-wiche', firstName: 'Denise', lastName: 'Wiche', licenseNumber: 'MDU 26 1503', status: 'active' },

  // ── A2 LIGA ─────────────────────────────────────────────
  // TREFF NIX FREIMANN
  { id: 'markus-attenberger', firstName: 'Markus', lastName: 'Attenberger', licenseNumber: 'MDU 26 2805', status: 'active', photoUrl: '/player-photos/markus-attenberger.jpg' },
  { id: 'bernhard-brunner', firstName: 'Bernhard', lastName: 'Brunner', licenseNumber: 'MDU 26 2810', status: 'active', photoUrl: '/player-photos/bernhard-brunner.jpg' },
  { id: 'manuel-buchholz', firstName: 'Manuel', lastName: 'Buchholz', licenseNumber: 'MDU 26 2801', status: 'active', photoUrl: '/player-photos/manuel-buchholz.jpg' },    // TC
  { id: 'julia-freudensprung', firstName: 'Julia', lastName: 'Freudensprung', licenseNumber: 'MDU 26 2803', status: 'active' },
  { id: 'markus-groetsch', firstName: 'Markus', lastName: 'Grötsch', licenseNumber: 'MDU 26 2804', status: 'active', photoUrl: '/player-photos/markus-groetsch.jpg' },
  { id: 'maximilian-halemba', firstName: 'Maximilian', lastName: 'Halemba', licenseNumber: 'MDU 26 2811', status: 'active' },
  { id: 'markus-haratsch', firstName: 'Markus', lastName: 'Haratsch', licenseNumber: 'MDU 26 2806', status: 'active' },
  { id: 'thomas-kueblboeck', firstName: 'Thomas', lastName: 'Küblböck', licenseNumber: 'MDU 26 2802', status: 'active', photoUrl: '/player-photos/thomas-kueblboeck.jpg' },
  { id: 'rainer-langhof', firstName: 'Rainer', lastName: 'Langhof', licenseNumber: 'MDU 26 2809', status: 'active', photoUrl: '/player-photos/rainer-langhof.jpg' },
  { id: 'zoltan-toth', firstName: 'Zoltan', lastName: 'Toth', licenseNumber: 'MDU 26 2807', status: 'active', photoUrl: '/player-photos/zoltan-toth.jpg' },  
  // SILBERPFEILE II
  { id: 'mario-bauriedl', firstName: 'Mario', lastName: 'Bauriedl', licenseNumber: 'MDU 26 8209', status: 'active', photoUrl: '/player-photos/mario-bauriedl.jpg' },
  { id: 'christian-cohnen', firstName: 'Christian', lastName: 'Cohnen', licenseNumber: 'MDU 26 8210', status: 'active', photoUrl: '/player-photos/christian-cohnen.jpg' },
  { id: 'michael-daxenberger', firstName: 'Michael', lastName: 'Daxenberger', licenseNumber: 'MDU 26 8205', status: 'active', photoUrl: '/player-photos/michael-daxenberger.jpg' },
  { id: 'axel-hilger', firstName: 'Axel', lastName: 'Hilger', licenseNumber: 'MDU 26 8208', status: 'active', photoUrl: '/player-photos/axel-hilger.jpg' },
  { id: 'maxi-holzhaeuser', firstName: 'Maxi', lastName: 'Holzhäuser', licenseNumber: 'MDU 26 8204', status: 'active', photoUrl: '/player-photos/maxi-holzhaeuser.jpg' },
  { id: 'friedhelm-jenemann', firstName: 'Friedhelm', lastName: 'Jenemann', licenseNumber: 'MDU 26 8207', status: 'active', photoUrl: '/player-photos/friedhelm-jenemann.jpg' },
  { id: 'maik-koenig', firstName: 'Maik', lastName: 'Koenig', licenseNumber: 'MDU 26 8201', status: 'active', photoUrl: '/player-photos/maik-koenig.jpg' },    // TC
  { id: 'robert-plesa', firstName: 'Robert', lastName: 'Plesa', licenseNumber: 'MDU 26 8206', status: 'active', photoUrl: '/player-photos/robert-plesa.jpg' },
  { id: 'michael-plesa', firstName: 'Michael', lastName: 'Plesa', licenseNumber: 'MDU 26 8211', status: 'active', photoUrl: '/player-photos/michael-plesa.jpg' },
  { id: 'heike-schwarz', firstName: 'Heike', lastName: 'Schwarz', licenseNumber: 'MDU 26 8203', status: 'active', photoUrl: '/player-photos/heike-schwarz.jpg' },
  { id: 'mandy-walter', firstName: 'Mandy', lastName: 'Walter', licenseNumber: 'MDU 26 8202', status: 'active' },
  { id: 'hans-ziegler', firstName: 'Hans', lastName: 'Ziegler', licenseNumber: 'MDU 26 8212', status: 'active', photoUrl: '/player-photos/hans-ziegler.jpg' },  
  // JOLLY PIRATES V
  { id: 'stefan-armbruster', firstName: 'Stefan', lastName: 'Armbruster', licenseNumber: 'MDU 26 3305', status: 'active', photoUrl: '/player-photos/stefan-armbruster.jpg' },
  { id: 'sven-armbruster', firstName: 'Sven', lastName: 'Armbruster', licenseNumber: 'MDU 26 3308', status: 'active', photoUrl: '/player-photos/sven-armbruster.jpg' },
  { id: 'willi-blomann', firstName: 'Willi', lastName: 'Blomann', licenseNumber: 'MDU 26 3304', status: 'active', photoUrl: '/player-photos/willi-blomann.jpg' },
  { id: 'heribert-kraus', firstName: 'Heribert', lastName: 'Kraus', licenseNumber: 'MDU 26 3306', status: 'active' },
  { id: 'sophie-mayrhofer', firstName: 'Sophie', lastName: 'Mayrhofer', licenseNumber: 'MDU 26 3312', status: 'active' },
  { id: 'robert-mendl', firstName: 'Robert', lastName: 'Mendl', licenseNumber: 'MDU 26 3307', status: 'active' },
  { id: 'miki-nyiri', firstName: 'Miki', lastName: 'Nyiri', licenseNumber: 'MDU 26 3309', status: 'active' },
  { id: 'alina-preisendoerfer', firstName: 'Alina', lastName: 'Preisendoerfer', licenseNumber: 'MDU 26 3302', status: 'active', photoUrl: '/player-photos/alina-preisendoerfer.jpg' },
  { id: 'tim-schreiber', firstName: 'Tim', lastName: 'Schreiber', licenseNumber: 'MDU 26 3310', status: 'active' },
  { id: 'andree-sonntag', firstName: 'Andree', lastName: 'Sonntag', licenseNumber: 'MDU 26 3303', status: 'active' },
  { id: 'harry-spitzenberger', firstName: 'Harry', lastName: 'Spitzenberger', licenseNumber: 'MDU 26 3301', status: 'active', photoUrl: '/player-photos/harry-spitzenberger.jpg' },    // TC
  { id: 'theodoros-tsirikos', firstName: 'Theodoros', lastName: 'Tsirikos', licenseNumber: 'MDU 26 3311', status: 'active' },
  // DE WOLPERDINGA
  { id: 'mehmet-bahadir', firstName: 'Mehmet', lastName: 'Bahadir', licenseNumber: 'MDU 26 4006', status: 'active' },
  { id: 'tom-kugler', firstName: 'Tom', lastName: 'Kugler', licenseNumber: 'MDU 26 4005', status: 'active' },
  { id: 'addy-speier', firstName: 'Addy', lastName: 'Speier', licenseNumber: 'MDU 26 4001', status: 'active' },
  { id: 'frank-steininger', firstName: 'Frank', lastName: 'Steininger', licenseNumber: 'MDU 26 4007', status: 'active' },
  { id: 'mario-vaccaro', firstName: 'Mario', lastName: 'Vaccaro', licenseNumber: 'MDU 26 4002', status: 'active' }, // TC
  { id: 'franz-weiller', firstName: 'Franz', lastName: 'Weiller', licenseNumber: 'MDU 26 4003', status: 'active' },
  // OLDIES & CO
  { id: 'diethard-elling', firstName: 'Diethard', lastName: 'Elling', licenseNumber: 'MDU 26 4805', status: 'active', photoUrl: '/player-photos/diethard-elling.jpg' },
  { id: 'fabian-hilse', firstName: 'Fabian', lastName: 'Hilse', licenseNumber: 'MDU 26 4804', status: 'active', photoUrl: '/player-photos/fabian-hilse.jpg' },
  { id: 'thomas-hilse', firstName: 'Thomas', lastName: 'Hilse', licenseNumber: 'MDU 26 4803', status: 'active', photoUrl: '/player-photos/thomas-hilse.jpg' },
  { id: 'ute-hofmann', firstName: 'Ute', lastName: 'Hofmann', licenseNumber: 'MDU 26 4801', status: 'active', photoUrl: '/player-photos/ute-hofmann.jpg' },    // TC
  { id: 'peter-sonntag', firstName: 'Peter', lastName: 'Sonntag', licenseNumber: 'MDU 26 4802', status: 'active', photoUrl: '/player-photos/peter-sonntag.jpg' },  

  // ── B1 LIGA ─────────────────────────────────────────────
  // FLYING FIGHTERS
  { id: 'andy-benda', firstName: 'Andy', lastName: 'Benda', licenseNumber: 'MDU 26 3804', status: 'active', photoUrl: '/player-photos/andy-benda.jpg' },
  { id: 'uli-biber', firstName: 'Uli', lastName: 'Biber', licenseNumber: 'MDU 26 3808', status: 'active', photoUrl: '/player-photos/uli-biber.jpg' },
  { id: 'dominik-brengel', firstName: 'Dominik', lastName: 'Brengel', licenseNumber: 'MDU 26 3811', status: 'active', photoUrl: '/player-photos/dominik-brengel.jpg' },
  { id: 'martin-fischer', firstName: 'Martin', lastName: 'Fischer', licenseNumber: 'MDU 26 3815', status: 'active' },
  { id: 'alexander-jaworeck', firstName: 'Alexander', lastName: 'Jaworeck', licenseNumber: 'MDU 26 3813', status: 'active', photoUrl: '/player-photos/alexander-jaworeck.jpg' },
  { id: 'markus-kuchenbaur', firstName: 'Markus', lastName: 'Kuchenbaur', licenseNumber: 'MDU 26 3805', status: 'active', photoUrl: '/player-photos/markus-kuchenbaur.jpg' },
  { id: 'nikola-masic', firstName: 'Nikola', lastName: 'Masic', licenseNumber: 'MDU 26 3803', status: 'active' },
  { id: 'yves-muehrer', firstName: 'Yves', lastName: 'Mührer', licenseNumber: 'MDU 26 3814', status: 'active', photoUrl: '/player-photos/yves-muehrer.jpg' },
  { id: 'ralf-mueller', firstName: 'Ralf', lastName: 'Müller', licenseNumber: 'MDU 26 3810', status: 'active', photoUrl: '/player-photos/ralf-mueller.jpg' },
  { id: 'jochen-schick', firstName: 'Jochen', lastName: 'Schick', licenseNumber: 'MDU 26 3807', status: 'active' },
  { id: 'philipp-urban', firstName: 'Philipp', lastName: 'Urban', licenseNumber: 'MDU 26 3809', status: 'active', photoUrl: '/player-photos/philipp-urban.jpg' },
  { id: 'stephanie-vaccaro', firstName: 'Stephanie', lastName: 'Vaccaro', licenseNumber: 'MDU 26 3801', status: 'active', photoUrl: '/player-photos/stephanie-vaccaro.jpg' },    // TC
  { id: 'klaus-wasner', firstName: 'Klaus', lastName: 'Wasner', licenseNumber: 'MDU 26 3806', status: 'active', photoUrl: '/player-photos/klaus-wasner.jpg' },
  { id: 'julia-wolf', firstName: 'Julia', lastName: 'Wolf', licenseNumber: 'MDU 26 3802', status: 'active' },
  // MASTER OF DESASTER
  { id: 'deniz-firat', firstName: 'Deniz', lastName: 'Firat', licenseNumber: 'MDU 5608', status: 'active' },
  { id: 'sabine-bine-firat', firstName: 'Sabine \'bine\'', lastName: 'Firat', licenseNumber: 'MDU 5610', status: 'active' },
  { id: 'thomas-gammerler', firstName: 'Thomas', lastName: 'Gämmerler', licenseNumber: 'MDU 5601', status: 'active', photoUrl: '/player-photos/thomas-gammerler.jpg' },    // TC
  { id: 'jan-groves', firstName: 'Jan', lastName: 'Groves', licenseNumber: 'MDU 5606', status: 'active', photoUrl: '/player-photos/jan-groves.jpg' },
  { id: 'angela-hirt', firstName: 'Angela', lastName: 'Hirt', licenseNumber: 'MDU 5602', status: 'active', photoUrl: '/player-photos/angela-hirt.jpg' },
  { id: 'christiane-kopp', firstName: 'Christiane', lastName: 'Kopp', licenseNumber: 'MDU 5604', status: 'active', photoUrl: '/player-photos/christiane-kopp.jpg' },
  { id: 'benjamin-kouhi', firstName: 'Benjamin', lastName: 'Kouhi', licenseNumber: 'MDU 5611', status: 'active', photoUrl: '/player-photos/benjamin-kouhi.jpg' },
  { id: 'klaus-rother', firstName: 'Klaus', lastName: 'Rother', licenseNumber: 'MDU 5605', status: 'active' },
  { id: 'thomas-schmid', firstName: 'Thomas', lastName: 'Schmid', licenseNumber: 'MDU 5607', status: 'active', photoUrl: '/player-photos/thomas-schmid.jpg' },
  { id: 'andre-widl', firstName: 'Andre', lastName: 'Widl', licenseNumber: 'MDU 5609', status: 'active', photoUrl: '/player-photos/andre-widl.jpg' },  
  // FLYING SEVEN
  { id: 'franz-freinberger', firstName: 'Franz', lastName: 'Freinberger', licenseNumber: 'MDU 26 7905', status: 'active', photoUrl: '/player-photos/franz-freinberger.jpg' },
  { id: 'carmen-bianca-loedl', firstName: 'Carmen-bianca', lastName: 'Lödl', licenseNumber: 'MDU 26 7902', status: 'active' },
  { id: 'thomas-reisinger', firstName: 'Thomas', lastName: 'Reisinger', licenseNumber: 'MDU 26 7901', status: 'active', photoUrl: '/player-photos/thomas-reisinger.jpg' },    // TC
  { id: 'erika-reisinger', firstName: 'Erika', lastName: 'Reisinger', licenseNumber: 'MDU 26 7903', status: 'active', photoUrl: '/player-photos/erika-reisinger.jpg' },
  { id: 'daniela-schmelzer', firstName: 'Daniela', lastName: 'Schmelzer', licenseNumber: 'MDU 26 7904', status: 'active', photoUrl: '/player-photos/daniela-schmelzer.jpg' },
  { id: 'patrick-schmelzer', firstName: 'Patrick', lastName: 'Schmelzer', licenseNumber: 'MDU 26 7908', status: 'active', photoUrl: '/player-photos/patrick-schmelzer.jpg' },
  { id: 'stefan-witteck', firstName: 'Stefan', lastName: 'Witteck', licenseNumber: 'MDU 26 7907', status: 'active', photoUrl: '/player-photos/stefan-witteck.jpg' },
  { id: 'stefan-zueckert', firstName: 'Stefan', lastName: 'Zückert', licenseNumber: 'MDU 26 7906', status: 'active', photoUrl: '/player-photos/stefan-zueckert.jpg' },  
  // LUCKY DARTS ONE
  { id: 'roberto-altavilla', firstName: 'Roberto', lastName: 'Altavilla', licenseNumber: 'MDU 26 9808', status: 'active', photoUrl: '/player-photos/roberto-altavilla.jpg' },
  { id: 'torsten-bauer', firstName: 'Torsten', lastName: 'Bauer', licenseNumber: 'MDU 26 9801', status: 'active', photoUrl: '/player-photos/torsten-bauer.jpg' },    // TC
  { id: 'ciaran-dugdale', firstName: 'Ciaran', lastName: 'Dugdale', licenseNumber: 'MDU 26 9807', status: 'active' },
  { id: 'michael-exner', firstName: 'Michael', lastName: 'Exner', licenseNumber: 'MDU 26 9806', status: 'active', photoUrl: '/player-photos/michael-exner.jpg' },
  { id: 'stefan-friedel', firstName: 'Stefan', lastName: 'Friedel', licenseNumber: 'MDU 26 3812', status: 'active', photoUrl: '/player-photos/stefan-friedel.jpg' },
  { id: 'christian-haumer', firstName: 'Christian', lastName: 'Haumer', licenseNumber: 'MDU 26 9805', status: 'active', photoUrl: '/player-photos/christian-haumer.jpg' },
  { id: 'marvin-kommescher', firstName: 'Marvin', lastName: 'Kommescher', licenseNumber: 'MDU 26 9802', status: 'active', photoUrl: '/player-photos/marvin-kommescher.jpg' },
  { id: 'lucas-ruhland', firstName: 'Lucas', lastName: 'Ruhland', licenseNumber: 'MDU 26 9804', status: 'active', photoUrl: '/player-photos/lucas-ruhland.jpg' },  
  // DE HUTZELDARTER
  { id: 'stefan-arnold', firstName: 'Stefan', lastName: 'Arnold', licenseNumber: 'MDU 26 5105', status: 'active', photoUrl: '/player-photos/stefan-arnold.jpg' },
  { id: 'hans-burkhardt', firstName: 'Hans', lastName: 'Burkhardt', licenseNumber: 'MDU 26 5120', status: 'active', photoUrl: '/player-photos/hans-burkhardt.jpg' },
  { id: 'christian-fuersicht', firstName: 'Christian', lastName: 'Fürsicht', licenseNumber: 'MDU 26 5101', status: 'active' }, // TC
  { id: 'robert-hoppe', firstName: 'Robert', lastName: 'Hoppe', licenseNumber: 'MDU 26 5107', status: 'active', photoUrl: '/player-photos/robert-hoppe.jpg' },
  { id: 'christoph-loeb', firstName: 'Christoph', lastName: 'Löb', licenseNumber: 'MDU 26 5108', status: 'active', photoUrl: '/player-photos/christoph-loeb.jpg' },
  { id: 'thomas-loeffler', firstName: 'Thomas', lastName: 'Löffler', licenseNumber: 'MDU 26 5104', status: 'active' },
  { id: 'patrick-meyer', firstName: 'Patrick', lastName: 'Meyer', licenseNumber: 'MDU 26 5109', status: 'active', photoUrl: '/player-photos/patrick-meyer.jpg' },
  { id: 'fritz-mueller', firstName: 'Fritz', lastName: 'Müller', licenseNumber: 'MDU 26 5106', status: 'active', photoUrl: '/player-photos/fritz-mueller.jpg' },
  { id: 'beatrix-paintner-tuite', firstName: 'Beatrix', lastName: 'Paintner-tuite', licenseNumber: 'MDU 26 5103', status: 'active', photoUrl: '/player-photos/beatrix-paintner-tuite.jpg' },
  { id: 'nebojsa-bole-petrovic', firstName: 'Nebojsa Bole', lastName: 'Petrovic', licenseNumber: 'MDU 26 4004', status: 'active', photoUrl: '/player-photos/nebojsa-bole-petrovic.jpg' },  
  // MASSL GHABT
  { id: 'michael-doerner', firstName: 'Michael', lastName: 'Dörner', licenseNumber: 'MDU 26 7321', status: 'active', photoUrl: '/player-photos/michael-doerner.jpg' },
  { id: 'peter-duerrbeck', firstName: 'Peter', lastName: 'Dürrbeck', licenseNumber: 'MDU 26 7301', status: 'active', photoUrl: '/player-photos/peter-duerrbeck.jpg' },
  { id: 'florian-erhard', firstName: 'Florian', lastName: 'Erhard', licenseNumber: 'MDU 26 7306', status: 'active', photoUrl: '/player-photos/florian-erhard.jpg' },
  { id: 'markus-kniehl', firstName: 'Markus', lastName: 'Kniehl', licenseNumber: 'MDU 26 7305', status: 'active', photoUrl: '/player-photos/markus-kniehl.jpg' },    // TC
  { id: 'erdal-memet', firstName: 'Erdal', lastName: 'Memet', licenseNumber: 'MDU 26 7313', status: 'active', photoUrl: '/player-photos/erdal-memet.jpg' },
  { id: 'oliver-pabel', firstName: 'Oliver', lastName: 'Pabel', licenseNumber: 'MDU 26 7307', status: 'active' },
  { id: 'ioannis-pechlivanidis', firstName: 'Ioannis', lastName: 'Pechlivanidis', licenseNumber: 'MDU 26 7311', status: 'active', photoUrl: '/player-photos/ioannis-pechlivanidis.jpg' },
  { id: 'ely-reiter', firstName: 'Ely', lastName: 'Reiter', licenseNumber: 'MDU 26 7302', status: 'active', photoUrl: '/player-photos/ely-reiter.jpg' },
  { id: 'josef-stahl', firstName: 'Josef', lastName: 'Stahl', licenseNumber: 'MDU 26 7314', status: 'active' },
  { id: 'franz-thoma', firstName: 'Franz', lastName: 'Thoma', licenseNumber: 'MDU 26 7309', status: 'active' },
  { id: 'mirek-wasi-watzlawek', firstName: 'Mirek “wasi“', lastName: 'Watzlawek', licenseNumber: 'MDU 26 7320', status: 'active' },
  { id: 'damaris-wilcox', firstName: 'Damaris', lastName: 'Wilcox', licenseNumber: 'MDU 26 7303', status: 'active' },
  { id: 'denise-wudtke-kniehl', firstName: 'Denise', lastName: 'Wudtke Kniehl', licenseNumber: 'MDU 26 7304', status: 'active', photoUrl: '/player-photos/denise-wudtke-kniehl.jpg' },  

  // ── B2 LIGA ─────────────────────────────────────────────
  // BELFORT EVOLUTION
  { id: 'marcellino-berg', firstName: 'Marcellino', lastName: 'Berg', licenseNumber: 'MDU 26 1108', status: 'active', photoUrl: '/player-photos/marcellino-berg.jpg' },
  { id: 'georg-bleicher', firstName: 'Georg', lastName: 'Bleicher', licenseNumber: 'MDU 26 1105', status: 'active', photoUrl: '/player-photos/georg-bleicher.jpg' },
  { id: 'manuela-dinkel', firstName: 'Manuela', lastName: 'Dinkel', licenseNumber: 'MDU 26 1102', status: 'active' },
  { id: 'edith-jaeger', firstName: 'Edith', lastName: 'Jäger', licenseNumber: 'MDU 26 1111', status: 'active' },
  { id: 'manfred-kling', firstName: 'Manfred', lastName: 'Kling', licenseNumber: 'MDU 26 1109', status: 'active', photoUrl: '/player-photos/manfred-kling.jpg' },
  { id: 'christine-pluta', firstName: 'Christine', lastName: 'Pluta', licenseNumber: 'MDU 26 1103', status: 'active', photoUrl: '/player-photos/christine-pluta.jpg' },
  { id: 'dominik-poppe', firstName: 'Dominik', lastName: 'Poppe', licenseNumber: 'MDU 26 1107', status: 'active', photoUrl: '/player-photos/dominik-poppe.jpg' },
  { id: 'dietmar-poppe', firstName: 'Dietmar', lastName: 'Poppe', licenseNumber: 'MDU 26 1101', status: 'active' }, // TC
  { id: 'daniel-richter', firstName: 'Daniel', lastName: 'Richter', licenseNumber: 'MDU 26 1106', status: 'active', photoUrl: '/player-photos/daniel-richter.jpg' },
  { id: 'heinz-roggan', firstName: 'Heinz', lastName: 'Roggan', licenseNumber: 'MDU 26 1104', status: 'active', photoUrl: '/player-photos/heinz-roggan.jpg' },
  { id: 'walter-steckermeier', firstName: 'Walter', lastName: 'Steckermeier', licenseNumber: 'MDU 26 1110', status: 'active', photoUrl: '/player-photos/walter-steckermeier.jpg' },  
  // FIAKER DEIFE
  { id: 'sven-albrecht', firstName: 'Sven', lastName: 'Albrecht', licenseNumber: 'MDU 26 4909', status: 'active', photoUrl: '/player-photos/sven-albrecht.jpg' },
  { id: 'bernhard-hoffmann', firstName: 'Bernhard', lastName: 'Hoffmann', licenseNumber: 'MDU 26 4905', status: 'active', photoUrl: '/player-photos/bernhard-hoffmann.jpg' },
  { id: 'tamara-karnoll', firstName: 'Tamara', lastName: 'Karnoll', licenseNumber: 'MDU 26 4902', status: 'active', photoUrl: '/player-photos/tamara-karnoll.jpg' },
  { id: 'markus-kirschner', firstName: 'Markus', lastName: 'Kirschner', licenseNumber: 'MDU 26 4907', status: 'active' },
  { id: 'timo-lewerenz', firstName: 'Timo', lastName: 'Lewerenz', licenseNumber: 'MDU 26 4911', status: 'active' },
  { id: 'christian-matejka', firstName: 'Christian', lastName: 'Matejka', licenseNumber: 'MDU 26 4901', status: 'active', photoUrl: '/player-photos/christian-matejka.jpg' },    // TC
  { id: 'christian-otto', firstName: 'Christian', lastName: 'Otto', licenseNumber: 'MDU 26 4906', status: 'active' },
  { id: 'annika-pfaffenzeller', firstName: 'Annika', lastName: 'Pfaffenzeller', licenseNumber: 'MDU 26 4912', status: 'active' },
  { id: 'yves-scherer', firstName: 'Yves', lastName: 'Scherer', licenseNumber: 'MDU 26 4904', status: 'active', photoUrl: '/player-photos/yves-scherer.jpg' },
  { id: 'dani-schmidhammer', firstName: 'Dani', lastName: 'Schmidhammer', licenseNumber: 'MDU 26 4910', status: 'active' },
  { id: 'joerg-schmidt', firstName: 'Jörg', lastName: 'Schmidt', licenseNumber: 'MDU 26 4903', status: 'active', photoUrl: '/player-photos/joerg-schmidt.jpg' },
  { id: 'michael-schreil', firstName: 'Michael', lastName: 'Schreil', licenseNumber: 'MDU 26 4908', status: 'active', photoUrl: '/player-photos/michael-schreil.jpg' },  
  // FREIBAD BAZIS
  { id: 'moritz-becker', firstName: 'Moritz', lastName: 'Becker', licenseNumber: 'MDU 26 5903', status: 'active', photoUrl: '/player-photos/moritz-becker.jpg' },
  { id: 'brendan-koeniger', firstName: 'Brendan', lastName: 'Königer', licenseNumber: 'MDU 26 5911', status: 'active' },
  { id: 'christian-kuntscher', firstName: 'Christian', lastName: 'Kuntscher', licenseNumber: 'MDU 26 5907', status: 'active', photoUrl: '/player-photos/christian-kuntscher.jpg' },
  { id: 'matthias-mayring', firstName: 'Matthias', lastName: 'Mayring', licenseNumber: 'MDU 26 5904', status: 'active', photoUrl: '/player-photos/matthias-mayring.jpg' },
  { id: 'denis-nokic', firstName: 'Denis', lastName: 'Nokic', licenseNumber: 'MDU 26 5913', status: 'active' },
  { id: 'christoph-preiss', firstName: 'Christoph', lastName: 'Preiss', licenseNumber: 'MDU 26 5909', status: 'active', photoUrl: '/player-photos/christoph-preiss.jpg' },
  { id: 'manuel-rauch', firstName: 'Manuel', lastName: 'Rauch', licenseNumber: 'MDU 26 5905', status: 'active', photoUrl: '/player-photos/manuel-rauch.jpg' },
  { id: 'sebastian-rogge', firstName: 'Sebastian', lastName: 'Rogge', licenseNumber: 'MDU 26 5906', status: 'active', photoUrl: '/player-photos/sebastian-rogge.jpg' },
  { id: 'andreas-strehle', firstName: 'Andreas', lastName: 'Strehle', licenseNumber: 'MDU 26 5901', status: 'active', photoUrl: '/player-photos/andreas-strehle.jpg' },    // TC
  { id: 'julia-strehle', firstName: 'Julia', lastName: 'Strehle', licenseNumber: 'MDU 26 5902', status: 'active', photoUrl: '/player-photos/julia-strehle.jpg' },
  { id: 'andreas-walter', firstName: 'Andreas', lastName: 'Walter', licenseNumber: 'MDU 26 5910', status: 'active' },
  { id: 'tim-weber', firstName: 'Tim', lastName: 'Weber', licenseNumber: 'MDU 26 5908', status: 'active', photoUrl: '/player-photos/tim-weber.jpg' },  
  // TEAM DESASTER
  { id: 'florian-dospil', firstName: 'Florian', lastName: 'Dospil', licenseNumber: 'MDU 26 5706', status: 'active', photoUrl: '/player-photos/florian-dospil.jpg' },
  { id: 'stefan-fischer', firstName: 'Stefan', lastName: 'Fischer', licenseNumber: 'MDU 26 5701', status: 'active', photoUrl: '/player-photos/stefan-fischer.jpg' },    // TC
  { id: 'helmut-folie', firstName: 'Helmut', lastName: 'Folie', licenseNumber: 'MDU 26 5703', status: 'active', photoUrl: '/player-photos/helmut-folie.jpg' },
  { id: 'reiner-heckmann', firstName: 'Reiner', lastName: 'Heckmann', licenseNumber: 'MDU 26 5712', status: 'active', photoUrl: '/player-photos/reiner-heckmann.jpg' },
  { id: 'markus-hiermann', firstName: 'Markus', lastName: 'Hiermann', licenseNumber: 'MDU 26 5710', status: 'active', photoUrl: '/player-photos/markus-hiermann.jpg' },
  { id: 'mario-krauss', firstName: 'Mario', lastName: 'Krauss', licenseNumber: 'MDU 14487', status: 'active', photoUrl: '/player-photos/mario-krauss.jpg' },
  { id: 'uli-kurz', firstName: 'Uli', lastName: 'Kurz', licenseNumber: 'MDU 26 5704', status: 'active', photoUrl: '/player-photos/uli-kurz.jpg' },
  { id: 'markus-kurz', firstName: 'Markus', lastName: 'Kurz', licenseNumber: 'MDU 26 5705', status: 'active' },
  { id: 'anita-lux', firstName: 'Anita', lastName: 'Lux', licenseNumber: 'MDU 26 5711', status: 'active' },
  { id: 'benjamin-schuy', firstName: 'Benjamin', lastName: 'Schuy', licenseNumber: 'MDU 26 5709', status: 'active' },
  { id: 'stephan-soos', firstName: 'Stephan', lastName: 'Soos', licenseNumber: 'MDU 26 5708', status: 'active', photoUrl: '/player-photos/stephan-soos.jpg' },
  { id: 'tamara-weinberger', firstName: 'Tamara', lastName: 'Weinberger', licenseNumber: 'MDU 26 5702', status: 'active', photoUrl: '/player-photos/tamara-weinberger.jpg' },  
  // DC DARK ANGELS
  { id: 'sabine-eberl', firstName: 'Sabine', lastName: 'Eberl', licenseNumber: 'MDU 26 8502', status: 'active', photoUrl: '/player-photos/sabine-eberl.jpg' },
  { id: 'franz-eberl', firstName: 'Franz', lastName: 'Eberl', licenseNumber: 'MDU 26 8501', status: 'active', photoUrl: '/player-photos/franz-eberl.jpg' },    // TC
  { id: 'justin-marco-eberl', firstName: 'Justin - Marco', lastName: 'Eberl', licenseNumber: 'MDU 26 8503', status: 'active', photoUrl: '/player-photos/justin-marco-eberl.jpg' },
  { id: 'robert-walter', firstName: 'Robert', lastName: 'Walter', licenseNumber: 'MDU 26 8504', status: 'active', photoUrl: '/player-photos/robert-walter.jpg' },
  { id: 'karin-walter', firstName: 'Karin', lastName: 'Walter', licenseNumber: 'MDU 26 8505', status: 'active', photoUrl: '/player-photos/karin-walter.jpg' },  
  // DE VOGELWUID'N
  { id: 'armin-abraham', firstName: 'Armin', lastName: 'Abraham', licenseNumber: 'MDU 26 3911', status: 'active', photoUrl: '/player-photos/armin-abraham.jpg' },
  { id: 'petra-bachmair', firstName: 'Petra', lastName: 'Bachmair', licenseNumber: 'MDU 26 3902', status: 'active', photoUrl: '/player-photos/petra-bachmair.jpg' },
  { id: 'sylwester-gnatowski', firstName: 'Sylwester', lastName: 'Gnatowski', licenseNumber: 'MDU 26 3904', status: 'active', photoUrl: '/player-photos/sylwester-gnatowski.jpg' },
  { id: 'daniel-leitze', firstName: 'Daniel', lastName: 'Leitze', licenseNumber: 'MDU 26 3910', status: 'active', photoUrl: '/player-photos/daniel-leitze.jpg' },
  { id: 'steve-lewik', firstName: 'Steve', lastName: 'Lewik', licenseNumber: 'MDU 26 3907', status: 'active', photoUrl: '/player-photos/steve-lewik.jpg' },
  { id: 'martin-marcinko', firstName: 'Martin', lastName: 'Marcinko', licenseNumber: 'MDU 26 3908', status: 'active', photoUrl: '/player-photos/martin-marcinko.jpg' },
  { id: 'karin-oellerer', firstName: 'Karin', lastName: 'Oellerer', licenseNumber: 'MDU 26 3903', status: 'active' },
  { id: 'petra-rohr', firstName: 'Petra', lastName: 'Rohr', licenseNumber: 'MDU 26 3905', status: 'active', photoUrl: '/player-photos/petra-rohr.jpg' },
  { id: 'horst-saenger', firstName: 'Horst', lastName: 'Sänger', licenseNumber: 'MDU 26 3901', status: 'active' }, // TC
  { id: 'ralf-schweitzer', firstName: 'Ralf', lastName: 'Schweitzer', licenseNumber: 'MDU 26 3906', status: 'active', photoUrl: '/player-photos/ralf-schweitzer.jpg' },
  { id: 'pawel-szymanski', firstName: 'Pawel', lastName: 'Szymanski', licenseNumber: 'MDU 26 3909', status: 'active', photoUrl: '/player-photos/pawel-szymanski.jpg' },  

  // ── C LIGA ─────────────────────────────────────────────
  // WILD INDIANS
  { id: 'juergen-baumstark', firstName: 'Jürgen', lastName: 'Baumstark', licenseNumber: 'MDU 26 8112', status: 'active', photoUrl: '/player-photos/juergen-baumstark.jpg' },
  { id: 'reinhold-behrend', firstName: 'Reinhold', lastName: 'Behrend', licenseNumber: 'MDU 26 8113', status: 'active', photoUrl: '/player-photos/reinhold-behrend.jpg' },
  { id: 'stephan-brunner', firstName: 'Stephan', lastName: 'Brunner', licenseNumber: 'MDU 26 8105', status: 'active', photoUrl: '/player-photos/stephan-brunner.jpg' },
  { id: 'gisi-cornelius', firstName: 'Gisi', lastName: 'Cornelius', licenseNumber: 'MDU 26 8101', status: 'active' },
  { id: 'franz-cornelius', firstName: 'Franz', lastName: 'Cornelius', licenseNumber: 'MDU 26 8102', status: 'active' },
  { id: 'peter-keil', firstName: 'Peter', lastName: 'Keil', licenseNumber: 'MDU 26 8107', status: 'active', photoUrl: '/player-photos/peter-keil.jpg' },
  { id: 'marion-koehler', firstName: 'Marion', lastName: 'Köhler', licenseNumber: 'MDU 26 8103', status: 'active' },
  { id: 'monika-maier', firstName: 'Monika', lastName: 'Maier', licenseNumber: 'MDU 26 8106', status: 'active', photoUrl: '/player-photos/monika-maier.jpg' },
  { id: 'linda-maier', firstName: 'Linda', lastName: 'Maier', licenseNumber: 'MDU 26 8109', status: 'active', photoUrl: '/player-photos/linda-maier.jpg' },
  { id: 'nik-preis', firstName: 'Nik', lastName: 'Preis', licenseNumber: 'MDU 26 8110', status: 'active', photoUrl: '/player-photos/nik-preis.jpg' },
  { id: 'eike-schuster', firstName: 'Eike', lastName: 'Schuster', licenseNumber: 'MDU 26 8114', status: 'active', photoUrl: '/player-photos/eike-schuster.jpg' },
  { id: 'markus-steyer', firstName: 'Markus', lastName: 'Steyer', licenseNumber: 'MDU 26 8104', status: 'active', photoUrl: '/player-photos/markus-steyer.jpg' },    // TC
  { id: 'roman-treichel', firstName: 'Roman', lastName: 'Treichel', licenseNumber: 'MDU 26 8108', status: 'active', photoUrl: '/player-photos/roman-treichel.jpg' },
  { id: 'claudia-vaszi', firstName: 'Claudia', lastName: 'Vaszi', licenseNumber: 'MDU 26 8115', status: 'active', photoUrl: '/player-photos/claudia-vaszi.jpg' },  
  // MÜNCHEN 08/15
  { id: 'michael-gross', firstName: 'Michael', lastName: 'Gross', licenseNumber: 'MDU 26 6309', status: 'active', photoUrl: '/player-photos/michael-gross.jpg' },
  { id: 'andreas-kirschbauer', firstName: 'Andreas', lastName: 'Kirschbauer', licenseNumber: 'MDU 26 6305', status: 'active', photoUrl: '/player-photos/andreas-kirschbauer.jpg' },
  { id: 'waltraud-kranabetter', firstName: 'Waltraud', lastName: 'Kranabetter', licenseNumber: 'MDU 26 6303', status: 'active', photoUrl: '/player-photos/waltraud-kranabetter.jpg' },
  { id: 'herbert-kranabetter', firstName: 'Herbert', lastName: 'Kranabetter', licenseNumber: 'MDU 26 6304', status: 'active', photoUrl: '/player-photos/herbert-kranabetter.jpg' },
  { id: 'erwin-listl', firstName: 'Erwin', lastName: 'Listl', licenseNumber: 'MDU 26 6306', status: 'active', photoUrl: '/player-photos/erwin-listl.jpg' },
  { id: 'brane-sikimic', firstName: 'Brane', lastName: 'Sikimic', licenseNumber: 'MDU 26 6307', status: 'active' },
  { id: 'robert-stelzig', firstName: 'Robert', lastName: 'Stelzig', licenseNumber: 'MDU 26 6308', status: 'active', photoUrl: '/player-photos/robert-stelzig.jpg' },
  { id: 'kostas-tsopanoglou', firstName: 'Kostas', lastName: 'Tsopanoglou', licenseNumber: 'MDU 26 6302', status: 'active', photoUrl: '/player-photos/kostas-tsopanoglou.jpg' },
  { id: 'lukasz-wiacek', firstName: 'Lukasz', lastName: 'Wiacek', licenseNumber: 'MDU 26 6301', status: 'active', photoUrl: '/player-photos/lukasz-wiacek.jpg' },    // TC
  // LUCKY DARTS TWO
  { id: 'johanna-attenberger', firstName: 'Johanna', lastName: 'Attenberger', licenseNumber: 'MDU 26 8904', status: 'active', photoUrl: '/player-photos/johanna-attenberger.jpg' },
  { id: 'stefanie-attenberger', firstName: 'Stefanie', lastName: 'Attenberger', licenseNumber: 'MDU 26 8902', status: 'active', photoUrl: '/player-photos/stefanie-attenberger.jpg' },
  { id: 'susanne-bauer', firstName: 'Susanne', lastName: 'Bauer', licenseNumber: 'MDU 26 8901', status: 'active', photoUrl: '/player-photos/susanne-bauer.jpg' },    // TC
  { id: 'lea-bauer', firstName: 'Lea', lastName: 'Bauer', licenseNumber: 'MDU 26 8903', status: 'active', photoUrl: '/player-photos/lea-bauer.jpg' },
  { id: 'benjamin-bauer', firstName: 'Benjamin', lastName: 'Bauer', licenseNumber: 'MDU 26 8907', status: 'active', photoUrl: '/player-photos/benjamin-bauer.jpg' },
  { id: 'michaela-exner', firstName: 'Michaela', lastName: 'Exner', licenseNumber: 'MDU 26 8906', status: 'active', photoUrl: '/player-photos/michaela-exner.jpg' },
  { id: 'fabian-mahr', firstName: 'Fabian', lastName: 'Mahr', licenseNumber: 'MDU 26 8908', status: 'active', photoUrl: '/player-photos/fabian-mahr.jpg' },
  { id: 'jessica-von-mahren', firstName: 'Jessica', lastName: 'von Mahren', licenseNumber: 'MDU 26 8905', status: 'active', photoUrl: '/player-photos/jessica-von-mahren.jpg' },  
  // FUNNY DARTERS MUNICH
  { id: 'despina-assimenidu', firstName: 'Despina', lastName: 'Assimenidu', licenseNumber: 'MDU 26 6504', status: 'active', photoUrl: '/player-photos/despina-assimenidu.jpg' },
  { id: 'joerg-hirschfeld', firstName: 'Jörg', lastName: 'Hirschfeld', licenseNumber: 'MDU 26 6508', status: 'active', photoUrl: '/player-photos/joerg-hirschfeld.jpg' },
  { id: 'marcus-kampmann', firstName: 'Marcus', lastName: 'Kampmann', licenseNumber: 'MDU 26 6501', status: 'active', photoUrl: '/player-photos/marcus-kampmann.jpg' },    // TC
  { id: 'athanasios-karagkiozdis', firstName: 'Athanasios', lastName: 'Karagkiozdis', licenseNumber: 'MDU 26 6507', status: 'active', photoUrl: '/player-photos/athanasios-karagkiozdis.jpg' },
  { id: 'panos-moraitis', firstName: 'Panos', lastName: 'Moraitis', licenseNumber: 'MDU 26 6505', status: 'active' },
  { id: 'vassilios-papadopoulos', firstName: 'Vassilios', lastName: 'Papadopoulos', licenseNumber: 'MDU 26 6509', status: 'active', photoUrl: '/player-photos/vassilios-papadopoulos.jpg' },
  { id: 'dimitrios-papadopoulos', firstName: 'Dimitrios', lastName: 'Papadopoulos', licenseNumber: 'MDU 26 6506', status: 'active', photoUrl: '/player-photos/dimitrios-papadopoulos.jpg' },
  { id: 'michael-sigl', firstName: 'Michael', lastName: 'Sigl', licenseNumber: 'MDU 26 6502', status: 'active', photoUrl: '/player-photos/michael-sigl.jpg' },
  { id: 'iordanis-tertioglou', firstName: 'Iordanis', lastName: 'Tertioglou', licenseNumber: 'MDU 26 6503', status: 'active' },
  { id: 'iannis-tertiroglou', firstName: 'Iannis', lastName: 'Tertiroglou', licenseNumber: 'MDU 26 6510', status: 'active', photoUrl: '/player-photos/iannis-tertiroglou.jpg' },  
  // BLACK DEVILS
  { id: 'michael-berger', firstName: 'Michael', lastName: 'Berger', licenseNumber: 'MDU 26 9001', status: 'active', photoUrl: '/player-photos/michael-berger.jpg' },
  { id: 'alexandra-brunner', firstName: 'Alexandra', lastName: 'Brunner', licenseNumber: 'MDU 26 9005', status: 'active', photoUrl: '/player-photos/alexandra-brunner.jpg' },
  { id: 'mita-burdulea', firstName: 'Mita', lastName: 'Burdulea', licenseNumber: 'MDU 26 9007', status: 'active', photoUrl: '/player-photos/mita-burdulea.jpg' },
  { id: 'karsten-dassler', firstName: 'Karsten', lastName: 'Dassler', licenseNumber: 'MDU 26 9003', status: 'active', photoUrl: '/player-photos/karsten-dassler.jpg' },
  { id: 'patricia-duesing', firstName: 'Patricia', lastName: 'Duesing', licenseNumber: 'MDU 26 9011', status: 'active', photoUrl: '/player-photos/patricia-duesing.jpg' },
  { id: 'daniel-foerster', firstName: 'Daniel', lastName: 'Förster', licenseNumber: 'MDU 26 9002', status: 'active', photoUrl: '/player-photos/daniel-foerster.jpg' },
  { id: 'torsten-gruner', firstName: 'Torsten', lastName: 'Gruner', licenseNumber: 'MDU 26 9004', status: 'active', photoUrl: '/player-photos/torsten-gruner.jpg' },
  { id: 'maria-hofner', firstName: 'Maria', lastName: 'Hofner', licenseNumber: 'MDU 26 9006', status: 'active', photoUrl: '/player-photos/maria-hofner.jpg' },
  { id: 'martina-kabilka', firstName: 'Martina', lastName: 'Kabilka', licenseNumber: 'MDU 26 9008', status: 'active', photoUrl: '/player-photos/martina-kabilka.jpg' },
  { id: 'petra-roedl', firstName: 'Petra', lastName: 'Rödl', licenseNumber: 'MDU 26 9010', status: 'active', photoUrl: '/player-photos/petra-roedl.png' },    // TC
  { id: 'christoph-weinberger', firstName: 'Christoph', lastName: 'Weinberger', licenseNumber: 'MDU 26 9009', status: 'active', photoUrl: '/player-photos/christoph-weinberger.jpg' },  
  // 5 STERNE BOAZN TEAM
  { id: 'stefan-bayer', firstName: 'Stefan', lastName: 'Bayer', licenseNumber: 'MDU 26 2907', status: 'active', photoUrl: '/player-photos/stefan-bayer.jpg' },
  { id: 'sebastian-kadjurek', firstName: 'Sebastian', lastName: 'Kadjurek', licenseNumber: 'MDU 26 2903', status: 'active', photoUrl: '/player-photos/sebastian-kadjurek.jpg' },
  { id: 'erwin-kammergruber', firstName: 'Erwin', lastName: 'Kammergruber', licenseNumber: 'MDU 26 2908', status: 'active' },
  { id: 'peter-kerklau', firstName: 'Peter', lastName: 'Kerklau', licenseNumber: 'MDU 26 2912', status: 'active' },
  { id: 'georgi-ketiashvili', firstName: 'Georgi', lastName: 'Ketiashvili', licenseNumber: 'MDU 26 2905', status: 'active' },
  { id: 'rebecca-kranabetter', firstName: 'Rebecca', lastName: 'Kranabetter', licenseNumber: 'MDU 26 2902', status: 'active', photoUrl: '/player-photos/rebecca-kranabetter.jpg' },
  { id: 'stefan-kugler', firstName: 'Stefan', lastName: 'Kugler', licenseNumber: 'MDU 26 2910', status: 'active', photoUrl: '/player-photos/stefan-kugler.jpg' },
  { id: 'jutta-lachner', firstName: 'Jutta', lastName: 'Lachner', licenseNumber: 'MDU 26 2901', status: 'active', photoUrl: '/player-photos/jutta-lachner.jpg' },    // TC
  { id: 'alexander-lachner', firstName: 'Alexander', lastName: 'Lachner', licenseNumber: 'MDU 26 2909', status: 'active', photoUrl: '/player-photos/alexander-lachner.jpg' },
  { id: 'domenik-nachtmann', firstName: 'Domenik', lastName: 'Nachtmann', licenseNumber: 'MDU 26 2911', status: 'active' },
  { id: 'wolfgang-rettke', firstName: 'Wolfgang', lastName: 'Rettke', licenseNumber: 'MDU 26 2904', status: 'active', photoUrl: '/player-photos/wolfgang-rettke.jpg' },
  { id: 'christian-schmidt', firstName: 'Christian', lastName: 'Schmidt', licenseNumber: 'MDU 26 2906', status: 'active', photoUrl: '/player-photos/christian-schmidt.jpg' },
  { id: 'stefan-veitinger', firstName: 'Stefan', lastName: 'Veitinger', licenseNumber: 'MDU 26 2913', status: 'active', photoUrl: '/player-photos/stefan-veitinger.jpg' },
];

/** Returns a player by id, or undefined. */
export function findPlayer(id: string): Player | undefined {
  return PLAYERS.find(p => p.id === id);
}

/** Returns a player by license number (e.g. 'MDU 26 1234'), or undefined. */
export function getPlayerByLicenseNumber(licenseNumber: string): Player | undefined {
  const norm = licenseNumber.trim().toUpperCase();
  return PLAYERS.find(p => p.licenseNumber?.toUpperCase() === norm);
}

/**
 * Returns the display name for a player.
 * Uses player.displayName if set, otherwise "firstName lastName".
 */
export function getPlayerDisplayName(player: Player): string {
  return player.displayName ?? `${player.firstName} ${player.lastName}`.trim();
}

/** Returns the local photo URL for a player, or undefined if none. */
export function getPlayerPhoto(playerId: string): string | undefined {
  return findPlayer(playerId)?.photoUrl;
}

/** Returns 1–2 uppercase initials for avatar fallback. */
export function getPlayerInitials(player: Player): string {
  const first = (player.displayName ?? player.firstName).trim()[0] ?? '';
  const last  = player.lastName.trim()[0] ?? '';
  return (first + last).toUpperCase();
}

/**
 * Looks up a player photo by display name (case-insensitive).
 * Used for Einzelranglisten where only the name is known.
 */
export function getPlayerPhotoByName(name: string): string | undefined {
  const norm = name.trim().toLowerCase();
  const player = PLAYERS.find(p => {
    const dn = (p.displayName ?? `${p.firstName} ${p.lastName}`).trim().toLowerCase();
    return dn === norm;
  });
  return player?.photoUrl;
}

/**
 * Derives initials from a display name string (e.g. "Andreas Strehle" → "AS").
 * Used for Einzelranglisten avatar fallback.
 */
export function getInitialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}
