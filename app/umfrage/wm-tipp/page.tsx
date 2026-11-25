import type { Metadata } from 'next';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { PageBanner } from '@/components/mdu/page-banner';
import { UmfrageFormular } from '@/components/mdu/umfrage-formular';
import { WM_FRAGEN, WM_UMFRAGE } from '@/lib/umfrage';

// Kurz-Umfrage WM-Tippspiel (Betreiber, 25.11.2026) — Fragen und Zeitraum in lib/umfrage.ts.
export const metadata: Metadata = {
  title: WM_UMFRAGE.titel,
  description: 'Vier kurze Fragen: Hast du Lust auf ein MDU-Tippspiel zur Darts-WM?',
  robots: { index: false, follow: false },
};

export default function WmUmfragePage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/umfrage" />
      <PageBanner eyebrow="Umfrage" title={WM_UMFRAGE.titel} boardRight="max(20px, calc(50vw - 300px))" />
      <div className="mdu-section-pad" style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 80px' }}>
        <UmfrageFormular def={WM_UMFRAGE} fragen={WM_FRAGEN} />
      </div>
      <Footer />
    </div>
  );
}
