// ============================================================
// BeDV-Demo — Highlight-Listen (180er/171er, High Finish, Short Leg)
// ============================================================
//
// Die vier Bestenlisten, die im E-Dart neben der Tabelle zählen. Auf dem
// Papier-Spielbericht werden sie handschriftlich angekreuzt, in dieser Demo
// werden sie aus Spielstärke und Anzahl der Einsätze gerechnet.
//
// ALLES DEMO-WERTE. Sie sind so gebaut, dass sie plausibel aussehen —
// mehr 180er in den oberen Ligen, ein High Finish über 150 als Seltenheit,
// Short Legs ab 12 Darts als absolute Ausnahme. Es sind aber keine
// Ergebnisse echter Spielerinnen und Spieler.
// ============================================================

import { rngOf } from '@/lib/bedv/rng';
import type { HighlightZeile, Highlights } from './typen';
import { spielerDerLiga, staerke } from './spieler';
import { ligaBySlug, LIGEN_AKTUELL } from './ligen';
import { ranglisteDerLiga } from './rangliste';

/** Höhere Ligen werfen mehr Maximum. */
function ligaFaktor(ligaSlug: string): number {
  const ebene = ligaBySlug(ligaSlug)?.ebene ?? 4;
  return [1.0, 1.9, 1.5, 1.2, 1.0][ebene] ?? 1.0;
}

const CACHE = new Map<string, Highlights>();

export function highlightsDerLiga(ligaSlug: string): Highlights {
  const fertig = CACHE.get(ligaSlug);
  if (fertig) return fertig;

  const faktor = ligaFaktor(ligaSlug);
  const rangliste = ranglisteDerLiga(ligaSlug);
  const spieleVon = new Map(rangliste.map(z => [z.spielerId, z.spiele]));

  const hundertachtziger: HighlightZeile[] = [];
  const einhunderteinundsiebzig: HighlightZeile[] = [];
  const highFinish: HighlightZeile[] = [];
  const shortLeg: HighlightZeile[] = [];

  for (const s of spielerDerLiga(ligaSlug)) {
    const rnd = rngOf(`hl:${s.id}`);
    const st = staerke(s.id);
    const spiele = spieleVon.get(s.id) ?? 0;
    if (spiele === 0) continue;

    const basis: Omit<HighlightZeile, 'wert' | 'platz'> = {
      spielerId: s.id, teamId: s.teamId, ligaSlug: s.ligaSlug,
    };

    // 180er: Einsätze × Trefferquote × Ligafaktor, mit Streuung.
    const erwartet = spiele * (0.06 + st * 0.30) * faktor;
    const zahl180 = Math.max(0, Math.round(erwartet * (0.55 + rnd() * 0.95)));
    if (zahl180 > 0) hundertachtziger.push({ ...basis, platz: 0, wert: zahl180 });

    // 171er (drei Triple 19) kommen seltener vor als 180er.
    const zahl171 = Math.max(0, Math.round(zahl180 * (0.18 + rnd() * 0.30)));
    if (zahl171 > 0) einhunderteinundsiebzig.push({ ...basis, platz: 0, wert: zahl171 });

    // Höchstes Finish. Über 140 schafft fast nur, wer auch sonst trifft;
    // 170 („Big Fish") bleibt die absolute Ausnahme.
    const finishRoh = 60 + st * 85 + rnd() * 45;
    const finish = Math.min(170, Math.round(finishRoh));
    if (finish >= 90) highFinish.push({ ...basis, platz: 0, wert: finish });

    // Kürzestes Leg in Darts — kleiner ist besser. 9 Darts gibt es nicht,
    // 12 ist schon eine Ansage.
    const dartsRoh = 22 - st * 7 - rnd() * 3.5;
    const darts = Math.max(12, Math.round(dartsRoh));
    if (darts <= 20) shortLeg.push({ ...basis, platz: 0, wert: darts });
  }

  const fertigeListen: Highlights = {
    hundertachtziger: platziere(hundertachtziger, 'absteigend'),
    einhunderteinundsiebzig: platziere(einhunderteinundsiebzig, 'absteigend'),
    highFinish: platziere(highFinish, 'absteigend'),
    shortLeg: platziere(shortLeg, 'aufsteigend'),
  };
  CACHE.set(ligaSlug, fertigeListen);
  return fertigeListen;
}

/**
 * Sortieren und platzieren — mit echter Gleichplatzierung: Drei Spieler mit
 * je 156 stehen alle auf Platz 1, der nächste auf Platz 4. Alles andere
 * hätte auf einer Bestenliste keinen Bestand.
 */
function platziere(zeilen: HighlightZeile[], richtung: 'aufsteigend' | 'absteigend'): HighlightZeile[] {
  const sortiert = zeilen.sort((a, b) =>
    richtung === 'absteigend' ? b.wert - a.wert : a.wert - b.wert);
  let letzterWert: number | null = null;
  let letzterPlatz = 0;
  sortiert.forEach((z, i) => {
    if (z.wert === letzterWert) { z.platz = letzterPlatz; }
    else { z.platz = i + 1; letzterPlatz = z.platz; letzterWert = z.wert; }
  });
  return sortiert;
}

/** Highlights eines einzelnen Spielers — für sein Profil. */
export function highlightsVonSpieler(spielerId: string, ligaSlug: string): {
  hundertachtziger: number; einhunderteinundsiebzig: number;
  highFinish: number | null; shortLeg: number | null;
} {
  const h = highlightsDerLiga(ligaSlug);
  return {
    hundertachtziger: h.hundertachtziger.find(z => z.spielerId === spielerId)?.wert ?? 0,
    einhunderteinundsiebzig: h.einhunderteinundsiebzig.find(z => z.spielerId === spielerId)?.wert ?? 0,
    highFinish: h.highFinish.find(z => z.spielerId === spielerId)?.wert ?? null,
    shortLeg: h.shortLeg.find(z => z.spielerId === spielerId)?.wert ?? null,
  };
}

/** Bestenlisten über alle laufenden Ligen — für die Startseite. */
export function highlightsGesamt(): Highlights {
  const alle = LIGEN_AKTUELL.map(l => highlightsDerLiga(l.slug));
  return {
    hundertachtziger: platziere(alle.flatMap(h => h.hundertachtziger.map(z => ({ ...z }))), 'absteigend').slice(0, 10),
    einhunderteinundsiebzig: platziere(alle.flatMap(h => h.einhunderteinundsiebzig.map(z => ({ ...z }))), 'absteigend').slice(0, 10),
    highFinish: platziere(alle.flatMap(h => h.highFinish.map(z => ({ ...z }))), 'absteigend').slice(0, 10),
    shortLeg: platziere(alle.flatMap(h => h.shortLeg.map(z => ({ ...z }))), 'aufsteigend').slice(0, 10),
  };
}
