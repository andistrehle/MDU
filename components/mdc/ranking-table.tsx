'use client';

// ============================================================
// MDC — Ranglistentabelle
// ============================================================
//
// Spaltenaufbau wie in der offiziellen MDC-Auswertung: Platz, Trend,
// Passnummer, Name, Vorname, Anzahl TN, Punkte, Schnitt — bei der
// Endrangliste zusätzlich Anteil und Auszahlung.
//
// Auf dem Handy scrollt die Tabelle waagerecht, der Platz bleibt stehen.
// Die Zeilen bekommt die Komponente fertig vom Server; sie zieht sich keine
// Spielerdaten selbst, damit nicht der halbe Stamm im Browser landet.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { Trend } from '@/data/types';
import { formatAverage, formatNumber } from '@/lib/mdc/format';
import { TrendIcon } from './ui';

export interface RankingRow {
  rank: number;
  sharedRank: boolean;
  trend: Trend;
  playerId: string;
  passNr: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  tournaments: number;
  points: number;
  average: number;
  payoutPercent?: number;
  payoutEuro?: number;
}

type SortKey = 'rank' | 'points' | 'average' | 'tournaments';

const SORT_LABEL: Record<SortKey, string> = {
  rank: 'Platzierung',
  points: 'Punkte',
  average: 'Schnitt',
  tournaments: 'Anzahl TN',
};

const EURO = (value: number) =>
  `${formatNumber(Math.floor(value))},${String(Math.round((value % 1) * 100)).padStart(2, '0')} €`;

interface RankingTableProps {
  rows: RankingRow[];
  /** Ausschüttungsspalten zeigen (nur beim Saison-Endstand vorhanden). */
  showPayout?: boolean;
  /** Hinweis auf noch fehlende Plätze, z. B. { from: 199, to: 280 }. */
  gap?: { from: number; to: number };
}

