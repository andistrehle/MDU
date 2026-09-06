// ============================================================
// MDC — Ergebniszettel hochladen
// ============================================================
//
// Die einzige Seite der MDC, die etwas verändert. Sie liegt hinter der
// Passwortabfrage (`proxy.ts`) und ist für Suchmaschinen gesperrt.
//
// Dynamisch, nicht vorgerechnet: Die Seite muss beim Aufruf wissen, ob die
// Zugangsdaten hinterlegt sind, und die Spielerliste soll die sein, die im
// laufenden Deployment gilt.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/mdc/ui';
import { ErgebnisUpload, type UploadSpieler, type UploadVenue } from '@/components/mdc/ergebnis-upload';
import { VENUES, venueWeekdayShort } from '@/data/venues';
import { PLAYERS, playerName } from '@/data/players';
import { todayInMunich } from '@/data/season';
import { getUploadStatus } from '@/lib/mdc/upload-config';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Ergebnis hochladen',
  description: 'Ergebniszettel fotografieren, prüfen, freigeben.',
};

export const dynamic = 'force-dynamic';

export default async function ErgebnisUploadPage() {
  const venues: UploadVenue[] = VENUES.map(venue => ({
    id: venue.id,
    name: venue.name,
    weekday: venueWeekdayShort(venue),
    time: venue.time,
    weekdays: venue.weekdays,
  }));

  const spieler: UploadSpieler[] = PLAYERS
    .filter(p => p.passNr !== null)
    .map(p => ({ passNr: p.passNr as number, name: playerName(p), nickname: p.nickname }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return (
    <>
      <PageHero
        kicker="Turnierverwaltung"
        title="Ergebnis hochladen"
        description="Zettel fotografieren, erkannte Liste prüfen, freigeben. Die Punkte rechnet die Serie selbst — aus Platzierung und Feldgröße."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <ErgebnisUpload
            venues={venues}
            spieler={spieler}
            heute={todayInMunich()}
            status={getUploadStatus()}
          />

          <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--mdc-ink-dim)', maxWidth: 700 }}>
            Das Foto wird zum Lesen an den Erkennungsdienst geschickt und danach nicht
            gespeichert — weder hier noch sonst wo. Abgelegt wird nur, was nach der Prüfung
            freigegeben wurde: Platzierung, Passnummer und die daraus gerechneten Punkte.
            Wie das im Einzelnen abläuft, steht in den{' '}
            <Link href={mdcPath('/datenschutz')}>Datenschutzhinweisen</Link>.
          </p>

          <Link href={mdcPath('/admin')} className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ alignSelf: 'flex-start' }}>
            Zur Turnierverwaltung
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}
