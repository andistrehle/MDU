import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarClock, MapPin, Target, Users } from 'lucide-react';
import { BracketView } from '@/components/mdc/bracket-view';
import { PlayerAvatar } from '@/components/mdc/player-avatar';
import { DemoNotice } from '@/components/mdc/ui';
import { Dartboard } from '@/components/mdc/dartboard';
import { TOURNAMENTS, getTournament, podium } from '@/data/tournaments';
import { getVenue, venueAddress } from '@/data/venues';
import { getPlayer, playerName } from '@/data/players';
import { buildBracket } from '@/lib/mdc/bracket';
import { rankGroupLabel } from '@/lib/mdc/points';
import { formatDateLong, formatNumber, formatTime } from '@/lib/mdc/format';

export function generateStaticParams() {
  return TOURNAMENTS.map(tournament => ({ id: tournament.id }));
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await props.params;
  const tournament = getTournament(id);
  if (!tournament) return { title: 'Turnier' };
  const venue = getVenue(tournament.venueId);
  return {
    title: `${tournament.name} · ${venue?.name ?? 'MDC'}`,
    description: `Ergebnisse, Punkte und Turnierbaum: ${tournament.name} am ${formatDateLong(tournament.date)}.`,
  };
}

const MEDAL = ['var(--mdc-gold)', 'var(--mdc-silver)', 'var(--mdc-bronze)'];
const PODIUM_HEIGHT = [128, 100, 82];

