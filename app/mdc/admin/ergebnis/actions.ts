'use server';

// ============================================================
// MDC — Ergebnis-Upload: die beiden Schritte
// ============================================================
//
//   1. `erkenneZettel`   Foto lesen, Spieler vorschlagen. Ändert nichts.
//   2. `gibErgebnisFrei` Geprüfte Liste rechnen, prüfen, ablegen.
//
// Zwischen den beiden sitzt der Mensch. Schritt 1 entscheidet nichts, Schritt 2
// übernimmt nur, was am Bildschirm bestätigt wurde — die erkannten Namen aus
// Schritt 1 werden in Schritt 2 gar nicht mehr angefasst, nur noch die
// bestätigten Passnummern.
//
// Beide Aktionen prüfen den Zugang selbst nach. Der Proxy tut das schon
// (`proxy.ts`), aber eine Aktion ist eine eigene Adresse im Netz: Sie darf sich
// nicht darauf verlassen, dass vor ihr jemand aufgepasst hat.
// ============================================================

import { headers } from 'next/headers';
import { liesErgebniszettel, FotoNichtLesbarError } from '@/lib/mdc/ergebnis-foto';
import { ordneSpielerZu, type Zuordnung } from '@/lib/mdc/spieler-zuordnung';
import { veroeffentlicheTurniere, type Veroeffentlichung, type NeuerSpieler } from '@/lib/mdc/ergebnis-commit';
import { ersetzeTurnierSpieler, loescheTurnier, verschiebeTurnier } from '@/lib/mdc/turnier-commit';
import { CommitFehler } from '@/lib/mdc/github';
import { getUploadConfig, getUploadStatus } from '@/lib/mdc/upload-config';
import { MAX_ZETTEL } from '@/lib/mdc/upload-grenzen';
import { pointsFor } from '@/lib/mdc/points';
import { getPlayerByPassNr, playerName } from '@/data/players';
import { getVenue, venueName } from '@/data/venues';
import { SEASONS, todayInMunich } from '@/data/season';
import { getTournamentRecord } from '@/data/tournament-results';

export interface VorschlagZeile {
  /** Endgültige Platzierung: die Reihenfolge auf dem Zettel, 1-basiert. */
  position: number;
  platzLautZettel: number | null;
  erkannterName: string | null;
  erkanntePassNr: number | null;
  /** Punktzahl aus der Spalte „PKT" — nur zur Gegenprobe, nie übernommen. */
  punkteLautZettel: number | null;
  confidence: number | null;
  /** Vorschlag der Zuordnung — `null`, wenn keiner gefunden wurde. */
  vorschlag: Zuordnung | null;
  alternativen: Zuordnung[];
  sicher: boolean;
  /** Kam der Vorschlag über die Passnummer, den Namen — oder gar nicht? */
  quelle: 'passnummer' | 'name' | 'neu' | null;
  /** Auf dem Zettel als neu angekreuzt, ohne Passnummer. */
  istNeu: boolean;
  /**
   * Kreuz in Spalte F statt M. Nur für Neulinge von Belang: Bei allen anderen
   * steht die Wertungsklasse im Stamm.
   */
  weiblichLautZettel: boolean | null;
  hinweis: string | null;
}

export interface Vorschlag {
  zeilen: VorschlagZeile[];
  datumLautZettel: string | null;
  spielortLautZettel: string | null;
  teilnehmerLautZettel: number | null;
  hinweise: string[];
}

export type ErkennenErgebnis =
  | { ok: true; vorschlag: Vorschlag }
  | { ok: false; fehler: string };

/** Ein abgelegtes Turnier, so wie die Seite es danach nennt. */
export interface AbgelegtesTurnier {
  turnier: string;
  starter: number;
  ersetzt: boolean;
}

export type FreigabeErgebnis =
  | { ok: true; url: string; turniere: AbgelegtesTurnier[] }
  | { ok: false; fehler: string };

/**
 * Ist der Aufrufer durch die Passwortabfrage gekommen?
 *
 * Ohne gesetztes Passwort gibt es den Upload gar nicht — dann ist auch die
 * Aktion zu. Das ist die ehrlichere Sperre als eine offene Aktion, die sich
 * auf den Proxy verlässt.
 */
