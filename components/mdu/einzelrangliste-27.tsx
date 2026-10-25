'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TeamBadge } from './team-badge';
import { team27, findLiga27 } from '@/lib/data/saison-2027';
import type { EinzelZeile } from '@/lib/einzelrangliste-2027';

// Einzelrangliste 2026/27 einer Liga, gerechnet in lib/einzelrangliste-2027.ts
// aus den Spielberichten. Umschalter (Betreiber, 25.10.2026): Punkte (die
// Rangliste) · 180er · 171er · High Finishes · Short Legs — die Highlight-Listen
// auch über alle Ligen. High Finishes / Short Legs: nach Anzahl, bei
// Gleichstand entscheidet der Bestwert (höchstes Finish / kürzestes Leg).
// Desktop: Tabelle mit allen Spalten. Handy: zwei Zeilen je Spieler
// (Name oben, Werte klein darunter) wie in der Saison 2025/26.

type Art = 'punkte' | '180' | '171' | 'hf' | 'sl';
const ARTEN: { key: Art; label: string }[] = [
  { key: 'punkte', label: 'Punkte' }, { key: '180', label: '180er' }, { key: '171', label: '171er' },
  { key: 'hf', label: 'High Finishes' }, { key: 'sl', label: 'Short Legs' },
];

const anzahl = (z: EinzelZeile, a: Art) => a === '180' ? z.b180 : a === '171' ? z.b171 : a === 'hf' ? z.hfAnzahl : a === 'sl' ? z.slAnzahl : z.points;
/** Bestwert: höher ist besser beim Finish, niedriger beim Short Leg. */
const best = (z: EinzelZeile, a: Art) => a === 'hf' ? (z.highFinish ?? 0) : a === 'sl' ? -(z.shortLeg ?? 99) : 0;

function statListe(zeilen: EinzelZeile[], a: Art): EinzelZeile[] {
  const vgl = (x: EinzelZeile, y: EinzelZeile) => (anzahl(y, a) - anzahl(x, a)) || (best(y, a) - best(x, a));
  const s = zeilen.filter(z => anzahl(z, a) > 0).sort((x, y) => vgl(x, y) || x.name.localeCompare(y.name, 'de'));
  let pos = 0;
  return s.map((z, i) => { if (i === 0 || vgl(s[i - 1], z) !== 0) pos = i + 1; return { ...z, pos }; });
}

const mono: React.CSSProperties = { fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, textAlign: 'right', color: 'var(--th-text-muted)' };
const mitBest = (n: number, b: number | null, einheit = '') => n ? <>{n}{b != null && <span style={{ color: 'var(--th-text-faint)' }}> ({b}{einheit})</span>}</> : '';

