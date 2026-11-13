import { describe, expect, it } from 'vitest';
import { letztesDuell, teamFakten, vorlageText } from './vorbericht';
import type { Ergebnis27, TabellenZeile } from './tabelle-2027';
import type { EinzelZeile } from './einzelrangliste-2027';

const name = (id: string) => id.toUpperCase();
const erg = (home: string, away: string, h: number, a: number, datum: string): Ergebnis27 => ({
  key: `${home}|${away}`, home, away, spieleHome: h, spieleAway: a, legsHome: 0, legsAway: 0,
  ptsHome: 0, ptsAway: 0, abzugHome: 0, abzugAway: 0, bestaetigt: true, wertung: null, datum, reportId: `${home}-${away}`,
});
const tab = (team: string, pos: number, sp: number, s: number, u: number, n: number, pts: number): TabellenZeile => ({
  pos, team, sp, s, u, n, spieleFor: 0, spieleAgainst: 0, legsFor: 0, legsAgainst: 0, pts, abzug: 0, offen: 0,
});
const sp = (name: string, teamId: string, pos: number, wins: number, losses: number, b180 = 0, hf = 0): EinzelZeile => ({
  key: name, playerId: null, name, teamId, singles: wins + losses, wins, losses, legsWon: 0, legsLost: 0, points: 0, einsaetze: 1,
  b180, b171: 0, highFinish: hf ? 120 : null, hfAnzahl: hf, slAnzahl: 0, shortLeg: null, hlPunkte: b180 * 3 + hf * 2,
  hlJeBegegnung: {}, offen: 0, pos, verlauf: [],
});

describe('Vorbericht', () => {
  const ergebnisse = [erg('a', 'c', 12, 6, '2026-10-02'), erg('d', 'a', 9, 9, '2026-10-16'), erg('a', 'e', 5, 13, '2026-10-30'), erg('b', 'a', 4, 14, '2026-09-20')];
  const tabelle = [tab('a', 2, 4, 2, 1, 1, 7), tab('b', 1, 3, 3, 0, 0, 9), tab('c', 3, 0, 0, 0, 0, 0)];

  it('Form: neueste zuerst, S/U/N aus Sicht des Teams, die heutige Begegnung zählt nicht', () => {
    const f = teamFakten('a', name, tabelle, [...ergebnisse, erg('a', 'b', 18, 0, '2026-11-13')], [], [], 'a|b');
    expect(f.form.map(x => `${x.ergebnis} ${x.stand} ${x.gegner}`)).toEqual(['N 5:13 E', 'U 9:9 D', 'S 12:6 C', 'S 14:4 B']);
    expect(f).toMatchObject({ platz: 2, punkte: 7, bilanz: '2-1-1', vonTeams: 3 });
  });

  it('ohne Spiel kein Tabellenplatz', () => {
    expect(teamFakten('c', name, tabelle, [], [], [], 'x').platz).toBeNull();
  });

  it('Top-Spieler = bester Platz der Einzelrangliste im Team; meiste Highlights nach Anzahl', () => {
    const einzel = [sp('Max', 'a', 5, 6, 2), sp('Sepp', 'a', 2, 7, 1), sp('Fritz', 'a', 9, 3, 5, 2, 1), sp('Fremd', 'b', 1, 8, 0, 9)];
    const f = teamFakten('a', name, tabelle, [], [], einzel, 'x');
    expect(f.topSpieler).toEqual({ name: 'Sepp', bilanz: '7:1', ligaPlatz: 2 });
    expect(f.meisteHighlights).toMatchObject({ name: 'Fritz', anzahl: 3 });
  });

  it('letztes Duell aus Sicht der heutigen Heimmannschaft', () => {
    expect(letztesDuell('a', 'b', 'a|b', ergebnisse, name)).toEqual({ stand: 'A 14:4 B', sieger: 'A', datum: '2026-09-20' });
    expect(letztesDuell('a', 'z', 'a|z', ergebnisse, name)).toBeNull();
  });

  it('Vorlage nennt beide Teams', () => {
    const t = teamFakten('a', name, tabelle, ergebnisse, [], [], 'a|b');
    const g = teamFakten('b', name, tabelle, ergebnisse, [], [], 'a|b');
    expect(vorlageText({ heim: t, gast: g, lokal: null, anwurf: null, letztesDuell: null })).toContain('A: Platz 2 mit 7 Punkten, Form N-U-S-S.');
  });
});
