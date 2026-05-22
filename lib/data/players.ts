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
  /** License number as shown on dartunion.de, e.g. "MDU 26 2003". Null if unavailable. */
  licenseNumber?: string;
  status: PlayerStatus;
}

// ── Player roster — Saison 2026 ──────────────────────────────
export const PLAYERS: Player[] = [

  // ── LA LIGA ─────────────────────────────────────────────
  // SPARTANS
  { id: 'thomas-fraundorfer', firstName: 'Thomas', lastName: 'Fraundorfer', licenseNumber: 'MDU 26 5707', status: 'active' },
  { id: 'jason-jedlicka', firstName: 'Jason', lastName: 'Jedlicka', licenseNumber: 'MDU 26 3705', status: 'active' },
  { id: 'dejan-kovrilja', firstName: 'Dejan', lastName: 'Kovrilja', licenseNumber: 'MDU 3709', status: 'active' },
  { id: 'silvi-lindner', firstName: 'Silvi', lastName: 'Lindner', licenseNumber: 'MDU 26 3703', status: 'active' },
  { id: 'antun-madaros', firstName: 'Antun', lastName: 'Madaros', licenseNumber: 'MDU 3710', status: 'active' },
  { id: 'karolina-mauerer', firstName: 'Karolina', lastName: 'Mauerer', licenseNumber: 'MDU 26 3701', status: 'active' }, // TC
  { id: 'stefan-schiegg', firstName: 'Stefan', lastName: 'Schiegg', licenseNumber: 'MDU 3714', status: 'active' },
  { id: 'markus-schneider', firstName: 'Markus', lastName: 'Schneider', licenseNumber: 'MDU 3703', status: 'active' },
  { id: 'hansi-sliwanski', firstName: 'Hansi', lastName: 'Sliwanski', licenseNumber: 'MDU 26 3702', status: 'active' },
  { id: 'florian-steckermeier', firstName: 'Florian', lastName: 'Steckermeier', licenseNumber: 'MDU 26 3706', status: 'active' },
  { id: 'andrej-tereschenko', firstName: 'Andrej', lastName: 'Tereschenko', licenseNumber: 'MDU 3713', status: 'active' },
  { id: 'nico-vasiliadis', firstName: 'Nico', lastName: 'Vasiliadis', licenseNumber: 'MDU 26 3704', status: 'active' },
  { id: 'dirk-wegner', firstName: 'Dirk', lastName: 'Wegner', licenseNumber: 'MDU 3716', status: 'active' },
  // OHNE JACKIE
  { id: 'toni-bauer', firstName: 'Toni', lastName: 'Bauer', licenseNumber: 'MDU 50001', status: 'active' }, // TC
  { id: 'nicklas-bernhardt', firstName: 'Nicklas', lastName: 'Bernhardt', licenseNumber: 'MDU 7113', status: 'active' },
  { id: 'guenes-cam', firstName: 'Guenes', lastName: 'Cam', licenseNumber: 'MDU 7108', status: 'active' },
  { id: 'stephan-ducke', firstName: 'Stephan', lastName: 'Ducke', licenseNumber: 'MDU 1642', status: 'active' },
  { id: 'manfred-eischer', firstName: 'Manfred', lastName: 'Eischer', licenseNumber: 'MDU 1643', status: 'active' },
  { id: 'martin-lehner', firstName: 'Martin', lastName: 'Lehner', licenseNumber: 'MDU 7112', status: 'active' },
  { id: 'zlatko-lozancic', firstName: 'Zlatko', lastName: 'Lozancic', licenseNumber: 'MDU 3711', status: 'active' },
  { id: 'chriss-lwowski', firstName: 'Chriss', lastName: 'Lwowski', licenseNumber: 'MDU 7107', status: 'active' },
  { id: 'richi-pankratz', firstName: 'Richi', lastName: 'Pankratz', licenseNumber: 'MDU 7111', status: 'active' },
  { id: 'jimmy-pogremno', firstName: 'Jimmy', lastName: 'Pogremno', licenseNumber: 'MDU 71099', status: 'active' },
  { id: 'alex-rall', firstName: 'Alex', lastName: 'Rall', licenseNumber: 'MDU 7106', status: 'active' },
  { id: 'patrick-ruhland', firstName: 'Patrick', lastName: 'Ruhland', licenseNumber: 'MDU 71066', status: 'active' },
  { id: 'chris-schaeffer', firstName: 'Chris', lastName: 'Schaeffer', licenseNumber: 'MDU 2699', status: 'active' },
  { id: 'peter-seidl', firstName: 'Peter', lastName: 'Seidl', licenseNumber: 'MDU 115006', status: 'active' },
  { id: 'bene-wolf', firstName: 'Bene', lastName: 'Wolf', licenseNumber: 'MDU 1639', status: 'active' },
  // DC NULL BULL
  { id: 'oorri-arsen', firstName: 'Oorri', lastName: 'Arsen', licenseNumber: 'MDU 26 1010', status: 'active' },
  { id: 'arben-halitjaha', firstName: 'Arben', lastName: 'Halitjaha', licenseNumber: 'MDU 26 1011', status: 'active' },
  { id: 'fatmir-hasanaj', firstName: 'Fatmir', lastName: 'Hasanaj', licenseNumber: 'MDU 26 1007', status: 'active' },
  { id: 'efraim-idrizi', firstName: 'Efraim', lastName: 'Idrizi', licenseNumber: 'MDU 26 1009', status: 'active' },
  { id: 'dimos-katsikas', firstName: 'Dimos', lastName: 'Katsikas', licenseNumber: 'MDU 007', status: 'active' },
  { id: 'avni-loshi', firstName: 'Avni', lastName: 'Loshi', licenseNumber: 'MDU 26 1006', status: 'active' },
  { id: 'dado-pajdakovic', firstName: 'Dado', lastName: 'Pajdakovic', licenseNumber: 'MDU 26 1003', status: 'active' },
  { id: 'dieter-rogge', firstName: 'Dieter', lastName: 'Rogge', licenseNumber: 'MDU 26 1001', status: 'active' }, // TC
  { id: 'zoran-subotic', firstName: 'Zoran', lastName: 'Subotic', licenseNumber: 'MDU 26 1012', status: 'active' },
  { id: 'bobby-vayrynen', firstName: 'Bobby', lastName: 'Vayrynen', licenseNumber: 'MDU 26 1004', status: 'active' },
  // JOLLY PIRATES KT'S
  { id: 'sascha-bernardi', firstName: 'Sascha', lastName: 'Bernardi', licenseNumber: 'MDU 26 5507', status: 'active' },
  { id: 'maximilian-burgis', firstName: 'Maximilian', lastName: 'Burgis', licenseNumber: 'MDU 26 5512', status: 'active' },
  { id: 'steven-eisenhofer', firstName: 'Steven', lastName: 'Eisenhofer', licenseNumber: 'MDU 26 5504', status: 'active' },
  { id: 'stjepan-feljan', firstName: 'Stjepan', lastName: 'Feljan', licenseNumber: 'MDU 26 5510', status: 'active' },
  { id: 'geli-galatovic', firstName: 'Geli', lastName: 'Galatovic', licenseNumber: 'MDU 26 5502', status: 'active' },
  { id: 'stjpan-holetic', firstName: 'Stjpan', lastName: 'Holetic', licenseNumber: 'MDU 26 5509', status: 'active' },
  { id: 'mladen-obrstar', firstName: 'Mladen', lastName: 'Obrstar', licenseNumber: 'MDU 26 5517', status: 'active' },
  { id: 'florian-preis', firstName: 'Florian', lastName: 'Preis', licenseNumber: 'MDU 26 5514', status: 'active' },
  { id: 'melanie-preisendoerfer', firstName: 'Melanie', lastName: 'Preisendörfer', licenseNumber: 'MDU 26 5501', status: 'active' }, // TC
  { id: 'christian-reiter', firstName: 'Christian', lastName: 'Reiter', licenseNumber: 'MDU 26 5505', status: 'active' },
  { id: 'moritz-richter', firstName: 'Moritz', lastName: 'Richter', licenseNumber: 'MDU 26 5513', status: 'active' },
  { id: 'christian-schmidkunz', firstName: 'Christian', lastName: 'Schmidkunz', licenseNumber: 'MDU 26 5508', status: 'active' },
  { id: 'johannes-schwaiger', firstName: 'Johannes', lastName: 'Schwaiger', licenseNumber: 'MDU 26 5506', status: 'active' },
  { id: 'dirk-steinbrueck', firstName: 'Dirk', lastName: 'Steinbrück', licenseNumber: 'MDU 26 5515', status: 'active' },
  { id: 'philipp-steinbrueck', firstName: 'Philipp', lastName: 'Steinbrück', licenseNumber: 'MDU 26 5516', status: 'active' },
  { id: 'alex-strigl', firstName: 'Alex', lastName: 'Strigl', licenseNumber: 'MDU 26 5511', status: 'active' },
  { id: 'claus-ziebuhr', firstName: 'Claus', lastName: 'Ziebuhr', licenseNumber: 'MDU 26 5503', status: 'active' },
  // LES DARTAGNONS
  { id: 'michael-haimmerer', firstName: 'Michael', lastName: 'Haimmerer', licenseNumber: 'MDU 26 5305', status: 'active' },
  { id: 'hubert-kandlbinder', firstName: 'Hubert', lastName: 'Kandlbinder', licenseNumber: 'MDU 26 5301', status: 'active' }, // TC
  { id: 'andreas-knoblauch', firstName: 'Andreas', lastName: 'Knoblauch', licenseNumber: 'MDU 26 5306', status: 'active' },
  { id: 'dieter-rauschmeier', firstName: 'Dieter', lastName: 'Rauschmeier', licenseNumber: 'MDU 26 5308', status: 'active' },
  { id: 'alexander-resch', firstName: 'Alexander', lastName: 'Resch', licenseNumber: 'MDU 26 5310', status: 'active' },
  { id: 'daniel-resch', firstName: 'Daniel', lastName: 'Resch', licenseNumber: 'MDU 26 5309', status: 'active' },
  { id: 'thomas-samhuber', firstName: 'Thomas', lastName: 'Samhuber', licenseNumber: 'MDU 26 5304', status: 'active' },
  { id: 'ina-schaper', firstName: 'Ina', lastName: 'Schäper', licenseNumber: 'MDU 26 5303', status: 'active' },
  { id: 'florian-schreiner', firstName: 'Florian', lastName: 'Schreiner', licenseNumber: 'MDU 26 5307', status: 'active' },
  { id: 'regina-ziegltrum', firstName: 'Regina', lastName: 'Ziegltrum', licenseNumber: 'MDU 26 5302', status: 'active' },
  // NO MA'AM
  { id: 'martin-degel', firstName: 'Martin', lastName: 'Degel', licenseNumber: 'MDU 26 6208', status: 'active' },
  { id: 'markus-hartmann', firstName: 'Markus', lastName: 'Hartmann', licenseNumber: 'MDU 26 6203', status: 'active' },
  { id: 'dragan-herceg', firstName: 'Dragan', lastName: 'Herceg', licenseNumber: 'MDU 26 6205', status: 'active' },
  { id: 'zlatko-juric', firstName: 'Zlatko', lastName: 'Juric', licenseNumber: 'MDU 26 6201', status: 'active' }, // TC
  { id: 'patrick-mueller', firstName: 'Patrick', lastName: 'Müller', licenseNumber: 'MDU 26 6209', status: 'active' },
  { id: 'andre-schwarz', firstName: 'Andre', lastName: 'Schwarz', licenseNumber: 'MDU 26 6204', status: 'active' },
  { id: 'christian-sowitsch', firstName: 'Christian', lastName: 'Sowitsch', licenseNumber: 'MDU 26 6206', status: 'active' },
  { id: 'wolfgang-straubinger', firstName: 'Wolfgang', lastName: 'Straubinger', licenseNumber: 'MDU 26 6202', status: 'active' },
  { id: 'florian-wimmer', firstName: 'Florian', lastName: 'Wimmer', licenseNumber: 'MDU 26 6207', status: 'active' },

  // ── A1 LIGA ─────────────────────────────────────────────
  // ALPTRAUM
  { id: 'martin-helmbrecht', firstName: 'Martin', lastName: 'Helmbrecht', licenseNumber: 'MDU 26 2003', status: 'active' },
  { id: 'stefan-piperea', firstName: 'Stefan', lastName: 'Piperea', licenseNumber: 'MDU 26 2008', status: 'active' },
  { id: 'thomas-ponzlet', firstName: 'Thomas', lastName: 'Ponzlet', licenseNumber: 'MDU 26 2004', status: 'active' },
  { id: 'hans-reinicke', firstName: 'Hans', lastName: 'Reinicke', licenseNumber: 'MDU 26 2002', status: 'active' },
  { id: 'ralf-schricker', firstName: 'Ralf', lastName: 'Schricker', licenseNumber: 'MDU 26 2005', status: 'active' },
  { id: 'martin-steiner', firstName: 'Martin', lastName: 'Steiner', licenseNumber: 'MDU 26 2007', status: 'active' },
  { id: 'sanel-tokalic', firstName: 'Sanel', lastName: 'Tokalic', licenseNumber: 'MDU 26 2006', status: 'active' },
  { id: 'thomas-wagner', firstName: 'Thomas', lastName: 'Wagner', licenseNumber: 'MDU 26 2001', status: 'active' }, // TC
  // DC ANIMALS II
  { id: 'reinhard-brunnthaler', firstName: 'Reinhard', lastName: 'Brunnthaler', licenseNumber: 'MDU 26 4703', status: 'active' },
  { id: 'steven-distelberger', firstName: 'Steven', lastName: 'Distelberger', licenseNumber: 'MDU 26 4704', status: 'active' },
  { id: 'lilo-ernst', firstName: 'Lilo', lastName: 'Ernst', licenseNumber: 'MDU 26 4702', status: 'active' },
  { id: 'ronja-frisch', firstName: 'Ronja', lastName: 'Frisch', licenseNumber: 'MDU 26 4705', status: 'active' },
  { id: 'tatjana-frisch', firstName: 'Tatjana', lastName: 'Frisch', licenseNumber: 'MDU 26 4706', status: 'active' },
  { id: 'alex-gerhartsreiter', firstName: 'Alex', lastName: 'Gerhartsreiter', licenseNumber: 'MDU 26 4707', status: 'active' },
  { id: 'joerg-konrad', firstName: 'Jörg', lastName: 'Konrad', licenseNumber: 'MDU 26 4708', status: 'active' },
  { id: 'natascha-lausch', firstName: 'Natascha', lastName: 'Lausch', licenseNumber: 'MDU 26 4709', status: 'active' },
  { id: 'kevin-loeffler', firstName: 'Kevin', lastName: 'Löffler', licenseNumber: 'MDU 26 4713', status: 'active' },
  { id: 'frank-maik', firstName: 'Frank', lastName: 'Maik', licenseNumber: 'MDU 26 4714', status: 'active' },
  { id: 'alex-mueckstein', firstName: 'Alex', lastName: 'Mückstein', licenseNumber: 'MDU 26 4701', status: 'active' }, // TC
  { id: 'patrick-spaeth', firstName: 'Patrick', lastName: 'Späth', licenseNumber: 'MDU 26 4710', status: 'active' },
  { id: 'ivan-stanisic', firstName: 'Ivan', lastName: 'Stanisic', licenseNumber: 'MDU 26 4711', status: 'active' },
  { id: 'lutz-stockner', firstName: 'Lutz', lastName: 'Stockner', licenseNumber: 'MDU 26 4712', status: 'active' },
  // GAMBAS
  { id: 'rickey-eiseb', firstName: 'Rickey', lastName: 'Eiseb', licenseNumber: 'MDU 6009', status: 'active' },
  { id: 'peter-grosswieser', firstName: 'Peter', lastName: 'Grosswieser', licenseNumber: 'MDU 6004', status: 'active' },
  { id: 'thomas-hackl', firstName: 'Thomas', lastName: 'Hackl', licenseNumber: 'MDU 6008', status: 'active' },
  { id: 'axel-heider', firstName: 'Axel', lastName: 'Heider', licenseNumber: 'MDU 6002', status: 'active' },
  { id: 'romano-kaspar', firstName: 'Romano', lastName: 'Kaspar', licenseNumber: 'MDU 6007', status: 'active' },
  { id: 'douglas-kelterborn', firstName: 'Douglas', lastName: 'Kelterborn', licenseNumber: 'MDU 6010', status: 'active' },
  { id: 'michael-klos', firstName: 'Michael', lastName: 'Klos', licenseNumber: 'MDU 6006', status: 'active' },
  { id: 'harald-rathgeb', firstName: 'Harald', lastName: 'Rathgeb', licenseNumber: 'MDU 6005', status: 'active' },
  { id: 'gerhart-romboy', firstName: 'Gerhart', lastName: 'Romboy', licenseNumber: 'MDU 26 6001', status: 'active' }, // TC
  // SPARTANS VI
  { id: 'stefano-bernecker', firstName: 'Stefano', lastName: 'Bernecker', licenseNumber: 'MDU 26 4302', status: 'active' },
  { id: 'michael-boekel', firstName: 'Michael', lastName: 'Bökel', licenseNumber: 'MDU 26 4304', status: 'active' },
  { id: 'martina-boekel', firstName: 'Martina', lastName: 'Bökel', licenseNumber: 'MDU 26 4303', status: 'active' },
  { id: 'franz-gegenfurtner', firstName: 'Franz', lastName: 'Gegenfurtner', licenseNumber: 'MDU 26 4305', status: 'active' },
  { id: 'steven-gnade', firstName: 'Steven', lastName: 'Gnade', licenseNumber: 'MDU 26 4306', status: 'active' },
  { id: 'markus-hecht', firstName: 'Markus', lastName: 'Hecht', licenseNumber: 'MDU 26 4308', status: 'active' },
  { id: 'thomas-hofstetter', firstName: 'Thomas', lastName: 'Hofstetter', licenseNumber: 'MDU 26 4301', status: 'active' }, // TC
  { id: 'ludwig-ploetz', firstName: 'Ludwig', lastName: 'Ploetz', licenseNumber: 'MDU 26 4307', status: 'active' },
  // SOUND WARRIOR'S
  { id: 'ursu-alexandru-florin', firstName: 'Ursu', lastName: 'Alexandru Florin', licenseNumber: 'MDU 26 8707', status: 'active' },
  { id: 'christian-bartl', firstName: 'Christian', lastName: 'Bartl', licenseNumber: 'MDU 26 8706', status: 'active' },
  { id: 'thorsten-edelmann', firstName: 'Thorsten', lastName: 'Edelmann', licenseNumber: 'MDU 26 8704', status: 'active' },
  { id: 'phillip-edelmann', firstName: 'Phillip', lastName: 'Edelmann', licenseNumber: 'MDU 26 8705', status: 'active' },
  { id: 'jasmin-elmer', firstName: 'Jasmin', lastName: 'Elmer', licenseNumber: 'MDU 26 8708', status: 'active' },
  { id: 'florian-fink', firstName: 'Florian', lastName: 'Fink', licenseNumber: 'MDU 26 8703', status: 'active' },
  { id: 'christian-kabermann', firstName: 'Christian', lastName: 'Kabermann', licenseNumber: 'MDU 26 8702', status: 'active' },
  { id: 'herbert-ohlenforst', firstName: 'Herbert', lastName: 'Ohlenforst', licenseNumber: 'MDU 26 8709', status: 'active' },
  { id: 'christian-rock', firstName: 'Christian', lastName: 'Rock', licenseNumber: 'MDU 26 8701', status: 'active' }, // TC
  // GAME OVER
  { id: 'sonja-krieger', firstName: 'Sonja', lastName: 'Krieger', licenseNumber: 'MDU 26 1502', status: 'active' },
  { id: 'bosko-lebar', firstName: 'Bosko', lastName: 'Lebar', licenseNumber: 'MDU 26 1507', status: 'active' },
  { id: 'annett-meyer', firstName: 'Annett', lastName: 'Meyer', licenseNumber: 'MDU 26 1501', status: 'active' }, // TC
  { id: 'andre-meyer', firstName: 'Andre', lastName: 'Meyer', licenseNumber: 'MDU 26 1506', status: 'active' },
  { id: 'gabriele-pintaric', firstName: 'Gabriele', lastName: 'Pintaric', licenseNumber: 'MDU 26 1504', status: 'active' },
  { id: 'manuel-schaeffler', firstName: 'Manuel', lastName: 'Schäffler', licenseNumber: 'MDU 26 1509', status: 'active' },
  { id: 'reiner-schlutow', firstName: 'Reiner', lastName: 'Schlutow', licenseNumber: 'MDU 26 1508', status: 'active' },
  { id: 'michael-schoeppe', firstName: 'Michael', lastName: 'Schöppe', licenseNumber: 'MDU 26 1505', status: 'active' },
  { id: 'robert-vasev', firstName: 'Robert', lastName: 'Vasev', licenseNumber: 'MDU 26 1510', status: 'active' },
  { id: 'denise-wiche', firstName: 'Denise', lastName: 'Wiche', licenseNumber: 'MDU 26 1503', status: 'active' },

  // ── A2 LIGA ─────────────────────────────────────────────
  // TREFF NIX FREIMANN
  { id: 'markus-attenberger', firstName: 'Markus', lastName: 'Attenberger', licenseNumber: 'MDU 26 2805', status: 'active' },
  { id: 'bernhard-brunner', firstName: 'Bernhard', lastName: 'Brunner', licenseNumber: 'MDU 26 2810', status: 'active' },
  { id: 'manuel-buchholz', firstName: 'Manuel', lastName: 'Buchholz', licenseNumber: 'MDU 26 2801', status: 'active' }, // TC
  { id: 'julia-freudensprung', firstName: 'Julia', lastName: 'Freudensprung', licenseNumber: 'MDU 26 2803', status: 'active' },
  { id: 'markus-groetsch', firstName: 'Markus', lastName: 'Grötsch', licenseNumber: 'MDU 26 2804', status: 'active' },
  { id: 'maximilian-halemba', firstName: 'Maximilian', lastName: 'Halemba', licenseNumber: 'MDU 26 2811', status: 'active' },
  { id: 'markus-haratsch', firstName: 'Markus', lastName: 'Haratsch', licenseNumber: 'MDU 26 2806', status: 'active' },
  { id: 'thomas-kueblboeck', firstName: 'Thomas', lastName: 'Küblböck', licenseNumber: 'MDU 26 2802', status: 'active' },
  { id: 'rainer-langhof', firstName: 'Rainer', lastName: 'Langhof', licenseNumber: 'MDU 26 2809', status: 'active' },
  { id: 'zoltan-toth', firstName: 'Zoltan', lastName: 'Toth', licenseNumber: 'MDU 26 2807', status: 'active' },
  // SILBERPFEILE II
  { id: 'mario-bauriedl', firstName: 'Mario', lastName: 'Bauriedl', licenseNumber: 'MDU 26 8209', status: 'active' },
  { id: 'christian-cohnen', firstName: 'Christian', lastName: 'Cohnen', licenseNumber: 'MDU 26 8210', status: 'active' },
  { id: 'michael-daxenberger', firstName: 'Michael', lastName: 'Daxenberger', licenseNumber: 'MDU 26 8205', status: 'active' },
  { id: 'axel-hilger', firstName: 'Axel', lastName: 'Hilger', licenseNumber: 'MDU 26 8208', status: 'active' },
  { id: 'maxi-holzhaeuser', firstName: 'Maxi', lastName: 'Holzhäuser', licenseNumber: 'MDU 26 8204', status: 'active' },
  { id: 'friedhelm-jenemann', firstName: 'Friedhelm', lastName: 'Jenemann', licenseNumber: 'MDU 26 8207', status: 'active' },
  { id: 'maik-koenig', firstName: 'Maik', lastName: 'Koenig', licenseNumber: 'MDU 26 8201', status: 'active' }, // TC
  { id: 'robert-plesa', firstName: 'Robert', lastName: 'Plesa', licenseNumber: 'MDU 26 8206', status: 'active' },
  { id: 'michael-plesa', firstName: 'Michael', lastName: 'Plesa', licenseNumber: 'MDU 26 8211', status: 'active' },
  { id: 'heike-schwarz', firstName: 'Heike', lastName: 'Schwarz', licenseNumber: 'MDU 26 8203', status: 'active' },
  { id: 'mandy-walter', firstName: 'Mandy', lastName: 'Walter', licenseNumber: 'MDU 26 8202', status: 'active' },
  { id: 'hans-ziegler', firstName: 'Hans', lastName: 'Ziegler', licenseNumber: 'MDU 26 8212', status: 'active' },
  // JOLLY PIRATES V
  { id: 'stefan-armbruster', firstName: 'Stefan', lastName: 'Armbruster', licenseNumber: 'MDU 26 3305', status: 'active' },
  { id: 'sven-armbruster', firstName: 'Sven', lastName: 'Armbruster', licenseNumber: 'MDU 26 3308', status: 'active' },
  { id: 'willi-blomann', firstName: 'Willi', lastName: 'Blomann', licenseNumber: 'MDU 26 3304', status: 'active' },
  { id: 'heribert-kraus', firstName: 'Heribert', lastName: 'Kraus', licenseNumber: 'MDU 26 3306', status: 'active' },
  { id: 'sophie-mayrhofer', firstName: 'Sophie', lastName: 'Mayrhofer', licenseNumber: 'MDU 26 3312', status: 'active' },
  { id: 'robert-mendl', firstName: 'Robert', lastName: 'Mendl', licenseNumber: 'MDU 26 3307', status: 'active' },
  { id: 'miki-nyiri', firstName: 'Miki', lastName: 'Nyiri', licenseNumber: 'MDU 26 3309', status: 'active' },
  { id: 'alina-preisendoerfer', firstName: 'Alina', lastName: 'Preisendoerfer', licenseNumber: 'MDU 26 3302', status: 'active' },
  { id: 'tim-schreiber', firstName: 'Tim', lastName: 'Schreiber', licenseNumber: 'MDU 26 3310', status: 'active' },
  { id: 'andree-sonntag', firstName: 'Andree', lastName: 'Sonntag', licenseNumber: 'MDU 26 3303', status: 'active' },
  { id: 'harry-spitzenberger', firstName: 'Harry', lastName: 'Spitzenberger', licenseNumber: 'MDU 26 3301', status: 'active' }, // TC
  { id: 'theodoros-tsirikos', firstName: 'Theodoros', lastName: 'Tsirikos', licenseNumber: 'MDU 26 3311', status: 'active' },
  // DE WOLPERDINGA
  { id: 'mehmet-bahadir', firstName: 'Mehmet', lastName: 'Bahadir', licenseNumber: 'MDU 26 4006', status: 'active' },
  { id: 'tom-kugler', firstName: 'Tom', lastName: 'Kugler', licenseNumber: 'MDU 26 4005', status: 'active' },
  { id: 'addy-speier', firstName: 'Addy', lastName: 'Speier', licenseNumber: 'MDU 26 4001', status: 'active' },
  { id: 'frank-steininger', firstName: 'Frank', lastName: 'Steininger', licenseNumber: 'MDU 26 4007', status: 'active' },
  { id: 'mario-vaccaro', firstName: 'Mario', lastName: 'Vaccaro', licenseNumber: 'MDU 26 4002', status: 'active' }, // TC
  { id: 'franz-weiller', firstName: 'Franz', lastName: 'Weiller', licenseNumber: 'MDU 26 4003', status: 'active' },
  // OLDIES & CO
  { id: 'diethard-elling', firstName: 'Diethard', lastName: 'Elling', licenseNumber: 'MDU 26 4805', status: 'active' },
  { id: 'fabian-hilse', firstName: 'Fabian', lastName: 'Hilse', licenseNumber: 'MDU 26 4804', status: 'active' },
  { id: 'thomas-hilse', firstName: 'Thomas', lastName: 'Hilse', licenseNumber: 'MDU 26 4803', status: 'active' },
  { id: 'ute-hofmann', firstName: 'Ute', lastName: 'Hofmann', licenseNumber: 'MDU 26 4801', status: 'active' }, // TC
  { id: 'peter-sonntag', firstName: 'Peter', lastName: 'Sonntag', licenseNumber: 'MDU 26 4802', status: 'active' },

  // ── B1 LIGA ─────────────────────────────────────────────
  // FLYING FIGHTERS
  { id: 'andy-benda', firstName: 'Andy', lastName: 'Benda', licenseNumber: 'MDU 26 3804', status: 'active' },
  { id: 'uli-biber', firstName: 'Uli', lastName: 'Biber', licenseNumber: 'MDU 26 3808', status: 'active' },
  { id: 'dominik-brengel', firstName: 'Dominik', lastName: 'Brengel', licenseNumber: 'MDU 26 3811', status: 'active' },
  { id: 'martin-fischer', firstName: 'Martin', lastName: 'Fischer', licenseNumber: 'MDU 26 3815', status: 'active' },
  { id: 'alexander-jaworeck', firstName: 'Alexander', lastName: 'Jaworeck', licenseNumber: 'MDU 26 3813', status: 'active' },
  { id: 'markus-kuchenbaur', firstName: 'Markus', lastName: 'Kuchenbaur', licenseNumber: 'MDU 26 3805', status: 'active' },
  { id: 'nikola-masic', firstName: 'Nikola', lastName: 'Masic', licenseNumber: 'MDU 26 3803', status: 'active' },
  { id: 'yves-muehrer', firstName: 'Yves', lastName: 'Mührer', licenseNumber: 'MDU 26 3814', status: 'active' },
  { id: 'ralf-mueller', firstName: 'Ralf', lastName: 'Müller', licenseNumber: 'MDU 26 3810', status: 'active' },
  { id: 'jochen-schick', firstName: 'Jochen', lastName: 'Schick', licenseNumber: 'MDU 26 3807', status: 'active' },
  { id: 'philipp-urban', firstName: 'Philipp', lastName: 'Urban', licenseNumber: 'MDU 26 3809', status: 'active' },
  { id: 'stephanie-vaccaro', firstName: 'Stephanie', lastName: 'Vaccaro', licenseNumber: 'MDU 26 3801', status: 'active' }, // TC
  { id: 'klaus-wasner', firstName: 'Klaus', lastName: 'Wasner', licenseNumber: 'MDU 26 3806', status: 'active' },
  { id: 'julia-wolf', firstName: 'Julia', lastName: 'Wolf', licenseNumber: 'MDU 26 3802', status: 'active' },
  // MASTER OF DESASTER
  { id: 'deniz-firat', firstName: 'Deniz', lastName: 'Firat', licenseNumber: 'MDU 5608', status: 'active' },
  { id: 'sabine-bine-firat', firstName: 'Sabine \'bine\'', lastName: 'Firat', licenseNumber: 'MDU 5610', status: 'active' },
  { id: 'thomas-gammerler', firstName: 'Thomas', lastName: 'Gämmerler', licenseNumber: 'MDU 5601', status: 'active' }, // TC
  { id: 'jan-groves', firstName: 'Jan', lastName: 'Groves', licenseNumber: 'MDU 5606', status: 'active' },
  { id: 'angela-hirt', firstName: 'Angela', lastName: 'Hirt', licenseNumber: 'MDU 5602', status: 'active' },
  { id: 'christiane-kopp', firstName: 'Christiane', lastName: 'Kopp', licenseNumber: 'MDU 5604', status: 'active' },
  { id: 'benjamin-kouhi', firstName: 'Benjamin', lastName: 'Kouhi', licenseNumber: 'MDU 5611', status: 'active' },
  { id: 'klaus-rother', firstName: 'Klaus', lastName: 'Rother', licenseNumber: 'MDU 5605', status: 'active' },
  { id: 'thomas-schmid', firstName: 'Thomas', lastName: 'Schmid', licenseNumber: 'MDU 5607', status: 'active' },
  { id: 'andre-widl', firstName: 'Andre', lastName: 'Widl', licenseNumber: 'MDU 5609', status: 'active' },
  // FLYING SEVEN
  { id: 'franz-freinberger', firstName: 'Franz', lastName: 'Freinberger', licenseNumber: 'MDU 26 7905', status: 'active' },
  { id: 'carmen-bianca-loedl', firstName: 'Carmen-bianca', lastName: 'Lödl', licenseNumber: 'MDU 26 7902', status: 'active' },
  { id: 'thomas-reisinger', firstName: 'Thomas', lastName: 'Reisinger', licenseNumber: 'MDU 26 7901', status: 'active' }, // TC
  { id: 'erika-reisinger', firstName: 'Erika', lastName: 'Reisinger', licenseNumber: 'MDU 26 7903', status: 'active' },
  { id: 'daniela-schmelzer', firstName: 'Daniela', lastName: 'Schmelzer', licenseNumber: 'MDU 26 7904', status: 'active' },
  { id: 'patrick-schmelzer', firstName: 'Patrick', lastName: 'Schmelzer', licenseNumber: 'MDU 26 7908', status: 'active' },
  { id: 'stefan-witteck', firstName: 'Stefan', lastName: 'Witteck', licenseNumber: 'MDU 26 7907', status: 'active' },
  { id: 'stefan-zueckert', firstName: 'Stefan', lastName: 'Zückert', licenseNumber: 'MDU 26 7906', status: 'active' },
  // LUCKY DARTS ONE
  { id: 'roberto-altavilla', firstName: 'Roberto', lastName: 'Altavilla', licenseNumber: 'MDU 26 9808', status: 'active' },
  { id: 'torsten-bauer', firstName: 'Torsten', lastName: 'Bauer', licenseNumber: 'MDU 26 9801', status: 'active' }, // TC
  { id: 'ciaran-dugdale', firstName: 'Ciaran', lastName: 'Dugdale', licenseNumber: 'MDU 26 9807', status: 'active' },
  { id: 'michael-exner', firstName: 'Michael', lastName: 'Exner', licenseNumber: 'MDU 26 9806', status: 'active' },
  { id: 'stefan-friedel', firstName: 'Stefan', lastName: 'Friedel', licenseNumber: 'MDU 26 3812', status: 'active' },
  { id: 'christian-haumer', firstName: 'Christian', lastName: 'Haumer', licenseNumber: 'MDU 26 9805', status: 'active' },
  { id: 'marvin-kommescher', firstName: 'Marvin', lastName: 'Kommescher', licenseNumber: 'MDU 26 9802', status: 'active' },
  { id: 'lucas-ruhland', firstName: 'Lucas', lastName: 'Ruhland', licenseNumber: 'MDU 26 9804', status: 'active' },
  // DE HUTZELDARTER
  { id: 'stefan-arnold', firstName: 'Stefan', lastName: 'Arnold', licenseNumber: 'MDU 26 5105', status: 'active' },
  { id: 'hans-burkhardt', firstName: 'Hans', lastName: 'Burkhardt', licenseNumber: 'MDU 26 5120', status: 'active' },
  { id: 'christian-fuersicht', firstName: 'Christian', lastName: 'Fürsicht', licenseNumber: 'MDU 26 5101', status: 'active' }, // TC
  { id: 'robert-hoppe', firstName: 'Robert', lastName: 'Hoppe', licenseNumber: 'MDU 26 5107', status: 'active' },
  { id: 'christoph-loeb', firstName: 'Christoph', lastName: 'Löb', licenseNumber: 'MDU 26 5108', status: 'active' },
  { id: 'thomas-loeffler', firstName: 'Thomas', lastName: 'Löffler', licenseNumber: 'MDU 26 5104', status: 'active' },
  { id: 'patrick-meyer', firstName: 'Patrick', lastName: 'Meyer', licenseNumber: 'MDU 26 5109', status: 'active' },
  { id: 'fritz-mueller', firstName: 'Fritz', lastName: 'Müller', licenseNumber: 'MDU 26 5106', status: 'active' },
  { id: 'beatrix-paintner-tuite', firstName: 'Beatrix', lastName: 'Paintner-tuite', licenseNumber: 'MDU 26 5103', status: 'active' },
  { id: 'nebojsa-bole-petrovic', firstName: 'Nebojsa Bole', lastName: 'Petrovic', licenseNumber: 'MDU 26 4004', status: 'active' },
  // MASSL GHABT
  { id: 'michael-doerner', firstName: 'Michael', lastName: 'Dörner', licenseNumber: 'MDU 26 7321', status: 'active' },
  { id: 'peter-duerrbeck', firstName: 'Peter', lastName: 'Dürrbeck', licenseNumber: 'MDU 26 7301', status: 'active' },
  { id: 'florian-erhard', firstName: 'Florian', lastName: 'Erhard', licenseNumber: 'MDU 26 7306', status: 'active' },
  { id: 'markus-kniehl', firstName: 'Markus', lastName: 'Kniehl', licenseNumber: 'MDU 26 7305', status: 'active' }, // TC
  { id: 'erdal-memet', firstName: 'Erdal', lastName: 'Memet', licenseNumber: 'MDU 26 7313', status: 'active' },
  { id: 'oliver-pabel', firstName: 'Oliver', lastName: 'Pabel', licenseNumber: 'MDU 26 7307', status: 'active' },
  { id: 'ioannis-pechlivanidis', firstName: 'Ioannis', lastName: 'Pechlivanidis', licenseNumber: 'MDU 26 7311', status: 'active' },
  { id: 'ely-reiter', firstName: 'Ely', lastName: 'Reiter', licenseNumber: 'MDU 26 7302', status: 'active' },
  { id: 'josef-stahl', firstName: 'Josef', lastName: 'Stahl', licenseNumber: 'MDU 26 7314', status: 'active' },
  { id: 'franz-thoma', firstName: 'Franz', lastName: 'Thoma', licenseNumber: 'MDU 26 7309', status: 'active' },
  { id: 'mirek-wasi-watzlawek', firstName: 'Mirek “wasi“', lastName: 'Watzlawek', licenseNumber: 'MDU 26 7320', status: 'active' },
  { id: 'damaris-wilcox', firstName: 'Damaris', lastName: 'Wilcox', licenseNumber: 'MDU 26 7303', status: 'active' },
  { id: 'denise-wudtke-kniehl', firstName: 'Denise', lastName: 'Wudtke Kniehl', licenseNumber: 'MDU 26 7304', status: 'active' },

  // ── B2 LIGA ─────────────────────────────────────────────
  // BELFORT EVOLUTION
  { id: 'marcellino-berg', firstName: 'Marcellino', lastName: 'Berg', licenseNumber: 'MDU 26 1108', status: 'active' },
  { id: 'georg-bleicher', firstName: 'Georg', lastName: 'Bleicher', licenseNumber: 'MDU 26 1105', status: 'active' },
  { id: 'manuela-dinkel', firstName: 'Manuela', lastName: 'Dinkel', licenseNumber: 'MDU 26 1102', status: 'active' },
  { id: 'edith-jaeger', firstName: 'Edith', lastName: 'Jäger', licenseNumber: 'MDU 26 1111', status: 'active' },
  { id: 'manfred-kling', firstName: 'Manfred', lastName: 'Kling', licenseNumber: 'MDU 26 1109', status: 'active' },
  { id: 'christine-pluta', firstName: 'Christine', lastName: 'Pluta', licenseNumber: 'MDU 26 1103', status: 'active' },
  { id: 'dominik-poppe', firstName: 'Dominik', lastName: 'Poppe', licenseNumber: 'MDU 26 1107', status: 'active' },
  { id: 'dietmar-poppe', firstName: 'Dietmar', lastName: 'Poppe', licenseNumber: 'MDU 26 1101', status: 'active' }, // TC
  { id: 'daniel-richter', firstName: 'Daniel', lastName: 'Richter', licenseNumber: 'MDU 26 1106', status: 'active' },
  { id: 'heinz-roggan', firstName: 'Heinz', lastName: 'Roggan', licenseNumber: 'MDU 26 1104', status: 'active' },
  { id: 'walter-steckermeier', firstName: 'Walter', lastName: 'Steckermeier', licenseNumber: 'MDU 26 1110', status: 'active' },
  // FIAKER DEIFE
  { id: 'sven-albrecht', firstName: 'Sven', lastName: 'Albrecht', licenseNumber: 'MDU 26 4909', status: 'active' },
  { id: 'bernhard-hoffmann', firstName: 'Bernhard', lastName: 'Hoffmann', licenseNumber: 'MDU 26 4905', status: 'active' },
  { id: 'tamara-karnoll', firstName: 'Tamara', lastName: 'Karnoll', licenseNumber: 'MDU 26 4902', status: 'active' },
  { id: 'markus-kirschner', firstName: 'Markus', lastName: 'Kirschner', licenseNumber: 'MDU 26 4907', status: 'active' },
  { id: 'timo-lewerenz', firstName: 'Timo', lastName: 'Lewerenz', licenseNumber: 'MDU 26 4911', status: 'active' },
  { id: 'christian-matejka', firstName: 'Christian', lastName: 'Matejka', licenseNumber: 'MDU 26 4901', status: 'active' }, // TC
  { id: 'christian-otto', firstName: 'Christian', lastName: 'Otto', licenseNumber: 'MDU 26 4906', status: 'active' },
  { id: 'annika-pfaffenzeller', firstName: 'Annika', lastName: 'Pfaffenzeller', licenseNumber: 'MDU 26 4912', status: 'active' },
  { id: 'yves-scherer', firstName: 'Yves', lastName: 'Scherer', licenseNumber: 'MDU 26 4904', status: 'active' },
  { id: 'dani-schmidhammer', firstName: 'Dani', lastName: 'Schmidhammer', licenseNumber: 'MDU 26 4910', status: 'active' },
  { id: 'joerg-schmidt', firstName: 'Jörg', lastName: 'Schmidt', licenseNumber: 'MDU 26 4903', status: 'active' },
  { id: 'michael-schreil', firstName: 'Michael', lastName: 'Schreil', licenseNumber: 'MDU 26 4908', status: 'active' },
  // FREIBAD BAZIS
  { id: 'moritz-becker', firstName: 'Moritz', lastName: 'Becker', licenseNumber: 'MDU 26 5903', status: 'active' },
  { id: 'brendan-koeniger', firstName: 'Brendan', lastName: 'Königer', licenseNumber: 'MDU 26 5911', status: 'active' },
  { id: 'christian-kuntscher', firstName: 'Christian', lastName: 'Kuntscher', licenseNumber: 'MDU 26 5907', status: 'active' },
  { id: 'matthias-mayring', firstName: 'Matthias', lastName: 'Mayring', licenseNumber: 'MDU 26 5904', status: 'active' },
  { id: 'denis-nokic', firstName: 'Denis', lastName: 'Nokic', licenseNumber: 'MDU 26 5913', status: 'active' },
  { id: 'christoph-preiss', firstName: 'Christoph', lastName: 'Preiss', licenseNumber: 'MDU 26 5909', status: 'active' },
  { id: 'manuel-rauch', firstName: 'Manuel', lastName: 'Rauch', licenseNumber: 'MDU 26 5905', status: 'active' },
  { id: 'sebastian-rogge', firstName: 'Sebastian', lastName: 'Rogge', licenseNumber: 'MDU 26 5906', status: 'active' },
  { id: 'andreas-strehle', firstName: 'Andreas', lastName: 'Strehle', licenseNumber: 'MDU 26 5901', status: 'active' }, // TC
  { id: 'julia-strehle', firstName: 'Julia', lastName: 'Strehle', licenseNumber: 'MDU 26 5902', status: 'active' },
  { id: 'andreas-walter', firstName: 'Andreas', lastName: 'Walter', licenseNumber: 'MDU 26 5910', status: 'active' },
  { id: 'tim-weber', firstName: 'Tim', lastName: 'Weber', licenseNumber: 'MDU 26 5908', status: 'active' },
  // TEAM DESASTER
  { id: 'florian-dospil', firstName: 'Florian', lastName: 'Dospil', licenseNumber: 'MDU 26 5706', status: 'active' },
  { id: 'stefan-fischer', firstName: 'Stefan', lastName: 'Fischer', licenseNumber: 'MDU 26 5701', status: 'active' }, // TC
  { id: 'helmut-folie', firstName: 'Helmut', lastName: 'Folie', licenseNumber: 'MDU 26 5703', status: 'active' },
  { id: 'reiner-heckmann', firstName: 'Reiner', lastName: 'Heckmann', licenseNumber: 'MDU 26 5712', status: 'active' },
  { id: 'markus-hiermann', firstName: 'Markus', lastName: 'Hiermann', licenseNumber: 'MDU 26 5710', status: 'active' },
  { id: 'mario-krauss', firstName: 'Mario', lastName: 'Krauss', licenseNumber: 'MDU 14487', status: 'active' },
  { id: 'uli-kurz', firstName: 'Uli', lastName: 'Kurz', licenseNumber: 'MDU 26 5704', status: 'active' },
  { id: 'markus-kurz', firstName: 'Markus', lastName: 'Kurz', licenseNumber: 'MDU 26 5705', status: 'active' },
  { id: 'anita-lux', firstName: 'Anita', lastName: 'Lux', licenseNumber: 'MDU 26 5711', status: 'active' },
  { id: 'benjamin-schuy', firstName: 'Benjamin', lastName: 'Schuy', licenseNumber: 'MDU 26 5709', status: 'active' },
  { id: 'stephan-soos', firstName: 'Stephan', lastName: 'Soos', licenseNumber: 'MDU 26 5708', status: 'active' },
  { id: 'tamara-weinberger', firstName: 'Tamara', lastName: 'Weinberger', licenseNumber: 'MDU 26 5702', status: 'active' },
  // DC DARK ANGELS
  { id: 'sabine-eberl', firstName: 'Sabine', lastName: 'Eberl', licenseNumber: 'MDU 26 8502', status: 'active' },
  { id: 'franz-eberl', firstName: 'Franz', lastName: 'Eberl', licenseNumber: 'MDU 26 8501', status: 'active' }, // TC
  { id: 'justin-marco-eberl', firstName: 'Justin - Marco', lastName: 'Eberl', licenseNumber: 'MDU 26 8503', status: 'active' },
  { id: 'robert-walter', firstName: 'Robert', lastName: 'Walter', licenseNumber: 'MDU 26 8504', status: 'active' },
  { id: 'karin-walter', firstName: 'Karin', lastName: 'Walter', licenseNumber: 'MDU 26 8505', status: 'active' },
  // DE VOGELWUID'N
  { id: 'armin-abraham', firstName: 'Armin', lastName: 'Abraham', licenseNumber: 'MDU 26 3911', status: 'active' },
  { id: 'petra-bachmair', firstName: 'Petra', lastName: 'Bachmair', licenseNumber: 'MDU 26 3902', status: 'active' },
  { id: 'sylwester-gnatowski', firstName: 'Sylwester', lastName: 'Gnatowski', licenseNumber: 'MDU 26 3904', status: 'active' },
  { id: 'daniel-leitze', firstName: 'Daniel', lastName: 'Leitze', licenseNumber: 'MDU 26 3910', status: 'active' },
  { id: 'steve-lewik', firstName: 'Steve', lastName: 'Lewik', licenseNumber: 'MDU 26 3907', status: 'active' },
  { id: 'martin-marcinko', firstName: 'Martin', lastName: 'Marcinko', licenseNumber: 'MDU 26 3908', status: 'active' },
  { id: 'karin-oellerer', firstName: 'Karin', lastName: 'Oellerer', licenseNumber: 'MDU 26 3903', status: 'active' },
  { id: 'petra-rohr', firstName: 'Petra', lastName: 'Rohr', licenseNumber: 'MDU 26 3905', status: 'active' },
  { id: 'horst-saenger', firstName: 'Horst', lastName: 'Sänger', licenseNumber: 'MDU 26 3901', status: 'active' }, // TC
  { id: 'ralf-schweitzer', firstName: 'Ralf', lastName: 'Schweitzer', licenseNumber: 'MDU 26 3906', status: 'active' },
  { id: 'pawel-szymanski', firstName: 'Pawel', lastName: 'Szymanski', licenseNumber: 'MDU 26 3909', status: 'active' },

  // ── C LIGA ─────────────────────────────────────────────
  // WILD INDIANS
  { id: 'juergen-baumstark', firstName: 'Jürgen', lastName: 'Baumstark', licenseNumber: 'MDU 26 8112', status: 'active' },
  { id: 'reinhold-behrend', firstName: 'Reinhold', lastName: 'Behrend', licenseNumber: 'MDU 26 8113', status: 'active' },
  { id: 'stephan-brunner', firstName: 'Stephan', lastName: 'Brunner', licenseNumber: 'MDU 26 8105', status: 'active' },
  { id: 'gisi-cornelius', firstName: 'Gisi', lastName: 'Cornelius', licenseNumber: 'MDU 26 8101', status: 'active' },
  { id: 'franz-cornelius', firstName: 'Franz', lastName: 'Cornelius', licenseNumber: 'MDU 26 8102', status: 'active' },
  { id: 'peter-keil', firstName: 'Peter', lastName: 'Keil', licenseNumber: 'MDU 26 8107', status: 'active' },
  { id: 'marion-koehler', firstName: 'Marion', lastName: 'Köhler', licenseNumber: 'MDU 26 8103', status: 'active' },
  { id: 'monika-maier', firstName: 'Monika', lastName: 'Maier', licenseNumber: 'MDU 26 8106', status: 'active' },
  { id: 'linda-maier', firstName: 'Linda', lastName: 'Maier', licenseNumber: 'MDU 26 8109', status: 'active' },
  { id: 'nik-preis', firstName: 'Nik', lastName: 'Preis', licenseNumber: 'MDU 26 8110', status: 'active' },
  { id: 'eike-schuster', firstName: 'Eike', lastName: 'Schuster', licenseNumber: 'MDU 26 8114', status: 'active' },
  { id: 'markus-steyer', firstName: 'Markus', lastName: 'Steyer', licenseNumber: 'MDU 26 8104', status: 'active' }, // TC
  { id: 'roman-treichel', firstName: 'Roman', lastName: 'Treichel', licenseNumber: 'MDU 26 8108', status: 'active' },
  { id: 'claudia-vaszi', firstName: 'Claudia', lastName: 'Vaszi', licenseNumber: 'MDU 26 8115', status: 'active' },
  // MÜNCHEN 08/15
  { id: 'michael-gross', firstName: 'Michael', lastName: 'Gross', licenseNumber: 'MDU 26 6309', status: 'active' },
  { id: 'andreas-kirschbauer', firstName: 'Andreas', lastName: 'Kirschbauer', licenseNumber: 'MDU 26 6305', status: 'active' },
  { id: 'waltraud-kranabetter', firstName: 'Waltraud', lastName: 'Kranabetter', licenseNumber: 'MDU 26 6303', status: 'active' },
  { id: 'herbert-kranabetter', firstName: 'Herbert', lastName: 'Kranabetter', licenseNumber: 'MDU 26 6304', status: 'active' },
  { id: 'erwin-listl', firstName: 'Erwin', lastName: 'Listl', licenseNumber: 'MDU 26 6306', status: 'active' },
  { id: 'brane-sikimic', firstName: 'Brane', lastName: 'Sikimic', licenseNumber: 'MDU 26 6307', status: 'active' },
  { id: 'robert-stelzig', firstName: 'Robert', lastName: 'Stelzig', licenseNumber: 'MDU 26 6308', status: 'active' },
  { id: 'kostas-tsopanoglou', firstName: 'Kostas', lastName: 'Tsopanoglou', licenseNumber: 'MDU 26 6302', status: 'active' },
  { id: 'lukasz-wiacek', firstName: 'Lukasz', lastName: 'Wiacek', licenseNumber: 'MDU 26 6301', status: 'active' }, // TC
  // LUCKY DARTS TWO
  { id: 'johanna-attenberger', firstName: 'Johanna', lastName: 'Attenberger', licenseNumber: 'MDU 26 8904', status: 'active' },
  { id: 'stefanie-attenberger', firstName: 'Stefanie', lastName: 'Attenberger', licenseNumber: 'MDU 26 8902', status: 'active' },
  { id: 'susanne-bauer', firstName: 'Susanne', lastName: 'Bauer', licenseNumber: 'MDU 26 8901', status: 'active' }, // TC
  { id: 'lea-bauer', firstName: 'Lea', lastName: 'Bauer', licenseNumber: 'MDU 26 8903', status: 'active' },
  { id: 'benjamin-bauer', firstName: 'Benjamin', lastName: 'Bauer', licenseNumber: 'MDU 26 8907', status: 'active' },
  { id: 'michaela-exner', firstName: 'Michaela', lastName: 'Exner', licenseNumber: 'MDU 26 8906', status: 'active' },
  { id: 'fabian-mahr', firstName: 'Fabian', lastName: 'Mahr', licenseNumber: 'MDU 26 8908', status: 'active' },
  { id: 'jessica-von-mahren', firstName: 'Jessica', lastName: 'von Mahren', licenseNumber: 'MDU 26 8905', status: 'active' },
  // FUNNY DARTERS MUNICH
  { id: 'despina-assimenidu', firstName: 'Despina', lastName: 'Assimenidu', licenseNumber: 'MDU 26 6504', status: 'active' },
  { id: 'joerg-hirschfeld', firstName: 'Jörg', lastName: 'Hirschfeld', licenseNumber: 'MDU 26 6508', status: 'active' },
  { id: 'marcus-kampmann', firstName: 'Marcus', lastName: 'Kampmann', licenseNumber: 'MDU 26 6501', status: 'active' }, // TC
  { id: 'athanasios-karagkiozdis', firstName: 'Athanasios', lastName: 'Karagkiozdis', licenseNumber: 'MDU 26 6507', status: 'active' },
  { id: 'panos-moraitis', firstName: 'Panos', lastName: 'Moraitis', licenseNumber: 'MDU 26 6505', status: 'active' },
  { id: 'vassilios-papadopoulos', firstName: 'Vassilios', lastName: 'Papadopoulos', licenseNumber: 'MDU 26 6509', status: 'active' },
  { id: 'dimitrios-papadopoulos', firstName: 'Dimitrios', lastName: 'Papadopoulos', licenseNumber: 'MDU 26 6506', status: 'active' },
  { id: 'michael-sigl', firstName: 'Michael', lastName: 'Sigl', licenseNumber: 'MDU 26 6502', status: 'active' },
  { id: 'iordanis-tertioglou', firstName: 'Iordanis', lastName: 'Tertioglou', licenseNumber: 'MDU 26 6503', status: 'active' },
  { id: 'iannis-tertiroglou', firstName: 'Iannis', lastName: 'Tertiroglou', licenseNumber: 'MDU 26 6510', status: 'active' },
  // BLACK DEVILS
  { id: 'michael-berger', firstName: 'Michael', lastName: 'Berger', licenseNumber: 'MDU 26 9001', status: 'active' },
  { id: 'alexandra-brunner', firstName: 'Alexandra', lastName: 'Brunner', licenseNumber: 'MDU 26 9005', status: 'active' },
  { id: 'mita-burdulea', firstName: 'Mita', lastName: 'Burdulea', licenseNumber: 'MDU 26 9007', status: 'active' },
  { id: 'karsten-dassler', firstName: 'Karsten', lastName: 'Dassler', licenseNumber: 'MDU 26 9003', status: 'active' },
  { id: 'patricia-duesing', firstName: 'Patricia', lastName: 'Duesing', licenseNumber: 'MDU 26 9011', status: 'active' },
  { id: 'daniel-foerster', firstName: 'Daniel', lastName: 'Förster', licenseNumber: 'MDU 26 9002', status: 'active' },
  { id: 'torsten-gruner', firstName: 'Torsten', lastName: 'Gruner', licenseNumber: 'MDU 26 9004', status: 'active' },
  { id: 'maria-hofner', firstName: 'Maria', lastName: 'Hofner', licenseNumber: 'MDU 26 9006', status: 'active' },
  { id: 'martina-kabilka', firstName: 'Martina', lastName: 'Kabilka', licenseNumber: 'MDU 26 9008', status: 'active' },
  { id: 'petra-roedl', firstName: 'Petra', lastName: 'Rödl', licenseNumber: 'MDU 26 9010', status: 'active' }, // TC
  { id: 'christoph-weinberger', firstName: 'Christoph', lastName: 'Weinberger', licenseNumber: 'MDU 26 9009', status: 'active' },
  // 5 STERNE BOAZN TEAM
  { id: 'stefan-bayer', firstName: 'Stefan', lastName: 'Bayer', licenseNumber: 'MDU 26 2907', status: 'active' },
  { id: 'sebastian-kadjurek', firstName: 'Sebastian', lastName: 'Kadjurek', licenseNumber: 'MDU 26 2903', status: 'active' },
  { id: 'erwin-kammergruber', firstName: 'Erwin', lastName: 'Kammergruber', licenseNumber: 'MDU 26 2908', status: 'active' },
  { id: 'peter-kerklau', firstName: 'Peter', lastName: 'Kerklau', licenseNumber: 'MDU 26 2912', status: 'active' },
  { id: 'georgi-ketiashvili', firstName: 'Georgi', lastName: 'Ketiashvili', licenseNumber: 'MDU 26 2905', status: 'active' },
  { id: 'rebecca-kranabetter', firstName: 'Rebecca', lastName: 'Kranabetter', licenseNumber: 'MDU 26 2902', status: 'active' },
  { id: 'stefan-kugler', firstName: 'Stefan', lastName: 'Kugler', licenseNumber: 'MDU 26 2910', status: 'active' },
  { id: 'jutta-lachner', firstName: 'Jutta', lastName: 'Lachner', licenseNumber: 'MDU 26 2901', status: 'active' }, // TC
  { id: 'alexander-lachner', firstName: 'Alexander', lastName: 'Lachner', licenseNumber: 'MDU 26 2909', status: 'active' },
  { id: 'domenik-nachtmann', firstName: 'Domenik', lastName: 'Nachtmann', licenseNumber: 'MDU 26 2911', status: 'active' },
  { id: 'wolfgang-rettke', firstName: 'Wolfgang', lastName: 'Rettke', licenseNumber: 'MDU 26 2904', status: 'active' },
  { id: 'christian-schmidt', firstName: 'Christian', lastName: 'Schmidt', licenseNumber: 'MDU 26 2906', status: 'active' },
  { id: 'stefan-veitinger', firstName: 'Stefan', lastName: 'Veitinger', licenseNumber: 'MDU 26 2913', status: 'active' },
];

/** Returns a player by id, or undefined. */
export function findPlayer(id: string): Player | undefined {
  return PLAYERS.find(p => p.id === id);
}

/**
 * Returns the display name for a player.
 * Uses player.displayName if set, otherwise "firstName lastName".
 */
export function getPlayerDisplayName(player: Player): string {
  return player.displayName ?? `${player.firstName} ${player.lastName}`.trim();
}
