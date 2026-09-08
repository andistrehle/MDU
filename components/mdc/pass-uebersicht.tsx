'use client';

// ============================================================
// MDC — Passnummern: vergeben, frei, doppelt
// ============================================================
//
// Antwortet auf genau eine Frage: „Welche Nummer kann ich als nächste
// vergeben?" — und daneben auf die unangenehme: „Welche trägt jemand zweimal?"
//
// Die Liste ist nach Nummer sortiert, nicht nach Name oder Platzierung. Das
// ist der ganze Punkt: Im Spielerverzeichnis stehen die Nummern verstreut,
// hier stehen sie der Reihe nach, und die Lücken sieht man auf einen Blick.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Hash, History, KeyRound, Users } from 'lucide-react';
import { StatCard } from './ui';
import { mdcPath } from '@/lib/mdc/site';

export interface PassInhaberAnsicht {
  playerId: string;
  name: string;
  division: 'men' | 'women';
  /** Klartext der Wertung, aus der die Person stammt. */
  quelle: string;
  letzterStart: string | null;
  starts: number;
  aktuell: boolean;
}

export interface PassZeile {
  passNr: number;
  inhaber: PassInhaberAnsicht[];
}

export interface PassUebersichtProps {
  zeilen: PassZeile[];
  frei: number[];
  naechsteNeue: number;
  kleinsteLuecke: number | null;
  hoechsteVergebene: number;
}

const zahl = new Intl.NumberFormat('de-DE');

function datum(iso: string | null): string {
  if (!iso) return 'noch kein Turnier auf der Seite';
  const [j, m, t] = iso.split('-');
  return `${t}.${m}.${j}`;
}

