import type { Metadata } from 'next';
import { PageHero, SectionHeading } from '@/components/mdc/ui';
import { VenueCard } from '@/components/mdc/venue-card';
import {
  FLEXIBLE_RANKING_DAYS, FLEXIBLE_RANKING_NOTE, VENUES,
  venuesByWeekday, WEEKDAY_NAMES,
} from '@/data/venues';

export const metadata: Metadata = {
  title: 'Spielorte',
  description:
    'Die Spielorte der Munich Darts Challenge — mit Spieltag, Startzeit, Adresse und Anzahl der Dartautomaten.',
};

export default function SpielortePage() {
  const byDay = venuesByWeekday();
  const boards = VENUES.reduce((sum, venue) => sum + venue.boards, 0);

  return (
    <>
      <PageHero
        kicker="Wo gespielt wird"
        title="Spielorte"
        description={`${VENUES.length} Lokale in München und im Würmtal, zusammen ${boards} Dartautomaten. Jeder Spielort hat seinen festen Wochentag — wer weiß, wo Montag gespielt wird, braucht keinen Kalender.`}
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
          {/* Zusätzlich zu den festen Spieltagen: An diesen Tagen kann in jedem
              MDC-Lokal gespielt werden, wenn genug Leute da sind. */}
          <div className="mdc-card mdc-card-accent" style={{ padding: '22px 20px' }}>
            <h2 className="mdc-display mdc-h3">Ranking in allen Lokalen möglich</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {FLEXIBLE_RANKING_DAYS.map(day => (
                <span key={day.label} className="mdc-chip mdc-chip-red">{day.label}</span>
              ))}
            </div>
            <p style={{ marginTop: 14, fontSize: '0.92rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)', maxWidth: 640 }}>
              {FLEXIBLE_RANKING_NOTE} An den Tagen unten gibt es feste Termine —
              an diesen zusätzlich, wenn sich genug Leute finden.
            </p>
          </div>

          {byDay.map(day => (
            <div key={day.weekday}>
              <SectionHeading
                kicker={`${day.venues.length} Turniere`}
                title={WEEKDAY_NAMES[day.weekday]}
              />
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {day.venues.map(venue => (
                  <VenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
