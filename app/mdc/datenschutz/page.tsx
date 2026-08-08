import type { Metadata } from 'next';
import { PageHero, DemoNotice } from '@/components/mdc/ui';

export const metadata: Metadata = {
  title: 'Datenschutz',
  description: 'Datenschutzhinweise der Munich Dart Challenge (Platzhalter der Demo-Fassung).',
};

const SECTIONS = [
  {
    title: 'Verantwortliche Stelle',
    body: '[Name und Anschrift der verantwortlichen Person — siehe Impressum. Kontaktadresse für Auskunfts- und Löschanfragen ergänzen.]',
  },
  {
    title: 'Welche Daten veröffentlicht werden',
    body:
      'Für den Ranglistenbetrieb werden Name, Vorname, MDC-Passnummer, Anzahl der Turnierteilnahmen, ' +
      'Punkte und Platzierung veröffentlicht. Diese Angaben sind der Kern einer Rangliste — ohne sie ' +
      'gäbe es keine Wertung. Fotos, Geburtsdaten, Anschriften oder Kontaktdaten werden auf dieser ' +
      'Seite nicht gezeigt.',
  },
  {
    title: 'Rechtsgrundlage',
    body: '[Zu prüfen und zu ergänzen: Rechtsgrundlage der Veröffentlichung, Speicherdauer, Widerspruchsrecht.]',
  },
  {
    title: 'Server-Logdaten',
    body: '[Platzhalter: Angaben zum Hosting, zu Server-Logdaten und deren Aufbewahrungsdauer.]',
  },
  {
    title: 'Rechte der Betroffenen',
    body:
      'Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch und ' +
      'Beschwerde bei einer Aufsichtsbehörde. [Konkrete Kontaktwege ergänzen.]',
  },
  {
    title: 'Externe Dienste',
    body:
      'Diese Vorschau lädt keine Inhalte von fremden Servern nach — keine Karten, keine Schriftarten ' +
      'von Dritten auf den MDC-Seiten, keine Zählpixel. Verweise auf Kartendienste öffnen sich erst ' +
      'nach ausdrücklichem Klick.',
  },
];

export default function DatenschutzPage() {
  return (
    <>
      <PageHero kicker="Rechtliches" title="Datenschutz" />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <DemoNotice>
            Platzhalter. Diese Hinweise sind nicht geprüft und ersetzen keine
            Datenschutzerklärung. Vor einer Veröffentlichung mit echten Spielernamen
            muss der Text rechtlich abgesichert werden.
          </DemoNotice>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {SECTIONS.map(section => (
              <div key={section.title}>
                <h2 className="mdc-display mdc-h3" style={{ marginBottom: 8 }}>{section.title}</h2>
                <p style={{ color: 'var(--mdc-ink-soft)', lineHeight: 1.75, fontSize: '0.95rem' }}>
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
