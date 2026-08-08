import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, MapPin, Trophy, Users } from 'lucide-react';
import { PageHero, DemoNotice } from '@/components/mdc/ui';
import { VENUES } from '@/data/venues';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Kontakt zur Munich Dart Challenge — mitspielen, Spielort werden, Fragen zur Wertung.',
};

const TOPICS = [
  {
    icon: <Users size={20} />,
    title: 'Mitspielen',
    text:
      'Einfach an einem Turnierabend ins Lokal kommen und vor Ort anmelden. Die MDC-Passnummer ' +
      'bekommt man beim ersten Start — sie gilt dann für die ganze Serie.',
    action: { label: 'Spielorte ansehen', href: '/mdc/spielorte' },
  },
  {
    icon: <MapPin size={20} />,
    title: 'Spielort werden',
    text:
      'Ihr habt Automaten und wollt einen festen Turniertag? Meldet euch — gebraucht werden ' +
      'mindestens zwei Automaten und ein Abend, an dem Platz für 16 bis 32 Leute ist.',
    action: null,
  },
  {
    icon: <Trophy size={20} />,
    title: 'Fragen zur Wertung',
    text:
      'Punkte falsch verbucht, Platzierung unklar, Passnummer doppelt? Am besten mit Datum, ' +
      'Lokal und Passnummer melden — dann lässt sich das schnell klären.',
    action: { label: 'Punkte erklärt', href: '/mdc/regeln' },
  },
];

export default function KontaktPage() {
  return (
    <>
      <PageHero
        kicker="Schreib uns"
        title="Kontakt"
        description={`Die MDC wird von Hand organisiert — in ${VENUES.length} Lokalen, jede Woche. Wer mitspielen, einen Spielort anbieten oder etwas geklärt haben will, meldet sich am besten direkt.`}
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <DemoNotice>
            In dieser Vorschau sind noch keine echten Kontaktdaten hinterlegt und es
            gibt bewusst kein Formular — es würde nichts verschicken. Adresse und
            E-Mail trägt der Betreiber vor der Veröffentlichung ein.
          </DemoNotice>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {TOPICS.map(topic => (
              <article key={topic.title} className="mdc-card" style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'var(--mdc-red)' }}>{topic.icon}</span>
                <h2 className="mdc-display" style={{ fontSize: '1.2rem', marginTop: 12 }}>{topic.title}</h2>
                <p style={{ marginTop: 9, fontSize: '0.92rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
                  {topic.text}
                </p>
                {topic.action && (
                  <Link
                    href={topic.action.href}
                    className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                    style={{ marginTop: 'auto', paddingTop: 9, alignSelf: 'flex-start' }}
                  >
                    {topic.action.label}
                  </Link>
                )}
              </article>
            ))}
          </div>

          <div className="mdc-card mdc-card-accent" style={{ padding: '22px 20px' }}>
            <h2 className="mdc-display mdc-h3">Lieber im Team spielen?</h2>
            <p style={{ marginTop: 10, color: 'var(--mdc-ink-soft)', lineHeight: 1.7, fontSize: '0.95rem', maxWidth: 640 }}>
              Die Münchner Dart Union organisiert den Ligabetrieb in München — Mannschaften,
              Spielpläne, Tabellen. Ein eigenständiges Projekt mit eigenen Pässen; MDC-Punkte
              und MDU-Ligaspiele haben nichts miteinander zu tun.
            </p>
            <a
              href="https://www.mdudarts.de"
              className="mdc-btn mdc-btn-ghost mdc-btn-sm"
              style={{ marginTop: 16 }}
            >
              Zur Münchner Dart Union
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