async function zugangGeprueft(): Promise<boolean> {
  const passwort = (process.env.MDC_ADMIN_PASSWORD ?? '').trim();
  if (!passwort) return false;
  const header = (await headers()).get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const entschluesselt = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
    return entschluesselt.slice(entschluesselt.indexOf(':') + 1) === passwort;
  } catch {
    return false;
  }
}

const KEIN_ZUGANG = 'Kein Zugang zur Turnierverwaltung.';

// ------------------------------------------------------------
// Schritt 1 — Foto lesen
// ------------------------------------------------------------

export async function erkenneZettel(bildDataUrl: string): Promise<ErkennenErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };

  const status = getUploadStatus();
  if (!status.canRead) {
    return { ok: false, fehler: `Die Erkennung ist nicht eingerichtet: ${status.missing.join(', ')}.` };
  }

  const treffer = bildDataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!treffer) return { ok: false, fehler: 'Das war kein lesbares Bild.' };
  const [, mimeType, base64] = treffer;

  const groesse = Math.floor((base64.length * 3) / 4);
  if (groesse > getUploadConfig().maxBytes) {
    return { ok: false, fehler: 'Das Bild ist zu groß. Bitte noch einmal aufnehmen.' };
  }

  try {
    const erkannt = await liesErgebniszettel({ mimeType, base64 }, todayInMunich());

    if (!erkannt.istErgebnisliste || !erkannt.zeilen.length) {
      return {
        ok: false,
        fehler: 'Auf dem Bild ist keine Ergebnisliste zu erkennen. '
          + 'Bitte den ganzen Zettel gerade und gut ausgeleuchtet fotografieren.',
      };
    }

    // Leergebliebene Zeilen des vorgedruckten Formulars aussortieren.
    //
    // Der Zettel hat mehr Zeilen als Teilnehmer — die Spalte PLATZ ist fertig
    // bedruckt, die 9 steht viermal da. Eine Zeile ohne Namen UND ohne
    // Passnummer ist kein Starter. Das steht auch im Prompt, aber hier darf es
    // nicht davon abhängen, ob sich das Modell daran hält: Eine Zeile zu viel
    // ändert die Feldgröße und damit JEDE Punktzahl des Turniers.
    const gefiltert = erkannt.zeilen.filter(z => z.name?.trim() || z.passNr !== null);
    const leere = erkannt.zeilen.length - gefiltert.length;

    if (!gefiltert.length) {
      return {
        ok: false,
        fehler: 'Auf dem Zettel ist keine ausgefüllte Zeile zu erkennen. '
          + 'Bitte noch einmal fotografieren — am besten die ganze Liste gerade und hell.',
      };
    }

    // Reihenfolge: was auf dem Zettel oben steht, ist Platz 1. Der notierte
    // Platz sortiert vor — bei geteilten Plätzen (mehrfach dieselbe Zahl)
    // bleibt die Reihenfolge des Zettels erhalten.
    const sortiert = gefiltert
      .map((zeile, i) => ({ zeile, i }))
      .sort((a, b) =>
        (a.zeile.platz ?? Number.MAX_SAFE_INTEGER) - (b.zeile.platz ?? Number.MAX_SAFE_INTEGER)
        || a.i - b.i);

    const zeilen: VorschlagZeile[] = sortiert.map(({ zeile }, index) => {
      const zuordnung = ordneSpielerZu({
        name: zeile.name, passNr: zeile.passNr, neu: zeile.neu,
      });
      return {
        position: index + 1,
        platzLautZettel: zeile.platz,
        erkannterName: zeile.name,
        erkanntePassNr: zeile.passNr,
        confidence: zeile.confidence,
        punkteLautZettel: zeile.punkte,
        vorschlag: zuordnung.treffer,
        alternativen: zuordnung.alternativen,
        sicher: zuordnung.sicher,
        quelle: zuordnung.quelle,
        istNeu: zuordnung.neuerSpieler,
        weiblichLautZettel: zeile.weiblich,
        hinweis: zuordnung.hinweis,
      };
    });

    return {
      ok: true,
      vorschlag: {
        zeilen,
        datumLautZettel: erkannt.datum,
        spielortLautZettel: erkannt.spielort,
        teilnehmerLautZettel: erkannt.teilnehmerLautZettel,
        hinweise: leere > 0
          ? [
            ...erkannt.hinweise,
            `${leere} leer gebliebene Zeile${leere === 1 ? '' : 'n'} des Formulars `
            + 'übergangen — dort stand weder ein Name noch eine Passnummer.',
          ]
          : erkannt.hinweise,
      },
    };
  } catch (fehler) {
    if (fehler instanceof FotoNichtLesbarError) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Erkennung fehlgeschlagen', fehler);
    return {
      ok: false,
      fehler: 'Die Erkennung ist fehlgeschlagen. Bitte noch einmal versuchen — '
        + 'wenn es wieder nicht klappt, das Ergebnis wie bisher eintragen lassen.',
    };
  }
}

