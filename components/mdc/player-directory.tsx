'use client';

// ============================================================
// MDC — Spielerübersicht mit Suche
// ============================================================
//
// Der Stamm hat mehrere hundert Einträge — ohne Suche wäre die Seite eine
// endlose Liste. Gesucht wird über Name, Spitzname und Passnummer; letztere
// ist in der Kneipe oft das Einzige, was man parat hat.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { Division } from '@/data/types';
import { formatAverage, formatNumber } from '@/lib/mdc/format';

export interface DirectoryEntry {
  id: string;
  passNr: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  division: Division;
  venueName: string | null;
  rank: number | null;
  points: number;
  tournaments: number;
  average: number;
  /** Farbton des Avatars — hier vorberechnet, damit die Karte leicht bleibt. */
  hue: number;
}

const PAGE_SIZE = 48;

export function PlayerDirectory({ entries }: { entries: DirectoryEntry[] }) {
  const [query, setQuery] = useState('');
  const [division, setDivision] = useState<Division | 'all'>('all');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(entry => {
      if (division !== 'all' && entry.division !== division) return false;
      if (!q) return true;
      return (
        `${entry.firstName} ${entry.lastName}`.toLowerCase().includes(q) ||
        `${entry.lastName} ${entry.firstName}`.toLowerCase().includes(q) ||
        (entry.nickname?.toLowerCase().includes(q) ?? false) ||
        String(entry.passNr).includes(q)
      );
    });
  }, [entries, query, division]);

  const shown = filtered.slice(0, limit);

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end', marginBottom: 18 }}>
        <div style={{ flex: '1 1 260px' }}>
          <label className="mdc-label" htmlFor="mdc-player-search">Spieler suchen</label>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mdc-ink-dim)' }}
            />
            <input
              id="mdc-player-search"
              className="mdc-input"
              style={{ paddingLeft: 36 }}
              type="search"
              placeholder="Name, Spitzname oder Passnummer"
              value={query}
              onChange={event => { setQuery(event.target.value); setLimit(PAGE_SIZE); }}
            />
          </div>
        </div>

        <div className="mdc-segment" role="group" aria-label="Wertungsklasse">
          <button type="button" data-active={division === 'all'} onClick={() => setDivision('all')}>Alle</button>
          <button type="button" data-active={division === 'men'} onClick={() => setDivision('men')}>Männer</button>
          <button type="button" data-active={division === 'women'} onClick={() => setDivision('women')}>Frauen</button>
        </div>
      </div>

      <p style={{ fontSize: '0.82rem', color: 'var(--mdc-ink-dim)', marginBottom: 14 }}>
        {formatNumber(filtered.length)} Spieler
        {filtered.length > shown.length && ` · ${formatNumber(shown.length)} angezeigt`}
      </p>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(258px, 1fr))' }}>
        {shown.map(entry => (
          <Link key={entry.id} href={`/mdc/spieler/${entry.id}`}>
            <article
              className="mdc-card mdc-card-hover"
              style={{ padding: '16px 18px', height: '100%', display: 'flex', gap: 13, alignItems: 'flex-start' }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 42, height: 42, flexShrink: 0, borderRadius: '50%',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: `linear-gradient(145deg, hsl(${entry.hue} 62% 96%), hsl(${entry.hue} 42% 88%))`,
                  border: '1px solid var(--mdc-line-hard)',
                  fontFamily: 'var(--mdc-font-display)', fontWeight: 800, fontSize: 17,
                  color: `hsl(${entry.hue} 45% 28%)`,
                }}
              >
                {entry.firstName.charAt(0)}{entry.lastName.charAt(0)}
              </span>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <h3
                    className="mdc-display"
                    style={{ fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {entry.lastName}
                  </h3>
                  {entry.rank !== null && (
                    <span className="mdc-num" style={{ fontSize: '0.78rem', color: 'var(--mdc-red)', fontWeight: 700 }}>
                      #{entry.rank}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--mdc-ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.firstName}
                  {entry.nickname && <span style={{ color: 'var(--mdc-ink-dim)' }}> „{entry.nickname}“</span>}
                </p>
                <p className="mdc-num" style={{ marginTop: 7, fontSize: '0.76rem', color: 'var(--mdc-ink-dim)' }}>
                  Passnr. {entry.passNr}
                  {entry.tournaments > 0 && (
                    <> · {formatNumber(entry.points)} Pkt · Ø {formatAverage(entry.average)}</>
                  )}
                </p>
                {entry.venueName && (
                  <p style={{ marginTop: 4, fontSize: '0.76rem', color: 'var(--mdc-ink-dim)' }}>
                    {entry.venueName}
                  </p>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>

      {filtered.length > shown.length && (
        <div style={{ marginTop: 22, textAlign: 'center' }}>
          <button
            type="button"
            className="mdc-btn mdc-btn-ghost"
            onClick={() => setLimit(current => current + PAGE_SIZE)}
          >
            Weitere {Math.min(PAGE_SIZE, filtered.length - shown.length)} Spieler laden
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="mdc-lead">Kein Spieler gefunden. Andere Schreibweise oder Passnummer probieren.</p>
      )}
    </div>
  );
}
