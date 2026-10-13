'use client';

// ============================================================
// Spielbericht — Live-Ansicht für den Monitor im Lokal
// ============================================================
// Wird aus dem Formular (Mein Bereich → Spielbericht erfassen) als zweites
// Fenster geöffnet und zeigt jede Eingabe sofort (lib/spielbericht-live.ts,
// nur im Browser, kein Server). Aufbau für große Bildschirme: oben der
// Spielstand, links alle 18 Spiele, rechts Aufstellung mit Punkten und
// Highlights. Schriftgrößen wachsen mit dem Fenster (vw/vh).
// ============================================================

import { useEffect, useState } from 'react';
import { abonniereLive, letzterLiveStand, type LiveStand } from '@/lib/spielbericht-live';
import { computeTotals, GAME_SCHEDULE, HIGHLIGHT_TYPE_LABELS, type ReportGame, type ReportPlayer } from '@/lib/supabase/match-reports';
import { team27 } from '@/lib/data/saison-2027';
import { TeamBadge } from '@/components/mdu/team-badge';

const GRUEN = '#3E9C33', BLAU = '#4E7DBD', GOLD = '#E8B84A';
const fz = (min: number, vw: number, max: number) => `clamp(${min}px, ${vw}vw, ${max}px)`;

export default function LivePage() {
  const [stand, setStand] = useState<LiveStand | null>(null);
  const [voll, setVoll] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setStand(letzterLiveStand()));
    const ab = abonniereLive(setStand);
    const onFs = () => setVoll(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => { ab(); document.removeEventListener('fullscreenchange', onFs); };
  }, []);

  const vollbild = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2147483000, overflow: 'auto', color: '#fff', fontFamily: 'var(--font-manrope)',
      background: 'radial-gradient(80% 60% at 0% 0%, rgba(62,156,51,0.28), transparent 60%), radial-gradient(80% 60% at 100% 0%, rgba(78,125,189,0.28), transparent 60%), linear-gradient(160deg, #161B26 0%, #0B0E14 100%)' }}>
      {!voll && (
        <button type="button" onClick={vollbild} style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 2, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          ⛶ Vollbild
        </button>
      )}
      {!stand ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center', padding: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: fz(28, 3, 56), letterSpacing: '0.04em', textTransform: 'uppercase' }}>Live-Ansicht</div>
            <div style={{ marginTop: 10, fontSize: fz(14, 1.2, 20), opacity: 0.75 }}>Wartet auf den Spielbericht … Öffne im anderen Fenster „Spielbericht erfassen“ und wähle die Begegnung.</div>
          </div>
        </div>
      ) : <Anzeige s={stand} />}
    </div>
  );
}

