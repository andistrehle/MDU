// ============================================================
// MDC — ein hochgeladenes Turnier berichtigen
// ============================================================
//
// Beim Hochladen kann das Datum falsch vom Zettel gelesen oder das falsche
// Lokal ausgewählt worden sein. Ohne diesen Weg bliebe nur, die Zeile in
// `data/results-uploaded.ts` von Hand zu ändern — im Lokal am Handy also gar
// nicht.
//
// Geändert werden nur Datum und Spielort. Die Ergebnisliste selbst bleibt, wie
// sie freigegeben wurde: Stimmen die Namen oder die Reihenfolge nicht, gehört
// der Zettel noch einmal hochgeladen — dieselbe Kennung ersetzt die alte Zeile
// (`veroeffentlicheTurnier`). Hier Platzierungen zu verschieben hieße, an
// Ergebnissen zu drehen, ohne den Zettel danebenzuhalten.
//
// Turniere aus der Arbeitsmappe fasst dieses Modul NICHT an. Die stehen in den
// erzeugten Saisondateien und werden beim nächsten Import überschrieben — dort
// führt der Weg über die Mappe.
// ============================================================

import 'server-only';
import { CommitFehler, committe, kontext, leseDatei } from './github';
import { ersetzeListe, leseListe } from './ergebnis-commit';

const PFAD = 'data/results-uploaded.ts';
const KONSTANTE = 'RESULTS_UPLOADED_RAW';

/** „2026-09-09" + „siebziger" → „2026-09-09-siebziger" (wie `TournamentRecord.id`). */
export function turnierKennung(datum: string, spielortId: string): string {
  return `${datum}-${spielortId}`;
}

/** Datum und Spielort einer Zeile — der Rest bleibt unangetastet. */
function zerlege(zeile: string): { datum: string; spielortId: string; rest: string } {
  const [datum, spielortId, ...rest] = zeile.split('|');
  return { datum, spielortId, rest: rest.join('|') };
}

async function ladeZeilen(): Promise<{ ctx: ReturnType<typeof kontext>; quelle: string; zeilen: string[] }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, PFAD);
  return { ctx, quelle, zeilen: leseListe(quelle, KONSTANTE) };
}

/**
 * Schiebt ein hochgeladenes Turnier auf ein anderes Datum oder in ein anderes
 * Lokal. Gibt die Adresse des Commits zurück.
 */
export async function verschiebeTurnier(
  alt: { datum: string; spielortId: string },
  neu: { datum: string; spielortId: string },
  beschreibung: string,
): Promise<{ sha: string; url: string }> {
  const { ctx, quelle, zeilen } = await ladeZeilen();

  const gesucht = `${alt.datum}|${alt.spielortId}|`;
  const treffer = zeilen.find(z => z.startsWith(gesucht));
  if (!treffer) {
    throw new CommitFehler(
      `Das Turnier vom ${alt.datum} ist in den hochgeladenen Ergebnissen nicht (mehr) zu finden. `
      + 'Vielleicht hat es inzwischen jemand anders geändert — bitte die Seite neu laden.',
    );
  }

  // An der Zielstelle darf nicht schon ein anderes hochgeladenes Turnier
  // stehen: Zwei Zeilen mit derselben Kennung wären dasselbe Turnier zweimal.
  const ziel = `${neu.datum}|${neu.spielortId}|`;
  if (zeilen.some(z => z !== treffer && z.startsWith(ziel))) {
    throw new CommitFehler(
      `Für den ${neu.datum} ist in diesem Lokal schon ein Ergebnis hochgeladen. `
      + 'Bitte zuerst klären, welches der beiden stimmt.',
    );
  }

  const { rest } = zerlege(treffer);
  const neueZeile = [neu.datum, neu.spielortId, rest].join('|');
  const neueListe = [...zeilen.filter(z => z !== treffer), neueZeile].sort();

  return committe(
    ctx,
    [{ pfad: PFAD, inhalt: ersetzeListe(quelle, KONSTANTE, neueListe) }],
    [
      `MDC: Turnier berichtigt — ${beschreibung}`,
      '',
      `Vorher: ${alt.datum}, ${alt.spielortId}`,
      `Jetzt:  ${neu.datum}, ${neu.spielortId}`,
      'Die Ergebnisliste selbst ist unverändert.',
    ].join('\n'),
  );
}

/** Nimmt ein hochgeladenes Turnier ganz zurück. */
export async function loescheTurnier(
  alt: { datum: string; spielortId: string },
  beschreibung: string,
): Promise<{ sha: string; url: string }> {
  const { ctx, quelle, zeilen } = await ladeZeilen();

  const gesucht = `${alt.datum}|${alt.spielortId}|`;
  const uebrig = zeilen.filter(z => !z.startsWith(gesucht));
  if (uebrig.length === zeilen.length) {
    throw new CommitFehler(
      `Das Turnier vom ${alt.datum} steht gar nicht (mehr) in den hochgeladenen Ergebnissen.`,
    );
  }

  return committe(
    ctx,
    [{ pfad: PFAD, inhalt: ersetzeListe(quelle, KONSTANTE, uebrig) }],
    [
      `MDC: Hochgeladenes Turnier entfernt — ${beschreibung}`,
      '',
      'Die Punkte dieses Turniers zählen damit nicht mehr in der Wertung.',
    ].join('\n'),
  );
}
