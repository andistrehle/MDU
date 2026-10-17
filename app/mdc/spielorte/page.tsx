import type { Metadata } from 'next';
import { KeyRound } from 'lucide-react';
import { PageHero, SectionHeading } from '@/components/mdc/ui';
import { VenueCard } from '@/components/mdc/venue-card';
import {
  FLEXIBLE_RANKING_DAYS, FLEXIBLE_RANKING_NOTE, VENUES,
  venuesByWeekday, WEEKDAY_NAMES,
} from '@/data/venues';
import { mdcSeite } from '@/lib/mdc/metadata';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = mdcSeite({
  pfad: '/spielorte',
  title: 'Spielorte',
  description:
    'Die Spielorte der Munich Darts Challenge — mit Spieltag, Startzeit, Adresse und Anzahl der Dartautomaten.',
});

export default function SpielortePage() {
  const byDay = venuesByWeekday();
  // Lokale ohne bekannte Automatenzahl zählen nicht mit — eine Summe, in der
  // geschätzte Zahlen steckten, wäre schlechter als eine, die etwas auslässt.
  const boards = VENUES.reduce((sum, venue) => sum + (venue.boards ?? 0), 0);

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

          {/* ── Zugang für die Wirte ──
              Hier und nicht in der Hauptnavigation: Wer ein Lokal betreibt,
              landet früher oder später auf dieser Seite; alle anderen geht der
              Zugang nichts an.

              ALS <a>, NICHT ALS `Link`. Next lädt Ziele im Blickfeld schon
              vorab, und ein Vorabruf auf `/admin/...` beantwortet der Wächter
              mit 401 — der Browser fragt dann mitten im Scrollen nach dem
              Passwort, bei jedem Besucher. Ein `<a>` lädt erst beim Tippen,
              und dann ist die Abfrage gewollt. */}
          <div
            className="mdc-card"
            style={{ padding: '22px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
          >
            <KeyRound size={20} style={{ flexShrink: 0, marginTop: 3, color: 'var(--mdc-red)' }} />
            <div style={{ minWidth: 0 }}>
              <h2 className="mdc-display mdc-h3">Wirte-Login</h2>
              <p style={{ marginTop: 10, fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)', maxWidth: 640 }}>
                Ihr macht am Freitag, Samstag oder Sonntag ein Ranking? Tragt den Abend
                selbst ein — er steht dann im Wochenplan, auf der Startseite und bei
                eurem Lokal. Das Passwort dafür gibt es bei der Turnierleitung; der
                Browser fragt danach, der Benutzername ist beliebig.
              </p>
              <a
                href={mdcPath('/admin/ansetzen')}
                className="mdc-btn mdc-btn-primary mdc-btn-sm"
                style={{ marginTop: 14 }}
              >
                <KeyRound size={15} />
                Anmelden und Termin ansetzen
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
