import { describe, expect, it } from 'vitest';
import { punkteSpiel, tippGueltig, moeglicheErgebnisse, punkteVorab, punkteBonus, rangliste, ausschnitt, spielplanLesen, type WmSpiel, type WmVorab } from './wm-tipp';

const spiel = (id: string, runde: WmSpiel['runde'], a: string, b: string, sa: number | null, sb: number | null, ziel = 3): WmSpiel =>
  ({ id, runde, nr: 1, beginn: null, spieler_a: a, spieler_b: b, ziel, sets_a: sa, sets_b: sb });
const vorab = (user_id: string, x: Partial<WmVorab> = {}): WmVorab =>
  ({ user_id, vf: [], hf: [], finale: [], weltmeister: null, n180: null, neun_darter: null, bester_deutscher: null, ...x });

describe('Spielpunkte', () => {
  const s = spiel('1', 'r1', 'A', 'B', 3, 1);
  it('genaues Ergebnis 5, richtiger Sieger 3, falsch 0', () => {
    expect(punkteSpiel({ sets_a: 3, sets_b: 1 }, s)).toBe(5);
    expect(punkteSpiel({ sets_a: 3, sets_b: 0 }, s)).toBe(3);
    expect(punkteSpiel({ sets_a: 3, sets_b: 2 }, s)).toBe(3);
    expect(punkteSpiel({ sets_a: 1, sets_b: 3 }, s)).toBe(0);
  });
  it('offenes Spiel gibt nichts', () => {
    expect(punkteSpiel({ sets_a: 3, sets_b: 1 }, spiel('2', 'r1', 'A', 'B', 2, 1))).toBe(0);
    expect(punkteSpiel({ sets_a: 3, sets_b: 1 }, spiel('3', 'r1', 'A', 'B', null, null))).toBe(0);
  });
  it('gültige Tipps und Knöpfe', () => {
    expect(tippGueltig(3, 2, 3)).toBe(true);
    expect(tippGueltig(3, 3, 3)).toBe(false);
    expect(tippGueltig(2, 1, 3)).toBe(false);
    expect(moeglicheErgebnisse(3)).toEqual([[3, 0], [3, 1], [3, 2], [2, 3], [1, 3], [0, 3]]);
  });
});

describe('Vorab und Bonus', () => {
  const plan = [
    spiel('v1', 'vf', 'Littler', 'Humphries', 5, 2, 5), spiel('v2', 'vf', 'Price', 'Clemens', 5, 4, 5),
    spiel('h1', 'hf', 'Littler', 'Price', 6, 3, 6),
    spiel('f', 'f', 'Littler', 'van Gerwen', 7, 4, 7),
  ];
  it('VF 3 je Treffer, HF 5, Finale 8, Weltmeister 15', () => {
    const v = vorab('u', { vf: ['Littler', 'Clemens', 'Aspinall'], hf: ['littler', 'Humphries'], finale: ['Littler', 'Price'], weltmeister: 'Littler' });
    // VF: Littler + Clemens = 2×3 = 6 · HF: Littler (Groß/klein egal) = 5 · Finale: Littler = 8 · WM 15 → 34
    expect(punkteVorab(v, plan)).toEqual({ vf: 6, hf: 5, finale: 8, weltmeister: 15, summe: 34 });
  });
  it('180er: nächster 10, Platz 2 und 3 je 5, gleicher Abstand = gleicher Platz', () => {
    const b = punkteBonus([vorab('a', { n180: 1000 }), vorab('b', { n180: 980 }), vorab('c', { n180: 1020 }), vorab('d', { n180: 900 }), vorab('e', { n180: 1100 })],
      { n180: 1000, neun_darter: true, bester_deutscher: 'Clemens' });
    // Abstände: a 0 · b 20 · c 20 · d 100 · e 100 → a Platz 1 (10), b/c Platz 2 (5), d/e Platz 4 (0)
    expect([...b].map(([k, v]) => [k, v.n180])).toEqual([['a', 10], ['b', 5], ['c', 5], ['d', 0], ['e', 0]]);
  });
  it('Neun-Darter und bester Deutscher je 5', () => {
    const b = punkteBonus([vorab('a', { neun_darter: true, bester_deutscher: 'clemens' }), vorab('b', { neun_darter: false })],
      { n180: null, neun_darter: true, bester_deutscher: 'Clemens' });
    expect(b.get('a')).toEqual({ n180: 0, neunDarter: 5, besterDeutscher: 5 });
    expect(b.get('b')).toEqual({ n180: 0, neunDarter: 0, besterDeutscher: 0 });
  });
});

