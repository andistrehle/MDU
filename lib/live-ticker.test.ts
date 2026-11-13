// Tests: Live-Ticker (lib/live-ticker.ts). Regeln vom Betreiber, 11.11.2026:
// offen = noch kein Ergebnis · live = Entwurf mit Ergebnissen · beendet = eingereicht.
// Stand = gewonnene Spiele. Spieltag läuft bis 4 Uhr früh weiter (Berliner Zeit).

import { describe, expect, it } from 'vitest';
import { highlightKurz, highlightsZuordnen, spieleVon, vorschlagSpiel, meldungText, sortiereTicker, spieltagDatum, tickerAktiv, tickerEintrag, type TickerAnzeige, type TickerBericht, type TickerPlan } from './live-ticker';

const plan = (key: string, uhrzeit: string | null = '20:00'): TickerPlan => ({ key, liga: 'a', home: key.split('|')[0], away: key.split('|')[1], uhrzeit });
const spiel = (nr: number, h: number | null, g: number | null) => ({ nr, doppel: nr === 9 || nr === 18, heim: ['H'], gast: ['G'], legsHeim: h, legsGast: g });

describe('Status und Stand', () => {
  it('ohne Bericht: offen, 0:0', () => {
    expect(tickerEintrag(plan('a|b'), null)).toMatchObject({ status: 'offen', standHeim: 0, standGast: 0, gespielt: 0 });
  });
  it('Entwurf ohne Ergebnis: offen', () => {
    expect(tickerEintrag(plan('a|b'), { status: 'draft', spiele: [spiel(1, null, null)] }).status).toBe('offen');
  });
  it('Entwurf mit Ergebnissen: live, Stand = gewonnene Spiele, Reihenfolge nach Spielnummer', () => {
    const b: TickerBericht = { status: 'draft', spiele: [spiel(3, 0, 2), spiel(1, 2, 1), spiel(2, 2, 0), spiel(4, null, null)] };
    const e = tickerEintrag(plan('a|b'), b);
    expect(e).toMatchObject({ status: 'live', standHeim: 2, standGast: 1, gespielt: 3 });
    expect(e.spiele.map(s => s.nr)).toEqual([1, 2, 3]);
  });
  it('eingereicht: beendet, bestätigt nur bei confirmed', () => {
    expect(tickerEintrag(plan('a|b'), { status: 'submitted', spiele: [spiel(1, 2, 0)] })).toMatchObject({ status: 'beendet', bestaetigt: false });
    expect(tickerEintrag(plan('a|b'), { status: 'confirmed', spiele: [spiel(1, 2, 0)] })).toMatchObject({ status: 'beendet', bestaetigt: true });
  });
});

describe('Spieltag (Berliner Zeit, bis 4 Uhr früh)', () => {
  it('Freitag 22:00 Berliner Zeit → Freitag', () => {
    expect(spieltagDatum(new Date('2026-11-13T21:00:00Z'))).toBe('2026-11-13');
  });
  it('Samstag 00:30 Berliner Zeit → noch Freitag', () => {
    expect(spieltagDatum(new Date('2026-11-13T23:30:00Z'))).toBe('2026-11-13');
  });
  it('Samstag 04:30 Berliner Zeit → Samstag', () => {
    expect(spieltagDatum(new Date('2026-11-14T03:30:00Z'))).toBe('2026-11-14');
  });
});

describe('Reihenfolge und Aktivität', () => {
  it('live zuerst (mehr gespielt vorn), dann beendet, dann offen nach Beginn', () => {
    const e = [
      tickerEintrag(plan('o1|x', '20:30'), null),
      tickerEintrag(plan('b|x'), { status: 'submitted', spiele: [spiel(1, 2, 0)] }),
      tickerEintrag(plan('l1|x'), { status: 'draft', spiele: [spiel(1, 2, 0)] }),
      tickerEintrag(plan('o2|x', '20:00'), null),
      tickerEintrag(plan('l2|x'), { status: 'draft', spiele: [spiel(1, 2, 0), spiel(2, 0, 2)] }),
    ];
    expect(sortiereTicker(e).map(x => x.key)).toEqual(['l2|x', 'l1|x', 'b|x', 'o2|x', 'o1|x']);
  });
  it('aktiv nur, wenn irgendwo ein Ergebnis steht', () => {
    expect(tickerAktiv([tickerEintrag(plan('a|b'), null)])).toBe(false);
    expect(tickerAktiv([tickerEintrag(plan('a|b'), { status: 'draft', spiele: [spiel(1, 2, 0)] })])).toBe(true);
    expect(tickerAktiv([])).toBe(false);
  });
});