export function Einzelrangliste27({ zeilen, alle, bestOf = 3 }: { zeilen: EinzelZeile[]; alle?: EinzelZeile[]; bestOf?: 3 | 5 }) {
  const [art, setArt] = useState<Art>('punkte');
  const [gesamt, setGesamt] = useState(false);
  if (!zeilen.length && !alle?.length) {
    return <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-muted)', margin: 0, padding: '14px 16px' }}>Noch keine Einzel gespielt. Die Rangliste füllt sich mit dem ersten eingereichten Spielbericht.</p>;
  }
  const quelle = art !== 'punkte' && gesamt && alle ? alle : zeilen;
  const liste = art === 'punkte' ? zeilen : statListe(quelle, art);
  const offen = liste.some(z => z.offen > 0);
  const chip = (an: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5,
    border: `1.5px solid ${an ? 'var(--th-accent)' : 'var(--th-line-10)'}`, background: an ? 'var(--th-accent)' : 'transparent', color: an ? '#fff' : 'var(--th-text-body)',
  });

  const punkteCols = '34px minmax(0,1.6fr) minmax(0,1fr) 50px 54px 38px 38px 64px 60px 40px';
  const statCols = '34px minmax(0,1.6fr) minmax(0,1fr) 70px 90px 50px';
  const kopf: React.CSSProperties = { display: 'grid', gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--th-text-muted)' };
  const rang = (z: EinzelZeile) => <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14, color: z.pos <= 3 ? 'var(--th-gold, #B8860B)' : 'var(--th-text-faint)' }}>{z.pos}.</span>;
  const nameEl = (z: EinzelZeile) => {
    const n = <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 600, fontSize: 13, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
      {z.name}{z.offen > 0 && <span title="Enthält Ergebnisse, die der Gegner noch nicht bestätigt hat" style={{ color: '#9A6B00', fontWeight: 800 }}> *</span>}
    </span>;
    return z.playerId ? <Link href={`/spieler/${z.playerId}`} style={{ minWidth: 0, textDecoration: 'none', overflow: 'hidden' }}>{n}</Link> : <span style={{ minWidth: 0, overflow: 'hidden' }}>{n}</span>;
  };
  const team = (z: EinzelZeile, kurz = false) => {
    const t = team27(z.teamId);
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <TeamBadge initials={(t?.short ?? z.teamId).slice(0, 3)} color={t?.color} logoUrl={t?.logoUrl ?? undefined} size={kurz ? 22 : 18} ring="transparent" />
        {!kurz && <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t?.short ?? t?.name ?? z.teamId}{gesamt && art !== 'punkte' && t ? <span style={{ color: 'var(--th-text-faint)' }}> · {findLiga27(t.league)?.name}</span> : null}</span>}
      </span>
    );
  };
  const punkt = <span style={{ margin: '0 5px', color: 'var(--th-text-faint)' }}>·</span>;

  return (
    <div className="e27">
      <style>{`.e27 .e27-m{display:none}@media (max-width:640px){.e27 .e27-d{display:none}.e27 .e27-m{display:block}}`}</style>
      {/* Umschalter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '12px 14px', borderBottom: '1px solid var(--th-line-4)', alignItems: 'center' }}>
        {ARTEN.map(a => <button key={a.key} type="button" onClick={() => setArt(a.key)} style={chip(art === a.key)}>{a.label}</button>)}
        {art !== 'punkte' && alle && (
          <span style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <button type="button" onClick={() => setGesamt(false)} style={chip(!gesamt)}>Diese Liga</button>
            <button type="button" onClick={() => setGesamt(true)} style={chip(gesamt)}>Alle Ligen</button>
          </span>
        )}
      </div>

      {!liste.length ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', margin: 0, padding: '14px 16px' }}>Noch keine {ARTEN.find(a => a.key === art)?.label} eingetragen.</p>
      ) : (
        <>
          {/* Desktop */}
          <div className="e27-d">
            {art === 'punkte' ? (
              <>
                <div style={{ ...kopf, gridTemplateColumns: punkteCols }}>
                  <span>#</span><span>Spieler</span><span>Team</span>
                  <span style={{ textAlign: 'right' }} title="Siege – Niederlagen">S-N</span>
                  <span style={{ textAlign: 'right' }}>Legs</span>
                  <span style={{ textAlign: 'right' }}>180</span>
                  <span style={{ textAlign: 'right' }}>171</span>
                  <span style={{ textAlign: 'right' }} title="High Finishes (höchstes)">HF</span>
                  <span style={{ textAlign: 'right' }} title="Short Legs (kürzestes, Darts)">SL</span>
                  <span style={{ textAlign: 'right' }}>Pkt.</span>
                </div>
                {liste.map((z, i) => (
                  <div key={z.key} style={{ display: 'grid', gridTemplateColumns: punkteCols, gap: 6, alignItems: 'center', padding: '8px 14px', borderBottom: i < liste.length - 1 ? '1px solid var(--th-line-3)' : 'none' }}>
                    {rang(z)}{nameEl(z)}{team(z)}
                    <span style={mono}>{z.wins}-{z.losses}</span>
                    <span style={mono}>{z.legsWon}:{z.legsLost}</span>
                    <span style={mono}>{z.b180 || ''}</span>
                    <span style={mono}>{z.b171 || ''}</span>
                    <span style={mono}>{mitBest(z.hfAnzahl, z.highFinish)}</span>
                    <span style={mono}>{mitBest(z.slAnzahl, z.shortLeg)}</span>
                    <span style={{ ...mono, fontWeight: 800, fontSize: 13, color: 'var(--th-text-strong)' }}>{z.points}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div style={{ ...kopf, gridTemplateColumns: statCols }}>
                  <span>#</span><span>Spieler</span><span>Team</span>
                  <span style={{ textAlign: 'right' }}>Anzahl</span>
                  <span style={{ textAlign: 'right' }}>{art === 'hf' ? 'Höchstes' : art === 'sl' ? 'Kürzestes' : ''}</span>
                  <span style={{ textAlign: 'right' }} title="Siege – Niederlagen">S-N</span>
                </div>
                {liste.map((z, i) => (
                  <div key={z.key} style={{ display: 'grid', gridTemplateColumns: statCols, gap: 6, alignItems: 'center', padding: '8px 14px', borderBottom: i < liste.length - 1 ? '1px solid var(--th-line-3)' : 'none' }}>
                    {rang(z)}{nameEl(z)}{team(z)}
                    <span style={{ ...mono, fontWeight: 800, fontSize: 13, color: 'var(--th-text-strong)' }}>{anzahl(z, art)}</span>
                    <span style={mono}>{art === 'hf' ? z.highFinish ?? '' : art === 'sl' && z.shortLeg != null ? `${z.shortLeg} Darts` : ''}</span>
                    <span style={mono}>{z.wins}-{z.losses}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Handy: Name oben, Werte klein darunter */}
          <div className="e27-m">
            {liste.map((z, i) => (
              <div key={z.key} style={{ padding: '9px 14px', borderBottom: i < liste.length - 1 ? '1px solid var(--th-line-3)' : 'none' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '26px minmax(0,1fr) auto', gap: 8, alignItems: 'center' }}>
                  {rang(z)}{nameEl(z)}{team(z, true)}
                </div>
                <div style={{ paddingLeft: 34, marginTop: 3, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10.5, color: 'var(--th-text-faint)', lineHeight: 1.6 }}>
                  {art === 'punkte' ? (
                    <>
                      <span style={{ color: 'var(--th-text-strong)', fontWeight: 700, fontFamily: 'var(--font-saira-condensed)', fontSize: 13 }}>{z.points} Pkt.</span>
                      {punkt}{z.wins}-{z.losses}{punkt}{z.legsWon}:{z.legsLost} Legs
                      {z.b180 > 0 && <>{punkt}180×{z.b180}</>}
                      {z.b171 > 0 && <>{punkt}171×{z.b171}</>}
                      {z.hfAnzahl > 0 && <>{punkt}HF {z.hfAnzahl} ({z.highFinish})</>}
                      {z.slAnzahl > 0 && <>{punkt}SL {z.slAnzahl} ({z.shortLeg})</>}
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'var(--th-text-strong)', fontWeight: 700, fontFamily: 'var(--font-saira-condensed)', fontSize: 13 }}>{anzahl(z, art)}× {ARTEN.find(a => a.key === art)?.label}</span>
                      {art === 'hf' && z.highFinish != null && <>{punkt}höchstes {z.highFinish}</>}
                      {art === 'sl' && z.shortLeg != null && <>{punkt}kürzestes {z.shortLeg} Darts</>}
                      {punkt}{z.wins}-{z.losses}
                      {gesamt && <>{punkt}{findLiga27(team27(z.teamId)?.league)?.name}</>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', lineHeight: 1.5 }}>
        {art === 'punkte'
          ? <>Nur Einzel: {bestOf === 5 ? '3:0 = 5 · 3:1 = 4 · 3:2 = 3 · 2:3 = 2 · 1:3 = 1 · 0:3 = 0' : '2:0 = 3 · 2:1 = 2 · 1:2 = 1 · 0:2 = 0'} Punkte. Reihenfolge: Punkte, dann Legdifferenz, dann Siege. HF = High Finishes (höchstes), SL = Short Legs (kürzestes, Darts).</>
          : art === 'hf' || art === 'sl'
            ? <>Sortiert nach Anzahl, bei Gleichstand nach dem {art === 'hf' ? 'höchsten Finish' : 'kürzesten Leg'}. Aus den Highlights der Spielberichte.</>
            : <>Sortiert nach Anzahl. Aus den Highlights der Spielberichte.</>}
        {offen && <div><span style={{ color: '#9A6B00', fontWeight: 800 }}>*</span> enthält Ergebnisse, die der Gegner noch nicht bestätigt hat.</div>}
      </div>
    </div>
  );
}
