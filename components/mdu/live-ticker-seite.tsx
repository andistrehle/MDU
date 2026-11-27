'use client';

// Seite /live: alle Begegnungen des heutigen Spieltags, nach Liga filterbar,
// je Begegnung aufklappbar mit den Partien (Spieler + Legs). Live-Stände sind
// vorläufig — zählen tut erst der eingereichte Spielbericht.

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LIVE_ROT, LivePunktStil, useLiveTicker } from './live-ticker';
import { SPIELE_JE_BEGEGNUNG, highlightKurz, type TickerAnzeige, type TickerHighlight } from '@/lib/live-ticker';
import type { LiveTabellenZeile } from '@/lib/live-tabelle';
import { useAuth } from '@/lib/auth/auth-context';
import { team27 } from '@/lib/data/saison-2027';

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
  // Reiter „Spiele · Live-Tabelle“ nur mit gewählter Liga (Betreiber 27.11.2026); ?ansicht=tabelle öffnet direkt die Tabelle.
  const [ansicht, setAnsicht] = useState<'spiele' | 'tabelle'>(params.get('ansicht') === 'tabelle' ? 'tabelle' : 'spiele');
  const { user } = useAuth();
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
          {(
            <div role="tablist" style={{ display: 'flex', gap: 4, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)', borderRadius: 999, padding: 4, marginBottom: 14, width: 'fit-content' }}>
              {([['spiele', 'Spiele'], ['tabelle', liga ? 'Live-Tabelle' : 'Live-Tabellen']] as const).map(([k, t]) => (
                <button key={k} role="tab" aria-selected={ansicht === k} type="button" onClick={() => setAnsicht(k)} style={{
                  padding: '7px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                  background: ansicht === k ? 'var(--th-accent)' : 'transparent', color: ansicht === k ? '#fff' : 'var(--th-text-muted)',
                }}>{t}</button>
              ))}
            </div>
          )}
          {ansicht === 'tabelle' ? (() => {
            // „Alle“: die Tabellen aller Ligen, die heute spielen, untereinander (Betreiber 27.11.2026: Reiter „Live-Tabellen“).
            const codes = (liga ? [liga] : ligen.map(l => l.code).filter(c => mitSpielen.has(c))).filter(c => d.tabellen?.[c]);
            if (!codes.length) return <p style={{ fontSize: 14, color: 'var(--th-text-muted)' }}>Die Live-Tabelle ist gerade nicht verfügbar.</p>;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {codes.map(c => {
                  const l = ligen.find(x => x.code === c);
                  return (
                    <section key={c}>
                      {!liga && <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-text-strong)', borderLeft: `3px solid ${l?.farbe ?? '#888'}`, paddingLeft: 8 }}>{l?.name ?? c}</h3>}
                      <LiveTabelle zeilen={d.tabellen![c]} eigenes={user?.teamId ?? null} hinweis={c === codes[codes.length - 1]} />
                    </section>
                  );
                })}
              </div>
            );
          })() : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {spiele.map(s => <Karte key={s.key} s={s} auf={offen === s.key} umschalten={() => setOffen(offen === s.key ? null : s.key)} />)}
            </div>
          )}
          <p style={{ margin: '18px 0 0', fontSize: 12, color: 'var(--th-text-faint)' }}>
            Live-Stände sind vorläufig, so wie die Teams sie eintragen. In Tabelle und Rangliste zählt erst der eingereichte Spielbericht.
            Die Seite aktualisiert sich alle 30 Sekunden von selbst.
          </p>
        </>
      )}
    </div>
  );
}

/** Live-Tabelle einer Liga (Betreiber 27.11.2026): „als wäre jetzt Schluss“, Pfeile zum Platz vor dem Abend,
 *  roter Punkt + Stand bei Teams, die heute spielen, eigenes Team hervorgehoben. Rechnung: lib/live-tabelle.ts. */