export function RankingTable({ rows, showPayout = false, gap }: RankingTableProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('rank');
  const [minTournaments, setMinTournaments] = useState(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter(row => {
      if (row.tournaments < minTournaments) return false;
      if (!q) return true;
      return (
        `${row.firstName} ${row.lastName}`.toLowerCase().includes(q) ||
        `${row.lastName} ${row.firstName}`.toLowerCase().includes(q) ||
        (row.nickname?.toLowerCase().includes(q) ?? false) ||
        String(row.passNr).includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'rank') return a.rank - b.rank;
      if (sort === 'points') return b.points - a.points;
      if (sort === 'average') return b.average - a.average;
      return b.tournaments - a.tournaments;
    });
  }, [rows, query, sort, minTournaments]);

  // Die Lücke wird an der Stelle eingeblendet, an der sie in der Wertung sitzt —
  // aber nur in der unveränderten Ansicht, sonst führt sie in die Irre.
  const showGapAt = gap && sort === 'rank' && !query && minTournaments === 0
    ? visible.findIndex(row => row.rank > gap.to)
    : -1;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'flex-end',
          marginBottom: 18,
        }}
      >
        <div style={{ flex: '1 1 240px', minWidth: 200 }}>
          <label className="mdc-label" htmlFor="mdc-ranking-search">Suche</label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)', color: 'var(--mdc-text-faint)',
              }}
            />
            <input
              id="mdc-ranking-search"
              className="mdc-input"
              style={{ paddingLeft: 36 }}
              type="search"
              placeholder="Name, Spitzname oder Passnummer"
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: '0 1 190px' }}>
          <label className="mdc-label" htmlFor="mdc-ranking-sort">Sortierung</label>
          <select
            id="mdc-ranking-sort"
            className="mdc-select"
            value={sort}
            onChange={event => setSort(event.target.value as SortKey)}
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map(key => (
              <option key={key} value={key}>{SORT_LABEL[key]}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 190px' }}>
          <label className="mdc-label" htmlFor="mdc-ranking-min">Mindestens</label>
          <select
            id="mdc-ranking-min"
            className="mdc-select"
            value={minTournaments}
            onChange={event => setMinTournaments(Number(event.target.value))}
          >
            <option value={0}>alle Spieler</option>
            <option value={5}>ab 5 Teilnahmen</option>
            <option value={20}>ab 20 Teilnahmen</option>
            <option value={50}>ab 50 Teilnahmen</option>
          </select>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--mdc-text-faint)', marginBottom: 10 }}>
        {visible.length === rows.length
          ? `${formatNumber(rows.length)} Spieler in der Wertung`
          : `${formatNumber(visible.length)} von ${formatNumber(rows.length)} Spielern`}
      </p>

      <div className="mdc-card mdc-scroll-x">
        <table className="mdc-table">
          <thead>
            <tr>
              <th className="mdc-sticky-col">Platz</th>
              <th style={{ width: 44 }}><span className="sr-only">Trend</span></th>
              <th>Passnr.</th>
              <th>Name</th>
              <th>Vorname</th>
              <th className="mdc-td-num">Anzahl TN</th>
              <th className="mdc-td-num">Punkte</th>
              <th className="mdc-td-num">Schnitt</th>
              {showPayout && <th className="mdc-td-num">%</th>}
              {showPayout && <th className="mdc-td-num">Auszahlung</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <RowGroup
                key={row.playerId}
                row={row}
                showPayout={showPayout}
                showGapBefore={index === showGapAt}
                gap={gap}
                colSpan={showPayout ? 10 : 8}
              />
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={showPayout ? 10 : 8} style={{ padding: '28px 14px', color: 'var(--mdc-text-dim)' }}>
                  Kein Spieler gefunden. Andere Schreibweise oder Passnummer probieren.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowGroup({
  row, showPayout, showGapBefore, gap, colSpan,
}: {
  row: RankingRow;
  showPayout: boolean;
  showGapBefore: boolean;
  gap?: { from: number; to: number };
  colSpan: number;
}) {
  const podium = row.rank <= 3 ? `mdc-row-${row.rank}` : '';

  return (
    <>
      {showGapBefore && gap && (
        <tr>
          <td
            colSpan={colSpan}
            style={{
              padding: '14px', textAlign: 'center', fontSize: '0.82rem',
              color: 'var(--mdc-text-faint)', background: 'rgba(255,255,255,0.02)',
            }}
          >
            Plätze {gap.from}–{gap.to}: Auswertungsseiten liegen noch nicht vor.
          </td>
        </tr>
      )}
      <tr className={podium}>
        <td className={`mdc-sticky-col mdc-num ${podium}`} style={{ fontWeight: 700 }}>
          {row.sharedRank ? '' : row.rank}
        </td>
        <td><TrendIcon trend={row.trend} /></td>
        <td className="mdc-num" style={{ color: 'var(--mdc-text-dim)' }}>{row.passNr}</td>
        <td style={{ fontWeight: 600 }}>
          <Link href={`/mdc/spieler/${row.playerId}`} style={{ borderBottom: '1px solid transparent' }}>
            {row.lastName}
          </Link>
        </td>
        <td style={{ color: 'var(--mdc-text-dim)' }}>
          {row.firstName}
          {row.nickname && (
            <span style={{ color: 'var(--mdc-text-faint)' }}> „{row.nickname}“</span>
          )}
        </td>
        <td className="mdc-td-num mdc-num">{row.tournaments}</td>
        <td className="mdc-td-num mdc-num" style={{ fontWeight: 700, color: 'var(--mdc-white)' }}>
          {formatNumber(row.points)}
        </td>
        <td className="mdc-td-num mdc-num" style={{ color: 'var(--mdc-text-dim)' }}>
          {formatAverage(row.average)}
        </td>
        {showPayout && (
          <td className="mdc-td-num mdc-num" style={{ color: 'var(--mdc-text-dim)' }}>
            {row.payoutPercent ? `${formatAverage(row.payoutPercent)} %` : '—'}
          </td>
        )}
        {showPayout && (
          <td className="mdc-td-num mdc-num" style={{ color: row.payoutEuro ? 'var(--mdc-gold)' : 'var(--mdc-text-faint)' }}>
            {row.payoutEuro ? EURO(row.payoutEuro) : '—'}
          </td>
        )}
      </tr>
    </>
  );
}
