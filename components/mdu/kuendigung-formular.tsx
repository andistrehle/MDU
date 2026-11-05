'use client';

import { useState } from 'react';
import { LIGEN_2027, team27 } from '@/lib/data/saison-2027';
import { ANBIETER } from '@/lib/premium';

const feld: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--th-line-10)', background: 'var(--th-bg-card)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, boxSizing: 'border-box' };
const label: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'var(--th-text-body)' };

export function KuendigungFormular() {
  const [f, setF] = useState({ name: '', email: '', team: '', zeitpunkt: 'naechst', datum: '', art: 'ordentlich', nachricht: '', website: '' });
  const [stufe, setStufe] = useState<'eingabe' | 'pruefen' | 'fertig'>('eingabe');
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState('');
  const [eingang, setEingang] = useState<{ wann: string; mail: boolean } | null>(null);
  const teams = LIGEN_2027.flatMap(l => l.teams).map(id => team27(id)?.name ?? id).sort((a, b) => a.localeCompare(b, 'de'));
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF(x => ({ ...x, [k]: e.target.value }));

  async function senden() {
    setLaeuft(true); setFehler('');
    try {
      const r = await fetch('/api/premium/kuendigung', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({})) as { ok?: boolean; error?: string; eingang?: string; bestaetigung?: boolean };
      if (!j.ok) { setFehler(j.error ?? `Das hat nicht geklappt. Bitte schick die Kündigung per E-Mail an ${ANBIETER.email}.`); return; }
      setEingang({ wann: new Date(j.eingang ?? Date.now()).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' }), mail: !!j.bestaetigung });
      setStufe('fertig');
    } catch { setFehler(`Das hat nicht geklappt. Bitte schick die Kündigung per E-Mail an ${ANBIETER.email}.`); }
    finally { setLaeuft(false); }
  }

  if (stufe === 'fertig' && eingang) return (
    <div role="status" style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(31,163,74,0.10)', border: '1px solid rgba(31,163,74,0.4)', fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-body)', lineHeight: 1.55 }}>
      <b>Deine Kündigung ist eingegangen</b> – am {eingang.wann}.{' '}
      {eingang.mail ? `Eine Bestätigung ist an ${f.email} unterwegs.` : `Die Bestätigungs-Mail an ${f.email} konnte gerade nicht verschickt werden – mach dir am besten ein Bildschirmfoto von dieser Seite.`}
    </div>
  );

  const ok = f.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim()) && f.team && (f.zeitpunkt !== 'datum' || f.datum);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
      <label style={label}>Team<select value={f.team} onChange={set('team')} style={feld}><option value="">– bitte wählen –</option>{teams.map(t => <option key={t}>{t}</option>)}</select></label>
      <label style={label}>Dein Name<input value={f.name} onChange={set('name')} style={feld} autoComplete="name" /></label>
      <label style={label}>E-Mail (für die Bestätigung)<input value={f.email} onChange={set('email')} style={feld} type="email" autoComplete="email" /></label>
      <label style={label}>Art der Kündigung<select value={f.art} onChange={set('art')} style={feld}><option value="ordentlich">Ordentliche Kündigung</option><option value="ausserordentlich">Außerordentliche Kündigung</option></select></label>
      <label style={label}>Kündigen zum<select value={f.zeitpunkt} onChange={set('zeitpunkt')} style={feld}><option value="naechst">nächstmöglichen Zeitpunkt</option><option value="datum">bestimmten Datum</option></select></label>
      {f.zeitpunkt === 'datum' && <label style={label}>Datum<input type="date" value={f.datum} onChange={set('datum')} style={feld} /></label>}
      <label style={label}>Nachricht (freiwillig, z. B. Grund bei außerordentlicher Kündigung)<textarea value={f.nachricht} onChange={set('nachricht')} rows={3} style={feld} /></label>
      <input value={f.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden style={{ position: 'absolute', left: -9999, width: 1, height: 1 }} />
      {stufe === 'eingabe' ? (
        <button type="button" disabled={!ok} onClick={() => setStufe('pruefen')} style={{ padding: '12px 18px', borderRadius: 999, border: 'none', cursor: ok ? 'pointer' : 'not-allowed', background: ok ? 'var(--th-accent)' : 'var(--th-line-8)', color: '#fff', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14 }}>Weiter zur Bestätigung</button>
      ) : (
        <div style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid var(--th-line-10)', background: 'var(--th-bg-card)', fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-body)', lineHeight: 1.55 }}>
          Team Manager von <b>{f.team}</b> kündigen ({f.art === 'ausserordentlich' ? 'außerordentlich' : 'ordentlich'}, {f.zeitpunkt === 'datum' && f.datum ? `zum ${f.datum.split('-').reverse().join('.')}` : 'zum nächstmöglichen Zeitpunkt'}). Bestätigung an {f.email}.
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" disabled={laeuft} onClick={() => void senden()} style={{ padding: '12px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', background: '#C0392B', color: '#fff', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14 }}>{laeuft ? 'Wird gesendet …' : 'Jetzt kündigen'}</button>
            <button type="button" disabled={laeuft} onClick={() => setStufe('eingabe')} style={{ padding: '12px 18px', borderRadius: 999, border: '1px solid var(--th-line-10)', background: 'transparent', cursor: 'pointer', color: 'var(--th-text-body)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14 }}>Ändern</button>
          </div>
        </div>
      )}
      {fehler && <div role="alert" style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: '#C0392B' }}>{fehler}</div>}
    </div>
  );
}
