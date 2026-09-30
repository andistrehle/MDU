// ============================================================
// Saison 2026/2027 — vorläufiger Spielplan, Ligen, Teams (öffentlich)
// ============================================================
// Quelle: lib/data/saison-2027.generated.json (erzeugt von
// scripts/mdu-saison-2027-snapshot.ts aus dem Spielplan-Vorschlag + DB).
//
// Die Saison 2025/2026 bleibt unverändert in lib/data (SEASONS 'season-2026')
// und wird öffentlich als ARCHIV gezeigt (Adressen …/2025-26 bzw.
// ?saison=2025-26). Diese Datei ist die einzige Quelle für 2026/27 auf den
// öffentlichen Seiten — Spieltermine sind VORLÄUFIG: feste Spielwochenenden
// (Fr–So), Tag und Uhrzeit machen die TCs in der TC-Sitzung aus.
// ============================================================
import data from './saison-2027.generated.json';
import type { SpielplanData } from '@/lib/spielplan/types';

export const NEUE_SAISON = { id: 'season-2027', name: 'Saison 2026/2027', kurz: '2026/27' } as const;
export const ARCHIV_SAISON = { id: 'season-2026', name: 'Saison 2025/2026', kurz: '2025/26', slug: '2025-26' } as const;

/** Suchparameter/Pfadteil, der auf Detailseiten ins Archiv schaltet. */
export const ARCHIV_PARAM = 'saison';
export const istArchivParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) === ARCHIV_SAISON.slug;

/** TC-Sitzung, in der die genauen Termine festgelegt werden. */
export const TC_SITZUNG = '2026-10-11';
export const VORLAEUFIG_TEXT =
  'Vorläufiger Spielplan: Die Spielwochenenden stehen fest, die genauen Termine (Tag und Uhrzeit) werden in der TC-Sitzung am 11.10.2026 festgelegt.';

/** Reiter der Liga-Seite 2026/27 (hier statt in der Client-Komponente, damit
 *  die Server-Seite ?tab= auflösen kann — aus 'use client'-Dateien kommen nur Komponenten). */
export const TABS_27 = ['Übersicht', 'Tabelle', 'Spielplan', 'Ergebnisse', 'Teams'] as const;

export type Liga27Code = 'la' | 'a' | 'b1' | 'b2' | 'c';
export interface Liga27 {
  code: Liga27Code;
  name: string;
  /** Anzeige-Stufe wie bei den Ligen-Karten (z. B. „B Liga"). */
  tier: string;
  color: string;
  description: string;
  teams: string[];
}
export interface Team27 { id: string; name: string; short: string; color: string; logoUrl: string | null; venueId: string | null; league: Liga27Code }
export interface Venue27 { id: string; name: string; address: string | null }
export interface Spiel27 { home: string; away: string; derby: boolean }
export interface Spieltag27 { nr: number; half: 'hin' | 'rueck'; fri: string; sun: string; games: Spiel27[]; bye: string | null }

const META: Record<Liga27Code, Omit<Liga27, 'code' | 'teams'>> = {
  la: { name: 'La Liga', tier: 'La Liga', color: '#E8B84A', description: 'Höchste Spielklasse der Münchner Dart Union' },
  a:  { name: 'A Liga',  tier: 'A Liga',  color: '#D40000', description: 'Zweithöchste Spielklasse der Münchner Dart Union' },
  b1: { name: 'B1 Liga', tier: 'B Liga',  color: '#3B82F6', description: 'Dritte Spielklasse, Staffel 1' },
  b2: { name: 'B2 Liga', tier: 'B Liga',  color: '#6366F1', description: 'Dritte Spielklasse, Staffel 2' },
  c:  { name: 'C Liga',  tier: 'C Liga',  color: '#10B981', description: 'Vierte Spielklasse der Münchner Dart Union' },
};

type Raw = {
  planGeneratedAt: string;
  skipped: { fri: string; label: string }[];
  leagues: { key: string; teams: string[] }[];
  teams: Record<string, Omit<Team27, 'id' | 'league'> & { league: string }>;
  venues: Record<string, { name: string; address: string | null }>;
  weekends: { fri: string; sun: string }[];
  schedule: Record<string, { nr: number; half: string; weekendIndex: number; bye: string | null; games: Spiel27[] }[]>;
};
const RAW = data as unknown as Raw;

export const LIGEN_2027: Liga27[] = RAW.leagues.map(l => ({ code: l.key as Liga27Code, teams: l.teams, ...META[l.key as Liga27Code] }));

export const findLiga27 = (code: string | null | undefined): Liga27 | undefined =>
  LIGEN_2027.find(l => l.code === (code ?? '').toLowerCase());

export function team27(id: string): Team27 | undefined {
  const t = RAW.teams[id];
  return t ? { ...t, id, league: t.league as Liga27Code } : undefined;
}
export const alleTeams27 = (): Team27[] => Object.keys(RAW.teams).map(id => team27(id)!);

export function venue27(id: string | null | undefined): Venue27 | undefined {
  const v = id ? RAW.venues[id] : undefined;
  return v ? { id: id!, ...v } : undefined;
}
export const alleVenues27 = (): Venue27[] => Object.keys(RAW.venues).map(id => venue27(id)!);

