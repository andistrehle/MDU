import type { Metadata } from 'next';
import { PageHero, SectionHeading } from '@/components/mdc/ui';
import { VenueCard } from '@/components/mdc/venue-card';
import { VENUES, venuesByWeekday, WEEKDAY_NAMES } from '@/data/venues';

export const metadata: Metadata = {
  title: 'Spielorte',
  description:
    'Die zehn Spielorte der Munich Dart Challenge — mit Spieltag, Startzeit, Adresse und Anzahl der Dartautomaten.',
};

export default function SpielortePage() {
  const byDay = venuesByWeekday();
  const boards = VENUES.reduce((sum, venue) => sum + venue.boards, 0);

  return (
    <>
      <PageHero
        kicker="Wo gespielt wird"
        title="Spielorte"
        description={`Zehn Lokale von Giesing bis ins Würmtal, zusammen ${boards} Dartautomaten. Jeder Spielort hat seinen festen Wochentag — wer weiß, wo Montag gespielt wird, braucht keinen Kalender.`}
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 44 }}>
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
