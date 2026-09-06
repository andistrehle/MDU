// ============================================================
// MDC — Datenschutzhinweise
// ============================================================
//
// Beschrieben ist, was diese Seite TATSÄCHLICH tut. Für Besucher ist sie eine
// reine Leseseite: keine Anmeldung, kein Formular, keine Cookies, kein lokaler
// Speicher, keine Inhalte von fremden Servern. Was sie dagegen sehr wohl tut:
// Namen echter Personen samt Ergebnissen veröffentlichen — genau das ist der
// erklärungsbedürftige Teil und steht deshalb weit oben.
//
// Dazu kommt seit dem Ergebnis-Upload ein zweiter erklärungsbedürftiger Teil:
// ein passwortgeschützter Bereich, in dem der Zettel fotografiert und gelesen
// wird (Ziffer 9). Wird an diesem Ablauf etwas geändert — ein anderer
// Erkennungsdienst, ein Zwischenspeicher für die Fotos, eine Datenbank —, MUSS
// dieser Text mitgeändert werden. Er beschreibt keinen Wunschzustand.
//
// Die Anbieterangaben kommen aus `data/mdc-legal.ts`.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/mdc/ui';
import { LegalPage, LegalSection, LegalGapNotice } from '@/components/mdc/legal';
import { MDC_LEGAL, MDC_LEGAL_COMPLETE, legal } from '@/data/mdc-legal';
import { FINAL_SEASON } from '@/data/season';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  title: 'Datenschutz',
  description:
    'Datenschutzhinweise der Munich Darts Challenge: welche Daten veröffentlicht werden, ' +
    'auf welcher Grundlage, wie lange — und wie man widerspricht.',
};

