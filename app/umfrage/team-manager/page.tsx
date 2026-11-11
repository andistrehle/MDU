import type { Metadata } from 'next';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { PageBanner } from '@/components/mdu/page-banner';
import { UmfrageFormular } from '@/components/mdu/umfrage-formular';
import { TM_FRAGEN, TM_UMFRAGE } from '@/lib/umfrage';

// Umfrage für Käufer des Team Managers (Betreiber, 11.11.2026) — nur per Link, nirgends verlinkt.

export const metadata: Metadata = {
  title: TM_UMFRAGE.titel,
  description: 'Kurze Umfrage zum Team Manager – ca. 2 Minuten.',
  robots: { index: false, follow: false },
};

export default function TeamManagerUmfragePage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/umfrage" />
      <PageBanner eyebrow="Team Manager" title={TM_UMFRAGE.titel} boardRight="max(20px, calc(50vw - 300px))" />
      <div className="mdu-section-pad" style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 80px' }}>
        <UmfrageFormular def={TM_UMFRAGE} fragen={TM_FRAGEN} />
      </div>
      <Footer />
    </div>
  );
}
