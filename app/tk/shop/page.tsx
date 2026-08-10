import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card, DemoNote } from '@/components/tk/ui/primitives';
import { ShopClient } from '@/components/tk/shop/shop-client';
import { BRAND } from '@/data/tk/facility';

export const metadata: Metadata = {
  title: 'Pro-Shop und Bespannung',
  description:
    'Saiten, Bälle, Griffbänder und Bespannservice bei Tennis Kail — zurücklegen lassen ' +
    'und an der Anlage abholen.',
};

export default function ShopPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pro-Shop"
        title="Alles, was zwischen zwei Sätzen reißt"
        lede="Saiten, Bälle, Griffbänder und ein Bespannservice, der über Nacht fertig wird. Online zurücklegen lassen, an der Theke abholen und bezahlen."
        action={
          <a href={`tel:${BRAND.phoneHref}`} className="tk-btn tk-btn--ghost">
            Kurz anrufen: {BRAND.phone}
          </a>
        }
      />

      <section className="tk-section">
        <ShopClient />

        <div className="tk-shell mt-10 grid gap-5 md:grid-cols-3">
          {[
            ['Bespannung über Nacht', 'Schläger bis 18 Uhr abgeben, am nächsten Tag ab 10 Uhr fertig. Express innerhalb von drei Stunden gegen Aufpreis.'],
            ['Testschläger mitnehmen', 'Drei Modelle für eine Woche. Wer danach kauft, bekommt die Leihgebühr angerechnet.'],
            ['Kein Versand, mit Absicht', 'Der Shop lebt vom Gespräch an der Theke. Online wird nur reserviert — bezahlt wird vor Ort.'],
          ].map(([t, b]) => (
            <Card key={t} className="flex flex-col gap-2 p-5">
              <h2 className="text-[1rem] font-semibold">{t}</h2>
              <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">{b}</p>
            </Card>
          ))}
        </div>

        <div className="tk-shell mt-8">
          <DemoNote>
            Sortiment und Preise sind erfunden. Es findet keine Zahlung statt und es wird nichts
            an die Anlage übermittelt — die Vormerkung bleibt im eigenen Browser.{' '}
            <Link href="/tk/datenherkunft" className="underline">
              Mehr dazu
            </Link>
          </DemoNote>
        </div>
      </section>
    </>
  );
}
