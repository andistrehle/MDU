// ============================================================
// BeDV-Demo — Verbandspokal
// ============================================================
//
// Der Pokal läuft quer zu den Ligen: 16 Mannschaften aus allen Spielklassen,
// K.-o., Hin- und Rückspiel bis einschließlich Halbfinale, das Finale an
// einem neutralen Ort. Genau das macht ihn für eine Plattform interessant —
// eine Tabelle kann er nicht abbilden, ein Turnierbaum schon.
//
// Stand der Demo: Achtel- und Viertelfinale sind gespielt, im Halbfinale
// liegt das Hinspiel vor, das Rückspiel steht an. Das Finale ist terminiert,
// aber noch ohne Teilnehmer — so ist jeder Zustand, den ein Turnierbaum
// kennt, im Gespräch einmal sichtbar.
//
// ALLES DEMO. Weder Teilnehmerfeld noch Ergebnisse stammen vom BeDV.
// ============================================================

import { rngOf, intBetween } from '@/lib/bedv/rng';
import { heute, plusTage, type Tag } from '@/lib/bedv/format';
import type { PokalPaarung, PokalRunde } from './typen';
import { teamById } from './teams';
import { teamStaerke } from './spieler';
import { tabelleDerLiga } from './tabelle';
import { LIGEN_AKTUELL } from './ligen';
import { SPIELE_JE_BEGEGNUNG } from './spiele';

export const POKAL_NAME = 'BeDV-Verbandspokal 2026/27';

/**
 * Teilnehmerfeld: die zwei besten Mannschaften jeder laufenden Staffel und
 * dazu die nächstbesten, bis 16 zusammen sind. So ist jede Spielklasse
 * vertreten — und der Reiz des Pokals (C-Liga gegen Bezirksliga) sichtbar.
 */
function teilnehmer(): string[] {
  const zweitbeste: string[] = [];
  const rest: string[] = [];
  for (const liga of LIGEN_AKTUELL) {
    const tab = tabelleDerLiga(liga.slug);
    tab.slice(0, 2).forEach(z => zweitbeste.push(z.teamId));
    tab.slice(2, 4).forEach(z => rest.push(z.teamId));
  }
  return [...zweitbeste, ...rest].slice(0, 16);
}

const RUNDEN: { runde: PokalRunde; name: string; paarungen: number }[] = [
  { runde: 'achtelfinale',  name: 'Achtelfinale',  paarungen: 8 },
  { runde: 'viertelfinale', name: 'Viertelfinale', paarungen: 4 },
  { runde: 'halbfinale',    name: 'Halbfinale',    paarungen: 2 },
  { runde: 'finale',        name: 'Finale',        paarungen: 1 },
];

export const POKAL_RUNDEN = RUNDEN;

/** Wie weit ist der Wettbewerb? Daran hängt, was der Turnierbaum zeigt. */
export const AKTUELLE_RUNDE: PokalRunde = 'halbfinale';

function ergebnis(id: string, heimId: string, gastId: string): { heim: number; gast: number } {
  const rnd = rngOf(`pokal:${id}`);
  const unterschied = teamStaerke(heimId) - teamStaerke(gastId);
  const anteil = 0.5 + unterschied * 1.0 + 0.04;
  const rauschen = ((rnd() + rnd() + rnd()) / 3 - 0.5) * 0.34;
  const heim = Math.min(16, Math.max(2, Math.round(SPIELE_JE_BEGEGNUNG * (anteil + rauschen))));
  return { heim, gast: SPIELE_JE_BEGEGNUNG - heim };
}