// ------------------------------------------------------------
// Schritt 2 — geprüfte Liste freigeben
// ------------------------------------------------------------

export interface FreigabeZeile {
  /** Passnummer des Spielers auf diesem Platz — bestätigt, nicht erkannt. */
  passNr: number;
}

export interface FreigabeEingabe {
  datum: string;
  spielortId: string;
  zeilen: FreigabeZeile[];
  /** Spieler, die es noch nicht gibt und die mit angelegt werden sollen. */
  neueSpieler: NeuerSpieler[];
}

/**
 * Prüft EINEN Zettel des Stapels. Gibt die fertige Ergebniszeile zurück — oder
 * den Satz, der dem Menschen sagt, was nicht stimmt.
 *
 * Jede dieser Prüfungen verhindert eine Zahl, die hinterher niemand mehr
 * erklären kann.
 */
function pruefeTurnier(
  eingabe: FreigabeEingabe,
): { ok: true; veroeffentlichung: Veroeffentlichung; turnier: string; starter: number } | { ok: false; fehler: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eingabe.datum)) {
    return { ok: false, fehler: 'Das Datum fehlt oder hat die falsche Form.' };
  }
  const saison = SEASONS.find(s => eingabe.datum >= s.startDate && eingabe.datum <= s.endDate);
  if (!saison) {
    return { ok: false, fehler: `Der ${eingabe.datum} liegt in keiner Saison. Bitte das Datum prüfen.` };
  }
  if (!getVenue(eingabe.spielortId)) {
    return { ok: false, fehler: 'Dieser Spielort ist nicht bekannt.' };
  }

  const teilnehmer = eingabe.zeilen.length;
  if (teilnehmer < 2) {
    return { ok: false, fehler: 'Ein Turnier mit weniger als zwei Startern gibt es nicht.' };
  }

  const nummern = eingabe.zeilen.map(z => z.passNr);
  if (nummern.some(n => !Number.isInteger(n) || n < 1)) {
    return { ok: false, fehler: 'Mindestens eine Zeile hat keine gültige Passnummer.' };
  }
  const doppelt = nummern.filter((n, i) => nummern.indexOf(n) !== i);
  if (doppelt.length) {
    const namen = [...new Set(doppelt)].map(n => {
      const spieler = getPlayerByPassNr(n);
      return spieler ? `${playerName(spieler)} (${n})` : String(n);
    });
    return { ok: false, fehler: `Doppelt in der Liste: ${namen.join(', ')}. Jeder Spieler steht genau einmal drin.` };
  }

  // Jede Nummer muss zu jemandem gehören — entweder schon im Stamm oder in
  // dieser Sendung mit angelegt.
  const neueNummern = new Set(eingabe.neueSpieler.map(s => s.passNr));
  const unbekannt = nummern.filter(n => !getPlayerByPassNr(n) && !neueNummern.has(n));
  if (unbekannt.length) {
    return {
      ok: false,
      fehler: `Diese Passnummern gehören zu niemandem: ${unbekannt.join(', ')}. `
        + 'Entweder den richtigen Spieler auswählen oder ihn als neu anlegen.',
    };
  }

  for (const neu of eingabe.neueSpieler) {
    if (!Number.isInteger(neu.passNr) || neu.passNr < 1) {
      return { ok: false, fehler: 'Ein neuer Spieler hat keine gültige Passnummer.' };
    }
    if (!neu.lastName.trim() && !neu.firstName.trim()) {
      return { ok: false, fehler: `Für Passnummer ${neu.passNr} fehlt der Name.` };
    }
    const belegt = getPlayerByPassNr(neu.passNr);
    if (belegt) {
      return {
        ok: false,
        fehler: `Passnummer ${neu.passNr} ist schon vergeben (${playerName(belegt)}). `
          + 'Bitte diesen Spieler auswählen oder eine freie Nummer nehmen.',
      };
    }
  }

  // Führt der Grundbestand dasselbe Turnier, gewinnt die hier freigegebene
  // Fassung: Ein erneutes Hochladen IST der Weg, ein Ergebnis zu berichtigen.
  // Der Prüflauf vergleicht beide Fassungen, solange es sie doppelt gibt.

  // ── Punkte. Nicht vom Zettel abgeschrieben, sondern aus Platz und Feldgröße
  //    gerechnet — der Schlüssel ist die verbindliche Quelle. ──
  const punkte = eingabe.zeilen.map((_, index) => pointsFor(index + 1, teilnehmer));
  const zeile = [
    eingabe.datum,
    eingabe.spielortId,
    eingabe.zeilen.map((z, i) => `${z.passNr}:${punkte[i]}`).join(','),
  ].join('|');

  return {
    ok: true,
    veroeffentlichung: {
      zeile,
      neueSpieler: eingabe.neueSpieler,
      beschreibung: `${venueName(eingabe.spielortId)}, ${eingabe.datum} (${teilnehmer} Starter)`,
    },
    turnier: `${venueName(eingabe.spielortId)}, ${eingabe.datum}`,
    starter: teilnehmer,
  };
}

