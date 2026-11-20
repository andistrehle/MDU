import { describe, it, expect } from 'vitest';
import { naechstesUndLetztes, type TeamSpielKurz } from './dein-team';

const s = (key: string, heim: boolean, gegner: string, datum: string, spieltag: number): TeamSpielKurz => ({ key, heim, gegner, datum, uhrzeit: '20:00', spieltag });

describe('naechstesUndLetztes', () => {
  const spiele = [
    s('wir|a', true, 'a', '2026-10-23', 1),
    s('b|wir', false, 'b', '2026-11-13', 2),
    s('wir|c', true, 'c', '2026-11-21', 3),
    s('d|wir', false, 'd', '2026-11-27', 4),
    s('', false, '', '2026-12-04', 5),             // spielfrei
  ];
  it('nimmt das früheste offene Spiel ab heute und das jüngste Ergebnis, aus Sicht des Teams', () => {
    const r = naechstesUndLetztes(spiele, { 'wir|a': { spieleHome: 8, spieleAway: 10 }, 'b|wir': { spieleHome: 12, spieleAway: 6 } }, '2026-11-20');
    expect(r.naechstes?.key).toBe('wir|c');
    expect(r.letztes?.key).toBe('b|wir');
    expect(r.letztes?.eigen).toBe(6);      // auswärts: Gast-Spiele sind die eigenen
    expect(r.letztes?.fremd).toBe(12);
  });
  it('das Spiel von heute ist noch das nächste', () => {
    expect(naechstesUndLetztes(spiele, {}, '2026-11-21').naechstes?.key).toBe('wir|c');
  });
  it('ein vergangenes Spiel ohne Ergebnis ist weder nächstes noch letztes', () => {
    const r = naechstesUndLetztes(spiele, {}, '2026-11-22');
    expect(r.naechstes?.key).toBe('d|wir');
    expect(r.letztes).toBeNull();
  });
  it('ein vorgezogenes, schon gespieltes Spiel zählt als letztes (Datum des Ergebnisses gilt)', () => {
    const r = naechstesUndLetztes(spiele, { 'wir|a': { spieleHome: 9, spieleAway: 9 }, 'd|wir': { spieleHome: 4, spieleAway: 14, datum: '2026-11-05' } }, '2026-11-06');
    expect(r.letztes?.key).toBe('d|wir');
    expect(r.letztes?.eigen).toBe(14);
    expect(r.naechstes?.key).toBe('b|wir');
  });
  it('Saison vorbei: kein nächstes Spiel; Wertung und unbestätigt werden durchgereicht', () => {
    const r = naechstesUndLetztes([spiele[0]], { 'wir|a': { spieleHome: 0, spieleAway: 3, wertung: 'home_no_show', bestaetigt: false } }, '2027-06-01');
    expect(r.naechstes).toBeNull();
    expect(r.letztes?.wertung).toBe(true);
    expect(r.letztes?.bestaetigt).toBe(false);
  });
});
