'use client';

// ============================================================
// Karte „Tablet im Lokal“ (Team-Manager-Dashboard, Migration 0072)
// ============================================================
// Kapitän / Co-Captain (Spielberichte) / Ligaleitung richten hier ein Tablet
// ein: Gerät anlegen → achtstelliger Code (15 Minuten, einmal verwendbar) →
// am Tablet unter /kiosk eintippen. Danach zeigt das Tablet am Spieltag von
// selbst das Heimspiel, ohne Anmeldung. Die Karte erscheint nur, wenn das
// Team freigegeben ist (lib/kiosk.ts `KIOSK_TEAMS`) und den Team Manager hat.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { codeAnzeige } from '@/lib/kiosk';
import { karte, h2 } from '@/components/mdu/zusagen-ui';

interface Geraet { id: string; name: string; erstellt_am: string; gekoppelt_am: string | null; last_seen_at: string | null; code_bis: string | null; test_bis?: string | null; test_fertig?: boolean | null }

async function aufruf(url: string, body?: unknown): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  if (!token) return { ok: false, json: { error: 'Nicht angemeldet.' } };
  try {
    const r = await fetch(url, body ? { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { headers: { Authorization: `Bearer ${token}` } });
    return { ok: r.ok, json: await r.json().catch(() => ({})) };
  } catch { return { ok: false, json: { error: 'Keine Verbindung – bitte noch einmal versuchen.' } }; }
}

