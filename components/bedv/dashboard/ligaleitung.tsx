'use client';

// ============================================================
// Ligaleitung — Arbeitsliste statt Postfach
// ============================================================
//
// Der letzte Teil des Verkaufsgesprächs und der, der den Verband überzeugt:
// Nicht nur die Homepage wird besser, auch die Arbeit dahinter.
//
// Was heute in einem Mailpostfach liegt — Meldungen, Spielberichte,
// Passanträge, Proteste — steht hier als Liste mit Stand. Jeder Vorgang hat
// drei Wege: freigeben, Nachbesserung anfordern, ablehnen. Die Entscheidung
// wirkt in dieser Demo nur im Browser, aber sie wirkt SOFORT sichtbar — der
// Zähler oben geht runter. Genau das versteht man ohne Erklärung.
// ============================================================

import { useState } from 'react';
import Link from 'next/link';
import {
  Check, X, RotateCcw, ChevronDown, ShieldCheck, ClipboardList,
  Users, AlertTriangle, FileText, Undo2,
} from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { Badge, Card, DemoHinweis, Feld, LeerZustand, SectionHead, Stat } from '../ui/bausteine';
import { useDemoAuth } from '../layout/demo-auth';
import { OFFENE_BERICHTE, OFFENE_MELDUNGEN } from '@/data/bedv/verwaltung';

type Entscheidung = 'freigegeben' | 'nachbesserung' | 'abgelehnt';

const ENTSCHEIDUNG_TEXT: Record<Entscheidung, string> = {
  freigegeben: 'Freigegeben — die Mannschaft ist gemeldet und erscheint im Spielplan.',
  nachbesserung: 'Nachbesserung angefordert — der Mannschaftsführer bekommt eine Nachricht mit dem, was fehlt.',
  abgelehnt: 'Abgelehnt — mit Begründung an den Mannschaftsführer.',
};

const ENTSCHEIDUNG_TON: Record<Entscheidung, 'gruen' | 'accent' | 'rot'> = {
  freigegeben: 'gruen', nachbesserung: 'accent', abgelehnt: 'rot',
};

function alter(vorTagen: number): string {
  if (vorTagen === 0) return 'heute eingegangen';
  if (vorTagen === 1) return 'gestern eingegangen';
  return `vor ${vorTagen} Tagen eingegangen`;
}

