'use client';

import { useState } from 'react';
import { printLeague, printMaster, printAllLeagues } from './printing';

// Anzeige-Komponente für den generierten Spielplan-Vorschlag 2026/2027.
// Die Daten kommen aus spielplan.json (vom Generator erzeugt) und werden hier
// nur dargestellt — Liga umschaltbar. Jeder Spieltag zeigt über weekendIndex
// auf ein Wochenende der gemeinsamen Kalenderliste (data.weekends).
//
// Terminierung: Die A-Liga (18 Spieltage) belegt jedes Wochenende ab 16.10.
// Alle anderen Ligen starten eine Woche später (23.10.) und sind mit
// spielfreien Wochenenden gleichmäßig entzerrt, damit sie ebenfalls erst am
// letzten Wochenende (16.–18.04.2027) enden — nicht schon im Januar/Februar.

type Game = { home: string; away: string; venue: string; derby: boolean };
type Matchday = { nr: number; half: 'hin' | 'rueck'; games: Game[]; bye: string | null; weekendIndex: number };
type Weekend = { fri: string; sun: string };
export type SpielplanData = {
  generatedAt: string;
  leagues: { key: string; label: string; teams: { name: string; venue: string }[] }[];
  schedule: Record<string, Matchday[]>;
  weekends: Weekend[];
  skipped: { fri: string; label: string }[];
  maxMatchday: number;
  venueClusterObjective: number;
};

const fmt = (isoDate: string) => {
  const d = new Date(isoDate + 'T00:00:00Z');
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' });
};

