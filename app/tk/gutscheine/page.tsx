import type { Metadata } from 'next';
import { PageHeader } from '@/components/tk/ui/page-header';
import { DemoNote } from '@/components/tk/ui/primitives';
import { VoucherClient } from '@/components/tk/vouchers/voucher-client';

export const metadata: Metadata = {
  title: 'Gutscheine',
  description:
    'Gutscheine für Platzmiete, Training, Kurse und Camps bei Tennis Kail — Betrag und ' +
    'Motiv frei wählbar.',
};

export default function GutscheinePage() {
  return (
    <>
      <PageHeader
        eyebrow="Gutscheine"
        title="Ein Geschenk, das draußen stattfindet"
        lede="Betrag wählen, Motiv aussuchen, Grußzeile schreiben. Einlösbar für alles: Platzmiete, Trainerstunde, Kurs oder Camp."
      />

      <section className="tk-section">
        <VoucherClient />
        <div className="tk-shell mt-10">
          <DemoNote>
            In der Demo wird kein Gutschein erzeugt, versendet oder abgerechnet. Die Vorschau
            zeigt, wie das fertige Dokument aussähe; die drei Gutscheine im Bestand gehören zum
            Demo-Konto.
          </DemoNote>
        </div>
      </section>
    </>
  );
}
