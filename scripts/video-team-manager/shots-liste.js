// Shot-Liste fürs Promo-Video: [name, URL-Parameter der Demo-Seite, Aktion vor dem Bild]
// Jeder Shot wird in zwei Größen gemacht (web 1440×900, handy 390×844).

// Fenster so scrollen, dass das Element mit dem Text oben (mit Abstand) steht.
const zu = (text, abstand = 90, sel = 'h1,h2,h3,div,span,summary,button,label') => async p => {
  await p.evaluate(([t, a, s]) => {
    const el = [...document.querySelectorAll(s)].find(e => e.textContent.trim().startsWith(t) && e.children.length < 6);
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - a);
  }, [text, abstand, sel]);
  await p.waitForTimeout(400);
};
const klick = (sel) => async p => { await p.locator(sel).first().click(); await p.waitForTimeout(500); };
const folge = (...f) => async (p, g) => { for (const x of f) await x(p, g); };

module.exports = [
  // Szene 3: Dashboard, die Scheibe füllt sich
  ['dash-n2', 's=dash&n=2'],
  ['dash-n5', 's=dash&n=5'],
  ['dash-n9', 's=dash&n=9'],
  // Szene 4: Zusagen ein Tipp, Absagen mit Grund
  ['dash-ja', 's=dash&n=9', klick('button[aria-label="Dabei"]')],
  ['dash-grund', 's=dash&n=9', folge(klick('button[aria-label="Absage"]'), async p => {
    const f = p.locator('textarea').first(); await f.fill('bin im Urlaub'); await p.waitForTimeout(300);
  })],
  // Szene 5: Teilnehmerliste, TC trägt für andere ein
  ['spiel-kader', 's=spiel&n=6', zu('Teilnehmerliste', 70, 'h2')],
  ['spiel-kader-tc', 's=spiel&n=6', folge(zu('Teilnehmerliste', 70, 'h2'), klick('button[aria-label="Vroni Triple: zugesagt"]'))],
  // Szene 6: Wer fehlt noch? + Glocke
  ['spiel-offen', 's=spiel&n=5', async (p, g) => {
    const b = p.locator('button[aria-label^="noch offen"]').first();
    if (g === 'handy') await b.click(); else await b.hover();
    await p.waitForTimeout(500);
  }],
  ['glocke', 's=spiel&n=5', async p => { await p.evaluate(() => [...document.querySelectorAll('.demo-glocke button')].find(b => b.offsetParent !== null).click()); await p.waitForTimeout(800); }],
  // Szene 7: Aufstellung aus den Zusagen → Spielbericht
  ['spiel-aufstellung', 's=spiel&n=10', zu('Aufstellung', 70, 'h2')],
  ['bericht-leer', 's=bericht', zu('Aufstellung (H1', 30)],
  ['bericht-voll', 's=bericht&voll=1'],
  // Szene 7b: Spielseite mit Zeitleiste, Notiz, Aufgabe; Tims Glocke
  ['spiel-kopf', 's=spiel&n=10'],
  ['spiel-notiz', 's=spiel&n=10', zu('Notiz', 70, 'h2')],
  ['glocke-tim', 's=spiel&n=10&tim=1', async p => { await p.evaluate(() => [...document.querySelectorAll('.demo-glocke button')].find(b => b.offsetParent !== null).click()); await p.waitForTimeout(800); }],
  // Szene 8: Teamkasse
  ['kasse-spieler', 's=kasse'],
  ['kasse-strafe', 's=kasse&formular=strafe&vorwahl=p7', klick('button:has-text("Captain beleidigt")')],
  ['kasse-beitraege', 's=kasse&reiter=beitraege', zu('Mein Bereich', 0)],
  ['kasse-offen', 's=kasse&reiter=offen&wahl=b11,b12,b13,b14'],
  ['kasse-buch', 's=kasse&reiter=buch'],
  ['kasse-katalog', 's=kasse&reiter=katalog'],
  ['kasse-wart', 's=kasse&einst=1', zu('Einstellungen der Kasse', 120)],
  // Szene 9: Gegneranalyse
  ['gegner', 's=gegner'],
  ['gegner-top', 's=gegner', zu('Top 5', 90)],
  // Szene 10: Termine, Import, Kalender-Abo
  ['termine', 's=termine', zu('Weitere Termine', 380, 'h2')],
  ['termine-import', 's=termine&neu=import', async p => {
    await p.locator('textarea[aria-label="Termine einfügen"]').fill(
      'Datum\tBeginn\tGegner\tHeim/Auswärts\tOrt\n06.11.2026\t19:30\tDartfreunde Nord\tA\tSportheim Nord\n20.11.2026\t19:30\tSteel City\tH\tZum Goldenen Pfeil\n04.12.2026\t19:30\tFlight Club\tA\tClubheim\n18.12.2026\t19:30\tCheckout Crew\tH\tZum Goldenen Pfeil');
    await p.waitForTimeout(600);
    await zu('Termine einfügen', 60, 'label,div,span')(p);
  }],
  ['kalender', 's=kalender'],
  // Szene 11: Statistik
  ['stat', 's=dash&n=9', zu('Statistik', 80, 'h2,h3,div,span')],
  ['stat-gespielt', 's=dash&n=9', folge(zu('Statistik', 80, 'h2,h3,div,span'), klick('button:text-is("Gespielt")'))],
  // Szene 12: Spiel teilen
  ['spiel-teilen', 's=spiel&n=10', zu('Spiel teilen', 360, 'button')],
  // Szene 14/15: Angebot
  ['premium', 's=premium'],
  ['premium-preis', 's=premium', zu('Preis fürs ganze Team', 80)],
  // Push (27.10.2026): Offene erinnern, Termin mit „Team benachrichtigen“, Nachricht ans Team, Push-Abfrage
  ['spiel-erinnern', 's=spiel&n=7', zu('Spiel teilen', 300, 'button')],
  ['termin-neu', 's=termine&neu=eintragen', async p => {
    await p.locator('button[role="radio"]:has-text("Sonstiges")').first().click();
    await p.locator('input[placeholder^="z. B. Training"]').first().fill('Training');
    await p.locator('input[type="date"]').first().fill('2026-11-03');
    await p.locator('input[type="time"]').first().fill('19:00');
    await p.evaluate(() => document.activeElement?.blur?.());
    await p.waitForTimeout(300);
    await zu('Team benachrichtigen', 520, 'strong')(p);
  }],
  ['nachricht', 's=dash&n=9', async p => {
    await p.locator('textarea[placeholder^="z. B. Heute Treffen"]').first().fill('Heute Treffen schon um 19 Uhr!');
    await zu('Nachricht ans Team', 160, 'h2')(p);
  }],
  ['push-frage', 's=dash&n=9&push=1'],
];