function Anzeige({ s }: { s: LiveStand }) {
  const t = computeTotals(s.games);
  const H = s.homeTeamId ? team27(s.homeTeamId) : undefined;
  const G = s.guestTeamId ? team27(s.guestTeamId) : undefined;
  const aktuell = s.games.find(g => g.legs_home == null || g.legs_guest == null)?.game_no ?? null;
  const gespielt = s.games.filter(g => g.legs_home != null && g.legs_guest != null).length;
  const sorted = [...s.games].sort((a, b) => a.game_no - b.game_no);
  const halb = Math.ceil(sorted.length / 2);

  return (
    <div style={{ minHeight: '100%', display: 'grid', gridTemplateRows: 'auto 1fr', gap: '1.6vh', padding: '2vh 2vw' }}>
      {/* ── Spielstand ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '2vw', padding: '1.6vh 2vw', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Team name={s.homeName} id={s.homeTeamId} logo={H?.logoUrl} short={H?.short} farbe={GRUEN} label="Heim" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: fz(11, 0.9, 16), fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.7 }}>
            {[s.liga, s.datum ? new Date(s.datum + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null, s.ort].filter(Boolean).join(' · ')}
          </div>
          <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: fz(56, 8, 170), lineHeight: 1, letterSpacing: '0.02em', margin: '0.6vh 0' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)', gap: '1.6vw', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1vw', alignContent: 'start' }}>
          {[sorted.slice(0, halb), sorted.slice(halb)].map((spalte, k) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '0.7vh' }}>
              {spalte.map(g => <SpielZeile key={g.game_no} g={g} s={s} aktuell={g.game_no === aktuell} />)}
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
          <Kasten titel="Highlights">
            <Highlights s={s} />
          </Kasten>
        </div>
      </div>
    </div>
  );
}

function Team({ name, id, logo, short, farbe, label, rechts }: { name: string; id: string | null; logo?: string | null; short?: string; farbe: string; label: string; rechts?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: rechts ? 'row-reverse' : 'row', alignItems: 'center', gap: '1.4vw', minWidth: 0, textAlign: rechts ? 'right' : 'left' }}>
      <div style={{ flexShrink: 0, borderRadius: 999, boxShadow: `0 0 0 4px ${farbe}` }}>
        <TeamBadge initials={(short ?? id ?? '?').slice(0, 3)} logoUrl={logo ?? undefined} size={88} ring="#fff" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: fz(11, 0.9, 15), fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: farbe === GRUEN ? '#8BD67F' : '#9DBEEB' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: fz(24, 2.8, 60), lineHeight: 1.05, textTransform: 'uppercase', overflowWrap: 'anywhere' }}>{name || '–'}</div>
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

function SpielZeile({ g, s, aktuell }: { g: ReportGame; s: LiveStand; aktuell: boolean }) {
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
      padding: '0.75vh 0.8vw', borderRadius: 10, fontSize: fz(11, 0.95, 20),
      background: aktuell ? 'rgba(232,184,74,0.18)' : doppel ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${aktuell ? GOLD : 'rgba(255,255,255,0.08)'}`,
    }}>
      <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, opacity: 0.7, textAlign: 'center' }}>{g.game_no}{doppel && <span style={{ display: 'block', fontSize: '0.6em', letterSpacing: '0.1em', color: GOLD }}>DOPPEL</span>}</span>
      <span style={{ fontWeight: heimSieg ? 800 : 600, opacity: gastSieg ? 0.55 : 1, overflow: 'hidden', textOverflow: 'ellipsis', ...zeile }}>{seite(s.homePlayers, g.home_slot, g.home_slot2, 'H')}</span>
      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 800, padding: '0.2vh 0.6vw', borderRadius: 6, minWidth: '3.2em', textAlign: 'center',
        background: fertig ? (heimSieg ? 'rgba(62,156,51,0.45)' : gastSieg ? 'rgba(78,125,189,0.5)' : 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.08)' }}>
        {fertig ? `${g.legs_home}:${g.legs_guest}` : aktuell ? '●' : '–'}
      </span>
      <span style={{ fontWeight: gastSieg ? 800 : 600, opacity: heimSieg ? 0.55 : 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', ...zeile }}>{seite(s.guestPlayers, g.guest_slot, g.guest_slot2, 'G')}</span>
    </div>
  );
}

/** Zeile unter den Doppeln: wer raus (↓), wer rein (↑), ab welchem Spiel. */
function Auswechslungen({ s }: { s: LiveStand }) {
  const liste = (['home', 'guest'] as const).flatMap(seite => {
    const spieler = seite === 'home' ? s.homePlayers : s.guestPlayers;
    const pre = seite === 'home' ? 'H' : 'G';
    return [...wechselVon(s.games, seite)].map(([rein, w]) => ({ key: `${pre}${rein}`, pre, raus: w.fuer, rein, ab: w.abSpiel, spieler }));
  }).sort((a, b) => a.ab - b.ab);
  if (!liste.length) return null;
  const name = (sp: ReportPlayer[], slot: number) => (sp.find(p => p.slot === slot)?.name.trim() || '').split(/\s+/)[0] || `#${slot}`;
  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6vh 1.6vw', padding: '0.9vh 1vw', borderRadius: 10, background: 'rgba(232,184,74,0.10)', border: '1px solid rgba(232,184,74,0.35)', fontSize: fz(11, 0.95, 20) }}>
      <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD }}>Auswechslungen:</span>
      {liste.map(w => (
        <span key={w.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5vw', fontWeight: 700, whiteSpace: 'nowrap' }}>
          <span>{w.pre}{w.raus} {name(w.spieler, w.raus)}</span>
          <span aria-label="raus" style={{ color: '#FF6B6B', fontWeight: 900 }}>↓</span>
          <span aria-label="rein" style={{ color: '#7BE07B', fontWeight: 900 }}>↑</span>
          <span>{w.pre}{w.rein} {name(w.spieler, w.rein)}</span>
          <span style={{ opacity: 0.6, fontWeight: 600 }}>(ab Spiel {w.ab})</span>
        </span>
      ))}
    </div>
  );
}

function Kasten({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '1.2vh 1vw', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: fz(14, 1.3, 26), letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.8vh', opacity: 0.9 }}>{titel}</div>
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

function Highlights({ s }: { s: LiveStand }) {
  const liste = s.highlights.filter(h => h.value != null);
  if (!liste.length) return <div style={{ fontSize: fz(10, 0.85, 16), opacity: 0.55 }}>Noch keine — 180er, 171er, High Finishes und Short Legs erscheinen hier.</div>;
  const name = (h: (typeof liste)[number]) => nameVon(h.side === 'home' ? s.homePlayers : s.guestPlayers, h.slot);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5vw' }}>
      {liste.map((h, i) => (
        <span key={i} style={{ padding: '0.4vh 0.7vw', borderRadius: 999, fontSize: fz(10, 0.85, 16), fontWeight: 700, background: h.side === 'home' ? 'rgba(62,156,51,0.3)' : 'rgba(78,125,189,0.35)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <b style={{ color: GOLD }}>{h.type === '180' || h.type === '171' ? `${h.value}× ${HIGHLIGHT_TYPE_LABELS[h.type]}` : `${HIGHLIGHT_TYPE_LABELS[h.type]} ${h.value}${h.type === 'short_leg' ? ' Darts' : ''}`}</b> · {name(h)}
        </span>
      ))}
    </div>
  );
}
