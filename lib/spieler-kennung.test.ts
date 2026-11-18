import { describe, expect, it } from 'vitest';
import { betroffen, nameTeilen, namensSlug, neueKennung } from './spieler-kennung';

describe('Spieler-Kennung', () => {
  it('Namens-Slug: Umlaute, ß, Akzente, Sonderzeichen', () => {
    expect(namensSlug('Jörg Müller-Lüdenscheidt')).toBe('jorg-muller-ludenscheidt');
    expect(namensSlug('René  Weiß')).toBe('rene-weiss');
    expect(namensSlug("  D'Angelo, Marco ")).toBe('d-angelo-marco');
  });

  it('neue Kennung behält die angehängte Passnummer', () => {
    expect(neueKennung('wolfgang-linprunner-2009', 'Wolfgang', 'Limbrunner')).toBe('wolfgang-limbrunner-2009');
    expect(neueKennung('irini-karagkiozdis-6511', 'Irini', 'Karagkiozidis')).toBe('irini-karagkiozidis-6511');
  });

  it('ohne Nummer am Ende bleibt es beim reinen Namen; kurze Zahlen im Namen sind keine Passnummer', () => {
    expect(neueKennung('athanasios-karagkiozdis', 'Athanasios', 'Karagkiozidis')).toBe('athanasios-karagkiozidis');
    expect(neueKennung('max-muster-2', 'Max', 'Muster')).toBe('max-muster');
    expect(neueKennung('x', '', '')).toBe('spieler');
  });

  it('Name teilen: letztes Wort ist der Nachname', () => {
    expect(nameTeilen(' Hans  Peter Maier ')).toEqual({ vorname: 'Hans Peter', nachname: 'Maier' });
    expect(nameTeilen('Limo')).toEqual({ vorname: 'Limo', nachname: '' });
    expect(nameTeilen('')).toEqual({ vorname: '', nachname: '' });
  });

  it('betroffene Zeilen zusammenzählen', () => {
    expect(betroffen({ a: 1, b: 0, c: 3 })).toEqual({ tabellen: 2, zeilen: 4 });
    expect(betroffen({})).toEqual({ tabellen: 0, zeilen: 0 });
  });
});
