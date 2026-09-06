// ============================================================
// MDC — alle Turnierergebnisse
// ============================================================
//
// Jedes Turnier, das der Betreiber ausgewertet hat: die laufende Saison und
// die abgeschlossene. Echte Turniere, echte Personen, direkt aus seinen
// Arbeitsmappen. Aus genau diesen Ergebnissen entsteht die Rangliste der
// jeweiligen Saison — die Punkte hier aufaddiert ergeben sie.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Archive, Building2, CalendarDays, Target, Users } from 'lucide-react';
import { PageHero, SectionHeading, StatCard } from '@/components/mdc/ui';
import { ResultsBrowser, type ResultRow } from '@/components/mdc/results-browser';
import {
  ALL_TOURNAMENTS, ARCHIVE_STATS, RUNNING_STATS, venuesOfSeason,
} from '@/data/tournament-results';
import { getPlayer, playerName } from '@/data/players';
import { FINAL_SEASON, RUNNING_SEASON } from '@/data/season';
import { formatDate, formatNumber } from '@/lib/mdc/format';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  title: 'Turnierergebnisse',
  description:
    `Alle ausgewerteten MDC-Turniere: die laufende Saison ${RUNNING_SEASON.label} und ` +
    `die ${ARCHIVE_STATS.tournaments} Turniere der Saison ${FINAL_SEASON.label} — ` +
    'jeweils mit vollständiger Ergebnisliste, Feldgröße und vergebenen Punkten.',
};

function rows(): ResultRow[] {
  return ALL_TOURNAMENTS.map(t => {
    const sieger = t.results[0].playerId ? getPlayer(t.results[0].playerId) : undefined;
    return {
      id: t.id,
      seasonId: t.seasonId,
      date: t.date,
      venueId: t.venueId,
      venue: t.venueName,
      participants: t.participants,
      winner: sieger ? playerName(sieger) : `Passnr. ${t.results[0].passNr}`,
      winnerId: sieger?.id ?? null,
    };
  });
}

export default function ErgebnissePage() {
  const spielorte = venuesOfSeason(FINAL_SEASON.id);

  return (
    <>
      <PageHero
        kicker="Ergebnisse"
        title="Alle Turniere"
        description={`Jedes ausgewertete Ranking-Turnier mit kompletter Ergebnisliste — die laufende Saison ${RUNNING_SEASON.label} seit dem ${formatDate(RUNNING_STATS.firstDate)} und die abgeschlossene Saison ${FINAL_SEASON.label} mit ${formatNumber(ARCHIVE_STATS.tournaments)} Turnieren.`}
      />

      <section className="mdc-section">
        <div className="mdc-shell">
          <div
            style={{
              display: 'grid', gap: 14, marginBottom: 34,
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            <StatCard
              icon={<CalendarDays size={17} />}
              label={`Turniere ${RUNNING_SEASON.label}`}
              value={formatNumber(RUNNING_STATS.tournaments)}
              sub={`seit ${formatDate(RUNNING_STATS.firstDate)}, ${formatNumber(RUNNING_STATS.entries)} Starts`}
            />
            <StatCard
              icon={<Archive size={17} />}
              label={`Turniere ${FINAL_SEASON.label}`}
              value={formatNumber(ARCHIVE_STATS.tournaments)}
              sub={`${formatDate(ARCHIVE_STATS.firstDate)} bis ${formatDate(ARCHIVE_STATS.lastDate)}`}
            />
            <StatCard
              icon={<Users size={17} />}
              label="Starts insgesamt"
              value={formatNumber(ARCHIVE_STATS.entries + RUNNING_STATS.entries)}
              sub={`von ${ARCHIVE_STATS.players} bzw. ${RUNNING_STATS.players} Spielern`}
            />
            <StatCard
              icon={<Target size={17} />}
              label="Vergebene Punkte"
              value={formatNumber(ARCHIVE_STATS.points + RUNNING_STATS.points)}
              sub="ergeben die Ranglisten"
            />
          </div>

          <ResultsBrowser
            rows={rows()}
            seasons={[
              { id: RUNNING_SEASON.id, label: `Saison ${RUNNING_SEASON.label}` },
              { id: FINAL_SEASON.id, label: `Saison ${FINAL_SEASON.label}` },
            ]}
            initialSeason={RUNNING_SEASON.id}
          />
        </div>
      </section>

      <section className="mdc-section mdc-section-tint">
        <div className="mdc-shell">
          <SectionHeading
            kicker={`Spielorte ${FINAL_SEASON.label}`}
            title="Wo gespielt wurde"
            description="In der abgeschlossenen Saison haben zwölf Lokale Ranking-Turniere ausgerichtet. Drei davon stehen nicht mehr in der Spielorte-Übersicht der laufenden Saison."
          />

          <div className="mdc-card">
            <table className="mdc-table">
              <thead>
                <tr>
                  <th>Spielort</th>
                  <th className="mdc-td-num">Turniere</th>
                  <th className="mdc-td-num mdc-hide-narrow">Starts</th>
                  <th className="mdc-td-num mdc-hide-narrow">Größtes Feld</th>
                </tr>
              </thead>
              <tbody>
                {spielorte.map(v => (
                  <tr key={v.venueId}>
                    <td className="mdc-cell-name">
                      {v.formerVenue
                        ? v.name
                        : <Link href={mdcPath(`/spielorte/${v.venueId}`)}>{v.name}</Link>}
                      {v.formerVenue && (
                        <span className="mdc-row-meta">
                          spielt in der laufenden Saison nicht mehr mit
                        </span>
                      )}
                      <span className="mdc-row-meta mdc-narrow-only">
                        {formatNumber(v.entries)} Starts · größtes Feld {v.largestField}
                      </span>
                    </td>
                    <td className="mdc-td-num mdc-num">{v.tournaments}</td>
                    <td className="mdc-td-num mdc-num mdc-hide-narrow">{formatNumber(v.entries)}</td>
                    <td className="mdc-td-num mdc-num mdc-hide-narrow">{v.largestField}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={mdcPath('/rangliste')} className="mdc-btn mdc-btn-primary">
              Rangliste {RUNNING_SEASON.label}
            </Link>
            <Link href={mdcPath('/rangliste/archiv')} className="mdc-btn mdc-btn-ghost">
              <Archive size={18} />
              Endstand {FINAL_SEASON.label}
            </Link>
            <Link href={mdcPath('/spielorte')} className="mdc-btn mdc-btn-ghost">
              <Building2 size={18} />
              Spielorte heute
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
