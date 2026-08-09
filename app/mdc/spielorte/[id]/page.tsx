import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, MapPin, Phone, Target } from 'lucide-react';
import { Dartboard } from '@/components/mdc/dartboard';
import { TournamentCard } from '@/components/mdc/tournament-card';
import { VENUES, getVenue, venueMapsUrl, venueWeekdayLabel } from '@/data/venues';
import { tournamentsAtVenue } from '@/data/tournaments';
import { formatTime } from '@/lib/mdc/format';

export function generateStaticParams() {
  return VENUES.map(venue => ({ id: venue.id }));
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await props.params;
  const venue = getVenue(id);
  if (!venue) return { title: 'Spielort' };
  return {
    title: venue.name,
    description: `MDC-Spielort ${venue.name} in ${venue.district}: ${venueWeekdayLabel(venue)} ab ${venue.time} Uhr, ${venue.boards} Dartautomaten.`,
  };
}

export default async function SpielortDetailPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const venue = getVenue(id);
  if (!venue) notFound();

  const tournaments = tournamentsAtVenue(venue.id);
  // Kommende Termine aufsteigend (der nächste zuerst), gespielte absteigend
  // (das letzte zuerst) — `tournamentsAtVenue` sortiert für den zweiten Fall.
  const upcoming = tournaments
    .filter(t => t.status !== 'finished')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const finished = tournaments.filter(t => t.status === 'finished');

  return (
    <>
      <section className="mdc-hero">
        <Dartboard className="mdc-hero-board mdc-spin-slow" showNumbers={false} tone="brand" />
        <div className="mdc-shell" style={{ position: 'relative', zIndex: 2, paddingBlock: '36px 44px' }}>
          <Link href="/mdc/spielorte" className="mdc-chip" style={{ marginBottom: 18 }}>
            <ArrowLeft size={13} />
            Alle Spielorte
          </Link>

          <span className="mdc-kicker">{venue.district}</span>
          <h1 className="mdc-display mdc-h2" style={{ marginTop: 12 }}>{venue.name}</h1>
          <p className="mdc-lead" style={{ marginTop: 14, maxWidth: 640 }}>{venue.description}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
            <span className="mdc-chip mdc-chip-red">
              {venueWeekdayLabel(venue)} · {formatTime(venue.time)}
            </span>
            {venue.tags.map(tag => (
              <span key={tag} className="mdc-chip">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <div className="mdc-card" style={{ padding: '20px' }}>
              <MapPin size={19} style={{ color: 'var(--mdc-red)' }} />
              <h2 className="mdc-display" style={{ fontSize: '1.05rem', marginTop: 10 }}>Adresse</h2>
              <p style={{ marginTop: 7, color: 'var(--mdc-ink-soft)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {venue.street}<br />{venue.zip} {venue.city}
              </p>
              <a
                href={venueMapsUrl(venue)}
                target="_blank"
                rel="noreferrer noopener"
                className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                style={{ marginTop: 14 }}
              >
                Auf der Karte
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="mdc-card" style={{ padding: '20px' }}>
              <Phone size={19} style={{ color: 'var(--mdc-red)' }} />
              <h2 className="mdc-display" style={{ fontSize: '1.05rem', marginTop: 10 }}>Kontakt</h2>
              <p className="mdc-num" style={{ marginTop: 7, color: 'var(--mdc-ink-soft)', fontSize: '0.95rem' }}>
                {venue.phone}
              </p>
              <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--mdc-ink-dim)', lineHeight: 1.55 }}>
                Platzhalternummer für diese Vorschau — die echten Nummern kommen
                vom Betreiber.
              </p>
            </div>

            <div className="mdc-card" style={{ padding: '20px' }}>
              <Target size={19} style={{ color: 'var(--mdc-red)' }} />
              <h2 className="mdc-display" style={{ fontSize: '1.05rem', marginTop: 10 }}>Spielbetrieb</h2>
              <p style={{ marginTop: 7, color: 'var(--mdc-ink-soft)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                {venue.boards} Dartautomaten<br />
                {venueWeekdayLabel(venue)}, Start {formatTime(venue.time)}<br />
                {finished.length} gespielte Turniere in dieser Serie
              </p>
            </div>
          </div>

          {upcoming.length > 0 && (
            <div>
              <h2 className="mdc-display mdc-h3" style={{ marginBottom: 16 }}>Nächste Termine</h2>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
                {upcoming.map(tournament => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </div>
          )}

          {finished.length > 0 && (
            <div>
              <h2 className="mdc-display mdc-h3" style={{ marginBottom: 16 }}>Letzte Turniere</h2>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
                {finished.map(tournament => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
