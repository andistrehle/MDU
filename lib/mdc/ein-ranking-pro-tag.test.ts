// Tests: Ein Ranking pro Spieler und Tag (lib/mdc/ein-ranking-pro-tag.ts)
//
// Die Regel gilt laut Turnierleitung ab dem 09.11.2026 („ab sofort"), und der
// Betreiber hat am 11.11.2026 ausdrücklich nachgeschoben, dass ein Ergebnis von
// davor nachtragbar bleiben muss. Genau das prüfen die Fälle unten.
//
// Nur erfundene Daten, kein Datenbank- oder Netzzugriff.

import { describe, expect, it } from 'vitest';
import { REGEL_AB, doppelstarts, type TagTurnier } from './ein-ranking-pro-tag';

const t = (datum: string, spielortId: string, passNummern: number[]): TagTurnier =>
  ({ datum, spielortId, passNummern });

/** Ein Tag vor dem Stichtag und einer danach — beide ein Sonntag/Montag der Saison. */
const DAVOR = '2026-11-08';
const DANACH = '2026-11-09';

describe('Stichtag', () => {
  it('gilt ab dem Tag der Ankündigung', () => {
    expect(REGEL_AB).toBe('2026-11-09');
  });

  it('lässt einen Doppelstart VOR dem Stichtag durch', () => {
    const treffer = doppelstarts(
      [t(DAVOR, 'aubinger-boazn', [146, 220])],
      [t(DAVOR, 'ambasador', [146, 500])],
    );
    expect(treffer).toEqual([]);
  });

  it('meldet denselben Fall AM Stichtag', () => {
    const treffer = doppelstarts(
      [t(DANACH, 'aubinger-boazn', [146, 220])],
      [t(DANACH, 'ambasador', [146, 500])],
    );
    expect(treffer).toEqual([
      { passNr: 146, datum: DANACH, spielorte: ['aubinger-boazn', 'ambasador'] },
    ]);
  });

  it('prüft je Tag, nicht je Stapel: alter Zettel durch, neuer gemeldet', () => {
    const treffer = doppelstarts(
      [t(DAVOR, 'aubinger-boazn', [146]), t(DANACH, 'harlekin', [146])],
      [t(DAVOR, 'ambasador', [146]), t(DANACH, 'ambasador', [146])],
    );
    expect(treffer.map(d => d.datum)).toEqual([DANACH]);
  });
});

describe('Doppelstarts ab dem Stichtag', () => {
  it('findet denselben Spieler auf zwei Zetteln desselben Tages', () => {
    const treffer = doppelstarts([t(DANACH, 'harlekin', [1, 2]), t(DANACH, '70er', [2, 9])], []);
    expect(treffer).toEqual([{ passNr: 2, datum: DANACH, spielorte: ['harlekin', '70er'] }]);
  });

  it('lässt verschiedene Tage in Ruhe', () => {
    expect(doppelstarts([t(DANACH, 'harlekin', [2]), t('2026-11-10', '70er', [2])], [])).toEqual([]);
  });

  it('führt drei Lokale zusammen auf', () => {
    const [treffer] = doppelstarts(
      [t(DANACH, 'a', [4]), t(DANACH, 'b', [4]), t(DANACH, 'c', [4])], [],
    );
    expect(treffer.spielorte).toEqual(['a', 'b', 'c']);
  });

  it('sortiert nach Tag, dann Passnummer', () => {
    const treffer = doppelstarts(
      [t('2026-11-10', 'a', [9, 3]), t(DANACH, 'a', [5])],
      [t('2026-11-10', 'b', [3, 9]), t(DANACH, 'b', [5])],
    );
    expect(treffer.map(d => `${d.datum}/${d.passNr}`)).toEqual([
      '2026-11-09/5', '2026-11-10/3', '2026-11-10/9',
    ]);
  });
});

describe('Was nicht gemeldet werden darf', () => {
  it('dasselbe Turnier erneut hochladen (Berichtigung)', () => {
    expect(doppelstarts([t(DANACH, 'harlekin', [7, 8])], [t(DANACH, 'harlekin', [7, 8, 9])])).toEqual([]);
  });

  it('Berichtigung neben einem fremden Turnier desselben Tages', () => {
    const treffer = doppelstarts(
      [t(DANACH, 'harlekin', [7, 8])],
      [t(DANACH, 'harlekin', [7]), t(DANACH, '70er', [5])],
    );
    expect(treffer).toEqual([]);
  });

  it('ein Doppelstart, der mit dem neuen Zettel nichts zu tun hat', () => {
    const treffer = doppelstarts(
      [t(DANACH, 'harlekin', [999])],
      [t(DANACH, 'ambasador', [146]), t(DANACH, '70er', [146])],
    );
    expect(treffer).toEqual([]);
  });

  it('ohne neue Zettel passiert gar nichts', () => {
    expect(doppelstarts([], [t(DANACH, 'a', [1]), t(DANACH, 'b', [1])])).toEqual([]);
  });
});
