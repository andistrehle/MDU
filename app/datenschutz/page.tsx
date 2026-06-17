import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/mdu/legal-page';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung · Münchner Dart Union',
  description: 'Informationen zur Verarbeitung personenbezogener Daten auf der MDU-Plattform.',
};

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutzerklärung" updated="[Stand-Datum]">
      <LegalSection title="1. Verantwortlicher">
        Verantwortlich für die Datenverarbeitung auf dieser Website:<br />
        [Name des Verantwortlichen]<br />
        [Adresse]<br />
        E-Mail (Datenschutzkontakt): [E-Mail Datenschutzkontakt]<br />
        Vertretungsberechtigt: [Vertretungsberechtigter]
      </LegalSection>

      <LegalSection title="2. Hosting (Vercel)">
        Diese Website wird bei Vercel gehostet. Beim Aufruf werden technisch notwendige
        Daten (z. B. IP-Adresse, Datum/Uhrzeit, abgerufene Seite, Browsertyp) in
        Server-Logs verarbeitet, um die Auslieferung und Sicherheit zu gewährleisten.
        Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO).
        TODO: Auftragsverarbeitungsvertrag mit Vercel prüfen.
      </LegalSection>

      <LegalSection title="3. Benutzerkonten & Authentifizierung (Supabase)">
        Für interne Funktionen (eigenes Profil, Team-Bereich) kann ein Benutzerkonto
        erstellt werden. Authentifizierung und Datenbank werden über Supabase betrieben
        (Region EU). Verarbeitet werden: E-Mail-Adresse, ein gehashtes Passwort,
        Anzeigename, Rolle sowie optionale Verknüpfungen zu Spieler/Team.
        Rechtsgrundlage: Vertrag/Nutzung (Art. 6 Abs. 1 lit. b DSGVO).
        TODO: Auftragsverarbeitungsvertrag mit Supabase prüfen.
      </LegalSection>

      <LegalSection title="4. Profil- und Spielerdaten">
        Eingeloggte Nutzer können Spitzname, einen „Über mich“-Text und ein Profilbild
        (bzw. Bild-URL) hinterlegen. Diese Angaben sind auf dem öffentlichen Spielerprofil
        sichtbar und können jederzeit durch den Nutzer selbst geändert oder gelöscht
        werden. Liga-Stammdaten (Namen, Ergebnisse, Ranglisten) stammen aus öffentlich
        verfügbaren Quellen (u. a. dartunion.de).
      </LegalSection>

      <LegalSection title="5. Spieler- und Mannschaftsbilder">
        Bilder werden nur verwendet, wenn sie öffentlich verfügbar sind oder eine
        Zustimmung der abgebildeten Personen vorliegt. Mannschaftsbilder werden durch
        Teamkapitäne oder Administratoren hinterlegt; diese stellen die erforderlichen
        Zustimmungen sicher. Für die Entfernung oder Korrektur eines Bildes genügt eine
        Nachricht an den Datenschutzkontakt (siehe Abschnitt 1 / 9).
      </LegalSection>

      <LegalSection title="6. Kontaktaufnahme">
        Bei Kontaktaufnahme (z. B. per E-Mail) werden die übermittelten Angaben zur
        Bearbeitung der Anfrage verarbeitet und nicht ohne Einwilligung weitergegeben.
      </LegalSection>

      <LegalSection title="7. Cookies / lokale Speicherung">
        Es werden technisch notwendige Mechanismen für die Anmeldung (Session) sowie die
        Designauswahl (Hell/Dunkel) genutzt. Es werden keine Tracking- oder
        Marketing-Cookies eingesetzt. TODO: Bei späterem Einsatz von Analyse-/Marketing-
        Diensten ist ein Consent-Banner zu ergänzen.
      </LegalSection>

      <LegalSection title="8. Server-Logs">
        Zur Sicherstellung des Betriebs werden Server-Logfiles automatisch erfasst und
        nach den Vorgaben der eingesetzten Anbieter (Vercel, Supabase) gespeichert.
      </LegalSection>

      <LegalSection title="9. Rechte der betroffenen Personen">
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
        Verarbeitung, Datenübertragbarkeit und Widerspruch. Zudem besteht ein
        Beschwerderecht bei einer Aufsichtsbehörde. Zur Wahrnehmung Ihrer Rechte wenden
        Sie sich an: [E-Mail Datenschutzkontakt].
      </LegalSection>

      <LegalSection title="10. Hinweis">
        TODO: Diese Datenschutzerklärung ist eine Vorlage. Sie muss mit den tatsächlichen
        Angaben gefüllt und vor dem offiziellen Livegang rechtlich geprüft werden. Sie
        stellt keine Rechtsberatung dar.
      </LegalSection>
    </LegalPage>
  );
}
