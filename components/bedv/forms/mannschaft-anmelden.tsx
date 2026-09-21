'use client';

// ============================================================
// Digitale Mannschaftsmeldung — sechs geführte Schritte
// ============================================================
//
// Mannschaft · Liga · Spielstätte · Kader · Mannschaftsführer · Prüfen
//
// Das ist der Ablauf, der heute ein PDF ist, das ausgedruckt, ausgefüllt,
// abfotografiert und per Mail geschickt wird — und bei dem die Ligaleitung
// anschließend hinterhertelefoniert, weil die Passnummern fehlen.
//
// Zwei Dinge machen den Unterschied und müssen in der Vorführung sichtbar
// sein:
//   1. Es wird GEFÜHRT. Jeder Schritt prüft sich selbst, der Weiter-Knopf
//      bleibt gesperrt, solange etwas fehlt — und sagt auch, was.
//   2. Am Ende steht eine Prüfseite, auf der ALLES noch einmal steht.
//      Die spart der Ligaleitung die Rückfragen.
//
// Gespeichert wird nichts; alles bleibt in diesem Baustein.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Plus, Send, Trash2, Star } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { Badge, Card, DemoHinweis, Feld } from '../ui/bausteine';
import { SpielerAvatar } from '../teams/team-wappen';

export interface LigaWahl { slug: string; name: string; beschreibung: string; plaetze: string }
export interface OrtWahl { id: string; name: string; adresse: string; automaten: number }

interface KaderZeile { id: number; name: string; passnummer: string; wertung: 'herren' | 'damen' }

const SCHRITTE = ['Mannschaft', 'Liga', 'Spielstätte', 'Kader', 'Kapitän', 'Prüfen'] as const;
const SPIELTAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const ZEITEN = ['19:00', '19:30', '20:00', '20:30'];

