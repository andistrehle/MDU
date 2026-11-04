'use client';

// ============================================================
// Highlights je Spieltag (Spielerprofil, Betreiber 04.11.2026)
// ============================================================
// X-Achse: alle bisherigen Spieltage des Teams (auch ohne Einsatz).
// Je Spieltag vier Balken nebeneinander — High Finishes · 180er · 171er ·
// Short Legs (Höhe = Anzahl an dem Abend), darüber eine Linie mit der
// aufsummierten Gesamtzahl aller Highlights. Beides ist eine Anzahl, also
// EINE Achse. Farben: Kategorie-Palette (Slots 1–4, mit dem Validator
// geprüft, hell und dunkel); die Linie in Textfarbe, damit sie keine fünfte
// Serie vortäuscht. Im hellen Modus liegen zwei Farben unter 3:1 → Legende,
// Werte im Tooltip und die Tabelle darunter tragen die Werte mit.
// ============================================================

import { useState } from 'react';

export interface DiagrammSpieltag {
  /** Spieltag-Nummer der Liga */
  nr: number;
  datum: string | null;
  gegner: string;
  heim: boolean;
  hf: number; b180: number; b171: number; sl: number;
}

const SERIEN = [
  { k: 'hf', name: 'High Finishes', v: '--hl-1' },
  { k: 'b180', name: '180er', v: '--hl-2' },
  { k: 'b171', name: '171er', v: '--hl-3' },
  { k: 'sl', name: 'Short Legs', v: '--hl-4' },
] as const;

