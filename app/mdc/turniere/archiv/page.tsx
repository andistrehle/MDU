// ============================================================
// MDC — Turnierarchiv der Saison 2025/26
// ============================================================
//
// Alle Einzelergebnisse der abgeschlossenen Saison: echte Turniere, echte
// Personen, direkt aus der Arbeitsmappe des Betreibers. Aus genau diesen
// Ergebnissen entsteht die Endrangliste im Ranglisten-Archiv — die Punkte
// hier aufaddiert ergeben dort die Punktzahl.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Archive, Building2, CalendarDays, Trophy, Users } from 'lucide-react';
import { PageHero, SectionHeading, StatCard } from '@/components/mdc/ui';
import { ArchiveBrowser, type ArchiveRow } from '@/components/mdc/archive-browser';
import {
  ARCHIVE_STATS, ARCHIVE_TOURNAMENTS_DESC, archiveVenues,
} from '@/data/archive-2025-26';
import { getPlayer, playerName } from '@/data/players';
import { FINAL_SEASON } from '@/data/season';
import { formatDate, formatNumber } from '@/lib/mdc/format';

export const metadata: Metadata = {
  title: `Turnierarchiv ${FINAL_SEASON.label}`,
  description:
    `Alle ${ARCHIVE_STATS.tournaments} Ranking-Turniere der MDC-Saison ${FINAL_SEASON.label} ` +
    'mit vollständiger Ergebnisliste, Feldgröße und vergebenen Punkten.',
};

function rows(): ArchiveRow[] {
  return ARCHIVE_TOURNAMENTS_DESC.map(t => {
    const sieger = t.results[0].playerId ? getPlayer(t.results[0].playerId) : undefined;
    return {
      id: t.id,
      date: t.date,
      venueId: t.venueId,
      venue: t.venueName,
      participants: t.participants,
      winner: sieger ? playerName(sieger) : `Passnr. ${t.results[0].passNr}`,
      winnerId: sieger?.id ?? null,
    };
  });
}

export default function TurnierArchivPage() {
  const spielorte = archiveVenues();

  return (
    <>
      <PageHero
        kicker={`Saison ${FINAL_SEASON.label}`}
        title="Turnierarchiv"
        description={`Jedes Ranking-Turnier der abgeschlossenen Saison — vom ${formatDate(ARCHIVE_STATS.firstDate)} bis ${formatDate(ARCHIVE_STATS.lastDate)}, mit kompletter Ergebnisliste und den Punkten, die dabei vergeben wurden.`}
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
              label="Turniere"
              value={formatNumber(ARCHIVE_STATS.tournaments)}
              sub={`in ${ARCHIVE_STATS.venues} Lokalen`}
            />
            <StatCard
              icon={<Users size={17} />}
              label="Starts"
              value={formatNumber(ARCHIVE_STATS.entries)}
              sub={`von ${ARCHIVE_STATS.players} Spielern`}
            />
            <StatCard
              icon={<Trophy size={17} />}
              label="Vergebene Punkte"
              value={formatNumber(ARCHIVE_STATS.points)}
              sub="ergeben die Endrangliste"
            />
            <StatCard
              icon={<Users size={17} />}
              label="Größtes Feld"
              value={`${ARCHIVE_STATS.largestField} Starter`}
              sub="Obergrenze der MDC sind 32"
            />
          </div>

          <ArchiveBrowser rows={rows()} />
        </div>
      </section>

      <section className="mdc-section mdc-section-tint">
        <div className="mdc-shell">
          <SectionHeading
            kicker="Spielorte"
            title="Wo gespielt wurde"
            description="Die Saison über haben zwölf Lokale Ranking-Turniere ausgerichtet. Drei davon stehen nicht mehr in der Spielorte-Übersicht der laufenden Saison."
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
                        : <Link href={`/mdc/spielorte/${v.venueId}`}>{v.name}</Link>}
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
            <Link href="/mdc/rangliste/archiv" className="mdc-btn mdc-btn-primary">
              <Archive size={18} />
              Endstand {FINAL_SEASON.label}
            </Link>
            <Link href="/mdc/spielorte" className="mdc-btn mdc-btn-ghost">
              <Building2 size={18} />
              Spielorte heute
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
