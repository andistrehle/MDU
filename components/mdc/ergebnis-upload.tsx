'use client';

// ============================================================
// MDC — Ergebniszettel hochladen
// ============================================================
//
// Drei Schritte, und der mittlere ist der wichtigste:
//
//   1. Spielort und Datum wählen, Zettel fotografieren.
//   2. PRÜFEN. Die erkannte Liste steht Zeile für Zeile da, jede mit dem
//      vorgeschlagenen Spieler. Was unsicher erkannt wurde, ist markiert und
//      muss angefasst werden. Reihenfolge ändern, Zeile löschen, Neuling
//      anlegen — alles hier.
//   3. Freigeben. Erst jetzt wird gerechnet und abgelegt.
//
// Die Punkte werden nirgends eingetippt. Sie stehen ab Schritt 2 neben jeder
// Zeile, gerechnet aus Platz und Feldgröße — und ändern sich sichtbar, sobald
// eine Zeile dazukommt oder wegfällt. Genau das ist der Punkt an der Sache:
// Der Schlüssel hängt an der Feldgröße, ein Starter mehr ändert jede Zeile.
// ============================================================

import { useId, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowUp, Camera, Check, CircleAlert, ExternalLink,
  Loader2, Trash2, Upload, UserPlus, X,
} from 'lucide-react';
import { fieldSizeForPoints, pointsFor, rankGroupLabel, TABLE_RANGE } from '@/lib/mdc/points';
import {
  erkenneZettel, gibErgebnisFrei,
  type AbgelegtesTurnier, type VorschlagZeile,
} from '@/app/mdc/admin/ergebnis/actions';
import { MAX_ZETTEL } from '@/lib/mdc/upload-grenzen';
import { SpielerWahl, ohneZeichen, type UploadSpieler } from '@/components/mdc/spieler-wahl';
import type { NeuerSpieler } from '@/lib/mdc/ergebnis-commit';
import { SEASONS } from '@/data/season';

export type { UploadSpieler };

export interface UploadVenue {
  id: string;
  name: string;
  weekday: string;
  time: string;
  /** Wochentage, an denen dort gespielt wird (0 = Sonntag). */
  weekdays: number[];
}

export interface UploadStatusAnzeige {
  canRead: boolean;
  canPublish: boolean;
  missing: string[];
}

/** Eine Zeile, wie sie am Bildschirm bearbeitet wird. */
interface Zeile {
  /** Nur für React — die Position ergibt sich aus der Reihenfolge. */
  key: string;
  erkannterName: string | null;
  confidence: number | null;
  /** Punktzahl aus der Spalte „PKT" des Zettels — nur zur Gegenprobe. */
  punkteLautZettel: number | null;
  hinweis: string | null;
  sicher: boolean;
  /** Auf dem Zettel in der Spalte „neu" angekreuzt und ohne Passnummer. */
  vomZettelNeu: boolean;
  /** Bestätigte Passnummer, `null` solange nichts gewählt ist. */
  passNr: number | null;
  /** Ausgefüllt, wenn statt einer Auswahl jemand neu angelegt wird. */
  neu: NeuerSpieler | null;
}

/**
 * „Robert Lindinger" → Vorname ROBERT, Nachname LINDINGER. Die Spalte auf dem
 * Zettel heißt „VORNAME / NAME", vorne steht also der Vorname. Steht nur ein
 * Wort da („Bibo"), ist das der Vorname — genau wie in der Arbeitsmappe, wo
 * etliche Spieler nur unter ihrem Rufnamen geführt werden.
 */
function zerlegeName(erkannt: string | null): { firstName: string; lastName: string } {
  const teile = (erkannt ?? '').trim().split(/\s+/).filter(Boolean);
  if (teile.length === 0) return { firstName: '', lastName: '' };
  if (teile.length === 1) return { firstName: teile[0].toUpperCase(), lastName: '' };
  return {
    firstName: teile[0].toUpperCase(),
    lastName: teile.slice(1).join(' ').toUpperCase(),
  };
}

type Schritt = 'start' | 'liest' | 'pruefen' | 'sendet' | 'fertig';

const MAX_KANTE = 1600;

/**
 * Foto auf eine vernünftige Größe bringen, bevor es den Browser verlässt.
 * Ein Handyfoto hat gern 4 MB; für eine handgeschriebene Liste reicht die
 * lange Kante 1600 px bei weitem — und der Upload dauert Sekunden statt einer
 * Minute im Lokal-WLAN.
 */