/**
 * Prüfungen, die es nur im STAPEL gibt — sie können erst auffallen, wenn
 * mehrere Zettel zusammen abgelegt werden.
 */
function pruefeStapel(eingaben: FreigabeEingabe[]): string | null {
  // Zwei Zettel mit demselben Datum UND demselben Spielort sind dasselbe
  // Turnier. Im selben Commit würde der zweite den ersten überschreiben, und
  // ein Turnierabend wäre still verschwunden.
  const gesehen = new Map<string, number>();
  for (const e of eingaben) {
    const kennung = `${e.datum}|${e.spielortId}`;
    gesehen.set(kennung, (gesehen.get(kennung) ?? 0) + 1);
  }
  const doppelt = [...gesehen].filter(([, anzahl]) => anzahl > 1).map(([k]) => k);
  if (doppelt.length) {
    const namen = doppelt.map(k => {
      const [datum, ort] = k.split('|');
      return `${venueName(ort)}, ${datum}`;
    });
    return `Zwei Zettel tragen dasselbe Turnier: ${namen.join('; ')}. `
      + 'Bitte Datum oder Spielort berichtigen — sonst überschreibt der eine den anderen.';
  }

  // Dieselbe freie Nummer auf zwei Zetteln: Zwei verschiedene Menschen bekämen
  // denselben Pass.
  const neue = eingaben.flatMap(e => e.neueSpieler);
  const nachNummer = new Map<number, Set<string>>();
  for (const s of neue) {
    const name = `${s.firstName} ${s.lastName}`.trim().toUpperCase();
    nachNummer.set(s.passNr, (nachNummer.get(s.passNr) ?? new Set()).add(name));
  }
  const kollision = [...nachNummer].filter(([, namen]) => namen.size > 1);
  if (kollision.length) {
    const text = kollision
      .map(([nr, namen]) => `${nr} (${[...namen].join(' und ')})`)
      .join(', ');
    return `Dieselbe Passnummer soll an zwei verschiedene Neulinge gehen: ${text}. `
      + 'Bitte für einen von beiden eine andere freie Nummer wählen.';
  }

  // Derselbe Name mit zwei verschiedenen Nummern: Aus einem Menschen würden
  // zwei, und die Spieler-ID entsteht aus dem Namen.
  const nachName = new Map<string, Set<number>>();
  for (const s of neue) {
    const name = `${s.firstName} ${s.lastName}`.trim().toUpperCase();
    if (!name) continue;
    nachName.set(name, (nachName.get(name) ?? new Set()).add(s.passNr));
  }
  const zweimal = [...nachName].filter(([, nummern]) => nummern.size > 1);
  if (zweimal.length) {
    const text = zweimal
      .map(([name, nummern]) => `${name} (${[...nummern].join(' und ')})`)
      .join(', ');
    return `Derselbe Neuling soll zwei Passnummern bekommen: ${text}. `
      + 'Bitte auf beiden Zetteln dieselbe Nummer wählen.';
  }

  return null;
}

