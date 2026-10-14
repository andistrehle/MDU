import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { TerminAnsicht } from '@/components/mdu/termin-ansicht';

// ============================================================
// Terminseite für eigene Termine aus dem Team Manager (Migration 0048)
// ============================================================
// Der Termin liegt in der DB und ist nur fürs eigene Team lesbar (RLS) —
// deshalb lädt der Browser ihn; der Server liefert nur den Rahmen. Keine
// statischen Seiten, kein ISR: Termine kommen und gehen laufend.
// ============================================================

export const metadata: Metadata = {
  title: 'Termin',
  description: 'Termin deines Teams – wer ist dabei?',
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TerminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/mein-bereich" />
      <div className="mdu-section-pad" style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 80px' }}>
        <TerminAnsicht id={id} />
      </div>
    </div>
  );
}
