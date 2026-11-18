'use client';

// ============================================================
// Admin: Spieler — alle DB-Spieler alphabetisch, bearbeiten/löschen
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveRegistrations } from '@/lib/auth/roles';
import { normalizePersonName } from '@/lib/auth/player-match';
import { listAllDbPlayers, deleteDbPlayer, type AdminPlayerRow } from '@/lib/supabase/players-admin';
import { supabase } from '@/lib/supabase/client';
import { findPlayer } from '@/lib/data';
import { betroffen, nameTeilen, neueKennung } from '@/lib/spieler-kennung';

/** Name (und auf Wunsch Profil-Adresse) über den Server ändern — stellt ALLE Stellen um (Migration 0071). */
async function umbenennen(playerId: string, name: string, adresse: boolean, pruefen: boolean) {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  const r = await fetch('/api/admin/spieler', {
    method: 'POST', headers: { Authorization: `Bearer ${token ?? ''}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, name, adresse, pruefen }),
  }).catch(() => null);
  const j = r ? ((await r.json().catch(() => ({}))) as { error?: string; neu?: string; wechsel?: boolean; zahlen?: Record<string, number> }) : { error: 'Keine Verbindung.' };
  return r?.ok ? { ...j, error: null as string | null } : { ...j, error: j.error ?? 'Speichern fehlgeschlagen.' };
}

export default function AdminSpielerPage() {
  const { user } = useAuth();
  const canView = canApproveRegistrations(user);

  const [rows, setRows] = useState<AdminPlayerRow[] | null>(null);
  const [q, setQ] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [mitAdresse, setMitAdresse] = useState(false);
  const [editFehler, setEditFehler] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const load = () => { if (canView) listAllDbPlayers().then(setRows); };
  useEffect(() => { load(); }, [canView]);

  // Dubletten (gleiche Passnummer / gleicher Name) markieren.
  const { dupNums, dupNames } = useMemo(() => {
    const nums = new Map<string, number>(); const names = new Map<string, number>();
    for (const p of rows ?? []) {
      const lic = (p.license ?? '').trim(); if (lic) nums.set(lic, (nums.get(lic) ?? 0) + 1);
      const nm = normalizePersonName(`${p.firstName} ${p.lastName}`); if (nm) names.set(nm, (names.get(nm) ?? 0) + 1);
    }
    return { dupNums: nums, dupNames: names };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows ?? [];
    const d = needle.replace(/\D/g, '');
    return (rows ?? []).filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(needle) ||
      (p.license ?? '').toLowerCase().includes(needle) ||
      (d.length >= 2 && (p.license ?? '').replace(/\D/g, '').includes(d)) ||
      p.teams.some(t => t.toLowerCase().includes(needle)));
  }, [rows, q]);

  async function onSave(id: string) {
    const val = editVal.trim().replace(/\s+/g, ' ');
    if (!val) return;
    setBusy(id); setMsg(null); setEditFehler(null);
    // Erst prüfen (ändert nichts), dann mit Rückfrage ausführen.
    const probe = await umbenennen(id, val, mitAdresse, true);
    if (probe.error) { setBusy(null); setEditFehler(probe.error); return; }
    const b = betroffen(probe.zahlen ?? {});
    const frage = `„${val}“ speichern?\n\n${b.zeilen} ${b.zeilen === 1 ? 'Eintrag' : 'Einträge'} in ${b.tabellen} ${b.tabellen === 1 ? 'Bereich' : 'Bereichen'} (Kader, Spielberichte, Team Manager …) ${b.zeilen === 1 ? 'wird' : 'werden'} mit umgestellt.`
      + (probe.wechsel ? `\n\nNeue Profil-Adresse: /spieler/${probe.neu}\nDie alte Adresse leitet dauerhaft dorthin weiter.` : '');
    if (!window.confirm(frage)) { setBusy(null); return; }
    const r = await umbenennen(id, val, mitAdresse, false);
    setBusy(null);
    if (r.error) { setEditFehler(r.error); return; }
    setMsg({ kind: 'ok', text: r.wechsel ? `Gespeichert. Neue Adresse: /spieler/${r.neu}` : 'Name gespeichert.' });
    setEditId(null); load();
  }

  async function onDelete(p: AdminPlayerRow) {
    const name = `${p.firstName} ${p.lastName}`.trim() || p.id;
    if (!confirm(`„${name}"${p.license ? ` (${p.license})` : ''} endgültig löschen?\n\nDer Spieler wird aus allen Kadern, Zuordnungen und Nachmeldungen entfernt. Das lässt sich nicht rückgängig machen.`)) return;
    setBusy(p.id); setMsg(null);
    const { error } = await deleteDbPlayer(p.id);
    setBusy(null);
    if (error) { setMsg({ kind: 'err', text: error }); return; }
    setMsg({ kind: 'ok', text: `„${name}" gelöscht.` });
    load();
  }

  return (
    <AdminGuard title="Spieler" subtitle="Alle in der Plattform angelegten Spieler — Namen und Profil-Adresse korrigieren oder löschen.">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Suche (Name, Passnummer, Team) …"
          style={{ flex: 1, minWidth: 200, padding: '10px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }} />
        {rows && <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)' }}>{filtered.length} / {rows.length}</span>}
      </div>

      {msg && (
        <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ maxWidth: 900, marginBottom: 14, padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`, color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{msg.text}</div>
      )}

      {rows === null ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>Lade …</p>
      ) : rows.length === 0 ? (
        <div style={{ background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-10)', borderRadius: 14, padding: '32px 24px', maxWidth: 620, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>
          Noch keine über die Plattform angelegten Spieler.
        </div>
      ) : (
        <div style={{ maxWidth: 900, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden' }}>
          {filtered.map((p, i) => {
            const dup = (!!p.license && (dupNums.get(p.license.trim()) ?? 0) > 1)
              || ((dupNames.get(normalizePersonName(`${p.firstName} ${p.lastName}`)) ?? 0) > 1);
            const editing = editId === p.id;
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: i < filtered.length - 1 ? '1px solid var(--th-line-4)' : 'none', flexWrap: 'wrap' }}>
                {editing ? (
                  <>
                    <input value={editVal} autoFocus onChange={e => setEditVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSave(p.id); if (e.key === 'Escape') setEditId(null); }}
                      style={{ flex: 1, minWidth: 160, padding: '6px 10px', borderRadius: 7, background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13.5, outline: 'none' }} />
                    <button type="button" onClick={() => onSave(p.id)} disabled={busy === p.id || !editVal.trim()} style={btnPrimary}>Speichern</button>
                    <button type="button" onClick={() => setEditId(null)} style={btnGhost}>Abbrechen</button>
                    {/* Hinweise direkt am Feld */}
                    <div style={{ flexBasis: '100%', fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.5 }}>
                      {findPlayer(p.id) ? (
                        <>Adresse bleibt <code>/spieler/{p.id}</code> – dieser Spieler steht im festen Stamm aus 2025/26.</>
                      ) : (
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                          <input type="checkbox" checked={mitAdresse} onChange={e => setMitAdresse(e.target.checked)} style={{ marginTop: 3 }} />
                          <span>
                            Auch die Profil-Adresse anpassen{' '}
                            {(() => { const t = nameTeilen(editVal); const n = neueKennung(p.id, t.vorname, t.nachname); return n === p.id
                              ? <>(bleibt <code>/spieler/{p.id}</code>)</>
                              : <>→ <code>/spieler/{n}</code>. Die alte Adresse leitet dauerhaft weiter.</>; })()}
                          </span>
                        </label>
                      )}
                      {editFehler && <div role="alert" style={{ marginTop: 4, fontWeight: 700, color: '#E24B4A' }}>{editFehler}</div>}
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-strong)', fontWeight: 700 }}>
                      {p.firstName} {p.lastName}
                      {dup && <span title="Passnummer oder Name doppelt" style={{ marginLeft: 8, fontSize: 9, fontWeight: 800, color: '#E24B4A', textTransform: 'uppercase', border: '1px solid rgba(212,0,0,0.4)', borderRadius: 4, padding: '1px 5px' }}>⚠ Dublette</span>}
                      {p.teams.length > 0 && <span style={{ fontWeight: 400, color: 'var(--th-text-faint)' }}> · {p.teams.join(', ')}</span>}
                    </span>
                    <span style={{ flexShrink: 0, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: p.license ? 'var(--th-text-muted)' : 'var(--th-text-faint)' }}>{p.license ?? '—'}</span>
                    <button type="button" title="Namen bearbeiten" onClick={() => { setEditId(p.id); setEditVal(`${p.firstName} ${p.lastName}`.trim()); setMsg(null); setEditFehler(null); setMitAdresse(!findPlayer(p.id) && neueKennung(p.id, p.firstName, p.lastName) !== p.id); }} style={iconBtn}>✎</button>
                    <button type="button" title="Spieler löschen" onClick={() => onDelete(p)} disabled={busy === p.id} style={{ ...iconBtn, color: '#E24B4A', borderColor: 'rgba(212,0,0,0.35)' }}>🗑</button>
                  </>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ padding: '22px 16px', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>Kein Treffer für „{q}".</div>}
        </div>
      )}
    </AdminGuard>
  );
}

const btnPrimary: React.CSSProperties = { padding: '7px 12px', borderRadius: 7, cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12 };
const btnGhost: React.CSSProperties = { padding: '7px 10px', borderRadius: 7, cursor: 'pointer', background: 'transparent', color: 'var(--th-text-muted)', border: '1px solid var(--th-line-10)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12 };
const iconBtn: React.CSSProperties = { padding: '4px 9px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'var(--th-text-faint)', border: '1px solid var(--th-line-10)', fontSize: 12 };
