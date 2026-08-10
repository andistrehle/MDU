import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card } from '@/components/tk/ui/primitives';
import { BRAND } from '@/data/tk/facility';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Angaben zum Entwurf.',
};

export default function ImpressumPage() {
  return (
    <>
      <PageHeader eyebrow="Rechtliches" title="Impressum" />
      <section className="tk-section">
        <div className="tk-shell max-w-[68ch] flex flex-col gap-6">
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="tk-h3">Was diese Seite ist</h2>
            <p className="text-[0.95rem] text-[var(--tk-ink-soft)]">
              Ein unverbindlicher Gestaltungsentwurf für {BRAND.name}, erstellt zur Vorlage beim
              Betreiber. Die Seite ist kein Angebot, kein Buchungssystem und keine offizielle
              Darstellung des Unternehmens. Sie ist für Suchmaschinen gesperrt.
            </p>
            <p className="text-[0.95rem] text-[var(--tk-ink-soft)]">
              Name, Anschrift und Telefonnummer von {BRAND.legal} sind öffentlich zugängliche
              Angaben und dienen hier ausschließlich dazu, den Entwurf im richtigen Kontext zu
              zeigen. Eine Verbindung, Beauftragung oder Freigabe durch das Unternehmen besteht
              nicht.
            </p>
          </Card>

          <Card className="flex flex-col gap-3 p-6">
            <h2 className="tk-h3">Verantwortlich für den Entwurf</h2>
            <p className="text-[0.95rem] text-[var(--tk-ink-soft)]">
              Vor einer Veröffentlichung ist dieses Impressum durch die vollständigen Angaben
              nach § 5 DDG (Name, Anschrift, Vertretung, Kontakt, Registereintrag,
              Umsatzsteuer-Identifikationsnummer) zu ersetzen. Solange dieser Entwurf nur intern
              gezeigt wird, steht hier bewusst kein erfundener Anbieter.
            </p>
          </Card>

          <Card className="flex flex-col gap-3 p-6">
            <h2 className="tk-h3">Bildnachweis</h2>
            <p className="text-[0.95rem] text-[var(--tk-ink-soft)]">
              Alle Grafiken dieser Demo sind eigens gezeichnet (SVG, im Quelltext enthalten). Es
              werden keine Stockfotos und keine fremden Bilder verwendet. Werden später
              Originalfotos der Anlage eingebunden, liegen die Rechte beim Betreiber; die
              Herkunft jedes Bildes wird im Manifest festgehalten.
            </p>
            <Link href="/tk/datenherkunft" className="font-semibold text-[var(--tk-clay)] underline underline-offset-4">
              Datenherkunft im Detail
            </Link>
          </Card>
        </div>
      </section>
    </>
  );
}
