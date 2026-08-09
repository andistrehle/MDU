// ============================================================
// MDC — Spielort-Karte
// ============================================================

import Link from 'next/link';
import { ArrowRight, MapPin, Phone, Target } from 'lucide-react';
import type { Venue } from '@/data/types';
import { venueAddress, venueMapsUrl, venueWeekdayShort } from '@/data/venues';
import { formatTime } from '@/lib/mdc/format';

interface VenueCardProps {
  venue: Venue;
  /** Kompakt = ohne Beschreibung, für die Wochenübersicht auf der Startseite. */
  compact?: boolean;
}

export function VenueCard({ venue, compact = false }: VenueCardProps) {
  return (
    <article
      className="mdc-card mdc-card-hover"
      style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h3 className="mdc-display mdc-h3" style={{ lineHeight: 1 }}>{venue.name}</h3>
          <p style={{ marginTop: 6, fontSize: '0.84rem', color: 'var(--mdc-ink-soft)' }}>
            {venue.district}
          </p>
        </div>
        <span className="mdc-chip mdc-chip-red" style={{ flexShrink: 0 }}>
          {venueWeekdayShort(venue)} · {venue.time}
        </span>
      </div>

      {!compact && (
        <p style={{ marginTop: 14, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--mdc-ink-soft)' }}>
          {venue.description}
        </p>
      )}

      <dl style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9, fontSize: '0.85rem' }}>
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
          <dt style={{ color: 'var(--mdc-red)', marginTop: 1 }}><MapPin size={15} /></dt>
          <dd>
            <a href={venueMapsUrl(venue)} target="_blank" rel="noreferrer noopener" style={{ color: 'var(--mdc-ink-soft)' }}>
              {venueAddress(venue)}
            </a>
          </dd>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <dt style={{ color: 'var(--mdc-red)' }}><Phone size={15} /></dt>
          <dd style={{ color: 'var(--mdc-ink-soft)' }}>{venue.phone}</dd>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <dt style={{ color: 'var(--mdc-red)' }}><Target size={15} /></dt>
          <dd style={{ color: 'var(--mdc-ink-soft)' }}>
            {venue.boards} Dartautomaten · Start {formatTime(venue.time)}
          </dd>
        </div>
      </dl>

      <div style={{ marginTop: 'auto', paddingTop: 18 }}>
        <Link href={`/mdc/spielorte/${venue.id}`} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
          Details
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
