import type { Metadata } from 'next';
import Link from 'next/link';
import { ListOrdered } from 'lucide-react';
import { PageHero, SectionHeading, DemoNotice } from '@/components/mdc/ui';
import { TournamentCard } from '@/components/mdc/tournament-card';
import { finishedTournaments, upcomingTournaments } from '@/data/tournaments';
import { formatDate } from '@/lib/mdc/format';
import { getCurrentSeason, FINAL_SEASON } from '@/data/season';
import { ARCHIVE_STATS } from '@/data/archive-2025-26';

export const metadata: Metadata = {
  title: 'Turniere',
  description:
    'Alle MDC-Turniere: kommende Termine mit Meldestand und gespielte Ranglisten­turniere ' +
    'mit Podium, Ergebnisliste und Turnierbaum.',
};

export default function TurnierePage() {
  const upcoming = upcomingTournaments();
  const finished = finishedTournaments();
  const season = getCurrentSeason();

  return (
    <>
      <PageHero
        kicker="Spielbetrieb"
        title="Turniere"
        description={`Montag bis Donnerstag wird gespielt — vier bis 32 Starter pro Turnier, immer im Doppel-K.-o. Stand: ${formatDate(season.asOf)}.`}
      />

      <section className="mdc-section" id="naechste">
        <div className="mdc-shell">
          <SectionHeading
            kicker="Kommende Termine"
            title="Nächste Rankings"
            description="Anmelden kann man sich direkt im Lokal bis kurz vor Turnierstart. Der Meldestand zeigt, wie voll es schon ist."
          />

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {upcoming.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>

          {upcoming.length === 0 && (
            <p className="mdc-lead">Zurzeit sind keine Termine eingetragen.</p>
          )}
        </div>
      </section>

      <section
        className="mdc-section mdc-section-tint"
        id="vergangene"
      >
        <div className="mdc-shell">
          <SectionHeading
            kicker="Archiv"
            title="Gespielte Turniere"
            description="Jedes gespielte Turnier mit Siegerpodium, kompletter Ergebnisliste, vergebenen Punkten und Turnierbaum."
          />

          <div style={{ marginBottom: 22, display: 'grid', gap: 14 }}>
            <DemoNotice>
              Diese Turnierergebnisse sind Demo-Material und zahlen auf keine
              Rangliste ein — sie zeigen, wie ein Turnier mit Podium,
              Ergebnisliste und Turnierbaum aussieht. Echt sind die{' '}
              {ARCHIVE_STATS.tournaments} Ranking-Turniere der Saison{' '}
              {FINAL_SEASON.label} im Turnierarchiv.
            </DemoNotice>
            <div>
              <Link href="/mdc/turniere/archiv" className="mdc-btn mdc-btn-primary">
                <ListOrdered size={18} />
                Turnierarchiv {FINAL_SEASON.label}
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
            {finished.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
