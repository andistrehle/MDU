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

import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowUp, Camera, Check, CircleAlert, ExternalLink,
  Loader2, Trash2, Upload, UserPlus, X,
} from 'lucide-react';
import { fieldSizeForPoints, pointsFor, rankGroupLabel, TABLE_RANGE } from '@/lib/mdc/points';
import { erkenneZettel, gibErgebnisFrei, type Vorschlag, type VorschlagZeile } from '@/app/mdc/admin/ergebnis/actions';
import type { NeuerSpieler } from '@/lib/mdc/ergebnis-commit';

export interface UploadVenue {
  id: string;
  name: string;
  weekday: string;
  time: string;
  /** Wochentage, an denen dort gespielt wird (0 = Sonntag). */
  weekdays: number[];
}

export interface UploadSpieler {
  passNr: number;
  name: string;
  nickname: string | null;
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
  const [datum, setDatum] = useState(heute);
  // Vorbelegt ist ein Lokal, das heute überhaupt spielt. Sonst stünde beim
  // Aufmachen ein Montagslokal da, während gerade Mittwochabend ist — und wer
  // um Mitternacht schnell den Zettel hochlädt, übersieht das.
  const [spielortId, setSpielortId] = useState(
    () => venues.find(v => v.weekdays.includes(wochentagVon(heute)))?.id ?? venues[0]?.id ?? '',
  );
  const [bild, setBild] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [vorschlag, setVorschlag] = useState<Vorschlag | null>(null);
  const [zeilen, setZeilen] = useState<Zeile[]>([]);
  const [ergebnis, setErgebnis] = useState<{ url: string; ersetzt: boolean; turnier: string } | null>(null);
  const dateiRef = useRef<HTMLInputElement>(null);
  const kameraRef = useRef<HTMLInputElement>(null);

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
  // Ein Neuling ohne gewählte Nummer zählt genauso als offen: Ohne Nummer
  // ließe sich die Zeile nicht ablegen, und die Freigabe soll das hier sagen
  // und nicht erst der Server nach dem Absenden.
  const offen = zeilen.filter(z => (z.neu ? z.neu.passNr < 1 : z.passNr === null)).length;
  const zuPruefen = zeilen.filter(z => z.passNr !== null && !z.sicher && !z.neu).length;
  const neulinge = zeilen.filter(z => z.neu).length;
  // Alle Nummern, die für einen Neuling in Frage kommen — Lücken zuerst.
  const freieNummern = useMemo(() => [...luecken, ...neueNummern], [luecken, neueNummern]);
  const vergebeneNummern = useMemo(
    () => new Set(zeilen.map(z => z.neu?.passNr ?? z.passNr).filter((n): n is number => !!n)),
    [zeilen],
  );
  // Lokale, die am gewählten Tag spielen, stehen in der Auswahl oben — nicht
  // ausschließlich: Ein Turnier kann ausnahmsweise an einem anderen Tag laufen.
  const [amTag, sonstige] = useMemo(() => {
    const tag = wochentagVon(datum);
    return [
      venues.filter(v => v.weekdays.includes(tag)),
      venues.filter(v => !v.weekdays.includes(tag)),
    ];
  }, [venues, datum]);
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

  async function fotoGewaehlt(datei: File | undefined) {
    if (!datei) return;
    setFehler(null);
    try {
      setBild(await verkleinere(datei));
    } catch {
      setFehler('Das Foto konnte nicht verarbeitet werden. Bitte noch einmal aufnehmen.');
    }
  }

  async function lesen() {
    if (!bild) return;
    setSchritt('liest');
    setFehler(null);
    const antwort = await erkenneZettel(bild);
    if (!antwort.ok) {
      setFehler(antwort.fehler);
      setSchritt('start');
      return;
    }
    setVorschlag(antwort.vorschlag);
    setZeilen(verteileFreieNummern(
      antwort.vorschlag.zeilen.map(ausVorschlag),
      freieNummern,
    ));
    if (antwort.vorschlag.datumLautZettel) setDatum(antwort.vorschlag.datumLautZettel);
    setSchritt('pruefen');
  }

