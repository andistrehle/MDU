import type { Metadata } from 'next';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { PageBanner } from '@/components/mdu/page-banner';
import { FaqListe } from '@/components/mdu/faq-liste';
import { FAQ } from '@/lib/data/faq';

export const metadata: Metadata = {
  title: 'Häufige Fragen · Münchner Dart Union',
  description: 'Antworten auf häufige Fragen zu Konto, Spielbericht, Tabelle, Spielplan und Team Manager der Münchner Dart Union.',
};

// Strukturierte Daten (FAQPage) — nur Klartext, ohne Auszeichnung.
const klartext = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[(.+?)\]\((.+?)\)/g, '$1').replace(/\n- /g, '\n• ');
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.flatMap(k => k.fragen.map(f => ({
    '@type': 'Question', name: f.frage,
    acceptedAnswer: { '@type': 'Answer', text: klartext(f.antwort) },
  }))),
};

export default function FaqPage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/faq" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD).replace(/</g, '\\u003c') }} />

      <PageBanner eyebrow="Münchner Dart Union" title="Häufige Fragen" boardRight="max(20px, calc(50vw - 300px))" />

      <div className="mdu-section-pad" style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)', lineHeight: 1.65, margin: '0 0 20px' }}>
          Hier sammeln wir die Fragen, die uns rund um Liga und Plattform am häufigsten erreichen.
          Die Liste wächst laufend mit.
        </p>

        <FaqListe />

        <div style={{
          marginTop: 36, padding: '16px 18px',
          background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', borderRadius: 12,
          fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-muted)', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--th-text-strong)' }}>Deine Frage ist nicht dabei?</strong>{' '}
          Schreib uns über das{' '}
          <Link href="/kontakt" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Kontaktformular</Link>
          {' '}— wir antworten dir und nehmen sie hier mit auf, wenn sie auch andere betrifft.
        </div>
      </div>

      <Footer />
    </div>
  );
}
