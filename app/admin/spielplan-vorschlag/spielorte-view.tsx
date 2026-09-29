'use client';

import { useMemo, useState } from 'react';
import type { SpielplanData } from './spielplan-view';
import { printVenue, printAllVenues } from './printing';

// Spielort-Ansicht des Spielplan-Vorschlags: je Lokal alle Heimspiele
// (ligaübergreifend), Wochenende für Wochenende. Zeigt, wann in einer
// Spielstätte gespielt wird und wie viele Partien parallel laufen.
// Reine Anzeige aus spielplan.json — schreibt nichts.

const fmt = (isoDate: string) => {
  const d = new Date(isoDate + 'T00:00:00Z');
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' });
};

// Kapazität je Lokal (vom Betreiber): sonst höchstens 2 (nur ≤2 Teams).
const CAP: Record<string, number> = { 'Fiaker Stüberl': 3, 'Flotte Biene': 3, 'Jolly Roger': 3 };
const LG_SHORT: Record<string, string> = { la: 'La', a: 'A', b1: 'B1', b2: 'B2', c: 'C' };
const LG_COLOR: Record<string, string> = { La: 'var(--th-gold)', A: 'var(--th-accent)', B1: '#6E7177', B2: '#6E7177', C: '#8A6D3B' };

type HomeGame = { lg: string; home: string; away: string; derby: boolean };

export function SpielorteView({ data }: { data: SpielplanData }) {
  const { teamsAt, home, list } = useMemo(() => {
    const teamsAt: Record<string, { name: string; lg: string }[]> = {};
    const home: Record<string, Record<number, HomeGame[]>> = {};
    for (const lg of data.leagues) for (const t of lg.teams) (teamsAt[t.venue] ??= []).push({ name: t.name, lg: lg.key });
    for (const lg of data.leagues) for (const m of data.schedule[lg.key]) for (const g of m.games) {
      ((home[g.venue] ??= {})[m.weekendIndex] ??= []).push({ lg: LG_SHORT[lg.key], home: g.home, away: g.away, derby: g.derby });
    }
    const list = Object.keys(teamsAt).sort((a, b) => teamsAt[b].length - teamsAt[a].length || a.localeCompare(b, 'de'));
    return { teamsAt, home, list };
  }, [data]);

  const [venue, setVenue] = useState(list[0] ?? '');
  const games = home[venue] ?? {};
  const weekendIdx = Object.keys(games).map(Number).sort((a, b) => a - b);
  const totalGames = weekendIdx.reduce((n, i) => n + games[i].length, 0);
  const cap = CAP[venue] ?? 2;
  const teams = teamsAt[venue] ?? [];

  return (
    <div style={{ maxWidth: 900, padding: '0 0 60px' }}>
      {/* Lokal-Auswahl */}
      <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--th-text-muted)', fontFamily: 'var(--font-manrope)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Spielort</div>
      <select value={venue} onChange={e => setVenue(e.target.value)}
        style={{ padding: '10px 12px', minWidth: 260, marginBottom: 16, background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }}>
        {list.map(v => <option key={v} value={v}>{v} ({teamsAt[v].length} {teamsAt[v].length === 1 ? 'Team' : 'Teams'})</option>)}
      </select>

      {/* Drucken / PDF */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16, marginLeft: 12 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--th-text-faint)', fontFamily: 'var(--font-manrope)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🖨</span>
        <button type="button" onClick={() => printVenue(data, venue)} style={{ padding: '7px 13px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-manrope)', border: '1px solid var(--th-accent)', background: 'var(--th-accent)', color: '#fff' }}>{venue} drucken</button>
        <button type="button" onClick={() => printAllVenues(data)} style={{ padding: '7px 13px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-manrope)', border: '1px solid var(--th-line-18)', background: 'transparent', color: 'var(--th-text-muted)' }}>alle Spielorte</button>
      </div>

      {/* Lokal-Kopf */}
      <div style={{ margin: '0 0 16px', padding: '12px 14px', borderRadius: 10, fontSize: 12.5, fontFamily: 'var(--font-manrope)', lineHeight: 1.6, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', color: 'var(--th-text-body)' }}>
        <b style={{ color: 'var(--th-text-strong)' }}>{venue}</b> · {weekendIdx.length} Spielwochenenden · {totalGames} Heimspiele ·
        {' '}bis {cap} parallel<br />
        <span style={{ color: 'var(--th-text-muted)' }}>
          Heimteams: {teams.map(t => `${t.name} (${LG_SHORT[t.lg]})`).join(' · ')}
        </span>
      </div>

      {weekendIdx.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)' }}>Keine Heimspiele.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 10 }}>
          {weekendIdx.map(i => {
            const w = data.weekends[i];
            const n = games[i].length;
            return (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--th-bg-card)', border: `1px solid ${n > cap ? 'rgba(212,0,0,0.4)' : 'var(--th-line-6)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, borderBottom: '1px solid var(--th-line-6)', paddingBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 800, fontSize: 13, color: 'var(--th-text-strong)' }}>
                    {w ? `${fmt(w.fri)} – ${fmt(w.sun)}` : '—'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, color: n > cap ? '#E24B4A' : 'var(--th-text-faint)' }}>
                    {n} Heimspiel{n === 1 ? '' : 'e'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {games[i].map((g, k) => (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto 1fr', gap: 8, alignItems: 'center', fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
                      <span style={{ fontSize: 9.5, fontWeight: 900, textAlign: 'center', color: '#fff', background: LG_COLOR[g.lg], borderRadius: 5, padding: '2px 0' }}>{g.lg}</span>
                      <span style={{ textAlign: 'right', fontWeight: 700, color: g.derby ? 'var(--th-gold)' : 'var(--th-text-strong)' }}>{g.home}{g.derby && ' ⚔'}</span>
                      <span style={{ fontSize: 10, color: 'var(--th-text-faint)', fontWeight: 700 }}>–</span>
                      <span style={{ color: g.derby ? 'var(--th-gold)' : 'var(--th-text-body)' }}>{g.away}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: 16, fontSize: 11.5, color: 'var(--th-text-faint)', fontFamily: 'var(--font-manrope)' }}>
        Farbiger Tag = Liga · ⚔ = Derby (beide Teams im selben Lokal) · „bis X parallel" = Kapazität des Lokals (rot = überschritten).
      </p>
    </div>
  );
}
