'use client';

// ============================================================
// NachmeldenButton — „Spieler nachmelden" + Modal
// ============================================================
// Wird unter „Team bearbeiten" und „Kader" verwendet. Team ist vorbefüllt
// und nicht änderbar. Absenden → Prüfung durch Ligaleitung (Status pending).
// ============================================================

import { useEffect, useState } from 'react';
import { createNomination, LAST_LEAGUE_OPTIONS, type LastLeague } from '@/lib/supabase/nominations';

export function NachmeldenButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [lastLeague, setLastLeague] = useState<LastLeague>('none');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open]);

  function reset() { setFirstName(''); setLastName(''); setLastLeague('none'); setMsg(null); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await createNomination(teamId, teamName, firstName, lastName, lastLeague);
    setBusy(false);
    if (error) { setMsg({ kind: 'err', text: error }); return; }
    setMsg({ kind: 'ok', text: '✓ Nachmeldung erfolgreich an die Ligaleitung zur Prüfung gesendet. Du wirst über das Ergebnis benachrichtigt.' });
    setFirstName(''); setLastName(''); setLastLeague('none');
  }

  return (
    <>
      <button type="button" onClick={() => { reset(); setOpen(true); }} style={btn}>＋ Spieler nachmelden</button>

      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Spieler nachmelden"
            style={{ width: '100%', maxWidth: 440, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', borderRadius: 16, padding: '24px 26px', boxShadow: '0 30px 70px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <h2 style={{ flex: 1, fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, color: 'var(--th-text-strong)', margin: 0, textTransform: 'uppercase' }}>Spieler nachmelden</h2>
              <button onClick={() => setOpen(false)} aria-label="Schließen" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-text-faint)', fontSize: 22 }}>×</button>
            </div>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {msg && (
                <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`, color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{msg.text}</div>
              )}
              <Field label="Vorname *"><input value={firstName} onChange={e => setFirstName(e.target.value)} style={input} autoFocus /></Field>
              <Field label="Nachname *"><input value={lastName} onChange={e => setLastName(e.target.value)} style={input} /></Field>
              <Field label="Letzte Liga-Erfahrung">
                <select value={lastLeague} onChange={e => setLastLeague(e.target.value as LastLeague)} style={input}>
                  {LAST_LEAGUE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Team"><input value={teamName} disabled style={{ ...input, opacity: 0.7 }} /></Field>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', margin: 0 }}>
                Die Nachmeldung geht zur Prüfung an die Ligaleitung. Du wirst über das Ergebnis benachrichtigt.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setOpen(false)} style={{ ...ghost, flex: 1 }}>Schließen</button>
                <button type="submit" disabled={busy} style={{ ...btn, flex: 1, opacity: busy ? 0.7 : 1 }}>{busy ? 'Senden …' : 'Nachmelden'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-text-body)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = { width: '100%', padding: '11px 14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' };
const btn: React.CSSProperties = { padding: '11px 20px', borderRadius: 8, cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13 };
const ghost: React.CSSProperties = { padding: '11px 20px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 };
