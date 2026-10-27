'use client';

// ============================================================
// TC → Team per Glocke + Push (Betreiber, 27.10.2026)
// ============================================================
// „Offene erinnern“ (Spiel- und Terminseite): nur an die, die noch nicht zu-
// oder abgesagt haben. „Nachricht ans Team“ (Team-Manager-Dashboard):
// Freitext an alle. Beides über /api/team/nachricht; die Rückmeldung steht
// direkt am Knopf. Wer kein Konto hat, bekommt nichts — das steht ehrlich da.
// ============================================================

import { useState } from 'react';
import { Icon } from './icon';
import { karte, h2 } from './zusagen-ui';
import { sendeTeamNachricht, empfaengerText, TEAM_NACHRICHT_MAX } from '@/lib/supabase/team-nachricht';

type Meldung = { ok: boolean; text: string } | null;

const hinweis = (m: NonNullable<Meldung>): React.CSSProperties => ({
  fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, marginTop: 6,
  color: m.ok ? 'var(--th-win)' : 'var(--th-loss, #d64545)',
});

/** Knopf „Offene erinnern (n)“ — `offen` = noch offene im Kader (inkl. Spieler ohne Konto). */
export function OffeneErinnern({ teamId, matchKey, text, pfad, offen }: { teamId: string; matchKey: string; text: string; pfad: string; offen: number }) {
  const [laeuft, setLaeuft] = useState(false);
  const [m, setM] = useState<Meldung>(null);
  if (offen <= 0 && !m) return null;
  async function los() {
    setLaeuft(true); setM(null);
    const r = await sendeTeamNachricht(teamId, { art: 'erinnern', matchKey, text, pfad });
    setLaeuft(false);
    setM(r.error ? { ok: false, text: r.error } : { ok: r.empfaenger > 0, text: r.empfaenger
      ? `Erinnerung an ${r.empfaenger} Spieler geschickt.${r.empfaenger < offen ? ' Wer kein Konto hat, bekommt keine Nachricht.' : ''}`
      : 'Niemand zu erinnern – die Offenen haben kein Konto auf der Seite.' });
  }
  return (
    <div>
      <button type="button" disabled={laeuft} onClick={() => void los()} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 14px', borderRadius: 12, cursor: laeuft ? 'default' : 'pointer',
        background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13.5, opacity: laeuft ? 0.6 : 1,
      }}>
        <Icon name="bell" size={16} stroke={2.2} /> {laeuft ? 'Sende …' : `Offene erinnern (${offen})`}
      </button>
      {m && <div role={m.ok ? 'status' : 'alert'} style={hinweis(m)}>{m.text}</div>}
    </div>
  );
}

/** Karte „Nachricht ans Team“ (nur TC) — Freitext bis TEAM_NACHRICHT_MAX Zeichen an alle im Team. */
export function NachrichtAnsTeam({ teamId }: { teamId: string }) {
  const [text, setText] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [m, setM] = useState<Meldung>(null);
  async function los() {
    const t = text.trim();
    if (t.length < 3) { setM({ ok: false, text: 'Bitte eine Nachricht eingeben.' }); return; }
    setLaeuft(true); setM(null);
    const r = await sendeTeamNachricht(teamId, { art: 'nachricht', text: t });
    setLaeuft(false);
    if (r.error) { setM({ ok: false, text: r.error }); return; }
    setM({ ok: r.empfaenger > 0, text: empfaengerText(r.empfaenger) });
    if (r.empfaenger > 0) setText('');
  }
  return (
    <section style={karte}>
      <h2 style={h2}>Nachricht ans Team</h2>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.5 }}>
        Landet bei allen im Team in der Glocke und – wer Benachrichtigungen eingeschaltet hat – als Push aufs Handy.
      </div>
      <textarea value={text} onChange={e => { setText(e.target.value.slice(0, TEAM_NACHRICHT_MAX)); setM(null); }} rows={3} placeholder="z. B. Heute Treffen schon um 19 Uhr – bitte pünktlich!"
        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 10, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-8)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, lineHeight: 1.45, resize: 'vertical' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" disabled={laeuft} onClick={() => void los()} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: laeuft ? 'default' : 'pointer',
          background: 'var(--th-accent)', color: '#fff', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13.5, opacity: laeuft ? 0.6 : 1,
        }}>
          <Icon name="bell" size={16} stroke={2.2} /> {laeuft ? 'Sende …' : 'An alle schicken'}
        </button>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)' }}>{text.length}/{TEAM_NACHRICHT_MAX}</span>
      </div>
      {m && <div role={m.ok ? 'status' : 'alert'} style={hinweis(m)}>{m.text}</div>}
    </section>
  );
}
