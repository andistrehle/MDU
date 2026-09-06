// ============================================================
// MDC — ein einzelnes Turnier
// ============================================================
//
// Zeigt genau das, was in der Auswertung des Betreibers steht: Platzierung,
// Passnummer und Punkte. Legs, Turnierbaum und Meldestand führt die Mappe
// nicht — hier steht deshalb auch keiner.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarClock, MapPin, Users } from 'lucide-react';
import { PlayerAvatar } from '@/components/mdc/player-avatar';
import { Dartboard } from '@/components/mdc/dartboard';
import {
  ALL_TOURNAMENTS, getTournamentRecord, tournamentsAtVenue,
} from '@/data/tournament-results';
import { getVenue, venueAddress } from '@/data/venues';
import { getPlayer, playerName } from '@/data/players';
import { correctionsFor } from '@/data/corrections';
import { rankGroupLabel } from '@/lib/mdc/points';
import { formatDateLong, formatNumber } from '@/lib/mdc/format';
import { getSeason } from '@/data/season';

export function generateStaticParams() {
  return ALL_TOURNAMENTS.map(t => ({ id: t.id }));
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await props.params;
  const turnier = getTournamentRecord(id);
  if (!turnier) return { title: 'Turnier' };
  return {
    title: `${turnier.venueName}, ${formatDateLong(turnier.date)}`,
    description:
      `Ergebnisliste des MDC-Rankings am ${formatDateLong(turnier.date)} im ${turnier.venueName}: ` +
      `${turnier.participants} Starter, Plätze und Punkte.`,
  };
}

const MEDAL = ['var(--mdc-gold)', 'var(--mdc-silver)', 'var(--mdc-bronze)'];
const PODIUM_HEIGHT = [128, 100, 82];

