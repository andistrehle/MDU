// ============================================================
// Startseite — Kopfbereich
// ============================================================
//
// Die ersten 30 Sekunden entscheiden. Deshalb steht hier in dieser
// Reihenfolge:
//
//   1. WER     — Verbandsname, ausgeschrieben. Der Gesprächspartner muss
//                sofort „das sind wir" denken, nicht „hübsche Dartseite".
//   2. WAS JETZT — die laufende Spielzeit mit einer echten Zahl daneben.
//   3. WOHIN   — die Spielklassen als Knöpfe, nicht als Menü. Wer die Seite
//                zum ersten Mal sieht, sucht seine eigene Liga.
//
// Dazu die gezeichnete Scheibe. Sie dreht sich so langsam, dass man es
// nicht als Bewegung wahrnimmt — das Bild wirkt lebendig, ohne zu zappeln.
// ============================================================

import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { bedvPath, BEDV_DISCLAIMER, BEDV_NAME_LANG } from '@/lib/bedv/site';
import { Dartboard, Dart } from '../brand/dartboard';
import { SAISON_AKTUELL } from '@/data/bedv/saison';
import { LIGEN_AKTUELL } from '@/data/bedv/ligen';
import { TEAMS } from '@/data/bedv/teams';
import { SPIELER } from '@/data/bedv/spieler';
import { BEGEGNUNGEN } from '@/data/bedv/spiele';
import { datumKurz, heute } from '@/lib/bedv/format';

export function Hero() {
  const teamsAktuell = TEAMS.filter(t => t.saisonId === SAISON_AKTUELL.id).length;
  const spielerAktuell = SPIELER.filter(s => s.saisonId === SAISON_AKTUELL.id).length;
  const naechster = BEGEGNUNGEN.find(b => b.status === 'geplant' && b.datum >= heute());

  return (
    <section className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="bedv-grid-overlay" aria-hidden="true" />

      {/* Die Scheibe sitzt rechts und ragt bewusst über den Rand hinaus —
          angeschnitten wirkt sie größer als sie ist und trägt den Blick
          nach rechts, wo die Spielklassen stehen. */}
      <div className="bedv-hero-scheibe" aria-hidden="true">
        <Dartboard groesse={520} variante="gedaempft" zahlen className="bedv-spin-slow" />
        <span className="bedv-hero-dart"><Dart groesse={180} /></span>
      </div>

      <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '52px 46px' }}>
        <div style={{ maxWidth: 620 }}>
          {/* Bewusst KEINE `bedv-badge`: Die Klasse setzt `white-space: nowrap`,
              und der Satz ist auf 375 px breiter als das Gerät — er lief rechts
              aus dem Bild. Hier darf er umbrechen. */}
          <span className="bedv-hero-hinweis">{BEDV_DISCLAIMER}</span>

          <p
            style={{
              fontFamily: 'var(--bedv-font-display)', fontWeight: 600,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              fontSize: '0.78rem', color: 'var(--bedv-accent)', marginBottom: 10,
            }}
          >
            {BEDV_NAME_LANG}
          </p>

          <h1 style={{ fontSize: 'clamp(2.2rem, 6.2vw, 3.6rem)', fontWeight: 800, lineHeight: 1.03 }}>
            {/* „Elektronik-Dart" darf NICHT am Bindestrich umbrechen — sonst
                steht in der wichtigsten Zeile der Seite „Bayerns Elektronik-"
                und darunter „Dart". */}
            Bayerns <span style={{ whiteSpace: 'nowrap' }}>Elektronik-Dart</span>
            <br />
            <span style={{ color: 'var(--bedv-accent)' }}>auf einer Plattform.</span>
          </h1>

          <p
            style={{
              color: 'var(--bedv-on-dark-dim)', fontSize: 'clamp(0.98rem, 2.2vw, 1.12rem)',
              marginTop: 16, maxWidth: '52ch', lineHeight: 1.62,
            }}
          >
            Tabellen, Spielpläne, Ergebnisse und Ranglisten aller Staffeln — dazu
            Mannschafts- und Spielerprofile, der Verbandspokal und der digitale
            Spielbericht. Auf dem Telefon genauso wie am Rechner.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
            <Link href={bedvPath('/ligen')} className="bedv-btn bedv-btn--accent">
              Zu den Ligen <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href={bedvPath('/login')} className="bedv-btn bedv-btn--ondark">
              Demo-Login ansehen
            </Link>
          </div>

          {/* Kennzahlen: echte Zahlen aus den Demo-Daten, nicht geraten.
              Sie beantworten die stumme Frage „ist das hier vollständig?". */}
          <div
            style={{
              display: 'flex', gap: '8px 28px', flexWrap: 'wrap', marginTop: 30,
              paddingTop: 20, borderTop: '1px solid var(--bedv-line-dark)',
            }}
          >
            {[
              { wert: LIGEN_AKTUELL.length, label: 'Staffeln' },
              { wert: teamsAktuell, label: 'Mannschaften' },
              { wert: spielerAktuell, label: 'Spielberechtigte' },
            ].map(k => (
              <div key={k.label}>
                <div className="bedv-score" style={{ fontSize: '1.6rem', color: '#fff' }}>{k.wert}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--bedv-on-dark-faint)', fontWeight: 600 }}>{k.label}</div>
              </div>
            ))}
            {naechster && (
              <div>
                <div className="bedv-score" style={{ fontSize: '1.6rem', color: 'var(--bedv-accent)', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <CalendarDays size={18} aria-hidden="true" />
                  {datumKurz(naechster.datum)}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--bedv-on-dark-faint)', fontWeight: 600 }}>
                  Nächster Spieltag
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saisonband: der Übergang zum hellen Teil der Seite. */}
      <div
        style={{
          position: 'relative', borderTop: '1px solid var(--bedv-line-dark)',
          background: 'rgba(0,0,0,0.22)',
        }}
      >
        <div
          className="bedv-shell"
          style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBlock: 13, flexWrap: 'wrap' }}
        >
          <span
            style={{
              fontFamily: 'var(--bedv-font-display)', fontWeight: 700, fontSize: '0.86rem',
              letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bedv-accent)',
              whiteSpace: 'nowrap',
            }}
          >
            {SAISON_AKTUELL.name}
          </span>
          <span aria-hidden="true" style={{ color: 'var(--bedv-on-dark-faint)' }}>·</span>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {LIGEN_AKTUELL.map(l => (
              <Link
                key={l.slug}
                href={bedvPath(`/ligen/${l.slug}`)}
                style={{
                  fontFamily: 'var(--bedv-font-display)', fontWeight: 600, fontSize: '0.83rem',
                  padding: '5px 12px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.09)', color: 'var(--bedv-on-dark)',
                  border: '1px solid rgba(255,255,255,0.14)', whiteSpace: 'nowrap',
                }}
              >
                {l.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
