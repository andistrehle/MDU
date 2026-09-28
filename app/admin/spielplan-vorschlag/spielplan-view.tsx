'use client';

import { useState } from 'react';

// Anzeige-Komponente für den generierten Spielplan-Vorschlag 2026/2027.
// Die Daten kommen aus spielplan.json (vom Generator erzeugt) und werden hier
// nur dargestellt — Variante (Startdatum) und Liga umschaltbar.

type Game = { home: string; away: string; venue: string; derby: boolean };
type Matchday = { nr: number; half: 'hin' | 'rueck'; games: Game[]; bye: string | null };
type Variant = { key: string; label: string; startFri: string; out: { fri: string; sun: string }[]; skipped: { fri: string; label: string }[] };
export type SpielplanData = {
  generatedAt: string;
  leagues: { key: string; label: string; teams: { name: string; venue: string }[] }[];
  schedule: Record<string, Matchday[]>;
  variants: Variant[];
  maxMatchday: number;
  venueClusterObjective: number;
};

const fmt = (isoDate: string) => {
  const d = new Date(isoDate + 'T00:00:00Z');
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' });
};

export function SpielplanView({ data }: { data: SpielplanData }) {
  const [variant, setVariant] = useState(data.variants[0]?.key ?? 'v1');
  const [league, setLeague] = useState(data.leagues[0]?.key ?? 'la');

  const v = data.variants.find(x => x.key === variant) ?? data.variants[0];
  const lg = data.leagues.find(x => x.key === league);
  const md = data.schedule[league] ?? [];
  // Spieltag-Nr → Wochenend-Datum der aktuellen Variante
  const dateFor = (nr: number) => v?.out[nr - 1];

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
    fontFamily: 'var(--font-manrope)',
    border: `1px solid ${active ? 'var(--th-accent)' : 'var(--th-line-18)'}`,
    background: active ? 'var(--th-accent)' : 'transparent',
    color: active ? '#fff' : 'var(--th-text-muted)',
  });

  return (
    <div style={{ maxWidth: 900, padding: '0 0 60px' }}>
      {/* Variante (Startdatum) */}
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--th-text-muted)', fontFamily: 'var(--font-manrope)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Startvariante</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {data.variants.map(x => <button key={x.key} type="button" style={pill(x.key === variant)} onClick={() => setVariant(x.key)}>{x.label}</button>)}
      </div>

      {/* Liga */}
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--th-text-muted)', fontFamily: 'var(--font-manrope)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Liga</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {data.leagues.map(x => <button key={x.key} type="button" style={pill(x.key === league)} onClick={() => setLeague(x.key)}>{x.label} ({x.teams.length})</button>)}
      </div>

      {/* Ferien-Hinweis */}
      {v && v.skipped.length > 0 && (
        <div style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 10, fontSize: 12.5, fontFamily: 'var(--font-manrope)',
          background: 'var(--th-accent-a07)', border: '1px solid var(--th-line-10)', color: 'var(--th-text-muted)' }}>
          <b>Frei gelassene Wochenenden (Ferien/Feiertage, geschätzt — in der Terminsitzung final abgleichen):</b><br />
          {v.skipped.map(s => `${fmt(s.fri)} – ${s.label}`).join(' · ')}
        </div>
      )}

      {/* Spieltage */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {md.map(m => {
          const d = dateFor(m.nr);
          const isHalfStart = m.nr === 1 || m.half === 'rueck' && md.find(x => x.half === 'rueck')?.nr === m.nr;
          return (
            <div key={m.nr}>
              {isHalfStart && (
                <div style={{ margin: '10px 0 6px', fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 15, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--th-text-strong)' }}>
                  {m.half === 'hin' ? 'Hinrunde' : 'Rückrunde'}
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
          ⚔ = Derby (beide Teams im selben Lokal, {'>'}bewusst früh angesetzt). Rückrunde spiegelt die Reihenfolge der Hinrunde (Heimrecht getauscht).
        </p>
      )}
    </div>
  );
}