const text: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', lineHeight: 1.5 };
const leise: React.CSSProperties = { ...text, fontSize: 12.5, color: 'var(--th-text-muted)' };
const feld: React.CSSProperties = { flex: 1, minWidth: 0, boxSizing: 'border-box', padding: '9px 11px', borderRadius: 10, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-8)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14 };
const knopf = (voll: boolean): React.CSSProperties => ({ padding: '9px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, border: '1.5px solid var(--th-accent)', background: voll ? 'var(--th-accent)' : 'transparent', color: voll ? '#fff' : 'var(--th-accent)' });
const wann = (iso: string) => new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function KioskGeraete({ teamId }: { teamId: string }) {
  const [geraete, setGeraete] = useState<Geraet[] | null>(null);
  const [erlaubt, setErlaubt] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState<{ code: string; minuten: number; fuer: string } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  const laden = useCallback(async () => {
    const r = await aufruf(`/api/team/kiosk?team=${encodeURIComponent(teamId)}`);
    if (!r.ok) { setErlaubt(false); return; }
    setErlaubt(!!r.json.erlaubt); setGeraete((r.json.geraete ?? []) as Geraet[]);
  }, [teamId]);
  useEffect(() => { queueMicrotask(() => void laden()); }, [laden]);

  async function tun(body: Record<string, unknown>, fuer?: string) {
    setLaeuft(true); setFehler(null);
    const r = await aufruf('/api/team/kiosk', { team: teamId, ...body });
    setLaeuft(false);
    if (!r.ok) { setFehler(String(r.json.error ?? 'Das hat nicht geklappt.')); return; }
    if (typeof r.json.code === 'string') setCode({ code: r.json.code, minuten: Number(r.json.minuten ?? 15), fuer: fuer ?? '' });
    setName('');
    await laden();
  }

  // Wer die Karte nicht nutzen darf (kein Recht, Team nicht freigegeben), sieht sie gar nicht.
  if (!erlaubt || !geraete) return null;
  return (
    <section style={{ ...karte, gap: 10 }}>
      <h2 style={h2}>Tablet im Lokal</h2>
      <div style={text}>
        Ein Tablet oder altes Handy im Lokal zeigt am Spieltag von selbst euer Heimspiel – ohne Anmeldung. Wer gerade Zeit hat, tippt Aufstellung und
        Ergebnisse an; Live-Ticker und Spielbericht füllen sich wie im Live-Modus. Absenden geht am Tablet, bestätigen nicht.
      </div>

      {code && (
        <div role="status" style={{ padding: 14, borderRadius: 12, border: '1.5px solid var(--th-accent)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={leise}>Code für „{code.fuer}“ – gilt {code.minuten} Minuten, nur einmal:</div>
          <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 40, letterSpacing: '0.1em', color: 'var(--th-text-strong)' }}>{codeAnzeige(code.code)}</div>
          <div style={text}>Am Tablet <strong>mdudarts.de/kiosk</strong> öffnen und den Code eintippen. Der Code wird hier nicht noch einmal angezeigt.</div>
          <button type="button" onClick={() => setCode(null)} style={{ ...knopf(false), alignSelf: 'flex-start' }}>Fertig</button>
        </div>
      )}

      {geraete.map(g => (
        <div key={g.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid var(--th-line-8)' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ ...text, fontWeight: 800, color: 'var(--th-text-strong)' }}>{g.name}</div>
            <div style={leise}>
              {g.test_bis && new Date(g.test_bis) > new Date() ? `TESTSPIEL läuft bis ${wann(g.test_bis)}${g.test_fertig ? ' (abgesendet)' : ''} · ` : ''}{g.gekoppelt_am ? `Eingerichtet · zuletzt aktiv ${g.last_seen_at ? wann(g.last_seen_at) : '–'}` : g.code_bis && new Date(g.code_bis) > new Date() ? `Wartet auf den Code (bis ${wann(g.code_bis)})` : 'Noch nicht eingerichtet – Code abgelaufen'}
            </div>
          </div>
          {g.gekoppelt_am && (g.test_bis && new Date(g.test_bis) > new Date()
            ? <button type="button" disabled={laeuft} onClick={() => void tun({ aktion: 'test_ende' })} style={knopf(true)}>Testspiel beenden</button>
            : <button type="button" disabled={laeuft} onClick={() => void tun({ aktion: 'test_start', id: g.id })} style={knopf(false)}>Testspiel starten</button>)}
          <button type="button" disabled={laeuft} onClick={() => { if (!g.gekoppelt_am || confirm(`„${g.name}“ neu einrichten? Das Tablet braucht dann den neuen Code, bis dahin kann es nichts eintragen.`)) void tun({ aktion: 'code', id: g.id }, g.name); }} style={knopf(false)}>Neuer Code</button>
          <button type="button" disabled={laeuft} onClick={() => { if (confirm(`„${g.name}“ entfernen? Das Tablet kann danach nichts mehr eintragen.`)) void tun({ aktion: 'entfernen', id: g.id }); }} style={{ ...knopf(false), borderColor: 'var(--th-loss, #d64545)', color: 'var(--th-loss, #d64545)' }}>Entfernen</button>
        </div>
      ))}

      <form onSubmit={e => { e.preventDefault(); void tun({ aktion: 'neu', name }, name.trim() || 'Tablet'); }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder="Name, z. B. Tablet Theke" aria-label="Name des Geräts" style={feld} />
        <button type="submit" disabled={laeuft} style={knopf(true)}>Gerät einrichten</button>
      </form>
      {fehler && <div role="alert" style={{ ...text, fontWeight: 700, color: 'var(--th-loss, #d64545)' }}>{fehler}</div>}
      <div style={leise}>„Testspiel starten“: Das Tablet zeigt für 3 Stunden „euer Team – Testgegner“ und speichert wie an einem echten Abend. Davon erscheint nichts im Live-Ticker, in Tabellen oder Ergebnissen, niemand wird benachrichtigt, und „Beenden“ löscht alles wieder.</div>
      <div style={leise}>Ausprobieren ohne Code: <a href="/kiosk?probe=1" target="_blank" rel="noreferrer" style={{ color: 'var(--th-accent)' }}>mdudarts.de/kiosk?probe=1</a> (erfundenes Spiel, nichts wird gespeichert).</div>
    </section>
  );
}