/**
 * Legt den ganzen Stapel ab — ein Commit, ein Neubau. Ein einzelner Zettel ist
 * der Stapel mit einem Element; es gibt nur diesen einen Weg, damit die
 * Prüfungen nicht zweimal gepflegt werden müssen.
 *
 * ALLES ODER NICHTS: Stimmt an einem Zettel etwas nicht, wird gar nichts
 * geschrieben und gesagt, welcher es ist. Die Hälfte eines Abends abzulegen
 * und die andere Hälfte mit einer Fehlermeldung stehen zu lassen, wäre der
 * schlechtere Zustand — niemand wüsste hinterher, was schon drin ist.
 */
export async function gibErgebnisFrei(eingaben: FreigabeEingabe[]): Promise<FreigabeErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };

  const status = getUploadStatus();
  if (!status.canPublish) {
    return { ok: false, fehler: `Das Ablegen ist nicht eingerichtet: ${status.missing.join(', ')}.` };
  }

  if (!Array.isArray(eingaben) || eingaben.length === 0) {
    return { ok: false, fehler: 'Es gibt nichts abzulegen.' };
  }
  if (eingaben.length > MAX_ZETTEL) {
    return { ok: false, fehler: `Mehr als ${MAX_ZETTEL} Zettel auf einmal gehen nicht.` };
  }

  const geprueft: { veroeffentlichung: Veroeffentlichung; turnier: string; starter: number }[] = [];
  for (const [i, eingabe] of eingaben.entries()) {
    const probe = pruefeTurnier(eingabe);
    if (!probe.ok) {
      return {
        ok: false,
        fehler: eingaben.length === 1
          ? probe.fehler
          : `Zettel ${i + 1} (${venueName(eingabe.spielortId)}, ${eingabe.datum}): ${probe.fehler}`,
      };
    }
    geprueft.push(probe);
  }

  const stapelFehler = pruefeStapel(eingaben);
  if (stapelFehler) return { ok: false, fehler: stapelFehler };

  try {
    const commit = await veroeffentlicheTurniere(geprueft.map(g => g.veroeffentlichung));
    return {
      ok: true,
      url: commit.url,
      turniere: geprueft.map(g => ({
        turnier: g.turnier,
        starter: g.starter,
        ersetzt: commit.ersetzt.includes(g.veroeffentlichung.beschreibung),
      })),
    };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Freigabe fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Die Ergebnisse konnten nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}

// ------------------------------------------------------------
// Nachträglich berichtigen — Datum und Spielort
// ------------------------------------------------------------
//
// Der Fall, für den es das gibt: Das Datum wurde vom Zettel falsch gelesen und
// erst Tage später ist es jemandem aufgefallen. Ohne diesen Weg müsste man
// dafür in die Datei im Repository — am Handy im Lokal keine Option.
//
// Nur Datum und Spielort. An der Ergebnisliste wird hier nichts gedreht:
// Stimmt die nicht, gehört der Zettel noch einmal hochgeladen, dann steht die
// Korrektur wieder neben dem Bild, aus dem sie stammt.

export interface TurnierAenderung {
  /** Datum und Spielort, wie das Turnier heute abgelegt ist. */
  altesDatum: string;
  alterSpielortId: string;
  datum: string;
  spielortId: string;
}

export type TurnierErgebnis =
  | { ok: true; url: string; turnier: string }
  | { ok: false; fehler: string };

/** Gemeinsame Prüfungen für Ändern und Entfernen. */
function bereitFuerAenderung(): string | null {
  const status = getUploadStatus();
  return status.canPublish
    ? null
    : `Das Ablegen ist nicht eingerichtet: ${status.missing.join(', ')}.`;
}

