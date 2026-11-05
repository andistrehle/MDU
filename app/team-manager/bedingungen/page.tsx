import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalSection } from '@/components/mdu/legal-page';
import { ANBIETER, PREISE, TESTTAGE, euroText } from '@/lib/premium';

// Abo-Bedingungen + Widerrufsbelehrung für den Team Manager (Betreiber, 05.11.2026:
// „mach du das“). Verkäufer = Betreiber privat, nicht die MDU. Muster-Belehrung nach
// Anlage 1 zu Art. 246a § 1 Abs. 2 EGBGB (Dienstleistung), Muster-Formular nach Anlage 2.
// Inhaltliche Änderungen nur auf Anweisung — und vorher anwaltlich prüfen lassen.

export const metadata: Metadata = {
  title: 'Team Manager – Bedingungen und Widerruf',
  description: 'Bedingungen, Preise, Kündigung und Widerrufsbelehrung für den Team Manager.',
};

const link = { color: 'var(--th-accent)', textDecoration: 'underline' } as const;

export default function TeamManagerBedingungen() {
  return (
    <LegalPage title="Team Manager – Bedingungen" updated="November 2026" notice={null}>
      <LegalSection title="1. Anbieter">
        Vertragspartner für den Team Manager ist {ANBIETER.name}, {ANBIETER.anschrift}, E-Mail {ANBIETER.email} –
        nicht die Münchner Dart Union. Die übrige Plattform (Spielpläne, Tabellen, Spielberichte) bleibt kostenlos.
      </LegalSection>

      <LegalSection title="2. Leistung">
        Der Team Manager ist eine Zusatzfunktion der Plattform mdudarts.de für ein Team der Münchner Dart Union:
        Zu- und Absagen, Aufstellung, eigene Termine, Benachrichtigungen ans Team, Teamkasse, Gegneranalyse und
        Statistik. Er gilt für das ganze Team; alle Spieler mit Konto im Team können ihn nutzen. Wir bemühen uns um
        eine ständige Erreichbarkeit, kurze Unterbrechungen (z. B. Wartung, Störungen bei Dienstleistern) sind
        aber möglich.
      </LegalSection>

      <LegalSection title="3. Vertragsschluss">
        Bestellen kann der Teamcaptain oder ein Co-Captain mit dem Recht „Team Manager“ für sein Team unter
        Mein Bereich → „Team Manager holen“. Mit dem Abschluss der Zahlung bei PayPal bzw. der Meldung
        „ich habe überwiesen“ gibt er ein verbindliches Angebot ab; der Vertrag kommt zustande, sobald der Team
        Manager freigeschaltet wird.
      </LegalSection>

      <LegalSection title="4. Kostenloser Test">
        Jedes Team kann den Team Manager einmal {TESTTAGE} Tage kostenlos testen. Der Test beginnt mit dem Klick auf
        „{TESTTAGE} Tage gratis testen“ und endet von selbst. Es entsteht kein Abo und keine Zahlungspflicht.
      </LegalSection>

      <LegalSection title="5. Preise und Laufzeit">
        Alle Preise sind Endpreise und gelten für das ganze Team.<br />
        <b>Saisonpass:</b> {euroText(PREISE.saison.cents)} einmalig, gilt ab Freischaltung bis 31.05.2027 und endet dann
        von selbst – ohne Verlängerung und ohne Kündigung.<br />
        <b>Monatlich:</b> {euroText(PREISE.monat.cents)} pro Monat, im Voraus. Der Vertrag läuft jeweils einen Monat und
        verlängert sich um einen weiteren Monat, wenn er nicht gekündigt wird.
      </LegalSection>

      <LegalSection title="6. Zahlung">
        Bezahlt wird per PayPal (auch Kreditkarte über PayPal) oder per Überweisung. Beim Monatsabo bucht PayPal den
        Betrag jeden Monat ab. Bei Überweisung wird der Team Manager nach Zahlungseingang freigeschaltet.
      </LegalSection>

      <LegalSection title="7. Kündigung">
        Das Monatsabo kannst du jederzeit zum Ende des bezahlten Monats kündigen – unter „Team Manager holen“
        („Abo kündigen“), in deinem PayPal-Konto oder ohne Anmeldung über{' '}
        <Link href="/team-manager/kuendigen" style={link}>Verträge hier kündigen</Link>. Bis zum Ende des bezahlten
        Monats läuft der Team Manager weiter. Der Saisonpass endet von selbst und muss nicht gekündigt werden.
      </LegalSection>

      <LegalSection title="8. Nach dem Ende">
        Endet Test, Saisonpass oder Abo, wird der Team Manager für das Team gesperrt. Eingetragene Daten bleiben
        erhalten und sind nach einer Verlängerung wieder da; auf Wunsch löschen wir sie (siehe{' '}
        <Link href="/datenschutz" style={link}>Datenschutz</Link>, Ziffer 20).
      </LegalSection>

      <LegalSection title="9. Haftung">
        Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie für Schäden aus der Verletzung von Leben,
        Körper oder Gesundheit. Bei leichter Fahrlässigkeit haften wir nur für die Verletzung wesentlicher
        Vertragspflichten und begrenzt auf den vorhersehbaren, vertragstypischen Schaden. Die Haftung nach dem
        Produkthaftungsgesetz bleibt unberührt.
      </LegalSection>

      <LegalSection title="10. Schlussbestimmungen">
        Es gilt deutsches Recht; gegenüber Verbrauchern nur, soweit dadurch nicht der Schutz zwingender Vorschriften
        des Staates entzogen wird, in dem sie ihren gewöhnlichen Aufenthalt haben. An einem Streitbeilegungsverfahren
        vor einer Verbraucherschlichtungsstelle nehmen wir nicht teil.
      </LegalSection>

      <div id="widerruf" style={{ scrollMarginTop: 90 }} />
      <LegalSection title="Widerrufsbelehrung">
        <b>Widerrufsrecht</b><br />
        Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die
        Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.<br /><br />
        Um dein Widerrufsrecht auszuüben, musst du uns ({ANBIETER.name}, {ANBIETER.anschrift}, E-Mail {ANBIETER.email})
        mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über deinen
        Entschluss, diesen Vertrag zu widerrufen, informieren. Du kannst dafür das unten stehende Muster-Widerrufsformular
        verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass du die
        Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.<br /><br />
        <b>Folgen des Widerrufs</b><br />
        Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und
        spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf dieses
        Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der
        ursprünglichen Transaktion eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas anderes vereinbart; in
        keinem Fall werden dir wegen dieser Rückzahlung Entgelte berechnet.<br /><br />
        Hast du verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so hast du uns einen
        angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem du uns von der Ausübung des
        Widerrufsrechts hinsichtlich dieses Vertrags unterrichtest, bereits erbrachten Dienstleistungen im Vergleich zum
        Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
      </LegalSection>

      <LegalSection title="Muster-Widerrufsformular">
        (Wenn du den Vertrag widerrufen willst, dann fülle bitte dieses Formular aus und sende es zurück.)<br /><br />
        – An {ANBIETER.name}, {ANBIETER.anschrift}, E-Mail {ANBIETER.email}:<br />
        – Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden
        Dienstleistung: Team Manager für das Team ____________<br />
        – Bestellt am (*) ____________<br />
        – Name des/der Verbraucher(s) ____________<br />
        – Anschrift des/der Verbraucher(s) ____________<br />
        – Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier) ____________<br />
        – Datum ____________<br /><br />
        (*) Unzutreffendes streichen.
      </LegalSection>
    </LegalPage>
  );
}
