// ============================================================
// BeDV-Demo — Einzelrangliste
// ============================================================
//
// Ebenfalls gerechnet: Ein Durchgang über alle gespielten Begegnungen einer
// Liga, dabei werden die 18 Einzelspiele je Begegnung erzeugt und je Spieler
// verbucht. Dadurch stimmen Rangliste, Tabelle und Spielbericht zwingend
// überein — es gibt nur eine Quelle.
//
// Punkte: 2 je gewonnenem Spiel, 1 je gewonnenem Leg in einem verlorenen
// Spiel. So steht am Ende nicht nur oben, wer viel gewinnt, sondern auch,
// wer knapp verliert — genau die Abstufung, die eine Einzelwertung braucht.
//
// Doppel zählen für BEIDE beteiligten Spieler. Das entspricht der Praxis im
// E-Dart: Wer im Doppel gewinnt, hat gewonnen.
// ============================================================

import type { RanglistenZeile } from './typen';
import { begegnungenDerLiga, einzelspieleVon } from './spiele';
import { spielerById, spielerDerLiga } from './spieler';
import { LIGEN_AKTUELL } from './ligen';

interface Konto {
  spiele: number; siege: number; niederlagen: number;
  legsFuer: number; legsGegen: number; punkte: number;
}

function leeresKonto(): Konto {
  return { spiele: 0, siege: 0, niederlagen: 0, legsFuer: 0, legsGegen: 0, punkte: 0 };
}

const CACHE = new Map<string, RanglistenZeile[]>();

export function ranglisteDerLiga(ligaSlug: string): RanglistenZeile[] {
  const fertig = CACHE.get(ligaSlug);
  if (fertig) return fertig;

  const konten = new Map<string, Konto>();
  for (const s of spielerDerLiga(ligaSlug)) konten.set(s.id, leeresKonto());

  for (const b of begegnungenDerLiga(ligaSlug)) {
    if (b.status !== 'gespielt') continue;
    for (const spiel of einzelspieleVon(b)) {
      const heimGewinnt = spiel.heimLegs > spiel.gastLegs;
      for (const id of spiel.heimSpielerIds) {
        verbuche(konten.get(id), heimGewinnt, spiel.heimLegs, spiel.gastLegs);
      }
      for (const id of spiel.gastSpielerIds) {
        verbuche(konten.get(id), !heimGewinnt, spiel.gastLegs, spiel.heimLegs);
      }
    }
  }

  const zeilen: RanglistenZeile[] = [...konten.entries()].map(([spielerId, k]) => {
    const s = spielerById(spielerId)!;
    return {
      platz: 0,
      spielerId,
      teamId: s.teamId,
      ligaSlug: s.ligaSlug,
      spiele: k.spiele,
      siege: k.siege,
      niederlagen: k.niederlagen,
      legsFuer: k.legsFuer,
      legsGegen: k.legsGegen,
      quote: k.spiele === 0 ? 0 : Math.round((k.siege / k.spiele) * 100),
      punkte: k.punkte,
    };
  });

  zeilen.sort((a, b) =>
    b.punkte - a.punkte
    || b.siege - a.siege
    || (b.legsFuer - b.legsGegen) - (a.legsFuer - a.legsGegen)
    || (spielerById(a.spielerId)?.name ?? '').localeCompare(spielerById(b.spielerId)?.name ?? '', 'de'));
  zeilen.forEach((z, i) => { z.platz = i + 1; });

  CACHE.set(ligaSlug, zeilen);
  return zeilen;
}

function verbuche(k: Konto | undefined, gewonnen: boolean, legsFuer: number, legsGegen: number): void {
  if (!k) return;
  k.spiele++;
  k.legsFuer += legsFuer;
  k.legsGegen += legsGegen;
  if (gewonnen) { k.siege++; k.punkte += 2; }
  else          { k.niederlagen++; k.punkte += legsFuer; }
}

/** Die Ranglistenzeile eines Spielers — für sein Profil. */
export function ranglistenZeileVon(spielerId: string): RanglistenZeile | undefined {
  const s = spielerById(spielerId);
  if (!s) return undefined;
  return ranglisteDerLiga(s.ligaSlug).find(z => z.spielerId === spielerId);
}

/** Rangliste einer Mannschaft — nach Ligaplatzierung geordnet. */
export function ranglisteDesTeams(teamId: string, ligaSlug: string): RanglistenZeile[] {
  return ranglisteDerLiga(ligaSlug).filter(z => z.teamId === teamId);
}

/** Die stärksten Spieler der laufenden Saison, quer über alle Ligen. */
export function topSpielerGesamt(anzahl: number): RanglistenZeile[] {
  return LIGEN_AKTUELL
    .flatMap(l => ranglisteDerLiga(l.slug))
    .sort((a, b) => b.punkte - a.punkte || b.quote - a.quote)
    .slice(0, anzahl);
}