export function Ligaleitung() {
  const { rolle, bereit } = useDemoAuth();
  const [meldungen, setMeldungen] = useState<Record<string, Entscheidung>>({});
  const [berichte, setBerichte] = useState<Record<string, Entscheidung>>({});
  const [offenId, setOffenId] = useState<string | null>(OFFENE_MELDUNGEN[0]?.id ?? null);

  if (!bereit) {
    return (
      <div className="bedv-shell" style={{ paddingBlock: 52 }}>
        <div className="bedv-skeleton" style={{ height: 140, borderRadius: 14 }} />
      </div>
    );
  }

  if (rolle !== 'ligaleitung' && rolle !== 'admin') {
    return (
      <div className="bedv-shell" style={{ paddingBlock: 52 }}>
        <LeerZustand
          titel="Dieser Bereich gehört der Ligaleitung"
          text="Wechsle die Demo-Rolle, um die Verwaltungsseite zu sehen. Es braucht kein Passwort."
          aktion={{ label: 'Rolle wechseln', href: bedvPath('/login') }}
        />
      </div>
    );
  }

  const offeneMeldungen = OFFENE_MELDUNGEN.filter(m => !meldungen[m.id]);
  const offeneBerichte = OFFENE_BERICHTE.filter(b => !berichte[b.id]);

  return (
    <div className="bedv-shell" style={{ paddingBlock: '26px 52px', display: 'grid', gap: 30 }}>
      {/* Kennzahlen */}
      <div className="bedv-grid bedv-grid--4 bedv-grid--keep2">
        {[
          { icon: ClipboardList, label: 'Offene Mannschaftsmeldungen', wert: offeneMeldungen.length, ziel: '#meldungen' },
          { icon: FileText, label: 'Spielberichte zur Prüfung', wert: offeneBerichte.length, ziel: '#berichte' },
          { icon: Users, label: 'Spielberechtigungen offen', wert: 5, ziel: '#spieler' },
          { icon: AlertTriangle, label: 'Proteste', wert: 1, ziel: '#meldungen' },
        ].map(k => (
          <Card key={k.label} padding="15px 16px">
            <k.icon
              size={18}
              aria-hidden="true"
              style={{ color: k.wert > 0 ? 'var(--bedv-accent-deep)' : 'var(--bedv-ink-faint)' }}
            />
            <div style={{ marginTop: 9 }}>
              <Stat wert={k.wert} label={k.label} ton={k.wert > 0 ? 'accent' : 'normal'} />
            </div>
          </Card>
        ))}
      </div>

      {/* Mannschaftsmeldungen */}
      <section id="meldungen" style={{ scrollMarginTop: 80 }}>
        <SectionHead
          eyebrow="Zur Prüfung"
          titel={offeneMeldungen.length > 0
            ? `${offeneMeldungen.length} Mannschaftsmeldungen warten auf Prüfung`
            : 'Alle Mannschaftsmeldungen bearbeitet'}
          text="Jede Meldung mit Kader, Spielstätte und den Punkten, die auffallen. Drei Wege: freigeben, Nachbesserung anfordern, ablehnen."
        />

        {OFFENE_MELDUNGEN.length === 0 ? (
          <LeerZustand titel="Keine offenen Meldungen" text="Sobald eine Mannschaft meldet, erscheint sie hier." />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {OFFENE_MELDUNGEN.map(m => {
              const entschieden = meldungen[m.id];
              const aufgeklappt = offenId === m.id && !entschieden;

              return (
                <Card key={m.id} padding={0} style={{ overflow: 'hidden', opacity: entschieden ? 0.8 : 1 }}>
                  <button
                    onClick={() => setOffenId(o => (o === m.id ? null : m.id))}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', gap: 12, padding: '14px 16px',
                      border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                    aria-expanded={aufgeklappt}
                  >
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                        <strong style={{ fontFamily: 'var(--bedv-font-display)', fontSize: '1.05rem' }}>{m.mannschaft}</strong>
                        <Badge ton="leise">{m.art}</Badge>
                        {entschieden && <Badge ton={ENTSCHEIDUNG_TON[entschieden]}>{entschieden}</Badge>}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--bedv-ink-dim)', marginTop: 3 }}>
                        {m.ligaWunsch} · {m.spielstaette} · {alter(m.vorTagen)}
                      </span>
                    </span>
                    {m.hinweise.length > 0 && !entschieden && (
                      <span className="bedv-badge bedv-badge--accent" style={{ flex: 'none' }}>
                        {m.hinweise.length} Hinweis{m.hinweise.length > 1 ? 'e' : ''}
                      </span>
                    )}
                    <ChevronDown
                      size={17}
                      aria-hidden="true"
                      style={{ flex: 'none', color: 'var(--bedv-ink-faint)', transform: aufgeklappt ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease' }}
                    />
                  </button>

                  {entschieden && (
                    <div
                      style={{
                        padding: '11px 16px', borderTop: '1px solid var(--bedv-line)',
                        background: entschieden === 'freigegeben' ? 'var(--bedv-green-soft)'
                          : entschieden === 'abgelehnt' ? 'var(--bedv-red-soft)' : 'var(--bedv-accent-soft)',
                        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                        fontSize: '0.86rem',
                        color: entschieden === 'freigegeben' ? 'var(--bedv-green)'
                          : entschieden === 'abgelehnt' ? 'var(--bedv-red)' : 'var(--bedv-accent-deep)',
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 200 }}>{ENTSCHEIDUNG_TEXT[entschieden]}</span>
                      <button
                        className="bedv-btn bedv-btn--quiet bedv-btn--sm"
                        onClick={() => setMeldungen(s => { const n = { ...s }; delete n[m.id]; return n; })}
                      >
                        <Undo2 size={14} aria-hidden="true" /> Zurücknehmen
                      </button>
                    </div>
                  )}

                  {aufgeklappt && (
                    <div className="bedv-fade-up" style={{ padding: '4px 16px 16px', borderTop: '1px solid var(--bedv-line)' }}>
                      <div className="bedv-grid bedv-grid--2" style={{ marginTop: 12 }}>
                        <div>
                          <div className="bedv-kicker" style={{ marginBottom: 6 }}>Meldung</div>
                          <Feld label="Spielklasse">{m.ligaWunsch}</Feld>
                          <Feld label="Spielstätte">{m.spielstaette}</Feld>
                          <Feld label="Spieltag">{m.spieltag}, {m.beginn} Uhr</Feld>
                          <Feld label="Eingereicht von">{m.eingereichtVon}</Feld>
                        </div>

                        <div>
                          <div className="bedv-kicker" style={{ marginBottom: 6 }}>
                            {m.kader.length > 0 ? `Kader (${m.kader.length})` : 'Kader'}
                          </div>
                          {m.kader.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--bedv-ink-dim)' }}>
                              Keine Kaderänderung — nur die Spielstätte ändert sich.
                            </p>
                          ) : (
                            m.kader.map(s => (
                              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 0', borderBottom: '1px solid var(--bedv-line-soft)' }}>
                                <span style={{ flex: 1, minWidth: 0, fontSize: '0.86rem' }}>{s.name}</span>
                                <span style={{ fontSize: '0.76rem', color: 'var(--bedv-ink-dim)', flex: 'none' }}>
                                  {s.passnummer} · {s.wertung === 'damen' ? 'D' : 'H'}
                                </span>
                                {s.neu && <Badge ton="accent">Pass nötig</Badge>}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {m.hinweise.length > 0 && (
                        <div
                          style={{
                            marginTop: 14, padding: '11px 13px', borderRadius: 10,
                            background: 'var(--bedv-accent-soft)', border: '1px solid #F2DCAE',
                          }}
                        >
                          <div className="bedv-kicker" style={{ color: 'var(--bedv-accent-deep)', marginBottom: 6 }}>
                            Worauf die Prüfung schaut
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 17, display: 'grid', gap: 5, color: 'var(--bedv-accent-deep)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                            {m.hinweise.map(h => <li key={h}>{h}</li>)}
                          </ul>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 16 }}>
                        <button
                          className="bedv-btn bedv-btn--primary bedv-btn--sm"
                          style={{ background: 'var(--bedv-green)' }}
                          onClick={() => setMeldungen(s => ({ ...s, [m.id]: 'freigegeben' }))}
                        >
                          <Check size={15} aria-hidden="true" /> Freigeben
                        </button>
                        <button
                          className="bedv-btn bedv-btn--accent bedv-btn--sm"
                          onClick={() => setMeldungen(s => ({ ...s, [m.id]: 'nachbesserung' }))}
                        >
                          <RotateCcw size={15} aria-hidden="true" /> Nachbesserung
                        </button>
                        <button
                          className="bedv-btn bedv-btn--ghost bedv-btn--sm"
                          style={{ color: 'var(--bedv-red)', borderColor: 'var(--bedv-red)' }}
                          onClick={() => setMeldungen(s => ({ ...s, [m.id]: 'abgelehnt' }))}
                        >
                          <X size={15} aria-hidden="true" /> Ablehnen
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Spielberichte */}
      <section id="berichte" style={{ scrollMarginTop: 80 }}>
        <SectionHead
          eyebrow="Zur Prüfung"
          titel={offeneBerichte.length > 0
            ? `${offeneBerichte.length} Spielberichte eingereicht`
            : 'Alle Spielberichte bearbeitet'}
          text="Einer digital erfasst, einer aus einem Foto erkannt. Was unsicher gelesen wurde, ist markiert."
        />

        <div style={{ display: 'grid', gap: 12 }}>
          {OFFENE_BERICHTE.map(b => {
            const entschieden = berichte[b.id];
            return (
              <Card key={b.id} padding="15px 17px" style={{ opacity: entschieden ? 0.8 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                      <strong style={{ fontFamily: 'var(--bedv-font-display)', fontSize: '1.02rem' }}>{b.begegnung}</strong>
                      <Badge ton={b.weg === 'digital erfasst' ? 'blau' : 'accent'}>{b.weg}</Badge>
                      {entschieden && <Badge ton={ENTSCHEIDUNG_TON[entschieden]}>{entschieden}</Badge>}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--bedv-ink-dim)', marginTop: 3 }}>
                      {b.liga} · {b.datum} · {alter(b.vorTagen)}
                    </div>
                  </div>
                  <span className="bedv-score" style={{ fontSize: '1.3rem', flex: 'none' }}>{b.ergebnis}</span>
                </div>

                <ul style={{ margin: '11px 0 0', paddingLeft: 17, display: 'grid', gap: 4, color: 'var(--bedv-ink-dim)', fontSize: '0.85rem' }}>
                  {b.hinweise.map(h => <li key={h}>{h}</li>)}
                </ul>

                {!entschieden ? (
                  <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginTop: 14 }}>
                    <button
                      className="bedv-btn bedv-btn--primary bedv-btn--sm"
                      style={{ background: 'var(--bedv-green)' }}
                      onClick={() => setBerichte(s => ({ ...s, [b.id]: 'freigegeben' }))}
                    >
                      <Check size={15} aria-hidden="true" /> In die Wertung übernehmen
                    </button>
                    <button
                      className="bedv-btn bedv-btn--accent bedv-btn--sm"
                      onClick={() => setBerichte(s => ({ ...s, [b.id]: 'nachbesserung' }))}
                    >
                      <RotateCcw size={15} aria-hidden="true" /> Rückfrage an die Mannschaft
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 13, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: entschieden === 'freigegeben' ? 'var(--bedv-green)' : 'var(--bedv-accent-deep)' }}>
                      {entschieden === 'freigegeben'
                        ? 'Übernommen — Tabelle, Einzelrangliste und Highlights sind aktualisiert.'
                        : 'Rückfrage gestellt — der Bericht bleibt offen, bis die Mannschaft antwortet.'}
                    </span>
                    <button
                      className="bedv-btn bedv-btn--quiet bedv-btn--sm"
                      onClick={() => setBerichte(s => { const n = { ...s }; delete n[b.id]; return n; })}
                    >
                      <Undo2 size={14} aria-hidden="true" /> Zurücknehmen
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Weitere Bereiche */}
      <section id="spieler" style={{ scrollMarginTop: 80 }}>
        <SectionHead eyebrow="Weitere Bereiche" titel="Was noch dazugehört" />
        <div className="bedv-grid bedv-grid--3">
          {[
            { icon: Users, t: 'Spielerverwaltung', b: 'Passnummern vergeben, Wechsel prüfen, Spielberechtigungen freigeben.', z: '/spieler' },
            { icon: ShieldCheck, t: 'Staffeln und Spielpläne', b: 'Einteilung, Spielplanerzeugung, Terminverlegungen mit Benachrichtigung.', z: '/ligen' },
            { icon: FileText, t: 'Beiträge und Termine', b: 'News und Veranstaltungen selbst veröffentlichen, ohne Dienstleister.', z: '/news' },
          ].map(k => (
            <Card key={k.t} href={bedvPath(k.z)} padding="16px 17px">
              <k.icon size={19} aria-hidden="true" style={{ color: 'var(--bedv-blue)' }} />
              <h3 style={{ fontSize: '1.02rem', marginTop: 10 }}>{k.t}</h3>
              <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.86rem', marginTop: 5, lineHeight: 1.55 }}>{k.b}</p>
            </Card>
          ))}
        </div>
      </section>

      <DemoHinweis>
        Oberflächen-Demo: Entscheidungen wirken nur in dieser Ansicht und sind nach dem
        Neuladen wieder offen. Es wird nichts gespeichert und nichts versendet.
      </DemoHinweis>

      <div>
        <Link href={bedvPath('/login')} className="bedv-btn bedv-btn--ghost bedv-btn--sm">
          Rolle wechseln
        </Link>
      </div>
    </div>
  );
}
