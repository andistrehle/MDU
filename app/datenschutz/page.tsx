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
      notice={<>Hinweis: Dieser Text wird vor dem offiziellen Livegang rechtlich geprüft.</>}
    >
      <LegalSection title="1. Verantwortlicher">
        Verantwortlich für die Datenverarbeitung auf dieser Website ist die Münchner Dart
        Union, vertreten durch Anton Bauer (i. V. Andreas Strehle).<br />
        Zenettistraße 30 · 80337 München<br />
        E-Mail (Datenschutzkontakt): kontakt@mdudarts.de
      </LegalSection>

      <LegalSection title="2. Domain & Hosting (Strato, Vercel)">
        Die Website ist unter der Domain mdudarts.de erreichbar; die Domain ist über die
        Strato AG registriert. Gehostet wird die Website bei der Vercel Inc. Beim Aufruf werden
        technisch notwendige Daten (z. B. IP-Adresse, Datum/Uhrzeit, abgerufene Seite,
        Browsertyp) in Server-Logs verarbeitet, um die Auslieferung und Sicherheit zu gewährleisten.
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
        gelöscht werden. Die Veröffentlichung von <strong>Profilbild</strong> und
        <strong> Spitzname</strong> erfolgt ausschließlich nach aktiver, freiwilliger Einwilligung
        (Art. 6 Abs. 1 lit. a DSGVO): Beide werden auf dem öffentlichen Spielerprofil nur
        angezeigt, wenn der Nutzer das jeweilige Häkchen in seinen Profil-Einstellungen selbst
        setzt. Ohne diese Zustimmung bleiben Bild und Spitzname nicht öffentlich. Die Einwilligung
        ist jederzeit mit Wirkung für die Zukunft widerrufbar, indem das Häkchen wieder entfernt
        wird. Der „Über mich“-Text ist nur für eingeloggte Nutzer im Spielerprofil sichtbar.
        Liga-Stammdaten
        (Mannschaften, Spieler, Ergebnisse, Tabellen, Ranglisten) stammen teils aus öffentlich
        verfügbaren Quellen (u. a. dartunion.de) und werden zunehmend im Rahmen des
        Spielbetriebs auf dieser Plattform selbst erhoben und berechnet – insbesondere durch
        Mannschaftsanmeldungen, eingereichte bzw. hochgeladene Spielberichte und die daraus
        automatisch berechneten Tabellen und Ranglisten.
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

      <LegalSection title="13. Telefonnummern (Spieler/Kapitäne & Spielstätten)">
        Telefonnummern dienen ausschließlich der direkten Absprache im Spielbetrieb
        (z. B. Spielabsagen oder -verschiebungen).<br /><br />
        <strong>Kapitäns-/Spieler-Telefonnummern</strong> werden zugriffsgeschützt gespeichert und
        sind – nach Freigabe – ausschließlich für eingeloggte Teamkapitäne (sowie die Ligaleitung)
        sichtbar, <strong>nicht öffentlich</strong>. Bei Teamkapitänen ist die Freigabe standardmäßig
        aktiviert. Jede betroffene Person kann ihre Nummer jederzeit im eigenen Profil ändern, die
        Freigabe widerrufen oder die Nummer vollständig entfernen (Art. 6 Abs. 1 lit. a/f DSGVO).
        Ein Teil dieser Nummern wurde anfänglich aus der <strong>öffentlich zugänglichen
        Mannschafts- und Kontaktübersicht („TC’s und Lokale“) auf dartunion.de</strong> übernommen,
        auf der diese Nummern derzeit öffentlich angezeigt werden; Betroffene können sie hier – wie
        beschrieben – jederzeit ändern oder löschen.<br /><br />
        <strong>Telefonnummern der Spielstätten/Lokale</strong> werden – wie bereits öffentlich auf
        dartunion.de bzw. in allgemein zugänglichen Verzeichnissen – öffentlich angezeigt, um die
        Kontaktaufnahme zu den Spielorten zu ermöglichen. Es handelt sich um geschäftliche
        Kontaktdaten der Lokale, nicht um private Daten der Spieler (Art. 6 Abs. 1 lit. f DSGVO).
      </LegalSection>

      <LegalSection title="14. Eindeutigkeitsprüfungen & Hilfe-Anfragen">
        Bei der Registrierung und der Mannschaftsanmeldung prüft das System, ob ein Spieler bereits
        mit einem Konto verknüpft ist, ob eine Mannschaft bereits einen Kapitän hat oder bereits für
        die Saison gemeldet wurde, um versehentliche Doppelanlagen zu vermeiden. Forderst du das
        Zurücksetzen einer bestehenden Verknüpfung oder Hilfe bei vergessenen Zugangsdaten
        (z. B. unbekannte E-Mail-Adresse) an, werden dein Name und – sofern angegeben – deine
        E-Mail-Adresse zu diesem Zweck per E-Mail an die Ligaleitung übermittelt. Rechtsgrundlage:
        Vertrag/Nutzung bzw. berechtigtes Interesse (Art. 6 Abs. 1 lit. b/f DSGVO).
      </LegalSection>

      <LegalSection title="15. Rechte der betroffenen Personen">
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
        Verarbeitung, Datenübertragbarkeit und Widerspruch. Erteilte Einwilligungen können Sie
        jederzeit mit Wirkung für die Zukunft widerrufen. Zur Wahrnehmung Ihrer Rechte wenden Sie
        sich an: kontakt@mdudarts.de.<br /><br />
        Zudem besteht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde. Die für uns
        zuständige Behörde ist das <strong>Bayerische Landesamt für Datenschutzaufsicht (BayLDA)</strong>,
        Promenade 27, 91522 Ansbach (www.lda.bayern.de). Sie können sich aber auch an die
        Aufsichtsbehörde Ihres üblichen Aufenthaltsorts wenden.
      </LegalSection>

      <LegalSection title="16. Server-Logs">
        Zur Sicherstellung des Betriebs werden Server-Logfiles automatisch erfasst und nach den
        Vorgaben der eingesetzten Anbieter (Vercel, Cloudflare, Supabase) gespeichert.
      </LegalSection>

      <LegalSection title="17. Keine automatisierte Entscheidungsfindung">
        Eine ausschließlich automatisierte Entscheidungsfindung mit rechtlicher Wirkung oder
        vergleichbar erheblicher Beeinträchtigung im Sinne des Art. 22 DSGVO findet nicht statt.
        Die automatische Texterkennung der Spielberichte (Ziffer 8) dient lediglich der
        Vorerfassung; das Ergebnis wird stets von einer berechtigten Person geprüft und bestätigt.
      </LegalSection>

      <LegalSection title="18. Minderjährige">
        Personen unter 16 Jahren dürfen ein Benutzerkonto nur mit Einwilligung der
        Erziehungsberechtigten anlegen. Beruht eine Verarbeitung auf einer Einwilligung
        (insb. die Veröffentlichung von Profilbild oder Spitzname nach Ziffer 6), ist diese bei
        Minderjährigen unter 16 Jahren durch die Erziehungsberechtigten zu erteilen bzw. zu
        bestätigen (Art. 8 DSGVO). Erlangen wir Kenntnis, dass Daten einer minderjährigen Person
        ohne die erforderliche Einwilligung verarbeitet werden, löschen wir diese auf Hinweis
        unverzüglich.
      </LegalSection>
    </LegalPage>
  );
}
