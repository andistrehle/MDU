import type { Metadata } from 'next';
import { PageHero, DemoNotice } from '@/components/mdc/ui';
import { AdminDemo, type AdminPlayerOption } from '@/components/mdc/admin-demo';
import { VENUES, venueWeekdayShort } from '@/data/venues';
import { PLAYERS, playerName } from '@/data/players';

export const metadata: Metadata = {
  title: 'Turnierverwaltung (Demo)',
  description:
    'Oberflächen-Demo der MDC-Turnierverwaltung: Turnier anlegen, Spieler melden, ' +
    'Ergebnis eintragen, Turnier abschließen.',
};

export default function AdminPage() {
  const venues = VENUES.map(venue => ({
    id: venue.id,
    name: venue.name,
    weekday: venueWeekdayShort(venue),
    time: venue.time,
  }));

  const players: AdminPlayerOption[] = PLAYERS.map(player => ({
    id: player.id,
    passNr: player.passNr,
    name: playerName(player),
    nickname: player.nickname,
  }));

  return (
    <>
      <PageHero
        kicker="Nur Oberfläche"
        title="Turnierverwaltung"
        description="So könnte ein Turnierabend digital ablaufen: Turnier anlegen, Spieler über Name oder Passnummer melden, Ergebnis eintragen, abschließen — die Punkte rechnet die Serie selbst."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <DemoNotice>
            Diese Seite ist bewusst ungeschützt und ohne Anmeldung — es gibt nichts
            zu schützen: Kein Eintrag wird gespeichert oder verschickt, alles lebt
            nur im Browser und ist nach dem Neuladen weg. Im echten Betrieb säße
            hier eine Anmeldung mit Rollen (Turnierleitung, Lokalbetreuung, Verwaltung).
          </DemoNotice>

          <AdminDemo venues={venues} players={players} />
        </div>
      </section>
    </>
  );
}