export function MannschaftAnmelden({ ligen, orte }: { ligen: LigaWahl[]; orte: OrtWahl[] }) {
  const [schritt, setSchritt] = useState(0);
  const [fertig, setFertig] = useState(false);

  // Schritt 1
  const [name, setName] = useState('');
  const [verein, setVerein] = useState('');
  const [neu, setNeu] = useState(true);
  // Schritt 2
  const [liga, setLiga] = useState('');
  // Schritt 3
  const [ort, setOrt] = useState('');
  const [spieltag, setSpieltag] = useState('Mittwoch');
  const [beginn, setBeginn] = useState('20:00');
  // Schritt 4
  const [kader, setKader] = useState<KaderZeile[]>([
    { id: 1, name: '', passnummer: '', wertung: 'herren' },
    { id: 2, name: '', passnummer: '', wertung: 'herren' },
    { id: 3, name: '', passnummer: '', wertung: 'herren' },
    { id: 4, name: '', passnummer: '', wertung: 'herren' },
    { id: 5, name: '', passnummer: '', wertung: 'herren' },
    { id: 6, name: '', passnummer: '', wertung: 'herren' },
  ]);
  const [naechsteId, setNaechsteId] = useState(7);
  // Schritt 5
  const [kapitaen, setKapitaen] = useState<number | null>(null);
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');

  const gefuellt = useMemo(() => kader.filter(z => z.name.trim().length > 2), [kader]);
  const gewaehlteLiga = ligen.find(l => l.slug === liga);
  const gewaehlterOrt = orte.find(o => o.id === ort);
  const kapitaenZeile = gefuellt.find(z => z.id === kapitaen);

  /** Was in diesem Schritt noch fehlt — als Satz, nicht als rotes Feld. */
  const fehlt = (s: number): string | null => {
    if (s === 0) return name.trim().length < 3 ? 'Mannschaftsname eintragen (mindestens drei Zeichen).' : null;
    if (s === 1) return liga === '' ? 'Eine Spielklasse auswählen.' : null;
    if (s === 2) return ort === '' ? 'Eine Spielstätte auswählen.' : null;
    if (s === 3) return gefuellt.length < 6 ? `Noch ${6 - gefuellt.length} Spieler eintragen — sechs sind die kleinste spielfähige Aufstellung.` : null;
    if (s === 4) {
      if (kapitaen === null) return 'Einen Mannschaftsführer bestimmen.';
      if (!email.includes('@')) return 'E-Mail des Mannschaftsführers eintragen — dorthin geht die Bestätigung.';
      return null;
    }
    return null;
  };

  const aktuellFehlt = fehlt(schritt);

  if (fertig) {
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
          <h2 style={{ fontSize: '1.45rem' }}>Mannschaftsmeldung erfolgreich eingereicht</h2>
          <p style={{ color: 'var(--bedv-ink-dim)', marginTop: 10, maxWidth: '52ch', marginInline: 'auto', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--bedv-ink)' }}>{name}</strong> ist für die{' '}
            <strong style={{ color: 'var(--bedv-ink)' }}>{gewaehlteLiga?.name}</strong> gemeldet.
            Eine Bestätigung ginge an {email}.
          </p>
          <div style={{ display: 'inline-flex', gap: 8, marginTop: 15, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Badge ton="accent">Wird von der Ligaleitung geprüft</Badge>
            <Badge ton="leise">Vorgang M-{2000 + Math.floor(name.length * 7)}</Badge>
          </div>
        </div>

        <div style={{ maxWidth: 520, marginInline: 'auto', marginTop: 22 }}>
          <Feld label="Mannschaft">{name}</Feld>
          <Feld label="Spielklasse">{gewaehlteLiga?.name}</Feld>
          <Feld label="Spielstätte">{gewaehlterOrt?.name}</Feld>
          <Feld label="Spieltag">{spieltag}, {beginn} Uhr</Feld>
          <Feld label="Kader">{gefuellt.length} Spieler</Feld>
          <Feld label="Mannschaftsführer">{kapitaenZeile?.name}</Feld>
        </div>

        <div style={{ maxWidth: 560, marginInline: 'auto', marginTop: 20 }}>
          <DemoHinweis>
            In dieser Demo wurde nichts gespeichert und nichts versendet — die Eingaben
            haben den Browser nicht verlassen.
          </DemoHinweis>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          <Link href={bedvPath('/ligaleitung')} className="bedv-btn bedv-btn--primary bedv-btn--sm">
            So sieht das die Ligaleitung <ArrowRight size={14} aria-hidden="true" />
          </Link>
          <button className="bedv-btn bedv-btn--ghost bedv-btn--sm" onClick={() => { setFertig(false); setSchritt(0); }}>
            Noch einmal durchgehen
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Schrittanzeige */}
      <div className="bedv-steps" style={{ marginBottom: 22, overflowX: 'auto', paddingBottom: 4 }}>
        {SCHRITTE.map((s, i) => (
          <div key={s} style={{ display: 'contents' }}>
            <button
              className={`bedv-step ${i === schritt ? 'bedv-step--aktiv' : i < schritt ? 'bedv-step--fertig' : ''}`}
              onClick={() => { if (i < schritt) setSchritt(i); }}
              disabled={i > schritt}
              style={{ background: 'none', border: 'none', cursor: i < schritt ? 'pointer' : 'default', padding: 0 }}
              aria-current={i === schritt ? 'step' : undefined}
            >
              <span className="bedv-step-dot">{i < schritt ? <Check size={14} aria-hidden="true" /> : i + 1}</span>
              <span
                style={{
                  fontFamily: 'var(--bedv-font-display)', fontWeight: 600, fontSize: '0.84rem',
                  color: i === schritt ? 'var(--bedv-ink)' : 'var(--bedv-ink-dim)',
                  whiteSpace: 'nowrap',
                }}
                className={i === schritt ? '' : 'bedv-col-sm'}
              >
                {s}
              </span>
            </button>
            {i < SCHRITTE.length - 1 && (
              <span className={`bedv-step-linie ${i < schritt ? 'bedv-step-linie--fertig' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <Card padding="20px 22px" key={schritt} className="bedv-fade-up">
        {/* ── 1 Mannschaft ── */}
        {schritt === 0 && (
          <>
            <h2 style={{ fontSize: '1.2rem' }}>Wie heißt die Mannschaft?</h2>
            <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.89rem', marginTop: 6 }}>
              Der Name steht später in Tabelle, Spielplan und auf dem Spielbericht.
            </p>
            <div style={{ display: 'grid', gap: 14, marginTop: 16, maxWidth: 520 }}>
              <label>
                <span className="bedv-label">Mannschaftsname</span>
                <input className="bedv-input" value={name} onChange={e => setName(e.target.value)} placeholder="z. B. Lechfeld Lowriders" autoFocus />
              </label>
              <label>
                <span className="bedv-label">Verein oder Trägerorganisation (optional)</span>
                <input className="bedv-input" value={verein} onChange={e => setVerein(e.target.value)} placeholder="falls die Mannschaft zu einem Verein gehört" />
              </label>
              <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
                <legend className="bedv-label" style={{ padding: 0 }}>Art der Meldung</legend>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[{ v: true, l: 'Neue Mannschaft' }, { v: false, l: 'Bestehende Mannschaft erneut melden' }].map(o => (
                    <button
                      key={String(o.v)}
                      className="bedv-btn bedv-btn--sm"
                      onClick={() => setNeu(o.v)}
                      style={neu === o.v
                        ? { background: 'var(--bedv-blue)', color: '#fff' }
                        : { background: 'var(--bedv-tint-2)', color: 'var(--bedv-ink-dim)' }}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </>
        )}

        {/* ── 2 Liga ── */}
        {schritt === 1 && (
          <>
            <h2 style={{ fontSize: '1.2rem' }}>In welcher Spielklasse?</h2>
            <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.89rem', marginTop: 6 }}>
              {neu
                ? 'Neue Mannschaften starten in einer C-Staffel. Die endgültige Einteilung nimmt die Ligaleitung vor.'
                : 'Für bestehende Mannschaften ist die Klasse durch das Vorjahr vorgegeben; Abweichungen prüft die Ligaleitung.'}
            </p>
            <div className="bedv-grid bedv-grid--2" style={{ marginTop: 16 }}>
              {ligen.map(l => (
                <button
                  key={l.slug}
                  className="bedv-card bedv-card--link"
                  onClick={() => setLiga(l.slug)}
                  style={{
                    padding: '14px 15px', textAlign: 'left', cursor: 'pointer',
                    borderColor: liga === l.slug ? 'var(--bedv-blue)' : undefined,
                    borderWidth: liga === l.slug ? 2 : 1,
                    background: liga === l.slug ? 'var(--bedv-blue-mist)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <h3 style={{ fontSize: '1.02rem' }}>{l.name}</h3>
                    {liga === l.slug && <Check size={17} aria-hidden="true" style={{ color: 'var(--bedv-blue)' }} />}
                  </div>
                  <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.83rem', marginTop: 5, lineHeight: 1.5 }}>{l.beschreibung}</p>
                  <div className="bedv-kicker" style={{ marginTop: 7 }}>{l.plaetze}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── 3 Spielstätte ── */}
        {schritt === 2 && (
          <>
            <h2 style={{ fontSize: '1.2rem' }}>Wo wird gespielt?</h2>
            <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.89rem', marginTop: 6 }}>
              Spielstätte, fester Spieltag und Beginn. Danach richten sich alle Heimspiele
              des Spieljahres.
            </p>
            <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
              <label>
                <span className="bedv-label">Spielstätte</span>
                <select className="bedv-select" value={ort} onChange={e => setOrt(e.target.value)}>
                  <option value="">— bitte auswählen —</option>
                  {orte.map(o => (
                    <option key={o.id} value={o.id}>{o.name} — {o.adresse} ({o.automaten} Automaten)</option>
                  ))}
                </select>
              </label>

              {gewaehlterOrt && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bedv-tint)', border: '1px solid var(--bedv-line)' }}>
                  <div style={{ fontWeight: 700, fontFamily: 'var(--bedv-font-display)' }}>{gewaehlterOrt.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--bedv-ink-dim)', marginTop: 3 }}>{gewaehlterOrt.adresse}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--bedv-ink-dim)', marginTop: 6 }}>
                    {gewaehlterOrt.automaten} Automaten — für eine Begegnung über 18 Spiele ausreichend.
                  </div>
                </div>
              )}

              <div className="bedv-grid bedv-grid--2" style={{ gap: 14 }}>
                <label>
                  <span className="bedv-label">Heimspieltag</span>
                  <select className="bedv-select" value={spieltag} onChange={e => setSpieltag(e.target.value)}>
                    {SPIELTAGE.map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label>
                  <span className="bedv-label">Beginn</span>
                  <select className="bedv-select" value={beginn} onChange={e => setBeginn(e.target.value)}>
                    {ZEITEN.map(t => <option key={t}>{t} Uhr</option>)}
                  </select>
                </label>
              </div>
            </div>
          </>
        )}

        {/* ── 4 Kader ── */}
        {schritt === 3 && (
          <>
            <h2 style={{ fontSize: '1.2rem' }}>Wer spielt?</h2>
            <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.89rem', marginTop: 6 }}>
              Mindestens sechs Spieler. Wer schon eine Passnummer hat, trägt sie ein — für
              alle anderen vergibt sie der Verband mit der Freigabe.
            </p>

            <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
              {kader.map((z, i) => (
                <div key={z.id} style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="bedv-kicker" style={{ width: 20, flex: 'none' }}>{i + 1}</span>
                  <input
                    className="bedv-input"
                    style={{ flex: '2 1 190px' }}
                    placeholder="Vor- und Nachname"
                    value={z.name}
                    onChange={e => setKader(k => k.map(x => x.id === z.id ? { ...x, name: e.target.value } : x))}
                  />
                  <input
                    className="bedv-input"
                    style={{ flex: '1 1 110px' }}
                    placeholder="Passnr. (falls vorhanden)"
                    value={z.passnummer}
                    onChange={e => setKader(k => k.map(x => x.id === z.id ? { ...x, passnummer: e.target.value } : x))}
                  />
                  <select
                    className="bedv-select"
                    style={{ flex: '0 1 110px', width: 'auto' }}
                    value={z.wertung}
                    onChange={e => setKader(k => k.map(x => x.id === z.id ? { ...x, wertung: e.target.value as 'herren' | 'damen' } : x))}
                    aria-label={`Wertungsklasse Spieler ${i + 1}`}
                  >
                    <option value="herren">Herren</option>
                    <option value="damen">Damen</option>
                  </select>
                  {kader.length > 6 && (
                    <button
                      className="bedv-btn bedv-btn--quiet bedv-btn--sm"
                      style={{ color: 'var(--bedv-red)', flex: 'none' }}
                      onClick={() => setKader(k => k.filter(x => x.id !== z.id))}
                      aria-label={`Zeile ${i + 1} entfernen`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              className="bedv-btn bedv-btn--ghost bedv-btn--sm"
              style={{ marginTop: 13 }}
              onClick={() => { setKader(k => [...k, { id: naechsteId, name: '', passnummer: '', wertung: 'herren' }]); setNaechsteId(n => n + 1); }}
            >
              <Plus size={15} aria-hidden="true" /> Weitere Zeile
            </button>

            <div style={{ marginTop: 14, fontSize: '0.84rem', color: gefuellt.length >= 6 ? 'var(--bedv-green)' : 'var(--bedv-ink-dim)' }}>
              {gefuellt.length} von mindestens 6 Spielern eingetragen
            </div>
          </>
        )}

        {/* ── 5 Kapitän ── */}
        {schritt === 4 && (
          <>
            <h2 style={{ fontSize: '1.2rem' }}>Wer führt die Mannschaft?</h2>
            <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.89rem', marginTop: 6 }}>
              Der Mannschaftsführer reicht Spielberichte ein und ist Ansprechpartner für die
              Ligaleitung.
            </p>

            <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
              {gefuellt.map(z => (
                <button
                  key={z.id}
                  onClick={() => setKapitaen(z.id)}
                  className="bedv-card bedv-card--link"
                  style={{
                    padding: '11px 13px', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 11,
                    borderColor: kapitaen === z.id ? 'var(--bedv-accent)' : undefined,
                    borderWidth: kapitaen === z.id ? 2 : 1,
                    background: kapitaen === z.id ? 'var(--bedv-accent-soft)' : undefined,
                  }}
                >
                  <SpielerAvatar initialen={z.name.split(/\s+/).map(t => t[0]).slice(0, 2).join('').toUpperCase()} groesse={32} akzent={kapitaen === z.id} />
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: '0.92rem' }}>{z.name}</span>
                  {kapitaen === z.id
                    ? <Star size={17} aria-hidden="true" style={{ color: 'var(--bedv-accent-deep)', fill: 'currentColor' }} />
                    : <span className="bedv-kicker">auswählen</span>}
                </button>
              ))}
            </div>

            <div className="bedv-grid bedv-grid--2" style={{ gap: 14, marginTop: 16, maxWidth: 560 }}>
              <label>
                <span className="bedv-label">E-Mail (für Bestätigung und Rückfragen)</span>
                <input className="bedv-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@beispiel.de" />
              </label>
              <label>
                <span className="bedv-label">Telefon (optional)</span>
                <input className="bedv-input" value={telefon} onChange={e => setTelefon(e.target.value)} placeholder="für kurzfristige Absprachen" />
              </label>
            </div>
          </>
        )}

        {/* ── 6 Prüfen ── */}
        {schritt === 5 && (
          <>
            <h2 style={{ fontSize: '1.2rem' }}>Alles richtig?</h2>
            <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.89rem', marginTop: 6 }}>
              Diese Seite spart der Ligaleitung die Rückfragen — sie sieht genau das, was
              hier steht.
            </p>

            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', marginTop: 16 }} className="bedv-liga-split">
              <div>
                <div className="bedv-kicker" style={{ marginBottom: 8 }}>Meldung</div>
                <Feld label="Mannschaft">{name}</Feld>
                {verein && <Feld label="Verein">{verein}</Feld>}
                <Feld label="Art">{neu ? 'Neumeldung' : 'Wiedermeldung'}</Feld>
                <Feld label="Spielklasse">{gewaehlteLiga?.name}</Feld>
                <Feld label="Spielstätte">{gewaehlterOrt?.name}</Feld>
                <Feld label="Adresse">{gewaehlterOrt?.adresse}</Feld>
                <Feld label="Spieltag">{spieltag}, {beginn} Uhr</Feld>
                <Feld label="Mannschaftsführer">{kapitaenZeile?.name ?? '—'}</Feld>
                <Feld label="E-Mail">{email}</Feld>
                {telefon && <Feld label="Telefon">{telefon}</Feld>}
              </div>

              <div>
                <div className="bedv-kicker" style={{ marginBottom: 8 }}>Kader ({gefuellt.length})</div>
                {gefuellt.map(z => (
                  <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: '1px solid var(--bedv-line-soft)' }}>
                    <SpielerAvatar initialen={z.name.split(/\s+/).map(t => t[0]).slice(0, 2).join('').toUpperCase()} groesse={26} akzent={kapitaen === z.id} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: '0.88rem', fontWeight: kapitaen === z.id ? 700 : 500 }}>
                      {z.name}{kapitaen === z.id ? ' ★' : ''}
                    </span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--bedv-ink-dim)', flex: 'none' }}>
                      {z.passnummer.trim() || 'neu'} · {z.wertung === 'damen' ? 'D' : 'H'}
                    </span>
                  </div>
                ))}
                {gefuellt.some(z => !z.passnummer.trim()) && (
                  <div style={{ marginTop: 11, padding: '9px 12px', borderRadius: 9, background: 'var(--bedv-accent-soft)', color: 'var(--bedv-accent-deep)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    Für {gefuellt.filter(z => !z.passnummer.trim()).length} Spieler ist noch keine
                    Passnummer eingetragen. Die vergibt der Verband mit der Freigabe — das
                    verzögert die Meldung nicht.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <DemoHinweis>
                Beim Absenden wird in dieser Demo nichts übertragen und nichts gespeichert.
              </DemoHinweis>
            </div>
          </>
        )}

        {/* Steuerung */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--bedv-line)',
          }}
        >
          <button
            className="bedv-btn bedv-btn--ghost"
            onClick={() => setSchritt(s => Math.max(0, s - 1))}
            disabled={schritt === 0}
          >
            <ArrowLeft size={15} aria-hidden="true" /> Zurück
          </button>

          {schritt < SCHRITTE.length - 1 ? (
            <button
              className="bedv-btn bedv-btn--primary"
              onClick={() => setSchritt(s => s + 1)}
              disabled={aktuellFehlt !== null}
            >
              Weiter <ArrowRight size={15} aria-hidden="true" />
            </button>
          ) : (
            <button className="bedv-btn bedv-btn--accent" onClick={() => setFertig(true)}>
              <Send size={15} aria-hidden="true" /> Meldung absenden
            </button>
          )}

          {aktuellFehlt && (
            <span style={{ fontSize: '0.83rem', color: 'var(--bedv-ink-dim)', flex: '1 1 200px' }}>
              {aktuellFehlt}
            </span>
          )}
        </div>
      </Card>
    </>
  );
}
