import { describe, expect, it } from 'vitest';
import { dbFehler } from './db-fehler';

describe('dbFehler', () => {
  it('doppelte Passnummer im Kader → Deutsch', () => {
    expect(dbFehler('duplicate key value violates unique constraint "sra_season_license_uniq"')).toMatch(/^Diese Passnummer ist schon vergeben/);
    expect(dbFehler('duplicate key value violates unique constraint "players_license_uniq"')).toMatch(/^Diese Passnummer ist schon vergeben/);
  });
  it('anderes Doppeltes allgemein', () => {
    expect(dbFehler('duplicate key value violates unique constraint "foo_pkey"')).toBe('Diesen Eintrag gibt es schon (doppelt).');
  });
  it('Unbekanntes bleibt, leer bleibt leer', () => {
    expect(dbFehler('Bitte einen Namen angeben.')).toBe('Bitte einen Namen angeben.');
    expect(dbFehler(null)).toBeNull();
    expect(dbFehler(undefined)).toBeNull();
  });
});
