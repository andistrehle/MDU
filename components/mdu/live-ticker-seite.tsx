'use client';

// Seite /live: alle Begegnungen des heutigen Spieltags, nach Liga filterbar,
// je Begegnung aufklappbar mit den Partien (Spieler + Legs). Live-Stände sind
// vorläufig — zählen tut erst der eingereichte Spielbericht.

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LIVE_ROT, LivePunktStil, useLiveTicker } from './live-ticker';
import { SPIELE_JE_BEGEGNUNG, type TickerAnzeige } from '@/lib/live-ticker';

type Liga = { code: string; name: string; farbe: string };

const datumText = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

export function LiveTickerSeite({ ligen }: { ligen: Liga[] }) {
  const d = useLiveTicker(30);
  const params = useSearchParams();
  const start = params.get('liga');
  // ?spiel=<Heim|Gast> (geteilter Live-Link): dieses Spiel aufklappen und hinspringen.
  const spiel = params.get('spiel');
  const [liga, setLiga] = useState<string | null>(ligen.some(l => l.code === start) ? start : null);
  const [offen, setOffen] = useState<string | null>(spiel);
  const geladen = !!d;
  useEffect(() => {
    if (!spiel || !geladen) return;
    document.getElementById(`spiel-${spiel}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [spiel, geladen]);

  if (!d) return <p style={{ fontFamily: 'var(--font-manrope)', color: 'var(--th-text-muted)' }}>Lade …</p>;
  const spiele = d.spiele.filter(s => !liga || s.liga === liga);
  const mitSpielen = new Set(d.spiele.map(s => s.liga));

  return (
    <div style={{ fontFamily: 'var(--font-manrope)' }}>
      <LivePunktStil />
      <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--th-text-body)' }}>
        <strong style={{ color: 'var(--th-text-strong)' }}>{datumText(d.datum)}</strong>
        {d.spiele.length ? ` · ${d.spiele.length} ${d.spiele.length === 1 ? 'Begegnung' : 'Begegnungen'}` : ''}
      </p>

      {!d.spiele.length && (
        <div style={{ padding: 20, borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', color: 'var(--th-text-body)', fontSize: 14 }}>
          Heute steht kein Spiel an. Der Ticker läuft an jedem Spieltag, sobald das erste Ergebnis eingetragen ist.{' '}
          <Link href="/spielplan" style={{ color: 'var(--th-accent)', fontWeight: 700 }}>Zum Spielplan</Link>
        </div>
      )}

      {d.spiele.length > 0 && (
        <>
          <nav aria-label="Liga wählen" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[{ code: '', name: 'Alle', farbe: 'var(--th-text-faint)' }, ...ligen.filter(l => mitSpielen.has(l.code))].map(l => {
              const an = (liga ?? '') === l.code;
              return (
                <button key={l.code || 'alle'} type="button" onClick={() => setLiga(l.code || null)} aria-pressed={an} style={{
                  padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12,
                  letterSpacing: '0.08em', textTransform: 'uppercase', background: an ? 'var(--th-text-strong)' : 'var(--th-bg-card)',
                  color: an ? 'var(--th-bg-page)' : 'var(--th-text-body)', border: '1px solid var(--th-line-8)', borderLeft: `3px solid ${l.farbe}`,
                }}>{l.name}</button>
              );
            })}
          </nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {spiele.map(s => <Karte key={s.key} s={s} auf={offen === s.key} umschalten={() => setOffen(offen === s.key ? null : s.key)} />)}
          </div>
          <p style={{ margin: '18px 0 0', fontSize: 12, color: 'var(--th-text-faint)' }}>
            Live-Stände sind vorläufig, so wie die Teams sie eintragen. In Tabelle und Rangliste zählt erst der eingereichte Spielbericht.
            Die Seite aktualisiert sich alle 30 Sekunden von selbst.
          </p>
        </>
      )}
    </div>
  );
}

function Karte({ s, auf, umschalten }: { s: TickerAnzeige; auf: boolean; umschalten: () => void }) {
  const etikett = s.status === 'live'
    ? <span style={{ color: LIVE_ROT, display: 'inline-flex', alignItems: 'center', gap: 5 }}><span className="mdu-live-punkt" aria-hidden /> LIVE · {s.gespielt}/{SPIELE_JE_BEGEGNUNG}</span>
    : s.status === 'beendet'
      ? <span>{s.wertung ? 'Wertung' : s.bestaetigt ? 'Endstand' : 'Endstand*'}</span>
      : <span>{s.uhrzeit ? `${s.uhrzeit} Uhr` : 'noch nicht begonnen'}</span>;
  const klappbar = s.spiele.length > 0;
  return (
    <div id={`spiel-${s.key}`} style={{ scrollMarginTop: 90, borderRadius: 12, background: 'var(--th-bg-card)', border: `1px solid ${s.status === 'live' ? LIVE_ROT : 'var(--th-line-8)'}`, borderLeft: `4px solid ${s.ligaFarbe}`, overflow: 'hidden' }}>
      <button type="button" onClick={klappbar ? umschalten : undefined} aria-expanded={klappbar ? auf : undefined} disabled={!klappbar} style={{
        width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '12px 14px', cursor: klappbar ? 'pointer' : 'default', color: 'inherit', font: 'inherit',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-faint)', marginBottom: 6 }}>
          <span>{s.ligaName}{s.ort ? ` · ${s.ort}` : ''}</span>
          {etikett}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--th-text-strong)' }}>{s.homeName}</span>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 800, fontSize: 22, color: s.status === 'offen' ? 'var(--th-text-faint)' : 'var(--th-text-strong)' }}>
            {s.status === 'offen' ? '–:–' : `${s.standHeim}:${s.standGast}`}
          </span>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--th-text-strong)', textAlign: 'right' }}>{s.awayName}</span>
        </div>
        {s.status === 'live' && (
          <div aria-hidden style={{ height: 3, borderRadius: 2, background: 'var(--th-line-8)', marginTop: 10 }}>
            <div style={{ height: 3, borderRadius: 2, background: LIVE_ROT, width: `${Math.round((s.gespielt / SPIELE_JE_BEGEGNUNG) * 100)}%` }} />
          </div>
        )}
        {klappbar && <div style={{ fontSize: 12, color: 'var(--th-text-muted)', marginTop: 8 }}>{auf ? 'Partien ausblenden ▲' : 'Partien anzeigen ▼'}</div>}
      </button>
      {auf && (
        <div style={{ borderTop: '1px solid var(--th-line-6)', padding: '6px 14px 12px' }}>
          {s.spiele.map(g => {
            const heimSieg = g.legsHeim > g.legsGast;
            return (
              <div key={g.nr} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto 1fr', gap: 8, alignItems: 'center', padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--th-line-4, var(--th-line-6))' }}>
                <span style={{ color: 'var(--th-text-faint)', fontSize: 11 }}>{g.nr}{g.doppel ? ' D' : ''}</span>
                <span style={{ fontWeight: heimSieg ? 700 : 400, color: 'var(--th-text-body)' }}>{g.heim.join(' / ') || '–'}</span>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: 'var(--th-text-strong)' }}>{g.legsHeim}:{g.legsGast}</span>
                <span style={{ fontWeight: !heimSieg ? 700 : 400, color: 'var(--th-text-body)', textAlign: 'right' }}>{g.gast.join(' / ') || '–'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
