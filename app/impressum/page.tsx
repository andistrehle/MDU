import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/mdu/legal-page';

export const metadata: Metadata = {
  title: 'Impressum · Münchner Dart Union',
  description: 'Impressum und Anbieterkennzeichnung der Münchner Dart Union.',
};

export default function ImpressumPage() {
  return (
    <LegalPage
      title="Impressum"
      updated="Juni 2026"
      notice={<>Hinweis: Dieser Text wird vor dem offiziellen Livegang rechtlich geprüft.</>}
    >
      <LegalSection title="Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)">
        Münchner Dart Union<br />
        Zenettistraße 30 · 80337 München
      </LegalSection>

      <LegalSection title="Vertreten durch">
        Anton Bauer<br />
        i. V. Andreas Strehle
      </LegalSection>

      <LegalSection title="Kontakt">
        E-Mail: kontakt@mdudarts.de
      </LegalSection>

      <LegalSection title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        Andreas Strehle<br />
        (Anschrift wie oben)
      </LegalSection>

      <LegalSection title="Haftung für Inhalte">
        Die Inhalte dieser Seiten wurden mit größtmöglicher Sorgfalt erstellt. Für die
        Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr
        übernommen werden. Liga-Daten (Mannschaften, Spielpläne, Ergebnisse, Tabellen,
        Ranglisten) werden zunehmend im Rahmen des Spielbetriebs auf dieser Plattform selbst
        erstellt (u. a. Mannschaftsanmeldungen, eingereichte Spielberichte, daraus berechnete
        Tabellen und Ranglisten) sowie aus den von den Spielern hochgeladenen Informationen, die
        diese gemäß DSV freigeben; teilweise stammen sie aus öffentlich verfügbaren Quellen
        (u. a. dartunion.de).
      </LegalSection>

      <LegalSection title="Haftung für Links">
        Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte kein
        Einfluss besteht. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
        Anbieter oder Betreiber verantwortlich.
      </LegalSection>

      <LegalSection title="Urheberrecht">
        Die durch den Betreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
        dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. MDU-Logo
        und Vereinsname werden mit Zustimmung der Münchner Dart Union verwendet.
      </LegalSection>
    </LegalPage>
  );
}