export async function verschiebeHochgeladenesTurnier(
  eingabe: TurnierAenderung,
): Promise<TurnierErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereitFuerAenderung();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eingabe.datum)) {
    return { ok: false, fehler: 'Das Datum fehlt oder hat die falsche Form.' };
  }
  const saison = SEASONS.find(s => eingabe.datum >= s.startDate && eingabe.datum <= s.endDate);
  if (!saison) {
    return {
      ok: false,
      fehler: `Der ${eingabe.datum} liegt in keiner Saison — das Turnier stünde dann in gar `
        + 'keiner Wertung. Bitte das Datum prüfen.',
    };
  }
  if (!getVenue(eingabe.spielortId)) {
    return { ok: false, fehler: 'Dieser Spielort ist nicht bekannt.' };
  }

  const alt = getTournamentRecord(`${eingabe.altesDatum}-${eingabe.alterSpielortId}`);
  if (!alt) {
    return { ok: false, fehler: 'Dieses Turnier gibt es nicht (mehr). Bitte die Seite neu laden.' };
  }
  // Turniere der Arbeitsmappe stehen in den erzeugten Saisondateien und würden
  // beim nächsten Import zurückgesetzt — hier ist nur zu ändern, was die Seite
  // selbst geschrieben hat.
  if (alt.source !== 'upload') {
    return {
      ok: false,
      fehler: 'Dieses Turnier gehört zum eingelesenen Grundbestand (Stand 08.09.2026) und '
        + 'lässt sich hier nicht verschieben. Entweder den Zettel neu hochladen oder die '
        + 'Berichtigung in data/corrections.ts eintragen.',
    };
  }
  if (eingabe.datum === eingabe.altesDatum && eingabe.spielortId === eingabe.alterSpielortId) {
    return { ok: false, fehler: 'Datum und Spielort sind unverändert.' };
  }

  // Steht am Ziel schon ein Turnier des Grundbestands, würde es durch das
  // verschobene ERSETZT — die Fassung der Seite gewinnt.
  // Das still zu tun wäre falsch: Hier verschiebt jemand ein Datum, er will
  // nicht nebenbei einen anderen Abend überschreiben.
  const amZiel = getTournamentRecord(`${eingabe.datum}-${eingabe.spielortId}`);
  if (amZiel && amZiel.source === 'workbook') {
    return {
      ok: false,
      fehler: `Am ${eingabe.datum} steht in ${venueName(eingabe.spielortId)} schon ein Turnier `
        + 'aus der Arbeitsmappe. Das verschobene würde es verdrängen — bitte erst klären, '
        + 'welches der beiden stimmt.',
    };
  }

  try {
    const beschreibung = `${venueName(eingabe.spielortId)}, ${eingabe.datum}`;
    const commit = await verschiebeTurnier(
      { datum: eingabe.altesDatum, spielortId: eingabe.alterSpielortId },
      { datum: eingabe.datum, spielortId: eingabe.spielortId },
      beschreibung,
    );
    return { ok: true, url: commit.url, turnier: beschreibung };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Turnier verschieben fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Die Änderung konnte nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}

export async function entferneHochgeladenesTurnier(
  eingabe: { datum: string; spielortId: string },
): Promise<TurnierErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereitFuerAenderung();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  const alt = getTournamentRecord(`${eingabe.datum}-${eingabe.spielortId}`);
  if (alt && alt.source !== 'upload') {
    return {
      ok: false,
      fehler: 'Dieses Turnier stammt aus der Arbeitsmappe und lässt sich hier nicht entfernen.',
    };
  }

  try {
    const beschreibung = `${venueName(eingabe.spielortId)}, ${eingabe.datum}`;
    const commit = await loescheTurnier(eingabe, beschreibung);
    return { ok: true, url: commit.url, turnier: beschreibung };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Turnier entfernen fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Das Turnier konnte nicht entfernt werden. Bitte noch einmal versuchen.' };
  }
}

