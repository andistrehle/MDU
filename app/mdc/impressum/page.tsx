import type { Metadata } from 'next';
import { PageHero, DemoNotice } from '@/components/mdc/ui';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum der Munich Darts Challenge (Platzhalter der Demo-Fassung).',
};

export default function ImpressumPage() {
  return (
    <>
      <PageHero kicker="Rechtliches" title="Impressum" />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <DemoNotice>
            Platzhalter. Vor einer Veröffentlichung muss dieses Impressum mit den
            echten Angaben gefüllt und rechtlich geprüft werden — Name, Anschrift,
            Vertretungsberechtigte und Kontaktdaten sind Pflichtangaben nach § 5 DDG.
          </DemoNotice>

          <div style={{ color: 'var(--mdc-ink-soft)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <h2 className="mdc-display mdc-h3" style={{ color: 'var(--mdc-ink)', marginBottom: 10 }}>
              Angaben gemäß § 5 DDG
            </h2>
            <p>
              Munich Darts Challenge<br />
              [Vor- und Nachname der verantwortlichen Person]<br />
              [Straße und Hausnummer]<br />
              [PLZ] München
            </p>

            <h2 className="mdc-display mdc-h3" style={{ color: 'var(--mdc-ink)', margin: '28px 0 10px' }}>
              Kontakt
            </h2>
            <p>
              E-Mail: [E-Mail-Adresse]<br />
              Telefon: [Telefonnummer]
            </p>

            <h2 className="mdc-display mdc-h3" style={{ color: 'var(--mdc-ink)', margin: '28px 0 10px' }}>
              Verantwortlich für den Inhalt
            </h2>
            <p>[Name], Anschrift wie oben</p>

            <h2 className="mdc-display mdc-h3" style={{ color: 'var(--mdc-ink)', margin: '28px 0 10px' }}>
              Haftung für Inhalte und Links
            </h2>
            <p>
              [Platzhalter. Übliche Hinweise zu Inhalten und externen Verweisen ergänzen —
              die Formulierungen sollten vor der Veröffentlichung geprüft werden.]
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
