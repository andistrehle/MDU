// Tests: Korrektur eines bestätigten Spielberichts (lib/spielbericht-korrektur.ts)
// + die Neuberechnung, die der Server nach einer bestätigten Korrektur nutzt (computeTotals in
// lib/supabase/match-reports.ts). Kernforderung des Betreibers (10.11.2026): Eine Korrektur muss
// exakt zum selben Ergebnis führen wie eine Ersteingabe mit den korrigierten Werten.
// Erwartete Zahlen von Hand gerechnet (Spielbedingungen Ziffer 10). Frist: 7 Tage nach dem Spiel,
// Berliner Datum — Uhr in Vitest fest gesetzt, nie die echte.
// Nur erfundene Daten. Supabase-Variablen sind im Testlauf leer (vitest.config.ts): Der Import
// von match-reports legt keinen Client an und verbindet nichts.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fristEnde, fristVorbei, gleicherStand, pruefeStand, unterschiede, vereinheitliche, type KorrekturStand } from './spielbericht-korrektur';
import { computeTotals, GAME_SCHEDULE, type ReportGame } from './supabase/match-reports';
import { ergebnisAusBericht, berechneTabelle } from './tabelle-2027';
import { berechneEinzel } from './einzelrangliste-2027';
import { supabase } from './supabase/client';

/** Aufstellung H1–H4 / G1–G4. */
const spieler = (): KorrekturStand['players'] => [
  ...[1, 2, 3, 4].map(slot => ({ side: 'home' as const, slot, name: `Heim ${slot}`, pass_no: null, player_id: `heim-${slot}` })),
  ...[1, 2, 3, 4].map(slot => ({ side: 'guest' as const, slot, name: `Gast ${slot}`, pass_no: null, player_id: `gast-${slot}` })),
];

/** Ergebnisse je Spielnummer (Heim:Gast) — alle 18 nach festem Spielplan. */
function spiele(ergebnis: Record<number, [number, number]>): ReportGame[] {
  return GAME_SCHEDULE.map(p => ({
    game_no: p.no, game_type: p.type,
    home_slot: p.type === 'double' ? (p.no === 9 ? 1 : 3) : p.homeSlot!, guest_slot: p.type === 'double' ? (p.no === 9 ? 1 : 3) : p.guestSlot!,
    home_slot2: p.type === 'double' ? (p.no === 9 ? 2 : 4) : null, guest_slot2: p.type === 'double' ? (p.no === 9 ? 2 : 4) : null,
    legs_home: ergebnis[p.no][0], legs_guest: ergebnis[p.no][1],
  }));
}

// Ursprünglich: Spiele 1–9 Heim 2:0, 10–14 Gast 0:2, Spiel 15 Heim 2:1, 16–18 Gast 0:2.
const URSPRUNG: Record<number, [number, number]> = {
  1: [2, 0], 2: [2, 0], 3: [2, 0], 4: [2, 0], 5: [2, 0], 6: [2, 0], 7: [2, 0], 8: [2, 0], 9: [2, 0],
  10: [0, 2], 11: [0, 2], 12: [0, 2], 13: [0, 2], 14: [0, 2], 15: [2, 1], 16: [0, 2], 17: [0, 2], 18: [0, 2],
};
// Korrektur: Spiel 15 war in Wahrheit 1:2.
const KORRIGIERT = { ...URSPRUNG, 15: [1, 2] as [number, number] };

const stand = (e: Record<number, [number, number]>): KorrekturStand => ({ players: spieler(), games: spiele(e), highlights: [] });

afterEach(() => { vi.useRealTimers(); });

describe('Testumgebung', () => {
  it('kein Supabase-Client im Testlauf', () => {
    expect(supabase).toBeNull();
  });
});

