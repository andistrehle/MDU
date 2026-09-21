'use client';

// ============================================================
// Digitaler Spielbericht
// ============================================================
//
// Der Kern des Verkaufsarguments. Heute: ein Durchschreibsatz, den zwei
// Mannschaftsführer ausfüllen, unterschreiben, abfotografieren und per Mail
// schicken — und bei dem die Ligaleitung nachrechnet, weil die Summen
// nicht stimmen.
//
// Hier: 18 Paarungen, Legs antippen, und der Gesamtstand rechnet oben mit.
// Er kann gar nicht falsch sein, weil er nicht getippt wird.
//
// Zwei Dinge, die die Demo überzeugend machen:
//   • Die Voreinstellung ist der ECHTE Spielbericht dieser Begegnung (aus
//     `einzelspieleVon`). Wer den Bericht mit dem Ergebnis in der Tabelle
//     vergleicht, findet dieselbe Zahl.
//   • Der Stand oben ändert sich sofort beim Antippen. Genau das ist der
//     Moment, in dem ein Mannschaftsführer versteht, was er davon hat.
//
// Gespeichert wird nichts.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, FileDown, Send, RotateCcw, Flame } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { Badge, Card, DemoHinweis, Feld } from '../ui/bausteine';
import { TeamWappen } from '../teams/team-wappen';

export interface BerichtSpiel {
  nummer: number;
  art: 'Einzel' | 'Doppel';
  heim: string[];
  gast: string[];
  heimLegs: number;
  gastLegs: number;
}

export interface BerichtKopf {
  ligaName: string;
  spieltag: number;
  datumText: string;
  uhrzeit: string;
  spielstaette: string;
  heim: { id: string; name: string; farben: [string, string] };
  gast: { id: string; name: string; farben: [string, string] };
}

/** Mögliche Ergebnisse eines Spiels über drei Gewinnlegs. */
const ERGEBNISSE: [number, number][] = [[3, 0], [3, 1], [3, 2], [2, 3], [1, 3], [0, 3]];

