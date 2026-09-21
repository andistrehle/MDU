// ============================================================
// BeDV-Demo — Rollen für den Demo-Login
// ============================================================
//
// Es gibt KEINE Anmeldung. Der „Demo-Login" wählt nur eine Rolle aus und
// legt sie im Browser ab (`localStorage`) — kein Passwort, kein Konto, kein
// Server, kein Cookie. Beim Vorführen lässt sich damit in zwei Klicks die
// Perspektive wechseln, und genau das ist der Zweck.
//
// Jede Rolle hängt an einer Mannschaft aus den Demo-Daten, damit „Mein
// Team", „Meine Liga" und „Nächstes Spiel" echte Seiten öffnen statt
// Platzhalter zu zeigen.
// ============================================================

import type { DemoRolle } from './typen';
import { kaderVon, kapitaenVon } from './spieler';
import { teamById } from './teams';

/** Die Mannschaft, mit der die Demo arbeitet. Liegt in der B1-Liga. */
export const DEMO_TEAM_ID = 'ghost-darts';

export interface DemoKonto {
  rolle: DemoRolle;
  /** Was auf der Auswahlkarte steht. */
  titel: string;
  untertitel: string;
  /** Wofür diese Rolle im Gespräch steht. */
  beschreibung: string;
  /** Was diese Rolle zusätzlich darf. */
  kann: string[];
  /** Auf welchen Spieler die Rolle zeigt (Ligaleitung/Admin: keiner). */
  spielerId: string | null;
  teamId: string | null;
}

function spielerDerRolle(rolle: DemoRolle): string | null {
  const kader = kaderVon(DEMO_TEAM_ID);
  if (kader.length === 0) return null;
  if (rolle === 'kapitaen') return kapitaenVon(DEMO_TEAM_ID)?.id ?? kader[0].id;
  if (rolle === 'spieler') return kader.find(s => !s.kapitaen)?.id ?? kader[0].id;
  return null;
}

export const DEMO_KONTEN: DemoKonto[] = [
  {
    rolle: 'spieler',
    titel: 'Spieler',
    untertitel: 'Kader Ghost Darts · B1-Liga',
    beschreibung:
      'Die Sicht der meisten Mitglieder: eigene Statistik, nächstes Spiel, Tabelle der '
      + 'eigenen Liga — ohne etwas verwalten zu müssen.',
    kann: ['Eigene Statistik und Highlights', 'Nächstes Spiel und Anfahrt', 'Mannschaft und Liga im Blick'],
    spielerId: spielerDerRolle('spieler'),
    teamId: DEMO_TEAM_ID,
  },
  {
    rolle: 'kapitaen',
    titel: 'Teamkapitän',
    untertitel: 'Ghost Darts · B1-Liga',
    beschreibung:
      'Die wichtigste Rolle für den Verband: Wer hier arbeitet, spart der Ligaleitung '
      + 'jede Woche Rückfragen. Kader, Meldung und Spielbericht in einer Hand.',
    kann: [
      'Kader verwalten und Spieler nachmelden',
      'Mannschaft für die Saison melden',
      'Spielbericht erfassen oder Papierbogen hochladen',
    ],
    spielerId: spielerDerRolle('kapitaen'),
    teamId: DEMO_TEAM_ID,
  },
  {
    rolle: 'ligaleitung',
    titel: 'Ligaleitung',
    untertitel: 'Winterliga 2026/27',
    beschreibung:
      'Die Gegenseite des Kapitäns: Meldungen prüfen, Spielberichte freigeben, '
      + 'Spielerverwaltung. Hier wird sichtbar, dass nicht nur die Homepage besser wird.',
    kann: [
      'Mannschaftsmeldungen freigeben, zurückweisen oder Nachbesserung anfordern',
      'Eingereichte Spielberichte prüfen',
      'Spielerverwaltung und Beiträge',
    ],
    spielerId: null,
    teamId: null,
  },
  {
    rolle: 'admin',
    titel: 'Administration',
    untertitel: 'Verbandsweit',
    beschreibung:
      'Alles, was die Ligaleitung kann — zusätzlich Staffeln, Spielstätten und Zugänge. '
      + 'In der Demo als Ausblick enthalten.',
    kann: ['Staffeln und Spielpläne', 'Spielstätten und Automaten', 'Rollen und Zugänge'],
    spielerId: null,
    teamId: null,
  },
];

export function kontoVon(rolle: DemoRolle): DemoKonto {
  return DEMO_KONTEN.find(k => k.rolle === rolle) ?? DEMO_KONTEN[0];
}

export function demoTeam() {
  return teamById(DEMO_TEAM_ID);
}

/** Rollen, die Verwaltungsaufgaben sehen. */
export function istVerwaltung(rolle: DemoRolle): boolean {
  return rolle === 'ligaleitung' || rolle === 'admin';
}
