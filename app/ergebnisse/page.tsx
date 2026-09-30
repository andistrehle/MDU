import type { Metadata } from 'next';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { SaisonUmschalter } from '@/components/mdu/saison-umschalter';
import { NEUE_SAISON, SAISON_START, datumText } from '@/lib/data/saison-2027';

export const metadata: Metadata = { title: 'Ergebnisse' };

// Saison 2026/2027 — noch keine Ergebnisse. Archiv 2025/26: /ergebnisse/2025-26.
export default function ErgebnissePage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/ergebnisse" />

      <PageBanner eyebrow={NEUE_SAISON.name} title="Ergebnisse" boardRight="max(28px, min(calc(50vw - 288px), calc(100vw - 928px)))" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 80px' }}>
        <SaisonUmschalter archiv={false} neuHref="/ergebnisse" archivHref="/ergebnisse/2025-26" />

        <div style={{ maxWidth: 640, padding: '22px 22px', borderRadius: 14, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', fontFamily: 'var(--font-manrope)', fontSize: 14, lineHeight: 1.6, color: 'var(--th-text-body)' }}>
          <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 20, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)', marginBottom: 6 }}>
            Noch keine Ergebnisse
          </div>
          Die {NEUE_SAISON.name} beginnt am Wochenende ab {datumText(SAISON_START)}. Die Ergebnisse erscheinen hier, sobald gespielt wurde.
          {' '}Bis dahin: <Link href="/spielplan" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>vorläufiger Spielplan</Link>
          {' '}· <Link href="/ergebnisse/2025-26" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Ergebnisse 2025/26</Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
