import type { Metadata } from 'next';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card, DemoNote } from '@/components/tk/ui/primitives';
import { PartnerFinder } from '@/components/tk/community/partner-finder';

export const metadata: Metadata = {
  title: 'Spielpartner finden',
  description:
    'Wer sucht wen: Gesuche nach Spielstärke, Standort und Wunschzeit — für Einzel und Doppel ' +
    'bei Tennis Kail.',
};

export default function SpielpartnerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Gemeinsam spielen"
        title="Der Platz ist frei. Fehlt nur noch jemand."
        lede="Das häufigste Hindernis ist nicht der Platz, sondern der zweite Mensch. Hier stehen Gesuche mit Spielstärke, Wunschzeit und Anlage — ohne Konto, ohne Chatzwang."
      />

      <section className="tk-section">
        <PartnerFinder />

        <div className="tk-shell mt-12 grid gap-5 md:grid-cols-3">
          {[
            ['Nachname bleibt privat', 'Sichtbar sind Vorname und der erste Buchstabe des Nachnamens. Telefonnummern stehen nirgends in der Liste.'],
            ['Kontakt läuft weitergeleitet', 'Anfragen gehen über die Anlage weiter. Wer nicht antworten will, muss nichts abweisen.'],
            ['Direkt zum Platz', 'Passt eine Zeit, führt ein Tipp ins Buchungsraster — Platz reservieren, fertig.'],
          ].map(([t, b]) => (
            <Card key={t} className="flex flex-col gap-2 p-5">
              <h2 className="text-[1rem] font-semibold">{t}</h2>
              <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">{b}</p>
            </Card>
          ))}
        </div>

        <div className="tk-shell mt-8">
          <DemoNote>
            Alle Gesuche sind erfunden. Kontaktaufnahme und Gesuchseinstellung sind in der Demo
            ohne Wirkung — es wird nichts gesendet und nichts gespeichert.
          </DemoNote>
        </div>
      </section>
    </>
  );
}
