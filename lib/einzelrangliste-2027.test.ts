// Tests: Einzelrangliste 2026/27 (lib/einzelrangliste-2027.ts)
// Erwartete Werte aus den bestätigten Regeln (10.11.2026), von Hand gerechnet:
//   Nur Einzel: 2:0 = 3 · 2:1 = 2 · 1:2 = 1 · 0:2 = 0; Best of 5: 3:0 = 5 … 0:3 = 0 — Spielbedingungen Ziffer 10.1/10.2
//   Reihenfolge Punkte → Legdifferenz → mehr Siege, sonst geteilter Platz
//   Team/Liga = Team des letzten Einsatzes; derselbe Mensch bleibt EINE Zeile — auch ohne Profil (Betreiber: „Fehler“)
//   Highlight-Punkte 180/171 je 3 · HF 100–129/130–159/160+ = 2/3/4 · SL ≤12/13–15/16–20 = 4/3/2
// Nur erfundene Daten, kein Datenbank- oder Netzzugriff.

import { describe, expect, it } from 'vitest';
import { berechneEinzel, highlightPunkte, rangliste, type EinzelBericht } from './einzelrangliste-2027';
import { pointsForLegs } from './legs';

type Spieler = EinzelBericht['players'][number];
type Spiel = EinzelBericht['games'][number];
const sp = (side: 'home' | 'guest', slot: number, name: string, player_id: string | null = null): Spieler => ({ side, slot, name, player_id });
const einzel = (home_slot: number, guest_slot: number, legs_home: number, legs_guest: number): Spiel =>
  ({ game_type: 'single', home_slot, guest_slot, legs_home, legs_guest });

let nr = 0;
function bericht(p: Partial<EinzelBericht> & Pick<EinzelBericht, 'players' | 'games'>): EinzelBericht {
  return { id: `r${++nr}`, homeTeam: 'heim', guestTeam: 'gast', bestaetigt: true, datum: '2026-11-06', highlights: [], ...p };
}
const zeileVon = (m: Map<string, ReturnType<typeof berechneEinzel> extends Map<string, infer Z> ? Z : never>, name: string) =>
  [...m.values()].find(z => z.name === name)!;

describe('Einzelpunkte je Ergebnis', () => {
  it('Best of 3: 2:0 = 3 · 2:1 = 2 · 1:2 = 1 · 0:2 = 0', () => {
    expect([pointsForLegs(2, 0), pointsForLegs(2, 1), pointsForLegs(1, 2), pointsForLegs(0, 2)]).toEqual([3, 2, 1, 0]);
  });
  it('Best of 5: 3:0 = 5 · 3:1 = 4 · 3:2 = 3 · 2:3 = 2 · 1:3 = 1 · 0:3 = 0', () => {
    expect([[3, 0], [3, 1], [3, 2], [2, 3], [1, 3], [0, 3]].map(([a, b]) => pointsForLegs(a, b))).toEqual([5, 4, 3, 2, 1, 0]);
  });
  it('wird aus dem Bericht pro Spieler aufsummiert', () => {
    const m = berechneEinzel([bericht({
      players: [sp('home', 1, 'Anna'), sp('guest', 1, 'Bert')],
      games: [einzel(1, 1, 2, 0), einzel(1, 1, 2, 1), einzel(1, 1, 1, 2), einzel(1, 1, 0, 2)],
    })]);
    // Anna: 3+2+1+0 = 6, 2 Siege; Bert spiegelbildlich 0+1+2+3 = 6
    expect(zeileVon(m, 'Anna')).toMatchObject({ points: 6, singles: 4, wins: 2, losses: 2, legsWon: 5, legsLost: 5, einsaetze: 1 });
    expect(zeileVon(m, 'Bert')).toMatchObject({ points: 6, singles: 4, wins: 2, losses: 2 });
  });
});

