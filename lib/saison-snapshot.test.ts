import { describe, expect, it } from 'vitest';
import { baueSnapshot, unterschiede, type Plan, type TeamZeile } from './saison-snapshot';

const plan: Plan = {
  generatedAt: '2026-09-01', weekends: [], skipped: [],
  leagues: [{ key: 'b1', label: 'B1 Liga', teams: [{ name: "Dart's Vaders" }, { name: 'Gambas' }] }],
  schedule: { b1: [{ nr: 1, half: 'hin', weekendIndex: 0, bye: null, games: [{ home: "Dart's Vaders", away: 'Gambas', derby: false }] }] },
};
const zeile = (id: string, name: string, lokal: [string, string] | null, logo: string | null = null, kurz: string | null = null): TeamZeile => ({
  team_id: id, assigned_competition_id: 'b_liga', teams: { name, short_name: kurz, logo_url: logo },
  venues: lokal ? { id: lokal[0], name: lokal[1], address: null } : null,
});
const bau = (zeilen: TeamZeile[], vorher: Parameters<typeof baueSnapshot>[0]['vorher'] = null, profilLogo = new Map<string, string>()) =>
  baueSnapshot({ seasonId: 'season-2027', plan, zeilen, profilLogo, stamm: [{ id: 'gambas', short: 'GAM', color: '#111111' }], vorher, jetzt: '2026-11-18T12:00:00Z' });

describe('Momentaufnahme Saison', () => {
  const alt = bau([zeile('vaders', "Dart's Vaders", ['v-amb', 'Ambassador'], null, 'DVS'), zeile('gambas', 'Gambas', ['v-amb', 'Ambassador'])]);

  it('Plan-Namen werden zu Team-Kennungen; Farbe/Kürzel aus dem festen Stamm, sonst Vorgabe', () => {
    expect(alt.schedule.b1[0].games[0]).toEqual({ home: 'vaders', away: 'gambas', derby: false });
    expect(alt.leagues[0].teams).toEqual(['vaders', 'gambas']);
    expect(alt.teams.gambas).toMatchObject({ short: 'GAM', color: '#111111', venueId: 'v-amb', league: 'b1' });
    expect(alt.teams.vaders).toMatchObject({ short: 'DVS', color: '#6B7A8F' });
  });

  it('Logo: Profil vor Team, leeres Feld zählt nicht, sonst bleibt das bisherige (beigelegte Datei)', () => {
    const vorher = { teams: { ...alt.teams, gambas: { ...alt.teams.gambas, logoUrl: '/team-logos/gambas.png' } } };
    const neu = bau([zeile('vaders', "Dart's Vaders", null, 'team.webp'), zeile('gambas', 'Gambas', null, '')], vorher, new Map([['vaders', 'profil.webp']]));
    expect(neu.teams.vaders.logoUrl).toBe('profil.webp');
    expect(neu.teams.gambas.logoUrl).toBe('/team-logos/gambas.png');
    expect(bau([zeile('vaders', "Dart's Vaders", null), zeile('gambas', 'Gambas', null, '')]).teams.gambas.logoUrl).toBeNull();
  });

  it('wirft bei nicht eindeutigem Team, falscher Liga oder Team ohne Plan', () => {
    expect(() => bau([zeile('gambas', 'Gambas', null)])).toThrow(/Dart's Vaders.*0 Treffer/);
    expect(() => bau([zeile('vaders', "Dart's Vaders", null), zeile('gambas', 'Gambas', null), zeile('x', 'Neue Truppe', null)])).toThrow(/fehlen im Plan: Neue Truppe/);
    expect(() => bau([{ ...zeile('vaders', "Dart's Vaders", null), assigned_competition_id: 'a_liga' }, zeile('gambas', 'Gambas', null)])).toThrow(/Plan b1, DB a_liga/);
  });

  it('Unterschiede in Worten: Lokalwechsel, Kürzel, Logo, Name — ohne Änderung leer', () => {
    expect(unterschiede(alt, alt)).toEqual([]);
    const neu = bau([zeile('vaders', "Dart's Vaders", ['v-aub', 'Aubinger Boazn'], 'neu.webp', 'DV'), zeile('gambas', 'Gambas', ['v-amb', 'Ambassador'])], alt);
    expect(unterschiede(alt, neu)).toEqual([
      "Dart's Vaders: Lokal Ambassador → Aubinger Boazn",
      "Dart's Vaders: Kürzel DVS → DV",
      "Dart's Vaders: neues Logo",
    ]);
  });
});
