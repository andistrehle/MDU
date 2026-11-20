import { describe, it, expect } from 'vitest';
import { glatt, treffer, suche, type SuchEintrag } from './suche';

const idx: SuchEintrag[] = [
  { art: 'team', t: "Dart's Vaders", u: 'B1 Liga · Aubinger Boazn', h: '/teams/darts-vaders', k: 'DV' },
  { art: 'team', t: 'Freibad Bazis', u: 'A Liga · Fiaker Stüberl', h: '/teams/freibad-bazis' },
  { art: 'spieler', t: 'Stefan Böhme', u: 'Freibad Bazis · A Liga', h: '/spieler/stefan-boehme' },
  { art: 'spieler', t: 'Stefan Böhme', u: 'Archiv 2025/26', h: '/spieler/stefan-boehme-alt', archiv: true },
  { art: 'spieler', t: 'Anna Bazinger', u: 'Gambas · La Liga', h: '/spieler/anna-bazinger' },
  { art: 'ort', t: 'Aubinger Boazn', u: 'Limesstraße 1', h: '/spielstaetten/aubinger-boazn' },
  { art: 'faq', t: 'Wie setze ich mein Passwort zurück?', h: '/faq#passwort-vergessen', k: 'login kennwort' },
];

describe('glatt', () => {
  it('Umlaute, Apostroph und Großschreibung spielen keine Rolle', () => {
    expect(glatt("Dart's Väders")).toBe('darts vaders');
    expect(glatt('Böhme')).toBe('bohme');
    expect(glatt('  Fiaker-Stüberl ')).toBe('fiaker stuberl');
  });
});

describe('treffer', () => {
  it('unter zwei Zeichen findet nichts', () => { expect(treffer(idx[1], 'f')).toBe(0); });
  it('Titelanfang 100, Wortanfang 70, mitten im Titel 50, nur zweite Zeile/Suchwörter 20', () => {
    expect(treffer(idx[1], 'frei')).toBe(100);
    expect(treffer(idx[1], 'bazis')).toBe(70);
    expect(treffer(idx[1], 'azis')).toBe(50);
    expect(treffer(idx[1], 'fiaker')).toBe(20);
    expect(treffer(idx[6], 'kennwort')).toBe(20);
  });
  it('jedes Wort muss vorkommen', () => {
    expect(treffer(idx[2], 'stefan bohme')).toBe(100);
    expect(treffer(idx[2], 'bohme stefan')).toBe(70);
    expect(treffer(idx[2], 'stefan bazis')).toBe(20);
    expect(treffer(idx[2], 'stefan gambas')).toBe(0);
  });
  it('Archiv-Spieler stehen bei gleichem Namen hinter den aktuellen', () => {
    expect(treffer(idx[3], 'stefan')).toBe(95);
  });
});

describe('suche', () => {
  it('gruppiert nach Art, beste Gruppe zuerst', () => {
    const r = suche(idx, 'bazi');
    // „Bazinger“ und „Bazis“ sind beide Wortanfang (70) → Gleichstand, also Teams vor Spielern
    expect(r.map(g => g.art)).toEqual(['team', 'spieler']);
    // Der aktuelle Stefan Böhme passt über sein Team (zweite Zeile), der aus dem Archiv gar nicht.
    expect(r[1].eintraege.map(e => e.h)).toEqual(['/spieler/anna-bazinger', '/spieler/stefan-boehme']);
  });
  it('gleicher Name: der aktuelle Spieler vor dem aus dem Archiv', () => {
    const r = suche(idx, 'stefan');
    expect(r[0].eintraege.map(e => !!e.archiv)).toEqual([false, true]);
  });
  it('„boazn“ findet das Lokal vor dem Team, das dort spielt', () => {
    const r = suche(idx, 'boazn');
    expect(r.map(g => g.art)).toEqual(['ort', 'team']);
  });
  it('begrenzt je Gruppe und zählt den Rest', () => {
    const viele: SuchEintrag[] = Array.from({ length: 9 }, (_, i) => ({ art: 'spieler', t: `Max Muster ${i}`, h: `/spieler/${i}` }));
    const r = suche(viele, 'max', 6);
    expect(r[0].eintraege).toHaveLength(6);
    expect(r[0].mehr).toBe(3);
  });
  it('leere Eingabe: nichts', () => { expect(suche(idx, ' ')).toEqual([]); });
});
