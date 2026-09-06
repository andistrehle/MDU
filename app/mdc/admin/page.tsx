import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Camera } from 'lucide-react';
import { PageHero, DemoNotice } from '@/components/mdc/ui';
import { AdminDemo, type AdminPlayerOption } from '@/components/mdc/admin-demo';
import { VENUES, venueWeekdayShort } from '@/data/venues';
import { PLAYERS, playerName } from '@/data/players';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  // Oberflächen-Demo ohne Daten — gehört nicht in den Suchindex.
  robots: { index: false, follow: false },
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
          {/* Der echte Weg steht vor der Demo — wer hierher kommt, will in aller
              Regel ein Ergebnis eintragen, nicht eine Oberfläche ansehen. */}
          <div
            className="mdc-card mdc-card-accent"
            style={{
              padding: '22px 20px', display: 'flex', flexWrap: 'wrap', gap: 16,
              alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <div style={{ maxWidth: 560 }}>
              <h2 className="mdc-display" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 9 }}>
                <Camera size={19} style={{ color: 'var(--mdc-red)' }} />
                Ergebnis vom Zettel eintragen
              </h2>
              <p style={{ marginTop: 8, fontSize: '0.92rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
                Das ist der einzige Teil dieser Seite, der wirklich etwas tut: Zettel
                fotografieren, erkannte Liste prüfen, freigeben. Die Punkte rechnet die Serie
                selbst, das Turnier steht ein bis zwei Minuten später online.
              </p>
            </div>
            <Link href={mdcPath('/admin/ergebnis')} className="mdc-btn mdc-btn-primary">
              Ergebnis hochladen
              <ArrowRight size={16} />
            </Link>
          </div>

          <DemoNotice>
            Alles Weitere auf dieser Seite ist reine Oberfläche: Kein Eintrag wird
            gespeichert oder verschickt, alles lebt nur im Browser und ist nach dem
            Neuladen weg. So könnte ein Turnierabend digital ablaufen — gebaut ist
            davon bisher nur der Ergebnis-Upload oben.
          </DemoNotice>

          <AdminDemo venues={venues} players={players} />
        </div>
      </section>
    </>
  );
}
