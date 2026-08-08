import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Trophy } from 'lucide-react';
import { PlayerAvatar } from '@/components/mdc/player-avatar';
import { Sparkline } from '@/components/mdc/sparkline';
import { DemoNotice } from '@/components/mdc/ui';
import { Dartboard } from '@/components/mdc/dartboard';
import { PLAYERS, getPlayer, playerName } from '@/data/players';
import { getFinalEntry, DIVISION_LABEL } from '@/data/ranking-final';
import { getSummerEntry } from '@/data/ranking';
import { tournamentsOfPlayer } from '@/data/tournaments';
import { getVenue } from '@/data/venues';
import { formatAverage, formatDate, formatNumber } from '@/lib/mdc/format';
import { FINAL_SEASON, getCurrentSeason } from '@/data/season';

export function generateStaticParams() {
  return PLAYERS.map(player => ({ id: player.id }));
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await props.params;
  const player = getPlayer(id);
  if (!player) return { title: 'Spieler' };
  return {
    title: playerName(player),
    description: `MDC-Profil von ${playerName(player)} (Passnr. ${player.passNr}) — Platzierung, Punkte und gespielte Turniere.`,
  };
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="mdc-card" style={{ padding: '16px 18px' }}>
      <div
        style={{
          fontFamily: 'var(--mdc-font-display)', textTransform: 'uppercase',
          letterSpacing: '0.12em', fontSize: '0.7rem', fontWeight: 700, color: 'var(--mdc-ink-dim)',
        }}
      >
        {label}
      </div>
      <div className="mdc-display" style={{ fontSize: '1.6rem', marginTop: 8 }}>{value}</div>
      {sub && <div style={{ marginTop: 4, fontSize: '0.78rem', color: 'var(--mdc-ink-soft)' }}>{sub}</div>}
    </div>
  );
}

