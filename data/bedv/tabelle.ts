// ============================================================
// BeDV-Demo — Ligatabellen
// ============================================================
//
// Die Tabelle wird aus den Ergebnissen GERECHNET, nie abgelegt. Das ist
// nicht nur sauberer, es ist in einer Demo entscheidend: Wer im Gespräch ein
// Ergebnis anschaut und danach die Tabelle öffnet, findet dort genau diese
// Zahl wieder. Eine abgetippte Tabelle würde beim ersten Nachrechnen
// auseinanderfallen.
//
// Wertung: Sieg 2 Punkte, Unentschieden (9:9) 1 Punkt, Niederlage 0.
// Bei Punktgleichheit entscheidet die Differenz der gewonnenen Einzelspiele,
// danach die Zahl der gewonnenen Einzelspiele, zuletzt der Name.
// ============================================================

import type { Begegnung, TabellenZeile } from './typen';
import { begegnungenDerLiga } from './spiele';
import { teamById, teamsDerLiga } from './teams';

export function tabelleDerLiga(ligaSlug: string, bisSpieltag?: number): TabellenZeile[] {
  const teams = teamsDerLiga(ligaSlug);
  const zeilen = new Map<string, TabellenZeile>();
  for (const t of teams) {
    zeilen.set(t.id, {
      platz: 0, teamId: t.id, spiele: 0, siege: 0, unentschieden: 0, niederlagen: 0,
      spieleFuer: 0, spieleGegen: 0, differenz: 0, punkte: 0, form: [],
    });
  }

  const gespielt = begegnungenDerLiga(ligaSlug)
    .filter(b => b.status === 'gespielt' && (bisSpieltag === undefined || b.spieltag <= bisSpieltag))
    .sort((a, b) => a.spieltag - b.spieltag);

  for (const b of gespielt) {
    verbuche(zeilen.get(b.heimTeamId), b.heimPunkte, b.gastPunkte);
    verbuche(zeilen.get(b.gastTeamId), b.gastPunkte, b.heimPunkte);
  }

  const sortiert = [...zeilen.values()].sort((a, b) =>
    b.punkte - a.punkte
    || b.differenz - a.differenz
    || b.spieleFuer - a.spieleFuer
    || (teamById(a.teamId)?.name ?? '').localeCompare(teamById(b.teamId)?.name ?? '', 'de'));

  sortiert.forEach((z, i) => {
    z.platz = i + 1;
    // Form: die fünf jüngsten Ergebnisse, neuestes zuerst.
    z.form = z.form.slice(-5).reverse();
  });
  return sortiert;
}

function verbuche(z: TabellenZeile | undefined, fuer: number, gegen: number): void {
  if (!z) return;
  z.spiele++;
  z.spieleFuer += fuer;
  z.spieleGegen += gegen;
  z.differenz = z.spieleFuer - z.spieleGegen;
  if (fuer > gegen)      { z.siege++;        z.punkte += 2; z.form.push('S'); }
  else if (fuer < gegen) { z.niederlagen++;                 z.form.push('N'); }
  else                   { z.unentschieden++; z.punkte += 1; z.form.push('U'); }
}

/** Tabellenzeile einer einzelnen Mannschaft — für das Mannschaftsprofil. */
export function tabellenZeileVon(teamId: string): TabellenZeile | undefined {
  const team = teamById(teamId);
  if (!team) return undefined;
  return tabelleDerLiga(team.ligaSlug).find(z => z.teamId === teamId);
}

/**
 * Wie viele Spieltage sind in dieser Liga gespielt? Steht über jeder Tabelle,
 * damit niemand eine Momentaufnahme für den Endstand hält.
 */
export function gespielteSpieltage(ligaSlug: string): number {
  const gespielt = begegnungenDerLiga(ligaSlug).filter(b => b.status === 'gespielt');
  return gespielt.reduce((max, b) => Math.max(max, b.spieltag), 0);
}

export function spieltageGesamt(ligaSlug: string): number {
  return begegnungenDerLiga(ligaSlug).reduce((max, b) => Math.max(max, b.spieltag), 0);
}

/** Begegnungen nach Spieltagen gebündelt — Grundlage der Spielplan-Ansicht. */
export function nachSpieltagen(begegnungen: Begegnung[]): { spieltag: number; spiele: Begegnung[] }[] {
  const map = new Map<number, Begegnung[]>();
  for (const b of begegnungen) {
    const liste = map.get(b.spieltag);
    if (liste) liste.push(b); else map.set(b.spieltag, [b]);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([spieltag, spiele]) => ({ spieltag, spiele }));
}