function LiveTabelle({ zeilen, eigenes, hinweis = true }: { zeilen: LiveTabellenZeile[]; eigenes: string | null; hinweis?: boolean }) {
  const name = (id: string) => team27(id)?.name ?? id;
  const zahl: React.CSSProperties = { width: 30, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' };
  return (
    <div>
      <div style={{ borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--th-text-muted)', borderBottom: '1px solid var(--th-line-6)' }}>
          <span style={{ width: 46 }}>Pl.</span><span style={{ flex: 1 }}>Team</span>
          <span style={zahl}>Sp</span><span style={{ ...zahl, width: 44 }}>Diff</span><span style={{ ...zahl, width: 36 }}>Pkt</span>
        </div>
        {zeilen.map(z => {
          const d = z.vorher - z.pos;
          const sd = z.spieleFor - z.spieleAgainst;
          const ich = z.team === eigenes;
          return (
            <div key={z.team} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderTop: '1px solid var(--th-line-4)', fontSize: 13.5,
              background: ich ? 'var(--th-accent-a07)' : undefined, boxShadow: ich ? 'inset 3px 0 0 var(--th-accent)' : undefined }}>
              <span style={{ width: 46, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, color: 'var(--th-text-strong)' }}>
                {z.pos}.
                {d !== 0 && <span title={`vor dem Abend Platz ${z.vorher}`} style={{ fontSize: 11, fontWeight: 800, color: d > 0 ? '#1E9E5A' : LIVE_ROT }}>{d > 0 ? '▲' : '▼'}{Math.abs(d)}</span>}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--th-text-strong)' }}>
                  {z.heute?.status === 'live' && <span className="mdu-live-punkt" aria-label="spielt gerade" style={{ color: LIVE_ROT, background: LIVE_ROT }} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name(z.team)}</span>
                </span>
                {z.heute && (
                  <span style={{ display: 'block', fontSize: 11.5, color: z.heute.status === 'live' ? LIVE_ROT : 'var(--th-text-muted)', fontWeight: 600 }}>
                    {z.heute.status === 'live' ? 'Live ' : 'Heute '}{z.heute.eigene}:{z.heute.andere} gg. {name(z.heute.gegner)}
                  </span>
                )}
              </span>
              <span style={{ ...zahl, color: 'var(--th-text-body)' }}>{z.sp}</span>
              <span style={{ ...zahl, width: 44, color: 'var(--th-text-body)' }}>{sd > 0 ? `+${sd}` : sd}</span>
              <span style={{ ...zahl, width: 36, fontWeight: 800, color: 'var(--th-text-strong)' }}>{z.pts}</span>
            </div>
          );
        })}
      </div>
      {hinweis && <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--th-text-faint)' }}>
        Stand „als wäre jetzt Schluss“: laufende Begegnungen zählen mit ihrem Zwischenstand. ▲▼ = Plätze gegenüber vor dem Spieltag. Die offizielle Tabelle zählt erst den eingereichten Spielbericht.
      </p>}
    </div>
  );
}

