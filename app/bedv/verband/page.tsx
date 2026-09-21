// ============================================================
// Der Verband
// ============================================================
//
// ACHTUNG: Die Angaben sind Platzhalter. Es stehen bewusst KEINE Namen von
// Verbandsverantwortlichen und keine echten Kontaktdaten hier — die Demo
// ist nicht vom BeDV beauftragt. Gezeigt wird der Aufbau der Seite, nicht
// ihr Inhalt.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { bedvPath, BEDV_DISCLAIMER_LANG } from '@/lib/bedv/site';
import { Card, DemoHinweis, Feld, SectionHead, Stat } from '@/components/bedv/ui/bausteine';
import { BedvEmblem } from '@/components/bedv/brand/logo';
import { SPIELBETRIEB, VERBAND } from '@/data/bedv/verband';

export const metadata: Metadata = {
  title: 'Der Verband',
  description: 'Aufbau, Spielbetrieb und Ansprechpartner des Bayerischen Elektronik-Dart Vereins (Demo).',
};

export default function VerbandSeite() {
  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '36px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <BedvEmblem groesse={62} />
            <div>
              <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Über uns</div>
              <h1 style={{ fontSize: 'clamp(1.7rem, 4.6vw, 2.5rem)', marginTop: 6 }}>{VERBAND.name}</h1>
            </div>
          </div>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 14, maxWidth: '62ch', lineHeight: 1.62 }}>
            {VERBAND.zweck}
          </p>

          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--bedv-line-dark)' }}>
            {VERBAND.kennzahlen.map(k => (
              <Stat key={k.label} wert={k.wert} label={k.label} ton="dunkel" />
            ))}
          </div>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px', display: 'grid', gap: 30 }}>
        <DemoHinweis ton="accent">
          <strong>Platzhalter-Angaben.</strong> {BEDV_DISCLAIMER_LANG} Ansprechpartner sind
          deshalb nur als Funktion benannt, nicht mit Namen; Anschrift und E-Mail sind
          Beispielangaben.
        </DemoHinweis>

        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)' }} className="bedv-liga-split">
          <div>
            <SectionHead eyebrow="Organisation" titel="Ansprechpartner" text="Wer im Verband wofür zuständig ist." />
            <div className="bedv-grid bedv-grid--2">
              {VERBAND.ansprechpartner.map(a => (
                <Card key={a.funktion} padding="15px 16px">
                  <h3 style={{ fontSize: '1rem' }}>{a.funktion}</h3>
                  <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.86rem', marginTop: 6, lineHeight: 1.55 }}>
                    {a.aufgabe}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Card padding="16px 18px">
              <h3 style={{ fontSize: '1.02rem', marginBottom: 10 }}>Spielbetrieb in Zahlen</h3>
              {SPIELBETRIEB.map(s => <Feld key={s.label} label={s.label}>{s.wert}</Feld>)}
            </Card>

            <Card padding="16px 18px">
              <h3 style={{ fontSize: '1.02rem', marginBottom: 10 }}>Kontakt</h3>
              <p style={{ fontSize: '0.83rem', color: 'var(--bedv-ink-faint)', marginBottom: 10, lineHeight: 1.5 }}>
                {VERBAND.kontakt.hinweis}
              </p>
              <Feld label="E-Mail">{VERBAND.kontakt.email}</Feld>
              <Feld label="Postanschrift">
                <span style={{ display: 'block' }}>
                  {VERBAND.kontakt.postanschrift.map(z => <span key={z} style={{ display: 'block' }}>{z}</span>)}
                </span>
              </Feld>
              <Feld label="Gegründet">{VERBAND.gegruendet}</Feld>
              <Link href={bedvPath('/kontakt')} className="bedv-btn bedv-btn--ghost bedv-btn--sm bedv-btn--block" style={{ marginTop: 13 }}>
                Zum Kontaktformular
              </Link>
            </Card>
          </div>
        </div>

        <div>
          <SectionHead eyebrow="Mitmachen" titel="Neue Mannschaft melden" />
          <Card padding="20px 22px">
            <div className="bedv-grid bedv-grid--3">
              {[
                { n: '1', t: 'Spielstätte klären', b: 'Ein Lokal mit mindestens einem Automaten und einer festen Öffnungszeit am Spieltag.' },
                { n: '2', t: 'Kader zusammenstellen', b: 'Sechs Spielerinnen oder Spieler reichen für eine Begegnung über 18 Spiele.' },
                { n: '3', t: 'Online melden', b: 'Mannschaft, Liga, Spielstätte, Kader, Mannschaftsführer — sechs Schritte, geführt.' },
              ].map(s => (
                <div key={s.n}>
                  <span
                    aria-hidden="true"
                    style={{
                      width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center',
                      background: 'var(--bedv-blue)', color: '#fff',
                      fontFamily: 'var(--bedv-font-display)', fontWeight: 800,
                    }}
                  >
                    {s.n}
                  </span>
                  <h3 style={{ fontSize: '1rem', marginTop: 10 }}>{s.t}</h3>
                  <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.87rem', marginTop: 5, lineHeight: 1.55 }}>{s.b}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href={bedvPath('/mein-bereich/mannschaft-anmelden')} className="bedv-btn bedv-btn--primary bedv-btn--sm">
                Mannschaftsmeldung ansehen
              </Link>
              <Link href={bedvPath('/downloads')} className="bedv-btn bedv-btn--ghost bedv-btn--sm">
                Formulare
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
