'use client';

// ============================================================
// „Öffentliche Seiten zeigen noch den alten Stand“ (Betreiber, 18.11.2026)
// ============================================================
// Auf Admin → Saison-Teams: vergleicht die Datenbank mit dem, was Spielplan,
// Teamseite und Spielstätten gerade zeigen (/api/admin/saison-snapshot). Gibt es
// Unterschiede (anderes Lokal, Name, Kürzel, Logo), stehen sie hier mit einem Knopf
// zum Übernehmen. Nach dem Speichern eines Lokals ruft die Seite `uebernehmen()`
// selbst auf — der Hinweis bleibt als Kontrolle und für Änderungen von anderswo.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type Antwort = { unterschiede?: string[]; bereit?: boolean; geaendert?: boolean; error?: string };

async function ruf(methode: 'GET' | 'POST'): Promise<{ ok: boolean; j: Antwort }> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  const r = await fetch('/api/admin/saison-snapshot', { method: methode, headers: { Authorization: `Bearer ${token ?? ''}` } }).catch(() => null);
  const j = r ? ((await r.json().catch(() => ({}))) as Antwort) : { error: 'Keine Verbindung.' };
  return { ok: !!r?.ok, j };
}

/** Übernimmt die Unterschiede sofort (für den Aufruf nach dem Speichern). Liefert einen Satz für den Hinweis am Feld. */
export async function snapshotUebernehmen(): Promise<{ art: 'ok' | 'err'; text: string }> {
  const { ok, j } = await ruf('POST');
  if (!ok) return { art: 'err', text: `Gespeichert – die öffentlichen Seiten konnten aber nicht aktualisiert werden: ${j.error ?? 'unbekannter Fehler'}` };
  return { art: 'ok', text: j.geaendert ? 'Gespeichert. Spielplan, Teamseite und Spielstätten ziehen in ein paar Minuten nach.' : 'Gespeichert.' };
}

export function SnapshotAbgleich({ neuLaden }: { neuLaden: number }) {
  const [liste, setListe] = useState<string[] | null>(null);
  const [bereit, setBereit] = useState(true);
  const [laeuft, setLaeuft] = useState(false);
  const [msg, setMsg] = useState<{ art: 'ok' | 'err'; text: string } | null>(null);

  const pruefen = useCallback(async () => {
    const { ok, j } = await ruf('GET');
    if (ok) { setListe(j.unterschiede ?? []); setBereit(j.bereit !== false); }
  }, []);
  useEffect(() => { queueMicrotask(() => void pruefen()); }, [pruefen, neuLaden]);

  async function uebernehmen() {
    setLaeuft(true); setMsg(null);
    const { ok, j } = await ruf('POST');
    setLaeuft(false);
    if (!ok) { setMsg({ art: 'err', text: j.error ?? 'Übernehmen fehlgeschlagen.' }); return; }
    setMsg({ art: 'ok', text: j.geaendert ? 'Übernommen – die öffentlichen Seiten ziehen in ein paar Minuten nach.' : 'Es war schon alles übernommen – die Seiten werden gerade neu gebaut.' });
  }

  if (!liste?.length && !msg) return null;
  return (
    <div role="status" style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 10, background: 'rgba(232,184,74,0.10)', border: '1px solid rgba(232,184,74,0.35)', fontFamily: 'var(--font-manrope)', fontSize: 13, lineHeight: 1.5, color: 'var(--th-text-body)' }}>
      {!!liste?.length && !msg && (
        <>
          <strong style={{ display: 'block', color: 'var(--th-text-strong)' }}>Die öffentlichen Seiten zeigen noch den alten Stand</strong>
          Spielplan, Teamseiten und Spielstätten kennen diese Änderungen noch nicht:
          <ul style={{ margin: '6px 0 10px', paddingLeft: 18 }}>{liste.map(z => <li key={z}>{z}</li>)}</ul>
          <button type="button" onClick={() => void uebernehmen()} disabled={laeuft || !bereit} style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, padding: '8px 14px', borderRadius: 999, cursor: 'pointer', border: '1px solid var(--th-accent)', background: 'var(--th-accent)', color: '#fff', opacity: laeuft || !bereit ? 0.6 : 1 }}>
            {laeuft ? 'Übernehme …' : 'Jetzt übernehmen'}
          </button>
          {/* Hinweis direkt am Knopf */}
          {!bereit && <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--th-text-muted)' }}>Das automatische Übernehmen ist auf dem Server nicht eingerichtet (MDU_GITHUB_TOKEN fehlt).</div>}
        </>
      )}
      {msg && <div role={msg.art === 'err' ? 'alert' : 'status'} style={{ fontWeight: 700, color: msg.art === 'err' ? 'var(--th-loss)' : 'var(--th-win)' }}>{msg.text}</div>}
    </div>
  );
}
