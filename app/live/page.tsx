import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { LiveTickerSeite } from '@/components/mdu/live-ticker-seite';
import { LIGEN_2027 } from '@/lib/data/saison-2027';

export const metadata: Metadata = { title: 'Live-Ticker', description: 'Die Spiele des heutigen Spieltags live – Stand, Partien und Legs.' };

// Live-Ticker (Betreiber, 11.11.2026). Die Seite selbst ist statisch, die Stände
// holt der Browser alle 30 s über /api/live.
export default function LivePage() {
  const ligen = LIGEN_2027.map(l => ({ code: l.code, name: l.name, farbe: l.color }));
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/spielplan" />
      <PageBanner eyebrow="Heute" title="Live-Ticker" boardRight="max(28px, min(calc(50vw - 188px), calc(100vw - 828px)))" />
      <div className="mdu-section-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 80px' }}>
        <Suspense fallback={null}><LiveTickerSeite ligen={ligen} /></Suspense>
      </div>
      <Footer />
    </div>
  );
}
