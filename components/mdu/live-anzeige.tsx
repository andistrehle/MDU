'use client';

// ============================================================
// Spielbericht — Live-Anzeige (Monitor, Tablet, Handy)
// ============================================================
// Gemeinsame Anzeige für
//   • das zweite Fenster /mein-bereich/spielberichte/live (nur zuschauen) und
//   • den Live-Modus im Formular (Tablet): dort mit `bearbeiten` — Ergebnis,
//     Spieler und Highlights werden direkt auf der Anzeige angetippt.
// Große Bildschirme: oben Spielstand, links 18 Spiele in zwei Spalten, rechts
// Aufstellung + Highlights. Schmal (< 1000 px): alles untereinander, eine
// Spielspalte; sehr schmal (< 700 px): Teams mit Logo über dem Namen.
// ============================================================

import { useState } from 'react';
import {
  computeTotals, GAME_SCHEDULE, HIGHLIGHT_TYPE_LABELS, HIGHLIGHT_TYPES, HIGHLIGHT_VALUE_CONFIG,
  type HighlightEntry, type HighlightType, type ReportGame, type ReportPlayer,
} from '@/lib/supabase/match-reports';
import type { LiveStand } from '@/lib/spielbericht-live';
import { team27 } from '@/lib/data/saison-2027';
import { TeamBadge } from './team-badge';

export const GRUEN = '#3E9C33', BLAU = '#4E7DBD', GOLD = '#E8B84A';
export const fz = (min: number, vw: number, max: number) => `clamp(${min}px, ${vw}vw, ${max}px)`;
export const LIVE_HINTERGRUND = 'radial-gradient(80% 60% at 0% 0%, rgba(62,156,51,0.28), transparent 60%), radial-gradient(80% 60% at 100% 0%, rgba(78,125,189,0.28), transparent 60%), linear-gradient(160deg, #161B26 0%, #0B0E14 100%)';

type Feld = 'home_slot' | 'guest_slot' | 'home_slot2' | 'guest_slot2';
export interface LiveBearbeiten {
  legOptionen: readonly string[];
  /** erlaubte Spieler-Slots für ein Feld eines Spiels (wie im Formular) */
  slotOptionen: (gameNo: number, feld: Feld) => number[];
  onLegs: (gameNo: number, res: string) => void;
  onSlot: (gameNo: number, feld: Feld, slot: number | null) => void;
  onHighlight: (h: HighlightEntry) => void;
  onHighlightWeg: (index: number) => void;
}

type Blatt =
  | { art: 'legs'; g: ReportGame }
  | { art: 'spieler'; g: ReportGame; seite: 'home' | 'guest' }
  | { art: 'highlight' }
  | null;

