// ============================================================
// MDC — Impressum
// ============================================================
//
// Pflichtangaben nach § 5 DDG und § 18 Abs. 2 MStV. Die Anbieterangaben
// kommen aus `data/mdc-legal.ts`; fehlt dort etwas, steht es hier sichtbar als
// Lücke — erfunden wird nichts.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/mdc/ui';
import { LegalPage, LegalSection, LegalGapNotice } from '@/components/mdc/legal';
import { MDC_LEGAL, MDC_LEGAL_COMPLETE, legal } from '@/data/mdc-legal';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Anbieterkennzeichnung der Munich Darts Challenge nach § 5 DDG.',
};

export default function ImpressumPage() {
  const { operator, legalForm, representedBy, street, zipCity, email, phone,
    contentResponsible, updated } = MDC_LEGAL;

  return (
    <>
      <PageHero kicker="Rechtliches" title="Impressum" description={`Stand: ${updated}`} />

      <LegalPage>
        {!MDC_LEGAL_COMPLETE && (
          <LegalGapNotice>
            <strong>Noch unvollständig.</strong> Die in eckigen Klammern stehenden Angaben
            fehlen und müssen in <code>data/mdc-legal.ts</code> eingetragen werden. Solange
            sie fehlen, bleibt die Seite für Suchmaschinen gesperrt — eine öffentlich
            auffindbare Seite mit echten Namen braucht ein vollständiges Impressum.
          </LegalGapNotice>
        )}

        <LegalSection title="Angaben gemäß § 5 DDG (Digitale-Dienste-Gesetz)">
          {legal(operator, 'Anbieter der Seite')}<br />
          {legalForm && <>{legalForm}<br /></>}
          {legal(street, 'Straße und Hausnummer')}<br />
          {legal(zipCity, 'PLZ und Ort')}
        </LegalSection>

        {(representedBy || !MDC_LEGAL_COMPLETE) && (
          <LegalSection title="Vertreten durch">
            {legal(representedBy, 'vertretungsberechtigte Person')}
          </LegalSection>
        )}

        <LegalSection title="Kontakt">
          E-Mail: {email
            ? <a href={`mailto:${email}`}>{email}</a>
            : '[E-Mail-Adresse]'}
          {phone && <><br />Telefon: {phone}</>}
        </LegalSection>

        <LegalSection title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
          {legal(contentResponsible, 'verantwortliche Person')}<br />
          Anschrift wie oben
        </LegalSection>

        <LegalSection title="Namen und Ergebnisse auf dieser Seite">
          Diese Seite veröffentlicht Ranglisten und Turnierergebnisse mit den Namen der
          Spielerinnen und Spieler. Wer damit nicht einverstanden ist, kann jederzeit
          widersprechen — eine formlose E-Mail genügt. Wie die Daten verarbeitet werden und
          welche Rechte bestehen, steht in den{' '}
          <Link href={mdcPath('/datenschutz')}>Datenschutzhinweisen</Link>.
        </LegalSection>

        <LegalSection title="Haftung für Inhalte">
          Die Inhalte dieser Seite werden mit größtmöglicher Sorgfalt erstellt. Ranglisten,
          Turnierergebnisse und Punkte stammen aus der Auswertung der Turnierserie; für ihre
          Richtigkeit, Vollständigkeit und Aktualität kann dennoch keine Gewähr übernommen
          werden. Maßgeblich für die Wertung ist die offizielle Auswertung der Serie. Wer
          einen Fehler entdeckt, darf sich gern melden — Hinweise werden geprüft und
          berichtigt.
        </LegalSection>

        <LegalSection title="Haftung für Links">
          Diese Seite verweist an einzelnen Stellen auf externe Angebote (etwa auf einen
          Kartendienst zur Anfahrt oder auf die Seite der Münchner Dart Union). Auf deren
          Inhalte besteht kein Einfluss; dafür ist jeweils der Anbieter der verlinkten Seite
          verantwortlich. Zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.
        </LegalSection>

        <LegalSection title="Urheberrecht">
          Die auf dieser Seite erstellten Inhalte, Texte und Darstellungen unterliegen dem
          deutschen Urheberrecht. Name und Logo der Munich Darts Challenge werden mit
          Zustimmung der Turnierserie verwendet.
        </LegalSection>

        <LegalSection title="Verbraucherstreitbeilegung">
          Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor
          einer Verbraucherschlichtungsstelle (§ 36 VSBG) teilzunehmen. Die Munich Darts
          Challenge ist ein nicht kommerzieller Zusammenschluss zur Organisation des
          Turnierbetriebs; ein Online-Verkauf findet auf dieser Seite nicht statt.
        </LegalSection>
      </LegalPage>
    </>
  );
}