const datumKurz = (iso: string | null) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.` : '');

export function HighlightDiagramm({ spieltage }: { spieltage: DiagrammSpieltag[] }) {
  const [aktiv, setAktiv] = useState<number | null>(null);
  if (!spieltage.length) return null;

  const kum = spieltage.reduce<number[]>((acc, s) => [...acc, (acc[acc.length - 1] ?? 0) + s.hf + s.b180 + s.b171 + s.sl], []);
  const gesamt = kum[kum.length - 1] ?? 0;
  const maxBalken = Math.max(0, ...spieltage.flatMap(s => [s.hf, s.b180, s.b171, s.sl]));
  const maxY = Math.max(4, gesamt, maxBalken);
  // „Schöne“ Teilung der Achse in 1/2/5er-Schritten, höchstens 4 Linien.
  const schritt = [1, 2, 5, 10, 20, 50].find(st => maxY / st <= 4) ?? 100;
  const oben = Math.ceil(maxY / schritt) * schritt;

  const n = spieltage.length;
  const W = Math.max(320, n * 46), H = 190, L = 28, R = 10, T = 14, B = 30;
  const breite = (W - L - R) / n;
  const bar = Math.min(7, (breite - 10) / 4 - 2);
  const y = (v: number) => T + (1 - v / oben) * (H - T - B);
  const cx = (i: number) => L + breite * (i + 0.5);
  const tipp = aktiv != null ? spieltage[aktiv] : null;

  return (
    <figure className="hl-diag" style={{ margin: 0 }}>
      <style>{`
        .hl-diag { --hl-1:#3987e5; --hl-2:#d95926; --hl-3:#199e70; --hl-4:#c98500; }
        html[data-theme="light"] .hl-diag { --hl-1:#2a78d6; --hl-2:#eb6834; --hl-3:#1baf7a; --hl-4:#eda100; }
      `}</style>

      {/* Legende (immer, ≥ 2 Serien) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginBottom: 8, fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-muted)' }}>
        {SERIEN.map(s => (
          <span key={s.k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: `var(${s.v})` }} />{s.name}
          </span>
        ))}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 2, background: 'var(--th-text-strong)', borderRadius: 1 }} />Gesamt (aufsummiert)
        </span>
      </div>

      <div style={{ position: 'relative', overflowX: 'auto' }} onMouseLeave={() => setAktiv(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} width={W > 520 ? W : '100%'} style={{ display: 'block', minWidth: W > 520 ? W : undefined, fontFamily: 'var(--font-manrope)' }}
          role="img" aria-label={`Highlights je Spieltag, insgesamt ${gesamt}`}>
          {Array.from({ length: oben / schritt + 1 }, (_, i) => i * schritt).map(v => (
            <g key={v}>
              <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--th-line-8)" strokeWidth={1} strokeDasharray={v === 0 ? undefined : '3 4'} />
              <text x={L - 6} y={y(v) + 3.5} textAnchor="end" fontSize={10} fill="var(--th-text-faint)">{v}</text>
            </g>
          ))}

          {spieltage.map((s, i) => {
            const x0 = cx(i) - (4 * bar + 3 * 2) / 2;
            return (
              <g key={i}>
                {aktiv === i && <rect x={cx(i) - breite / 2} y={T} width={breite} height={H - T - B} fill="var(--th-line-4)" />}
                {SERIEN.map((ser, j) => {
                  const v = s[ser.k];
                  if (!v) return null;
                  const h = y(0) - y(v), x = x0 + j * (bar + 2);
                  // oben gerundet, unten an der Grundlinie gerade
                  const r = Math.min(2, bar / 2, h);
                  return <path key={ser.k} fill={`var(${ser.v})`}
                    d={`M${x},${y(0)} V${y(v) + r} Q${x},${y(v)} ${x + r},${y(v)} H${x + bar - r} Q${x + bar},${y(v)} ${x + bar},${y(v) + r} V${y(0)} Z`} />;
                })}
                <text x={cx(i)} y={H - 16} textAnchor="middle" fontSize={10} fill="var(--th-text-faint)">{s.nr}.</text>
                <text x={cx(i)} y={H - 5} textAnchor="middle" fontSize={8.5} fill="var(--th-text-faint)">{datumKurz(s.datum)}</text>
              </g>
            );
          })}

          {/* Linie: aufsummierte Gesamtzahl */}
          {n > 1 && <polyline points={kum.map((v, i) => `${cx(i)},${y(v)}`).join(' ')} fill="none" stroke="var(--th-text-strong)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {kum.map((v, i) => <circle key={i} cx={cx(i)} cy={y(v)} r={4} fill="var(--th-text-strong)" stroke="var(--th-bg-card)" strokeWidth={2} />)}
          <text x={Math.min(cx(n - 1), W - R - 4)} y={y(kum[n - 1]) - 9} textAnchor={n > 1 ? 'end' : 'middle'} fontSize={11} fontWeight={800} fill="var(--th-text-strong)">{gesamt}</text>

          {/* Trefferflächen je Spieltag (größer als die Balken) */}
          {spieltage.map((_, i) => (
            <rect key={i} x={cx(i) - breite / 2} y={0} width={breite} height={H} fill="transparent"
              onMouseEnter={() => setAktiv(i)} onClick={() => setAktiv(a => (a === i ? null : i))} style={{ cursor: 'pointer' }} />
          ))}
        </svg>

        {tipp && aktiv != null && (
          <div role="status" style={{
            position: 'absolute', top: 4, width: 140, pointerEvents: 'none',
            // Neben die Spalte, nicht darüber — sonst verdeckt er Balken und Linie; am Rand eingefangen.
            left: cx(aktiv) / W <= 0.5
              ? `min(calc(${((cx(aktiv) + Math.min(breite / 2, 24)) / W) * 100}% + 4px), calc(100% - 140px))`
              : `max(0px, calc(${((cx(aktiv) - Math.min(breite / 2, 24)) / W) * 100}% - 144px))`,
            background: 'var(--th-bg-card)', border: '1px solid var(--th-line-10)', borderRadius: 8, padding: '7px 9px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)', fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-body)', lineHeight: 1.5,
          }}>
            <div style={{ fontWeight: 800, color: 'var(--th-text-strong)' }}>{tipp.nr}. Spieltag {datumKurz(tipp.datum)}</div>
            <div style={{ color: 'var(--th-text-muted)', marginBottom: 3 }}>{tipp.heim ? 'gegen' : 'bei'} {tipp.gegner}</div>
            {SERIEN.map(s => (
              <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: `var(${s.v})` }} />
                <span style={{ flex: 1 }}>{s.name}</span><strong style={{ color: 'var(--th-text-strong)' }}>{tipp[s.k]}</strong>
              </div>
            ))}
            <div style={{ marginTop: 3, borderTop: '1px solid var(--th-line-8)', paddingTop: 3, display: 'flex' }}>
              <span style={{ flex: 1 }}>Gesamt bis hier</span><strong style={{ color: 'var(--th-text-strong)' }}>{kum[aktiv]}</strong>
            </div>
          </div>
        )}
      </div>

      <figcaption style={{ marginTop: 4, fontSize: 11.5, color: 'var(--th-text-faint)', fontFamily: 'var(--font-manrope)' }}>
        {gesamt === 0 ? 'Noch keine Highlights in dieser Saison. ' : ''}Balken: Highlights am jeweiligen Spieltag des Teams · Linie: alle Highlights der Saison aufsummiert. Antippen zeigt die Werte.
      </figcaption>

      <details style={{ marginTop: 6, fontFamily: 'var(--font-manrope)', fontSize: 12 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--th-accent)', fontWeight: 700 }}>Als Tabelle</summary>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', marginTop: 6, width: '100%', color: 'var(--th-text-body)' }}>
            <thead>
              <tr style={{ color: 'var(--th-text-muted)', textAlign: 'right' }}>
                <th style={{ textAlign: 'left', padding: '3px 6px' }}>Spieltag</th>
                {SERIEN.map(s => <th key={s.k} style={{ padding: '3px 6px', fontWeight: 700 }}>{s.name}</th>)}
                <th style={{ padding: '3px 6px' }}>Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {spieltage.map((s, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--th-line-4)', textAlign: 'right' }}>
                  <td style={{ textAlign: 'left', padding: '3px 6px' }}>{s.nr}. {datumKurz(s.datum)} {s.heim ? 'gg.' : 'bei'} {s.gegner}</td>
                  <td style={{ padding: '3px 6px' }}>{s.hf}</td><td style={{ padding: '3px 6px' }}>{s.b180}</td>
                  <td style={{ padding: '3px 6px' }}>{s.b171}</td><td style={{ padding: '3px 6px' }}>{s.sl}</td>
                  <td style={{ padding: '3px 6px', fontWeight: 800, color: 'var(--th-text-strong)' }}>{kum[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
