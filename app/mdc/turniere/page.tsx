// ============================================================
// MDC — Turniere
// ============================================================
//
// Zwei Teile, beide aus echten Daten:
//
//   1. Kommende Termine — gerechnet aus den Spielorten (fester Wochentag,
//      feste Uhrzeit je Lokal). Keine Meldestände: Angemeldet wird im Lokal,
//      die MDC führt darüber keine Liste, also behauptet die Seite auch keine.
//   2. Die zuletzt gespielten Turniere und der Weg zur vollständigen
//      Ergebnisübersicht beider Saisons.
//
// Hier standen früher erfundene Demo-Turniere mit Meldestand, Legs und
// Turnierbaum. Die sind raus, seit die echten Ergebnisse vorliegen.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarClock, ListOrdered, Target, Users } from 'lucide-react';
import { PageHero, SectionHeading, StatCard } from '@/components/mdc/ui';
import { TournamentCard } from '@/components/mdc/result-card';
import {
  FLEXIBLE_RANKING_DAYS, FLEXIBLE_RANKING_NOTE, playDaysFrom, venueAddress,
} from '@/data/venues';
import { ARCHIVE_STATS, RUNNING_STATS, tournamentsOfSeasonDesc } from '@/data/tournament-results';
import { FINAL_SEASON, RUNNING_SEASON, todayInMunich } from '@/data/season';
import { formatDate, formatNumber, formatTime, weekdayName } from '@/lib/mdc/format';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  title: 'Turniere',
  description:
    'Die nächsten MDC-Ranking-Termine in den Münchner Lokalen — dazu die zuletzt ' +
    `gespielten Turniere und das Archiv mit allen ${ARCHIVE_STATS.tournaments} Turnieren ` +
    `der Saison ${FINAL_SEASON.label}.`,
};

export default function TurnierePage() {
  const heute = todayInMunich();
  const termine = playDaysFrom(heute, 14);
  const letzte = tournamentsOfSeasonDesc(RUNNING_SEASON.id).slice(0, 3);

  return (
    <>
      <PageHero
        kicker="Spielbetrieb"
        title="Turniere"
        description="Montag bis Donnerstag wird in den MDC-Lokalen gespielt, dazu am Wochenende nach Absprache. Vier bis 32 Starter pro Turnier, immer im Doppel-K.-o. — anmelden kann man sich direkt im Lokal bis kurz vor Turnierstart."
      />

      <section className="mdc-section" id="naechste">
        <div className="mdc-shell">
          <SectionHeading
            kicker="Kommende Termine"
            title="Die nächsten zwei Wochen"
            description="Jedes Lokal hat seinen festen Spieltag. Der Plan rechnet sich daraus — er kann also nicht veralten."
            action={{ label: 'Alle Spielorte', href: mdcPath('/spielorte') }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {termine.map(tag => (
              <div key={tag.date}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                  <h3 className="mdc-display" style={{ fontSize: '1.3rem' }}>
                    {tag.date === heute ? 'Heute' : weekdayName(tag.date)}
                  </h3>
                  <span className="mdc-num" style={{ fontSize: '0.84rem', color: 'var(--mdc-ink-dim)' }}>
                    {formatDate(tag.date)}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                  {tag.venues.map(venue => (
                    <div
                      key={venue.id}
                      className="mdc-card mdc-card-hover"
                      style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                        <h4 className="mdc-display" style={{ fontSize: '1.1rem' }}>{venue.name}</h4>
                        <span className="mdc-num" style={{ color: 'var(--mdc-red)', fontWeight: 700 }}>
                          {formatTime(venue.time)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--mdc-ink-soft)', lineHeight: 1.5 }}>
                        {venueAddress(venue)}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--mdc-ink-dim)', display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Target size={13} />
                        {venue.boards} Dartautomaten
                      </p>
                      <Link
                        href={mdcPath(`/spielorte/${venue.id}`)}
                        className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                        style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
                      >
                        Spielort
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Die flexiblen Tage sind keine Termine, sondern eine Möglichkeit. */}
          <div className="mdc-card" style={{ marginTop: 26, padding: '16px 18px', display: 'flex', gap: 12 }}>
            <CalendarClock size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
            <p style={{ fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
              Dazu kann an diesen Tagen in <strong>jedem</strong> MDC-Lokal ein Ranking
              stattfinden: {FLEXIBLE_RANKING_DAYS.map(d => d.label).join(' und ')}.{' '}
              {FLEXIBLE_RANKING_NOTE}
            </p>
          </div>

          <p style={{ marginTop: 18, fontSize: '0.84rem', color: 'var(--mdc-ink-dim)', maxWidth: 700, lineHeight: 1.65 }}>
            Wie viele schon da sind, steht hier nicht: Gemeldet wird im Lokal, und
            einen Meldestand führt die MDC nicht. Gespielte Turniere kommen dazu,
            sobald der Betreiber sie ausgewertet hat.
          </p>
        </div>
      </section>

      <section className="mdc-section mdc-section-tint" id="archiv">
        <div className="mdc-shell">
          <SectionHeading
            kicker="Ergebnisse"
            title="Zuletzt gespielt"
            description={`Jedes ausgewertete Turnier mit Podium, kompletter Ergebnisliste und den vergebenen Punkten. Diese Punkte aufaddiert ergeben die Rangliste der Saison ${RUNNING_SEASON.label}.`}
            action={{ label: 'Alle ansehen', href: mdcPath('/turniere/ergebnisse') }}
          />

          <div
            style={{
              display: 'grid', gap: 14, marginBottom: 26,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <StatCard
              icon={<CalendarClock size={17} />}
              label={`Turniere ${RUNNING_SEASON.label}`}
              value={formatNumber(RUNNING_STATS.tournaments)}
              sub={`seit ${formatDate(RUNNING_STATS.firstDate)}`}
              href={mdcPath('/turniere/ergebnisse')}
            />
            <StatCard
              icon={<Users size={17} />}
              label="Starts"
              value={formatNumber(RUNNING_STATS.entries)}
              sub={`von ${RUNNING_STATS.players} Spielern`}
            />
            <StatCard
              icon={<Target size={17} />}
              label={`Archiv ${FINAL_SEASON.label}`}
              value={formatNumber(ARCHIVE_STATS.tournaments)}
              sub={`Turniere, ${formatNumber(ARCHIVE_STATS.entries)} Starts`}
              href={mdcPath('/turniere/ergebnisse')}
            />
          </div>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}>
            {letzte.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <Link href={mdcPath('/turniere/ergebnisse')} className="mdc-btn mdc-btn-primary">
              <ListOrdered size={18} />
              Alle Turnierergebnisse
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