function Karte({ s, auf, umschalten }: { s: TickerAnzeige; auf: boolean; umschalten: () => void }) {
  const etikett = s.status === 'live'
    ? <span style={{ color: LIVE_ROT, display: 'inline-flex', alignItems: 'center', gap: 5 }}><span className="mdu-live-punkt" aria-hidden /> LIVE · {s.gespielt}/{SPIELE_JE_BEGEGNUNG}</span>
    : s.status === 'beendet'
      ? <span>{s.wertung ? 'Wertung' : s.bestaetigt ? 'Endstand' : 'Endstand*'}</span>
      : <span>{s.uhrzeit ? `${s.uhrzeit} Uhr` : 'noch nicht begonnen'}</span>;
  const klappbar = s.spiele.length > 0 || !!s.laufend?.length;
  return (
    <div id={`spiel-${s.key}`} style={{ scrollMarginTop: 90, borderRadius: 12, background: 'var(--th-bg-card)', border: `1px solid ${s.status === 'live' ? LIVE_ROT : 'var(--th-line-8)'}`, borderLeft: `4px solid ${s.ligaFarbe}`, overflow: 'hidden' }}>
      <button type="button" onClick={klappbar ? umschalten : undefined} aria-expanded={klappbar ? auf : undefined} disabled={!klappbar} style={{
        width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '12px 14px', cursor: klappbar ? 'pointer' : 'default', color: 'inherit', font: 'inherit',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-faint)', marginBottom: 6 }}>
          <span>{s.ligaName}{s.ort ? ` · ${s.ort}` : ''}</span>
          {etikett}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--th-text-strong)', overflowWrap: 'anywhere' }}>{s.homeName}</span>
          <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 800, fontSize: 22, color: s.status === 'offen' ? 'var(--th-text-faint)' : 'var(--th-text-strong)' }}>
            {s.status === 'offen' ? '–:–' : `${s.standHeim}:${s.standGast}`}
          </span>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--th-text-strong)', textAlign: 'right', overflowWrap: 'anywhere' }}>{s.awayName}</span>
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
          <AufstellungBlock s={s} />
          {s.spiele.map(g => {
            const heimSieg = g.legsHeim > g.legsGast;
            const hl = (s.highlights ?? []).filter(h => h.spiel === g.nr);
            return (
              <div key={g.nr} style={{ padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--th-line-4, var(--th-line-6))' }}>
                {/* minmax(0,1fr) + Umbruch: lange Namen dürfen nicht über den Rand schieben (Android, große Schrift, 14.11.2026) */}
                <div style={{ display: 'grid', gridTemplateColumns: '24px minmax(0,1fr) auto minmax(0,1fr)', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: 'var(--th-text-faint)', fontSize: 11 }}>{g.nr}{g.doppel ? ' D' : ''}</span>
                  <span style={{ fontWeight: heimSieg ? 700 : 400, color: 'var(--th-text-body)', overflowWrap: 'anywhere', minWidth: 0 }}>{g.heim.join(' / ') || '–'}</span>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: 'var(--th-text-strong)' }}>{g.legsHeim}:{g.legsGast}</span>
                  <span style={{ fontWeight: !heimSieg ? 700 : 400, color: 'var(--th-text-body)', textAlign: 'right', overflowWrap: 'anywhere', minWidth: 0 }}>{g.gast.join(' / ') || '–'}</span>
                </div>
                {hl.length > 0 && <HighlightZeile hl={hl} />}
              </div>
            );
          })}
          {(s.highlights ?? []).some(h => h.spiel == null) && (
            <div style={{ padding: '6px 0', fontSize: 12 }}>
              {/* Eigene Überschrift (Betreiber 20.11.2026): ohne sie sahen sie aus wie Highlights der letzten Zeile darüber. */}
              <div style={{ ...klein, margin: '4px 0 2px' }} title="Eingetragen bei einer Partie, die die Person verloren hat (ohne gewonnenes Leg) – sie wandern zur nächsten Partie der Person mit gewonnenem Leg.">Highlights, noch keiner Partie zugeordnet</div>
              <HighlightZeile hl={s.highlights.filter(h => h.spiel == null)} />
            </div>
          )}
          {!!s.laufend?.length && (
            <>
              <div style={{ ...klein, color: LIVE_ROT }}>{s.laufend.every(g => g.pause) ? '● Pause' : '● Jetzt dran'}</div>
              {s.laufend.map(g => g.pause ? (
                <div key={g.nr} style={{ padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--th-line-4, var(--th-line-6))', display: 'grid', gridTemplateColumns: '24px minmax(0,1fr)', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: 'var(--th-text-faint)', fontSize: 11 }}>{g.nr} D</span>
                  <span style={{ color: 'var(--th-text-muted)' }}>Pause – das Doppel ist noch nicht aufgestellt</span>
                </div>
              ) : (
                <div key={g.nr} style={{ padding: '6px 0', fontSize: 13, borderBottom: '1px solid var(--th-line-4, var(--th-line-6))' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '24px minmax(0,1fr) auto minmax(0,1fr)', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--th-text-faint)', fontSize: 11 }}>{g.nr}{g.doppel ? ' D' : ''}</span>
                    <span style={{ color: 'var(--th-text-body)', overflowWrap: 'anywhere', minWidth: 0 }}>{g.heim.join(' / ') || (g.doppel ? 'Doppel' : '–')}</span>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: LIVE_ROT, fontSize: 12 }}>läuft</span>
                    <span style={{ color: 'var(--th-text-body)', textAlign: 'right', overflowWrap: 'anywhere', minWidth: 0 }}>{g.gast.join(' / ') || (g.doppel ? 'Doppel' : '–')}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Highlights eines Spiels: „🎯 180 · Moritz Becker“, Heim links, Gast rechts. */
function HighlightZeile({ hl }: { hl: TickerHighlight[] }) {
  const teil = (h: TickerHighlight) => <span key={h.id} style={{ overflowWrap: 'anywhere' }}>{highlightKurz(h)} · {h.name || '?'}</span>;
  const heim = hl.filter(h => h.seite === 'heim'), gast = hl.filter(h => h.seite === 'gast');
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '24px minmax(0,1fr) minmax(0,1fr)', gap: 8, marginTop: 3, fontSize: 11.5, color: 'var(--th-text-muted)' }}>
      <span />
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>{heim.map(teil)}</span>
      <span style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 10px', justifyContent: 'flex-end', textAlign: 'right' }}>{gast.map(teil)}</span>
    </div>
  );
}

const klein: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-faint)', margin: '8px 0 4px' };

/** Aufstellung H1–H8 / G1–G8 und die Wechsel des Abends (nur, was eingetragen ist). */
function AufstellungBlock({ s }: { s: TickerAnzeige }) {
  const a = s.aufstellung;
  if (!a || (!a.heim.length && !a.gast.length)) return null;
  const spalte = (liste: { slot: number; name: string }[], kz: 'H' | 'G', rechts: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: rechts ? 'right' : 'left' }}>
      {liste.map(p => (
        <span key={p.slot} style={{ fontSize: 13, color: p.slot > 4 ? 'var(--th-text-muted)' : 'var(--th-text-body)' }}>
          {!rechts && <span style={{ color: 'var(--th-text-faint)', fontSize: 11, marginRight: 6 }}>{kz}{p.slot}</span>}
          {p.name}
          {rechts && <span style={{ color: 'var(--th-text-faint)', fontSize: 11, marginLeft: 6 }}>{kz}{p.slot}</span>}
        </span>
      ))}
    </div>
  );
  const w = s.wechsel ?? [];
  return (
    <div style={{ paddingBottom: 8, borderBottom: '1px solid var(--th-line-6)', marginBottom: 4 }}>
      <div style={klein}>Aufstellung <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}>(1–4 Stamm · 5–8 Ersatz)</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {spalte(a.heim, 'H', false)}
        {spalte(a.gast, 'G', true)}
      </div>
      {w.length > 0 && (
        <>
          <div style={klein}>Wechsel</div>
          {w.map((x, i) => (
            <div key={i} style={{ fontSize: 13, color: 'var(--th-text-body)', padding: '2px 0' }}>
              <span style={{ color: 'var(--th-text-faint)', fontSize: 11, marginRight: 6 }}>ab Spiel {x.nr}</span>
              {x.seite === 'heim' ? s.homeName : s.awayName}: <strong>{x.rein}</strong> {x.rueck ? 'wieder' : 'kommt'} für {x.raus}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
