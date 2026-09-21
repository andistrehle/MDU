'use client';

// ============================================================
// Papier-Spielbericht fotografieren (Zukunftsfeature)
// ============================================================
//
// AUSDRÜCKLICH ALS AUSBLICK GEKENNZEICHNET. Für den BeDV ist hier nichts
// implementiert; gezeigt wird der Ablauf, damit im Gespräch klar wird, dass
// der Papierweg nicht abgeschafft werden muss.
//
// Das Foto verlässt den Browser NICHT. Es wird nur mit
// `URL.createObjectURL` angezeigt — es gibt keinen Upload, keinen Dienst,
// keine Übertragung. Das ist in einer Demo ohne Datenschutzerklärung nicht
// nur sauber, es ist die Voraussetzung dafür, sie überhaupt vorführen zu
// dürfen.
//
// Die „Erkennung" ist eine zeitgesteuerte Abfolge. Sie liefert bewusst
// nicht alles sauber: Zwei Zeilen kommen als UNSICHER zurück. Genau das ist
// die Botschaft — eine Erkennung übernimmt nie ungeprüft, ein Mensch gibt
// frei. Eine Demo, in der die Erkennung zu 100 % funktioniert, verspricht
// etwas, das kein System halten kann.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, FileImage, Check, AlertTriangle, RotateCcw, Send, Loader2, X } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { Badge, Card, DemoHinweis, Feld } from '../ui/bausteine';

export interface ErkanntesSpiel {
  nummer: number;
  art: 'Einzel' | 'Doppel';
  heim: string;
  gast: string;
  heimLegs: number;
  gastLegs: number;
  /** Wie sicher ist die Erkennung dieser Zeile? */
  sicher: boolean;
  hinweis?: string;
}

export interface ErkanntesErgebnis {
  liga: string;
  begegnung: string;
  datumText: string;
  heimName: string;
  gastName: string;
  stand: [number, number];
  spiele: ErkanntesSpiel[];
  highlights: { label: string; wert: string; sicher: boolean }[];
}

type Phase = 'auswahl' | 'erkennung' | 'pruefung' | 'fertig';

const SCHRITTE = [
  'Bild wird vorbereitet …',
  'Kopfzeile wird gelesen (Liga, Datum, Mannschaften) …',
  'Paarungen werden erkannt …',
  'Legs und Gesamtstand werden gelesen …',
  'Highlights werden gesucht …',
  'Ergebnis wird gegen die Meldung geprüft …',
];

