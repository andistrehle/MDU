import { describe, expect, it } from 'vitest';
import { alleGespielt, aufstellungFertig, erlaubteSlots, leereSpiele, leereSpieler, legsSetzen, slotSetzen } from './kiosk';

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
