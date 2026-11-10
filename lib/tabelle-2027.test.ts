// Tests: Tabelle 2026/27 (lib/tabelle-2027.ts)
// Erwartete Werte aus den vom Betreiber bestätigten Regeln (10.11.2026), von Hand gerechnet:
//   Sieg 3 · Unentschieden 1 · Niederlage 0 (aus den Spielen) — Spielbedingungen Ziffer 10.3
//   Reihenfolge Punkte → Spieldifferenz → Legdifferenz → direkter Vergleich (ohne Abzüge), sonst geteilter Platz
//   Nichtantritt 0:3 / 0:18, −3 für den Nichtantretenden — Ziffer 16; fehlender Bericht 0:3 ohne Abzug
// Nur erfundene Daten, kein Datenbank- oder Netzzugriff.

import { describe, expect, it } from 'vitest';
import { berechneTabelle, ergebnisAusBericht, zaehlt, type Ergebnis27, type Rohbericht, type TabellenZeile } from './tabelle-2027';

let nr = 0;
function bericht(home: string, guest: string, spiele: [number, number], legs: [number, number], status = 'confirmed'): Rohbericht {
  return { id: `r${++nr}`, home_team_id: home, guest_team_id: guest, spiele_home: spiele[0], spiele_guest: spiele[1],
    legs_home: legs[0], legs_guest: legs[1], status, forfeit: null, match_date: '2026-11-06' };
}
function wertung(home: string, guest: string, forfeit: 'home_no_show' | 'guest_no_show' | 'no_report'): Rohbericht {
  return { id: `r${++nr}`, home_team_id: home, guest_team_id: guest, spiele_home: null, spiele_guest: null,
    legs_home: null, legs_guest: null, status: 'draft', forfeit, match_date: '2026-11-06' };
}
const e = (r: Rohbericht, legsProSpiel = 2): Ergebnis27 => ergebnisAusBericht(r, legsProSpiel);
const platz = (tab: TabellenZeile[]) => Object.fromEntries(tab.map(z => [z.team, z.pos]));
const zeile = (tab: TabellenZeile[], team: string) => tab.find(z => z.team === team)!;