function baue(): PokalPaarung[] {
  const feld = teilnehmer();
  const out: PokalPaarung[] = [];
  const bezug = heute();

  // Termine relativ zum heutigen Tag — dieselbe Begründung wie beim
  // Ligaspielplan (siehe `data/bedv/saison.ts`).
  const termine: Record<PokalRunde, [Tag, Tag]> = {
    achtelfinale:  [plusTage(bezug, -70), plusTage(bezug, -63)],
    viertelfinale: [plusTage(bezug, -42), plusTage(bezug, -35)],
    halbfinale:    [plusTage(bezug, -7),  plusTage(bezug, 21)],
    finale:        [plusTage(bezug, 49),  plusTage(bezug, 49)],
  };

  let weiter: (string | null)[] = feld;

  for (const { runde, paarungen } of RUNDEN) {
    const [hinTag, rueckTag] = termine[runde];
    const naechste: (string | null)[] = [];

    for (let i = 0; i < paarungen; i++) {
      const heimTeamId = weiter[i * 2] ?? null;
      const gastTeamId = weiter[i * 2 + 1] ?? null;
      const id = `${runde}-${i + 1}`;

      // Gespielt wird, was vor der aktuellen Runde liegt; in der aktuellen
      // Runde nur das Hinspiel.
      const rundenIndex = RUNDEN.findIndex(r => r.runde === runde);
      const aktuellIndex = RUNDEN.findIndex(r => r.runde === AKTUELLE_RUNDE);
      const hinGespielt = heimTeamId !== null && gastTeamId !== null && rundenIndex <= aktuellIndex;
      const rueckGespielt = heimTeamId !== null && gastTeamId !== null && rundenIndex < aktuellIndex;

      const hin = hinGespielt && heimTeamId && gastTeamId
        ? { datum: hinTag, ...ergebnis(`${id}-hin`, heimTeamId, gastTeamId) }
        : null;
      // Im Rückspiel kehrt sich das Heimrecht um.
      const rueck = rueckGespielt && heimTeamId && gastTeamId
        ? { datum: rueckTag, ...invertiert(ergebnis(`${id}-rueck`, gastTeamId, heimTeamId)) }
        : null;

      let siegerTeamId: string | null = null;
      if (hin && rueck && heimTeamId && gastTeamId) {
        const heimGesamt = hin.heim + rueck.heim;
        const gastGesamt = hin.gast + rueck.gast;
        // Gleichstand nach beiden Spielen: Es entscheidet ein Stechleg. In
        // der Demo bekommt es die Mannschaft mit dem stärkeren Kader — ein
        // Pokalbaum ohne Sieger wäre kaputt.
        siegerTeamId = heimGesamt !== gastGesamt
          ? (heimGesamt > gastGesamt ? heimTeamId : gastTeamId)
          : (teamStaerke(heimTeamId) >= teamStaerke(gastTeamId) ? heimTeamId : gastTeamId);
      }

      // Ein Freilos (nur ein Teilnehmer) zieht direkt weiter.
      if (!siegerTeamId && heimTeamId && !gastTeamId) siegerTeamId = heimTeamId;

      out.push({
        id, runde, position: i + 1, heimTeamId, gastTeamId,
        hinspiel: hin, rueckspiel: rueck, siegerTeamId, demo: true,
      });
      naechste.push(siegerTeamId);
    }
    weiter = naechste;
  }
  return out;
}

export const POKAL: PokalPaarung[] = baue();

export function paarungenDerRunde(runde: PokalRunde): PokalPaarung[] {
  return POKAL.filter(p => p.runde === runde).sort((a, b) => a.position - b.position);
}

function invertiert(e: { heim: number; gast: number }): { heim: number; gast: number } {
  return { heim: e.gast, gast: e.heim };
}

/** Gesamtstand einer Paarung über beide Spiele — `null`, solange offen. */
export function gesamtstand(p: PokalPaarung): [number, number] | null {
  if (!p.hinspiel) return null;
  const heim = p.hinspiel.heim + (p.rueckspiel?.heim ?? 0);
  const gast = p.hinspiel.gast + (p.rueckspiel?.gast ?? 0);
  return [heim, gast];
}

/** Pokalauftritte einer Mannschaft — für das Mannschaftsprofil. */
export function pokalspieleVon(teamId: string): PokalPaarung[] {
  return POKAL.filter(p => p.heimTeamId === teamId || p.gastTeamId === teamId);
}

/** Für die Startseite: Wer steht noch drin? */
export function nochImWettbewerb(): string[] {
  return paarungenDerRunde(AKTUELLE_RUNDE)
    .flatMap(p => [p.heimTeamId, p.gastTeamId])
    .filter((id): id is string => id !== null);
}

export { teamById, intBetween };
