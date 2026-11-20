import type { Metadata } from 'next';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { LiveBand } from '@/components/mdu/live-ticker';
import { SaisonUmschalter } from '@/components/mdu/saison-umschalter';
import { LigaFilter } from '@/components/mdu/liga-filter';
import { LigaSpielplan27 } from '@/components/mdu/spielplan-27';
import { LIGEN_2027, NEUE_SAISON } from '@/lib/data/saison-2027';
import { ladeErgebnisse27 } from '@/lib/server/ergebnisse-2027';

export const metadata: Metadata = { title: 'Spielplan' };

// Saison 2026/2027 — Spielplan aller Ligen (statisch, aus
// lib/data/saison-2027). Archiv 2025/26: /spielplan/2025-26.
export default async function SpielplanPage() {
  const { byKey: ergebnisse } = await ladeErgebnisse27();
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/spielplan" />
      <LiveBand />

      <PageBanner eyebrow={NEUE_SAISON.name} title="Spielplan" boardRight="max(28px, min(calc(50vw - 188px), calc(100vw - 828px)))" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 80px' }}>
        <SaisonUmschalter archiv={false} neuHref="/spielplan" archivHref="/spielplan/2025-26" />

        <LigaFilter ligen={LIGEN_2027.map(l => ({ code: l.code, name: l.name, color: l.color }))}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {LIGEN_2027.map(liga => (
            <section key={liga.code} data-liga={liga.code}>
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
              <LigaSpielplan27 liga={liga} ergebnisse={ergebnisse} aktuellZuerst />
            </section>
          ))}
        </div>
        </LigaFilter>
      </div>

      <Footer />
    </div>
  );
}