export default async function ArchivTurnierPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const turnier = getTournamentRecord(id);
  if (!turnier) notFound();

  const venue = getVenue(turnier.venueId);
  // Bekannte Abweichung zwischen Ergebniszettel und Auswertung (data/corrections.ts).
  const abweichungen = correctionsFor(turnier.id);
  const top3 = turnier.results.slice(0, 3);
  const punkteGesamt = turnier.results.reduce((sum, r) => sum + r.points, 0);

  // Nachbarn im selben Lokal — so kann man sich durch die Saison klicken.
  const amOrt = tournamentsAtVenue(turnier.venueId, turnier.seasonId);
  const index = amOrt.findIndex(t => t.id === turnier.id);
  const neuer = index > 0 ? amOrt[index - 1] : undefined;
  const aelter = index >= 0 && index < amOrt.length - 1 ? amOrt[index + 1] : undefined;

  return (
    <>
      <section className="mdc-hero">
        <Dartboard className="mdc-hero-board mdc-spin-slow" showNumbers={false} tone="brand" />
        <div className="mdc-shell" style={{ position: 'relative', zIndex: 2, paddingBlock: '40px 44px' }}>
          <div style={{ marginBottom: 18 }}>
            <Link href="/mdc/turniere/ergebnisse" className="mdc-chip">
              <ArrowLeft size={13} />
              Alle Turniere
            </Link>
          </div>

          <span className="mdc-kicker">
            Ranking-Turnier · Saison {getSeason(turnier.seasonId)?.label ?? turnier.seasonId}
          </span>
          <h1 className="mdc-display mdc-h2" style={{ marginTop: 12 }}>
            {turnier.venueName}
          </h1>

          <div
            style={{
              display: 'flex', flexWrap: 'wrap', gap: '10px 22px', marginTop: 16,
              fontSize: '0.9rem', color: 'var(--mdc-ink-soft)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <CalendarClock size={15} style={{ color: 'var(--mdc-red)' }} />
              {formatDateLong(turnier.date)}
            </span>
            {venue && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <MapPin size={15} style={{ color: 'var(--mdc-red)' }} />
                <Link href={`/mdc/spielorte/${venue.id}`}>{venueAddress(venue)}</Link>
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Users size={15} style={{ color: 'var(--mdc-red)' }} />
              {turnier.participants} Starter · {formatNumber(punkteGesamt)} Punkte vergeben
            </span>
          </div>

          {turnier.formerVenue && (
            <p style={{ marginTop: 14, fontSize: '0.86rem', color: 'var(--mdc-ink-dim)', maxWidth: 620 }}>
              In diesem Lokal wird in der laufenden Saison nicht mehr gespielt — es
              steht deshalb nur mit dem Namen im Archiv, ohne eigene Spielort-Seite.
            </p>
          )}
        </div>
      </section>

      {top3.length === 3 && (
        <section style={{ paddingBlock: '44px 0' }}>
          <div className="mdc-shell">
            <div className="mdc-card mdc-card-accent" style={{ padding: '28px 20px 24px' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  gap: 'clamp(6px, 2.4vw, 28px)', flexWrap: 'nowrap',
                }}
              >
                {[top3[1], top3[0], top3[2]].map(result => {
                  const player = result.playerId ? getPlayer(result.playerId) : undefined;
                  const platz = result.rank;
                  return (
                    <div key={result.passNr} style={{ textAlign: 'center', width: 'min(158px, 27vw)' }}>
                      {player && <PlayerAvatar player={player} size={platz === 1 ? 56 : 46} highlight={platz === 1} />}
                      {player ? (
                        <Link
                          href={`/mdc/spieler/${player.id}`}
                          className="mdc-display"
                          style={{ display: 'block', fontSize: platz === 1 ? '1.15rem' : '1rem', marginTop: 10 }}
                        >
                          {playerName(player)}
                        </Link>
                      ) : (
                        <span className="mdc-display" style={{ display: 'block', marginTop: 10 }}>
                          Passnr. {result.passNr}
                        </span>
                      )}
                      <div className="mdc-num" style={{ fontSize: '0.82rem', color: 'var(--mdc-ink-soft)', marginTop: 4 }}>
                        {formatNumber(result.points)} Punkte
                      </div>
                      <div
                        style={{
                          marginTop: 12,
                          height: PODIUM_HEIGHT[platz - 1],
                          borderRadius: '8px 8px 0 0',
                          background: `linear-gradient(180deg, ${MEDAL[platz - 1]}33, transparent)`,
                          border: `1px solid ${MEDAL[platz - 1]}55`,
                          borderBottom: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <span className="mdc-display" style={{ fontSize: '2.2rem', color: MEDAL[platz - 1] }}>
                          {platz}
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

      <section className="mdc-section">
        <div className="mdc-shell">
          {abweichungen.map(hinweis => (
            <div
              key={hinweis.tournamentId}
              className="mdc-card"
              style={{
                display: 'flex', gap: 12, padding: '14px 16px', marginBottom: 22,
                borderColor: 'var(--mdc-red-a35)', background: 'var(--mdc-red-a08)',
                fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-ink-soft)',
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
              <p>
                <strong>Ungeklärte Abweichung:</strong> {hinweis.note}
              </p>
            </div>
          ))}

          <h2 className="mdc-display mdc-h3" style={{ marginBottom: 16 }}>Ergebnisliste</h2>

          <div className="mdc-card">
            <table className="mdc-table">
              <thead>
                <tr>
                  <th>Platz</th>
                  <th>Spieler</th>
                  <th className="mdc-hide-narrow">Passnr.</th>
                  <th className="mdc-td-num mdc-hide-narrow">Wertung</th>
                  <th className="mdc-td-num">Punkte</th>
                </tr>
              </thead>
              <tbody>
                {turnier.results.map(result => {
                  const player = result.playerId ? getPlayer(result.playerId) : undefined;
                  const podiumClass = result.rank <= 3 ? `mdc-row-${result.rank}` : '';
                  return (
                    <tr key={result.passNr} className={podiumClass}>
                      <td className={`mdc-num ${podiumClass}`} style={{ fontWeight: 700 }}>
                        {result.rank}
                      </td>
                      <td className="mdc-cell-name">
                        {player ? (
                          <Link
                            href={`/mdc/spieler/${player.id}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                          >
                            <PlayerAvatar player={player} size={28} />
                            <span style={{ color: 'var(--mdc-ink)', fontWeight: 600 }}>
                              {playerName(player)}
                            </span>
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--mdc-ink-soft)' }}>Passnr. {result.passNr}</span>
                        )}
                        <span className="mdc-row-meta mdc-narrow-only">
                          Passnr. {result.passNr} · {rankGroupLabel(result.rank)}
                        </span>
                      </td>
                      <td className="mdc-num mdc-hide-narrow" style={{ color: 'var(--mdc-ink-soft)' }}>
                        {result.passNr}
                      </td>
                      <td className="mdc-td-num mdc-hide-narrow" style={{ color: 'var(--mdc-ink-dim)', fontSize: '0.82rem' }}>
                        {rankGroupLabel(result.rank)}
                      </td>
                      <td className="mdc-td-num mdc-num" style={{ fontWeight: 700, color: 'var(--mdc-ink)' }}>
                        {formatNumber(result.points)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: 14, fontSize: '0.84rem', color: 'var(--mdc-ink-dim)', maxWidth: 680, lineHeight: 1.6 }}>
            Die Punkte richten sich nach Platz und Feldgröße — bei {turnier.participants}{' '}
            Startern gibt es für Platz 1 genau {formatNumber(turnier.results[0].points)}{' '}
            Punkte. Ab Platz 9 teilen sich mehrere Plätze dieselbe Punktzahl, deshalb die
            Spalte {'„Wertung“'}. Wie viele Legs gespielt wurden, führt die Auswertung nicht.
          </p>

          {(neuer || aelter) && (
            <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {aelter && (
                <Link href={`/mdc/turniere/ergebnisse/${aelter.id}`} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
                  <ArrowLeft size={15} />
                  Vorheriges im {turnier.venueName}
                </Link>
              )}
              {neuer && (
                <Link href={`/mdc/turniere/ergebnisse/${neuer.id}`} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
                  Nächstes im {turnier.venueName}
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
