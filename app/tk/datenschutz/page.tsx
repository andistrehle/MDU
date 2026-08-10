import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card } from '@/components/tk/ui/primitives';

export const metadata: Metadata = {
  title: 'Datenschutz',
  description: 'Welche Daten diese Demo verarbeitet — und welche nicht.',
};

const SECTIONS = [
  {
    title: 'Kurzfassung',
    body: [
      'Diese Demo hat kein Benutzerkonto und keine Datenbank. Was hier eingegeben oder gebucht wird, bleibt im lokalen Speicher des eigenen Browsers (localStorage, Schlüssel „tk-demo-v1"). Es wird nichts an einen Server der Anlage übertragen.',
      'Über das Profil im Kundenkonto lässt sich dieser Speicher jederzeit vollständig löschen.',
    ],
  },
  {
    title: 'Was gespeichert wird',
    body: [
      'Ausgewählte Zeitfenster, in der Demo bestätigte Buchungen, vorgemerkte Shop-Artikel, gelesene Benachrichtigungen. Alles ausschließlich lokal, ohne Personenbezug über den eingegebenen Namen hinaus.',
      'Formularfelder (Kontakt, Spielpartner, Gutschein) werden nicht verschickt und nicht gespeichert. Das Kontaktformular zeigt am Ende nur an, was übermittelt worden wäre.',
    ],
  },
  {
    title: 'Was nicht passiert',
    body: [
      'Keine Analyse-Werkzeuge, keine Zählpixel, keine Werbe-Netzwerke, keine Einbindung von Karten- oder Videodiensten. Deshalb gibt es auch kein Einwilligungsbanner: Es wird nichts eingewilligt, weil nichts gesetzt wird.',
      'Schriften werden über den Next.js-Font-Mechanismus mit ausgeliefert; es entsteht keine Verbindung zu Google-Servern beim Seitenaufruf.',
    ],
  },
  {
    title: 'Externe Verweise',
    body: [
      'Der Link „Auf der Karte" führt zu OpenStreetMap. Erst beim Anklicken werden Daten dorthin übertragen — eine Einbettung, die schon beim Laden Daten sendet, gibt es bewusst nicht.',
    ],
  },
  {
    title: 'Für die Produktivversion',
    body: [
      'Sobald echte Buchungen entgegengenommen werden, kommen hinzu: Verarbeitungsverzeichnis, Auftragsverarbeitungsverträge mit Hosting-, E-Mail- und Zahlungsdienstleistern, Löschfristen für Buchungs- und Rechnungsdaten, Auskunfts- und Löschprozess sowie eine vollständige Datenschutzerklärung nach Art. 13 DSGVO.',
      'Diese Seite ersetzt eine solche Erklärung nicht — sie beschreibt nur, was der Entwurf tut.',
    ],
  },
];

export default function DatenschutzPage() {
  return (
    <>
      <PageHeader
        eyebrow="Rechtliches"
        title="Datenschutz"
        lede="Der Entwurf verarbeitet so wenig, dass sich diese Seite kurz fassen lässt."
      />
      <section className="tk-section">
        <div className="tk-shell flex max-w-[70ch] flex-col gap-5">
          {SECTIONS.map((s) => (
            <Card key={s.title} className="flex flex-col gap-3 p-6">
              <h2 className="tk-h3">{s.title}</h2>
              {s.body.map((p) => (
                <p key={p} className="text-[0.95rem] text-[var(--tk-ink-soft)]">
                  {p}
                </p>
              ))}
            </Card>
          ))}
          <Link href="/tk/datenherkunft" className="tk-btn tk-btn--ghost self-start">
            Was ist echt, was ist Demo?
          </Link>
        </div>
      </section>
    </>
  );
}