describe('Korrektur = Ersteingabe mit den korrigierten Werten', () => {
  const base = stand(URSPRUNG);
  // Wie der Server: Korrektur kommt vom Browser, wird vereinheitlicht und dann neu gerechnet.
  const korrektur = vereinheitliche({ ...base, games: base.games.map(g => (g.game_no === 15 ? { ...g, legs_home: 1, legs_guest: 2 } : g)) });
  // Unabhängig gebaute Ersteingabe, absichtlich in anderer Reihenfolge.
  const erst = stand(KORRIGIERT);
  erst.games.reverse();
  erst.players.reverse();

  it('Ursprung von Hand: 10:8 Spiele, 20:17 Legs, 3:0 Punkte', () => {
    expect(computeTotals(base.games)).toMatchObject({ spieleHome: 10, spieleGuest: 8, legsHome: 20, legsGuest: 17, pointsHome: 3, pointsGuest: 0 });
  });

  it('nach der Korrektur von Hand: 9:9 Spiele, 19:18 Legs, 1:1 Punkte, Einzelpunkte H2 7 und G3 5', () => {
    const t = computeTotals(korrektur.games);
    expect(t).toMatchObject({ spieleHome: 9, spieleGuest: 9, legsHome: 19, legsGuest: 18, pointsHome: 1, pointsGuest: 1 });
    // H2: Spiele 2 (2:0=3), 6 (2:0=3), 11 (0:2=0), 15 (1:2=1) = 7 · G3: Spiele 3 (0), 8 (0), 10 (3), 15 (2:1=2) = 5
    expect(t.homePlayerPoints[2]).toBe(7);
    expect(t.guestPlayerPoints[3]).toBe(5);
  });

  it('Summen und Einzelpunkte identisch mit der Ersteingabe', () => {
    expect(computeTotals(korrektur.games)).toEqual(computeTotals(erst.games));
    expect(gleicherStand(korrektur, erst)).toBe(true);
  });

  it('Tabelle identisch mit der Ersteingabe', () => {
    const zeile = (s: KorrekturStand) => {
      const t = computeTotals(s.games);
      return berechneTabelle(['h', 'g'], [ergebnisAusBericht({ id: 'r', home_team_id: 'h', guest_team_id: 'g', spiele_home: t.spieleHome,
        spiele_guest: t.spieleGuest, legs_home: t.legsHome, legs_guest: t.legsGuest, status: 'confirmed', forfeit: null, match_date: '2026-11-06' })]);
    };
    expect(zeile(korrektur)).toEqual(zeile(erst));
    expect(zeile(korrektur).map(z => z.pts)).toEqual([1, 1]);
  });

  it('Einzelrangliste identisch mit der Ersteingabe', () => {
    const einzel = (s: KorrekturStand) => [...berechneEinzel([{
      id: 'r', homeTeam: 'h', guestTeam: 'g', bestaetigt: true, datum: '2026-11-06', highlights: [],
      players: s.players.map(p => ({ side: p.side, slot: p.slot, name: p.name, player_id: p.player_id })),
      games: s.games.map(g => ({ game_no: g.game_no, game_type: g.game_type, home_slot: g.home_slot, guest_slot: g.guest_slot, legs_home: g.legs_home, legs_guest: g.legs_guest })),
    }]).values()].map(z => ({ ...z, verlauf: [] })).sort((a, b) => a.key.localeCompare(b.key));
    // `verlauf` (Formkurve) ausgeklammert: Reihenfolge hängt an der Eingabereihenfolge der Spiele — gemeldet, nicht behoben.
    expect(einzel(korrektur)).toEqual(einzel(erst));
  });

  it('Unterschied in Worten: genau die eine Änderung', () => {
    expect(unterschiede(base, korrektur)).toEqual(['Spiel 15: Ergebnis 2:1 → 1:2']);
  });
});

describe('Stand prüfen', () => {
  it('gültiger Stand → kein Fehler', () => {
    expect(pruefeStand(stand(KORRIGIERT), 'A Liga')).toBeNull();
  });
  it('fehlender Heimspieler H3', () => {
    const s = stand(KORRIGIERT);
    s.players = s.players.filter(p => !(p.side === 'home' && p.slot === 3));
    expect(pruefeStand(s, 'A Liga')).toBe('Heimspieler H3 fehlt.');
  });
  it('2:2 ist kein gültiges Ergebnis', () => {
    expect(pruefeStand(stand({ ...KORRIGIERT, 4: [2, 2] }), 'A Liga')).toBe('Spiel 4: Ergebnis fehlt oder passt nicht.');
  });
  it('3:0 ist in einer Best-of-3-Liga ungültig, in der La Liga gültig', () => {
    expect(pruefeStand(stand({ ...KORRIGIERT, 4: [3, 0] }), 'A Liga')).toBe('Spiel 4: Ergebnis fehlt oder passt nicht.');
    const la: Record<number, [number, number]> = Object.fromEntries(Object.entries(KORRIGIERT).map(([k, [h, g]]) => [k, [h === 2 ? 3 : h, g === 2 ? 3 : g]]));
    expect(pruefeStand(stand(la), 'La Liga')).toBeNull();
  });
  it('Doppel mit zwei gleichen Spielern', () => {
    const s = stand(KORRIGIERT);
    s.games = s.games.map(g => (g.game_no === 9 ? { ...g, home_slot2: g.home_slot } : g));
    expect(pruefeStand(s, 'A Liga')).toBe('Spiel 9 (Doppel): Pro Seite müssen zwei verschiedene Spieler stehen.');
  });
});

describe('Gleicher Stand', () => {
  it('Reihenfolge, Leerzeichen und leere Plätze spielen keine Rolle', () => {
    const a = stand(KORRIGIERT);
    const b = stand(KORRIGIERT);
    b.games.reverse();
    b.players = [...b.players.map(p => ({ ...p, name: `  ${p.name} ` })), { side: 'home' as const, slot: 6, name: '   ', pass_no: null, player_id: null }].reverse();
    expect(gleicherStand(a, b)).toBe(true);
  });
  it('ein anderes Ergebnis ist ein anderer Stand', () => {
    expect(gleicherStand(stand(URSPRUNG), stand(KORRIGIERT))).toBe(false);
  });
});

describe('Frist: 7 Tage nach dem Spiel, Berliner Datum', () => {
  it('letzter Tag ist Spieltag + 7', () => {
    expect(fristEnde('2026-11-10')).toBe('2026-11-17');
    expect(fristEnde('2026-12-28T20:00:00Z')).toBe('2027-01-04');
  });
  it('am 17.11. um 23:30 Berliner Zeit noch offen', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-17T22:30:00Z')); // 23:30 MEZ
    expect(fristVorbei('2026-11-10')).toBe(false);
  });
  it('am 18.11. um 00:30 Berliner Zeit vorbei', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-17T23:30:00Z')); // 00:30 MEZ am 18.11.
    expect(fristVorbei('2026-11-10')).toBe(true);
  });
  it('ohne Spieldatum vorbei', () => {
    expect(fristVorbei(null)).toBe(true);
  });
});
