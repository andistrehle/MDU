'use client';

import { useMemo, useState } from 'react';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { MatchCard } from '@/components/mdu/match-card';
import { getScheduledMatchesByLeague, formatScheduledDate } from '@/lib/data/matches';
import { findLeague, getVenueForTeamInSeason } from '@/lib/data';

/** Canonical league display order for the Spielplan grouping */
const LEAGUE_ORDER = [
  'playoffs-a-aufstieg', 'playoffs-a-abstieg',
  'playoffs-b-aufstieg', 'playoffs-b-abstieg',
  'la', 'a1', 'a2', 'b1', 'b2', 'c',
  'pokal-2026',
];

export default function SpielplanPage() {
  const rawGroups = getScheduledMatchesByLeague();

  // Sort groups by canonical league order; unknown leagues go last
  const allGroups = [...rawGroups].sort((a, b) => {
    const ia = LEAGUE_ORDER.indexOf(a.leagueId);
    const ib = LEAGUE_ORDER.indexOf(b.leagueId);
    if (ia === -1 && ib === -1) return a.leagueId.localeCompare(b.leagueId);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  // Liga-Filter: null = „Alle Ligen" (Standard).
  const [selected, setSelected] = useState<string | null>(null);
  const groups = useMemo(
    () => (selected ? allGroups.filter(g => g.leagueId === selected) : allGroups),
    [allGroups, selected],
  );

  const totalCount = allGroups.reduce((s, g) => s + g.matches.length, 0);

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/spielplan" />

      <PageBanner eyebrow="Liga-Kalender" title="Spielplan" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 80px' }}>
        {/* Liga-Filter — Standard-Dropdown, „Alle Ligen" als Default */}
        {totalCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
            <label htmlFor="liga-filter" style={{
              fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)',
            }}>
              Liga
            </label>
            <select
              id="liga-filter"
              value={selected ?? ''}
              onChange={e => setSelected(e.target.value || null)}
              style={{
                padding: '10px 14px', background: 'var(--th-bg-card)',
                border: '1.5px solid var(--th-line-10)', borderRadius: 8,
                color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)',
                fontSize: 14, fontWeight: 600, outline: 'none', cursor: 'pointer', minWidth: 220,
              }}
            >
              <option value="">Alle Ligen</option>
              {allGroups.map(g => {
                const league = findLeague(g.leagueId);
                return <option key={g.leagueId} value={g.leagueId}>{league?.name ?? g.leagueId.toUpperCase()}</option>;
              })}
            </select>
          </div>
        )}

        {totalCount === 0 ? (
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)',
            fontStyle: 'italic', padding: '24px 0',
          }}>
            Keine bevorstehenden Spiele — vollständiger Spielplan auf{' '}
            <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--th-text-muted)', textDecoration: 'underline' }}>dartunion.de</a>.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {groups.map(({ leagueId, matches }) => {
              const league = findLeague(leagueId);
              const leagueName = league?.name ?? leagueId.toUpperCase();
              const leagueColor = league?.color ?? 'var(--th-accent)';

              return (
                <section key={leagueId}>
                  {/* League heading */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 4, height: 24, borderRadius: 2, background: leagueColor, flexShrink: 0 }} />
                    <h2 style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22,
                      letterSpacing: '0.06em', color: 'var(--th-text-strong)', margin: 0, textTransform: 'uppercase',
                    }}>
                      {leagueName}
                    </h2>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', fontWeight: 600 }}>
                      {matches.length} {matches.length === 1 ? 'Spiel' : 'Spiele'}
                    </span>
                  </div>

                  {/* Match cards — within each league sorted by matchday ascending
                      (matches without a matchday last, date as tiebreaker) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 800 }}>
                    {[...matches].sort((a, b) => {
                      const ma = a.matchday ?? Infinity;
                      const mb = b.matchday ?? Infinity;
                      if (ma !== mb) return ma - mb;
                      if (!a.date && !b.date) return 0;
                      if (!a.date) return 1;
                      if (!b.date) return -1;
                      return a.date.localeCompare(b.date);
                    }).map(m => (
                      <MatchCard
                        key={m.id}
                        league={leagueName + (m.matchday ? ` · Spieltag ${m.matchday}` : '')}
                        home={m.homeTeamId}
                        away={m.awayTeamId}
                        date={formatScheduledDate(m.date)}
                        time={m.time ?? '—'}
                        venue={getVenueForTeamInSeason(m.homeTeamId, 'season-2026')?.name ?? 'Noch nicht verfügbar'}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
