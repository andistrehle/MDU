import type { Metadata } from 'next';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { PageBanner } from '@/components/mdu/page-banner';
import { UmfrageFormular } from '@/components/mdu/umfrage-formular';
import { UMFRAGE } from '@/lib/umfrage';

// Website-Umfrage (Betreiber, 09.11.2026) — Fragen, Zeitraum, Start: lib/umfrage.ts.

export const metadata: Metadata = {
  title: UMFRAGE.titel,
  description: 'Kurze, anonyme Umfrage zur Plattform der Münchner Dart Union – ca. 2 Minuten.',
  robots: { index: false, follow: false },
};

export default function UmfragePage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/umfrage" />
      <PageBanner eyebrow="Umfrage" title={UMFRAGE.titel} boardRight="max(20px, calc(50vw - 300px))" />
      <div className="mdu-section-pad" style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 80px' }}>
        <UmfrageFormular />
      </div>
      <Footer />
    </div>
  );
}
