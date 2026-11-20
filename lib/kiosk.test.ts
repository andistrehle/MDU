import { describe, expect, it } from 'vitest';
import {
  absendeFehler, alleGespielt, aufstellungFertig, codeNormal, erlaubteSlots, heimspielAm, kioskErlaubt, leereSpiele, leereSpieler, legsSetzen,
  naechstesHeimspiel, pruefeStand, slotSetzen, spielAm, type KioskStand,
} from './kiosk';

const mit = (side: 'home' | 'guest', namen: Record<number, string>) =>
  leereSpieler(side).map(p => ({ ...p, name: namen[p.slot] ?? '' }));

describe('Kiosk-Regeln', () => {
  it('18 Spiele, Doppel an 9 und 18, Einzel mit Plan-Positionen', () => {
    const g = leereSpiele();
    expect(g).toHaveLength(18);
    expect(g.filter(x => x.game_type === 'double').map(x => x.game_no)).toEqual([9, 18]);
    // Spiel 5 laut Bogen: H1 gegen G2
    expect(g[4]).toMatchObject({ home_slot: 1, guest_slot: 2 });
  });

  it('Ergebnis setzen und wieder leeren', () => {
    let g = legsSetzen(leereSpiele(), 3, '2:1');
    expect(g[2]).toMatchObject({ legs_home: 2, legs_guest: 1 });
    g = legsSetzen(g, 3, '');
    expect(g[2]).toMatchObject({ legs_home: null, legs_guest: null });
  });

  it('Wechsel gilt für die folgenden offenen Einzel derselben Position, nicht für fertige', () => {
    // H1 spielt die Spiele 1, 5, 10, 14. Spiel 1 ist fertig, H5 kommt in Spiel 5.
    let g = legsSetzen(leereSpiele(), 1, '2:0');
    g = slotSetzen(g, 5, 'home_slot', 5);
    expect([1, 5, 10, 14].map(n => g.find(x => x.game_no === n)!.home_slot)).toEqual([1, 5, 5, 5]);
    // andere Positionen bleiben
    expect(g.find(x => x.game_no === 6)!.home_slot).toBe(2);
  });

  it('Ersatzspieler ist nach dem ersten Einsatz an seine Position gebunden', () => {
    const heim = mit('home', { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F' });
    let g = leereSpiele();
    // vorher: an Position 2 (Spiel 2) dürfen der Stammspieler 2 und beide Ersatzspieler
    expect(erlaubteSlots(g, heim, 2, 'home_slot')).toEqual([2, 5, 6]);
    g = slotSetzen(g, 1, 'home_slot', 5); // E spielt an Position 1
    expect(erlaubteSlots(g, heim, 2, 'home_slot')).toEqual([2, 6]);
    expect(erlaubteSlots(g, heim, 5, 'home_slot')).toEqual([1, 5, 6]);
  });

  it('Doppel: nicht der Partner und niemand aus dem anderen Doppel', () => {
    const heim = mit('home', { 1: 'A', 2: 'B', 3: 'C', 4: 'D' });
    let g = slotSetzen(leereSpiele(), 9, 'home_slot', 1);
    g = slotSetzen(g, 9, 'home_slot2', 2);
    expect(erlaubteSlots(g, heim, 9, 'home_slot2')).toEqual([2, 3, 4]);
    expect(erlaubteSlots(g, heim, 18, 'home_slot')).toEqual([3, 4]);
  });

  it('Anpfiff erst mit vier Stammspielern je Seite; fertig erst mit 18 Ergebnissen', () => {
    const voll = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' };
    expect(aufstellungFertig(mit('home', voll), mit('guest', { 1: 'A', 2: 'B', 3: 'C' }))).toBe(false);
    expect(aufstellungFertig(mit('home', voll), mit('guest', voll))).toBe(true);
    let g = leereSpiele();
    for (let n = 1; n <= 17; n++) g = legsSetzen(g, n, '2:0');
    expect(alleGespielt(g)).toBe(false);
    expect(alleGespielt(legsSetzen(g, 18, '0:2'))).toBe(true);
  });
});

describe('Kiosk — Echtbetrieb', () => {
  const plan = [
    { key: 'a|b', home: 'a', away: 'b', termin: { datum: '2026-11-20', uhrzeit: '20:00' } },
    { key: 'b|a', home: 'b', away: 'a', termin: { datum: '2026-11-27' } },
    { key: 'a|c', home: 'a', away: 'c', termin: { datum: '2026-12-11' } },
    { key: 'a|d', home: 'a', away: 'd', termin: null },
  ];

  it('zeigt nur das HEIMspiel des eigenen Teams am Tag — nie ein Auswärtsspiel, nie ein fremdes', () => {
    expect(heimspielAm(plan, 'a', '2026-11-20')?.key).toBe('a|b');
    expect(heimspielAm(plan, 'b', '2026-11-20')).toBeNull();   // b spielt an dem Tag auswärts
    expect(heimspielAm(plan, 'a', '2026-11-27')).toBeNull();   // a spielt an dem Tag auswärts
    expect(heimspielAm(plan, 'a', '2026-11-21')).toBeNull();
  });

  it('nächstes Heimspiel: das früheste NACH dem Tag, Spiele ohne Termin zählen nicht', () => {
    expect(naechstesHeimspiel(plan, 'a', '2026-11-20')?.key).toBe('a|c');
    expect(naechstesHeimspiel(plan, 'a', '2026-12-11')).toBeNull();
  });

  it('Auswärtsspiel nur mit Freigabe der Ligaleitung; ein Heimspiel geht vor', () => {
    expect(spielAm(plan, 'a', '2026-11-27')).toBeNull();                  // a spielt auswärts, keine Freigabe
    expect(spielAm(plan, 'a', '2026-11-27', true)?.key).toBe('b|a');      // mit Freigabe
    expect(spielAm(plan, 'a', '2026-11-20', true)?.key).toBe('a|b');      // Heimspiel bleibt Heimspiel
    expect(spielAm(plan, 'c', '2026-11-27', true)).toBeNull();            // fremdes Spiel nie
    expect(naechstesHeimspiel(plan, 'a', '2026-11-21', true)?.key).toBe('b|a');
    expect(naechstesHeimspiel(plan, 'a', '2026-11-21')?.key).toBe('a|c');
  });

  it('freigegeben sind zum Start nur die Bazis', () => {
    expect(kioskErlaubt('freibad-bazis')).toBe(true);
    expect(kioskErlaubt('irgendein-team')).toBe(false);
    expect(kioskErlaubt(null)).toBe(false);
  });

  it('Kopplungscode: acht Ziffern, Leerzeichen egal', () => {
    expect(codeNormal('1234 5678')).toBe('12345678');
    expect(codeNormal('1234567')).toBeNull();
    expect(codeNormal('1234567a')).toBeNull();
  });

  const namen = (n: number) => Array.from({ length: n }, (_, i) => ({ slot: i + 1, name: `Spieler ${i + 1}` }));
  const roh = () => ({ heim: namen(4), gast: namen(4), games: leereSpiele(), highlights: [] });

  it('nimmt einen sauberen Stand an und setzt die Spielart aus dem Bogen, nicht vom Gerät', () => {
    const r = roh();
    r.games[0] = { ...r.games[0], game_type: 'double', home_slot2: 3, legs_home: 2, legs_guest: 1 };
    const p = pruefeStand(r, 3);
    expect(p.fehler).toBeNull();
    expect(p.stand!.games[0]).toMatchObject({ game_type: 'single', home_slot2: null, legs_home: 2, legs_guest: 1 });
    expect(p.stand!.games).toHaveLength(18);
  });

  it('lehnt ab: Ergebnis, das es im Modus nicht gibt · Platz 9 · fehlendes Spiel · überlangen Namen · falsches Highlight', () => {
    const a = roh(); a.games[0] = { ...a.games[0], legs_home: 3, legs_guest: 0 };
    expect(pruefeStand(a, 3).stand).toBeNull();
    expect(pruefeStand(a, 5).stand).not.toBeNull();           // in der La Liga gibt es 3:0
    const b = roh(); b.games[1] = { ...b.games[1], home_slot: 9 };
    expect(pruefeStand(b, 3).stand).toBeNull();
    const c = roh(); c.games = c.games.slice(1);
    expect(pruefeStand(c, 3).stand).toBeNull();
    const d = roh(); d.heim[0].name = 'x'.repeat(61);
    expect(pruefeStand(d, 3).stand).toBeNull();
    const e = { ...roh(), highlights: [{ side: 'home', slot: 1, type: 'high_finish', value: 99 }] };
    expect(pruefeStand(e, 3).stand).toBeNull();
    expect(pruefeStand(null, 3).stand).toBeNull();
  });

  it('absenden erst, wenn alle 18 Spiele besetzt und gespielt sind', () => {
    let games = leereSpiele();
    for (let n = 1; n <= 18; n++) games = legsSetzen(games, n, '2:0');
    const stand: KioskStand = { heim: namen(4), gast: namen(4), games, highlights: [] };
    // Doppel 9 und 18 haben noch keine Spieler
    expect(absendeFehler(stand)).toMatch(/Spiel 9/);
    for (const n of [9, 18]) for (const [feld, slot] of [['home_slot', 1], ['home_slot2', 2], ['guest_slot', 1], ['guest_slot2', 2]] as const) {
      stand.games = slotSetzen(stand.games, n, feld, n === 9 ? slot : slot + 2);
    }
    expect(absendeFehler(stand)).toBeNull();
    expect(absendeFehler({ ...stand, games: legsSetzen(stand.games, 17, '') })).toMatch(/Spiel 17/);
    expect(absendeFehler({ ...stand, gast: namen(3) })).toMatch(/G4/);
  });
});
