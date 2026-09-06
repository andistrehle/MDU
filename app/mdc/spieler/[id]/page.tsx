import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Trophy } from 'lucide-react';
import { PlayerAvatar } from '@/components/mdc/player-avatar';
import { Sparkline } from '@/components/mdc/sparkline';

import { Dartboard } from '@/components/mdc/dartboard';
import { PLAYERS, getPlayer, playerName } from '@/data/players';
import { getFinalEntry, DIVISION_LABEL } from '@/data/ranking-final';
import { getSummerEntry, runningRankingOf } from '@/data/ranking';
import { appearancesOf } from '@/data/tournament-results';
import { getVenue, venueName } from '@/data/venues';
import { formatAverage, formatDate, formatNumber } from '@/lib/mdc/format';
import { FINAL_SEASON, RUNNING_SEASON, SUMMER_SEASON, getSeason } from '@/data/season';

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

/** Verweis, wenn es eine Seite dazu gibt — sonst nur der Inhalt. */
function MaybeLink({ href, children }: { href: string | null; children: React.ReactNode }) {
  return href ? <Link href={href}>{children}</Link> : <>{children}</>;
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
  // Stand in der laufenden Wertung — beide Klassen durchsuchen, weil die
  // Wertungsklasse des Stamms nicht die dieser Saison sein muss.
  const running = runningRankingOf('men').find(e => e.playerId === player.id)
    ?? runningRankingOf('women').find(e => e.playerId === player.id);
  // Jedes Turnier, bei dem der Spieler angetreten ist — beide Saisons, neueste
  // zuerst. Genau diese Punkte ergeben aufaddiert die Wertungen oben.
  const history = appearancesOf(player.id);
  const summerSeason = SUMMER_SEASON;

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
  // Lokale, in denen heute nicht mehr gespielt wird, haben keine eigene
  // Seite — der Name steht trotzdem da, nur ohne Verweis.
  const favouriteVenue = favouriteVenueId
    ? { id: favouriteVenueId, name: venueName(favouriteVenueId), page: getVenue(favouriteVenueId) }
    : undefined;

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

          {/* ── Laufende Saison ── */}
          {running && (
            <div>
              <h2 className="mdc-display mdc-h3" style={{ marginBottom: 6 }}>
                Saison {RUNNING_SEASON.label} · laufend
              </h2>
              <p style={{ color: 'var(--mdc-ink-soft)', fontSize: '0.88rem', marginBottom: 16 }}>
                Stand vom {formatDate(RUNNING_SEASON.asOf)} ·{' '}
                {DIVISION_LABEL[player.division]}wertung
              </p>

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))' }}>
                <Tile label="Platz" value={`${running.rank}.`} />
                <Tile label="Punkte" value={formatNumber(running.points)} />
                <Tile label="Anzahl TN" value={String(running.tournaments)} />
                <Tile label="Schnitt" value={formatAverage(running.average)} />
                <Tile
                  label="Beste Platzierung"
                  value={`${running.bestFinish}.`}
                  sub={running.wins > 0 ? `${running.wins} Turniersieg${running.wins > 1 ? 'e' : ''}` : undefined}
                />
              </div>
            </div>
          )}

          {/* ── Saison-Endstand ── */}
          <div>
            <h2 className="mdc-display mdc-h3" style={{ marginBottom: 6 }}>
              Endstand Saison {FINAL_SEASON.label} · Archiv
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
                In der Endrangliste {FINAL_SEASON.label} steht dieser Spieler nicht —
                gewertet wird dort nur, wer in der Saison mindestens einmal
                angetreten ist.
              </p>
            )}
          </div>

          {/* ── Sommer-Ranking (Archiv) ── */}
          {summer && (
            <div>
              <h2 className="mdc-display mdc-h3" style={{ marginBottom: 6 }}>
                {summerSeason.label} · Archiv
              </h2>
              <p style={{ color: 'var(--mdc-ink-soft)', fontSize: '0.88rem', marginBottom: 16 }}>
                Endstand vom {formatDate(summerSeason.asOf)}
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
              <h2 className="mdc-display mdc-h3" style={{ marginBottom: 6 }}>
                Gespielte Turniere
              </h2>
              <p style={{ color: 'var(--mdc-ink-soft)', fontSize: '0.88rem', marginBottom: 16 }}>
                {history.length === 1 ? 'Ein Start' : `${history.length} Starts`} · zusammen{' '}
                {formatNumber(history.reduce((sum, h) => sum + h.result.points, 0))} Punkte ·
                neueste zuerst
              </p>

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
                      <th className="mdc-hide-narrow">Datum</th>
                      <th>Turnier</th>
                      <th className="mdc-hide-narrow">Saison</th>
                      <th className="mdc-td-num">Platz</th>
                      <th className="mdc-td-num mdc-hide-narrow">Feld</th>
                      <th className="mdc-td-num">Punkte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(({ tournament, result }) => (
                      <tr key={tournament.id}>
                        <td className="mdc-num mdc-hide-narrow" style={{ color: 'var(--mdc-ink-soft)' }}>
                          {formatDate(tournament.date)}
                        </td>
                        <td className="mdc-cell-name">
                          <Link href={`/mdc/turniere/ergebnisse/${tournament.id}`} style={{ color: 'var(--mdc-ink)' }}>
                            Ranking im {tournament.venueName}
                          </Link>
                          {/* Am Handy fallen Datum, Spielort und Feldgröße als Spalten weg. */}
                          <span className="mdc-narrow-only mdc-row-meta">
                            {formatDate(tournament.date)} · {tournament.participants} Starter
                          </span>
                        </td>
                        <td className="mdc-hide-narrow mdc-num" style={{ color: 'var(--mdc-ink-soft)' }}>
                          {getSeason(tournament.seasonId)?.label ?? tournament.seasonId}
                        </td>
                        <td
                          className="mdc-td-num mdc-num"
                          style={{ fontWeight: 700, color: result.rank <= 3 ? 'var(--mdc-gold)' : 'var(--mdc-ink)' }}
                        >
                          {result.rank}.
                        </td>
                        <td className="mdc-td-num mdc-num mdc-hide-narrow" style={{ color: 'var(--mdc-ink-soft)' }}>
                          {tournament.participants}
                        </td>
                        <td className="mdc-td-num mdc-num" style={{ fontWeight: 700 }}>
                          {formatNumber(result.points)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Lieblingslokal ── */}
          {favouriteVenue && (
            <div>
              <h2 className="mdc-display mdc-h3" style={{ marginBottom: 16 }}>Lieblingslokal</h2>
              <MaybeLink href={favouriteVenue.page ? `/mdc/spielorte/${favouriteVenue.id}` : null}>
                <div className="mdc-card mdc-card-hover" style={{ padding: '20px', display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Trophy size={22} style={{ color: 'var(--mdc-red)', flexShrink: 0 }} />
                  <div>
                    <div className="mdc-display" style={{ fontSize: '1.3rem' }}>{favouriteVenue.name}</div>
                    <p style={{ marginTop: 5, fontSize: '0.86rem', color: 'var(--mdc-ink-soft)' }}>
                      {player.homeVenueId
                        ? 'Stammlokal — unter diesem Namen läuft der Spieler in der MDC-Wertung.'
                        : `Hier wurde am häufigsten gespielt (${venueCounts.get(favouriteVenue.id)}×).`}
                    </p>
                  </div>
                </div>
              </MaybeLink>
            </div>
          )}

          <p style={{ fontSize: '0.84rem', color: 'var(--mdc-ink-dim)', lineHeight: 1.65, maxWidth: 680 }}>
            Alles auf dieser Seite kommt aus den Auswertungen des Betreibers:
            Platzierung, Punkte und Schnitt jeder Wertung, dazu jedes einzelne
            Turnier. Die Punkte der Turnierliste ergeben aufaddiert genau die
            Punktzahl der jeweiligen Saison. Wie viele Legs gespielt wurden,
            führt die Auswertung nicht — deshalb steht hier keine Leg-Statistik.
            Fotos und persönliche Angaben werden bewusst nicht gezeigt; dafür
            liegt nichts vor.
          </p>
        </div>
      </section>
    </>
  );
}