export function spieltage27(code: Liga27Code): Spieltag27[] {
  return (RAW.schedule[code] ?? [])
    .map(m => ({ nr: m.nr, half: m.half as 'hin' | 'rueck', fri: RAW.weekends[m.weekendIndex].fri, sun: RAW.weekends[m.weekendIndex].sun, games: m.games, bye: m.bye }))
    .sort((a, b) => a.nr - b.nr);
}

export interface TeamSpiel27 { spieltag: number; half: 'hin' | 'rueck'; fri: string; sun: string; heim: boolean; gegner: string; derby: boolean }
/** Alle Spiele eines Teams in zeitlicher Reihenfolge; Spieltage mit Freilos als `gegner: ''`. */
export function spieleFuerTeam27(teamId: string): TeamSpiel27[] {
  const t = team27(teamId);
  if (!t) return [];
  return spieltage27(t.league).map(md => {
    const g = md.games.find(x => x.home === teamId || x.away === teamId);
    return g
      ? { spieltag: md.nr, half: md.half, fri: md.fri, sun: md.sun, heim: g.home === teamId, gegner: g.home === teamId ? g.away : g.home, derby: g.derby }
      : { spieltag: md.nr, half: md.half, fri: md.fri, sun: md.sun, heim: false, gegner: '', derby: false };
  });
}

/** Heutiges Datum in München als ISO (YYYY-MM-DD). */
const heuteMuenchen = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());

/** Nächstes Spielwochenende (ab heute, Sonntag eingeschlossen) mit allen Spielen
 *  aller Ligen — für die Startseite. null nach Saisonende. */
export function naechstesWochenende27(heute = heuteMuenchen()): { fri: string; sun: string; spiele: { liga: Liga27; spiel: Spiel27 }[] } | null {
  const w = RAW.weekends.find(x => x.sun >= heute);
  if (!w) return null;
  // Reihum über die Ligen (La, A, B1, B2, C, La, …), damit schon die ersten
  // Karten der Startseite (am Handy nur drei) mehrere Ligen zeigen.
  const jeLiga = LIGEN_2027.map(liga => spieltage27(liga.code)
    .filter(md => md.fri === w.fri)
    .flatMap(md => md.games.map(spiel => ({ liga, spiel }))));
  const spiele: { liga: Liga27; spiel: Spiel27 }[] = [];
  for (let i = 0; jeLiga.some(l => i < l.length); i++) for (const l of jeLiga) if (l[i]) spiele.push(l[i]);
  return { fri: w.fri, sun: w.sun, spiele };
}

/** Erstes/letztes Spielwochenende der Saison (alle Ligen gleich). */
export const SAISON_START = RAW.weekends[0].fri;
export const SAISON_ENDE = RAW.weekends[RAW.weekends.length - 1].sun;

// ── Datumsanzeige ────────────────────────────────────────────
const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const d = (iso: string) => new Date(iso + 'T12:00:00Z');
/** „23.–25.10.2026" bzw. über den Monatswechsel „30.10.–1.11.2026". */
export function wochenendeText(fri: string, sun: string, mitJahr = true): string {
  const a = d(fri), b = d(sun);
  const jahr = mitJahr ? String(b.getUTCFullYear()) : '';
  return a.getUTCMonth() === b.getUTCMonth()
    ? `${a.getUTCDate()}.–${b.getUTCDate()}.${b.getUTCMonth() + 1}.${jahr}`
    : `${a.getUTCDate()}.${a.getUTCMonth() + 1}.–${b.getUTCDate()}.${b.getUTCMonth() + 1}.${jahr}`;
}
/** „Fr 23.10.2026" */
export const datumText = (iso: string) => { const x = d(iso); return `${WOCHENTAG[x.getUTCDay()]} ${x.getUTCDate()}.${x.getUTCMonth() + 1}.${x.getUTCFullYear()}`; };

/**
 * Spielplan im Format der Druckvorlagen (lib/spielplan/printing.ts), aber mit
 * Team- und Lokalnamen aus der DB (Momentaufnahme) statt der Generator-Namen —
 * damit Ausdruck und Webseite dieselben Namen zeigen (z. B. „Zur flotten Biene").
 */
export function spielplanDaten27(): SpielplanData {
  const nm = (id: string | null) => (id ? (RAW.teams[id]?.name ?? id) : null);
  const ort = (id: string) => venue27(RAW.teams[id]?.venueId)?.name ?? '';
  const schedule: SpielplanData['schedule'] = {};
  for (const [key, mds] of Object.entries(RAW.schedule)) {
    schedule[key] = mds.map(m => ({
      nr: m.nr, half: m.half as 'hin' | 'rueck', weekendIndex: m.weekendIndex, bye: nm(m.bye),
      games: m.games.map(g => ({ home: nm(g.home)!, away: nm(g.away)!, venue: ort(g.home), derby: g.derby })),
    }));
  }
  return {
    generatedAt: RAW.planGeneratedAt,
    leagues: LIGEN_2027.map(l => ({ key: l.code, label: l.name, teams: l.teams.map(id => ({ name: nm(id)!, venue: ort(id) })) })),
    schedule,
    weekends: RAW.weekends,
    skipped: RAW.skipped,
    maxMatchday: Math.max(...Object.values(RAW.schedule).map(x => x.length)),
    venueClusterObjective: 0,
  };
}