export function LiveAnzeige({ s, bearbeiten }: { s: LiveStand; bearbeiten?: LiveBearbeiten }) {
  const [blatt, setBlatt] = useState<Blatt>(null);
  const t = computeTotals(s.games);
  const H = s.homeTeamId ? team27(s.homeTeamId) : undefined;
  const G = s.guestTeamId ? team27(s.guestTeamId) : undefined;
  const aktuell = s.games.find(g => g.legs_home == null || g.legs_guest == null)?.game_no ?? null;
  const gespielt = s.games.filter(g => g.legs_home != null && g.legs_guest != null).length;
  const sorted = [...s.games].sort((a, b) => a.game_no - b.game_no);
  const halb = Math.ceil(sorted.length / 2);

  return (
    <div className="mdu-live" style={{ minHeight: '100%', display: 'grid', gridTemplateRows: 'auto 1fr', gap: '1.6vh', padding: '2vh 2vw' }}>
      <style>{`
        @media (max-width: 1000px) {
          .mdu-live .ml-main, .mdu-live .ml-spiele { grid-template-columns: minmax(0,1fr) !important; }
          .mdu-live .ml-spalte { display: contents !important; }
          .mdu-live .ml-spiele { gap: 6px !important; }
          .mdu-live { padding: 12px !important; gap: 12px !important; }
        }
        @media (max-width: 700px) {
          .mdu-live .ml-kopf { grid-template-columns: 1fr auto 1fr !important; gap: 8px !important; padding: 12px !important; }
          .mdu-live .ml-team { flex-direction: column !important; text-align: center !important; gap: 6px !important; }
          .mdu-live .ml-logo > div { width: 52px !important; height: 52px !important; }
          .mdu-live .ml-teamname { font-size: 15px !important; }
          .mdu-live .ml-stand { font-size: 52px !important; }
          .mdu-live .ml-info { font-size: 10px !important; letter-spacing: 0.08em !important; }
          .mdu-live .ml-wechsel { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* ── Spielstand ── */}
      <div className="ml-kopf" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '2vw', padding: '1.6vh 2vw', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Team name={s.homeName} id={s.homeTeamId} logo={H?.logoUrl} short={H?.short} farbe={GRUEN} label="Heim" />
        <div style={{ textAlign: 'center' }}>
          <div className="ml-info" style={{ fontSize: fz(11, 0.9, 16), fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.7 }}>
            {[s.liga, s.datum ? new Date(s.datum + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null, s.ort].filter(Boolean).join(' · ')}
          </div>
          <div className="ml-stand" style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: fz(56, 8, 170), lineHeight: 1, letterSpacing: '0.02em', margin: '0.6vh 0' }}>
            <span style={{ color: t.spieleHome > t.spieleGuest ? '#7BE07B' : '#fff' }}>{t.spieleHome}</span>
            <span style={{ opacity: 0.4, margin: '0 1.2vw' }}>:</span>
            <span style={{ color: t.spieleGuest > t.spieleHome ? '#8DB6F0' : '#fff' }}>{t.spieleGuest}</span>
          </div>
          <div style={{ fontSize: fz(12, 1.1, 20), fontWeight: 700, opacity: 0.8 }}>
            Legs {t.legsHome}:{t.legsGuest} · {gespielt}/{s.games.length} Spiele
            {aktuell != null && <span style={{ color: GOLD }}> · läuft: Spiel {aktuell}</span>}
          </div>
        </div>
        <Team name={s.guestName} id={s.guestTeamId} logo={G?.logoUrl} short={G?.short} farbe={BLAU} label="Gast" rechts />
      </div>

      {/* ── Spiele + Seitenleiste ── */}
      <div className="ml-main" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)', gap: '1.6vw', minHeight: 0 }}>
        <div className="ml-spiele" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1vw', alignContent: 'start' }}>
          {[sorted.slice(0, halb), sorted.slice(halb)].map((spalte, k) => (
            <div key={k} className="ml-spalte" style={{ display: 'flex', flexDirection: 'column', gap: '0.7vh' }}>
              {spalte.map(g => <SpielZeile key={g.game_no} g={g} s={s} aktuell={g.game_no === aktuell}
                onLegs={bearbeiten ? () => setBlatt({ art: 'legs', g }) : undefined}
                onSpieler={bearbeiten ? seite => setBlatt({ art: 'spieler', g, seite }) : undefined} />)}
            </div>
          ))}
          <Auswechslungen s={s} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4vh', minWidth: 0 }}>
          <Kasten titel="Aufstellung">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1vw' }}>
              <Aufstellung spieler={s.homePlayers} punkte={t.homePlayerPoints} prefix="H" farbe={GRUEN} wechsel={wechselVon(s.games, 'home')} />
              <Aufstellung spieler={s.guestPlayers} punkte={t.guestPlayerPoints} prefix="G" farbe={BLAU} wechsel={wechselVon(s.games, 'guest')} />
            </div>
          </Kasten>
          <Kasten titel="Highlights" rechts={bearbeiten && (
            <button type="button" onClick={() => setBlatt({ art: 'highlight' })} style={tippKnopf}>+ Highlight</button>
          )}>
            <Highlights s={s} onWeg={bearbeiten?.onHighlightWeg} />
          </Kasten>
        </div>
      </div>
      {bearbeiten && blatt && <EingabeBlatt blatt={blatt} s={s} b={bearbeiten} onClose={() => setBlatt(null)} />}
    </div>
  );
}

function Team({ name, id, logo, short, farbe, label, rechts }: { name: string; id: string | null; logo?: string | null; short?: string; farbe: string; label: string; rechts?: boolean }) {
  return (
    <div className="ml-team" style={{ display: 'flex', flexDirection: rechts ? 'row-reverse' : 'row', alignItems: 'center', gap: '1.4vw', minWidth: 0, textAlign: rechts ? 'right' : 'left' }}>
      <div className="ml-logo" style={{ flexShrink: 0, borderRadius: 999, boxShadow: `0 0 0 4px ${farbe}` }}>
        <TeamBadge initials={(short ?? id ?? '?').slice(0, 3)} logoUrl={logo ?? undefined} size={88} ring="#fff" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: fz(11, 0.9, 15), fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: farbe === GRUEN ? '#8BD67F' : '#9DBEEB' }}>{label}</div>
        <div className="ml-teamname" style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: fz(24, 2.8, 60), lineHeight: 1.05, textTransform: 'uppercase', overflowWrap: 'break-word', hyphens: 'auto' }}>{name || '–'}</div>
      </div>
    </div>
  );
}

// Auswechslung: Im Einzel steht laut Spielplan (GAME_SCHEDULE) eine feste
// Position 1–4; spielt dort jemand anderes (Wechselspieler 5–8, der sich fest
// an diese Position bindet), ist das ein Wechsel. Je Wechselspieler: für wen
// und ab welchem Spiel.
type Wechsel = Map<number, { fuer: number; abSpiel: number }>;
function wechselVon(games: ReportGame[], seite: 'home' | 'guest'): Wechsel {
  const m: Wechsel = new Map();
  for (const g of [...games].sort((a, b) => a.game_no - b.game_no)) {
    if (g.game_type !== 'single') continue;
    const plan = GAME_SCHEDULE.find(x => x.no === g.game_no);
    const soll = seite === 'home' ? plan?.homeSlot : plan?.guestSlot;
    const ist = seite === 'home' ? g.home_slot : g.guest_slot;
    if (soll == null || ist == null || ist === soll || m.has(ist)) continue;
    m.set(ist, { fuer: soll, abSpiel: g.game_no });
  }
  return m;
}

const nameVon = (spieler: ReportPlayer[], slot: number | null) => (slot == null ? '' : spieler.find(p => p.slot === slot)?.name.trim() || `#${slot}`);

function SpielZeile({ g, s, aktuell, onLegs, onSpieler }: { g: ReportGame; s: LiveStand; aktuell: boolean; onLegs?: () => void; onSpieler?: (seite: 'home' | 'guest') => void }) {
  const fertig = g.legs_home != null && g.legs_guest != null;
  const heimSieg = fertig && g.legs_home! > g.legs_guest!;
  const gastSieg = fertig && g.legs_guest! > g.legs_home!;
  const doppel = g.game_type === 'double';
  const seite = (spieler: ReportPlayer[], a: number | null, b: number | null, pre: string) =>
    (doppel ? [a, b] : [a]).filter(x => x != null).map(x => `${pre}${x} ${nameVon(spieler, x)}`).join('\n') || '—';
  // Doppel: beide Namen untereinander statt abgeschnitten nebeneinander.
  const zeile: React.CSSProperties = doppel ? { whiteSpace: 'pre-line', lineHeight: 1.25 } : { whiteSpace: 'nowrap' };
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '2.4em minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center', gap: '0.6vw',
      padding: '0.75vh 0.8vw', borderRadius: 10, fontSize: fz(13, 0.95, 20), minHeight: onLegs ? 44 : undefined,
      background: aktuell ? 'rgba(232,184,74,0.18)' : doppel ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${aktuell ? GOLD : 'rgba(255,255,255,0.08)'}`,
    }}>
      <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, opacity: 0.7, textAlign: 'center' }}>{g.game_no}{doppel && <span style={{ display: 'block', fontSize: '0.6em', letterSpacing: '0.1em', color: GOLD }}>DOPPEL</span>}</span>
      <Tipp onClick={onSpieler && (() => onSpieler('home'))} style={{ fontWeight: heimSieg ? 800 : 600, opacity: gastSieg ? 0.55 : 1, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left', ...zeile }}>{seite(s.homePlayers, g.home_slot, g.home_slot2, 'H')}</Tipp>
      <Tipp onClick={onLegs} style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 800, padding: onLegs ? '6px 10px' : '0.2vh 0.6vw', borderRadius: 6, minWidth: '3.2em', textAlign: 'center',
        background: fertig ? (heimSieg ? 'rgba(62,156,51,0.45)' : gastSieg ? 'rgba(78,125,189,0.5)' : 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.08)',
        outline: onLegs && !fertig ? '1.5px dashed rgba(255,255,255,0.35)' : 'none' }}>
        {fertig ? `${g.legs_home}:${g.legs_guest}` : aktuell ? '●' : '–'}
      </Tipp>
      <Tipp onClick={onSpieler && (() => onSpieler('guest'))} style={{ fontWeight: gastSieg ? 800 : 600, opacity: heimSieg ? 0.55 : 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', ...zeile }}>{seite(s.guestPlayers, g.guest_slot, g.guest_slot2, 'G')}</Tipp>
    </div>
  );
}

/** Zeile unter den Doppeln: wer raus (↓), wer rein (↑), ab welchem Spiel. */
function Auswechslungen({ s }: { s: LiveStand }) {
  const seiten = (['home', 'guest'] as const).map(seite => {
    const spieler = seite === 'home' ? s.homePlayers : s.guestPlayers;
    const pre = seite === 'home' ? 'H' : 'G';
    const liste = [...wechselVon(s.games, seite)].map(([rein, w]) => ({ key: `${pre}${rein}`, raus: w.fuer, rein, ab: w.abSpiel })).sort((a, b) => a.ab - b.ab);
    return { seite, spieler, pre, liste, titel: seite === 'home' ? s.homeName : s.guestName, farbe: seite === 'home' ? '#8BD67F' : '#9DBEEB' };
  });
  if (!seiten.some(x => x.liste.length)) return null;
  const name = (sp: ReportPlayer[], slot: number) => (sp.find(p => p.slot === slot)?.name.trim() || '').split(/\s+/)[0] || `#${slot}`;
  return (
    <div style={{ gridColumn: '1 / -1', padding: '0.9vh 1vw', borderRadius: 10, background: 'rgba(232,184,74,0.10)', border: '1px solid rgba(232,184,74,0.35)', fontSize: fz(12, 0.95, 20) }}>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.5vh' }}>Auswechslungen</div>
      <div className="ml-wechsel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6vh 2vw' }}>
        {seiten.map(x => (
          <div key={x.seite} style={{ display: 'flex', flexDirection: 'column', gap: '0.4vh', minWidth: 0 }}>
            <span style={{ fontSize: '0.8em', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: x.farbe }}>{x.titel}</span>
            {x.liste.length === 0 ? <span style={{ opacity: 0.5 }}>keine</span> : x.liste.map(w => (
              <span key={w.key} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0 0.5vw', fontWeight: 700 }}>
                <span>{x.pre}{w.raus} {name(x.spieler, w.raus)}</span>
                <span aria-label="raus" style={{ color: '#FF6B6B', fontWeight: 900 }}>↓</span>
                <span aria-label="rein" style={{ color: '#7BE07B', fontWeight: 900 }}>↑</span>
                <span>{x.pre}{w.rein} {name(x.spieler, w.rein)}</span>
                <span style={{ opacity: 0.6, fontWeight: 600 }}>(ab Spiel {w.ab})</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Antippbares Feld (nur im Live-Modus des Formulars), sonst reiner Text. */
function Tipp({ onClick, style, children }: { onClick?: () => void; style: React.CSSProperties; children: React.ReactNode }) {
  if (!onClick) return <span style={style}>{children}</span>;
  return <button type="button" onClick={onClick} style={{ ...style, font: 'inherit', fontWeight: style.fontWeight, fontFamily: style.fontFamily ?? 'inherit', color: 'inherit', border: 'none', background: style.background ?? 'transparent', cursor: 'pointer', minHeight: 36, minWidth: 0 }}>{children}</button>;
}

const tippKnopf: React.CSSProperties = { padding: '6px 12px', borderRadius: 8, border: `1px solid ${GOLD}`, background: 'rgba(232,184,74,0.15)', color: GOLD, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-manrope)' };

function Kasten({ titel, rechts, children }: { titel: string; rechts?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ padding: '1.2vh 1vw', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: fz(14, 1.3, 26), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.8vh' }}><span style={{ opacity: 0.9 }}>{titel}</span>{rechts}</div>
      {children}
    </div>
  );
}

function Aufstellung({ spieler, punkte, prefix, farbe, wechsel }: { spieler: ReportPlayer[]; punkte: Record<number, number>; prefix: string; farbe: string; wechsel: Wechsel }) {
  const belegt = [...spieler].sort((a, b) => a.slot - b.slot);
  // Wer wurde ausgewechselt? Position → Wechselspieler
  const raus = new Map([...wechsel].map(([sub, w]) => [w.fuer, { sub, ab: w.abSpiel }]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4vh', minWidth: 0 }}>
      {belegt.map(p => (
        <div key={p.slot} style={{ display: 'flex', alignItems: 'center', gap: '0.5vw', fontSize: fz(10, 0.85, 17), opacity: p.name.trim() ? 1 : 0.35, borderTop: p.slot === 5 ? '1px dashed rgba(255,255,255,0.2)' : 'none', paddingTop: p.slot === 5 ? '0.4vh' : 0 }}>
          <span style={{ flexShrink: 0, minWidth: '2.2em', textAlign: 'center', padding: '0.1vh 0.3vw', borderRadius: 5, fontWeight: 800, background: p.slot <= 4 ? farbe : 'rgba(255,255,255,0.12)' }}>{prefix}{p.slot}</span>
          <span style={{ flex: 1, minWidth: 0, fontWeight: 700 }}>
            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name.trim() || 'frei'}</span>
            {wechsel.has(p.slot) && <span style={{ display: 'block', fontSize: '0.8em', color: '#7BE07B' }}>↑ für {prefix}{wechsel.get(p.slot)!.fuer} ab Spiel {wechsel.get(p.slot)!.abSpiel}</span>}
            {raus.has(p.slot) && <span style={{ display: 'block', fontSize: '0.8em', color: '#FF8A8A' }}>↓ raus ab Spiel {raus.get(p.slot)!.ab} ({prefix}{raus.get(p.slot)!.sub})</span>}
          </span>
          {punkte[p.slot] != null && <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 800, color: GOLD }}>{punkte[p.slot]}</span>}
        </div>
      ))}
    </div>
  );
}

function Highlights({ s, onWeg }: { s: LiveStand; onWeg?: (i: number) => void }) {
  const liste = s.highlights.map((h, i) => ({ ...h, i })).filter(h => h.value != null);
  if (!liste.length) return <div style={{ fontSize: fz(10, 0.85, 16), opacity: 0.55 }}>Noch keine — 180er, 171er, High Finishes und Short Legs erscheinen hier.</div>;
  const name = (h: (typeof liste)[number]) => nameVon(h.side === 'home' ? s.homePlayers : s.guestPlayers, h.slot);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5vw' }}>
      {liste.map((h, i) => (
        <span key={i} onClick={onWeg && (() => { if (confirm('Dieses Highlight entfernen?')) onWeg(h.i); })} style={{ cursor: onWeg ? 'pointer' : undefined, padding: '0.4vh 0.7vw', borderRadius: 999, fontSize: fz(10, 0.85, 16), fontWeight: 700, background: h.side === 'home' ? 'rgba(62,156,51,0.3)' : 'rgba(78,125,189,0.35)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <b style={{ color: GOLD }}>{h.type === '180' || h.type === '171' ? `${h.value}× ${HIGHLIGHT_TYPE_LABELS[h.type]}` : `${HIGHLIGHT_TYPE_LABELS[h.type]} ${h.value}${h.type === 'short_leg' ? ' Darts' : ''}`}</b> · {name(h)}{onWeg && <span style={{ marginLeft: 6, opacity: 0.6 }}>✕</span>}
        </span>
      ))}
    </div>
  );
}

// ── Eingabe im Live-Modus (Tablet) ─────────────────────────────
function EingabeBlatt({ blatt, s, b, onClose }: { blatt: NonNullable<Blatt>; s: LiveStand; b: LiveBearbeiten; onClose: () => void }) {
  const [hlSeite, setHlSeite] = useState<'home' | 'guest'>('home');
  const [hlSlot, setHlSlot] = useState<number | null>(null);
  const [hlTyp, setHlTyp] = useState<HighlightType>('180');
  const [hlWert, setHlWert] = useState('1');
  const spielerVon = (seite: 'home' | 'guest') => (seite === 'home' ? s.homePlayers : s.guestPlayers).filter(p => p.name.trim());
  const knopf = (aktiv = false): React.CSSProperties => ({ padding: '12px 14px', minHeight: 48, borderRadius: 10, border: `1.5px solid ${aktiv ? GOLD : 'rgba(255,255,255,0.2)'}`, background: aktiv ? 'rgba(232,184,74,0.22)' : 'rgba(255,255,255,0.06)', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'var(--font-manrope)' });

  let titel = '', inhalt: React.ReactNode = null;
  if (blatt.art === 'legs') {
    const g = s.games.find(x => x.game_no === blatt.g.game_no) ?? blatt.g;
    titel = `Spiel ${g.game_no} · Ergebnis (Heim:Gast)`;
    inhalt = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
        {b.legOptionen.map(r => (
          <button key={r} type="button" onClick={() => { b.onLegs(g.game_no, r); onClose(); }} style={{ ...knopf(`${g.legs_home}:${g.legs_guest}` === r), fontFamily: 'var(--font-jetbrains-mono)', fontSize: 22 }}>{r}</button>
        ))}
        <button type="button" onClick={() => { b.onLegs(g.game_no, ''); onClose(); }} style={{ ...knopf(), gridColumn: '1 / -1', fontSize: 14, opacity: 0.8 }}>Ergebnis löschen</button>
      </div>
    );
  } else if (blatt.art === 'spieler') {
    const g = s.games.find(x => x.game_no === blatt.g.game_no) ?? blatt.g;
    const pre = blatt.seite === 'home' ? 'H' : 'G';
    const felder: Feld[] = g.game_type === 'double'
      ? (blatt.seite === 'home' ? ['home_slot', 'home_slot2'] : ['guest_slot', 'guest_slot2'])
      : [blatt.seite === 'home' ? 'home_slot' : 'guest_slot'];
    const spieler = blatt.seite === 'home' ? s.homePlayers : s.guestPlayers;
    titel = `Spiel ${g.game_no} · ${blatt.seite === 'home' ? s.homeName : s.guestName}`;
    inhalt = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {felder.map((f, k) => (
          <div key={f}>
            {felder.length > 1 && <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', opacity: 0.7, marginBottom: 6 }}>{k === 0 ? '1. SPIELER' : '2. SPIELER'}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
              {b.slotOptionen(g.game_no, f).map(slot => (
                <button key={slot} type="button" onClick={() => { b.onSlot(g.game_no, f, slot); if (felder.length === 1) onClose(); }} style={{ ...knopf(g[f] === slot), textAlign: 'left' }}>
                  {pre}{slot} {nameVon(spieler, slot)}{slot > 4 && <span style={{ opacity: 0.6, fontSize: 12 }}> · Wechsel</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
        {felder.length > 1 && <button type="button" onClick={onClose} style={knopf(true)}>Fertig</button>}
      </div>
    );
  } else {
    const cfg = HIGHLIGHT_VALUE_CONFIG[hlTyp];
    const wert = Number(hlWert);
    const ok = hlSlot != null && wert >= cfg.min && wert <= cfg.max;
    titel = 'Highlight eintragen';
    inhalt = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(['home', 'guest'] as const).map(x => <button key={x} type="button" onClick={() => { setHlSeite(x); setHlSlot(null); }} style={knopf(hlSeite === x)}>{x === 'home' ? s.homeName : s.guestName}</button>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {spielerVon(hlSeite).map(p => <button key={p.slot} type="button" onClick={() => setHlSlot(p.slot)} style={{ ...knopf(hlSlot === p.slot), textAlign: 'left' }}>{hlSeite === 'home' ? 'H' : 'G'}{p.slot} {p.name.trim()}</button>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {HIGHLIGHT_TYPES.map(t => <button key={t} type="button" onClick={() => { setHlTyp(t); setHlWert(HIGHLIGHT_VALUE_CONFIG[t].isCount ? '1' : ''); }} style={knopf(hlTyp === t)}>{HIGHLIGHT_TYPE_LABELS[t]}</button>)}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
          {cfg.label}
          <input type="number" inputMode="numeric" min={cfg.min} max={cfg.max} value={hlWert} onChange={e => setHlWert(e.target.value)}
            style={{ width: 110, padding: '12px 12px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 20, fontWeight: 800 }} />
          <span style={{ opacity: 0.6, fontSize: 13 }}>{cfg.min}–{cfg.max}</span>
        </label>
        <button type="button" disabled={!ok} onClick={() => { b.onHighlight({ side: hlSeite, slot: hlSlot!, type: hlTyp, value: wert }); onClose(); }} style={{ ...knopf(true), opacity: ok ? 1 : 0.4 }}>Eintragen</button>
      </div>
    );
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 5, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(720px, 100%)', maxHeight: '85vh', overflow: 'auto', padding: '18px 18px 24px', borderRadius: '18px 18px 0 0', background: '#1B2230', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'var(--font-manrope)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{titel}</span>
          <button type="button" onClick={onClose} aria-label="Schließen" style={{ ...knopf(), minHeight: 40, padding: '6px 14px' }}>✕</button>
        </div>
        {inhalt}
      </div>
    </div>
  );
}