export function Spielbericht({ kopf, spiele: vorgabe }: { kopf: BerichtKopf; spiele: BerichtSpiel[] }) {
  const [spiele, setSpiele] = useState<BerichtSpiel[]>(vorgabe);
  const [status, setStatus] = useState<'offen' | 'entwurf' | 'eingereicht'>('offen');
  const [highlights, setHighlights] = useState({ h180: 2, h171: 0, finish: '121', shortLeg: '15' });

  const stand = useMemo(() => {
    let heim = 0;
    let gast = 0;
    for (const s of spiele) {
      if (s.heimLegs > s.gastLegs) heim++;
      else if (s.gastLegs > s.heimLegs) gast++;
    }
    return { heim, gast };
  }, [spiele]);

  const offene = spiele.filter(s => s.heimLegs === 0 && s.gastLegs === 0).length;
  const legs = spiele.reduce(
    (acc, s) => ({ heim: acc.heim + s.heimLegs, gast: acc.gast + s.gastLegs }),
    { heim: 0, gast: 0 },
  );

  const setzen = (nummer: number, heimLegs: number, gastLegs: number) => {
    setSpiele(s => s.map(x => x.nummer === nummer ? { ...x, heimLegs, gastLegs } : x));
    if (status === 'eingereicht') setStatus('offen');
  };

  if (status === 'eingereicht') {
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
          <h2 style={{ fontSize: '1.45rem' }}>Spielbericht erfolgreich eingereicht</h2>
          <p style={{ color: 'var(--bedv-ink-dim)', marginTop: 10, maxWidth: '54ch', marginInline: 'auto', lineHeight: 1.6 }}>
            {kopf.heim.name} – {kopf.gast.name} endet{' '}
            <strong style={{ color: 'var(--bedv-ink)' }}>{stand.heim} : {stand.gast}</strong>.
            Beide Mannschaften bekämen jetzt eine Bestätigung; das Ergebnis stünde nach der
            Freigabe durch die Ligaleitung in Tabelle und Einzelrangliste.
          </p>
          <div style={{ display: 'inline-flex', gap: 8, marginTop: 15, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Badge ton="accent">Wird von der Ligaleitung geprüft</Badge>
            <Badge ton="leise">{kopf.ligaName} · {kopf.spieltag}. Spieltag</Badge>
          </div>
        </div>

        <div style={{ maxWidth: 520, marginInline: 'auto', marginTop: 22 }}>
          <Feld label="Gesamtstand">{stand.heim} : {stand.gast}</Feld>
          <Feld label="Legs">{legs.heim} : {legs.gast}</Feld>
          <Feld label="Gemeldete 180er">{highlights.h180}</Feld>
          <Feld label="Gemeldete 171er">{highlights.h171}</Feld>
          <Feld label="Höchstes Finish">{highlights.finish || '—'}</Feld>
          <Feld label="Kürzestes Leg">{highlights.shortLeg ? `${highlights.shortLeg} Darts` : '—'}</Feld>
        </div>

        <div style={{ maxWidth: 560, marginInline: 'auto', marginTop: 20 }}>
          <DemoHinweis>
            In dieser Demo wurde nichts übertragen und nichts gespeichert.
          </DemoHinweis>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <Link href={bedvPath('/ligaleitung')} className="bedv-btn bedv-btn--primary bedv-btn--sm">
            So sieht das die Ligaleitung →
          </Link>
          <button className="bedv-btn bedv-btn--ghost bedv-btn--sm" onClick={() => setStatus('offen')}>
            <RotateCcw size={14} aria-hidden="true" /> Zurück zum Bericht
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Kopf mit mitlaufendem Gesamtstand */}
      <Card padding={0} style={{ overflow: 'hidden', position: 'sticky', top: 62, zIndex: 20 }}>
        <div className="bedv-dark" style={{ padding: '14px 17px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <span className="bedv-badge bedv-badge--dark">{kopf.ligaName} · {kopf.spieltag}. Spieltag</span>
            <span style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.8rem' }}>
              {kopf.datumText}, {kopf.uhrzeit} Uhr · {kopf.spielstaette}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 13 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
              <TeamWappen team={kopf.heim} groesse={32} />
              <span style={{ color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {kopf.heim.name}
              </span>
            </div>
            <span
              className="bedv-score"
              style={{ fontSize: 'clamp(1.6rem, 5vw, 2.1rem)', color: 'var(--bedv-accent)', flex: 'none' }}
            >
              {stand.heim} : {stand.gast}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, flexDirection: 'row-reverse' }}>
              <TeamWappen team={kopf.gast} groesse={32} />
              <span style={{ color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                {kopf.gast.name}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: '0.76rem', color: 'var(--bedv-on-dark-faint)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <span>Legs {legs.heim} : {legs.gast}</span>
            <span>{spiele.length - offene} von {spiele.length} Spielen erfasst</span>
            {offene > 0 && <span style={{ color: 'var(--bedv-accent)' }}>{offene} offen</span>}
          </div>
        </div>
      </Card>

      {/* Paarungen */}
      <div style={{ display: 'grid', gap: 9, marginTop: 18 }}>
        {spiele.map(s => {
          const heimGewinnt = s.heimLegs > s.gastLegs;
          const gastGewinnt = s.gastLegs > s.heimLegs;
          const offen = s.heimLegs === 0 && s.gastLegs === 0;

          return (
            <Card key={s.nummer} padding="12px 14px" style={offen ? { borderColor: 'var(--bedv-accent)' } : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                <span className="bedv-kicker" style={{ width: 22 }}>{s.nummer}</span>
                <Badge ton={s.art === 'Doppel' ? 'accent' : 'leise'}>{s.art}</Badge>
                {offen && <span style={{ fontSize: '0.76rem', color: 'var(--bedv-accent-deep)', fontWeight: 600 }}>noch offen</span>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span
                  style={{
                    flex: '1 1 130px', minWidth: 0, fontSize: '0.89rem',
                    fontWeight: heimGewinnt ? 700 : 500,
                    color: gastGewinnt ? 'var(--bedv-ink-dim)' : 'var(--bedv-ink)',
                  }}
                >
                  {s.heim.join(' / ')}
                </span>

                <div style={{ display: 'flex', gap: 3, flex: 'none' }}>
                  {ERGEBNISSE.map(([h, g]) => {
                    const aktiv = s.heimLegs === h && s.gastLegs === g;
                    return (
                      <button
                        key={`${h}-${g}`}
                        onClick={() => setzen(s.nummer, h, g)}
                        aria-label={`Spiel ${s.nummer}: ${h} zu ${g}`}
                        aria-pressed={aktiv}
                        style={{
                          border: `1px solid ${aktiv ? 'var(--bedv-blue)' : 'var(--bedv-line-hard)'}`,
                          background: aktiv ? 'var(--bedv-blue)' : 'var(--bedv-card)',
                          color: aktiv ? '#fff' : 'var(--bedv-ink-dim)',
                          borderRadius: 7, padding: '5px 8px', cursor: 'pointer',
                          fontFamily: 'var(--bedv-font-display)', fontWeight: 700, fontSize: '0.79rem',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {h}:{g}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setzen(s.nummer, 0, 0)}
                    aria-label={`Spiel ${s.nummer} zurücksetzen`}
                    style={{
                      border: '1px solid var(--bedv-line-hard)', background: 'var(--bedv-card)',
                      color: 'var(--bedv-ink-faint)', borderRadius: 7, padding: '5px 7px', cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={13} aria-hidden="true" />
                  </button>
                </div>

                <span
                  style={{
                    flex: '1 1 130px', minWidth: 0, fontSize: '0.89rem', textAlign: 'right',
                    fontWeight: gastGewinnt ? 700 : 500,
                    color: heimGewinnt ? 'var(--bedv-ink-dim)' : 'var(--bedv-ink)',
                  }}
                >
                  {s.gast.join(' / ')}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Highlights */}
      <Card padding="16px 18px" style={{ marginTop: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Flame size={17} aria-hidden="true" style={{ color: 'var(--bedv-red)' }} />
          <h3 style={{ fontSize: '1.02rem' }}>Highlights melden</h3>
        </div>
        <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.86rem', marginTop: 6 }}>
          Diese Werte gehen direkt in die Bestenlisten der Liga — ohne dass jemand sie
          abtippen muss.
        </p>
        <div className="bedv-grid bedv-grid--4 bedv-grid--keep2" style={{ gap: 12, marginTop: 13 }}>
          <label>
            <span className="bedv-label">180er</span>
            <input
              className="bedv-input" type="number" min={0} max={20} value={highlights.h180}
              onChange={e => setHighlights(h => ({ ...h, h180: Number(e.target.value) }))}
            />
          </label>
          <label>
            <span className="bedv-label">171er</span>
            <input
              className="bedv-input" type="number" min={0} max={20} value={highlights.h171}
              onChange={e => setHighlights(h => ({ ...h, h171: Number(e.target.value) }))}
            />
          </label>
          <label>
            <span className="bedv-label">Höchstes Finish</span>
            <input
              className="bedv-input" inputMode="numeric" value={highlights.finish}
              onChange={e => setHighlights(h => ({ ...h, finish: e.target.value }))}
              placeholder="z. B. 121"
            />
          </label>
          <label>
            <span className="bedv-label">Kürzestes Leg (Darts)</span>
            <input
              className="bedv-input" inputMode="numeric" value={highlights.shortLeg}
              onChange={e => setHighlights(h => ({ ...h, shortLeg: e.target.value }))}
              placeholder="z. B. 15"
            />
          </label>
        </div>
      </Card>

      <div style={{ marginTop: 18 }}>
        <DemoHinweis>
          Voreingestellt ist das tatsächliche Ergebnis dieser Begegnung — die Summe oben
          stimmt deshalb mit der Tabelle überein. Beim Ändern rechnet sie sofort mit.
          Gespeichert wird nichts.
        </DemoHinweis>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18, alignItems: 'center' }}>
        <button className="bedv-btn bedv-btn--ghost" onClick={() => setStatus('entwurf')}>
          <FileDown size={15} aria-hidden="true" /> Entwurf speichern
        </button>
        <button className="bedv-btn bedv-btn--accent" onClick={() => setStatus('eingereicht')} disabled={offene > 0}>
          <Send size={15} aria-hidden="true" /> Spielbericht einreichen
        </button>
        {offene > 0 && (
          <span style={{ fontSize: '0.83rem', color: 'var(--bedv-ink-dim)' }}>
            Noch {offene} {offene === 1 ? 'Spiel' : 'Spiele'} ohne Ergebnis.
          </span>
        )}
        {status === 'entwurf' && (
          <span className="bedv-badge bedv-badge--green">
            <Check size={12} aria-hidden="true" /> Entwurf gespeichert (nur in dieser Demo-Ansicht)
          </span>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href={bedvPath('/mein-bereich/spielbericht/upload')} className="bedv-btn bedv-btn--quiet bedv-btn--sm">
          Lieber den Papierbogen fotografieren? →
        </Link>
      </div>
    </>
  );
}
