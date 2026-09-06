'use client';

// ============================================================
// MDC — Turnierergebnisse durchsehen
// ============================================================
//
// Weit über 700 Turniere sind zu viele für eine reine Liste. Deshalb hier drei
// Filter (Saison, Spielort, Monat), eine Sortierung und eine Anzeige, die
// stückweise nachlädt — statt eines Suchfelds, das nur Sieger fände und damit
// mehr verspricht, als es einlöst.
//
// Die Zeilen kommen fertig vom Server: Datum, Spielort, Feldgröße, Sieger.
// Die vollständigen Ergebnislisten liegen auf den Detailseiten, damit nicht
// 9411 Zeilen im Browser landen.
//
// Am Handy fallen Spielort und Sieger als eigene Spalten weg und rücken unter
// das Datum (`mdc-row-meta`) — kein seitliches Schieben.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Trophy, Users } from 'lucide-react';
import { formatDate, formatMonth, weekdayName } from '@/lib/mdc/format';

export interface ResultRow {
  seasonId: string;
  id: string;
  date: string;
  venueId: string;
  venue: string;
  participants: number;
  winner: string;
  winnerId: string | null;
}

type SortKey = 'newest' | 'oldest' | 'field';

const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Neueste zuerst',
  oldest: 'Älteste zuerst',
  field: 'Größtes Feld zuerst',
};

const SCHRITT = 60;

