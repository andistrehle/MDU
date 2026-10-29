'use client';

// ============================================================
// Admin → Saison-Teams: Teamcaptain wechseln (Betreiber, 29.10.2026)
// ============================================================
// Nur die Ligaleitung. Wählbar sind Kaderspieler mit verknüpftem Konto
// (sonst hätte der neue TC keine Rechte). Jedes Mal wählen, ob der bisherige
// Kapitän seine Rechte behält. Server: /api/admin/kapitaen.
// ============================================================

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Kaderzeile { player_id: string | null; first_name: string | null; last_name: string | null; is_captain: boolean }
interface Daten { konten: Record<string, { userId: string; name: string; rolle: string }>; bisherige: { userId: string; name: string; playerId: string | null }[] }

async function aufruf(url: string, init?: RequestInit): Promise<{ ok: boolean; json: Record<string, unknown> }> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  if (!token) return { ok: false, json: { error: 'Nicht angemeldet.' } };
  try {
    const r = await fetch(url, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    return { ok: r.ok, json: await r.json().catch(() => ({})) };
  } catch { return { ok: false, json: { error: 'Keine Verbindung – bitte noch einmal versuchen.' } }; }
}

const knopf: React.CSSProperties = { padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12 };

export function KapitaenWechseln({ seasonId, teamId, teamName, kader, onFertig }: {
  seasonId: string; teamId: string; teamName: string; kader: Kaderzeile[]; onFertig: () => void;
}) {
  const [offen, setOffen] = useState(false);
  const [daten, setDaten] = useState<Daten | null>(null);
  const [wahl, setWahl] = useState('');
  const [behalten, setBehalten] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);

  async function oeffnen() {
    setOffen(true); setMeldung(null); setWahl(''); setBehalten(false); setDaten(null);
    const r = await aufruf(`/api/admin/kapitaen?seasonId=${encodeURIComponent(seasonId)}&teamId=${encodeURIComponent(teamId)}`);
    if (!r.ok) { setMeldung({ ok: false, text: String(r.json.error ?? 'Laden fehlgeschlagen.') }); return; }
    setDaten(r.json as unknown as Daten);
  }

  async function speichern() {
    const spieler = kader.find(k => k.player_id === wahl);
    if (!spieler) { setMeldung({ ok: false, text: 'Bitte den neuen Kapitän wählen.' }); return; }
    const name = `${spieler.first_name ?? ''} ${spieler.last_name ?? ''}`.trim();
    const alt = daten?.bisherige.filter(b => b.playerId !== wahl).map(b => b.name) ?? [];
    if (!confirm(`${name} wird Teamcaptain von ${teamName}.\n\n${alt.length ? `Bisher: ${alt.join(', ')} – ${behalten ? 'behält die Kapitänsrechte.' : 'verliert die Kapitänsrechte (bleibt im Kader).'}\n\n` : ''}Neuer und bisheriger Kapitän sowie das ganze Team bekommen eine Nachricht.`)) return;
    setLaeuft(true); setMeldung(null);
    const r = await aufruf('/api/admin/kapitaen', { method: 'POST', body: JSON.stringify({ seasonId, teamId, playerId: wahl, behalten }) });
    setLaeuft(false);
    if (!r.ok) { setMeldung({ ok: false, text: String(r.json.error ?? 'Speichern fehlgeschlagen.') }); return; }
    const j = r.json as { neu: string; rechteEntzogen: string[]; behalten: string[]; benachrichtigt: number; kontaktAktualisiert: boolean; telefon: boolean };
    const teile = [`${j.neu} ist jetzt Teamcaptain.`];
    if (j.rechteEntzogen.length) teile.push(`Kapitänsrechte beendet: ${j.rechteEntzogen.join(', ')}.`);
    if (j.behalten.length) teile.push(`Behält die Rechte: ${j.behalten.join(', ')}.`);
    teile.push(`${j.benachrichtigt} ${j.benachrichtigt === 1 ? 'Nachricht' : 'Nachrichten'} verschickt.`);
    if (j.kontaktAktualisiert && !j.telefon) teile.push('Ansprechpartner umgestellt – eine Telefonnummer ist für ihn nicht hinterlegt.');
    setMeldung({ ok: true, text: teile.join(' ') });
    setOffen(false);
    onFertig();
  }

  const kandidaten = kader.filter(k => k.player_id);
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {!offen ? (
        <button type="button" onClick={() => void oeffnen()} style={{ ...knopf, alignSelf: 'flex-start', background: 'transparent', color: 'var(--th-accent)', border: '1px solid var(--th-accent)' }}>
          Kapitän wechseln
        </button>
      ) : (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 9, background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)' }}>
          <strong style={{ fontSize: 12.5, color: 'var(--th-text-strong)' }}>Neuen Teamcaptain wählen</strong>
          {!daten && !meldung && <span style={{ fontSize: 12, color: 'var(--th-text-muted)' }}>Lade Kader …</span>}
          {daten && (
            <>
              <span style={{ fontSize: 12, color: 'var(--th-text-muted)' }}>
                Bisher mit Kapitänsrechten: {daten.bisherige.length ? daten.bisherige.map(b => b.name).join(', ') : 'niemand'}
              </span>
              <select value={wahl} onChange={e => { setWahl(e.target.value); setMeldung(null); }}
                style={{ padding: '7px 9px', borderRadius: 7, background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
                <option value="">— Spieler aus dem Kader wählen —</option>
                {kandidaten.map(k => {
                  const konto = daten.konten[k.player_id!];
                  return (
                    <option key={k.player_id} value={k.player_id!} disabled={!konto}>
                      {`${k.first_name ?? ''} ${k.last_name ?? ''}`.trim()}{k.is_captain ? ' (Kapitän)' : ''}{konto ? '' : ' – kein Konto'}
                    </option>
                  );
                })}
              </select>
              <span style={{ fontSize: 11.5, color: 'var(--th-text-faint)' }}>Wählbar ist nur, wer ein Konto hat, das mit seinem Spielerprofil verknüpft ist (Admin → Benutzer).</span>
              {daten.bisherige.some(b => b.playerId !== wahl) && (
                <label style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 12, color: 'var(--th-text-body)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={behalten} onChange={e => setBehalten(e.target.checked)} style={{ marginTop: 2 }} />
                  <span>Bisheriger Kapitän behält die Rechte (z. B. als Stellvertreter). Ohne Haken wird er normaler Spieler und bleibt im Kader.</span>
                </label>
              )}
            </>
          )}
          {meldung && !meldung.ok && <span role="alert" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--th-loss, #d64545)' }}>{meldung.text}</span>}
          <span style={{ display: 'flex', gap: 6 }}>
            <button type="button" disabled={laeuft || !daten} onClick={() => void speichern()} style={{ ...knopf, background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', opacity: laeuft || !daten ? 0.6 : 1 }}>
              {laeuft ? 'Speichere …' : 'Kapitän übernehmen'}
            </button>
            <button type="button" onClick={() => { setOffen(false); setMeldung(null); }} style={{ ...knopf, background: 'transparent', color: 'var(--th-text-muted)', border: '1px solid var(--th-line-10)' }}>Abbrechen</button>
          </span>
        </span>
      )}
      {!offen && meldung && <span role={meldung.ok ? 'status' : 'alert'} style={{ fontSize: 12.5, fontWeight: 700, color: meldung.ok ? 'var(--th-win)' : 'var(--th-loss, #d64545)' }}>{meldung.text}</span>}
    </span>
  );
}
