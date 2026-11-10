// Tests: Spieltagsbericht (lib/spieltag-bericht.ts)
// Erwartete Werte aus den bestätigten Regeln (10.11.2026), von Hand gerechnet:
//   Spieler des Spieltages: mehr Einzelsiege → weniger Niederlagen → Highlight-Punkte → Legdifferenz, sonst geteilt
//   Highlight-Punkte (intern): 180/171 = 3 · HF 100–129/130–159/160+ = 2/3/4 · SL ≤12/13–15/16–20 = 3/2/1 · La Liga × ⅔
//   Meiste Highlights: Anzahl, dann Highlight-Punkte, sonst geteilt
//   Spielverlauf: „entschieden nach Spiel x“ = erstes Spiel, nach dem der Vorsprung größer ist als die übrigen Spiele;
//   erst im letzten Spiel entschieden oder Remis → null
//   Fenster: Montag nach dem vorigen Plan-Wochenende bis Sonntag; das erste Wochenende ist nach vorn offen
// Nur erfundene Daten, kein Datenbank- oder Netzzugriff.

import { describe, expect, it } from 'vitest';
import {
  fenster, HF_PUNKTE, meisteHighlights, SL_PUNKTE, spielerDesSpieltages, spielerWertung, spielverlauf, tabellenAenderung, tagDanach,
  type BegegnungDaten, type BerichtSpiel,
} from './spieltag-bericht';
import type { Ergebnis27, TabellenZeile } from './tabelle-2027';

const ergebnis = (home: string, away: string, p: Partial<Ergebnis27> = {}): Ergebnis27 => ({
  key: `${home}|${away}`, home, away, spieleHome: 0, spieleAway: 0, legsHome: 0, legsAway: 0, ptsHome: 0, ptsAway: 0,
  abzugHome: 0, abzugAway: 0, bestaetigt: true, wertung: null, datum: '2026-11-06', reportId: 'r', ...p,
});
const einzel = (nr: number, heim: number, gast: number, legsHeim: number, legsGast: number): BerichtSpiel =>
  ({ nr, doppel: false, heim: [heim], gast: [gast], legsHeim, legsGast });

/** 18 Spiele aus einer Folge von Siegern ('H'/'G'). */
const verlaufAus = (folge: string) => [...folge].map((c, i) => einzel(i + 1, 1, 1, c === 'H' ? 2 : 0, c === 'H' ? 0 : 2));

describe('Eingabe ohne Ergebnisse', () => {
  it('nur Wertungen ohne Spiele: kein Spieler des Spieltages, keine Highlights, leerer Verlauf', () => {
    const b: BegegnungDaten = { key: 'a|b', liga: 'a', spieltag: 3, e: ergebnis('a', 'b', { wertung: 'no_report' }), spieler: [], spiele: [], highlights: [] };
    const liste = spielerWertung([b]);
    expect(liste).toEqual([]);
    expect(spielerDesSpieltages(liste)).toEqual([]);
    expect(meisteHighlights(liste)).toEqual([]);
    expect(spielverlauf([])).toEqual({ staende: [], fuehrungswechsel: 0, groessterRueckstand: 0, entschiedenNach: null });
  });
  it('gar keine Begegnungen', () => {
    expect(spielerWertung([])).toEqual([]);
  });
});