export function PassUebersicht({
  zeilen, frei, naechsteNeue, kleinsteLuecke, hoechsteVergebene,
}: PassUebersichtProps) {
  const [suche, setSuche] = useState('');
  const [nurFreie, setNurFreie] = useState(false);

  const doppelt = useMemo(() => zeilen.filter(z => z.inhaber.length > 1), [zeilen]);
  const belegt = useMemo(() => new Map(zeilen.map(z => [z.passNr, z])), [zeilen]);

  /** Alle Nummern von 1 bis zur höchsten — belegte und Lücken in einer Reihe. */
  const alle = useMemo(
    () => Array.from({ length: hoechsteVergebene }, (_, i) => i + 1),
    [hoechsteVergebene],
  );

  const q = suche.trim().toLowerCase();
  const gefiltert = useMemo(() => {
    let liste = alle;
    if (nurFreie) liste = liste.filter(n => !belegt.has(n));
    if (!q) return liste;
    // Reine Ziffern suchen die Nummer, alles andere den Namen.
    if (/^\d+$/.test(q)) return liste.filter(n => String(n).includes(q));
    return liste.filter(n => belegt.get(n)?.inhaber.some(i => i.name.toLowerCase().includes(q)));
  }, [alle, belegt, nurFreie, q]);

  /** Volltreffer bei der Suche nach einer Nummer — die Antwort steht dann oben. */
  const treffer = /^\d+$/.test(q) ? Number(q) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div
        style={{
          display: 'grid', gap: 14,
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        }}
      >
        <StatCard
          label="Nächste neue Nummer"
          value={String(naechsteNeue)}
          sub="eine über der höchsten vergebenen — kann nie doppelt sein"
          icon={<KeyRound size={18} />}
        />
        <StatCard
          label="Vergeben"
          value={zahl.format(zeilen.length)}
          sub={`höchste Nummer: ${hoechsteVergebene}`}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Lücken"
          value={zahl.format(frei.length)}
          sub={kleinsteLuecke === null
            ? `keine zwischen 1 und ${hoechsteVergebene}`
            : `ab ${kleinsteLuecke} — nicht neu vergeben`}
          icon={<Hash size={18} />}
        />
        <StatCard
          label="Neu vergeben"
          value={String(doppelt.length)}
          sub={doppelt.length ? 'Nummer hatte schon mal jemand anderen' : 'jede Nummer hatte nur einen Inhaber'}
          icon={<History size={18} />}
        />
      </div>

      <div
        className="mdc-card mdc-card-accent"
        style={{ padding: '18px 18px 20px' }}
      >
        <h2 className="mdc-display" style={{ fontSize: '1.1rem' }}>
          Die nächste Nummer ist die {naechsteNeue}
        </h2>
        <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          Immer oben weiterzählen, nie eine Lücke auffüllen. Eine Lücke heißt nur, dass
          die Seite diese Nummer nicht kennt — wer seinen Pass in der Schublade hat und
          zwei Jahre nicht gespielt hat, steht in keiner Wertung und reißt hier ein Loch.
          Genau so sind die {zahl.format(zeilen.filter(z => z.inhaber.length > 1).length)}{' '}
          doppelt vergebenen Nummern entstanden. Eine Nummer über der höchsten kann
          dagegen nie kollidieren.
        </p>
      </div>

      <div className="mdc-card" style={{ padding: '18px 18px 20px' }}>
        <label style={{ display: 'block' }}>
          <span
            className="mdc-display"
            style={{ fontSize: '0.72rem', letterSpacing: '0.14em', color: 'var(--mdc-ink-dim)' }}
          >
            Nummer oder Name suchen
          </span>
          <input
            value={suche}
            onChange={e => setSuche(e.target.value)}
            placeholder="z. B. 305 oder Meyer"
            inputMode="search"
            style={{
              marginTop: 8, width: '100%', padding: '11px 13px', fontSize: '1rem',
              border: '1px solid var(--mdc-line-hard)', borderRadius: 10,
              background: 'var(--mdc-card-2)', color: 'var(--mdc-ink)',
            }}
          />
        </label>

        {treffer !== null && (
          <div
            style={{
              marginTop: 14, padding: '14px 16px', borderRadius: 10,
              border: `1px solid ${belegt.has(treffer) ? 'var(--mdc-line)' : 'var(--mdc-blue-soft)'}`,
              background: belegt.has(treffer) ? 'var(--mdc-tint)' : 'var(--mdc-blue-a08)',
            }}
          >
            {belegt.has(treffer) ? (
              <>
                <strong>Passnr. {treffer} ist vergeben.</strong>
                {belegt.get(treffer)!.inhaber.map(i => (
                  <div key={i.playerId} style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.6 }}>
                    <Link href={mdcPath(`/spieler/${i.playerId}`)}>{i.name}</Link>
                    {' · '}{i.division === 'women' ? 'Damen' : 'Herren'}
                    {' · '}{i.quelle}
                    {' · '}{i.starts} {i.starts === 1 ? 'Start' : 'Starts'}
                    {i.starts > 0 && <>, zuletzt {datum(i.letzterStart)}</>}
                    {belegt.get(treffer)!.inhaber.length > 1 && (
                      <span className={`mdc-chip ${i.aktuell ? 'mdc-chip-red' : ''}`} style={{ marginLeft: 8 }}>
                        {i.aktuell ? 'trägt sie heute' : 'früherer Inhaber'}
                      </span>
                    )}
                  </div>
                ))}
              </>
            ) : (
              <>
                <strong>Passnr. {treffer} ist nicht vergeben</strong> — jedenfalls kennt die
                Seite niemanden mit dieser Nummer.
                {treffer > hoechsteVergebene ? (
                  <> Sie liegt über der höchsten vergebenen ({hoechsteVergebene}) und kann
                    bedenkenlos vergeben werden.</>
                ) : (
                  <> Sie ist eine Lücke unterhalb der höchsten vergebenen — vielleicht hat
                    doch jemand einen alten Pass damit. Sicher ist die {naechsteNeue}.</>
                )}
              </>
            )}
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, fontSize: '0.9rem' }}>
          <input type="checkbox" checked={nurFreie} onChange={e => setNurFreie(e.target.checked)} />
          Nur die Lücken zeigen
        </label>
      </div>

      {doppelt.length > 0 && (
        <div className="mdc-card" style={{ padding: '18px 18px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 9 }}>
            <History size={18} style={{ color: 'var(--mdc-red)' }} />
            Nummern mit einem zweiten Inhaber
          </h2>
          <p style={{ marginTop: 8, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
            Diese Nummern stehen bei zwei Menschen — in aller Regel, weil die Nummer nach
            dem Aufhören des ersten neu vergeben wurde.{' '}
            <strong>Für die Ergebnisse ist das folgenlos:</strong> Jede Saison löst ihre
            Passnummern über ihre eigene Rangliste auf, innerhalb einer Wertung ist keine
            Nummer doppelt. Der eine kann dem anderen sein Turnier also nicht wegnehmen.
            Wo es auf einen einzelnen Namen ankommt — beim Ergebnis-Upload — gilt der aus
            der jüngeren Wertung.
          </p>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {doppelt.map(z => (
              <div
                key={z.passNr}
                style={{
                  padding: '11px 13px', borderRadius: 9, background: 'var(--mdc-card)',
                  border: '1px solid var(--mdc-line)',
                }}
              >
                <div className="mdc-display" style={{ fontSize: '0.95rem' }}>Passnr. {z.passNr}</div>
                {z.inhaber.map(i => (
                  <div key={i.playerId} style={{ marginTop: 6, fontSize: '0.88rem', lineHeight: 1.6 }}>
                    <span className={`mdc-chip ${i.aktuell ? 'mdc-chip-red' : ''}`} style={{ marginRight: 8 }}>
                      {i.aktuell ? 'heute' : 'früher'}
                    </span>
                    <Link href={mdcPath(`/spieler/${i.playerId}`)}>{i.name}</Link>
                    {' · '}{i.quelle}
                    {' · '}{i.starts} {i.starts === 1 ? 'Start' : 'Starts'}
                    {i.starts > 0 && <>, zuletzt {datum(i.letzterStart)}</>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mdc-card" style={{ padding: '18px 18px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.1rem' }}>
            Nummern der Reihe nach
          </h2>
          <span style={{ fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
            {zahl.format(gefiltert.length)} von {zahl.format(alle.length)} angezeigt
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10, fontSize: '0.8rem', color: 'var(--mdc-ink-dim)' }}>
          <span><b style={{ color: 'var(--mdc-ink)' }}>Fett</b> = vergeben</span>
          <span>Blass = Lücke</span>
          <span style={{ color: 'var(--mdc-red-deep)' }}>Rot = zweiter Inhaber</span>
        </div>

        {gefiltert.length === 0 ? (
          <p style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--mdc-ink-soft)' }}>
            Dazu passt keine Nummer.
          </p>
        ) : (
          <div
            style={{
              marginTop: 14, display: 'grid', gap: 6,
              gridTemplateColumns: 'repeat(auto-fill, minmax(58px, 1fr))',
            }}
          >
            {gefiltert.map(n => {
              const zeile = belegt.get(n);
              const dopp = (zeile?.inhaber.length ?? 0) > 1;
              const namen = zeile?.inhaber.map(i => i.name).join(' / ');
              return (
                <span
                  key={n}
                  title={zeile ? `Passnr. ${n}: ${namen}` : `Passnr. ${n} — Lücke, nicht vergeben`}
                  style={{
                    padding: '7px 4px', textAlign: 'center', borderRadius: 7,
                    fontVariantNumeric: 'tabular-nums', fontSize: '0.85rem',
                    border: `1px solid ${dopp ? 'var(--mdc-red-a35)' : 'var(--mdc-line-soft)'}`,
                    background: zeile
                      ? (dopp ? 'var(--mdc-red-a08)' : 'var(--mdc-tint)')
                      : 'transparent',
                    color: zeile
                      ? (dopp ? 'var(--mdc-red-deep)' : 'var(--mdc-ink)')
                      : 'var(--mdc-ink-faint)',
                    fontWeight: zeile ? 700 : 400,
                  }}
                >
                  {n}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
