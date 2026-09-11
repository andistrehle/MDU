'use client';

// ============================================================
// MDC — der Turnierbaum, wie er an der Wand hängt
// ============================================================
//
// Aufbau wie auf den Papierplänen des Betreibers:
//
//        Verliererseite  ←   START   →  Siegerseite
//
// In der Mitte steht die erste Runde mit den Setznummern daneben, nach rechts
// wächst die Siegerseite (Hauptrunde), nach links die Verliererseite
// (Trostrunde). Wer beim Turnier auf den Zettel geschaut hat, findet sich hier
// ohne Erklärung zurecht — das ist der ganze Zweck.
//
// WAS VOM PAPIER ÜBERNOMMEN IST:
//
//   SETZNUMMERN Links an der ersten Runde stehen 1 bis 8 (bzw. 16, 32) —
//               dieselben Zahlen, nach denen im Lokal ausgerufen wird.
//
//   BUCHSTABEN  Der Absteiger der Siegerseite bekommt einen Buchstaben
//               („Verl. A"), und auf der Verliererseite steht derselbe
//               Buchstabe an dem Kasten, in dem er landet. Auf dem Papier ist
//               das so, weil eine Linie quer über das Blatt niemand verfolgen
//               kann — am Bildschirm gilt dasselbe.
//
//   PLATZSATZ   An der Verliererseite steht, um welchen Platz es in dieser
//               Runde geht („Verlierer wird 4."). Auf dem Zettel ist das
//               handschriftlich dazugeschrieben.
//
//   LINIEN      Innerhalb einer Seite wird gezeichnet: von den beiden
//               Vorgängern zur nächsten Partie. Das sind die Winkel, die man
//               vom Zettel kennt.
//
// Gerechnet wird die Lage aus dem Plan selbst: Jede Partie sitzt senkrecht in
// der Mitte zwischen ihren Vorgängern. Dadurch stimmt der Baum für 8, 16 und
// 32 Plätze, ohne dass irgendwo Koordinaten abgetippt wären.
// ============================================================

import { useEffect, useRef, useMemo, useState } from 'react';
import { Maximize2, Minus, Plus, X } from 'lucide-react';
import {
  besetzungen, entfaellt, spielbar, ueblicheErgebnisse, verliererPlaetze, PLATZ_GRUPPEN,
  type Besetzung, type Partie, type Turnier,
} from '@/lib/mdc/doppel-ko';

const KASTEN_B = 168;
const ZEILE_H = 27;
const KASTEN_H = ZEILE_H * 2;
/** Senkrechter Abstand zweier Erstrundenpartien, Mitte zu Mitte. */
const SLOT = 78;
const SPALTE = KASTEN_B + 54;
const RAND = 16;
/**
 * Platz über dem Baum: obere Zeile „Verliererseite ← | → Siegerseite" wie auf
 * dem Papier, darunter die Spaltenüberschriften. Zwei Zeilen, weil sich sonst
 * die Seitenbezeichnung und die Überschrift der mittleren Spalte überlagern.
 */
const KOPF = 54;
const KOPF_ZEILE = 22;
/** Gasse links der ersten Runde für die Setznummern. */
const GASSE = 34;
/**
 * Zoombereich. Nach unten so weit, dass ein 32er-Plan im Vollbild auf einen
 * Fernseher passt — lesbar ist er dort aus zwei Metern immer noch.
 */
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 1.5;

function begrenze(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 20) / 20));
}

interface Kasten {
  partie: Partie;
  x: number;
  y: number;
}

interface Spalte {
  x: number;
  titel: string;
  unter?: string;
}

function nummer(id: string): number {
  return Number(id.split('-')[1] ?? 1);
}

/**
 * A, B, C … Z, dann AA, AB … — der 32er-Plan hat 31 Absteiger und käme mit
 * 26 Buchstaben nicht aus. Zweimal „A" wäre schlimmer als „AA".
 */
function buchstabe(i: number): string {
  let text = '';
  let rest = i;
  do {
    text = String.fromCharCode(65 + (rest % 26)) + text;
    rest = Math.floor(rest / 26) - 1;
  } while (rest >= 0);
  return text;
}

function setzplatz(partie: Partie, seite: 'a' | 'b'): number | null {
  const quelle = seite === 'a' ? partie.a : partie.b;
  return quelle.art === 'setzplatz' ? quelle.nr : null;
}