describe('Spieler des Spieltages', () => {
  // Begegnung 1 (A Liga): Heim A (4:0), B (3:0), C (3:1), D (3:1 + ein 180er) gegen Platzhalter G.
  // Begegnung 2 (La Liga): Heim E (3:1 + ein 180er, dort × ⅔).
  const b1: BegegnungDaten = {
    key: 'x|y', liga: 'a', spieltag: 5, e: ergebnis('x', 'y'),
    spieler: [
      { side: 'home', slot: 1, name: 'Anton', playerId: 'anton' }, { side: 'home', slot: 2, name: 'Berta', playerId: 'berta' },
      { side: 'home', slot: 3, name: 'Carl', playerId: 'carl' }, { side: 'home', slot: 4, name: 'Doris', playerId: 'doris' },
      { side: 'guest', slot: 1, name: 'Gast', playerId: 'gast' },
    ],
    spiele: [
      einzel(1, 1, 1, 2, 0), einzel(2, 1, 1, 2, 0), einzel(3, 1, 1, 2, 0), einzel(4, 1, 1, 2, 0),
      einzel(5, 2, 1, 2, 0), einzel(6, 2, 1, 2, 0), einzel(7, 2, 1, 2, 0),
      einzel(8, 3, 1, 2, 1), einzel(10, 3, 1, 2, 1), einzel(11, 3, 1, 2, 1), einzel(12, 3, 1, 1, 2),
      einzel(13, 4, 1, 2, 1), einzel(14, 4, 1, 2, 1), einzel(15, 4, 1, 2, 1), einzel(16, 4, 1, 1, 2),
      { nr: 9, doppel: true, heim: [1, 2], gast: [1, 1], legsHeim: 2, legsGast: 0 },
    ],
    highlights: [{ side: 'home', slot: 4, type: '180', value: 1 }],
  };
  const b2: BegegnungDaten = {
    key: 'p|q', liga: 'la', spieltag: 2, e: ergebnis('p', 'q'),
    spieler: [{ side: 'home', slot: 1, name: 'Emil', playerId: 'emil' }, { side: 'guest', slot: 1, name: 'Gast2', playerId: 'gast2' }],
    spiele: [einzel(1, 1, 1, 3, 2), einzel(2, 1, 1, 3, 2), einzel(3, 1, 1, 3, 2), einzel(4, 1, 1, 2, 3)],
    highlights: [{ side: 'home', slot: 1, type: '180', value: 1 }],
  };

  it('Reihenfolge: Siege → Niederlagen → Highlight-Punkte (La Liga × ⅔)', () => {
    const namen = spielerWertung([b1, b2]).map(z => z.name);
    // Anton 4:0, Berta 3:0, dann 3:1: Doris (3 HL-Punkte) vor Emil (3 × ⅔ = 2) vor Carl (0)
    expect(namen.slice(0, 5)).toEqual(['Anton', 'Berta', 'Doris', 'Emil', 'Carl']);
    expect(spielerDesSpieltages(spielerWertung([b1, b2])).map(z => z.name)).toEqual(['Anton']);
  });

  it('Doppel zählen nicht für die Einzelbilanz', () => {
    const anton = spielerWertung([b1]).find(z => z.name === 'Anton')!;
    expect([anton.einzelSiege, anton.einzelNiederlagen]).toEqual([4, 0]);
  });

  it('alles gleich → geteilter Titel', () => {
    const b: BegegnungDaten = {
      key: 'x|y', liga: 'b1', spieltag: 1, e: ergebnis('x', 'y'),
      spieler: [{ side: 'home', slot: 1, name: 'Ida', playerId: 'ida' }, { side: 'home', slot: 2, name: 'Jon', playerId: 'jon' },
        { side: 'guest', slot: 1, name: 'Gast', playerId: 'gast' }],
      spiele: [einzel(1, 1, 1, 2, 1), einzel(2, 1, 1, 2, 1), einzel(3, 2, 1, 2, 1), einzel(4, 2, 1, 2, 1)],
      highlights: [],
    };
    expect(spielerDesSpieltages(spielerWertung([b])).map(z => z.name).sort()).toEqual(['Ida', 'Jon']);
  });
});

describe('Meiste Highlights', () => {
  it('Anzahl zuerst, bei gleicher Anzahl die Highlight-Punkte', () => {
    const b: BegegnungDaten = {
      key: 'x|y', liga: 'a', spieltag: 1, e: ergebnis('x', 'y'),
      spieler: [{ side: 'home', slot: 1, name: 'Kai', playerId: 'kai' }, { side: 'home', slot: 2, name: 'Lia', playerId: 'lia' },
        { side: 'guest', slot: 1, name: 'Mo', playerId: 'mo' }],
      spiele: [],
      highlights: [
        { side: 'home', slot: 1, type: '180', value: 2 },                                                   // Kai: 2 Stück, 6 Punkte
        { side: 'home', slot: 2, type: 'short_leg', value: 13 }, { side: 'home', slot: 2, type: 'short_leg', value: 14 }, // Lia: 2 Stück, 2+2
        { side: 'guest', slot: 1, type: 'high_finish', value: 170 },                                       // Mo: 1 Stück
      ],
    };
    expect(meisteHighlights(spielerWertung([b])).map(z => z.name)).toEqual(['Kai']);
  });
  it('interne Punkte: HF und Short Leg an den Grenzen', () => {
    expect([99, 100, 129, 130, 159, 160].map(HF_PUNKTE)).toEqual([0, 2, 2, 3, 3, 4]);
    expect([9, 12, 13, 15, 16, 20, 21].map(SL_PUNKTE)).toEqual([3, 3, 2, 2, 1, 1, 0]);
  });
});

