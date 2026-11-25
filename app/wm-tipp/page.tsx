import type { Metadata } from 'next';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { PageBanner } from '@/components/mdu/page-banner';
import { WmTipp } from '@/components/mdu/wm-tipp';
import { WM_NAME } from '@/lib/wm-tipp';

// WM-Tipp (Betreiber, 25.11.2026). Rechnung lib/wm-tipp.ts, solange WM_TIPP_LIVE = false nur für die Ligaleitung.
export const metadata: Metadata = {
  title: `WM-Tipp · ${WM_NAME}`,
  description: 'Das Tippspiel der Münchner Dart Union zur Darts-WM – im Team, in der Liga und über die ganze MDU.',
  robots: { index: false, follow: false },
};

export default function WmTippPage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/wm-tipp" />
      <PageBanner eyebrow={WM_NAME} title="WM-Tipp" boardRight="max(20px, calc(50vw - 300px))" />
      <div className="mdu-section-pad" style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 80px' }}>
        <WmTipp />
      </div>
      <Footer />
    </div>
  );
}
