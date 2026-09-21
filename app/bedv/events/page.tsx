// ============================================================
// Termine und Veranstaltungen
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarDays, MapPin, Clock } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { Badge, Card, DemoHinweis, SectionHead } from '@/components/bedv/ui/bausteine';
import { TERMINE } from '@/data/bedv/events';
import { datumLang, heute, relativerTag, wochentag, wochentagKurz } from '@/lib/bedv/format';

export const metadata: Metadata = {
  title: 'Termine',
  description: 'Ligafinale, Turniere, Verbandstag und Schulungen — alle Termine des Verbands.',
};

/** Die Liste sortiert sich nach dem heutigen Tag. */
export const revalidate = 3600;

const KATEGORIE_TON = {
  Finale: 'accent', Turnier: 'blau', Verband: 'leise', Schulung: 'gruen', Feier: 'accent',
} as const;

export default function EventsSeite() {
  const heuteTag = heute();

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '36px 32px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Kalender</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>Termine</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '58ch', lineHeight: 1.6 }}>
            Finaltage, Turniere, Verbandstag und Schulungen. In der echten Plattform mit
            Anmeldung und Erinnerung für die eigene Mannschaft.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px' }}>
        <div style={{ marginBottom: 22 }}>
          <DemoHinweis>
            Demo-Termine. Sie stammen nicht vom BeDV — die Knöpfe zeigen, wo in der echten
            Plattform Anmeldung und Unterlagen lägen.
          </DemoHinweis>
        </div>

        <SectionHead eyebrow="Kommend" titel={`${TERMINE.length} Termine`} />

        <div style={{ display: 'grid', gap: 14 }}>
          {TERMINE.map(t => (
            <Card key={t.slug} padding={0} style={{ overflow: 'hidden' }}>
              <div id={t.slug} style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
                {/* Datumsblock */}
                <div
                  style={{
                    width: 104, flex: 'none', padding: '18px 10px', textAlign: 'center',
                    background: 'var(--bedv-navy-900)', color: '#fff',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--bedv-accent)', fontFamily: 'var(--bedv-font-display)' }}>
                    {wochentagKurz(t.datum).toUpperCase()}
                  </span>
                  <span className="bedv-score" style={{ fontSize: '2rem', lineHeight: 1.05 }}>{t.datum.slice(8)}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--bedv-on-dark-dim)' }}>
                    {datumLang(t.datum).split(' ').slice(1).join(' ')}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 240, padding: '15px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 8 }}>
                    <Badge ton={KATEGORIE_TON[t.kategorie]}>{t.kategorie}</Badge>
                    <span className="bedv-kicker">{relativerTag(t.datum, heuteTag)}</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem' }}>{t.titel}</h3>
                  <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.9rem', marginTop: 7, lineHeight: 1.6, maxWidth: '68ch' }}>
                    {t.beschreibung}
                  </p>

                  <div style={{ display: 'flex', gap: '5px 18px', flexWrap: 'wrap', marginTop: 12, fontSize: '0.82rem', color: 'var(--bedv-ink-dim)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <CalendarDays size={14} aria-hidden="true" />{wochentag(t.datum)}, {datumLang(t.datum)}
                    </span>
                    {t.uhrzeit && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={14} aria-hidden="true" />{t.uhrzeit} Uhr
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} aria-hidden="true" />{t.ort}
                    </span>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <Link
                      href={bedvPath(
                        t.slug === 'pokalfinale' || t.slug === 'pokal-rueckspiele-halbfinale' ? '/pokal'
                        : t.slug === 'ligafinaltag' ? '/ligen'
                        : t.slug === 'verbandstag' ? '/downloads'
                        : t.slug === 'schulung-spielbericht' ? '/mein-bereich/spielbericht'
                        : '/kontakt')}
                      className="bedv-btn bedv-btn--ghost bedv-btn--sm"
                    >
                      {t.aktion} →
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