// ------------------------------------------------------------
// Nachträglich berichtigen — die Spieler einzelner Plätze
// ------------------------------------------------------------
//
// Der Fall aus der Praxis: Auf dem Zettel stand eine Passnummer, die zu
// jemand anderem gehört, oder zwei Namen wurden verwechselt. Bisher half nur,
// den ganzen Zettel noch einmal hochzuladen.
//
// DIE PUNKTE HÄNGEN AM PLATZ. Wer einen Platz räumt, verliert die Punkte
// dieses Turniers; wer ihn einnimmt, bekommt genau sie. Anders ginge es auch
// gar nicht: Der Schlüssel rechnet aus Platz und Feldgröße, nicht aus dem
// Namen.
//
// Die ZAHL der Plätze bleibt, wie sie ist — an ihr hängt die Feldgröße und
// damit jede einzelne Punktzahl des Abends.

export interface ZeilenAenderung {
  datum: string;
  spielortId: string;
  /** Die Passnummern in Platzreihenfolge — so viele wie bisher. */
  passNummern: number[];
}

export async function berichtigeTurnierSpieler(
  eingabe: ZeilenAenderung,
): Promise<TurnierErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereitFuerAenderung();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  const alt = getTournamentRecord(`${eingabe.datum}-${eingabe.spielortId}`);
  if (!alt) {
    return { ok: false, fehler: 'Dieses Turnier ist nicht (mehr) zu finden. Bitte die Seite neu laden.' };
  }
  if (alt.source !== 'upload') {
    return {
      ok: false,
      fehler: 'Dieses Turnier stammt aus der Arbeitsmappe und lässt sich hier nicht ändern. '
        + 'Beim nächsten Einlesen käme die alte Fassung zurück.',
    };
  }

  const neu = eingabe.passNummern;
  if (!Array.isArray(neu) || neu.length !== alt.results.length) {
    return {
      ok: false,
      fehler: `Die Liste hat ${alt.results.length} Plätze, geschickt wurden ${neu?.length ?? 0}. `
        + 'Bitte die Seite neu laden.',
    };
  }
  if (neu.some(n => !Number.isInteger(n) || n < 1)) {
    return { ok: false, fehler: 'Mindestens ein Platz hat keine gültige Passnummer.' };
  }

  // Jede Nummer muss zu jemandem gehören. Neu anlegen geht hier bewusst nicht:
  // Wer noch keine Nummer hat, kommt über den Zettel herein — dort steht die
  // Wertungsklasse und die Nummer wird aus den freien vergeben.
  const ohneMenschen = neu.filter(n => !getPlayerByPassNr(n));
  if (ohneMenschen.length) {
    return {
      ok: false,
      fehler: `Diese Passnummern gehören zu niemandem: ${[...new Set(ohneMenschen)].join(', ')}. `
        + 'Wer noch keine Nummer hat, muss erst über einen Zettel oder unter Passnummern angelegt werden.',
    };
  }

  const doppelt = neu.filter((n, i) => neu.indexOf(n) !== i);
  if (doppelt.length) {
    const namen = [...new Set(doppelt)].map(n => {
      const spieler = getPlayerByPassNr(n);
      return spieler ? `${playerName(spieler)} (${n})` : String(n);
    });
    return {
      ok: false,
      fehler: `Doppelt in der Liste: ${namen.join(', ')}. Jeder Spieler steht genau einmal drin.`,
    };
  }

  // Was sich ändert — für die Commit-Nachricht und damit später nachlesbar
  // bleibt, wer wessen Punkte bekommen hat.
  const nenne = (passNr: number) => {
    const spieler = getPlayerByPassNr(passNr);
    return spieler ? `${playerName(spieler)} (${passNr})` : `Passnr. ${passNr}`;
  };
  const aenderungen: string[] = [];
  alt.results.forEach((zeile, i) => {
    if (zeile.passNr === neu[i]) return;
    aenderungen.push(
      `Platz ${zeile.rank} (${zeile.points} Punkte): ${nenne(zeile.passNr)} → ${nenne(neu[i])}`,
    );
  });
  if (!aenderungen.length) {
    return { ok: false, fehler: 'An dieser Liste ändert sich nichts.' };
  }

  try {
    const beschreibung = `${venueName(eingabe.spielortId)}, ${eingabe.datum}`;
    const commit = await ersetzeTurnierSpieler(
      { datum: eingabe.datum, spielortId: eingabe.spielortId },
      neu,
      beschreibung,
      aenderungen,
    );
    return { ok: true, url: commit.url, turnier: beschreibung };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Ergebnisliste berichtigen fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Die Änderung konnte nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}