export default function DatenschutzPage() {
  const { operator, representedBy, street, zipCity, email, updated } = MDC_LEGAL;
  const kontakt = email
    ? <a href={`mailto:${email}`}>{email}</a>
    : '[E-Mail-Adresse]';

  return (
    <>
      <PageHero
        kicker="Rechtliches"
        title="Datenschutz"
        description={`Stand: ${updated}`}
      />

      <LegalPage>
        {!MDC_LEGAL_COMPLETE && (
          <LegalGapNotice>
            <strong>Noch unvollständig.</strong> Die Angaben zur verantwortlichen Stelle
            fehlen (eckige Klammern) und müssen in <code>data/mdc-legal.ts</code> eingetragen
            werden. Bis dahin bleibt die Seite für Suchmaschinen gesperrt.
          </LegalGapNotice>
        )}

        <LegalSection title="1. Verantwortliche Stelle">
          Verantwortlich für die Datenverarbeitung auf dieser Website ist{' '}
          {legal(operator, 'Anbieter der Seite')}
          {representedBy && <>, vertreten durch {representedBy}</>}.<br />
          {legal(street, 'Straße und Hausnummer')} · {legal(zipCity, 'PLZ und Ort')}<br />
          E-Mail (auch für Auskunft und Widerspruch): {kontakt}
        </LegalSection>

        <LegalSection title="2. Was diese Seite veröffentlicht">
          Die Munich Darts Challenge ist eine Ranglistenserie. Veröffentlicht werden deshalb
          je Spielerin und Spieler: <strong>Vor- und Nachname</strong> (bzw. der in der Serie
          geführte Spielername), die <strong>MDC-Passnummer</strong>, die{' '}
          <strong>Anzahl der Turnierteilnahmen</strong>, die erreichten{' '}
          <strong>Punkte, Platzierungen und der Punkteschnitt</strong> sowie am Saisonende der
          Anteil an der Ausschüttung. Dazu die einzelnen Turnierergebnisse: Datum, Spielort,
          Feldgröße, Platzierung und Punkte.
          <br /><br />
          Ebenfalls veröffentlicht wird ein Spitzname, sofern er in der Auswertung als Teil des
          Namens geführt wird (etwa {'„Chriss (Bonsai)“'}). Das ist genau die Schreibweise, unter
          der die Serie die Person seit jeher führt.
        </LegalSection>

        <LegalSection title="3. Was diese Seite NICHT veröffentlicht">
          Keine Fotos, keine Geburtsdaten, keine Anschriften, keine Telefonnummern, keine
          E-Mail-Adressen von Spielerinnen und Spielern. Statt Bildern zeigt die Seite
          Platzhalter aus den Initialen. Auch die Telefonnummern der Spielorte stehen nicht
          öffentlich, solange die Lokale dem nicht zugestimmt haben.
        </LegalSection>

        <LegalSection title="4. Woher die Daten stammen">
          Ausschließlich aus der Auswertung der Turnierserie selbst: aus den
          Ergebnislisten, die in den Lokalen ausgefüllt werden, und aus der Arbeitsmappe, mit
          der die Serie ihre Ranglisten führt. Es werden keine Daten aus anderen Quellen
          zugekauft, zusammengeführt oder aus sozialen Netzwerken ergänzt. Eine Verknüpfung mit
          dem Spielerbestand der Münchner Dart Union findet nicht statt; beide Serien führen
          eigene Passnummern.
        </LegalSection>

        <LegalSection title="5. Rechtsgrundlage">
          Die Veröffentlichung erfolgt auf Grundlage des berechtigten Interesses
          (Art. 6 Abs. 1 lit. f DSGVO). Das berechtigte Interesse besteht darin, den
          Spielbetrieb einer offenen Turnierserie nachvollziehbar zu machen: Wer Punkte sammelt,
          muss die Wertung prüfen können, und die Ausschüttung am Saisonende muss für alle
          Beteiligten nachrechenbar sein. Genau dafür ist die Rangliste da — ohne Namen und
          Punktestände gäbe es sie nicht.
          <br /><br />
          Berücksichtigt wurde dabei, dass die Teilnahme freiwillig ist, dass ausschließlich
          Daten aus dem sportlichen Wettbewerb veröffentlicht werden und dass die Rangliste
          ohnehin in den Lokalen aushängt. Auf besonders schützenswerte Angaben
          (Art. 9 DSGVO) wird vollständig verzichtet.
        </LegalSection>

        <LegalSection title="6. Widerspruchsrecht">
          Jede betroffene Person kann der Veröffentlichung ihrer Daten jederzeit widersprechen
          (Art. 21 DSGVO) — formlos per E-Mail an {kontakt}, ohne Angabe von Gründen. Nach einem
          Widerspruch wird der Name aus den Ranglisten und Ergebnislisten dieser Seite entfernt.
          Die sportliche Wertung der Serie selbst bleibt davon unberührt; sie wird außerhalb
          dieser Website geführt.
        </LegalSection>

        <LegalSection title="7. Domain und Hosting">
          Die Domain ist über die Strato AG registriert; gehostet wird die Seite bei der
          Vercel Inc. Beim Aufruf verarbeitet der Hoster technisch notwendige Daten in
          Server-Logs (IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browsertyp und
          -version, übertragene Datenmenge). Das dient der Auslieferung, der Stabilität und
          der Abwehr von Angriffen. Rechtsgrundlage ist das berechtigte Interesse
          (Art. 6 Abs. 1 lit. f DSGVO). Mit dem Anbieter besteht ein Vertrag zur
          Auftragsverarbeitung (Art. 28 DSGVO); soweit Daten in die USA übermittelt werden,
          geschieht das auf Grundlage geeigneter Garantien (EU-Standardvertragsklauseln bzw.
          EU-US Data Privacy Framework). Die Logs werden von dort nach kurzer Zeit gelöscht;
          eine Zusammenführung mit den Ranglistendaten findet nicht statt.
        </LegalSection>

        <LegalSection title="8. Keine Anmeldung, keine Cookies">
          Für Besucherinnen und Besucher ist diese Seite eine reine Leseseite: Es gibt kein
          Benutzerkonto, kein Formular und keinen Warenkorb. Sie setzt{' '}
          <strong>keine Cookies</strong> und legt nichts im lokalen Speicher des Browsers ab.
          Auch eine Einwilligungsabfrage (Cookie-Banner) ist deshalb nicht nötig — es gibt
          nichts einzuwilligen.
          <br /><br />
          Einen geschlossenen Bereich gibt es dennoch: Die Turnierverwaltung, über die
          Ergebnisse eingetragen werden (Ziffer 9). Sie ist mit einem Passwort gesichert und
          nur den Personen zugänglich, die die Serie organisieren. Auch dieser Bereich kommt
          ohne Cookie aus — er nutzt die Passwortabfrage des Browsers.
        </LegalSection>

        <LegalSection title="9. Ergebnisse vom Zettel">
          Am Ende eines Turnierabends wird die handgeschriebene Ergebnisliste fotografiert und
          in der Turnierverwaltung hochgeladen. Was dabei passiert:
          <br /><br />
          <strong>Das Foto</strong> wird an den Anbieter{' '}
          <strong>Anthropic PBC</strong> übermittelt, der die Liste liest (Platzierungen und
          Namen). Dort wird es nur für diesen einen Vorgang verarbeitet und weder gespeichert
          noch zum Training von Modellen verwendet. Auf dieser Seite wird das Foto ebenfalls
          nicht gespeichert — es verlässt den Browser nur für die Erkennung und ist danach weg.
          <br /><br />
          <strong>Übernommen</strong> wird ausschließlich, was eine Person danach am Bildschirm
          geprüft und freigegeben hat: Platzierung, MDC-Passnummer und die daraus gerechneten
          Punkte. Namen werden dabei nicht aus dem Foto übernommen, sondern der bestehenden
          Spielerliste zugeordnet. Nichts geht ungeprüft online.
          <br /><br />
          <strong>Abgelegt</strong> werden diese Zeilen im Quellcode-Speicher der Seite bei der{' '}
          <strong>GitHub, Inc.</strong> — dort liegt die Seite ohnehin. Eine Datenbank gibt es
          nicht. Rechtsgrundlage ist wie für die Veröffentlichung selbst das berechtigte
          Interesse (Art. 6 Abs. 1 lit. f DSGVO, Ziffer 5). Mit beiden Anbietern bestehen die
          erforderlichen Vereinbarungen zur Auftragsverarbeitung (Art. 28 DSGVO); soweit Daten
          in die USA übermittelt werden, geschieht das auf Grundlage geeigneter Garantien.
          <br /><br />
          Wer der Veröffentlichung widersprochen hat (Ziffer 6), wird auch auf diesem Weg nicht
          aufgenommen.
        </LegalSection>

        <LegalSection title="10. Reichweitenmessung">
          Sofern beim Hoster (Vercel) die Funktion {'„Web Analytics“'} aktiviert ist, werden
          Seitenaufrufe anonym gezählt. Diese Messung arbeitet <strong>ohne Cookies</strong>,
          ohne geräteübergreifende Wiedererkennung und ohne Profilbildung; die IP-Adresse wird
          dabei nicht gespeichert. Rechtsgrundlage ist das berechtigte Interesse an einer
          groben Nutzungsstatistik (Art. 6 Abs. 1 lit. f DSGVO). Ist die Funktion nicht
          aktiviert, findet gar keine Messung statt.
        </LegalSection>

        <LegalSection title="11. Schriften und externe Inhalte">
          Die verwendeten Schriften werden vom eigenen Server ausgeliefert; beim Seitenaufruf
          entsteht <strong>keine Verbindung zu Google Fonts</strong> oder anderen
          Fremdservern. Karten werden nicht eingebettet — der Verweis auf einen Kartendienst
          öffnet sich erst nach ausdrücklichem Klick, und erst dann gelten die
          Datenschutzbestimmungen des jeweiligen Anbieters. Dasselbe gilt für den Verweis auf
          die Facebook-Gruppe der Serie: Das ist ein <strong>gewöhnlicher Link</strong>, keine
          Einbettung — solange niemand darauf klickt, wird nichts von Facebook geladen und
          erfährt Facebook nichts vom Seitenaufruf. Wer klickt, verlässt diese Seite; ab dann
          gilt die Datenschutzerklärung von Meta. Zählpixel, Werbenetzwerke und
          Schaltflächen sozialer Netzwerke (Like-Buttons und dergleichen) gibt es hier nicht.
        </LegalSection>

        <LegalSection title="12. Kontaktaufnahme">
          Wer per E-Mail schreibt, dessen Adresse und Nachricht werden ausschließlich zur
          Bearbeitung des Anliegens verarbeitet (Art. 6 Abs. 1 lit. f DSGVO, bei
          vertragsähnlichen Anliegen lit. b). Die Nachrichten werden gelöscht, sobald sie
          erledigt sind und keine gesetzlichen Aufbewahrungsfristen entgegenstehen.
        </LegalSection>

        <LegalSection title="13. Speicherdauer">
          Ranglisten und Turnierergebnisse bleiben dauerhaft abrufbar, auch als Archiv
          abgeschlossener Saisons (derzeit die Saison {FINAL_SEASON.label}) — eine Rangliste,
          die nach Saisonende verschwindet, verlöre ihren Zweck. Nach einem Widerspruch
          (Ziffer 6) wird die betroffene Person entfernt. Server-Logs löscht der Hoster nach
          kurzer Zeit; E-Mails werden nach Erledigung gelöscht.
        </LegalSection>

        <LegalSection title="14. Rechte der betroffenen Personen">
          Es bestehen die Rechte auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung
          (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20)
          und Widerspruch (Art. 21 DSGVO). Zur Wahrnehmung genügt eine E-Mail an {kontakt}.
          <br /><br />
          Außerdem besteht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde.
          Zuständig ist das <strong>Bayerische Landesamt für Datenschutzaufsicht (BayLDA)</strong>,
          Promenade 27, 91522 Ansbach (www.lda.bayern.de); man kann sich aber auch an die
          Behörde des eigenen Aufenthaltsorts wenden.
        </LegalSection>

        <LegalSection title="15. Keine automatisierte Entscheidungsfindung">
          Eine automatisierte Entscheidungsfindung mit rechtlicher Wirkung im Sinne des
          Art. 22 DSGVO findet nicht statt. Punkte und Plätze ergeben sich aus dem
          veröffentlichten Punkteschlüssel und dem sportlichen Ergebnis; die Auswertung führt
          der Betreiber der Serie.
        </LegalSection>

        <LegalSection title="16. Minderjährige">
          Nehmen Minderjährige am Spielbetrieb teil, gelten für die Veröffentlichung ihrer
          Ergebnisse dieselben Grundsätze; ein Widerspruch (Ziffer 6) kann durch die
          Erziehungsberechtigten erklärt werden und wird ohne Rückfrage umgesetzt.
        </LegalSection>

        <LegalSection title="17. Änderungen dieser Hinweise">
          Ändert sich etwas an der Seite oder an den eingesetzten Diensten, werden diese
          Hinweise angepasst. Es gilt jeweils die hier veröffentlichte Fassung; der Stand steht
          oben. Die Anbieterangaben stehen im{' '}
          <Link href={mdcPath('/impressum')}>Impressum</Link>.
        </LegalSection>
      </LegalPage>
    </>
  );
}