export default async function TurnierDetailPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const tournament = getTournament(id);
  if (!tournament) notFound();

  const venue = getVenue(tournament.venueId);
  const finished = tournament.status === 'finished';
  const top3 = finished ? podium(tournament) : [];

  // Der Baum wird aus der Endplatzierung rekonstruiert (siehe lib/mdc/bracket.ts).
  const bracket = finished
    ? buildBracket(
        [...tournament.results].sort((a, b) => a.rank - b.rank).map(r => r.playerId),
        tournament.bracketSize,
      )
    : null;

  return (
    <>
      <section className="mdc-hero">
        <Dartboard className="mdc-hero-board mdc-spin-slow" showNumbers={false} />
        <div className="mdc-shell" style={{ position: 'relative', zIndex: 2, paddingBlock: '40px 44px' }}>
          <Link
            href="/mdc/turniere"
            className="mdc-chip"
            style={{ marginBottom: 18 }}
          >
            <ArrowLeft size={13} />
            Alle Turniere
          </Link>

          <span className="mdc-kicker">{tournament.series}</span>
          <h1 className="mdc-display mdc-h2" style={{ marginTop: 12 }}>
            {venue?.name ?? tournament.name}
          </h1>

          <div
            style={{
              display: 'flex', flexWrap: 'wrap', gap: '10px 22px', marginTop: 16,
              fontSize: '0.9rem', color: 'var(--mdc-text-dim)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <CalendarClock size={15} style={{ color: 'var(--mdc-red)' }} />
              {formatDateLong(tournament.date)}, {formatTime(tournament.time)}
            </span>
            {venue && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <MapPin size={15} style={{ color: 'var(--mdc-red)' }} />
                {venueAddress(venue)}
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Users size={15} style={{ color: 'var(--mdc-red)' }} />
              {finished
                ? `${tournament.results.length} Teilnehmer`
                : `${tournament.participantIds.length} von ${tournament.maxPlayers} gemeldet`}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Target size={15} style={{ color: 'var(--mdc-red)' }} />
              {tournament.name} · Baum bis {tournament.bracketSize} · {tournament.entryFee} € Startgeld
            </span>
          </div>
        </div>
      </section>

      {/* ── Podium ── */}
      {top3.length === 3 && (
        <section style={{ paddingBlock: '44px 0' }}>
          <div className="mdc-shell">
            <div
              className="mdc-card mdc-card-accent"
              style={{ padding: '28px 20px 24px' }}
            >
              <div
                // Bewusst nicht umbrechend: Ein Podium, bei dem der dritte Platz
                // in die nächste Zeile rutscht, ist kein Podium mehr.
                style={{
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  gap: 'clamp(6px, 2.4vw, 28px)', flexWrap: 'nowrap',
                }}
              >
                {[top3[1], top3[0], top3[2]].map(result => {
                  const player = getPlayer(result.playerId);
                  if (!player) return null;
                  const place = result.rank;
                  return (
                    <div key={result.playerId} style={{ textAlign: 'center', width: 'min(158px, 27vw)' }}>
                      <PlayerAvatar player={player} size={place === 1 ? 56 : 46} highlight={place === 1} />
                      <Link
                        href={`/mdc/spieler/${player.id}`}
                        className="mdc-display"
                        style={{ display: 'block', fontSize: place === 1 ? '1.15rem' : '1rem', marginTop: 10 }}
                      >
                        {playerName(player)}
                      </Link>
                      <div className="mdc-num" style={{ fontSize: '0.82rem', color: 'var(--mdc-text-dim)', marginTop: 4 }}>
                        {formatNumber(result.points)} Punkte
                      </div>
                      <div
                        style={{
                          marginTop: 12,
                          height: PODIUM_HEIGHT[place - 1],
                          borderRadius: '8px 8px 0 0',
                          background: `linear-gradient(180deg, ${MEDAL[place - 1]}33, transparent)`,
                          border: `1px solid ${MEDAL[place - 1]}55`,
                          borderBottom: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <span
                          className="mdc-display"
                          style={{ fontSize: '2.2rem', color: MEDAL[place - 1] }}
                        >
                          {place}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Ergebnisliste / Meldeliste ── */}
      <section className="mdc-section">
        <div className="mdc-shell">
          <h2 className="mdc-display mdc-h3" style={{ marginBottom: 16 }}>
            {finished ? 'Ergebnisliste' : 'Meldeliste'}
          </h2>

          {finished ? (
            <div className="mdc-card mdc-scroll-x">
              <table className="mdc-table">
                <thead>
                  <tr>
                    <th className="mdc-sticky-col">Platz</th>
                    <th>Spieler</th>
                    <th>Passnr.</th>
                    <th className="mdc-td-num">Legs +/−</th>
                    <th className="mdc-td-num">Wertung</th>
                    <th className="mdc-td-num">Punkte</th>
                  </tr>
                </thead>
                <tbody>
                  {tournament.results.map(result => {
                    const player = getPlayer(result.playerId);
                    if (!player) return null;
                    const podiumClass = result.rank <= 3 ? `mdc-row-${result.rank}` : '';
                    return (
                      <tr key={result.playerId} className={podiumClass}>
                        <td className={`mdc-sticky-col mdc-num ${podiumClass}`} style={{ fontWeight: 700 }}>
                          {result.rank}
                        </td>
                        <td>
                          <Link href={`/mdc/spieler/${player.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <PlayerAvatar player={player} size={28} />
                            <span style={{ color: 'var(--mdc-white)', fontWeight: 600 }}>{playerName(player)}</span>
                          </Link>
                        </td>
                        <td className="mdc-num" style={{ color: 'var(--mdc-text-dim)' }}>{player.passNr}</td>
                        <td className="mdc-td-num mdc-num" style={{ color: 'var(--mdc-text-dim)' }}>
                          {result.legsWon}:{result.legsLost}
                        </td>
                        <td className="mdc-td-num" style={{ color: 'var(--mdc-text-faint)', fontSize: '0.82rem' }}>
                          {rankGroupLabel(result.rank)}
                        </td>
                        <td className="mdc-td-num mdc-num" style={{ fontWeight: 700, color: 'var(--mdc-white)' }}>
                          {formatNumber(result.points)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mdc-card" style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
                {tournament.participantIds.map(playerId => {
                  const player = getPlayer(playerId);
                  if (!player) return null;
                  return (
                    <Link
                      key={playerId}
                      href={`/mdc/spieler/${player.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}
                    >
                      <PlayerAvatar player={player} size={30} />
                      <span>
                        <span style={{ display: 'block', color: 'var(--mdc-white)', fontSize: '0.9rem' }}>
                          {playerName(player)}
                        </span>
                        <span className="mdc-num" style={{ fontSize: '0.75rem', color: 'var(--mdc-text-faint)' }}>
                          Passnr. {player.passNr}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
              <p style={{ marginTop: 18, fontSize: '0.86rem', color: 'var(--mdc-text-dim)' }}>
                Nachmelden ist bis zum Turnierstart im Lokal möglich, solange Plätze frei sind.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Turnierbaum ── */}
      {bracket && (
        <section
          className="mdc-section"
          style={{ background: 'var(--mdc-black)', borderBlock: '1px solid var(--mdc-line)' }}
        >
          <div className="mdc-shell">
            <h2 className="mdc-display mdc-h3" style={{ marginBottom: 8 }}>Turnierbaum</h2>
            <p className="mdc-lead" style={{ marginBottom: 18, maxWidth: 720 }}>
              Doppel-K.-o. mit {bracket.size} Plätzen, {bracket.entrants} Startern und{' '}
              {bracket.size - bracket.entrants} Freilosen in der ersten Runde.
            </p>

            <div style={{ marginBottom: 22 }}>
              <DemoNotice>
                Der Baum ist aus der Endplatzierung rekonstruiert: Spielprotokolle
                der einzelnen Partien liegen für diese Vorschau nicht vor. Sobald
                Ergebnisse live eingetragen werden, zeigt dieselbe Ansicht die
                echten Partien.
              </DemoNotice>
            </div>

            <BracketView bracket={bracket} />
          </div>
        </section>
      )}
    </>
  );
}