describe('Spielverlauf (Sonderfälle)', () => {
  it('Aufholjagd 0:5 → 10:8: ein Führungswechsel, Rückstand 5, entschieden nach Spiel 15', () => {
    const v = spielverlauf(verlaufAus('GGGGG' + 'HHHHHHHHHH' + 'GGG'));
    expect(v.staende[4]).toEqual([0, 5]);
    expect(v.staende[17]).toEqual([10, 8]);
    expect(v.fuehrungswechsel).toBe(1);
    expect(v.groessterRueckstand).toBe(5);
    expect(v.entschiedenNach).toBe(15);
  });
  it('erst im letzten Spiel entschieden → null', () => {
    // nach 17 Spielen 9:8, dann gewinnt Heim → 10:8
    const v = spielverlauf(verlaufAus('HGHGHGHGHGHGHGHGH' + 'H'));
    expect(v.staende[16]).toEqual([9, 8]);
    expect(v.entschiedenNach).toBeNull();
  });
  it('früh entschieden: 10:0 nach 10 Spielen', () => {
    expect(spielverlauf(verlaufAus('H'.repeat(18))).entschiedenNach).toBe(10);
  });
  it('Remis 9:9: nicht entschieden, Rückstand = größter Abstand einer Seite', () => {
    const v = spielverlauf(verlaufAus('GGG' + 'HHHHHHHHH' + 'GGGGGG'));
    expect(v.staende[17]).toEqual([9, 9]);
    expect(v.entschiedenNach).toBeNull();
    expect(v.groessterRueckstand).toBe(6); // 9:3 nach Spiel 12
  });
  it('Spiele ohne Ergebnis und Reihenfolge der Eingabe stören nicht', () => {
    const spiele = [...verlaufAus('HG'), { nr: 3, doppel: false, heim: [1], gast: [1], legsHeim: null, legsGast: null }].reverse();
    expect(spielverlauf(spiele).staende).toEqual([[1, 0], [1, 1]]);
  });
});

describe('Fenster je Plan-Wochenende', () => {
  const wochenenden = [
    { fri: '2027-02-05', sun: '2027-02-07' }, { fri: '2026-10-23', sun: '2026-10-25' },
    { fri: '2027-01-29', sun: '2027-01-31' }, { fri: '2026-11-06', sun: '2026-11-08' },
  ];
  it('erstes Wochenende ist nach vorn offen', () => {
    expect(fenster(wochenenden, '2026-10-23')).toEqual({ von: '0000-01-01', bis: '2026-10-25' });
  });
  it('sonst ab Montag nach dem vorigen Plan-Wochenende (unsortierte Eingabe)', () => {
    expect(fenster(wochenenden, '2026-11-06')).toEqual({ von: '2026-10-26', bis: '2026-11-08' });
  });
  it('über Monatsende', () => {
    expect(fenster(wochenenden, '2027-02-05')).toEqual({ von: '2027-02-01', bis: '2027-02-07' });
  });
  it('unbekanntes Wochenende → null', () => {
    expect(fenster(wochenenden, '2026-12-04')).toBeNull();
  });
  it('tagDanach über den Jahreswechsel', () => {
    expect(tagDanach('2026-12-31')).toBe('2027-01-01');
  });
});

describe('Tabellen vorher/nachher', () => {
  const z = (team: string, pos: number, sp: number, pts: number): TabellenZeile =>
    ({ pos, team, sp, s: 0, u: 0, n: 0, spieleFor: 0, spieleAgainst: 0, legsFor: 0, legsAgainst: 0, pts, abzug: 0, offen: 0 });
  it('vorher 0, wenn das Team noch nicht gespielt hatte', () => {
    const a = tabellenAenderung([z('a', 1, 1, 3), z('b', 1, 0, 0)], [z('b', 1, 1, 3), z('a', 2, 2, 3)]);
    expect(a).toEqual([
      { teamId: 'b', vorher: 0, nachher: 1, punkte: 3, spiele: 1 },
      { teamId: 'a', vorher: 1, nachher: 2, punkte: 3, spiele: 2 },
    ]);
  });
});
