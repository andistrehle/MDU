// ============================================================
// MDC — Turnierkarte
// ============================================================
//
// Zeigt gespielte Turniere mit Podium und kommende mit Meldestand.
// ============================================================

import Link from 'next/link';
import { ArrowRight, MapPin, Users } from 'lucide-react';
import type { Tournament } from '@/data/types';
import { getVenue } from '@/data/venues';
import { getPlayer, playerName } from '@/data/players';
import { podium, freeSlots } from '@/data/tournaments';
import { formatDate, formatDateShort, formatNumber, formatTime } from '@/lib/mdc/format';

const MEDAL = ['var(--mdc-gold)', 'var(--mdc-silver)', 'var(--mdc-bronze)'];

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  const venue = getVenue(tournament.venueId);
  const finished = tournament.status === 'finished';
  const top3 = finished ? podium(tournament) : [];
  const free = freeSlots(tournament);

  return (
    <article className="mdc-card mdc-card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span className="mdc-chip mdc-chip-red">{formatDateShort(tournament.date)}</span>
          <span className="mdc-chip">{formatTime(tournament.time)}</span>
          {!finished && free > 0 && (
            <span className="mdc-chip">{free} Plätze frei</span>
          )}
          {!finished && free === 0 && (
            <span className="mdc-chip mdc-chip-red">ausgebucht</span>
          )}
        </div>

        <h3 className="mdc-display mdc-h3" style={{ lineHeight: 1 }}>
          {venue?.name ?? 'Spielort offen'}
        </h3>
        <p style={{ marginTop: 6, fontSize: '0.86rem', color: 'var(--mdc-ink-soft)' }}>
          {tournament.name} · {formatDate(tournament.date)}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 14, fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} />
            {finished
              ? `${tournament.results.length} Teilnehmer`
              : `${tournament.participantIds.length} von ${tournament.maxPlayers} gemeldet`}
          </span>
          {venue && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} />
              {venue.zip} {venue.city}
            </span>
          )}
        </div>
      </div>

      {top3.length > 0 && (
        <ol style={{ margin: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {top3.map(result => {
            const player = getPlayer(result.playerId);
            if (!player) return null;
            return (
              <li
                key={result.playerId}
                style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}
              >
                <span
                  className="mdc-num"
                  style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${MEDAL[result.rank - 1]}`,
                    color: MEDAL[result.rank - 1], fontSize: '0.7rem', fontWeight: 700,
                  }}
                >
                  {result.rank}
                </span>
                <span style={{ color: 'var(--mdc-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {playerName(player)}
                </span>
                <span className="mdc-num" style={{ marginLeft: 'auto', color: 'var(--mdc-ink-soft)' }}>
                  {formatNumber(result.points)}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div style={{ padding: '18px 20px 20px', marginTop: 'auto' }}>
        <Link href={`/mdc/turniere/${tournament.id}`} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
          {finished ? 'Turnier ansehen' : 'Details'}
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