async function verkleinere(datei: File): Promise<string> {
  const bitmap = await createImageBitmap(datei, { imageOrientation: 'from-image' });
  const faktor = Math.min(1, MAX_KANTE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * faktor);
  canvas.height = Math.round(bitmap.height * faktor);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Der Browser kann das Bild nicht verarbeiten.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Wochentag eines Datums in der Zählweise der Spielorte: 1 = Montag bis
 * 7 = Sonntag (`data/types.ts`). JavaScript zählt den Sonntag als 0 — ohne
 * diese Umrechnung fiele ausgerechnet der Sonntag durch jedes Raster.
 *
 * Die Uhrzeit 12:00 steht dabei, damit die Zeitzone das Datum nicht um einen
 * Tag verschiebt.
 */
/**
 * In welcher Saison liegt dieses Datum? `null` heißt: in keiner — dann kann
 * das Turnier nirgends hin, und die Freigabe würde es auch ablehnen.
 *
 * Die Prüfung steht bewusst AUCH hier im Browser und nicht nur auf dem Server:
 * Ein verlesenes Jahr soll oben am Datumsfeld auffallen und nicht erst, wenn
 * unten die geprüfte Liste fertig ist und die Freigabe zurückkommt.
 */
function saisonFuer(datum: string): string | null {
  return SEASONS.find(s => datum >= s.startDate && datum <= s.endDate)?.label ?? null;
}

/**
 * DAS EINGESTELLTE DATUM GILT — immer.
 *
 * Bis zum 25.09.2026 ersetzte ein plausibel gelesenes Datum stillschweigend
 * das ausgewählte. Vom Betreiber abbestellt, und zu Recht: Wer den Zettel in
 * der Hand hat, weiß, von welchem Abend er ist; die Erkennung rät. Eine
 * Maschine, die die Eingabe des Menschen überschreibt, ist auch dann falsch,
 * wenn sie meistens richtig liegt — man merkt es nur nicht.
 *
 * Diese Funktion entscheidet deshalb nichts mehr, sie beurteilt nur noch: Ist
 * das, was auf dem Zettel gelesen wurde, überhaupt möglich? Davon hängt die
 * Wortwahl des Hinweises ab und ob ein Knopf angeboten wird, das gelesene
 * Datum mit einem Tipp zu übernehmen.
 *
 * Die Jahreszahl ist die anfälligste Stelle der ganzen Erkennung: 2026 und
 * 2016 sehen handgeschrieben fast gleich aus (passiert am 11.09.2026).
 * Schlimmer als der offensichtliche Fall wäre 2026 → 2025 — das liegt in der
 * VORSAISON und sähe völlig unauffällig aus.
 */
function datumPlausibel(vomZettel: string, heute: string): { plausibel: boolean; grund: string | null } {
  if (saisonFuer(vomZettel) === null) {
    return { plausibel: false, grund: 'das liegt in keiner Saison' };
  }
  const tage = (Date.parse(`${vomZettel}T12:00:00`) - Date.parse(`${heute}T12:00:00`)) / 86400000;
  if (tage > 1) return { plausibel: false, grund: 'das liegt in der Zukunft' };
  if (tage < -120) return { plausibel: false, grund: 'das ist über vier Monate her' };
  return { plausibel: true, grund: null };
}

function deutschesDatum(datum: string): string {
  const [j, m, t] = datum.split('-');
  return t && m && j ? `${t}.${m}.${j}` : datum;
}

function wochentagVon(datum: string): number {
  const tag = new Date(`${datum}T12:00:00`).getDay();
  return tag === 0 ? 7 : tag;
}

function ausVorschlag(zeile: VorschlagZeile, index: number): Zeile {
  // Vorbelegt wird, was sicher ist — UND alles, was über die Passnummer kam.
  // Die Nummer ist der eindeutige Schlüssel; dass der Name daneben anders
  // geschrieben ist („Michi B" für Michael Brunn), ist der Normalfall, kein
  // Verdachtsfall. Solche Zeilen bleiben markiert, aber niemand muss sich
  // durch Hunderte Namen scrollen, um dasselbe noch einmal auszuwählen.
  const uebernehmen = zeile.sicher || zeile.quelle === 'passnummer';
  return {
    key: `${index}-${zeile.erkannterName ?? 'leer'}`,
    erkannterName: zeile.erkannterName,
    confidence: zeile.confidence,
    punkteLautZettel: zeile.punkteLautZettel,
    hinweis: zeile.hinweis,
    sicher: zeile.sicher,
    vomZettelNeu: zeile.istNeu,
    passNr: uebernehmen ? zeile.vorschlag?.passNr ?? null : null,
    // Steht auf dem Zettel ein Kreuz bei „neu" und keine Passnummer, ist die
    // Sache entschieden: Die Felder für den Neuling stehen gleich offen, mit
    // dem Namen vom Zettel und der Wertungsklasse aus der Spalte M/F. Die
    // Passnummer bleibt leer — sie kommt gleich aus der Liste der freien.
    neu: zeile.istNeu
      ? {
        passNr: 0,
        ...zerlegeName(zeile.erkannterName),
        division: zeile.weiblichLautZettel ? 'women' : 'men',
      }
      : null,
  };
}

/**
 * Vergibt an jede neue Zeile die kleinste noch freie Nummer.
 *
 * Muss über alle Zeilen zugleich laufen: Am selben Abend können zwei Neulinge
 * dabei sein (auf dem Zettel vom 09.09. waren es drei), und jeder für sich
 * bekäme sonst dieselbe „nächste freie" Nummer.
 */
function verteileFreieNummern(zeilen: Zeile[], frei: number[]): Zeile[] {
  const vergeben = new Set(
    zeilen.map(z => z.neu?.passNr ?? z.passNr).filter((n): n is number => !!n),
  );
  return zeilen.map(zeile => {
    if (!zeile.neu || zeile.neu.passNr > 0) return zeile;
    const nummer = frei.find(n => !vergeben.has(n));
    if (nummer === undefined) return zeile;
    vergeben.add(nummer);
    return { ...zeile, neu: { ...zeile.neu, passNr: nummer } };
  });
}

/**
 * Ein gelesener Zettel — ein Turnier.
 *
 * Datum und Spielort hängen AM ZETTEL, nicht an der Seite: Im Stapel kommen
 * fünf Lokale eines Abends zusammen, und jeder Zettel bringt sein eigenes
 * Datum mit. Vorbelegt wird aus der Erkennung, geändert wird oben an der
 * Karte.
 */
interface Zettel {
  key: string;
  datum: string;
  spielortId: string;
  zeilen: Zeile[];
  /** Was die Erkennung angemerkt hat (durchgestrichene Zeilen, Unleserliches). */
  hinweise: string[];
  teilnehmerLautZettel: number | null;
  /**
   * Was die Erkennung als Datum gelesen hat — NUR zum Vergleichen. Das
   * eingestellte Datum wird davon nie überschrieben.
   */
  zettelDatum: { wert: string; plausibel: boolean; grund: string | null } | null;
  /** Der Lokalname, wie er auf dem Zettel stand — `null`, wenn keiner drauf war. */
  spielortLautZettel: string | null;
  /** Ließ sich daraus ein Spielort erkennen? Sonst gilt die Vorgabe von oben. */
  spielortUebernommen: boolean;
}

/** Ein ausgewähltes Foto, bevor es gelesen wurde. */
interface Foto {
  key: string;
  bild: string;
}

/**
 * Welcher Spielort steht auf dem Zettel? Oben in der Kopfzeile trägt er den
 * Namen des Lokals. Verglichen wird ohne Groß- und Kleinschreibung und ohne
 * Umlautzeichen, und nur wenn GENAU EIN Lokal passt — bei zwei möglichen wäre
 * die Vorbelegung geraten, und geraten wird hier nichts.
 *
 * Das Ergebnis ist ohnehin nur ein Vorschlag: Der Spielort steht an jeder
 * Zettelkarte zum Ändern.
 */
function spielortAusText(text: string | null, venues: UploadVenue[]): string | null {
  const k = ohneZeichen((text ?? '').trim());
  if (k.length < 3) return null;
  const treffer = venues.filter(v => {
    const n = ohneZeichen(v.name);
    return n.length >= 3 && (k.includes(n) || n.includes(k));
  });
  return treffer.length === 1 ? treffer[0].id : null;
}

/** Zeilen, bei denen noch kein Spieler feststeht — die sperren die Freigabe. */
function offeneZeilen(zeilen: Zeile[]): number {
  return zeilen.filter(z => (z.neu ? z.neu.passNr < 1 : z.passNr === null)).length;
}

export function ErgebnisUpload({
  venues, spieler, heute, status, luecken, neueNummern,
}: {
  venues: UploadVenue[];
  spieler: UploadSpieler[];
  heute: string;
  status: UploadStatusAnzeige;
  /** Echte Lücken im Register — die werden der Reihe nach aufgefüllt. */
  luecken: number[];
  /** Die nächsten Nummern über der höchsten vergebenen. */
  neueNummern: number[];
}) {
  const [schritt, setSchritt] = useState<Schritt>('start');
  /**
   * Vorgabe für den ganzen Stapel. Jeder Zettel darf davon abweichen und tut
   * es meistens auch — sie greift nur dort, wo die Erkennung nichts hergibt.
   *
   * Vorbelegt ist ein Lokal, das heute überhaupt spielt. Sonst stünde beim
   * Aufmachen ein Montagslokal da, während gerade Mittwochabend ist — und wer
   * um Mitternacht schnell den Zettel hochlädt, übersieht das.
   */
  const [datum, setDatum] = useState(heute);
  const [spielortId, setSpielortId] = useState(
    () => venues.find(v => v.weekdays.includes(wochentagVon(heute)))?.id ?? venues[0]?.id ?? '',
  );
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [zettel, setZettel] = useState<Zettel[]>([]);
  /** Beim Lesen: der wievielte Zettel gerade dran ist. */
  const [leseStand, setLeseStand] = useState<{ nr: number; von: number } | null>(null);
  /** Zettel, die nicht gelesen werden konnten — beim Namen genannt. */
  const [nichtGelesen, setNichtGelesen] = useState<string[]>([]);
  const [fehler, setFehler] = useState<string | null>(null);
  const [ergebnis, setErgebnis] = useState<{ url: string; turniere: AbgelegtesTurnier[] } | null>(null);
  const dateiRef = useRef<HTMLInputElement>(null);
  const kameraRef = useRef<HTMLInputElement>(null);

  // Alle Nummern, die für einen Neuling in Frage kommen — Lücken zuerst.
  const freieNummern = useMemo(() => [...luecken, ...neueNummern], [luecken, neueNummern]);
  /**
   * Jede Nummer, die IRGENDWO im Stapel schon steht — nicht nur auf diesem
   * Zettel. Zwei Zettel desselben Abends dürfen nicht denselben freien Pass
   * an zwei verschiedene Neulinge vergeben.
   */
  const vergebeneNummern = useMemo(
    () => new Set(
      zettel
        .flatMap(z => z.zeilen.map(r => r.neu?.passNr ?? r.passNr))
        .filter((n): n is number => !!n),
    ),
    [zettel],
  );

  // Liegt das gewählte Datum in keiner Saison, ist die Freigabe von vornherein
  // aussichtslos — der Server lehnt sie ab. Dann lieber hier sagen, warum.
  const datumOhneSaison = saisonFuer(datum) === null;

  // ── Stand des ganzen Stapels ──
  const gesamtOffen = zettel.reduce((s, z) => s + offeneZeilen(z.zeilen), 0);
  const gesamtStarter = zettel.reduce((s, z) => s + z.zeilen.length, 0);
  const gesamtNeulinge = zettel.reduce((s, z) => s + z.zeilen.filter(r => r.neu).length, 0);
  const zuKlein = zettel.filter(z => z.zeilen.length < 2).length;
  const ohneSaison = zettel.filter(z => saisonFuer(z.datum) === null).length;
  /**
   * Zwei Zettel mit demselben Datum UND Spielort sind dasselbe Turnier — im
   * selben Commit überschriebe der zweite den ersten, und ein Turnierabend
   * verschwände still. Der Server lehnt das auch ab; gesagt wird es hier,
   * solange es sich noch ändern lässt.
   */
  const doppelteTurniere = useMemo(() => {
    const gesehen = new Map<string, number>();
    for (const z of zettel) {
      const kennung = `${z.datum}|${z.spielortId}`;
      gesehen.set(kennung, (gesehen.get(kennung) ?? 0) + 1);
    }
    return new Set([...gesehen].filter(([, n]) => n > 1).map(([k]) => k));
  }, [zettel]);
  const bereit = zettel.length > 0 && gesamtOffen === 0 && zuKlein === 0
    && ohneSaison === 0 && doppelteTurniere.size === 0;

  async function fotosGewaehlt(dateien: FileList | null) {
    if (!dateien?.length) return;
    setFehler(null);
    const platz = MAX_ZETTEL - fotos.length;
    if (platz <= 0) {
      setFehler(`Mehr als ${MAX_ZETTEL} Zettel auf einmal gehen nicht. `
        + 'Diesen Stapel freigeben, dann den nächsten.');
      return;
    }
    const neue: Foto[] = [];
    const kaputt: string[] = [];
    for (const datei of [...dateien].slice(0, platz)) {
      try {
        neue.push({ key: `${Date.now()}-${neue.length}-${datei.name}`, bild: await verkleinere(datei) });
      } catch {
        kaputt.push(datei.name);
      }
    }
    setFotos(alt => [...alt, ...neue]);
    if (kaputt.length) {
      setFehler(`Nicht verarbeiten ließ sich: ${kaputt.join(', ')}. Bitte noch einmal aufnehmen.`);
    } else if (dateien.length > platz) {
      setFehler(`Es gehen höchstens ${MAX_ZETTEL} Zettel auf einmal — `
        + `${dateien.length - platz} Foto${dateien.length - platz === 1 ? '' : 's'} `
        + 'wurde nicht übernommen.');
    }
  }

  /**
   * Liest alle Fotos, eines nach dem anderen.
   *
   * NACHEINANDER und nicht alle zugleich: Es ist derselbe Dienst, und
   * gleichzeitige Aufrufe bringen im Lokal-WLAN nichts außer Zeitüberschreitungen.
   * Der Zähler sagt, wie weit es ist.
   *
   * Ein Zettel, der nicht lesbar ist, wirft nicht den ganzen Stapel weg — er
   * wird beim Namen genannt und die anderen gehen weiter.
   */
  async function lesen() {
    if (!fotos.length) return;
    setSchritt('liest');
    setFehler(null);
    setNichtGelesen([]);

    const gelesen: Zettel[] = [];
    const schiefgegangen: string[] = [];
    // Nummern, die im Stapel schon an einen Neuling gegangen sind: Der nächste
    // Zettel darf dieselbe nicht noch einmal verteilen.
    const belegt = new Set<number>();

    for (const [i, foto] of fotos.entries()) {
      setLeseStand({ nr: i + 1, von: fotos.length });
      const antwort = await erkenneZettel(foto.bild);
      if (!antwort.ok) {
        schiefgegangen.push(`Zettel ${i + 1}: ${antwort.fehler}`);
        continue;
      }
      const vorschlag = antwort.vorschlag;
      const zeilen = verteileFreieNummern(
        vorschlag.zeilen.map(ausVorschlag),
        freieNummern.filter(n => !belegt.has(n)),
      );
      for (const z of zeilen) {
        const nummer = z.neu?.passNr ?? z.passNr;
        if (nummer) belegt.add(nummer);
      }

      // DAS EINGESTELLTE DATUM GILT. Was der Zettel sagt, wird daneben
      // gestellt, nie eingesetzt — siehe `datumPlausibel`. Beim Spielort ist
      // es anders: Ein Stapel bringt fünf Lokale eines Abends mit, eine
      // einzelne Vorgabe kann dort gar nicht für alle stimmen.
      const vomZettel = vorschlag.datumLautZettel;
      const probe = vomZettel ? datumPlausibel(vomZettel, heute) : null;
      const erkannterOrt = spielortAusText(vorschlag.spielortLautZettel, venues);

      gelesen.push({
        key: foto.key,
        datum,
        spielortId: erkannterOrt ?? spielortId,
        zeilen,
        hinweise: vorschlag.hinweise,
        teilnehmerLautZettel: vorschlag.teilnehmerLautZettel,
        zettelDatum: vomZettel
          ? { wert: vomZettel, plausibel: !!probe?.plausibel, grund: probe?.grund ?? null }
          : null,
        spielortLautZettel: vorschlag.spielortLautZettel,
        spielortUebernommen: erkannterOrt !== null,
      });
    }

    setLeseStand(null);
    setNichtGelesen(schiefgegangen);
    if (!gelesen.length) {
      setFehler(schiefgegangen.join('\n') || 'Kein Zettel konnte gelesen werden.');
      setSchritt('start');
      return;
    }
    setZettel(gelesen);
    setSchritt('pruefen');
  }

  function aendereZettel(index: number, teil: Partial<Zettel>) {
    setZettel(alt => alt.map((z, i) => (i === index ? { ...z, ...teil } : z)));
  }

  async function freigeben() {
    setSchritt('sendet');
    setFehler(null);
    const antwort = await gibErgebnisFrei(zettel.map(z => ({
      datum: z.datum,
      spielortId: z.spielortId,
      zeilen: z.zeilen.map(r => ({ passNr: (r.neu?.passNr ?? r.passNr) as number })),
      neueSpieler: z.zeilen.map(r => r.neu).filter((n): n is NeuerSpieler => n !== null),
    })));
    if (!antwort.ok) {
      setFehler(antwort.fehler);
      setSchritt('pruefen');
      return;
    }
    setErgebnis({ url: antwort.url, turniere: antwort.turniere });
    setSchritt('fertig');
  }

  function nochmal() {
    setSchritt('start');
    setFotos([]);
    setZettel([]);
    setErgebnis(null);
    setFehler(null);
    setNichtGelesen([]);
    setLeseStand(null);
    // Beide Felder leeren: Sonst meldet der Browser beim zweiten Mal dieselbe
    // Datei nicht noch einmal, wenn man versehentlich dieselbe wählt.
    if (dateiRef.current) dateiRef.current.value = '';
    if (kameraRef.current) kameraRef.current.value = '';
  }

  // ── Nicht eingerichtet: ehrlich sagen, was fehlt ──
  if (!status.canRead || !status.canPublish) {
    return (
      <div className="mdc-card" style={{ padding: '22px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <CircleAlert size={20} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
        <div>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Noch nicht eingerichtet</h2>
          <p style={{ marginTop: 8, fontSize: '0.94rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
            Der Ergebnis-Upload braucht Zugangsdaten, die im Vercel-Projekt hinterlegt werden
            müssen. Solange sie fehlen, ist die Seite hier — statt eine Schaltfläche
            anzubieten, die nichts tut.
          </p>
          <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--mdc-ink-soft)', listStyle: 'disc' }}>
            {status.missing.map(m => <li key={m}><code>{m}</code></li>)}
          </ul>
        </div>
      </div>
    );
  }

  if (schritt === 'fertig' && ergebnis) {
    const mehrere = ergebnis.turniere.length > 1;
    return (
      <div className="mdc-card mdc-card-accent" style={{ padding: '24px 22px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Check size={22} style={{ color: 'var(--mdc-win)' }} />
          {mehrere
            ? `${ergebnis.turniere.length} Ergebnisse übernommen`
            : ergebnis.turniere[0]?.ersetzt ? 'Ergebnis berichtigt' : 'Ergebnis übernommen'}
        </h2>

        <ul style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.94rem', color: 'var(--mdc-ink-soft)' }}>
          {ergebnis.turniere.map(t => (
            <li key={t.turnier} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <Check size={14} style={{ flexShrink: 0, color: 'var(--mdc-win)' }} />
              <span>
                {t.turnier} · {t.starter} Starter
                {t.ersetzt && <span style={{ color: 'var(--mdc-warn-ink)' }}> · ersetzt die vorige Fassung</span>}
              </span>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 14, fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)', maxWidth: 620 }}>
          Alles in EINEM Commit — die Seite baut sich einmal neu, nicht
          {' '}{ergebnis.turniere.length}-mal. In ein bis zwei Minuten
          steht {mehrere ? 'jedes Turnier' : 'das Turnier'} in der Rangliste, auf der
          Spielort-Seite und bei jedem beteiligten Spieler.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
          <a href={ergebnis.url} target="_blank" rel="noopener noreferrer" className="mdc-btn mdc-btn-ghost mdc-btn-sm">
            Was genau geschrieben wurde
            <ExternalLink size={14} />
          </a>
          <button type="button" onClick={nochmal} className="mdc-btn mdc-btn-primary mdc-btn-sm">
            Nächster Stapel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {fehler && (
        <div className="mdc-card" style={{ padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', borderColor: 'var(--mdc-red-a35)' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
          {/* `pre-line`, damit der Rat, was zu tun ist, als eigener Absatz
              unter der Meldung steht statt in einer Textwurst zu verschwinden. */}
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{fehler}</p>
        </div>
      )}

      {/* Zettel, die nicht gelesen werden konnten. Sie werden genannt und
          nicht verschwiegen — die übrigen sind trotzdem durchgegangen. */}
      {nichtGelesen.length > 0 && schritt !== 'start' && (
        <div className="mdc-card" style={{ padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', borderColor: 'var(--mdc-warn-line)', background: 'var(--mdc-warn-tint)' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-warn-ink)' }} />
          <div style={{ fontSize: '0.9rem', lineHeight: 1.65 }}>
            <strong>
              {nichtGelesen.length === 1 ? 'Ein Zettel' : `${nichtGelesen.length} Zettel`} konnte
              nicht gelesen werden
            </strong>{' '}
            — die übrigen stehen unten. Für {nichtGelesen.length === 1 ? 'diesen' : 'diese'} bitte
            noch einmal fotografieren.
            <ul style={{ marginTop: 8, paddingLeft: 18, listStyle: 'disc' }}>
              {nichtGelesen.map(m => <li key={m}>{m}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* ── Schritt 1: Zettel auswählen ── */}
      {(schritt === 'start' || schritt === 'liest') && (
        <div className="mdc-card" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>1 · Zettel</h2>
          <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)', maxWidth: 640 }}>
            Mehrere Zettel gehen auf einmal — bis zu {MAX_ZETTEL}. Jeder wird
            einzeln gelesen und einzeln geprüft, am Ende steht EINE Freigabe.
          </p>
          <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)', maxWidth: 640 }}>
            <strong>Das Datum hier gilt</strong> — für jeden Zettel des Stapels. Liest die
            Erkennung auf einem Zettel ein anderes, wird es <em>daneben gestellt</em> und nicht
            eingesetzt; übernehmen kannst du es dort mit einem Tipp. Der <strong>Spielort</strong>
            {' '}ist eine Vorgabe: Kommen fünf Lokale eines Abends zusammen, kann eine Auswahl
            nicht für alle stimmen — steht der Name lesbar auf dem Zettel, trägt ihn der
            jeweilige Zettel selbst ein.
          </p>

          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 16 }}>
            <SpielortWahl
              venues={venues}
              datum={datum}
              wert={spielortId}
              beschriftung="Spielort (Vorgabe)"
              gesperrt={schritt === 'liest'}
              onAendern={setSpielortId}
            />
            <label style={feldStil}>
              <span style={labelStil}>Datum · gilt für alle Zettel</span>
              <input
                type="date"
                value={datum}
                onChange={e => setDatum(e.target.value)}
                disabled={schritt === 'liest'}
                style={{
                  ...eingabeStil,
                  borderColor: datumOhneSaison ? 'var(--mdc-red)' : 'var(--mdc-line-hard)',
                }}
              />
            </label>
          </div>

          {datumOhneSaison && (
            <p style={{ marginTop: 10, fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-red-deep)' }}>
              <strong>Der {deutschesDatum(datum)} liegt in keiner Saison.</strong> Zettel, die
              selbst kein Datum hergeben, ließen sich damit nicht ablegen.
            </p>
          )}

          {schritt === 'start' && (
            <>
              {/* Zwei Wege, aber nicht überall beide:
                    • Am Handy „fotografieren" (öffnet die Kamera) UND „hochladen"
                      (öffnet die Fotos) — je nachdem, ob der Zettel gerade auf dem
                      Tisch liegt oder das Bild schon aufgenommen ist.
                    • Am Schreibtisch nur „hochladen". Dort gibt es keine Kamera,
                      die man auf einen Zettel halten könnte; „fotografieren" führte
                      zum selben Dateiauswahlfenster und wäre eine leere Zusage.
                  Die Weiche steckt in `.mdc-cam-only` (app/mdc/mdc.css), nicht in
                  einer Geräteerkennung im Code — die läge beim ersten Rendern noch
                  nicht vor und ließe die Schaltflächen springen.

                  Die Kamera nimmt EINEN Zettel je Aufnahme (so ist `capture`
                  gebaut), die Auswahl aus den Fotos mehrere zugleich. Beide
                  legen ihre Bilder oben drauf, statt die bisherigen zu
                  ersetzen — sonst wäre der Stapel nach dem zweiten Foto weg. */}
              <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <label className="mdc-btn mdc-btn-ghost mdc-cam-only" style={{ cursor: 'pointer' }}>
                  <Camera size={17} />
                  {fotos.length ? 'Noch einen fotografieren' : 'Zettel fotografieren'}
                  <input
                    ref={kameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={e => { void fotosGewaehlt(e.target.files); e.target.value = ''; }}
                    style={{ display: 'none' }}
                  />
                </label>

                <label
                  className="mdc-btn mdc-btn-ghost"
                  style={{ cursor: 'pointer', display: 'inline-flex' }}
                >
                  <Upload size={17} />
                  {fotos.length ? 'Weitere hochladen' : 'Zettel hochladen'}
                  <input
                    ref={dateiRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => { void fotosGewaehlt(e.target.files); e.target.value = ''; }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {fotos.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: '0.86rem', color: 'var(--mdc-ink-dim)', marginBottom: 10 }}>
                    {fotos.length} Zettel ausgewählt
                  </p>
                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
                    {fotos.map((foto, i) => (
                      <div key={foto.key} style={{ position: 'relative' }}>
                        {/* Kein next/image: Das ist ein Bild aus dem Browser-Speicher,
                            das nie einen Server sieht, solange nicht gelesen wird. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={foto.bild}
                          alt={`Ausgewählter Ergebniszettel ${i + 1}`}
                          style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--mdc-line)' }}
                        />
                        <button
                          type="button"
                          onClick={() => setFotos(alt => alt.filter(f => f.key !== foto.key))}
                          aria-label={`Zettel ${i + 1} entfernen`}
                          style={{
                            ...iconStil,
                            position: 'absolute', top: 6, right: 6,
                            background: 'var(--mdc-card)',
                          }}
                        >
                          <X size={14} />
                        </button>
                        <span
                          className="mdc-num"
                          style={{
                            position: 'absolute', bottom: 6, left: 6,
                            background: 'var(--mdc-card)', borderRadius: 6,
                            padding: '1px 6px', fontSize: '0.76rem',
                          }}
                        >
                          {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button type="button" onClick={lesen} className="mdc-btn mdc-btn-primary">
                      {fotos.length === 1 ? 'Zettel lesen' : `${fotos.length} Zettel lesen`}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {schritt === 'liest' && (
            <p style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--mdc-ink-soft)', fontSize: '0.94rem' }}>
              <Loader2 size={17} className="mdc-spin" />
              {leseStand && leseStand.von > 1
                ? `Zettel ${leseStand.nr} von ${leseStand.von} wird gelesen — das dauert je ein paar Sekunden.`
                : 'Der Zettel wird gelesen — das dauert ein paar Sekunden.'}
            </p>
          )}
        </div>
      )}

      {/* ── Schritt 2: prüfen ── */}
      {(schritt === 'pruefen' || schritt === 'sendet') && zettel.length > 0 && (
        <>
          <div className="mdc-card" style={{ padding: '22px 20px' }}>
            <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>
              2 · Prüfen{zettel.length > 1 ? ` (${zettel.length} Zettel)` : ''}
            </h2>
            <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)', maxWidth: 640 }}>
              Die Reihenfolge ist die Platzierung. <strong style={{ color: 'var(--mdc-red-deep)' }}>Rot</strong> heißt:
              kein Spieler zugeordnet, muss ausgewählt werden.{' '}
              <strong style={{ color: 'var(--mdc-warn-ink)' }}>Gelb</strong> heißt: nach der
              Passnummer eingesetzt, aber der Name auf dem Zettel ist anders geschrieben — bitte
              kurz vergleichen. <strong>Blau</strong> heißt: Neuling — auf dem Zettel in der
              Spalte {'„neu“'} angekreuzt und ohne Passnummer. Die Punkte rechnet die Serie
              selbst; sie ändern sich, sobald eine Zeile dazukommt oder wegfällt.
            </p>
          </div>

          {zettel.map((z, index) => (
            <ZettelKarte
              key={z.key}
              zettel={z}
              nummer={index + 1}
              anzahl={zettel.length}
              venues={venues}
              spieler={spieler}
              luecken={luecken}
              freieNummern={freieNummern}
              vergebeneNummern={vergebeneNummern}
              doppelt={doppelteTurniere.has(`${z.datum}|${z.spielortId}`)}
              gesperrt={schritt === 'sendet'}
              onAendern={teil => aendereZettel(index, teil)}
              onEntfernen={() => setZettel(alt => alt.filter((_, i) => i !== index))}
            />
          ))}

          {/* ── Freigabe für den ganzen Stapel ── */}
          <div className="mdc-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <button
                type="button"
                onClick={freigeben}
                disabled={schritt === 'sendet' || !bereit}
                className="mdc-btn mdc-btn-primary"
                style={{ opacity: bereit ? 1 : 0.5 }}
              >
                {schritt === 'sendet' ? <Loader2 size={17} className="mdc-spin" /> : <Check size={17} />}
                {schritt === 'sendet'
                  ? 'Wird abgelegt …'
                  : zettel.length === 1 ? 'Ergebnis freigeben' : `Alle ${zettel.length} Ergebnisse freigeben`}
              </button>
              <button type="button" onClick={nochmal} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
                Verwerfen
              </button>
              <span
                style={{
                  fontSize: '0.86rem',
                  color: bereit ? 'var(--mdc-ink-dim)' : 'var(--mdc-red-deep)',
                }}
              >
                {doppelteTurniere.size > 0
                  ? 'Zwei Zettel tragen dasselbe Turnier — bitte Datum oder Spielort berichtigen'
                  : ohneSaison > 0
                    ? `${ohneSaison} Zettel mit einem Datum, das in keiner Saison liegt`
                    : zuKlein > 0
                      ? `${zuKlein} Zettel mit weniger als zwei Startern`
                      : gesamtOffen > 0
                        ? `${gesamtOffen} Zeile${gesamtOffen === 1 ? '' : 'n'} noch ohne Spieler oder ohne Passnummer`
                        : `${zettel.length} Turnier${zettel.length === 1 ? '' : 'e'} · `
                          + `${gesamtStarter} Starter`
                          + (gesamtNeulinge > 0
                            ? ` · ${gesamtNeulinge} neue${gesamtNeulinge === 1 ? 'r Spieler wird' : ' Spieler werden'} angelegt`
                            : '')}
              </span>
            </div>
            {zettel.length > 1 && (
              <p style={{ marginTop: 12, fontSize: '0.84rem', lineHeight: 1.6, color: 'var(--mdc-ink-dim)' }}>
                Alle {zettel.length} Turniere gehen in EINEN Commit — entweder alle oder keines.
                Stimmt an einem etwas nicht, wird nichts geschrieben und hier steht, welcher es ist.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Ein Zettel — ein Turnier
// ------------------------------------------------------------

function ZettelKarte({
  zettel, nummer, anzahl, venues, spieler, luecken, freieNummern, vergebeneNummern,
  doppelt, gesperrt, onAendern, onEntfernen,
}: {
  zettel: Zettel;
  nummer: number;
  anzahl: number;
  venues: UploadVenue[];
  spieler: UploadSpieler[];
  luecken: number[];
  freieNummern: number[];
  /** Nummern, die im GANZEN Stapel schon vergeben sind. */
  vergebeneNummern: Set<number>;
  /** Trägt ein anderer Zettel dasselbe Datum und denselben Spielort? */
  doppelt: boolean;
  gesperrt: boolean;
  onAendern: (teil: Partial<Zettel>) => void;
  onEntfernen: () => void;
}) {
  const zeilen = zettel.zeilen;
  const teilnehmer = zeilen.length;
  const punkte = useMemo(
    () => zeilen.map((_, i) => pointsFor(i + 1, teilnehmer)),
    [zeilen, teilnehmer],
  );
  // Zwei verschiedene Zustände, zwei verschiedene Farben:
  //   offen    gar kein Spieler gewählt → Freigabe gesperrt (rot)
  //   pruefen  eingesetzt, aber der Name auf dem Zettel passt nicht → nur
  //            markiert (gelb). Die Freigabe bleibt möglich; der eingesetzte
  //            Name steht direkt neben dem, was auf dem Zettel stand.
  const offen = offeneZeilen(zeilen);
  const zuPruefen = zeilen.filter(z => z.passNr !== null && !z.sicher && !z.neu).length;
  const neulinge = zeilen.filter(z => z.neu).length;
  const datumOhneSaison = saisonFuer(zettel.datum) === null;
  const feldAusserhalb = teilnehmer > 0
    && (teilnehmer < TABLE_RANGE.from || teilnehmer > TABLE_RANGE.to);

  // Gegenprobe über die Spalte „PKT" des Zettels: Weil der Punkteschlüssel für
  // jede Feldgröße andere Werte hat, verrät sie, von wie vielen Startern der
  // Auswerter ausgegangen ist.
  //
  // Ein HINWEIS, kein Urteil. Die Spalte ist von Hand geschrieben und kann
  // selbst falsch sein; sie sperrt deshalb nichts. Maßgeblich bleibt die Zahl
  // der Starter — die Punkte kommen ohnehin aus dem Schlüssel, nie vom Zettel.
  const feldLautZettel = useMemo(
    () => fieldSizeForPoints(zeilen.map(z => z.punkteLautZettel)),
    [zeilen],
  );
  const feldWiderspruch = feldLautZettel !== null && feldLautZettel !== teilnehmer;

  function aendereZeile(index: number, teil: Partial<Zeile>) {
    onAendern({ zeilen: zeilen.map((z, i) => (i === index ? { ...z, ...teil } : z)) });
  }

  function verschiebe(index: number, richtung: -1 | 1) {
    const ziel = index + richtung;
    if (ziel < 0 || ziel >= zeilen.length) return;
    const neu = [...zeilen];
    [neu[index], neu[ziel]] = [neu[ziel], neu[index]];
    onAendern({ zeilen: neu });
  }

  return (
    <div
      className="mdc-card"
      style={{
        padding: '22px 20px',
        borderColor: doppelt || datumOhneSaison ? 'var(--mdc-red-a35)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h3 className="mdc-display" style={{ fontSize: '1.05rem' }}>
          {anzahl > 1 ? `Zettel ${nummer} von ${anzahl}` : 'Der Zettel'}
        </h3>
        {anzahl > 1 && (
          <button
            type="button"
            onClick={onEntfernen}
            disabled={gesperrt}
            className="mdc-btn mdc-btn-ghost mdc-btn-sm"
          >
            <Trash2 size={14} />
            Diesen Zettel verwerfen
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 14 }}>
        <SpielortWahl
          venues={venues}
          datum={zettel.datum}
          wert={zettel.spielortId}
          beschriftung="Spielort"
          gesperrt={gesperrt}
          onAendern={id => onAendern({ spielortId: id })}
        />
        <label style={feldStil}>
          <span style={labelStil}>Datum</span>
          <input
            type="date"
            value={zettel.datum}
            /* `zettelDatum` bleibt stehen: Der Hinweis unten entsteht aus dem
               VERGLEICH der beiden. Wer das Datum von Hand ändert, soll
               weiterhin sehen, was auf dem Zettel gelesen wurde — und nicht
               den Hinweis dadurch abschalten, dass er ihn berührt. */
            onChange={e => onAendern({ datum: e.target.value })}
            disabled={gesperrt}
            style={{
              ...eingabeStil,
              borderColor: datumOhneSaison ? 'var(--mdc-red)' : 'var(--mdc-line-hard)',
            }}
          />
        </label>
      </div>

      {/* Was der Zettel selbst zum Spielort sagt. Übernommen wird nur ein
          eindeutiger Treffer — sonst steht hier, was gelesen wurde, und die
          Vorgabe von oben bleibt stehen. */}
      {zettel.spielortLautZettel && !zettel.spielortUebernommen && (
        <p style={{ marginTop: 10, fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-warn-ink)' }}>
          Auf dem Zettel steht als Spielort {'„'}{zettel.spielortLautZettel}{'“'} — dazu ließ sich
          kein Lokal eindeutig zuordnen. Es bleibt bei der Auswahl oben; bitte einmal vergleichen.
        </p>
      )}

      {/* ── Was der Zettel zum Datum sagt ──
          Nur ein Vergleich, nie ein Eingriff: Das eingestellte Datum bleibt
          stehen. Stimmen beide überein, steht das genauso da — dann weiß man,
          dass wirklich verglichen wurde und nicht bloß nichts gelesen.
          Weichen sie ab, entscheidet ein Tipp auf den Knopf, nicht die
          Maschine. */}
      {zettel.zettelDatum && (
        zettel.zettelDatum.wert === zettel.datum ? (
          <p style={{ marginTop: 10, fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-ink-dim)' }}>
            Auf dem Zettel steht dasselbe Datum — {deutschesDatum(zettel.datum)}.
          </p>
        ) : (
          <div
            style={{
              marginTop: 10, padding: '10px 12px', borderRadius: 9,
              background: 'var(--mdc-warn-tint)', border: '1px solid var(--mdc-warn-line)',
              fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-warn-ink)',
            }}
          >
            <p>
              <strong>Der Zettel sagt ein anderes Datum.</strong> Gelesen wurde{' '}
              {'„'}{deutschesDatum(zettel.zettelDatum.wert)}{'“'}
              {zettel.zettelDatum.grund ? ` — ${zettel.zettelDatum.grund}, vermutlich ist die Jahreszahl verlesen` : ''}
              . Eingestellt ist <strong>{deutschesDatum(zettel.datum)}</strong>, und dabei bleibt es.
            </p>
            {/* Angeboten wird nur, was auch ablegbar wäre. Ein Datum ohne
                Saison mit einem Tipp übernehmen zu können, wäre eine Falle:
                Die Freigabe lehnte es danach ab. */}
            {zettel.zettelDatum.plausibel ? (
              <button
                type="button"
                onClick={() => onAendern({ datum: zettel.zettelDatum!.wert })}
                disabled={gesperrt}
                className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                style={{ marginTop: 8 }}
              >
                {deutschesDatum(zettel.zettelDatum.wert)} übernehmen
              </button>
            ) : (
              <p style={{ marginTop: 6 }}>
                Übernehmen geht nicht — dieses Datum ließe sich gar nicht ablegen.
              </p>
            )}
          </div>
        )
      )}

      {datumOhneSaison && (
        <p style={{ marginTop: 10, fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-red-deep)' }}>
          <strong>Der {deutschesDatum(zettel.datum)} liegt in keiner Saison.</strong> So lange lässt
          sich das Turnier nicht ablegen — es gehörte in keine Wertung. Bitte das Datum
          berichtigen.
        </p>
      )}

      {doppelt && (
        <p style={{ marginTop: 10, fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-red-deep)' }}>
          <strong>Ein anderer Zettel trägt dasselbe Turnier</strong> (gleicher Spielort, gleiches
          Datum). Abgelegt würde nur einer von beiden — bitte Spielort oder Datum berichtigen.
        </p>
      )}

      {zettel.hinweise.length > 0 && (
        <ul style={{ marginTop: 14, paddingLeft: 18, listStyle: 'disc', fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          {zettel.hinweise.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      )}

      {feldWiderspruch && (
        <p style={warnStil}>
          <strong>Zum Vergleich:</strong> Die Punkte in der Spalte {'„PKT“'} auf dem Zettel
          passen zu <strong>{feldLautZettel} Startern</strong>, hier stehen{' '}
          <strong>{teilnehmer} Zeilen</strong>.{' '}
          {teilnehmer > feldLautZettel
            ? `Vielleicht ${teilnehmer - feldLautZettel === 1 ? 'wurde eine Zeile' : `wurden ${teilnehmer - feldLautZettel} Zeilen`} zu viel gelesen — etwa leer gebliebene Zeilen des Formulars.`
            : `Vielleicht ${feldLautZettel - teilnehmer === 1 ? 'fehlt eine Zeile' : `fehlen ${feldLautZettel - teilnehmer} Zeilen`} — etwa weil der Zettel unten abgeschnitten ist.`}
          {' '}Es kann aber genauso gut sein, dass auf dem Zettel selbst die falschen Punkte
          stehen — dann stimmt die Liste hier und der Hinweis ist gegenstandslos.{' '}
          <strong>Maßgeblich ist die Zahl der Starter</strong>, nicht die Spalte auf dem
          Zettel: Die Punkte kommen ohnehin aus dem Schlüssel.
        </p>
      )}

      {zettel.teilnehmerLautZettel !== null
        && zettel.teilnehmerLautZettel !== teilnehmer && (
        <p style={warnStil}>
          Auf dem Zettel steht eine Teilnehmerzahl von {zettel.teilnehmerLautZettel},
          gelesen wurden {teilnehmer} Zeilen. Bitte nachzählen — die Feldgröße bestimmt
          alle Punkte.
        </p>
      )}

      {feldAusserhalb && (
        <p style={warnStil}>
          {teilnehmer} Starter liegen außerhalb der offiziellen Punktetabelle
          ({TABLE_RANGE.from} bis {TABLE_RANGE.to}). Die Punkte werden nach demselben Muster
          weitergerechnet — bitte gegenprüfen.
        </p>
      )}

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {zeilen.map((zeile, index) => (
          <ZeilenKarte
            key={zeile.key}
            zeile={zeile}
            index={index}
            anzahl={zeilen.length}
            punkte={punkte[index]}
            zeigeZettelPunkte={!feldWiderspruch}
            spieler={spieler}
            // Was ein anderer Neuling im STAPEL schon bekommen hat, steht hier
            // nicht mehr zur Wahl — sonst hätten am Ende zwei Leute dieselbe
            // Nummer, womöglich auf zwei verschiedenen Zetteln.
            freieNummern={freieNummern.filter(
              n => n === zeile.neu?.passNr || !vergebeneNummern.has(n),
            )}
            luecken={luecken}
            onAendern={teil => aendereZeile(index, teil)}
            onVerschieben={richtung => verschiebe(index, richtung)}
            onLoeschen={() => onAendern({ zeilen: zeilen.filter((_, i) => i !== index) })}
          />
        ))}
      </div>

      <p
        style={{
          marginTop: 14, fontSize: '0.86rem',
          color: offen > 0
            ? 'var(--mdc-red-deep)'
            : zuPruefen > 0 ? 'var(--mdc-warn-ink)' : 'var(--mdc-ink-dim)',
        }}
      >
        {offen > 0
          ? `${offen} Zeile${offen === 1 ? '' : 'n'} noch ohne Spieler oder ohne Passnummer`
          : zuPruefen > 0
            ? `${teilnehmer} Starter · ${zuPruefen} gelb markierte Zeile${zuPruefen === 1 ? '' : 'n'} `
              + 'nach Passnummer eingesetzt — Namen kurz vergleichen'
            : `${teilnehmer} Starter · ${punkte.reduce((s, p) => s + p, 0)} Punkte insgesamt`
              + (neulinge > 0
                ? ` · ${neulinge} neue${neulinge === 1 ? 'r Spieler wird' : ' Spieler werden'} angelegt`
                : '')}
      </p>
    </div>
  );
}

// ------------------------------------------------------------
// Spielort auswählen
// ------------------------------------------------------------

/**
 * Lokale, die am gewählten Tag spielen, stehen oben — nicht ausschließlich:
 * Ein Turnier kann ausnahmsweise an einem anderen Tag laufen.
 */
function SpielortWahl({ venues, datum, wert, beschriftung, gesperrt, onAendern }: {
  venues: UploadVenue[];
  datum: string;
  wert: string;
  beschriftung: string;
  gesperrt: boolean;
  onAendern: (id: string) => void;
}) {
  const id = useId();
  const [amTag, sonstige] = useMemo(() => {
    const tag = wochentagVon(datum);
    return [
      venues.filter(v => v.weekdays.includes(tag)),
      venues.filter(v => !v.weekdays.includes(tag)),
    ];
  }, [venues, datum]);

  return (
    <div style={feldStil}>
      <label htmlFor={id} style={labelStil}>{beschriftung}</label>
      <select
        id={id}
        value={wert}
        onChange={e => onAendern(e.target.value)}
        disabled={gesperrt}
        style={eingabeStil}
      >
        {/* An Sonn-, Freitag- und Samstagabenden kann in JEDEM Lokal ein
            Ranking laufen (`FLEXIBLE_RANKING_DAYS`). Dann gibt es keine
            Vorauswahl, und die Aufteilung entfällt — eine Gruppe
            „Andere Spielorte" ohne erste Gruppe wäre nur verwirrend. */}
        {amTag.length === 0
          ? venues.map(v => (
            <option key={v.id} value={v.id}>{v.name} · {v.weekday} {v.time}</option>
          ))
          : (
            <>
              <optgroup label="Spielt an diesem Tag">
                {amTag.map(v => (
                  <option key={v.id} value={v.id}>{v.name} · {v.weekday} {v.time}</option>
                ))}
              </optgroup>
              <optgroup label="Andere Spielorte">
                {sonstige.map(v => (
                  <option key={v.id} value={v.id}>{v.name} · {v.weekday} {v.time}</option>
                ))}
              </optgroup>
            </>
          )}
      </select>
    </div>
  );
}

// ------------------------------------------------------------
// Eine Zeile
// ------------------------------------------------------------

function ZeilenKarte({
  zeile, index, anzahl, punkte, zeigeZettelPunkte, spieler, freieNummern, luecken,
  onAendern, onVerschieben, onLoeschen,
}: {
  zeile: Zeile;
  index: number;
  anzahl: number;
  punkte: number;
  /** Nummern, die dieser Zeile für einen Neuling offenstehen. */
  freieNummern: number[];
  /** Welche davon echte Lücken im Register sind — für die Beschriftung. */
  luecken: number[];
  /**
   * Punktzahl vom Zettel danebenstellen, wenn sie abweicht? Nur sinnvoll,
   * solange die Feldgröße stimmt: Passt sie nicht, weicht ohnehin jede Zeile
   * ab, und der Hinweis über der Liste sagt es einmal statt zehnmal.
   */
  zeigeZettelPunkte: boolean;
  spieler: UploadSpieler[];
  onAendern: (teil: Partial<Zeile>) => void;
  onVerschieben: (richtung: -1 | 1) => void;
  onLoeschen: () => void;
}) {
  const offen = zeile.neu ? zeile.neu.passNr < 1 : zeile.passNr === null;
  const unsicher = !zeile.sicher;
  // Eingesetzt, aber der Name auf dem Zettel passt nicht dazu.
  const pruefen = !offen && unsicher && !zeile.neu;

  return (
    <div
      className="mdc-card"
      style={{
        padding: '12px 14px',
        // Drei Zustände, drei Farben: rot = da fehlt noch etwas, gelb = bitte
        // vergleichen, blau = Neuling (kein Fehler, nur anders).
        borderColor: offen
          ? 'var(--mdc-red-a35)'
          : pruefen
            ? 'var(--mdc-warn-line)'
            : zeile.neu ? 'var(--mdc-blue-soft)' : undefined,
        background: offen
          ? 'var(--mdc-red-a08)'
          : pruefen
            ? 'var(--mdc-warn-tint)'
            : zeile.neu ? 'var(--mdc-blue-a08)' : undefined,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <span
          className="mdc-display"
          style={{ fontSize: '1.05rem', minWidth: 62, paddingTop: 6, color: 'var(--mdc-navy)' }}
        >
          {rankGroupLabel(index + 1)}
        </span>

        <div style={{ flex: '1 1 240px', minWidth: 200 }}>
          {zeile.neu ? (
            <NeuerSpielerFelder
              wert={zeile.neu}
              vomZettel={zeile.vomZettelNeu}
              freieNummern={freieNummern}
              luecken={luecken}
              onAendern={neu => onAendern({ neu })}
              onAbbrechen={() => onAendern({ neu: null })}
            />
          ) : (
            <SpielerWahl
              spieler={spieler}
              passNr={zeile.passNr}
              beschriftung={`Spieler für Platz ${index + 1}`}
              onWaehlen={neuePassNr => onAendern({ passNr: neuePassNr })}
              onNeu={() => onAendern({
                neu: {
                  // Die kleinste Nummer, die dieser Zeile offensteht —
                  // ändern geht gleich daneben in der Auswahl.
                  passNr: freieNummern[0] ?? 0,
                  ...zerlegeName(zeile.erkannterName),
                  division: 'men',
                },
              })}
            />
          )}

          <p
            style={{
              marginTop: 6, fontSize: '0.8rem', lineHeight: 1.5,
              color: pruefen || (zeile.vomZettelNeu && zeile.hinweis)
                ? 'var(--mdc-warn-ink)'
                : 'var(--mdc-ink-dim)',
            }}
          >
            Zettel: <strong>{zeile.erkannterName ?? 'nichts erkannt'}</strong>
            {zeile.confidence !== null && zeile.confidence < 0.7 && ' · unsicher gelesen'}
            {/* Beim Neuling ist der Grund die Angabe auf dem Zettel selbst —
                das ist keine Unsicherheit, sondern die Auskunft der
                Turnierleitung. */}
            {zeile.vomZettelNeu && ' · Spalte „neu" angekreuzt, keine Passnummer'}
            {(unsicher || zeile.vomZettelNeu) && zeile.hinweis && ` · ${zeile.hinweis}`}
          </p>
        </div>

        <span
          style={{
            minWidth: 58, textAlign: 'right', paddingTop: 6,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          }}
        >
          <span className="mdc-display" style={{ fontSize: '1.05rem', color: 'var(--mdc-red)' }}>
            {punkte}
          </span>
          {/* Weicht die Punktzahl vom Zettel ab, steht sie darunter. Meist
              liegt es nicht an dieser Zeile, sondern an der Feldgröße — der
              Hinweis oben sagt es dann im Ganzen. */}
          {zeigeZettelPunkte && zeile.punkteLautZettel !== null
            && zeile.punkteLautZettel !== punkte && (
            <span
              style={{ fontSize: '0.72rem', color: 'var(--mdc-warn-ink)', lineHeight: 1.3 }}
              title={'Punktzahl laut Spalte „PKT" auf dem Zettel'}
            >
              Zettel: {zeile.punkteLautZettel}
            </span>
          )}
        </span>

        <div style={{ display: 'flex', gap: 4, paddingTop: 2 }}>
          <button type="button" onClick={() => onVerschieben(-1)} disabled={index === 0} style={iconStil} aria-label="Nach oben">
            <ArrowUp size={15} />
          </button>
          <button type="button" onClick={() => onVerschieben(1)} disabled={index === anzahl - 1} style={iconStil} aria-label="Nach unten">
            <ArrowDown size={15} />
          </button>
          <button type="button" onClick={onLoeschen} style={iconStil} aria-label="Zeile löschen">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function NeuerSpielerFelder({
  wert, vomZettel, freieNummern, luecken, onAendern, onAbbrechen,
}: {
  wert: NeuerSpieler;
  /** Auf dem Zettel angekreuzt — dann steht das hier auch so da. */
  vomZettel: boolean;
  freieNummern: number[];
  luecken: number[];
  onAendern: (neu: NeuerSpieler) => void;
  onAbbrechen: () => void;
}) {
  // Ausweg für den seltenen Fall, dass die gewünschte Nummer nicht in der
  // Liste steht — etwa weit über der höchsten vergebenen. Der Server prüft
  // ohnehin, ob sie frei ist.
  const [freieEingabe, setFreieEingabe] = useState(
    wert.passNr > 0 && !freieNummern.includes(wert.passNr),
  );
  const lueckenSet = useMemo(() => new Set(luecken), [luecken]);
  const [alsLuecke, alsNeue] = useMemo(() => [
    freieNummern.filter(n => lueckenSet.has(n)),
    freieNummern.filter(n => !lueckenSet.has(n)),
  ], [freieNummern, lueckenSet]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--mdc-ink-soft)' }}>
        <UserPlus size={14} style={{ color: 'var(--mdc-red)' }} />
        {vomZettel ? 'Neuer Spieler — auf dem Zettel angekreuzt' : 'Neuer Spieler'}
        <button type="button" onClick={onAbbrechen} style={{ ...iconStil, marginLeft: 'auto' }} aria-label="Doch auswählen">
          <X size={14} />
        </button>
      </div>
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))' }}>
        {freieEingabe ? (
          <input
            type="number"
            inputMode="numeric"
            placeholder="Passnr."
            value={wert.passNr || ''}
            onChange={e => onAendern({ ...wert, passNr: Number(e.target.value) })}
            onBlur={() => { if (!wert.passNr) setFreieEingabe(false); }}
            style={eingabeStil}
            autoFocus
          />
        ) : (
          <select
            value={wert.passNr || ''}
            onChange={e => {
              if (e.target.value === 'andere') {
                setFreieEingabe(true);
                onAendern({ ...wert, passNr: 0 });
                return;
              }
              onAendern({ ...wert, passNr: Number(e.target.value) });
            }}
            style={eingabeStil}
            aria-label="Freie Passnummer"
          >
            <option value="">— Passnr. wählen —</option>
            {alsLuecke.length > 0 && (
              <optgroup label="Freie Lücken">
                {alsLuecke.map(n => <option key={n} value={n}>{n}</option>)}
              </optgroup>
            )}
            {alsNeue.length > 0 && (
              <optgroup label="Neue Nummern">
                {alsNeue.map(n => <option key={n} value={n}>{n}</option>)}
              </optgroup>
            )}
            <option value="andere">andere Nummer eintippen …</option>
          </select>
        )}
        <input
          placeholder="Vorname"
          value={wert.firstName}
          onChange={e => onAendern({ ...wert, firstName: e.target.value.toUpperCase() })}
          style={eingabeStil}
        />
        <input
          placeholder="Nachname"
          value={wert.lastName}
          onChange={e => onAendern({ ...wert, lastName: e.target.value.toUpperCase() })}
          style={eingabeStil}
        />
        <select
          value={wert.division}
          onChange={e => onAendern({ ...wert, division: e.target.value as 'men' | 'women' })}
          style={eingabeStil}
        >
          <option value="men">Herren</option>
          <option value="women">Damen</option>
        </select>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Stile — bewusst hier und nicht in der CSS-Datei: Sie gelten nur für
// diese eine Verwaltungsseite und würden das Stylesheet der Seite aufblähen.
// ------------------------------------------------------------

const feldStil: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };

const labelStil: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--mdc-ink-dim)',
};

const eingabeStil: React.CSSProperties = {
  padding: '9px 11px',
  borderRadius: 9,
  border: '1px solid var(--mdc-line)',
  background: 'var(--mdc-card)',
  color: 'var(--mdc-ink)',
  fontSize: '0.92rem',
  fontFamily: 'inherit',
  width: '100%',
};

const iconStil: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 8,
  border: '1px solid var(--mdc-line)', background: 'var(--mdc-card)',
  color: 'var(--mdc-ink-soft)', cursor: 'pointer',
};

const warnStil: React.CSSProperties = {
  marginTop: 14, padding: '10px 12px', borderRadius: 9,
  border: '1px solid var(--mdc-red-a35)', background: 'var(--mdc-red-a08)',
  fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--mdc-red-deep)',
};