describe('Tabelle 2026/27', () => {
  it('normaler Spieltag: Sieg 3, Unentschieden je 1, Niederlage 0', () => {
    const tab = berechneTabelle(['a', 'b', 'c', 'd'], [
      e(bericht('a', 'b', [12, 6], [26, 14])),
      e(bericht('c', 'd', [9, 9], [20, 20])),
    ]);
    expect(zeile(tab, 'a')).toMatchObject({ pts: 3, sp: 1, s: 1, u: 0, n: 0, spieleFor: 12, spieleAgainst: 6, legsFor: 26, legsAgainst: 14 });
    expect(zeile(tab, 'b')).toMatchObject({ pts: 0, s: 0, n: 1 });
    expect(zeile(tab, 'c')).toMatchObject({ pts: 1, u: 1 });
    expect(zeile(tab, 'd')).toMatchObject({ pts: 1, u: 1 });
    // c und d gleich in allem, auch im direkten Vergleich → geteilter 2. Platz
    expect(platz(tab)).toEqual({ a: 1, c: 2, d: 2, b: 4 });
  });

  it('Punktgleichheit → Spieldifferenz entscheidet', () => {
    const tab = berechneTabelle(['a', 'b', 'c', 'd'], [
      e(bericht('a', 'c', [11, 7], [24, 16])), // a +4 Spiele
      e(bericht('b', 'd', [10, 8], [22, 18])), // b +2 Spiele
    ]);
    expect(platz(tab)).toEqual({ a: 1, b: 2, d: 3, c: 4 });
  });

  it('Punkte und Spieldifferenz gleich → Legdifferenz entscheidet', () => {
    const tab = berechneTabelle(['a', 'b', 'c', 'd'], [
      e(bericht('a', 'c', [10, 8], [23, 18])), // Legs +5
      e(bericht('b', 'd', [10, 8], [22, 19])), // Legs +3
    ]);
    expect(platz(tab).a).toBe(1);
    expect(platz(tab).b).toBe(2);
  });

  it('alles gleich → direkter Vergleich, auch gegen das Alphabet', () => {
    // z schlägt a im direkten Duell, verliert gegen c; a schlägt d.
    // z und a: je 3 Punkte, Spiel- und Legdifferenz 0. c: 3 Punkte, +2.
    const tab = berechneTabelle(['z', 'a', 'c', 'd'], [
      e(bericht('z', 'a', [10, 8], [22, 20])),
      e(bericht('z', 'c', [8, 10], [20, 22])),
      e(bericht('a', 'd', [10, 8], [22, 20])),
    ]);
    expect(platz(tab)).toEqual({ c: 1, z: 2, a: 3, d: 4 });
  });

  it('alles gleich, auch im direkten Vergleich → geteilter Platz, der Nächste rückt entsprechend nach', () => {
    const tab = berechneTabelle(['a', 'b', 'c'], [e(bericht('a', 'b', [9, 9], [20, 20]))]);
    expect(platz(tab)).toEqual({ a: 1, b: 1, c: 3 });
  });

  it('Abzüge zählen im direkten Vergleich nicht', () => {
    // a, b, c stehen gesamt gleich (je 3 Punkte, Spiel- und Legdifferenz 0).
    // Untereinander: b tritt bei a nicht an, b schlägt c 18:0, c schlägt a 18:0.
    // Ohne Abzug sind alle drei im direkten Vergleich gleich (je 3 Punkte, 0, 0) → geteilter Platz.
    // b braucht für den Gesamtgleichstand (−3 Abzug) einen Sieg und eine Niederlage gegen Dritte.
    const tab = berechneTabelle(['a', 'b', 'c', 'o1', 'o2'], [
      e(wertung('a', 'b', 'guest_no_show')),
      e(bericht('b', 'c', [18, 0], [36, 0])),
      e(bericht('c', 'a', [18, 0], [36, 0])),
      e(bericht('b', 'o1', [10, 8], [20, 18])),
      e(bericht('o2', 'b', [10, 8], [20, 18])),
    ]);
    for (const t of ['a', 'b', 'c']) expect(zeile(tab, t)).toMatchObject({ pts: 3, spieleFor: zeile(tab, t).spieleAgainst, legsFor: zeile(tab, t).legsAgainst });
    expect(zeile(tab, 'b').abzug).toBe(-3);
    expect(platz(tab)).toEqual({ o2: 1, a: 2, b: 2, c: 2, o1: 5 });
  });

  it('Nichtantritt des Gastes: Heim 3 Punkte 18:0, Gast 0:3 und −3 Abzug', () => {
    const tab = berechneTabelle(['h', 'g'], [e(wertung('h', 'g', 'guest_no_show'))]);
    expect(zeile(tab, 'h')).toMatchObject({ pts: 3, sp: 1, s: 1, spieleFor: 18, spieleAgainst: 0, legsFor: 36, legsAgainst: 0, abzug: 0 });
    expect(zeile(tab, 'g')).toMatchObject({ pts: -3, sp: 1, n: 1, spieleFor: 0, spieleAgainst: 18, legsFor: 0, legsAgainst: 36, abzug: -3 });
  });

  it('Nichtantritt des Heimteams: Gast gewinnt, Heim −3', () => {
    const tab = berechneTabelle(['h', 'g'], [e(wertung('h', 'g', 'home_no_show'))]);
    expect(zeile(tab, 'g')).toMatchObject({ pts: 3, spieleFor: 18 });
    expect(zeile(tab, 'h')).toMatchObject({ pts: -3, abzug: -3, spieleAgainst: 18 });
  });

  it('Nichtantritt in der La Liga (Best of 5): Legs 54:0', () => {
    const r = e(wertung('h', 'g', 'guest_no_show'), 3);
    expect([r.legsHome, r.legsAway]).toEqual([54, 0]);
  });

  it('fehlender Spielbericht: Heimteam verliert 0:3 / 0:18, ohne Abzug', () => {
    const tab = berechneTabelle(['h', 'g'], [e(wertung('h', 'g', 'no_report'))]);
    expect(zeile(tab, 'h')).toMatchObject({ pts: 0, abzug: 0, spieleFor: 0, spieleAgainst: 18, n: 1 });
    expect(zeile(tab, 'g')).toMatchObject({ pts: 3, abzug: 0, spieleFor: 18 });
  });

  it('ab dem Einreichen zählt ein Bericht, ein Entwurf nicht', () => {
    expect(zaehlt({ status: 'draft', forfeit: null })).toBe(false);
    expect(zaehlt({ status: 'submitted', forfeit: null })).toBe(true);
    expect(zaehlt({ status: 'changes_requested', forfeit: null })).toBe(true);
    expect(zaehlt({ status: 'confirmed', forfeit: null })).toBe(true);
    expect(zaehlt({ status: 'draft', forfeit: 'no_report' })).toBe(true);
  });

  it('unbestätigtes Ergebnis zählt, ist aber als offen markiert', () => {
    const tab = berechneTabelle(['a', 'b'], [e(bericht('a', 'b', [10, 8], [22, 18], 'submitted'))]);
    expect(zeile(tab, 'a')).toMatchObject({ pts: 3, offen: 1 });
    expect(zeile(tab, 'b')).toMatchObject({ pts: 0, offen: 1 });
  });

  it('leere Saison: alle Teams mit 0 Punkten auf geteiltem 1. Platz', () => {
    const tab = berechneTabelle(['a', 'b', 'c'], []);
    expect(tab).toHaveLength(3);
    for (const z of tab) expect(z).toMatchObject({ pos: 1, pts: 0, sp: 0 });
  });

  it('genau eine Begegnung: Sieger vorn, Teams ohne Spiel geteilt, Verlierer hinten', () => {
    const tab = berechneTabelle(['a', 'b', 'c', 'd'], [e(bericht('a', 'b', [12, 6], [26, 14]))]);
    expect(platz(tab)).toEqual({ a: 1, c: 2, d: 2, b: 4 });
  });
});
