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
import { veroeffentlicheTurnier, CommitFehler, type NeuerSpieler } from '@/lib/mdc/ergebnis-commit';
import { getUploadConfig, getUploadStatus } from '@/lib/mdc/upload-config';
import { pointsFor, TABLE_RANGE } from '@/lib/mdc/points';
import { PLAYERS, getPlayerByPassNr, playerName } from '@/data/players';
import { getVenue, venueName } from '@/data/venues';
import { SEASONS } from '@/data/season';
import { getTournamentRecord } from '@/data/tournament-results';

export interface VorschlagZeile {
  /** Endgültige Platzierung: die Reihenfolge auf dem Zettel, 1-basiert. */
  position: number;
  platzLautZettel: number | null;
  erkannterName: string | null;
  erkanntePassNr: number | null;
  confidence: number | null;
  /** Vorschlag der Zuordnung — `null`, wenn keiner gefunden wurde. */
  vorschlag: Zuordnung | null;
  alternativen: Zuordnung[];
  sicher: boolean;
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

export type FreigabeErgebnis =
  | { ok: true; url: string; ersetzt: boolean; turnier: string; punkte: number[] }
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
    const erkannt = await liesErgebniszettel({ mimeType, base64 });

    if (!erkannt.istErgebnisliste || !erkannt.zeilen.length) {
      return {
        ok: false,
        fehler: 'Auf dem Bild ist keine Ergebnisliste zu erkennen. '
          + 'Bitte den ganzen Zettel gerade und gut ausgeleuchtet fotografieren.',
      };
    }

    // Reihenfolge: was auf dem Zettel oben steht, ist Platz 1. Der notierte
    // Platz sortiert vor — bei geteilten Plätzen (mehrfach dieselbe Zahl)
    // bleibt die Reihenfolge des Zettels erhalten.
    const sortiert = erkannt.zeilen
      .map((zeile, i) => ({ zeile, i }))
      .sort((a, b) =>
        (a.zeile.platz ?? Number.MAX_SAFE_INTEGER) - (b.zeile.platz ?? Number.MAX_SAFE_INTEGER)
        || a.i - b.i);

    const zeilen: VorschlagZeile[] = sortiert.map(({ zeile }, index) => {
      const zuordnung = ordneSpielerZu({ name: zeile.name, passNr: zeile.passNr });
      return {
        position: index + 1,
        platzLautZettel: zeile.platz,
        erkannterName: zeile.name,
        erkanntePassNr: zeile.passNr,
        confidence: zeile.confidence,
        vorschlag: zuordnung.treffer,
        alternativen: zuordnung.alternativen,
        sicher: zuordnung.sicher,
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
        hinweise: erkannt.hinweise,
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

export async function gibErgebnisFrei(eingabe: FreigabeEingabe): Promise<FreigabeErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };

  const status = getUploadStatus();
  if (!status.canPublish) {
    return { ok: false, fehler: `Das Ablegen ist nicht eingerichtet: ${status.missing.join(', ')}.` };
  }

  // ── Prüfungen. Jede einzelne verhindert eine Zahl, die hinterher niemand
  //    mehr erklären kann. ──
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

  const kennung = `${eingabe.datum}-${eingabe.spielortId}`;
  const ausMappe = getTournamentRecord(kennung);
  if (ausMappe?.source === 'workbook') {
    return {
      ok: false,
      fehler: `Dieses Turnier steht schon in der Auswertung des Betreibers `
        + `(${venueName(eingabe.spielortId)}, ${eingabe.datum}). Die Mappe hat Vorrang — `
        + 'bitte dort korrigieren.',
    };
  }

  // ── Punkte. Nicht vom Zettel abgeschrieben, sondern aus Platz und Feldgröße
  //    gerechnet — der Schlüssel ist die verbindliche Quelle. ──
  const punkte = eingabe.zeilen.map((_, index) => pointsFor(index + 1, teilnehmer));
  const zeile = [
    eingabe.datum,
    eingabe.spielortId,
    eingabe.zeilen.map((z, i) => `${z.passNr}:${punkte[i]}`).join(','),
  ].join('|');

  try {
    const commit = await veroeffentlicheTurnier({
      zeile,
      neueSpieler: eingabe.neueSpieler,
      beschreibung: `${venueName(eingabe.spielortId)}, ${eingabe.datum} (${teilnehmer} Starter)`,
    });
    return {
      ok: true,
      url: commit.url,
      ersetzt: commit.schonVorhanden,
      turnier: `${venueName(eingabe.spielortId)}, ${eingabe.datum}`,
      punkte,
    };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Freigabe fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Das Ergebnis konnte nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}

/** Feldgrößen, für die der Punkteschlüssel Werte führt — für den Hinweis. */
export async function feldgroesseInTabelle(teilnehmer: number): Promise<boolean> {
  return teilnehmer >= TABLE_RANGE.from && teilnehmer <= TABLE_RANGE.to;
}

/** Spielerliste für die Auswahlfelder (Name, Passnummer). */
export async function spielerListe() {
  return PLAYERS
    .filter(p => p.passNr !== null)
    .map(p => ({ passNr: p.passNr as number, name: playerName(p), nickname: p.nickname }));
}