export default async function SpielerProfilPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const player = getPlayer(id);
  if (!player) notFound();

  const final = getFinalEntry(player.id);
  const summer = getSummerEntry(player.id);
  const history = tournamentsOfPlayer(player.id);
  const summerSeason = getCurrentSeason();

  // Lieblingslokal: das Lokal, in dem am häufigsten gespielt wurde. Kommt der
  // Nachname aus einem Lokalnamen, gilt dieses als Stammlokal.
  const venueCounts = new Map<string, number>();
  for (const item of history) {
    venueCounts.set(item.tournament.venueId, (venueCounts.get(item.tournament.venueId) ?? 0) + 1);
  }
  // Ohne Stammlokal braucht es mindestens zwei Besuche, damit „Lieblingslokal"
  // überhaupt eine Aussage ist — ein einzelnes Turnier sagt nichts.
  const mostVisited = [...venueCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const favouriteVenueId = player.homeVenueId
    ?? (mostVisited && mostVisited[1] >= 2 ? mostVisited[0] : null);
  const favouriteVenue = favouriteVenueId ? getVenue(favouriteVenueId) : undefined;

  // Formkurve: Platzierungen chronologisch. Kleinere Zahl = besser, deshalb
  // gespiegelt, damit „nach oben" auch optisch besser heißt.
  const chronological = [...history].reverse();
  const formValues = chronological.map(item => -item.result.rank);

  return (
    <>
      <section className="mdc-hero">
        <Dartboard className="mdc-hero-board mdc-spin-slow" showNumbers={false} tone="brand" />
        <div className="mdc-shell" style={{ position: 'relative', zIndex: 2, paddingBlock: '36px 40px' }}>
          <Link href="/mdc/spieler" className="mdc-chip" style={{ marginBottom: 18 }}>
            <ArrowLeft size={13} />
            Alle Spieler
          </Link>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
            <PlayerAvatar player={player} size={88} highlight />
            <div>
              <h1 className="mdc-display mdc-h2">{playerName(player)}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <span className="mdc-chip mdc-chip-red">Passnr. {player.passNr}</span>
                {player.nickname && <span className="mdc-chip">„{player.nickname}“</span>}
                <span className="mdc-chip">{DIVISION_LABEL[player.division]}</span>
                {favouriteVenue && (
                  <span className="mdc-chip">
                    <MapPin size={12} />
                    {favouriteVenue.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          {/* ── Saison-Endstand ── */}
          <div>
            <h2 className="mdc-display mdc-h3" style={{ marginBottom: 6 }}>
              Endstand Saison {FINAL_SEASON.label}
            </h2>
            <p style={{ color: 'var(--mdc-ink-soft)', fontSize: '0.88rem', marginBottom: 16 }}>
              Offizieller Stand vom {formatDate(FINAL_SEASON.asOf)} ·{' '}
              {DIVISION_LABEL[player.division]}wertung
            </p>

            {final ? (
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))' }}>
                <Tile label="Platz" value={`${final.rank}.`} />
                <Tile label="Punkte" value={formatNumber(final.points)} />
                <Tile label="Anzahl TN" value={String(final.tournaments)} />
                <Tile label="Schnitt" value={formatAverage(final.average)} />
                {final.payoutEuro !== undefined && (
                  <Tile
                    label="Auszahlung"
                    value={`${formatNumber(Math.floor(final.payoutEuro))},${String(Math.round((final.payoutEuro % 1) * 100)).padStart(2, '0')} €`}
                    sub={`${formatAverage(final.payoutPercent ?? 0)} % der Einzelrangliste`}
                  />
                )}
              </div>
            ) : (
              <p className="mdc-lead">
                Für diesen Spieler liegt (noch) kein Eintrag in der Endrangliste
                2025/26 vor — die Auswertungsseiten der Plätze 199–280 fehlen bislang.
              </p>
            )}
          </div>

          {/* ── Laufende Sommerwertung ── */}
          {summer && (
            <div>
              <h2 className="mdc-display mdc-h3" style={{ marginBottom: 6 }}>
                {summerSeason.label}
              </h2>
              <p style={{ color: 'var(--mdc-ink-soft)', fontSize: '0.88rem', marginBottom: 16 }}>
                Zwischenstand vom {formatDate(summerSeason.asOf)}
              </p>

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))' }}>
                <Tile label="Platz gesamt" value={`${summer.rank}.`} />
                <Tile label="Punkte" value={formatNumber(summer.points)} />
                <Tile label="Turniere" value={String(summer.tournaments)} />
                <Tile label="Schnitt" value={formatAverage(summer.average)} />
                <Tile
                  label="Beste Platzierung"
                  value={`${summer.bestFinish}.`}
                  sub={summer.wins > 0 ? `${summer.wins} Turniersieg${summer.wins > 1 ? 'e' : ''}` : undefined}
                />
              </div>
            </div>
          )}

          {/* ── Formkurve + Punktehistorie ── */}
          {history.length > 0 && (
            <div>
              <h2 className="mdc-display mdc-h3" style={{ marginBottom: 16 }}>Formkurve</h2>

              {formValues.length >= 2 && (
                <div className="mdc-card" style={{ padding: '20px 18px 12px', marginBottom: 18 }}>
                  <Sparkline
                    values={formValues}
                    label={`Platzierungen von ${playerName(player)} über die letzten ${formValues.length} Turniere`}
                  />
                  <div
                    style={{
                      display: 'flex', justifyContent: 'space-between', marginTop: 8,
                      fontSize: '0.74rem', color: 'var(--mdc-ink-dim)',
                    }}
                  >
                    <span>{formatDate(chronological[0].tournament.date)}</span>
                    <span>oben = bessere Platzierung</span>
                    <span>{formatDate(chronological[chronological.length - 1].tournament.date)}</span>
                  </div>
                </div>
              )}

              <div className="mdc-card mdc-scroll-x">
                <table className="mdc-table">
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Turnier</th>
                      <th>Spielort</th>
                      <th className="mdc-td-num">Platz</th>
                      <th className="mdc-td-num">Legs</th>
                      <th className="mdc-td-num">Punkte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(({ tournament, result }) => {
                      const venue = getVenue(tournament.venueId);
                      return (
                        <tr key={tournament.id}>
                          <td className="mdc-num" style={{ color: 'var(--mdc-ink-soft)' }}>
                            {formatDate(tournament.date)}
                          </td>
                          <td>
                            <Link href={`/mdc/turniere/${tournament.id}`} style={{ color: 'var(--mdc-ink)' }}>
                              {tournament.name}
                            </Link>
                          </td>
                          <td style={{ color: 'var(--mdc-ink-soft)' }}>{venue?.name ?? '—'}</td>
                          <td
                            className="mdc-td-num mdc-num"
                            style={{ fontWeight: 700, color: result.rank <= 3 ? 'var(--mdc-gold)' : 'var(--mdc-ink)' }}
                          >
                            {result.rank}.
                          </td>
                          <td className="mdc-td-num mdc-num" style={{ color: 'var(--mdc-ink-soft)' }}>
                            {result.legsWon}:{result.legsLost}
                          </td>
                          <td className="mdc-td-num mdc-num" style={{ fontWeight: 700 }}>
                            {formatNumber(result.points)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Lieblingslokal ── */}
          {favouriteVenue && (
            <div>
              <h2 className="mdc-display mdc-h3" style={{ marginBottom: 16 }}>Lieblingslokal</h2>
              <Link href={`/mdc/spielorte/${favouriteVenue.id}`}>
                <div className="mdc-card mdc-card-hover" style={{ padding: '20px', display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Trophy size={22} style={{ color: 'var(--mdc-red)', flexShrink: 0 }} />
                  <div>
                    <div className="mdc-display" style={{ fontSize: '1.3rem' }}>{favouriteVenue.name}</div>
                    <p style={{ marginTop: 5, fontSize: '0.86rem', color: 'var(--mdc-ink-soft)' }}>
                      {player.homeVenueId
                        ? 'Stammlokal — unter diesem Namen läuft der Spieler in der MDC-Wertung.'
                        : `Hier wurde in dieser Serie am häufigsten gespielt (${venueCounts.get(favouriteVenue.id)}×).`}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}

          <DemoNotice>
            Platzierung, Punkte und Schnitt der Saison 2025/26 stammen aus der
            offiziellen MDC-Auswertung. Turnierverlauf und Formkurve gehören zu
            den Demo-Turnieren dieser Vorschau. Fotos und persönliche Angaben
            werden bewusst nicht gezeigt — dafür liegt nichts vor.
          </DemoNotice>
        </div>
      </section>
    </>
  );
}
