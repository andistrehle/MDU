// ============================================================
// MDC — Ein Ranking pro Spieler und Tag
// ============================================================
//
// Turnierleitung, 09.11.2026 (Facebook-Gruppe, Toni Bauer):
//
//   „Ab sofort tritt wieder die alte ursprüngliche Regel in Kraft:
//    Pro Spieler und Tag ist nur mehr EIN MDC Ranking möglich!!"
//
// Zwischendurch war es erlaubt, an einem Abend zwei Lokale mitzunehmen — in
// der Wertung stand derselbe Mensch dann zweimal am selben Tag. Das ist
// wieder abgeschafft.
//
// Hier steht nur die Rechnung, absichtlich ohne Namen, Spielorte und
// Fehlertexte: So lässt sie sich prüfen, ohne den halben Datenbestand
// mitzuschleppen. Wer sie benutzt (der Ergebnis-Upload), setzt die Namen
// selbst ein.
//
// WAS SIE NICHT TUT: rückwirkend etwas beanstanden. „Ab sofort" heißt ab
// sofort — für Turniere DAVOR galt die andere Regel, und was damals erlaubt
// war, bleibt erlaubt. Zwei Vorkehrungen dafür:
//
//   • `REGEL_AB`: Turniere vor diesem Tag werden gar nicht erst geprüft.
//     Betreiber, 11.11.2026, nachdem ein Ergebnis vom Sonntag (08.11.) nicht
//     mehr nachzutragen war: „Da war diese Regel noch nicht aktiv … bitte da
//     nochmal die Ausnahmeregelung und alles ab dann gesperrt."
//   • Es zählt NUR, wer auf einem der NEUEN Zettel steht. Zwei alte Turniere,
//     die sich untereinander widersprechen, gehen den, der gerade einen
//     Zettel hochlädt, nichts an — sonst ließe sich ein Abend von damals nie
//     mehr berichtigen, weil die Freigabe an fremden Namen scheiterte.
//
// Im Bestand stehen rund hundert Tage mit Doppelstarts aus der Zeit davor.
// Die bleiben, wie sie sind.
// ============================================================

/**
 * Ab diesem Tag gilt „ein Ranking pro Spieler und Tag" — der Tag der
 * Ankündigung in der Facebook-Gruppe.
 *
 * Verglichen wird mit dem TAG DES TURNIERS, nicht mit dem Tag des Hochladens:
 * Ein Zettel vom Sonntag darf auch am Mittwoch noch nachgetragen werden.
 */
export const REGEL_AB = '2026-11-09';

/** Ein Turnier, verkürzt auf das, worauf es hier ankommt. */
export interface TagTurnier {
  datum: string;
  spielortId: string;
  passNummern: number[];
}

/** Ein Spieler, der an einem Tag in zwei Turnieren steht. */
export interface Doppelstart {
  passNr: number;
  datum: string;
  /** Die Spielorte, an denen er an diesem Tag steht — mindestens zwei. */
  spielorte: string[];
}

/** „2026-11-08" + „ambasador" → „2026-11-08|ambasador" */
function kennung(t: { datum: string; spielortId: string }): string {
  return `${t.datum}|${t.spielortId}`;
}

/**
 * Sucht Spieler, die wegen der NEUEN Zettel an einem Tag in mehr als einem
 * Turnier stünden.
 *
 * `neu` sind die Zettel, die gerade abgelegt werden sollen; `bestehend` ist,
 * was schon in der Wertung steht.
 *
 * Drei Dinge bleiben bewusst außen vor:
 *
 *   • Jeder Tag vor `REGEL_AB`. Da galt die Regel noch nicht.
 *   • Ein bestehendes Turnier mit derselben Kennung (Datum + Spielort) wie ein
 *     neuer Zettel. Ein erneutes Hochladen ERSETZT es, es steht also nicht
 *     neben dem neuen, sondern an seiner Stelle. Ohne das meldete jede
 *     Berichtigung eines Abends jeden Starter als Doppelstart.
 *   • Jeder, der auf keinem der neuen Zettel steht. Alte Tage mit
 *     Doppelstarts gibt es; sie waren damals erlaubt und sind nicht die
 *     Angelegenheit dessen, der gerade einen Zettel hochlädt.
 *
 * Zurück kommen die Fälle, nach Tag und Passnummer sortiert — die Reihenfolge
 * ist festgelegt, damit die Meldung nicht bei jedem Aufruf anders aussieht.
 */
export function doppelstarts(neu: TagTurnier[], bestehend: TagTurnier[]): Doppelstart[] {
  const ersetzt = new Set(neu.map(kennung));
  const alle = [...neu, ...bestehend.filter(t => !ersetzt.has(kennung(t)))];

  // Tag → Passnummer → Spielorte. Ein Spieler, der auf EINEM Zettel zweimal
  // steht, ist ein anderer Fehler (den fängt die Zettelprüfung ab) — deshalb
  // ein Set, das denselben Spielort nur einmal zählt.
  const jeTag = new Map<string, Map<number, Set<string>>>();
  for (const t of alle) {
    const tag = jeTag.get(t.datum) ?? new Map<number, Set<string>>();
    for (const nr of t.passNummern) {
      (tag.get(nr) ?? tag.set(nr, new Set()).get(nr)!).add(t.spielortId);
    }
    jeTag.set(t.datum, tag);
  }

  // Wer steht auf einem neuen Zettel? Nur um die geht es.
  const neueJeTag = new Map<string, Set<number>>();
  for (const t of neu) {
    const tag = neueJeTag.get(t.datum) ?? new Set<number>();
    for (const nr of t.passNummern) tag.add(nr);
    neueJeTag.set(t.datum, tag);
  }

  const treffer: Doppelstart[] = [];
  for (const [datum, tag] of jeTag) {
    // Vor dem Stichtag galt die Regel nicht — da gibt es nichts zu beanstanden.
    if (datum < REGEL_AB) continue;
    const neueNummern = neueJeTag.get(datum);
    if (!neueNummern) continue;
    for (const [passNr, orte] of tag) {
      if (orte.size > 1 && neueNummern.has(passNr)) {
        treffer.push({ passNr, datum, spielorte: [...orte] });
      }
    }
  }
  return treffer.sort((a, b) => a.datum.localeCompare(b.datum) || a.passNr - b.passNr);
}
