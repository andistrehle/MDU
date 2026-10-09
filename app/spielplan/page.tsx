import type { Metadata } from 'next';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { SaisonUmschalter, VorlaeufigHinweis } from '@/components/mdu/saison-umschalter';
import { LigaSpielplan27 } from '@/components/mdu/spielplan-27';
import { LIGEN_2027, NEUE_SAISON, SAISON_START, SAISON_ENDE, datumText } from '@/lib/data/saison-2027';
import { ladeErgebnisse27 } from '@/lib/server/ergebnisse-2027';

export const metadata: Metadata = { title: 'Spielplan' };

// Saison 2026/2027 — vorläufiger Spielplan aller Ligen (statisch, aus
// lib/data/saison-2027). Archiv 2025/26: /spielplan/2025-26.
export default async function SpielplanPage() {
  const { byKey: ergebnisse } = await ladeErgebnisse27();
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/spielplan" />

      <PageBanner eyebrow={NEUE_SAISON.name} title="Spielplan" boardRight="max(28px, min(calc(50vw - 188px), calc(100vw - 828px)))" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 80px' }}>
        <SaisonUmschalter archiv={false} neuHref="/spielplan" archivHref="/spielplan/2025-26" />
        <VorlaeufigHinweis>
          <div style={{ marginTop: 6, color: 'var(--th-text-muted)' }}>
            Saisonstart am Wochenende ab {datumText(SAISON_START)}, letzter Spieltag am Wochenende bis {datumText(SAISON_ENDE)}.
            Ferienwochenenden sind spielfrei.
          </div>
        </VorlaeufigHinweis>

        {/* Sprungmarken zu den Ligen */}
        <nav aria-label="Liga wählen" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          {LIGEN_2027.map(l => (
            <a key={l.code} href={`#liga-${l.code}`} style={{
              padding: '7px 14px', borderRadius: 6, textDecoration: 'none',
              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'var(--th-bg-card)', color: 'var(--th-text-body)',
              border: '1px solid var(--th-line-8)', borderLeft: `3px solid ${l.color}`,
            }}>{l.name}</a>
          ))}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {LIGEN_2027.map(liga => (
            <section key={liga.code} id={`liga-${liga.code}`} style={{ scrollMarginTop: 90 }}>
              {/* Deckende Kopfleiste — auf dem Desktop liegt das Dartboard dahinter. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '10px 16px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)' }}>
                <div style={{ width: 4, height: 24, borderRadius: 2, background: liga.color, flexShrink: 0 }} />
                <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 24, letterSpacing: '0.06em', color: 'var(--th-text-strong)', margin: 0, textTransform: 'uppercase' }}>
                  {liga.name}
                </h2>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', fontWeight: 600 }}>
                  {liga.teams.length} Teams
                </span>
              </div>
              <LigaSpielplan27 liga={liga} ergebnisse={ergebnisse} />
            </section>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