export function SpielplanView({ data }: { data: SpielplanData }) {
  const [league, setLeague] = useState(data.leagues[0]?.key ?? 'la');

  const lg = data.leagues.find(x => x.key === league);
  const md = data.schedule[league] ?? [];
  const dateFor = (m: Matchday): Weekend | undefined => data.weekends[m.weekendIndex];

  const printBtn = (solid: boolean): React.CSSProperties => ({
    padding: '7px 13px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-manrope)',
    border: `1px solid ${solid ? 'var(--th-accent)' : 'var(--th-line-18)'}`,
    background: solid ? 'var(--th-accent)' : 'transparent',
    color: solid ? '#fff' : 'var(--th-text-muted)',
  });

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
    fontFamily: 'var(--font-manrope)',
    border: `1px solid ${active ? 'var(--th-accent)' : 'var(--th-line-18)'}`,
    background: active ? 'var(--th-accent)' : 'transparent',
    color: active ? '#fff' : 'var(--th-text-muted)',
  });

  const startWknd = md.length ? dateFor(md[0]) : undefined;
  const endWknd = md.length ? dateFor(md[md.length - 1]) : undefined;

  return (
    <div style={{ maxWidth: 900, padding: '0 0 60px' }}>
      {/* Terminierungs-Hinweis */}
      <div style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 10, fontSize: 12.5, fontFamily: 'var(--font-manrope)', lineHeight: 1.6,
        background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', color: 'var(--th-text-body)' }}>
<b>Alle Ligen starten am 23.–25.10.2026</b> und enden am <b>7.–9.05.2027</b> (letztes Wochenende vor den Pfingstferien). Die
        <b> A-Liga</b> (18 Spieltage) spielt jedes freie Wochenende durch, die kleineren Ligen sind mit spielfreien Wochenenden dazwischen
        entzerrt. Keine Playoffs. Ferien frei (Herbst, Weihnachten, Fasching, Ostern, 1. Mai, Pfingsten).
      </div>

      {/* Liga */}
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--th-text-muted)', fontFamily: 'var(--font-manrope)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Liga</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {data.leagues.map(x => <button key={x.key} type="button" style={pill(x.key === league)} onClick={() => setLeague(x.key)}>{x.label} ({x.teams.length})</button>)}
      </div>

      {/* Drucken / PDF für die TC-Sitzung */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--th-text-faint)', fontFamily: 'var(--font-manrope)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🖨 Drucken / PDF</span>
        <button type="button" style={printBtn(true)} onClick={() => printLeague(data, league)}>{lg?.label ?? 'Liga'}: Team-Blätter + Masterplan</button>
        <button type="button" style={printBtn(false)} onClick={() => printMaster(data, league)}>nur Masterplan</button>
        <button type="button" style={printBtn(false)} onClick={() => printAllLeagues(data)}>alle Ligen</button>
      </div>

      {/* Liga-Kurzinfo */}
      {lg && (
        <div style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--th-text-muted)', fontFamily: 'var(--font-manrope)' }}>
          {lg.teams.length} Teams · {md.length} Spieltage · Start {startWknd ? fmt(startWknd.fri) : '—'} · Ende {endWknd ? fmt(endWknd.sun) : '—'}
        </div>
      )}

      {/* Ferien-Hinweis */}
      {data.skipped.length > 0 && (
        <div style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 10, fontSize: 12.5, fontFamily: 'var(--font-manrope)',
          background: 'var(--th-accent-a07)', border: '1px solid var(--th-line-10)', color: 'var(--th-text-muted)' }}>
          <b>Frei gelassene Wochenenden (Ferien/Feiertage, geschätzt — in der Terminsitzung final abgleichen):</b><br />
          {data.skipped.map(s => `${fmt(s.fri)} – ${s.label}`).join(' · ')}
        </div>
      )}

      {/* Spieltage */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {md.map((m, mi) => {
          const d = dateFor(m);
          const prev = mi > 0 ? md[mi - 1] : undefined;
          // spielfreie Wochenenden zwischen zwei Spieltagen derselben Runde (Entzerrung)
          const gap = prev && prev.half === m.half ? m.weekendIndex - prev.weekendIndex - 1 : 0;
          const isHalfStart = m.nr === 1 || m.half === 'rueck' && md.find(x => x.half === 'rueck')?.nr === m.nr;
          return (
            <div key={m.nr}>
              {isHalfStart && (
                <div style={{ margin: '10px 0 6px', fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--th-text-strong)' }}>
                  {m.half === 'hin' ? 'Hinrunde' : 'Rückrunde'}
                </div>
              )}
              {gap > 0 && (
                <div style={{ margin: '2px 0 6px', fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', textAlign: 'center' }}>
                  · {gap} spielfreies Wochenende{gap > 1 ? 'n' : ''} ·
                </div>
              )}
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, color: 'var(--th-text-strong)' }}>
                    Spieltag {m.nr}
                    <span style={{ marginLeft: 8, fontWeight: 700, fontSize: 11, color: 'var(--th-text-faint)', textTransform: 'uppercase' }}>{m.half === 'hin' ? 'Hin' : 'Rück'}</span>
                  </span>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--th-text-muted)' }}>
                    {d ? `${fmt(d.fri)} – ${fmt(d.sun)}` : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {m.games.map((g, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
                      <span style={{ textAlign: 'right', color: 'var(--th-text-strong)', fontWeight: 700 }}>{g.home}</span>
                      <span style={{ fontSize: 10, color: 'var(--th-text-faint)', fontWeight: 700 }}>
                        vs {g.derby && <span title={`Derby · ${g.venue}`} style={{ color: 'var(--th-gold)' }}>⚔</span>}
                      </span>
                      <span style={{ color: 'var(--th-text-body)' }}>{g.away}</span>
                    </div>
                  ))}
                  {m.bye && (
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', fontStyle: 'italic', marginTop: 2 }}>
                      spielfrei: {m.bye}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {lg && (
        <p style={{ marginTop: 16, fontSize: 11.5, color: 'var(--th-text-faint)', fontFamily: 'var(--font-manrope)' }}>
          ⚔ = Derby (beide Teams im selben Lokal, bewusst früh angesetzt). Rückrunde spiegelt die Reihenfolge der Hinrunde (Heimrecht getauscht).
        </p>
      )}
    </div>
  );
}
