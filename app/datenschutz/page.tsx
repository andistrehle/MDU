import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/mdu/legal-page';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung · Münchner Dart Union',
  description: 'Informationen zur Verarbeitung personenbezogener Daten auf der MDU-Plattform.',
};

export default function DatenschutzPage() {
  return (
    <LegalPage
      title="Datenschutzerklärung"
      updated="Juni 2026"
      notice={<>Hinweis: Die Anschrift des Verantwortlichen (mit <code style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>[…]</code> markiert)
        wird noch ergänzt; der Text wird vor dem offiziellen Livegang rechtlich geprüft.</>}
    >
      <LegalSection title="1. Verantwortlicher">
        Verantwortlich für die Datenverarbeitung auf dieser Website ist die Münchner Dart
        Union, vertreten durch Andreas Strehle.<br />
        [Anschrift wie im Impressum]<br />
        E-Mail (Datenschutzkontakt): kontakt@mdudarts.de
      </LegalSection>

      <LegalSection title="2. Hosting (Vercel)">
        Diese Website wird bei der Vercel Inc. gehostet. Beim Aufruf werden technisch
        notwendige Daten (z. B. IP-Adresse, Datum/Uhrzeit, abgerufene Seite, Browsertyp) in
        Server-Logs verarbeitet, um die Auslieferung und Sicherheit zu gewährleisten.
        Rechtsgrundlage: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO). Mit dem Anbieter
        besteht bzw. wird ein Auftragsverarbeitungsvertrag (Art. 28 DSGVO) geschlossen. Soweit
        Daten in ein Drittland (USA) übermittelt werden, erfolgt dies auf Grundlage geeigneter
        Garantien (EU-Standardvertragsklauseln bzw. EU-US Data Privacy Framework).
      </LegalSection>

      <LegalSection title="3. DNS & Content-Delivery (Cloudflare)">
        Der Abruf der Website wird über die Cloudflare, Inc. geleitet (DNS, Content-Delivery,
        Schutz vor Angriffen). Dabei werden technische Verbindungsdaten (u. a. IP-Adresse)
        verarbeitet, um Auslieferung und Sicherheit zu gewährleisten. Rechtsgrundlage:
        berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO); Auftragsverarbeitung und
        geeignete Garantien für etwaige Drittlandübermittlung wie unter Ziffer 2.
      </LegalSection>

      <LegalSection title="4. Benutzerkonten & Authentifizierung (Supabase)">
        Für interne Funktionen (eigenes Profil, Team-Bereich) kann ein Benutzerkonto erstellt
        werden. Authentifizierung und Datenbank werden über Supabase (Region EU) betrieben.
        Verarbeitet werden: E-Mail-Adresse, ein gehashtes Passwort, Anzeigename, Rolle sowie
        optionale Verknüpfungen zu Spieler/Team. Rechtsgrundlage: Vertrag/Nutzung
        (Art. 6 Abs. 1 lit. b DSGVO). Mit dem Anbieter besteht bzw. wird ein
        Auftragsverarbeitungsvertrag geschlossen.
      </LegalSection>

      <LegalSection title="5. E-Mail-Versand (Resend)">
        Für system­seitige E-Mails (z. B. Konto-Bestätigung, Freigabe-/Status-Benachrichtigungen)
        wird der Dienst Resend genutzt. Verarbeitet werden die E-Mail-Adresse und der
        Nachrichteninhalt zum Zweck des Versands. Rechtsgrundlage: Vertrag/Nutzung bzw.
        berechtigtes Interesse (Art. 6 Abs. 1 lit. b/f DSGVO). Auftragsverarbeitung und
        geeignete Garantien für etwaige Drittlandübermittlung wie unter Ziffer 2.
      </LegalSection>

      <LegalSection title="6. Profil- und Spielerdaten">
        Eingeloggte Nutzer können Spitzname, einen „Über mich“-Text und ein Profilbild
        hinterlegen. Diese Angaben sind – soweit veröffentlicht – auf dem öffentlichen
        Spielerprofil sichtbar und können jederzeit durch den Nutzer selbst geändert oder
        gelöscht werden. Die Veröffentlichung von Profilbild und Spitzname erfolgt nur auf
        Grundlage einer gesonderten, freiwilligen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO),
        die jederzeit mit Wirkung für die Zukunft widerrufen werden kann. Liga-Stammdaten
        (Namen, Ergebnisse, Ranglisten) stammen aus öffentlich verfügbaren Quellen
        (u. a. dartunion.de).
      </LegalSection>

      <LegalSection title="7. Datei-Uploads (Spielbericht-Fotos)">
        Berechtigte Nutzer (Teamkapitäne, Ligaleitung) können Fotos/PDF eines Papier-Spiel­berichts
        hochladen. Diese Dateien werden in einem privaten, nicht öffentlich zugänglichen
        Speicher (Supabase Storage) abgelegt; der Zugriff erfolgt ausschließlich serverseitig
        über zeitlich begrenzte, signierte Links. Die hochgeladenen Original-Dateien werden
        gelöscht, sobald der zugehörige Spielbericht bestätigt ist. Rechtsgrundlage:
        Durchführung des Spielbetriebs / berechtigtes Interesse (Art. 6 Abs. 1 lit. b/f DSGVO).
      </LegalSection>

      <LegalSection title="8. Automatische Texterkennung der Spielberichte (Anthropic)">
        Zur Vorerfassung werden hochgeladene Spielbericht-Fotos/PDF an den Dienst Anthropic
        (Claude) übermittelt, der daraus die enthaltenen Angaben (u. a. Namen, Pass-Nummern,
        Ergebnisse) ausliest. Die Übermittlung erfolgt an Server in den USA. Anthropic
        verarbeitet die Daten als Auftragsverarbeiter ausschließlich zur Erbringung dieser
        Erkennung und nutzt API-Daten nicht zum Training von Modellen. Für die Übermittlung in
        die USA bestehen geeignete Garantien (EU-Standardvertragsklauseln bzw. Data Privacy
        Framework). Das Ergebnis wird anschließend vom verantwortlichen Nutzer geprüft und
        bestätigt; die Original-Datei wird gemäß Ziffer 7 gelöscht. Rechtsgrundlage:
        Durchführung des Spielbetriebs / berechtigtes Interesse (Art. 6 Abs. 1 lit. b/f DSGVO).
      </LegalSection>

      <LegalSection title="9. Spieler- und Mannschaftsbilder">
        Spieler- und Profilfotos werden ausschließlich vom jeweiligen Spieler selbst
        hochgeladen. Mannschaftsbilder werden nur mit Zustimmung aller abgebildeten Personen
        veröffentlicht; die hochladende Person (Teamkapitän/Administrator) stellt sicher, dass
        diese Zustimmungen vorliegen. Ein Bild kann jederzeit vom betroffenen Spieler selbst
        sowie durch die Ligaleitung/Administration entfernt werden. Für die Entfernung genügt
        zudem eine Nachricht an den Datenschutzkontakt (Ziffer 1).
      </LegalSection>

      <LegalSection title="10. Kontaktaufnahme">
        Bei Kontaktaufnahme (z. B. per E-Mail) werden die übermittelten Angaben zur
        Bearbeitung der Anfrage verarbeitet und nicht ohne Einwilligung weitergegeben.
      </LegalSection>

      <LegalSection title="11. Cookies / lokale Speicherung">
        Es werden ausschließlich technisch notwendige Mechanismen für die Anmeldung (Session)
        sowie die Designauswahl (Hell/Dunkel) genutzt. Es werden keine Tracking- oder
        Marketing-Cookies eingesetzt; eine Einwilligung (Cookie-Banner) ist hierfür nicht
        erforderlich.
      </LegalSection>

      <LegalSection title="12. Speicherdauer">
        Personenbezogene Daten werden nur so lange gespeichert, wie es für die genannten Zwecke
        erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen. Benutzerkonten und
        Profildaten werden bis zur Löschung des Kontos gespeichert. Hochgeladene
        Spielbericht-Original­dateien werden nach Bestätigung des Spielberichts gelöscht
        (siehe Ziffer 7).
      </LegalSection>

      <LegalSection title="13. Rechte der betroffenen Personen">
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
        Verarbeitung, Datenübertragbarkeit und Widerspruch. Erteilte Einwilligungen können Sie
        jederzeit mit Wirkung für die Zukunft widerrufen. Zudem besteht ein Beschwerderecht bei
        einer Aufsichtsbehörde. Zur Wahrnehmung Ihrer Rechte wenden Sie sich an:
        kontakt@mdudarts.de.
      </LegalSection>

      <LegalSection title="14. Server-Logs">
        Zur Sicherstellung des Betriebs werden Server-Logfiles automatisch erfasst und nach den
        Vorgaben der eingesetzten Anbieter (Vercel, Cloudflare, Supabase) gespeichert.
      </LegalSection>
    </LegalPage>
  );
}