export function ResultsBrowser(
  { rows, seasons, initialSeason }: {
    rows: ResultRow[];
    seasons: { id: string; label: string }[];
    initialSeason: string;
  },
) {
  const [season, setSeason] = useState(initialSeason);
  const [venue, setVenue] = useState('alle');
  const [month, setMonth] = useState('alle');
  const [sort, setSort] = useState<SortKey>('newest');
  const [limit, setLimit] = useState(SCHRITT);

  // Spielorte und Monate richten sich nach der gewählten Saison — sonst stünde
  // in den Listen etwas, das die Auswahl gar nicht enthalten kann.
  const inSaison = useMemo(
    () => rows.filter(row => season === 'alle' || row.seasonId === season),
    [rows, season],
  );

  const venues = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const row of inSaison) {
      const eintrag = map.get(row.venueId) ?? { id: row.venueId, name: row.venue, count: 0 };
      eintrag.count += 1;
      map.set(row.venueId, eintrag);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [inSaison]);

  const months = useMemo(
    () => [...new Set(inSaison.map(row => row.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a)),
    [inSaison],
  );

  const visible = useMemo(() => {
    const gefiltert = inSaison.filter(row =>
      (venue === 'alle' || row.venueId === venue) &&
      (month === 'alle' || row.date.startsWith(month)),
    );
    return [...gefiltert].sort((a, b) => {
      if (sort === 'oldest') return a.date.localeCompare(b.date) || a.venue.localeCompare(b.venue);
      if (sort === 'field') return b.participants - a.participants || b.date.localeCompare(a.date);
      return b.date.localeCompare(a.date) || a.venue.localeCompare(b.venue);
    });
  }, [inSaison, venue, month, sort]);

  // Filterwechsel: wieder von vorn anzeigen, sonst steht man mitten in einer
  // Liste, die es so gar nicht mehr gibt.
  const zeige = visible.slice(0, limit);
  const setFilter = (fn: () => void) => { fn(); setLimit(SCHRITT); };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginBottom: 18 }}>
        <div style={{ flex: '0 1 190px' }}>
          <label className="mdc-label" htmlFor="mdc-erg-saison">Saison</label>
          <select
            id="mdc-erg-saison"
            className="mdc-select"
            value={season}
            onChange={event => setFilter(() => {
              setSeason(event.target.value);
              setVenue('alle');
              setMonth('alle');
            })}
          >
            {seasons.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
            <option value="alle">Beide Saisons</option>
          </select>
        </div>

        <div style={{ flex: '1 1 220px', minWidth: 190 }}>
          <label className="mdc-label" htmlFor="mdc-erg-ort">Spielort</label>
          <select
            id="mdc-erg-ort"
            className="mdc-select"
            value={venue}
            onChange={event => setFilter(() => setVenue(event.target.value))}
          >
            <option value="alle">Alle Spielorte</option>
            {venues.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.count})</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 200px' }}>
          <label className="mdc-label" htmlFor="mdc-erg-monat">Monat</label>
          <select
            id="mdc-erg-monat"
            className="mdc-select"
            value={month}
            onChange={event => setFilter(() => setMonth(event.target.value))}
          >
            <option value="alle">Ganze Saison</option>
            {months.map(m => (
              <option key={m} value={m}>{formatMonth(m)}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 1 200px' }}>
          <label className="mdc-label" htmlFor="mdc-erg-sort">Sortierung</label>
          <select
            id="mdc-erg-sort"
            className="mdc-select"
            value={sort}
            onChange={event => setFilter(() => setSort(event.target.value as SortKey))}
          >
            {(Object.keys(SORT_LABEL) as SortKey[]).map(key => (
              <option key={key} value={key}>{SORT_LABEL[key]}</option>
            ))}
          </select>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--mdc-ink-dim)', marginBottom: 10 }}>
        {visible.length === inSaison.length
          ? `${visible.length} Turniere`
          : `${visible.length} von ${inSaison.length} Turnieren`}
      </p>

      <div className="mdc-card">
        <table className="mdc-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th className="mdc-hide-narrow">Spielort</th>
              <th className="mdc-td-num">Starter</th>
              <th className="mdc-hide-narrow">Sieger</th>
              <th className="mdc-hide-narrow" style={{ width: 40 }}>
                <span className="sr-only">Ergebnisliste</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {zeige.map(row => (
              <tr key={row.id}>
                <td className="mdc-cell-name">
                  <Link href={`/mdc/turniere/ergebnisse/${row.id}`}>
                    <span className="mdc-num">{formatDate(row.date)}</span>
                  </Link>
                  <span className="mdc-row-meta mdc-narrow-only">
                    {weekdayName(row.date)} · {row.venue}
                    {row.winner && <> · Sieger: {row.winner}</>}
                  </span>
                </td>
                <td className="mdc-hide-narrow">{row.venue}</td>
                <td className="mdc-td-num mdc-num">{row.participants}</td>
                <td className="mdc-hide-narrow">
                  {row.winnerId
                    ? <Link href={`/mdc/spieler/${row.winnerId}`}>{row.winner}</Link>
                    : row.winner}
                </td>
                <td className="mdc-hide-narrow mdc-td-num">
                  <Link href={`/mdc/turniere/ergebnisse/${row.id}`} aria-label="Ergebnisliste öffnen">
                    <ArrowRight size={15} />
                  </Link>
                </td>
              </tr>
            ))}
            {zeige.length === 0 && (
              <tr>
                <td colSpan={5} style={{ whiteSpace: 'normal', color: 'var(--mdc-ink-soft)' }}>
                  Für diese Auswahl gibt es kein Turnier.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {zeige.length < visible.length && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="mdc-btn mdc-btn-ghost mdc-btn-sm"
            onClick={() => setLimit(limit + SCHRITT)}
          >
            Weitere {Math.min(SCHRITT, visible.length - zeige.length)} Turniere
          </button>
          <span style={{ fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
            {zeige.length} von {visible.length} angezeigt
          </span>
        </div>
      )}

      <div
        style={{
          marginTop: 20, display: 'flex', gap: 18, flexWrap: 'wrap',
          fontSize: '0.82rem', color: 'var(--mdc-ink-dim)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Users size={14} /> {visible.reduce((sum, r) => sum + r.participants, 0)} Starts in der Auswahl
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Trophy size={14} /> größtes Feld {Math.max(0, ...visible.map(r => r.participants))} Starter
        </span>
      </div>
    </div>
  );
}
