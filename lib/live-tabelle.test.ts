import { describe, expect, it } from 'vitest';
import { liveTabelle, type HeuteBegegnung } from './live-tabelle';
import type { Ergebnis27 } from './tabelle-2027';

const erg = (home: string, away: string, sh: number, sa: number, lh: number, la: number): Ergebnis27 => ({
  key: `${home}|${away}`, home, away, spieleHome: sh, spieleAway: sa, legsHome: lh, legsAway: la,
  ptsHome: sh > sa ? 3 : sh === sa ? 1 : 0, ptsAway: sa > sh ? 3 : sh === sa ? 1 : 0,
  abzugHome: 0, abzugAway: 0, bestaetigt: true, wertung: null, datum: null, reportId: 'r',
});
const heute = (home: string, away: string, status: HeuteBegegnung['status'], sh: number, sg: number, lh: number, lg: number, ergebnis?: Ergebnis27): HeuteBegegnung =>
  ({ key: `${home}|${away}`, home, away, status, standHeim: sh, standGast: sg, legsHeim: lh, legsGast: lg, ergebnis });

const TEAMS = ['a', 'b', 'c', 'd'];
// Vorher: a 3 Pkt (10:8 gg. c), b 3 Pkt (12:6 gg. d) → b vor a (Spieldiff +6 vs +2), c 0 (−2), d 0 (−6)
const BASIS = [erg('a', 'c', 10, 8, 22, 18), erg('b', 'd', 12, 6, 26, 14)];

describe('Live-Tabelle', () => {
  it('Platz vor dem Abend ohne die heutigen Begegnungen', () => {
    const t = liveTabelle(TEAMS, BASIS, []);
    expect(t.map(z => [z.team, z.pos, z.vorher])).toEqual([['b', 1, 1], ['a', 2, 2], ['c', 3, 3], ['d', 4, 4]]);
  });

  it('laufendes Spiel zählt mit dem Zwischenstand, als wäre jetzt Schluss', () => {
    // heute d – a 5:3 (Legs 11:7) → d 3 Pkt, Spiele 6+5=11 : 12+3=15 → −4; a 3 Pkt, 13:13 → 0
    const t = liveTabelle(TEAMS, BASIS, [heute('d', 'a', 'live', 5, 3, 11, 7)]);
    // b 3 (+6), a 3 (0), d 3 (−4), c 0 (−2)
    expect(t.map(z => [z.team, z.pos, z.vorher])).toEqual([['b', 1, 1], ['a', 2, 2], ['d', 3, 4], ['c', 4, 3]]);
    expect(t.find(z => z.team === 'd')!.heute).toEqual({ gegner: 'a', eigene: 5, andere: 3, status: 'live' });
    expect(t.find(z => z.team === 'a')!.heute).toEqual({ gegner: 'd', eigene: 3, andere: 5, status: 'live' });
    expect(t.find(z => z.team === 'b')!.heute).toBeUndefined();
  });

  it('noch offene Begegnung zählt nicht, schon eingereichtes Ergebnis hat Vorrang vor dem Zwischenstand', () => {
    const offen = liveTabelle(TEAMS, BASIS, [heute('c', 'd', 'offen', 0, 0, 0, 0)]);
    expect(offen.map(z => z.pos)).toEqual([1, 2, 3, 4]);
    // c – d heute beendet und schon eingereicht 9:9 (Legs 20:20): zählt einmal, nicht doppelt
    const e = erg('c', 'd', 9, 9, 20, 20);
    const t = liveTabelle(TEAMS, [...BASIS, e], [heute('c', 'd', 'beendet', 9, 9, 20, 20, e)]);
    expect(t.find(z => z.team === 'c')!.sp).toBe(2);
    expect(t.find(z => z.team === 'c')!.pts).toBe(1);
    // Vorher (ohne heute): c und d noch mit 0 Punkten auf 3 und 4
    expect(t.find(z => z.team === 'c')!.vorher).toBe(3);
  });
});