describe('Rangliste', () => {
  const spiele = [spiel('1', 'r1', 'A', 'B', 3, 1), spiel('2', 'r1', 'C', 'D', 0, 3)];
  const leute = [
    { user_id: 'x', name: 'Xaver', teamId: 't1', liga: 'a' },
    { user_id: 'y', name: 'Yvonne', teamId: 't2', liga: 'a' },
    { user_id: 'z', name: 'Zenzi', teamId: 't1', liga: 'b1' },
  ];
  const tipps = [
    { user_id: 'x', spiel_id: '1', sets_a: 3, sets_b: 1 }, { user_id: 'x', spiel_id: '2', sets_a: 1, sets_b: 3 }, // 5 + 3 = 8
    { user_id: 'y', spiel_id: '1', sets_a: 3, sets_b: 0 }, { user_id: 'y', spiel_id: '2', sets_a: 0, sets_b: 3 }, // 3 + 5 = 8
    { user_id: 'z', spiel_id: '1', sets_a: 0, sets_b: 3 },                                                       // 0
  ];
  it('gleiche Punkte, gleiche Genaue, gleiche Sieger → geteilter Platz', () => {
    const r = rangliste(leute, spiele, tipps, [], { n180: null, neun_darter: null, bester_deutscher: null });
    expect(r.map(z => [z.name, z.punkte, z.platz])).toEqual([['Xaver', 8, 1], ['Yvonne', 8, 1], ['Zenzi', 0, 3]]);
  });
  it('Ausschnitt je Team vergibt die Plätze neu', () => {
    const r = rangliste(leute, spiele, tipps, [], { n180: null, neun_darter: null, bester_deutscher: null });
    expect(ausschnitt(r, z => z.teamId === 't1').map(z => [z.name, z.platz])).toEqual([['Xaver', 1], ['Zenzi', 2]]);
  });
  it('mehr genaue Ergebnisse gewinnt bei Punktgleichheit', () => {
    const t = [
      { user_id: 'x', spiel_id: '1', sets_a: 3, sets_b: 1 },                                                       // 5
      { user_id: 'y', spiel_id: '1', sets_a: 3, sets_b: 0 }, { user_id: 'y', spiel_id: '2', sets_a: 2, sets_b: 3 }, // 3 + 3 = 6
      { user_id: 'z', spiel_id: '1', sets_a: 3, sets_b: 2 }, { user_id: 'z', spiel_id: '2', sets_a: 1, sets_b: 3 }, // 3 + 3 = 6
    ];
    const r = rangliste(leute, spiele, t, [vorab('x', { neun_darter: true })], { n180: null, neun_darter: true, bester_deutscher: null });
    // x: 5 + 5 (Neun-Darter) = 10 · y 6 · z 6 (gleich in allem → geteilt)
    expect(r.map(z => [z.name, z.punkte, z.platz])).toEqual([['Xaver', 10, 1], ['Yvonne', 6, 2], ['Zenzi', 6, 2]]);
  });
});

describe('Spielplan einfügen', () => {
  it('liest Zeilen, Ziel nach Runde, zählt je Runde', () => {
    const { spiele, fehler } = spielplanLesen('# Kommentar\nr1; 11.12.2026 20:00; Luke Littler; Darius Labanauskas\nr1\t12.12.2026 13:00\tA\tB\t3\nvf; 01.01.2027 19:30; C; D');
    expect(fehler).toEqual([]);
    expect(spiele).toEqual([
      { runde: 'r1', nr: 1, beginn: '2026-12-11T20:00:00+01:00', spieler_a: 'Luke Littler', spieler_b: 'Darius Labanauskas', ziel: 3 },
      { runde: 'r1', nr: 2, beginn: '2026-12-12T13:00:00+01:00', spieler_a: 'A', spieler_b: 'B', ziel: 3 },
      { runde: 'vf', nr: 1, beginn: '2027-01-01T19:30:00+01:00', spieler_a: 'C', spieler_b: 'D', ziel: 5 },
    ]);
  });
  it('meldet Fehler mit Zeilennummer', () => {
    const { fehler } = spielplanLesen('xx; 11.12.2026; A; B\nr1; 11/12/2026; A; B\nr1; 11.12.2026; A');
    expect(fehler).toHaveLength(3);
    expect(fehler[0]).toMatch(/^Zeile 1/);
  });
});
