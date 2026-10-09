import type { Metadata } from 'next';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { SaisonUmschalter } from '@/components/mdu/saison-umschalter';
import { SpieltagKarte27 } from '@/components/mdu/spielplan-27';
import { NEUE_SAISON, SAISON_START, LIGEN_2027, datumText, spieltage27, begegnungKey } from '@/lib/data/saison-2027';
import { ladeErgebnisse27 } from '@/lib/server/ergebnisse-2027';

export const metadata: Metadata = { title: 'Ergebnisse' };

// Saison 2026/2027 — Ergebnisse aus den Spielberichten (lib/server/ergebnisse-2027.ts),
// je Liga die Spieltage mit mindestens einem Ergebnis, neueste zuerst.
// Neu gebaut nach jedem Spielbericht. Archiv 2025/26: /ergebnisse/2025-26.
export default async function ErgebnissePage() {
  const { byKey } = await ladeErgebnisse27();
  const ligen = LIGEN_2027.map(liga => ({
    liga,
    mds: spieltage27(liga.code).filter(md => md.games.some(g => byKey[begegnungKey(g.home, g.away)])).reverse(),
  })).filter(x => x.mds.length);
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/ergebnisse" />

      <PageBanner eyebrow={NEUE_SAISON.name} title="Ergebnisse" boardRight="max(28px, min(calc(50vw - 288px), calc(100vw - 928px)))" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 80px' }}>
        <SaisonUmschalter archiv={false} neuHref="/ergebnisse" archivHref="/ergebnisse/2025-26" />

        {ligen.length ? (
          <>
            <nav aria-label="Liga wählen" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
              {ligen.map(({ liga }) => (
                <a key={liga.code} href={`#liga-${liga.code}`} style={{
                  padding: '7px 14px', borderRadius: 6, textDecoration: 'none',
                  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: 'var(--th-bg-card)', color: 'var(--th-text-body)', border: '1px solid var(--th-line-8)', borderLeft: `3px solid ${liga.color}`,
                }}>{liga.name}</a>
              ))}
            </nav>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              {ligen.map(({ liga, mds }) => (
                <section key={liga.code} id={`liga-${liga.code}`} style={{ scrollMarginTop: 90 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '10px 16px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)' }}>
                    <div style={{ width: 4, height: 24, borderRadius: 2, background: liga.color, flexShrink: 0 }} />
                    <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, letterSpacing: '0.06em', color: 'var(--th-text-strong)', margin: 0, textTransform: 'uppercase' }}>{liga.name}</h2>
                    <Link href={`/ligen/${liga.code}?tab=tabelle`} style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-accent)', textDecoration: 'none' }}>Tabelle →</Link>
                  </div>
                  <div className="mdu-spieltag-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 12 }}>
                    {mds.map(md => <SpieltagKarte27 key={md.nr} md={md} color={liga.color} ergebnisse={byKey} />)}
                  </div>
                </section>
              ))}
            </div>
            <p style={{ marginTop: 24, fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)' }}>
              <span style={{ color: '#9A6B00', fontWeight: 800 }}>*</span> Ergebnis eingereicht, vom Gegner noch nicht bestätigt — kann sich noch ändern.
            </p>
          </>
        ) : (
          <div style={{ maxWidth: 640, padding: '22px 22px', borderRadius: 14, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', fontFamily: 'var(--font-manrope)', fontSize: 14, lineHeight: 1.6, color: 'var(--th-text-body)' }}>
            <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 20, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)', marginBottom: 6 }}>
              Noch keine Ergebnisse
            </div>
            Die {NEUE_SAISON.name} beginnt am Wochenende ab {datumText(SAISON_START)}. Die Ergebnisse erscheinen hier, sobald gespielt wurde.
            {' '}Bis dahin: <Link href="/spielplan" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Spielplan</Link>
            {' '}· <Link href="/ergebnisse/2025-26" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Ergebnisse 2025/26</Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
