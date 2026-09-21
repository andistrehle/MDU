// ============================================================
// BeDV-Demo — Ligastruktur
// ============================================================
//
// Die Staffelung (Bezirksliga → A → B1/B2 → C1/C2/C3 im Winter, fünf
// C-Staffeln im Sommer) ist die Struktur, die dem Aufbau des BeDV-
// Spielbetriebs entspricht und in der Demo durchgängig getragen wird.
//
// WICHTIG: Sie wurde NICHT von edart-bayern.de ausgelesen — die Seite war
// beim Bauen dieser Demo nicht erreichbar (Netzsperre der Session). Wer die
// Demo mit der echten Staffelung zeigen will, ändert nur diese Datei:
// Mannschaften, Spielpläne, Tabellen und Ranglisten rechnen sich daraus.
// ============================================================

import type { Liga } from './typen';
import { SAISON_AKTUELL, SAISONS } from './saison';

const WINTER = SAISON_AKTUELL.id;
const SOMMER = SAISONS.find(s => s.id === 'sommer-2026')!.id;

export const LIGEN: Liga[] = [
  {
    slug: 'bezirksliga', name: 'Bezirksliga', kurz: 'BL', stufe: 'bezirksliga', ebene: 1,
    saisonId: WINTER,
    beschreibung: 'Die höchste Spielklasse des BeDV. Wer hier oben steht, spielt um den Titel — wer unten steht, um den Klassenerhalt.',
    demo: true,
  },
  {
    slug: 'a-liga', name: 'A-Liga', kurz: 'A', stufe: 'a', ebene: 2,
    saisonId: WINTER,
    beschreibung: 'Unterbau der Bezirksliga. Der Meister steigt auf, die letzten beiden Mannschaften gehen in die B-Ligen.',
    demo: true,
  },
  {
    slug: 'b1', name: 'B1-Liga', kurz: 'B1', stufe: 'b', ebene: 3,
    saisonId: WINTER,
    beschreibung: 'Eine von zwei B-Staffeln. Die beiden Staffelsieger steigen direkt in die A-Liga auf.',
    demo: true,
  },
  {
    slug: 'b2', name: 'B2-Liga', kurz: 'B2', stufe: 'b', ebene: 3,
    saisonId: WINTER,
    beschreibung: 'Zweite B-Staffel, regional westlich geschnitten — kürzere Wege für die Mannschaften aus Schwaben und Oberbayern.',
    demo: true,
  },
  {
    slug: 'c1', name: 'C1-Liga', kurz: 'C1', stufe: 'c', ebene: 4,
    saisonId: WINTER,
    beschreibung: 'Einstiegsklasse für neue Mannschaften. Aufstieg in die B-Ligen über die Staffelsieger.',
    demo: true,
  },
  {
    slug: 'c2', name: 'C2-Liga', kurz: 'C2', stufe: 'c', ebene: 4,
    saisonId: WINTER,
    beschreibung: 'Zweite C-Staffel. Gespielt wird wie in allen Ligen über 18 Einzelspiele je Begegnung.',
    demo: true,
  },
  {
    slug: 'c3', name: 'C3-Liga', kurz: 'C3', stufe: 'c', ebene: 4,
    saisonId: WINTER,
    beschreibung: 'Dritte C-Staffel, überwiegend ost- und niederbayerische Mannschaften.',
    demo: true,
  },

  // ── Sommerliga (abgeschlossen) ──
  {
    slug: 'sommer-c1', name: 'C1-Liga', kurz: 'S-C1', stufe: 'c', ebene: 4,
    saisonId: SOMMER,
    beschreibung: 'Sommerstaffel — kürzere Spielzeit, gespielt von Mai bis August.',
    demo: true,
  },
  {
    slug: 'sommer-c2', name: 'C2-Liga', kurz: 'S-C2', stufe: 'c', ebene: 4,
    saisonId: SOMMER,
    beschreibung: 'Sommerstaffel — kürzere Spielzeit, gespielt von Mai bis August.',
    demo: true,
  },
  {
    slug: 'sommer-c3', name: 'C3-Liga', kurz: 'S-C3', stufe: 'c', ebene: 4,
    saisonId: SOMMER,
    beschreibung: 'Sommerstaffel — kürzere Spielzeit, gespielt von Mai bis August.',
    demo: true,
  },
  {
    slug: 'sommer-c4', name: 'C4-Liga', kurz: 'S-C4', stufe: 'c', ebene: 4,
    saisonId: SOMMER,
    beschreibung: 'Sommerstaffel — kürzere Spielzeit, gespielt von Mai bis August.',
    demo: true,
  },
  {
    slug: 'sommer-c5', name: 'C5-Liga', kurz: 'S-C5', stufe: 'c', ebene: 4,
    saisonId: SOMMER,
    beschreibung: 'Sommerstaffel — kürzere Spielzeit, gespielt von Mai bis August.',
    demo: true,
  },
];

const NACH_SLUG = new Map(LIGEN.map(l => [l.slug, l]));

export function ligaBySlug(slug: string): Liga | undefined {
  return NACH_SLUG.get(slug);
}

export function ligenDerSaison(saisonId: string): Liga[] {
  return LIGEN.filter(l => l.saisonId === saisonId);
}

export const LIGEN_AKTUELL = ligenDerSaison(WINTER);

/** Mannschaften je Staffel. Winter acht, Sommer sechs. */
export function teamsInLiga(slug: string): number {
  return slug.startsWith('sommer-') ? 6 : 8;
}

/** Farbton der Spielklasse — trägt sich durch Abzeichen, Kanten und Tabellen. */
export function ligaFarbe(stufe: Liga['stufe']): string {
  switch (stufe) {
    case 'bezirksliga': return 'var(--bedv-accent)';
    case 'a':           return 'var(--bedv-blue)';
    case 'b':           return 'var(--bedv-teal)';
    default:            return 'var(--bedv-violet)';
  }
}