  function aendere(index: number, teil: Partial<Zeile>) {
    setZeilen(alt => alt.map((z, i) => (i === index ? { ...z, ...teil } : z)));
  }

  function verschiebe(index: number, richtung: -1 | 1) {
    const ziel = index + richtung;
    if (ziel < 0 || ziel >= zeilen.length) return;
    setZeilen(alt => {
      const neu = [...alt];
      [neu[index], neu[ziel]] = [neu[ziel], neu[index]];
      return neu;
    });
  }

  async function freigeben() {
    setSchritt('sendet');
    setFehler(null);
    const antwort = await gibErgebnisFrei({
      datum,
      spielortId,
      zeilen: zeilen.map(z => ({ passNr: (z.neu?.passNr ?? z.passNr) as number })),
      neueSpieler: zeilen.map(z => z.neu).filter((n): n is NeuerSpieler => n !== null),
    });
    if (!antwort.ok) {
      setFehler(antwort.fehler);
      setSchritt('pruefen');
      return;
    }
    setErgebnis({ url: antwort.url, ersetzt: antwort.ersetzt, turnier: antwort.turnier });
    setSchritt('fertig');
  }

  function nochmal() {
    setSchritt('start');
    setBild(null);
    setVorschlag(null);
    setZeilen([]);
    setErgebnis(null);
    setFehler(null);
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
    return (
      <div className="mdc-card mdc-card-accent" style={{ padding: '24px 22px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Check size={22} style={{ color: 'var(--mdc-win)' }} />
          {ergebnis.ersetzt ? 'Ergebnis berichtigt' : 'Ergebnis übernommen'}
        </h2>
        <p style={{ marginTop: 10, fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)', maxWidth: 620 }}>
          {ergebnis.turnier} mit {teilnehmer} Startern ist abgelegt. Die Seite baut sich jetzt
          neu — in ein bis zwei Minuten steht das Turnier in der Rangliste, auf der Spielort-Seite
          und bei jedem beteiligten Spieler.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
          <a href={ergebnis.url} target="_blank" rel="noopener noreferrer" className="mdc-btn mdc-btn-ghost mdc-btn-sm">
            Was genau geschrieben wurde
            <ExternalLink size={14} />
          </a>
          <button type="button" onClick={nochmal} className="mdc-btn mdc-btn-primary mdc-btn-sm">
            Nächstes Turnier
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

      {/* ── Schritt 1: Turnier und Foto ── */}
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>1 · Turnier und Zettel</h2>

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginTop: 16 }}>
          <label style={feldStil}>
            <span style={labelStil}>Spielort</span>
            <select
              value={spielortId}
              onChange={e => setSpielortId(e.target.value)}
              disabled={schritt !== 'start' && schritt !== 'pruefen'}
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
          </label>

          <label style={feldStil}>
            <span style={labelStil}>Datum</span>
            <input
              type="date"
              value={datum}
              onChange={e => setDatum(e.target.value)}
              disabled={schritt !== 'start' && schritt !== 'pruefen'}
              style={eingabeStil}
            />
          </label>
        </div>

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
                nicht vor und ließe die Schaltflächen springen. */}
            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <label className="mdc-btn mdc-btn-ghost mdc-cam-only" style={{ cursor: 'pointer' }}>
                <Camera size={17} />
                Zettel fotografieren
                <input
                  ref={kameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={e => fotoGewaehlt(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
              </label>

              <label
                className="mdc-btn mdc-btn-ghost"
                style={{ cursor: 'pointer', display: 'inline-flex' }}
              >
                <Upload size={17} />
                Zettel hochladen
                <input
                  ref={dateiRef}
                  type="file"
                  accept="image/*"
                  onChange={e => fotoGewaehlt(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {bild && (
              <div style={{ marginTop: 16 }}>
                {/* Kein next/image: Das ist ein Bild aus dem Browser-Speicher,
                    das nie einen Server sieht, solange nicht gelesen wird. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bild}
                  alt="Aufgenommener Ergebniszettel"
                  style={{ maxWidth: 320, width: '100%', borderRadius: 10, border: '1px solid var(--mdc-line)' }}
                />
                <div style={{ marginTop: 14 }}>
                  <button type="button" onClick={lesen} className="mdc-btn mdc-btn-primary">
                    Zettel lesen
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {schritt === 'liest' && (
          <p style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--mdc-ink-soft)', fontSize: '0.94rem' }}>
            <Loader2 size={17} className="mdc-spin" />
            Der Zettel wird gelesen — das dauert ein paar Sekunden.
          </p>
        )}
      </div>

      {/* ── Schritt 2: prüfen ── */}
      {(schritt === 'pruefen' || schritt === 'sendet') && vorschlag && (
        <div className="mdc-card" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>2 · Prüfen</h2>
          <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)', maxWidth: 640 }}>
            Die Reihenfolge ist die Platzierung. <strong style={{ color: 'var(--mdc-red-deep)' }}>Rot</strong> heißt:
            kein Spieler zugeordnet, muss ausgewählt werden.{' '}
            <strong style={{ color: 'var(--mdc-warn-ink)' }}>Gelb</strong> heißt: nach der
            Passnummer eingesetzt, aber der Name auf dem Zettel ist anders geschrieben — bitte
            kurz vergleichen. <strong>Blau</strong> heißt: Neuling — auf dem Zettel in der
            Spalte {'„neu“'} angekreuzt und ohne Passnummer. Die Punkte rechnet die Serie
            selbst; sie ändern sich, sobald eine Zeile dazukommt oder wegfällt.
          </p>

          {vorschlag.hinweise.length > 0 && (
            <ul style={{ marginTop: 14, paddingLeft: 18, listStyle: 'disc', fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
              {vorschlag.hinweise.map((h, i) => <li key={i}>{h}</li>)}
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

          {vorschlag.teilnehmerLautZettel !== null
            && vorschlag.teilnehmerLautZettel !== teilnehmer && (
            <p style={warnStil}>
              Auf dem Zettel steht eine Teilnehmerzahl von {vorschlag.teilnehmerLautZettel},
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
                // Was ein anderer Neuling in dieser Liste schon bekommen hat,
                // steht hier nicht mehr zur Wahl — sonst hätten am Ende zwei
                // Leute dieselbe Nummer.
                freieNummern={freieNummern.filter(
                  n => n === zeile.neu?.passNr || !vergebeneNummern.has(n),
                )}
                luecken={luecken}
                onAendern={teil => aendere(index, teil)}
                onVerschieben={richtung => verschiebe(index, richtung)}
                onLoeschen={() => setZeilen(alt => alt.filter((_, i) => i !== index))}
              />
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              onClick={freigeben}
              disabled={schritt === 'sendet' || offen > 0 || teilnehmer < 2}
              className="mdc-btn mdc-btn-primary"
              style={{ opacity: offen > 0 || teilnehmer < 2 ? 0.5 : 1 }}
            >
              {schritt === 'sendet' ? <Loader2 size={17} className="mdc-spin" /> : <Check size={17} />}
              {schritt === 'sendet' ? 'Wird abgelegt …' : 'Ergebnis freigeben'}
            </button>
            <button type="button" onClick={nochmal} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
              Verwerfen
            </button>
            <span
              style={{
                fontSize: '0.86rem',
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
            </span>
          </div>
        </div>
      )}
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
            <select
              value={zeile.passNr ?? ''}
              onChange={e => {
                if (e.target.value === 'neu') {
                  onAendern({
                    neu: {
                      // Die kleinste Nummer, die dieser Zeile offensteht —
                      // ändern geht gleich daneben in der Auswahl.
                      passNr: freieNummern[0] ?? 0,
                      ...zerlegeName(zeile.erkannterName),
                      division: 'men',
                    },
                  });
                  return;
                }
                onAendern({ passNr: e.target.value ? Number(e.target.value) : null });
              }}
              style={{ ...eingabeStil, width: '100%' }}
            >
              <option value="">— Spieler wählen —</option>
              {spieler.map(s => (
                <option key={s.passNr} value={s.passNr}>
                  {s.name}{s.nickname ? ` (${s.nickname})` : ''} · {s.passNr}
                </option>
              ))}
              <option value="neu">+ Neuen Spieler anlegen</option>
            </select>
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
