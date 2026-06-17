import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/mdu/legal-page';

export const metadata: Metadata = {
  title: 'Impressum · Münchner Dart Union',
  description: 'Impressum und Anbieterkennzeichnung der Münchner Dart Union.',
};

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum" updated="[Stand-Datum]">
      <LegalSection title="Angaben gemäß § 5 TMG">
        [Name der Organisation / des Vereins]<br />
        [Straße und Hausnummer]<br />
        [PLZ und Ort]
      </LegalSection>

      <LegalSection title="Vertreten durch">
        [Vertretungsberechtigte Person, z. B. 1. Vorsitzender / Präsident]
      </LegalSection>

      <LegalSection title="Kontakt">
        E-Mail: [E-Mail-Adresse]<br />
        Telefon: [optional]
      </LegalSection>

      <LegalSection title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        [Name]<br />
        [Anschrift, falls abweichend]
      </LegalSection>

      <LegalSection title="Vereinsregister (falls eingetragener Verein)">
        Registergericht: [z. B. Amtsgericht München]<br />
        Registernummer: [VR …]
      </LegalSection>

      <LegalSection title="Haftung für Inhalte">
        Die Inhalte dieser Seiten wurden mit größtmöglicher Sorgfalt erstellt. Für die
        Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr
        übernommen werden. Liga-Daten (Tabellen, Spielpläne, Ergebnisse, Ranglisten)
        stammen aus öffentlich verfügbaren Quellen (u. a. dartunion.de).
      </LegalSection>

      <LegalSection title="Haftung für Links">
        Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte kein
        Einfluss besteht. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
        Anbieter verantwortlich.
      </LegalSection>

      <LegalSection title="Hinweis">
        TODO: Dieses Impressum ist eine Vorlage und muss mit den tatsächlichen Angaben
        gefüllt sowie rechtlich geprüft werden.
      </LegalSection>
    </LegalPage>
  );
}
