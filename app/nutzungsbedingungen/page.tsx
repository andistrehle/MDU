import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/mdu/legal-page';

export const metadata: Metadata = {
  title: 'Nutzungsbedingungen · Münchner Dart Union',
  description: 'Bedingungen für die Nutzung der Online-Plattform der Münchner Dart Union.',
};

export default function NutzungsbedingungenPage() {
  return (
    <LegalPage
      title="Nutzungsbedingungen"
      updated="Juni 2026"
      notice={<>Hinweis: Diese Nutzungsbedingungen werden vor dem offiziellen Livegang rechtlich geprüft.</>}
    >
      <LegalSection title="1. Geltungsbereich">
        Diese Nutzungsbedingungen gelten für die Nutzung der Online-Plattform der Münchner Dart
        Union (nachfolgend „Plattform“). Mit der Registrierung eines Benutzerkontos erklärt sich
        die nutzende Person mit diesen Bedingungen einverstanden.
      </LegalSection>

      <LegalSection title="2. Benutzerkonten">
        Für bestimmte Funktionen ist ein Benutzerkonto erforderlich. Die angegebenen Daten
        müssen wahrheitsgemäß und vollständig sein. Zugangsdaten sind vertraulich zu behandeln
        und nicht an Dritte weiterzugeben. Rollen und Team-Rechte (z. B. Teamkapitän,
        Ligaleitung) werden erst nach Prüfung durch die Ligaleitung vergeben. Die Ligaleitung
        kann Konten bei Verstößen sperren oder löschen.
      </LegalSection>

      <LegalSection title="3. Inhalte der Nutzer">
        Für selbst eingestellte Inhalte (z. B. Profilangaben, Spitzname, Bilder, Spielberichte)
        ist die jeweils einstellende Person verantwortlich. Es dürfen nur Inhalte eingestellt
        werden, an denen die erforderlichen Rechte bestehen und die keine Rechte Dritter
        (insb. Urheber-, Persönlichkeits- und Datenschutzrechte) verletzen.
      </LegalSection>

      <LegalSection title="4. Uploads (Bilder & Spielberichte)">
        Profil- und Spielerfotos dürfen ausschließlich vom abgebildeten Spieler selbst
        hochgeladen werden. Mannschaftsbilder dürfen nur mit Zustimmung aller abgebildeten
        Personen hochgeladen werden; die hochladende Person stellt das sicher. Hochgeladene
        Spielbericht-Fotos dienen ausschließlich der Erfassung des Spielbetriebs und werden
        nach Bestätigung des Spielberichts gelöscht.
      </LegalSection>

      <LegalSection title="5. Verbotene Nutzung / Missbrauch">
        Untersagt sind insbesondere: das Einstellen rechtswidriger, beleidigender oder
        diskriminierender Inhalte; das Hochladen fremder Bilder ohne Zustimmung; die
        missbräuchliche Nutzung fremder Konten; das automatisierte Auslesen der Plattform
        sowie jede Handlung, die den Betrieb oder die Sicherheit der Plattform beeinträchtigt.
        Bei Verstößen können Inhalte entfernt und Konten gesperrt werden.
      </LegalSection>

      <LegalSection title="6. Liga-Daten">
        Liga-Daten (Mannschaften, Spielpläne, Ergebnisse, Tabellen, Ranglisten) werden
        zunehmend im Rahmen des Spielbetriebs auf dieser Plattform selbst erstellt und gepflegt
        – insbesondere durch Mannschaftsanmeldungen, eingereichte bzw. hochgeladene Spielberichte
        und die daraus automatisch berechneten Tabellen und Ranglisten. Teilweise stammen sie
        (insbesondere für zurückliegende Spielzeiten) aus öffentlich verfügbaren Quellen
        (u. a. dartunion.de). Die Daten dienen der Information; für ihre Richtigkeit und
        Vollständigkeit wird keine Gewähr übernommen.
      </LegalSection>

      <LegalSection title="7. Verfügbarkeit">
        Es besteht kein Anspruch auf ständige Verfügbarkeit der Plattform. Wartungsarbeiten,
        Störungen oder technische Gründe können zu vorübergehenden Einschränkungen führen.
      </LegalSection>

      <LegalSection title="8. Haftung">
        Die Plattform wird mit größtmöglicher Sorgfalt betrieben. Eine Haftung für Schäden, die
        aus der Nutzung oder Nichtverfügbarkeit entstehen, ist – soweit gesetzlich zulässig –
        ausgeschlossen. Unberührt bleibt die Haftung für Vorsatz und grobe Fahrlässigkeit sowie
        bei Verletzung von Leben, Körper oder Gesundheit.
      </LegalSection>

      <LegalSection title="9. Änderungen">
        Diese Nutzungsbedingungen können bei Bedarf angepasst werden. Über wesentliche
        Änderungen werden die Nutzer in geeigneter Form informiert.
      </LegalSection>

      <LegalSection title="10. Datenschutz">
        Informationen zur Verarbeitung personenbezogener Daten finden sich in der
        Datenschutzerklärung.
      </LegalSection>

      <LegalSection title="11. Schlussbestimmungen">
        Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts;
        zwingende Verbraucherschutzvorschriften des Staates, in dem die nutzende Person ihren
        gewöhnlichen Aufenthalt hat, bleiben unberührt. Sollten einzelne Bestimmungen dieser
        Nutzungsbedingungen unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen
        Bestimmungen davon unberührt.
      </LegalSection>
    </LegalPage>
  );
}