export function Turnierbaum({ turnier, onWaehle, onLegs }: {
  turnier: Turnier;
  onWaehle: (partie: Partie, seite: 'a' | 'b') => void;
  onLegs: (partie: Partie, a: number, b: number) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [vollbild, setVollbild] = useState(false);
  const rahmen = useRef<HTMLDivElement>(null);
  const buehne = useRef<HTMLDivElement>(null);
  /** Zoom vor dem Vollbild — danach steht wieder, was eingestellt war. */
  const zoomVorher = useRef(1);

  const { kaesten, spalten, linien, vonHier, nachHier, breite, hoehe, mitteX } = useMemo(() => {
    const nachId = new Map(turnier.partien.map(p => [p.id, p]));

    // ── Senkrechte Lage: jede Partie mittig zwischen ihren Vorgängern ──
    const yWert = new Map<string, number>();
    const y = (id: string): number => {
      const schon = yWert.get(id);
      if (schon !== undefined) return schon;

      const partie = nachId.get(id);
      if (!partie) return 0;

      let wert: number;
      if (partie.seite === 'gewinner' && partie.runde === 1) {
        wert = nummer(id) * SLOT - SLOT / 2;
      } else {
        const quellen = [partie.a, partie.b]
          .filter(q => q.art !== 'setzplatz')
          .map(q => (q as { partie: string }).partie);
        // Auf der Verliererseite zählen nur die Vorgänger DERSELBEN Seite —
        // sonst zöge ein Absteiger von ganz rechts die Partie mit sich.
        const eigene = partie.seite === 'verlierer'
          ? quellen.filter(q => q.startsWith('L'))
          : quellen;
        const massgeblich = eigene.length ? eigene : quellen;
        wert = massgeblich.reduce((summe, q) => summe + y(q), 0) / (massgeblich.length || 1);
      }
      yWert.set(id, wert);
      return wert;
    };

    const wRunden = Math.max(
      ...turnier.partien.filter(p => p.seite === 'gewinner').map(p => p.runde),
    );
    const lRunden = Math.max(
      ...turnier.partien.filter(p => p.seite === 'verlierer').map(p => p.runde),
    );
    // ── Waagerechte Lage: Mitte ist die erste Runde ──
    const x = (partie: Partie): number => {
      if (partie.seite === 'gewinner') return (partie.runde - 1) * SPALTE;
      if (partie.seite === 'verlierer') return -partie.runde * SPALTE;
      if (partie.seite === 'finale') return wRunden * SPALTE;
      return 0;
    };

    const imBaum = turnier.partien.filter(p => p.seite !== 'platz');
    const roh: Kasten[] = imBaum.map(partie => ({
      partie,
      x: x(partie),
      y: y(partie.id) - KASTEN_H / 2,
    }));

    // Alles ins Sichtbare schieben (die Verliererseite liegt im Minus).
    const minX = Math.min(...roh.map(k => k.x));
    const minY = Math.min(...roh.map(k => k.y));
    const kaesten = roh.map(k => ({
      ...k,
      x: k.x - minX + RAND,
      y: k.y - minY + RAND + KOPF,
    }));
    const lage = new Map(kaesten.map(k => [k.partie.id, k]));

    // ── Überschrift je Spalte ──
    //
    // Auf dem Zettel steht an der Verliererseite handschriftlich, um welchen
    // Platz es geht. Genau das hier, nur gerechnet.
    const plaetze = verliererPlaetze(turnier.partien);
    const gruppe = (platz: number) => PLATZ_GRUPPEN[platz - 1] ?? platz;
    const spalten: Spalte[] = [];
    const gesehen = new Set<string>();
    for (const kasten of kaesten) {
      const { seite, runde } = kasten.partie;
      const schluessel = `${seite}-${runde}`;
      if (gesehen.has(schluessel)) continue;
      gesehen.add(schluessel);

      if (seite === 'finale') {
        spalten.push({ x: kasten.x, titel: 'Finale', unter: 'Haupt- gegen Trostrunde' });
      } else if (seite === 'gewinner') {
        spalten.push({
          x: kasten.x,
          titel: runde === wRunden ? 'Finale Hauptrunde' : `${runde}. Runde`,
          unter: runde === wRunden ? 'Sieger steht im Finale' : undefined,
        });
      } else {
        const p = plaetze[runde];
        const von = p ? gruppe(p.von) : 0;
        const bis = p ? gruppe(p.bis) : 0;
        spalten.push({
          x: kasten.x,
          titel: runde === lRunden ? 'Finale Trostrunde' : `Trostrunde ${runde}`,
          unter: !p ? undefined
            : p.von === p.bis ? `Verlierer wird ${von}.`
              : von === bis ? `Verlierer werden ${von}.`
                : `Verlierer: Platz ${von} und ${bis}`,
        });
      }
    }

    // ── Buchstaben für die Absteiger ──
    // Jede Partie der Siegerseite, deren Verlierer auf der Verliererseite
    // gebraucht wird, bekommt einen. Reihenfolge: wie im Plan, also von der
    // ersten Absteigerrunde an.
    const vonHier = new Map<string, string>();
    const nachHier = new Map<string, string[]>();
    for (const partie of imBaum) {
      if (partie.seite !== 'verlierer') continue;
      for (const quelle of [partie.a, partie.b]) {
        if (quelle.art !== 'verlierer') continue;
        if (!quelle.partie.startsWith('W')) continue;
        if (vonHier.has(quelle.partie)) continue;
        const zeichen = buchstabe(vonHier.size);
        vonHier.set(quelle.partie, zeichen);
        nachHier.set(partie.id, [...(nachHier.get(partie.id) ?? []), zeichen]);
      }
    }

    // ── Verbindungslinien innerhalb einer Seite ──
    const linien: string[] = [];
    for (const kasten of kaesten) {
      const ziel = lage.get(kasten.partie.id);
      if (!ziel) continue;
      for (const quelle of [kasten.partie.a, kasten.partie.b]) {
        if (quelle.art === 'setzplatz') continue;
        const von = lage.get(quelle.partie);
        if (!von) continue;
        // Quer über die Mitte wird nicht gezeichnet — dafür sind die
        // Buchstaben da.
        const linksNachRechts = kasten.partie.seite !== 'verlierer';
        const vonRechts = von.partie.seite !== 'verlierer';
        if (linksNachRechts !== vonRechts) continue;

        const ay = von.y + KASTEN_H / 2;
        const by = ziel.y + KASTEN_H / 2;
        const ax = linksNachRechts ? von.x + KASTEN_B : von.x;
        const bx = linksNachRechts ? ziel.x : ziel.x + KASTEN_B;
        const mx = (ax + bx) / 2;
        linien.push(`M ${ax} ${ay} H ${mx} V ${by} H ${bx}`);
      }
    }

    const breite = Math.max(...kaesten.map(k => k.x + KASTEN_B)) + RAND;
    const hoehe = Math.max(...kaesten.map(k => k.y + KASTEN_H)) + RAND + 6;
    const mitteX = Math.min(
      ...kaesten.filter(k => k.partie.seite === 'gewinner' && k.partie.runde === 1).map(k => k.x),
    );
    return { kaesten, spalten, linien, vonHier, nachHier, breite, hoehe, mitteX };
  }, [turnier]);

  // Beim Öffnen auf die erste Runde schieben. Ganz links steht das Ende der
  // Verliererseite — am Handy sähe man sonst zuerst leere Kästen.
  useEffect(() => {
    const kasten = rahmen.current;
    if (!kasten) return;
    kasten.scrollLeft = Math.max(0, mitteX * zoom - GASSE - 12);
    // Nur beim ersten Aufbau; wer danach schiebt, soll geschoben bleiben.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Vollbild an und aus. Beim Einschalten wird der Zoom so gesetzt, dass der
   * ganze Plan hineinpasst — sonst stünde auf einem großen Bildschirm ein
   * kleiner Baum in einer großen Fläche, und das Schieben ginge von vorne los.
   * Gerechnet aus dem Fenster statt aus dem Kasten: Den gibt es in der Größe
   * erst nach dem Umschalten.
   */
  function umschalten() {
    if (vollbild) {
      setZoom(zoomVorher.current);
      setVollbild(false);
      return;
    }
    zoomVorher.current = zoom;
    const platzBreit = window.innerWidth - 34;
    // Kopfzeile des Vollbilds plus Rand.
    const platzHoch = window.innerHeight - 84;
    const passt = Math.min(platzBreit / breite, platzHoch / hoehe);
    // Unter der Hälfte wird kein Name mehr gelesen. Am Handy passt ein
    // Turnierplan nun einmal nicht aufs Bild — dann bleibt der Zoom, wie er
    // war, und es wird wie bisher geschoben. Verkleinert wird nur, wenn dabei
    // auch wirklich etwas Lesbares herauskommt.
    if (passt >= 0.5) setZoom(Math.min(1.2, begrenze(passt)));
    setVollbild(true);
  }

  // ── Vollbild ──
  //
  // Am Turnierabend hängt der Plan idealerweise auf einem Bildschirm im Lokal.
  // Zwei Wege, weil einer allein nicht reicht:
  //
  //   1. Die echte Vollbildfunktion des Browsers (`requestFullscreen`) — die
  //      räumt auch die Adresszeile weg. Auf iPhones gibt es sie für normale
  //      Elemente NICHT, der Aufruf scheitert einfach.
  //   2. Deshalb liegt darunter immer eine eigene Schicht über der Seite. Die
  //      wirkt überall, auch wenn (1) nicht geht.
  //
  // Verlässt jemand das Browser-Vollbild (Escape, Wischgeste), wird die
  // Schicht mit geschlossen — sonst bliebe eine Schicht stehen, die niemand
  // mehr zuordnen kann.
  useEffect(() => {
    if (!vollbild) return;

    const zurueck = () => { setZoom(zoomVorher.current); setVollbild(false); };
    const taste = (e: KeyboardEvent) => { if (e.key === 'Escape') zurueck(); };
    const wechsel = () => { if (!document.fullscreenElement) zurueck(); };

    void buehne.current?.requestFullscreen?.().catch(() => {
      // Kein echtes Vollbild (iPhone) — die eigene Schicht genügt.
    });
    document.addEventListener('keydown', taste);
    document.addEventListener('fullscreenchange', wechsel);
    const vorher = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', taste);
      document.removeEventListener('fullscreenchange', wechsel);
      document.body.style.overflow = vorher;
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    };
  }, [vollbild]);

  return (
    <div
      ref={buehne}
      style={vollbild ? {
        position: 'fixed', inset: 0, zIndex: 90,
        background: 'var(--mdc-page)', padding: '10px 12px 12px',
        display: 'flex', flexDirection: 'column',
      } : undefined}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: '0.84rem', lineHeight: 1.6, color: 'var(--mdc-ink-dim)', flex: 1, minWidth: 220 }}>
          {vollbild
            ? 'Vollbild — mit Escape oder dem Kreuz zurück zur Seite.'
            : 'Der Plan öffnet sich bei der ersten Runde; seitlich schieben und kleiner stellen geht. Ein Buchstabe am Kasten heißt: Der Verlierer dieser Partie spielt links dort weiter, wo derselbe Buchstabe steht.'}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(ZOOM_MIN, Math.round((z - 0.1) * 100) / 100))}
            style={zoomStil}
            aria-label="Kleiner"
          >
            <Minus size={14} />
          </button>
          <span className="mdc-num" style={{ fontSize: '0.82rem', minWidth: 42, textAlign: 'center' }}>
            {Math.round(zoom * 100)} %
          </span>
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(ZOOM_MAX, Math.round((z + 0.1) * 100) / 100))}
            style={zoomStil}
            aria-label="Größer"
          >
            <Plus size={14} />
          </button>
          <button
            type="button"
            onClick={umschalten}
            style={{ ...zoomStil, width: 'auto', gap: 6, padding: '0 10px' }}
            title={vollbild ? 'Vollbild beenden' : 'Turnierbaum auf den ganzen Bildschirm'}
          >
            {vollbild ? <X size={14} /> : <Maximize2 size={14} />}
            <span style={{ fontSize: '0.8rem' }}>{vollbild ? 'Schließen' : 'Vollbild'}</span>
          </button>
        </div>
      </div>

      <div
        ref={rahmen}
        style={{
          overflow: 'auto',
          border: '1px solid var(--mdc-line)',
          borderRadius: 12,
          background: 'var(--mdc-card-2)',
          // Hoch genug für einen Blick, nicht so hoch, dass die Seite kippt.
          // Im Vollbild nimmt der Baum, was da ist.
          ...(vollbild ? { flex: 1, minHeight: 0 } : { maxHeight: '72vh' }),
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div style={{ width: breite * zoom, height: hoehe * zoom, position: 'relative' }}>
          <div
            style={{
              position: 'absolute', top: 0, left: 0, width: breite, height: hoehe,
              transform: `scale(${zoom})`, transformOrigin: 'top left',
            }}
          >
            {/* Mittellinie wie der dicke Strich auf dem Papier */}
            <Mitte kaesten={kaesten} hoehe={hoehe} />

            {spalten.map(spalte => (
              <SpaltenKopf key={`${spalte.x}-${spalte.titel}`} spalte={spalte} />
            ))}

            <svg
              width={breite}
              height={hoehe}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              aria-hidden
            >
              {linien.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="var(--mdc-line-hard)" strokeWidth={1.5} />
              ))}
            </svg>

            {kaesten.map(kasten => (
              <BaumKasten
                key={kasten.partie.id}
                turnier={turnier}
                kasten={kasten}
                abgang={vonHier.get(kasten.partie.id)}
                zugang={nachHier.get(kasten.partie.id)}
                onWaehle={onWaehle}
                onLegs={onLegs}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpaltenKopf({ spalte }: { spalte: Spalte }) {
  return (
    <div
      style={{
        position: 'absolute', left: spalte.x, top: KOPF_ZEILE, width: KASTEN_B, textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--mdc-font-display)', fontSize: 10.5, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--mdc-ink-soft)',
        }}
      >
        {spalte.titel}
      </div>
      {spalte.unter && (
        <div style={{ fontSize: 9.5, marginTop: 1, color: 'var(--mdc-ink-dim)' }}>
          {spalte.unter}
        </div>
      )}
    </div>
  );
}

function Mitte({ kaesten, hoehe }: { kaesten: Kasten[]; hoehe: number }) {
  const erste = kaesten.filter(k => k.partie.seite === 'gewinner' && k.partie.runde === 1);
  if (!erste.length) return null;
  const x = Math.min(...erste.map(k => k.x)) - GASSE;
  return (
    <>
      <div
        style={{
          position: 'absolute', left: x, top: 0, width: 3, height: hoehe,
          background: 'var(--mdc-navy)', opacity: 0.55,
        }}
      />
      {/* Links vom Strich rechtsbündig, rechts davon linksbündig — sonst
          stehen die beiden Wörter übereinander. */}
      <div style={{ ...mitteSchrift, left: 0, width: Math.max(0, x - 10), textAlign: 'right' }}>
        Verliererseite ←
      </div>
      <div style={{ ...mitteSchrift, left: x + 10 }}>
        → Siegerseite
      </div>
    </>
  );
}

function zeigeName(b: Besetzung): string {
  if (b.art === 'spieler') return b.spieler.name;
  if (b.art === 'freilos') return '—';
  return '';
}

function BaumKasten({ turnier, kasten, abgang, zugang, onWaehle, onLegs }: {
  turnier: Turnier;
  kasten: Kasten;
  /** Buchstabe, unter dem der VERLIERER dieser Partie weiterspielt. */
  abgang?: string;
  /** Buchstaben der Absteiger, die in DIESE Partie kommen. */
  zugang?: string[];
  onWaehle: (partie: Partie, seite: 'a' | 'b') => void;
  onLegs: (partie: Partie, a: number, b: number) => void;
}) {
  const { partie, x, y } = kasten;
  const { a, b } = besetzungen(turnier, partie);
  const sieger = turnier.ergebnisse[partie.id];
  const stand = turnier.legs[partie.id];
  const offen = spielbar(turnier, partie) && !sieger;
  const weg = entfaellt(turnier, partie);

  return (
    <div style={{ position: 'absolute', left: x, top: y, width: KASTEN_B }}>
      {/* Setznummern wie am linken Rand des Papierplans. Sie stehen AUSSERHALB
          des Kastens — der schneidet ab, damit lange Namen nicht überlaufen. */}
      {(['a', 'b'] as const).map((seite, i) => {
        const nr = setzplatz(partie, seite);
        if (nr === null) return null;
        const besetzt = seite === 'a' ? a : b;
        return (
          <span
            key={seite}
            aria-hidden
            style={{
              position: 'absolute', left: -GASSE + 3, top: i * ZEILE_H,
              width: GASSE - 12, height: ZEILE_H, lineHeight: `${ZEILE_H}px`,
              textAlign: 'right', fontSize: 11, fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: besetzt.art === 'spieler' ? 'var(--mdc-navy)' : 'var(--mdc-ink-faint)',
            }}
          >
            {nr}
          </span>
        );
      })}

      <div
        style={{
          border: `1px solid ${offen ? 'var(--mdc-red)' : 'var(--mdc-line-hard)'}`,
          borderRadius: 6,
          overflow: 'hidden',
          background: 'var(--mdc-card)',
          opacity: weg ? 0.45 : 1,
          boxShadow: offen ? '0 0 0 3px var(--mdc-red-a16)' : undefined,
        }}
      >
        {(['a', 'b'] as const).map((seite, i) => {
          const besetzt = seite === 'a' ? a : b;
          const gewinnt = sieger === seite;
          const verliert = sieger !== undefined && !gewinnt;
          const klickbar = besetzt.art === 'spieler'
            && (spielbar(turnier, partie) || sieger !== undefined);
          return (
            <button
              key={seite}
              type="button"
              disabled={!klickbar}
              onClick={() => onWaehle(partie, seite)}
              title={partie.titel}
              style={{
                display: 'block', width: '100%', height: ZEILE_H,
                textAlign: 'left', padding: '0 8px', font: 'inherit', fontSize: 12,
                lineHeight: `${ZEILE_H}px`,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                border: 'none',
                borderTop: i === 1 ? '1px solid var(--mdc-line)' : 'none',
                background: gewinnt ? 'rgba(20, 122, 61, 0.12)' : 'transparent',
                color: verliert ? 'var(--mdc-ink-faint)' : 'var(--mdc-ink)',
                fontWeight: gewinnt ? 700 : 400,
                textDecoration: verliert ? 'line-through' : 'none',
                cursor: klickbar ? 'pointer' : 'default',
              }}
            >
              <span style={{ display: 'flex', gap: 6 }}>
                <span style={{
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
                >
                  {zeigeName(besetzt)}
                </span>
                {stand && (
                  <span className="mdc-num" style={{ fontWeight: 700 }}>
                    {seite === 'a' ? stand[0] : stand[1]}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ergebnis direkt am Baum — nur an der Partie, die gerade dran ist.
          Ein Tipp genügt: Der Sieger ergibt sich aus dem Ergebnis. Wer keine
          Legs mitschreibt, tippt weiter einfach den Namen an. */}
      {offen && (
        <div
          style={{
            position: 'absolute', left: 0, top: KASTEN_H + 2,
            display: 'flex', gap: 3, alignItems: 'center',
          }}
        >
          {ueblicheErgebnisse(turnier.gewinnlegs).flatMap(([hoch, tief]) => [
            [hoch, tief] as [number, number],
            [tief, hoch] as [number, number],
          ]).map(([links, rechts]) => (
            <button
              key={`${links}-${rechts}`}
              type="button"
              onClick={() => onLegs(partie, links, rechts)}
              title={`Ergebnis ${links}:${rechts} eintragen`}
              style={legKnopf}
            >
              {links}:{rechts}
            </button>
          ))}
        </div>
      )}

      {/* Buchstaben unter dem Kasten — wie „VERL. N. A" auf dem Zettel. */}
      {(abgang || zugang?.length) && (
        <div
          style={{
            position: 'absolute', right: 0, top: KASTEN_H + 2,
            display: 'flex', gap: 4, alignItems: 'center',
            fontFamily: 'var(--mdc-font-display)', fontSize: 9.5,
          }}
        >
          {abgang && (
            <>
              <span style={{ color: 'var(--mdc-ink-dim)', letterSpacing: '0.08em' }}>VERL.</span>
              <span style={{ ...merker, borderColor: 'var(--mdc-line-hard)', color: 'var(--mdc-ink-soft)' }}>
                {abgang}
              </span>
            </>
          )}
          {zugang?.map(z => (
            <span key={z} style={{ ...merker, borderColor: 'var(--mdc-red)', color: 'var(--mdc-red)' }}>
              {z}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const legKnopf: React.CSSProperties = {
  padding: '1px 4px', borderRadius: 4, lineHeight: '14px',
  border: '1px solid var(--mdc-red-a35)', background: 'var(--mdc-card)',
  color: 'var(--mdc-ink-soft)', cursor: 'pointer', font: 'inherit',
  fontSize: 10, fontVariantNumeric: 'tabular-nums',
};

const merker: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 15, height: 15, padding: '0 2px', borderRadius: 3, border: '1px solid',
  fontSize: 9.5, fontWeight: 700, lineHeight: 1,
  background: 'var(--mdc-card)',
};

const mitteSchrift: React.CSSProperties = {
  position: 'absolute', top: 3,
  fontFamily: 'var(--mdc-font-display)', fontSize: 11, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: 'var(--mdc-ink-dim)',
  whiteSpace: 'nowrap',
};

const zoomStil: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 8,
  border: '1px solid var(--mdc-line)', background: 'var(--mdc-card)',
  color: 'var(--mdc-ink-soft)', cursor: 'pointer',
};