describe('Einzelrangliste', () => {
  it('Doppel zählen nicht', () => {
    const m = berechneEinzel([bericht({
      players: [sp('home', 1, 'Anna'), sp('home', 2, 'Clara'), sp('guest', 1, 'Bert'), sp('guest', 2, 'Dora')],
      games: [einzel(1, 1, 2, 0), { game_type: 'double', home_slot: 1, guest_slot: 1, legs_home: 2, legs_guest: 0 }],
    })]);
    expect(zeileVon(m, 'Anna')).toMatchObject({ points: 3, singles: 1, wins: 1 });
    expect(zeileVon(m, 'Bert')).toMatchObject({ points: 0, singles: 1 });
  });

  it('Spieler ohne Einsatz im Einzel stehen nicht in der Rangliste', () => {
    const m = berechneEinzel([bericht({
      players: [sp('home', 1, 'Anna'), sp('home', 5, 'Ersatz Emil'), sp('guest', 1, 'Bert'), sp('guest', 2, 'Hanna Highlight')],
      games: [einzel(1, 1, 2, 1)],
      highlights: [{ side: 'guest', slot: 2, type: '180', value: 1 }],
    })]);
    const namen = rangliste([...m.values()]).map(z => z.name);
    expect(namen).toEqual(['Anna', 'Bert']);
    expect(namen).not.toContain('Ersatz Emil');
    expect(namen).not.toContain('Hanna Highlight');
  });

  it('Gleichstand: Punkte → Legdifferenz → mehr Siege → geteilter Platz', () => {
    // Gegner sind Platzhalter auf der Gastseite, je Spiel ein anderer.
    const heim = ['Lena', 'Mia', 'Xaver', 'Yvonne', 'Paul', 'Quirin'];
    const players = [...heim.map((n, i) => sp('home', i + 1, n)), sp('guest', 1, 'G')];
    const games: Spiel[] = [
      // Lena: 2:0 → 3 P, Legs +2  |  Mia: 2:1, 1:2 → 3 P, Legs 0   → Lena vor Mia (Legdifferenz)
      einzel(1, 1, 2, 0), einzel(2, 1, 2, 1), einzel(2, 1, 1, 2),
      // Xaver: 5× 2:1 → 10 P, +5, 5 Siege | Yvonne: 3× 2:0, 1× 1:2 → 10 P, +5, 3 Siege → Xaver vor Yvonne
      einzel(3, 1, 2, 1), einzel(3, 1, 2, 1), einzel(3, 1, 2, 1), einzel(3, 1, 2, 1), einzel(3, 1, 2, 1),
      einzel(4, 1, 2, 0), einzel(4, 1, 2, 0), einzel(4, 1, 2, 0), einzel(4, 1, 1, 2),
      // Paul und Quirin: je 1× 1:2 → 1 P, −1, 0 Siege → geteilter Platz
      einzel(5, 1, 1, 2), einzel(6, 1, 1, 2),
    ];
    const r = rangliste([...berechneEinzel([bericht({ players, games })]).values()].filter(z => z.name !== 'G'));
    const pos = Object.fromEntries(r.map(z => [z.name, z.pos]));
    expect(pos.Xaver).toBeLessThan(pos.Yvonne);
    expect(pos.Lena).toBeLessThan(pos.Mia);
    expect(pos.Paul).toBe(pos.Quirin);
    expect(pos).toEqual({ Xaver: 1, Yvonne: 2, Lena: 3, Mia: 4, Paul: 5, Quirin: 5 });
  });

  it('Wechsel in der Saison (mit Profil): eine Person, Team des letzten Einsatzes, alle Einsätze gezählt', () => {
    const m = berechneEinzel([
      bericht({ datum: '2026-12-04', homeTeam: 'team-y', players: [sp('home', 1, 'Max Muster', 'max-muster'), sp('guest', 1, 'G')], games: [einzel(1, 1, 2, 1)] }),
      bericht({ datum: '2026-10-23', homeTeam: 'team-x', players: [sp('home', 1, 'Max Muster', 'max-muster'), sp('guest', 1, 'G')], games: [einzel(1, 1, 2, 0)] }),
    ]);
    const max = [...m.values()].filter(z => z.name === 'Max Muster');
    expect(max).toHaveLength(1);
    expect(max[0]).toMatchObject({ teamId: 'team-y', singles: 2, einsaetze: 2, points: 5 });
  });

  // Bekannter Fehler (Betreiber, 10.11.2026: „Fehler“): Ohne Profil enthält die Kennung den Teamnamen,
  // ein Wechsel macht aus einem Menschen zwei Zeilen. Der Test hält die richtige Erwartung fest und ist
  // als „schlägt fehl“ markiert — sobald der Fehler behoben ist, meldet Vitest das und `.fails` muss weg.
  it.fails('Wechsel in der Saison (ohne Profil): ebenfalls eine Person, Team des letzten Einsatzes', () => {
    const m = berechneEinzel([
      bericht({ datum: '2026-10-23', homeTeam: 'team-x', players: [sp('home', 1, 'Max Muster'), sp('guest', 1, 'G')], games: [einzel(1, 1, 2, 0)] }),
      bericht({ datum: '2026-12-04', homeTeam: 'team-y', players: [sp('home', 1, 'Max Muster'), sp('guest', 1, 'G')], games: [einzel(1, 1, 2, 1)] }),
    ]);
    const max = [...m.values()].filter(z => z.name === 'Max Muster');
    expect(max).toHaveLength(1);
    expect(max[0]).toMatchObject({ teamId: 'team-y', singles: 2, points: 5 });
  });
});

describe('Highlight-Punkte', () => {
  it('180er und 171er je 3 Punkte pro Stück', () => {
    expect(highlightPunkte('180', 1)).toBe(3);
    expect(highlightPunkte('180', 2)).toBe(6);
    expect(highlightPunkte('171', 1)).toBe(3);
  });
  it('High Finish: unter 100 = 0 · 100–129 = 2 · 130–159 = 3 · ab 160 = 4', () => {
    expect([99, 100, 129, 130, 159, 160, 170].map(v => highlightPunkte('high_finish', v))).toEqual([0, 2, 2, 3, 3, 4, 4]);
  });
  it('Short Leg: bis 12 Darts = 4 · 13–15 = 3 · 16–20 = 2 · darüber 0', () => {
    expect([9, 12, 13, 15, 16, 20, 21].map(v => highlightPunkte('short_leg', v))).toEqual([4, 4, 3, 3, 2, 2, 0]);
  });
});
