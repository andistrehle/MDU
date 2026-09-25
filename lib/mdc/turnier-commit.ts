// ============================================================
// MDC — ein hochgeladenes Turnier berichtigen
// ============================================================
//
// Beim Hochladen kann das Datum falsch vom Zettel gelesen oder das falsche
// Lokal ausgewählt worden sein. Ohne diesen Weg bliebe nur, die Zeile in
// `data/results-uploaded.ts` von Hand zu ändern — im Lokal am Handy also gar
// nicht.
//
// Geändert werden Datum, Spielort UND — seit 25.09.2026 — die Spieler der
// einzelnen Plätze. Beim Austausch gilt: DIE PUNKTE HÄNGEN AM PLATZ, nicht am
// Menschen. Wer herausfällt, verliert die Punkte dieses Turniers; wer
// hereinkommt, bekommt genau sie. Das ist kein Kunstgriff, sondern der
// Punkteschlüssel selbst: Er rechnet aus Platz und Feldgröße, und beides
// ändert sich beim Austausch nicht.
//
// Die ZAHL der Zeilen lässt sich hier NICHT ändern. An ihr hängt die
// Feldgröße, und die bestimmt jede einzelne Punktzahl des Turniers — ein
// Starter mehr oder weniger rechnet den ganzen Abend neu. Dafür gehört der
// Zettel noch einmal hochgeladen; dieselbe Kennung ersetzt die alte Zeile
// (`veroeffentlicheTurniere`), und die Korrektur steht wieder neben dem Bild,
// aus dem sie stammt.
//
// Turniere des Grundbestands fasst dieses Modul NICHT an. Die stehen in den
// erzeugten Saisondateien (Stand 08.09.2026); berichtigt werden sie über
// `data/corrections.ts` oder indem der Zettel neu hochgeladen wird.
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

/** Die Ergebnisse einer Zeile: `301:220,558:207` → Platz für Platz. */
function zerlegeErgebnisse(rest: string): { passNr: number; punkte: number }[] {
  return rest.split(',').filter(Boolean).map(paar => {
    const [nr, punkte] = paar.split(':');
    return { passNr: Number(nr), punkte: Number(punkte) };
  });
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

/**
 * Tauscht die Spieler eines hochgeladenen Turniers aus — Platz für Platz.
 *
 * `passNummern` steht in Platzreihenfolge und muss GENAU SO LANG sein wie die
 * abgelegte Liste. Die Punkte werden nicht neu gerechnet, sondern bleiben an
 * ihrem Platz stehen: Sie stammen aus `pointsFor(Platz, Feldgröße)`, und an
 * beidem ändert ein Austausch nichts. Wer den Platz räumt, verliert sie; wer
 * ihn einnimmt, bekommt sie.
 *
 * Passt die Länge nicht, wird abgebrochen statt geraten. Das ist der Fall, in
 * dem inzwischen jemand anders dasselbe Turnier neu hochgeladen hat — dann
 * gehört die Seite neu geladen, nicht eine halb veraltete Liste geschrieben.
 */
export async function ersetzeTurnierSpieler(
  turnier: { datum: string; spielortId: string },
  passNummern: number[],
  beschreibung: string,
  /** Was sich ändert, je Zeile ein Satz — für die Commit-Nachricht. */
  aenderungen: string[],
): Promise<{ sha: string; url: string }> {
  const { ctx, quelle, zeilen } = await ladeZeilen();

  const gesucht = `${turnier.datum}|${turnier.spielortId}|`;
  const treffer = zeilen.find(z => z.startsWith(gesucht));
  if (!treffer) {
    throw new CommitFehler(
      `Das Turnier vom ${turnier.datum} ist in den hochgeladenen Ergebnissen nicht (mehr) zu `
      + 'finden. Vielleicht hat es inzwischen jemand anders geändert — bitte die Seite neu laden.',
    );
  }

  const { rest } = zerlege(treffer);
  const bisher = zerlegeErgebnisse(rest);
  if (bisher.length !== passNummern.length) {
    throw new CommitFehler(
      `Die Liste hat sich inzwischen geändert: abgelegt sind ${bisher.length} Plätze, `
      + `geschickt wurden ${passNummern.length}. Bitte die Seite neu laden.`,
    );
  }

  // Punkte bleiben am Platz, nur die Nummer davor wechselt.
  const neueErgebnisse = bisher
    .map((e, i) => `${passNummern[i]}:${e.punkte}`)
    .join(',');
  const neueZeile = [turnier.datum, turnier.spielortId, neueErgebnisse].join('|');
  if (neueZeile === treffer) {
    throw new CommitFehler('An dieser Liste ändert sich nichts.');
  }

  const neueListe = [...zeilen.filter(z => z !== treffer), neueZeile].sort();

  return committe(
    ctx,
    [{ pfad: PFAD, inhalt: ersetzeListe(quelle, KONSTANTE, neueListe) }],
    [
      `MDC: Ergebnisliste berichtigt — ${beschreibung}`,
      '',
      ...aenderungen.map(a => `- ${a}`),
      '',
      'Die Punkte hängen am Platz: Wer herausfällt, verliert sie, wer hereinkommt,',
      'bekommt sie. Feldgröße und Platzierungen sind unverändert.',
    ].join('\n'),
  );
}
