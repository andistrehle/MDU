// ============================================================
// Tennis Kail — Datenherkunft
// ============================================================
//
// Diese Seite ist Teil der Demo, nicht Beiwerk. Wer einem Betreiber einen
// Entwurf zeigt, muss sagen können, welche Angabe recherchiert und welche
// erfunden ist — sonst diskutiert man über Zahlen, die niemand aufgestellt
// hat. Deshalb steht die Liste in der Anwendung selbst und nicht nur in
// einer Datei.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card, Chip } from '@/components/tk/ui/primitives';
import { BRAND, FACTS } from '@/data/tk/facility';
import { ORIGINALS_AVAILABLE, ORIGINALS_NOTE, IMAGE_SLOTS } from '@/data/tk/images';

export const metadata: Metadata = {
  title: 'Was ist echt, was ist Demo?',
  description:
    'Vollständige Herkunft aller Angaben in dieser Demo: belegte Fakten, Annahmen und ' +
    'erfundene Inhalte.',
};

export default function DatenherkunftPage() {
  const belegt = FACTS.filter((f) => f.provenance === 'belegt');
  const demo = FACTS.filter((f) => f.provenance === 'demo');

  return (
    <>
      <PageHeader
        eyebrow="Transparenz"
        title="Was ist echt, was ist Demo?"
        lede="Diese Anwendung ist ein Entwurf. Damit man über die richtigen Dinge reden kann, steht hier jede Angabe mit ihrer Herkunft."
      />

      <section className="tk-section">
        <div className="tk-shell grid gap-8 lg:grid-cols-2 lg:items-start">
          <Card className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <Chip tone="free">belegt</Chip>
              <h2 className="tk-h3">Recherchiert und belegbar</h2>
            </div>
            <ul className="flex flex-col gap-3">
              {belegt.map((f) => (
                <li key={f.claim} className="border-b border-[var(--tk-line-soft)] pb-3 last:border-0">
                  <p className="text-[0.94rem]">{f.claim}</p>
                  <p className="mt-0.5 text-[0.8rem] text-[var(--tk-ink-dim)]">Quelle: {f.source}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <Chip tone="warn">Demo</Chip>
              <h2 className="tk-h3">Angenommen oder erfunden</h2>
            </div>
            <ul className="flex flex-col gap-3">
              {demo.map((f) => (
                <li key={f.claim} className="border-b border-[var(--tk-line-soft)] pb-3 last:border-0">
                  <p className="text-[0.94rem]">{f.claim}</p>
                  <p className="mt-0.5 text-[0.8rem] text-[var(--tk-ink-dim)]">{f.source}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="tk-section tk-section--wash">
        <div className="tk-shell grid gap-6 lg:grid-cols-2">
          <Card className="flex flex-col gap-4 p-6">
            <h2 className="tk-h3">Warum keine Originalfotos?</h2>
            <p className="text-[0.94rem] text-[var(--tk-ink-soft)]">
              Der Auftrag war eindeutig: Originalmaterial hat Vorrang. Die Umgebung, in der diese
              Demo gebaut wurde, hat www.tennis-kail.de allerdings nicht erreicht — der
              Netzwerk-Proxy blockt die Domain (HTTP 403 im CONNECT-Tunnel). Es konnte kein
              einziges Bild geladen werden.
            </p>
            <p className="text-[0.94rem] text-[var(--tk-ink-soft)]">
              Statt Stockfotos einzusetzen — die eine fremde Anlage zeigen würden — zeichnet die
              Anwendung eigene Grafiken. Der Weg zu echten Fotos ist vorbereitet und braucht
              keinen Umbau:
            </p>
            <pre className="tk-num overflow-x-auto rounded-[10px] bg-[var(--tk-forest)] px-4 py-3 text-[0.82rem] text-[var(--tk-on-dark)]">
              node scripts/tk-fetch-images.mjs
            </pre>
            <p className="text-[0.88rem] text-[var(--tk-ink-dim)]">
              Das Skript lädt alle Bilder der Seite, legt sie unter{' '}
              <code>public/tk/original/</code> ab und schreibt ein Manifest. Jeder der{' '}
              {Object.keys(IMAGE_SLOTS).length} Bildplätze sucht sich daraus über Schlüsselwörter
              das passende Foto. Solange nichts da ist, greift die gezeichnete Fassung.
            </p>
            <p className="tk-demo-note">
              Stand des Manifests: {ORIGINALS_AVAILABLE ? 'Originalbilder vorhanden.' : ORIGINALS_NOTE}
            </p>
          </Card>

          <Card className="flex flex-col gap-4 p-6">
            <h2 className="tk-h3">Was diese Demo nicht tut</h2>
            <ul className="flex flex-col gap-2.5 text-[0.94rem] text-[var(--tk-ink-soft)]">
              {[
                'Sie verschickt keine E-Mails und keine SMS.',
                'Sie nimmt keine Zahlung entgegen und legt keine Rechnung an.',
                'Sie speichert nichts auf einem Server — Buchungen liegen im Speicher des eigenen Browsers.',
                'Sie ruft kein Wetter ab; die Vorhersage ist aus dem Datum errechnet.',
                'Sie ist nicht mit der Anlage verbunden — dort weiß niemand von einer Buchung.',
                'Sie ist für Suchmaschinen gesperrt (noindex), damit sie nicht als offizielle Seite erscheint.',
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-[var(--tk-clay)]" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="text-[0.94rem] text-[var(--tk-ink-soft)]">
              Wer wirklich einen Platz braucht, ruft an:{' '}
              <a href={`tel:${BRAND.phoneHref}`} className="font-semibold text-[var(--tk-clay)] underline">
                {BRAND.phone}
              </a>
            </p>
          </Card>
        </div>
      </section>

      <section className="tk-section--tight pb-16">
        <div className="tk-shell">
          <Card className="flex flex-col gap-3 p-6">
            <h2 className="tk-h3">Und die Personen?</h2>
            <p className="text-[0.94rem] text-[var(--tk-ink-soft)]">
              Niklas Persson und Ekkehard Dietrich sind über die Vereinsseite als Trainer belegt;
              ihre Kurzprofile, Preise und Zeiten sind für die Demo gesetzt und nicht mit ihnen
              abgestimmt. Alle übrigen Personen — Kundin, Spielpartner, Turnierteilnehmer,
              Namen im Belegungsplan — sind frei erfunden. Vor einer Veröffentlichung müssten
              alle genannten Personen zustimmen.
            </p>
            <Link href="/tk" className="tk-btn tk-btn--ghost self-start">
              Zurück zur Startseite
            </Link>
          </Card>
        </div>
      </section>
    </>
  );
}
