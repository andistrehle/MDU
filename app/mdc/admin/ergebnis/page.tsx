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
import { PageHero } from '@/components/mdc/ui';
import { AdminNav } from '@/components/mdc/admin-nav';
import { ErgebnisUpload, type UploadSpieler, type UploadVenue } from '@/components/mdc/ergebnis-upload';
import { TurnierKorrektur, type KorrekturTurnier } from '@/components/mdc/turnier-korrektur';
import { VENUES, venueWeekdayShort } from '@/data/venues';
import { PLAYERS, getPlayer, playerName } from '@/data/players';
import { UPLOADED_TOURNAMENTS } from '@/data/tournament-results';
import { todayInMunich } from '@/data/season';
import { passUebersicht } from '@/lib/mdc/passnummern';
import { getUploadStatus } from '@/lib/mdc/upload-config';
import { mdcPath } from '@/lib/mdc/site';

/**
 * Wie viele Nummern über der höchsten vergebenen zur Auswahl stehen. Zwanzig
 * reichen für jeden Abend — und mehr wäre eine Liste, die niemand liest.
 */
const NEUE_NUMMERN = 20;

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

  // Freie Passnummern für Neulinge: erst die echten Lücken im Register des
  // Betreibers (der Reihe nach aufzufüllen), dann die Nummern über der
  // höchsten vergebenen. Wer im Lokal einen Neuling einträgt, soll nicht
  // raten müssen, welche Nummer noch zu haben ist.
  const pass = passUebersicht();
  const neueNummern = Array.from(
    { length: NEUE_NUMMERN },
    (_, i) => pass.hoechsteVergebene + 1 + i,
  );

  // Was über diese Seite hochgeladen wurde — nur daran lässt sich nachträglich
  // etwas ändern. Neuestes zuerst: Ein falsches Datum fällt meist am nächsten
  // Tag auf.
  const hochgeladen: KorrekturTurnier[] = [...UPLOADED_TOURNAMENTS]
    .sort((a, b) => b.date.localeCompare(a.date) || a.venueName.localeCompare(b.venueName))
    .map(t => {
      const erster = t.results[0];
      const sieger = erster.playerId ? getPlayer(erster.playerId) : undefined;
      return {
        id: t.id,
        datum: t.date,
        spielortId: t.venueId,
        spielortName: t.venueName,
        starter: t.participants,
        sieger: sieger ? playerName(sieger) : `Passnr. ${erster.passNr}`,
      };
    });

  return (
    <>
      <PageHero
        kicker="Turnierverwaltung"
        title="Ergebnis hochladen"
        description="Zettel fotografieren, erkannte Liste prüfen, freigeben. Die Punkte rechnet die Serie selbst — aus Platzierung und Feldgröße."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <AdminNav aktiv="ergebnis" />

          <ErgebnisUpload
            venues={venues}
            spieler={spieler}
            heute={todayInMunich()}
            status={getUploadStatus()}
            luecken={pass.frei}
            neueNummern={neueNummern}
          />

          <TurnierKorrektur
            turniere={hochgeladen}
            venues={VENUES.map(v => ({ id: v.id, name: v.name, weekday: venueWeekdayShort(v) }))}
            canPublish={getUploadStatus().canPublish}
          />

          <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--mdc-ink-dim)', maxWidth: 700 }}>
            Das Foto wird zum Lesen an den Erkennungsdienst geschickt und danach nicht
            gespeichert — weder hier noch sonst wo. Abgelegt wird nur, was nach der Prüfung
            freigegeben wurde: Platzierung, Passnummer und die daraus gerechneten Punkte.
            Wie das im Einzelnen abläuft, steht in den{' '}
            <Link href={mdcPath('/datenschutz')}>Datenschutzhinweisen</Link>.
          </p>

        </div>
      </section>
    </>
  );
}
