import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/mdu/legal-page';

export const metadata: Metadata = {
  title: 'Spielbedingungen · Münchner Dart Union',
  description: 'Offizielle Spielbedingungen und Ligaordnung der Münchner Dart Union (MDU).',
};

export default function SpielbedingungenPage() {
  return (
    <LegalPage
      title="Spielbedingungen"
      updated="Saison 2026/2027"
      notice={
        <>
          Diese Spielbedingungen sind die offizielle Liga- und Spielordnung der Münchner Dart Union und
          für alle gemeldeten Mannschaften und Spieler verbindlich. Mit der Mannschaftsmeldung erkennen
          Teamkapitäne und Spieler diese Bedingungen an. Sie ersetzen alle vorherigen Fassungen.
        </>
      }
    >
      <LegalSection title="1. Geltung & Grundsatz">
        Wir wollen faire, gut organisierte und für alle nachvollziehbare Ligaspiele. Diese Spielbedingungen
        regeln Teilnahme, Ablauf und Auswertung im Spielbetrieb der MDU. Sie gelten für alle Spielklassen
        (La&nbsp;Liga, A&nbsp;Liga, B&nbsp;Liga, C&nbsp;Liga) und sind, ergänzt um die jeweils aktuellen
        Aushänge und Mitteilungen der Ligaleitung, maßgeblich. Im Zweifel entscheidet die Ligaleitung.
      </LegalSection>

      <LegalSection title="2. Spielklassen & Spielvarianten">
        Gespielt wird je Spielklasse in folgender Variante – jeweils <strong>ohne Rundenbegrenzung</strong>:
        <ul style={ul}>
          <li><strong>C&nbsp;Liga:</strong> 301 Master Out</li>
          <li><strong>B&nbsp;Liga:</strong> 501 Master Out</li>
          <li><strong>A&nbsp;Liga:</strong> 501 Double Out</li>
          <li><strong>La&nbsp;Liga:</strong> 501 Double Out</li>
        </ul>
        Jede Einzelpartie wird auf zwei Gewinn-Legs (Best of Three) gespielt; in der La&nbsp;Liga auf drei
        Gewinn-Legs (Best of Five). Vor jedem Leg ist sicherzustellen, dass das Sportgerät mit der korrekten
        Variante und Option gestartet wurde. Wird eine falsche Einstellung bemerkt, wird sofort abgebrochen
        und wiederholt.
      </LegalSection>

      <LegalSection title="3. Mannschaftsmeldung">
        <ol style={ol}>
          <li>Die Mannschaftsmeldung erfolgt über den Mitgliederbereich der MDU-Plattform
            („Mein&nbsp;Bereich → Mannschaft anmelden"). Eine Mannschaft besteht aus <strong>mindestens vier
            Spielern</strong>.</li>
          <li>Eine Meldung gilt erst als vollständig, wenn Startgeld, Lichtbilder sowie der Unkostenbeitrag
            der Spieler vorliegen bzw. nachgewiesen sind. Unvollständige Meldungen werden für die laufende
            Saison nicht zugelassen.</li>
          <li>Die Einstufung in die Spielklasse richtet sich nach der Spielstärke der gemeldeten Spieler.
            Bestehende Mannschaften werden anhand der Ergebnisse der Vorsaison (Auf-/Abstieg) vorbestimmt;
            meldet eine Mannschaft sich für eine niedrigere Klasse als vorgesehen, kann die Ligaleitung die
            Meldung ablehnen.</li>
          <li>Die endgültige Staffel-Einteilung (z.&nbsp;B. B1/B2) nimmt die Ligaleitung nach Eingang aller
            Meldungen vor – ausgewogen nach Spielstärke und Spielstätten.</li>
          <li>Je Mannschaft gibt es genau einen Teamkapitän (TC). Eine Mannschaft kann pro Saison nur einmal
            gemeldet werden.</li>
        </ol>
      </LegalSection>

      <LegalSection title="4. Spielerqualifikation">
        <ol style={ol}>
          <li>Grundvoraussetzung für die Teilnahme am Spielbetrieb ist die Mitgliedschaft in der MDU.</li>
          <li>Ein Spieler darf in einer Saison nur für die Mannschaft spielen, für die er gemeldet ist.</li>
          <li>Ein Wechsel der Mannschaft während der laufenden Saison ist nicht möglich, sondern erst zur
            darauffolgenden Saison.</li>
          <li>Werden während der Saison so viele höherklassige Spieler nachgemeldet, dass die Mannschaft in
            ihrer Klasse nicht mehr spielberechtigt wäre, werden diese Spieler für die komplette Saison
            gesperrt.</li>
        </ol>
      </LegalSection>

      <LegalSection title="5. Nachmeldungen">
        Nachmeldungen sind unter Angabe von Name, Datum, Adresse und Unterschrift möglich (Antrag auf
        Spielerpass über die Plattform bzw. bei der Ligaleitung).
        <ul style={ul}>
          <li>Passbild und Antrag müssen innerhalb von <strong>7&nbsp;Tagen</strong> bei der Ligaleitung /
            beim Sportwart eingegangen sein.</li>
          <li>Gleichzeitig ist der Unkostenbeitrag auf das Konto der MDU zu überweisen.</li>
          <li>Ein nachgemeldeter Spieler darf <strong>ein</strong> Ligaspiel ohne Ligaausweis bestreiten, muss
            sich dabei aber mit einem amtlichen Lichtbildausweis ausweisen.</li>
          <li>Ab dem zweiten Spieltag ist der Spieler nur mit gültigem Ligaausweis spielberechtigt.</li>
          <li>Gehen Unkostenbeitrag oder Passbild nicht innerhalb von 7&nbsp;Tagen ein bzw. werden nicht
            bezahlt, werden die betroffenen Spiele rückwirkend als verloren gewertet.</li>
          <li>Für die <strong>letzten zwei Spieltage</strong> der laufenden Saison ist keine Nachmeldung mehr
            möglich.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Sportgeräte & Maße">
        <ol style={ol}>
          <li>Gespielt wird ausschließlich an den für den Ligabetrieb zugelassenen Sportgeräten.
            Bull-Shooter-Automaten sind nicht zugelassen.</li>
          <li>Eigene Darts sind erlaubt, sofern sie elastische Kunststoffspitzen (Soft-Tip) haben und ein
            Gesamtgewicht von <strong>22&nbsp;Gramm pro Pfeil</strong> (inkl. Schaft &amp; Spitze) nicht
            überschreiten.</li>
          <li>Die Abwurflinie ist mit ihrer dem Spieler zugewandten Kante in <strong>2,37&nbsp;m</strong>
            (parallel zum Board) anzubringen; zwischen Gerät und Boden muss ein Winkel von 90°&nbsp;bestehen.
            Maßgeblich ist im Zweifel (z.&nbsp;B. unebener Boden) das Diagonalmaß: Bei einer Höhe des Bull&apos;s
            Eye von <strong>1,73&nbsp;m</strong> ergibt sich ein Diagonalmaß von <strong>2,93&nbsp;m</strong>.</li>
          <li>Korrekturen sind vor Spielbeginn vorzunehmen; nachträgliche Reklamationen werden nicht
            berücksichtigt. Das Board ist ausreichend zu beleuchten und vor Spielbeginn von abgebrochenen
            Spitzen zu säubern.</li>
        </ol>
      </LegalSection>

      <LegalSection title="7. Termine & Spielverlegungen">
        <ol style={ol}>
          <li>Spieltermine sind verbindlich. Verlegungen sind nur im beiderseitigen Einvernehmen und nur
            schriftlich durch beide Teamkapitäne möglich.</li>
          <li>Die Ligaleitung / der Sportwart ist über Verlegungen und Absagen <strong>mindestens
            24&nbsp;Stunden vor Spielbeginn</strong> von beiden TCs schriftlich (z.&nbsp;B. per E-Mail oder
            Nachricht) zu informieren. Ein abgesagtes Spiel ist in der darauffolgenden Woche nachzuholen.</li>
          <li>Bei Unstimmigkeiten gilt der Fixtermin aus dem Masterplan.</li>
          <li>Spiele dürfen vorverlegt werden – auch die der letzten beiden Spieltage.</li>
          <li>Je Hin- und Rückrunde dürfen höchstens <strong>drei</strong> Spiele verlegt werden.</li>
        </ol>
      </LegalSection>

      <LegalSection title="8. Spielvoraussetzungen">
        <ol style={ol}>
          <li>Es besteht Trikotpflicht: Die Mannschaft spielt in einem einheitlichen Oberteil. Der Aufdruck
            soll die Zusammengehörigkeit widerspiegeln und darf nicht diffamierend sein.</li>
          <li>Gespielt wird gemäß Spielplan in der Reihenfolge <strong>8 Einzel · 2 Doppel · 8 Einzel</strong>
            (Doppel auf Position&nbsp;9 und&nbsp;18). Jeder Spieler darf nur einmal auf einer Einzelposition
            stehen.</li>
          <li>Vor Spielbeginn ist der Spielbericht spielfertig auszufüllen. Es dürfen nur Spieler mit gültigem
            Spielerpass für das jeweilige Team antreten (Ausnahme: Nachmeldung). Die Pässe sind zu Beginn von
            beiden TCs zu kontrollieren.</li>
        </ol>
      </LegalSection>

      <LegalSection title="9. Auf- & Auswechslungen">
        Es können bis zu zwei Ersatzspieler gegen zwei eingetragene Spieler ausgewechselt werden. Das
        Auswechseln ist jederzeit möglich, jedoch nicht im Verlauf einer laufenden Paarung. Eingetragene
        Spielpositionen sind verbindlich; auch Ersatzspieler bleiben fest an ihre Position gebunden. Ein
        ausgewechselter Spieler darf später – aber nur auf derselben Position – wieder eingewechselt werden;
        ein Spielerwechsel ist direkt im Spielbericht zu vermerken.
      </LegalSection>

      <LegalSection title="10. Spielaufruf & Verhalten am Board">
        <ol style={ol}>
          <li>Jede Paarung wird einzeln aufgerufen; der aufgerufene Spieler hat sich unverzüglich an der
            Abwurflinie einzufinden. Beide TCs prüfen anhand des Spielberichts die korrekte Paarung.</li>
          <li>Erscheint ein Spieler nach einem letztmaligen Aufruf durch beide TCs nicht an der Wurflinie, ist
            das Spiel mit <strong>0:2</strong> verloren. Während einer laufenden Partie darf der Bereich der
            Abwurflinie nicht verlassen werden.</li>
          <li>Anwurf: Der Spieler des Gastteams beginnt; das zweite Leg beginnt das Heimteam. Ist ein
            Entscheidungsleg nötig, wird der Anwurf per Wurf auf das Bull&apos;s Eye ermittelt (Darts müssen
            stecken bleiben); es beginnt, wer näher am Bull&apos;s Eye liegt. Bei Gleichstand wird wiederholt.</li>
          <li>Am Board gilt absolutes Rauchverbot. Mobiltelefone sind während des Spiels möglichst lautlos zu
            schalten oder auszuschalten; am Board besteht Handyverbot.</li>
        </ol>
      </LegalSection>

      <LegalSection title="11. Spielbeginn">
        <ol style={ol}>
          <li>15&nbsp;Minuten vor dem offiziellen Spielbeginn sind die Sportgeräte für die Gastmannschaft
            reserviert.</li>
          <li>Sind bis spätestens 30&nbsp;Minuten nach der offiziellen Startzeit nicht mindestens drei Spieler
            einer Mannschaft angetreten, ist das Spiel mit <strong>0:3 Punkten / 0:18 Sätzen</strong> verloren
            (siehe Nichtantritt). Nur höhere Gewalt rechtfertigt eine Ausnahme.</li>
          <li>Sind drei Spieler anwesend, dürfen dennoch bis zu sechs Spieler eingetragen werden. Jedem
            eingetragenen, bei Spielbeginn noch nicht anwesenden Spieler ist das Bestreiten seiner noch nicht
            aufgerufenen Partie zu ermöglichen.</li>
        </ol>
      </LegalSection>

      <LegalSection title="12. Spielablauf">
        <ol style={ol}>
          <li>Die Abwurflinie darf während des Wurfes nicht überschritten werden; ein Beugen darüber sowie ein
            Abwurf seitlich in gedachter Verlängerung der Linie sind erlaubt.</li>
          <li>Alle drei Darts müssen in Richtung der Scheibe geworfen werden und gelten als „geworfen" –
            unabhängig davon, ob sie gewertet wurden oder von der Scheibe fallen. Nachdrücken oder Nachwerfen
            ist nicht gestattet (Ausnahme: Wurf auf das Bull&apos;s Eye).</li>
          <li>Jeder Spieler achtet vor dem Wurf darauf, dass das Sportgerät seine Spielernummer anzeigt, und
            akzeptiert die angezeigte Punktzahl. Können sich die Spieler im Zweifel nicht einigen, entscheiden
            die TCs.</li>
          <li>Verändert ein Spieler den eigenen oder den gegnerischen Punktestand, hat er das Leg verloren.</li>
          <li>Als Fouls gelten u.&nbsp;a.: ablenkendes Verhalten während des Wurfs, ständiges Übertreten der
            Wurflinie, absichtliches Verzögern, Missbrauch des Sportgeräts sowie unehrenhaftes oder
            unsportliches Verhalten. Fouls können von den TCs geahndet werden.</li>
          <li>Zeigt ein Gerät fortlaufend falsche Punkte an, ist die Partie abzubrechen und ggf. an einem
            Zweitgerät fortzusetzen. Stehen mehrere Automaten zur Verfügung, ist an zwei Automaten zu spielen –
            Ausnahme: beide Teams sind mit einem Automaten einverstanden oder der zweite ist defekt.</li>
        </ol>
      </LegalSection>

      <LegalSection title="13. Spielende, Spielbericht & Ergebnismeldung">
        <ol style={ol}>
          <li>Nach der letzten Paarung kontrollieren beide TCs den korrekten Eintrag aller Ergebnisse und
            bestätigen ihn mit ihrer Unterschrift. Ein von beiden TCs unterschriebener Spielbericht ist gültig;
            nachträglicher Protest ist dann nicht mehr möglich.</li>
          <li>Der Spielbericht wird anschließend eigenständig im Login-Bereich der MDU-Plattform
            hochgeladen (Foto/PDF des unterschriebenen Bogens). Bei Problemen kann er ersatzweise per E-Mail
            oder WhatsApp an die Ligaleitung übermittelt werden. Tabellenpunkte, Legs und
            Einzelranglistenpunkte werden vom System automatisch berechnet.</li>
          <li>Geht der Spielbericht nicht binnen <strong>zwei Werktagen</strong> nach beendeter Spielwoche
            (spätestens Dienstag, 24:00&nbsp;Uhr) ein, erhält das Heimteam automatisch eine Niederlage
            (0:3 Punkte / 0:18 Sätze).</li>
        </ol>
        <p style={hint}>
          Eine druckbare Vorlage des offiziellen Spielberichts findest du im Downloadbereich.
        </p>
      </LegalSection>

      <LegalSection title="14. Nichtantritt">
        <ol style={ol}>
          <li>Tritt eine Mannschaft unentschuldigt nicht an, ist das Spiel mit 0:3 Punkten / 0:18 Sätzen
            verloren.</li>
          <li>Dem nicht angetretenen Team werden zusätzlich 3 Punkte in der Tabelle abgezogen.</li>
          <li>Das nicht angetretene Team entrichtet 30,–&nbsp;€ an den Wirt als Entschädigung.</li>
          <li>Eine Mannschaft, die in der laufenden Saison dreimal nicht antritt, wird disqualifiziert und aus
            Tabellen und Einzelwertungen gestrichen.</li>
          <li>Bei Nichtantritt aus unsportlichen Gründen kann eine Mannschaft sofort disqualifiziert werden.</li>
        </ol>
      </LegalSection>

      <LegalSection title="15. Proteste & Streitfragen">
        <ol style={ol}>
          <li>Proteste sind auf dem Spielbericht mit Datum und Unterschrift beider TCs zu vermerken und
            müssen innerhalb von <strong>zwei Werktagen</strong> schriftlich bei der Ligaleitung vorliegen;
            später eingehende Proteste werden nicht mehr bearbeitet.</li>
          <li>Streitfragen, die die Liga betreffen, werden mit der Ligaleitung geklärt; Fragen einzelner Teams
            unter Mitwirkung der jeweiligen TCs.</li>
          <li>Vom Vorstand getroffene Entscheidungen sind nicht anfechtbar.</li>
        </ol>
      </LegalSection>

      <LegalSection title="16. Veröffentlichung & Datenschutz">
        <ol style={ol}>
          <li>Zur Durchführung des Spielbetriebs werden Namen der Spieler in Verbindung mit Mannschaft,
            Ergebnissen, Tabellen und Einzelranglisten veröffentlicht.</li>
          <li>Profilbilder werden standardmäßig auf dem öffentlichen Spielerprofil angezeigt; jeder Spieler
            kann dem jederzeit im eigenen Profil widersprechen. Spitznamen werden nur nach aktiver Einwilligung
            angezeigt.</li>
          <li>Telefonnummern der Teamkapitäne sind – nach Freigabe – ausschließlich für eingeloggte
            Teamkapitäne sichtbar (zur direkten Absprache, z.&nbsp;B. bei Spielverlegungen) und können jederzeit
            im Profil geändert oder entfernt werden. Die öffentlich zugänglichen Telefonnummern der Spielstätten
            werden öffentlich angezeigt.</li>
          <li>Aus diesen Veröffentlichungen bestehen keine Ansprüche auf Entgelt oder Wiedergutmachung.
            Einzelheiten regelt die <a href="/datenschutz" style={link}>Datenschutzerklärung</a> der MDU.</li>
        </ol>
      </LegalSection>

      <LegalSection title="17. Haftung & Schadenersatz">
        Die MDU übernimmt keine Haftung oder Schadenersatzansprüche gegenüber Spielern oder Dritten, denen im
        Zusammenhang mit dem Spielbetrieb ein Schaden entsteht.
      </LegalSection>

      <LegalSection title="18. Salvatorische Klausel">
        Sollten einzelne Regelungen dieser Spielbedingungen ganz oder teilweise unwirksam sein oder werden,
        bleibt die Wirksamkeit der übrigen Regelungen unberührt.
      </LegalSection>

      <LegalSection title="19. Ehrenkodex">
        Fair Play und Respekt gegenüber Gegnern und Mitmenschen sind für die MDU eine Grundvoraussetzung – im
        Sport wie im Leben. Wir bitten alle Teams und Spieler, in diesem Sinne zu spielen und aufzutreten.
      </LegalSection>

      <LegalSection title="20. Abkürzungen">
        <ul style={ul}>
          <li><strong>MDU</strong> – Münchner Dart Union</li>
          <li><strong>TC</strong> – Teamkapitän (Team Captain)</li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}

const ol: React.CSSProperties = { margin: '6px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 7 };
const ul: React.CSSProperties = { margin: '6px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 5 };
const hint: React.CSSProperties = { fontSize: 12.5, color: 'var(--th-text-faint)', marginTop: 10, lineHeight: 1.6 };
const link: React.CSSProperties = { color: 'var(--th-accent)', textDecoration: 'underline' };