describe('Meldung bei Standänderung', () => {
  const a = (status: 'offen' | 'live' | 'beendet', h: number, g: number): TickerAnzeige => ({
    key: 'x|y', liga: 'a', home: 'x', away: 'y', uhrzeit: '20:00', status, standHeim: h, standGast: g, gespielt: h + g, bestaetigt: false, spiele: [], highlights: [],
    homeName: 'Heim', awayName: 'Gast', ligaName: 'A Liga', ligaFarbe: '#000', ort: null, wertung: false,
  });
  it('erste Abfrage oder keine Änderung: nichts', () => {
    expect(meldungText(undefined, a('live', 1, 0))).toBeNull();
    expect(meldungText(a('live', 1, 0), a('live', 1, 0))).toBeNull();
  });
  it('Start, Führung, Ausgleich, Zwischenstand, Endstand', () => {
    expect(meldungText(a('offen', 0, 0), a('live', 1, 0))).toBe("Los geht's: Heim – Gast läuft live");
    expect(meldungText(a('live', 3, 3), a('live', 3, 4))).toBe('Gast gehen bei Heim 4:3 in Führung');
    expect(meldungText(a('live', 3, 4), a('live', 4, 4))).toBe('Ausgleich: Heim 4:4 Gast');
    expect(meldungText(a('live', 5, 4), a('live', 6, 4))).toBe('Heim 6:4 Gast');
    expect(meldungText(a('live', 9, 8), a('beendet', 10, 8))).toBe('Endstand: Heim 10:8 Gast');
  });
});

describe('Highlights im Live-Ticker', () => {
  const g = (game_no: number, home_slot: number | null, guest_slot: number | null, legs: [number | null, number | null], h2: number | null = null, g2: number | null = null) =>
    ({ game_no, home_slot, guest_slot, home_slot2: h2, guest_slot2: g2, legs_home: legs[0], legs_guest: legs[1] });
  const name = (side: 'home' | 'guest', slot: number) => `${side === 'home' ? 'H' : 'G'}${slot}`;

  it('ordnet dem letzten Spiel MIT Ergebnis der Person zu (auch Doppel), ohne Spiel → null', () => {
    const spiele = [g(1, 1, 1, [2, 0]), g(5, 1, 2, [1, 2]), g(9, 3, 1, [2, 1], 1, 4), g(13, 1, 3, [null, null])];
    const h = highlightsZuordnen([
      { side: 'home', slot: 1, type: '180', value: 1 },
      { side: 'guest', slot: 2, type: 'high_finish', value: 121 },
      { side: 'guest', slot: 7, type: 'short_leg', value: 15 },
    ], spiele, name);
    expect(h.map(x => [x.name, x.spiel])).toEqual([['H1', 9], ['G2', 5], ['G7', null]]);
    expect(h[0].seite).toBe('heim');
  });

  it('gleiche Einträge bekommen verschiedene Kennungen; Unbekanntes und leere Werte fallen weg', () => {
    const h = highlightsZuordnen([
      { side: 'home', slot: 2, type: 'high_finish', value: 100 },
      { side: 'home', slot: 2, type: 'high_finish', value: 100 },
      { side: 'home', slot: 2, type: 'quatsch', value: 3 },
      { side: 'home', slot: 2, type: '171', value: null },
    ], [], name);
    expect(h.map(x => x.id)).toEqual(['home:2:high_finish:100:1', 'home:2:high_finish:100:2']);
  });

  it('Kurztext', () => {
    expect(highlightKurz({ typ: '180', wert: 1 })).toBe('🎯 180');
    expect(highlightKurz({ typ: '180', wert: 2 })).toBe('🎯 2× 180');
    expect(highlightKurz({ typ: 'high_finish', wert: 121 })).toBe('💥 High Finish 121');
    expect(highlightKurz({ typ: 'short_leg', wert: 15 })).toBe('⚡ Short Leg 15 Darts');
  });
});

describe('Highlight: festgehaltenes Spiel', () => {
  const g = (game_no: number, home_slot: number | null, legs: [number | null, number | null], home_slot2: number | null = null) =>
    ({ game_no, home_slot, guest_slot: 1, home_slot2, guest_slot2: null, legs_home: legs[0], legs_guest: legs[1] });
  const spiele = [g(2, 1, [2, 0]), g(6, 1, [0, 2]), g(9, 3, [null, null], 1), g(14, 1, [null, null])];

  it('beim Eintragen gespeichertes Spiel bleibt, auch wenn die Person später weiterspielt', () => {
    const h = highlightsZuordnen([{ side: 'home', slot: 1, type: 'high_finish', value: 100, game_no: 2 }], spiele, () => 'X');
    expect(h[0].spiel).toBe(2);
  });

  it('Spiele der Person (inkl. Doppel) und Vorschlag = letztes fertiges, sonst erstes', () => {
    expect(spieleVon(spiele, 'home', 1)).toEqual([2, 6, 9, 14]);
    expect(vorschlagSpiel(spiele, 'home', 1)).toBe(6);
    expect(vorschlagSpiel(spiele, 'home', 3)).toBe(9);
    expect(vorschlagSpiel(spiele, 'home', 7)).toBeNull();
  });
});
