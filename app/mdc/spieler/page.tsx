import type { Metadata } from 'next';
import { PageHero } from '@/components/mdc/ui';
import { PlayerDirectory, type DirectoryEntry } from '@/components/mdc/player-directory';
import { PLAYERS } from '@/data/players';
import { getFinalEntry } from '@/data/ranking-final';
import { getVenue } from '@/data/venues';
import { formatNumber } from '@/lib/mdc/format';

export const metadata: Metadata = {
  title: 'Spieler',
  description:
    'Alle Spielerinnen und Spieler mit MDC-Pass — mit Passnummer, Saisonpunkten und Profil.',
};

export default function SpielerPage() {
  const entries: DirectoryEntry[] = PLAYERS.map(player => {
    const final = getFinalEntry(player.id);
    return {
      id: player.id,
      passNr: player.passNr,
      firstName: player.firstName,
      lastName: player.lastName,
      nickname: player.nickname,
      division: player.division,
      venueName: player.homeVenueId ? getVenue(player.homeVenueId)?.name ?? null : null,
      rank: final?.rank ?? null,
      points: final?.points ?? 0,
      tournaments: final?.tournaments ?? 0,
      average: final?.average ?? 0,
      hue: ((player.passNr ?? [...player.id].reduce((s, c) => s + c.charCodeAt(0), 0)) * 47) % 360,
    };
  }).sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999) || a.lastName.localeCompare(b.lastName));

  return (
    <>
      <PageHero
        kicker="Spielerstamm"
        title="Spieler"
        description={`${formatNumber(PLAYERS.length)} Spielerinnen und Spieler mit eigener MDC-Passnummer. Die Passnummer gilt nur in der MDC — mit den Pässen der Münchner Dart Union hat sie nichts zu tun.`}
      />

      <section className="mdc-section">
        <div className="mdc-shell">
          <PlayerDirectory entries={entries} />
        </div>
      </section>
    </>
  );
}