export function OcrUpload({ ergebnis }: { ergebnis: ErkanntesErgebnis }) {
  const [phase, setPhase] = useState<Phase>('auswahl');
  const [bild, setBild] = useState<string | null>(null);
  const [dateiname, setDateiname] = useState<string | null>(null);
  const [schritt, setSchritt] = useState(0);
  const [geprueft, setGeprueft] = useState<Set<number>>(new Set());
  const dateiRef = useRef<HTMLInputElement>(null);

  // Vorschau-Adresse wieder freigeben, sonst hält der Browser das Bild fest.
  useEffect(() => () => { if (bild) URL.revokeObjectURL(bild); }, [bild]);

  useEffect(() => {
    if (phase !== 'erkennung') return;
    if (schritt >= SCHRITTE.length) {
      const t = window.setTimeout(() => setPhase('pruefung'), 400);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setSchritt(s => s + 1), 520);
    return () => window.clearTimeout(t);
  }, [phase, schritt]);

  const starten = (datei?: File) => {
    if (datei) {
      setBild(alt => { if (alt) URL.revokeObjectURL(alt); return URL.createObjectURL(datei); });
      setDateiname(datei.name);
    } else {
      setBild(null);
      setDateiname('Beispielbogen (Demo)');
    }
    setSchritt(0);
    setGeprueft(new Set());
    setPhase('erkennung');
  };

  const zuruecksetzen = () => {
    if (bild) URL.revokeObjectURL(bild);
    setBild(null);
    setDateiname(null);
    setSchritt(0);
    setGeprueft(new Set());
    setPhase('auswahl');
  };

  const unsicher = ergebnis.spiele.filter(s => !s.sicher);
  const alleGeprueft = unsicher.every(s => geprueft.has(s.nummer));

  // ── Auswahl ──
  if (phase === 'auswahl') {
    return (
      <>
        <Card padding="30px 24px">
          <div style={{ textAlign: 'center', maxWidth: 520, marginInline: 'auto' }}>
            <span
              aria-hidden="true"
              style={{
                width: 60, height: 60, borderRadius: 16, display: 'grid', placeItems: 'center',
                background: 'var(--bedv-blue-mist)', color: 'var(--bedv-blue-deep)', margin: '0 auto 16px',
              }}
            >
              <Camera size={28} />
            </span>
            <h2 style={{ fontSize: '1.3rem' }}>Papier-Spielbericht hochladen</h2>
            <p style={{ color: 'var(--bedv-ink-dim)', marginTop: 9, lineHeight: 1.6 }}>
              Wer den Bogen lieber von Hand ausfüllt, fotografiert ihn am Ende ab. Die
              erkannten Werte werden am Bildschirm geprüft und erst dann freigegeben.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
              <button className="bedv-btn bedv-btn--primary" onClick={() => dateiRef.current?.click()}>
                <Camera size={16} aria-hidden="true" /> Foto aufnehmen
              </button>
              <button className="bedv-btn bedv-btn--ghost" onClick={() => dateiRef.current?.click()}>
                <FileImage size={16} aria-hidden="true" /> Datei auswählen
              </button>
              {/* Ohne Bild zur Hand — in einer Vorführung der häufigste Fall. */}
              <button className="bedv-btn bedv-btn--ghost" onClick={() => starten()}>
                Beispielbogen verwenden
              </button>
            </div>

            <input
              ref={dateiRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => {
                const datei = e.target.files?.[0];
                if (datei) starten(datei);
                e.target.value = '';
              }}
            />
          </div>
        </Card>

        <div style={{ marginTop: 18 }}>
          <DemoHinweis ton="accent">
            <strong>Zukunftsfeature, für den BeDV nicht implementiert.</strong> Gezeigt wird
            der Ablauf. Das gewählte Bild verlässt den Browser nicht: Es wird nur lokal
            angezeigt, nichts hochgeladen und nichts an einen Dienst geschickt.
          </DemoHinweis>
        </div>

        <Card padding="18px 20px" style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: '1.02rem' }}>Warum der Papierweg bleiben darf</h3>
          <ul style={{ margin: '10px 0 0', paddingLeft: 18, display: 'grid', gap: 8, color: 'var(--bedv-ink-soft)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            <li>Am Automaten ist ein Blatt Papier oft schneller als ein Telefon.</li>
            <li>Der Bogen bleibt als Beleg, falls es später Streit gibt.</li>
            <li>Nicht jeder Mannschaftsführer will am Handy tippen — und muss es dann nicht.</li>
            <li>Die Erkennung nimmt die Abtipparbeit ab, <strong style={{ color: 'var(--bedv-ink)' }}>entscheidet aber nichts</strong>: Freigegeben wird von Hand.</li>
          </ul>
          <Link href={bedvPath('/mein-bereich/spielbericht')} className="bedv-btn bedv-btn--quiet bedv-btn--sm" style={{ marginTop: 12 }}>
            Zum digitalen Spielbericht →
          </Link>
        </Card>
      </>
    );
  }

  // ── Erkennung ──
  if (phase === 'erkennung') {
    return (
      <Card padding="28px 24px">
        <div style={{ display: 'grid', gap: 22, gridTemplateColumns: bild ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)' }} className="bedv-liga-split">
          {bild && (
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element -- lokale Objekt-URL, kein Netzwerkbild; `next/image` kann damit nichts anfangen */}
              <img
                src={bild}
                alt="Aufgenommener Spielbericht"
                style={{ width: '100%', borderRadius: 12, border: '1px solid var(--bedv-line)', maxHeight: 400, objectFit: 'contain', background: 'var(--bedv-tint)' }}
              />
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Loader2 size={20} className="bedv-spin-fast" aria-hidden="true" style={{ color: 'var(--bedv-blue)' }} />
              <h2 style={{ fontSize: '1.2rem' }}>Spielbericht wird erkannt …</h2>
            </div>
            {dateiname && (
              <div style={{ fontSize: '0.82rem', color: 'var(--bedv-ink-dim)', marginTop: 6 }}>{dateiname}</div>
            )}

            <div style={{ display: 'grid', gap: 9, marginTop: 18 }}>
              {SCHRITTE.map((s, i) => {
                const erledigt = i < schritt;
                const laeuft = i === schritt;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: erledigt || laeuft ? 1 : 0.4 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 20, height: 20, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center',
                        background: erledigt ? 'var(--bedv-green-soft)' : laeuft ? 'var(--bedv-blue-mist)' : 'var(--bedv-tint-2)',
                        color: erledigt ? 'var(--bedv-green)' : 'var(--bedv-blue)',
                      }}
                    >
                      {erledigt ? <Check size={12} /> : laeuft ? <Loader2 size={12} className="bedv-spin-fast" /> : ''}
                    </span>
                    <span style={{ fontSize: '0.88rem', color: erledigt ? 'var(--bedv-ink)' : 'var(--bedv-ink-dim)' }}>{s}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 20 }}>
              <button className="bedv-btn bedv-btn--ghost bedv-btn--sm" onClick={zuruecksetzen}>
                <X size={14} aria-hidden="true" /> Abbrechen
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // ── Fertig ──
  if (phase === 'fertig') {
    return (
      <Card padding="30px 26px" className="bedv-pop">
        <div style={{ textAlign: 'center' }}>
          <span
            aria-hidden="true"
            style={{
              width: 62, height: 62, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: 'var(--bedv-green-soft)', color: 'var(--bedv-green)', margin: '0 auto 16px',
            }}
          >
            <Check size={32} />
          </span>
          <h2 style={{ fontSize: '1.4rem' }}>Spielbericht übernommen</h2>
          <p style={{ color: 'var(--bedv-ink-dim)', marginTop: 10, maxWidth: '54ch', marginInline: 'auto', lineHeight: 1.6 }}>
            {ergebnis.begegnung} — <strong style={{ color: 'var(--bedv-ink)' }}>{ergebnis.stand[0]} : {ergebnis.stand[1]}</strong>.
            Der Bericht liegt jetzt bei der Ligaleitung; das Foto bliebe als Beleg am Vorgang.
          </p>
          <div style={{ display: 'inline-flex', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Badge ton="accent">Wird von der Ligaleitung geprüft</Badge>
            <Badge ton="leise">aus Foto erkannt</Badge>
          </div>
        </div>

        <div style={{ maxWidth: 560, marginInline: 'auto', marginTop: 22 }}>
          <DemoHinweis ton="accent">
            Zukunftsfeature. In dieser Demo wurde nichts hochgeladen, nichts erkannt und
            nichts gespeichert — der Ablauf ist nachgestellt.
          </DemoHinweis>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <Link href={bedvPath('/ligaleitung')} className="bedv-btn bedv-btn--primary bedv-btn--sm">
            So sieht das die Ligaleitung →
          </Link>
          <button className="bedv-btn bedv-btn--ghost bedv-btn--sm" onClick={zuruecksetzen}>
            <RotateCcw size={14} aria-hidden="true" /> Noch einmal
          </button>
        </div>
      </Card>
    );
  }

  // ── Prüfung ──
  return (
    <>
      <Card padding="18px 20px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem' }}>Erkannte Daten prüfen</h2>
            <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.88rem', marginTop: 5 }}>
              {unsicher.length === 0
                ? 'Alle Zeilen wurden sicher gelesen.'
                : `${unsicher.length} Zeilen sind unsicher — sie müssen bestätigt werden, bevor der Bericht übernommen wird.`}
            </p>
          </div>
          <button className="bedv-btn bedv-btn--ghost bedv-btn--sm" onClick={zuruecksetzen}>
            <RotateCcw size={14} aria-hidden="true" /> Anderes Bild
          </button>
        </div>

        <div className="bedv-grid bedv-grid--2" style={{ marginTop: 16 }}>
          <div>
            <div className="bedv-kicker" style={{ marginBottom: 6 }}>Kopfzeile</div>
            <Feld label="Liga">{ergebnis.liga}</Feld>
            <Feld label="Begegnung">{ergebnis.begegnung}</Feld>
            <Feld label="Datum">{ergebnis.datumText}</Feld>
            <Feld label="Gesamtstand">{ergebnis.stand[0]} : {ergebnis.stand[1]}</Feld>
          </div>
          <div>
            <div className="bedv-kicker" style={{ marginBottom: 6 }}>Highlights</div>
            {ergebnis.highlights.map(h => (
              <Feld key={h.label} label={h.label}>
                {h.wert}
                {!h.sicher && (
                  <span style={{ color: 'var(--bedv-accent-deep)', marginLeft: 7, fontSize: '0.76rem' }}>unsicher</span>
                )}
              </Feld>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        {ergebnis.spiele.map(s => {
          const bestaetigt = geprueft.has(s.nummer);
          const braucht = !s.sicher && !bestaetigt;
          return (
            <Card
              key={s.nummer}
              padding="11px 14px"
              style={braucht ? { borderColor: 'var(--bedv-accent)', background: 'var(--bedv-accent-soft)' } : undefined}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="bedv-kicker" style={{ width: 20, flex: 'none' }}>{s.nummer}</span>
                <Badge ton={s.art === 'Doppel' ? 'accent' : 'leise'}>{s.art}</Badge>
                <span style={{ flex: '1 1 150px', minWidth: 0, fontSize: '0.88rem' }}>{s.heim}</span>
                <span className="bedv-score" style={{ fontSize: '1rem', flex: 'none' }}>
                  {s.heimLegs}:{s.gastLegs}
                </span>
                <span style={{ flex: '1 1 150px', minWidth: 0, fontSize: '0.88rem', textAlign: 'right' }}>{s.gast}</span>

                {s.sicher ? (
                  <Check size={16} aria-hidden="true" style={{ color: 'var(--bedv-green)', flex: 'none' }} />
                ) : bestaetigt ? (
                  <Badge ton="gruen"><Check size={12} aria-hidden="true" /> bestätigt</Badge>
                ) : (
                  <button
                    className="bedv-btn bedv-btn--accent bedv-btn--sm"
                    style={{ flex: 'none' }}
                    onClick={() => setGeprueft(g => new Set(g).add(s.nummer))}
                  >
                    Bestätigen
                  </button>
                )}
              </div>
              {braucht && s.hinweis && (
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 8, fontSize: '0.8rem', color: 'var(--bedv-accent-deep)' }}>
                  <AlertTriangle size={14} aria-hidden="true" /> {s.hinweis}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div style={{ marginTop: 18 }}>
        <DemoHinweis ton="accent">
          Eine Erkennung übernimmt nie ungeprüft. Unsichere Zeilen sperren die Freigabe,
          bis ein Mensch sie bestätigt hat — genau so gehört es sich, und genau deshalb
          zeigt diese Demo sie auch.
        </DemoHinweis>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18, alignItems: 'center' }}>
        <button className="bedv-btn bedv-btn--accent" onClick={() => setPhase('fertig')} disabled={!alleGeprueft}>
          <Send size={15} aria-hidden="true" /> Erkannte Daten übernehmen
        </button>
        <Link href={bedvPath('/mein-bereich/spielbericht')} className="bedv-btn bedv-btn--ghost">
          Lieber von Hand erfassen
        </Link>
        {!alleGeprueft && (
          <span style={{ fontSize: '0.83rem', color: 'var(--bedv-ink-dim)' }}>
            Noch {unsicher.filter(s => !geprueft.has(s.nummer)).length} unsichere Zeilen zu bestätigen.
          </span>
        )}
      </div>
    </>
  );
}
