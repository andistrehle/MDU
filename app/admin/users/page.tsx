'use client';

// ============================================================
// Benutzerverwaltung — echte Supabase profiles
// ============================================================
//
// Lädt public.profiles aus Supabase und erlaubt das Bearbeiten von
// displayName / role / player_id / team_id. E-Mail, id und created_at
// sind nicht editierbar.
//
// Zugriff: Ligaleitung aufwärts (canViewUsers/canEditUsers). Welches Konto
// jemand bearbeiten/löschen darf, regeln canEditUserAccount/
// canDeleteUserAccount (Ligaleitung nur Spieler/Teamkapitäne; Super Admin
// alles). RLS in der DB sichert das zusätzlich serverseitig ab.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { canViewUsers, canEditUsers, canEditUserAccount, canDeleteUserAccount, canAssignRole, ROLE_LABELS, type UserRole, type UserProfile } from '@/lib/auth/roles';
import { PLAYERS, getPlayerDisplayName, TEAMS } from '@/lib/data';
import { triggerAccountActivatedEmail } from '@/lib/supabase/notifications';
import { listApprovedNominatedPlayers } from '@/lib/supabase/nominations';

interface ProfileRow {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  player_id: string | null;
  team_id: string | null;
  registration_intent: string | null;
  matched_player_id: string | null;
  matched_team_id: string | null;
  match_confidence: string | null;
  match_status: string | null;
  created_at: string;
  updated_at: string;
}

const ROLE_OPTIONS: UserRole[] = ['player', 'team_captain', 'league_admin', 'super_admin'];

// Sortierte Listen für die Dropdowns
const PLAYER_OPTIONS = [...PLAYERS]
  .map(p => ({ id: p.id, name: getPlayerDisplayName(p) }))
  .sort((a, b) => a.name.localeCompare(b.name, 'de'));

// Zusätzlich zuordenbare Spieler aus freigegebenen Nachmeldungen (zur Laufzeit
// aus der DB geladen). Modul-Registry, damit playerName()/Dropdown sie sehen.
let NOMINATED_OPTIONS: { id: string; name: string }[] = [];
function combinedPlayerOptions(): { id: string; name: string }[] {
  return [...PLAYER_OPTIONS, ...NOMINATED_OPTIONS].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

const TEAM_OPTIONS = [...TEAMS]
  .map(t => ({ id: t.id, name: t.name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'de'));

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '–';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function playerName(id: string | null): string {
  if (!id) return '–';
  return PLAYER_OPTIONS.find(p => p.id === id)?.name
    ?? NOMINATED_OPTIONS.find(p => p.id === id)?.name
    ?? id;
}
function teamName(id: string | null): string {
  if (!id) return '–';
  return TEAM_OPTIONS.find(t => t.id === id)?.name ?? id;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const allowed = canViewUsers(user);      // Ligaleitung aufwärts darf einsehen
  const canEdit = canEditUsers(user);      // Ligaleitung aufwärts darf bearbeiten (Super-Admin-Konten bleiben geschützt)

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setStatus('error'); setErrorMsg('Supabase ist nicht konfiguriert.'); return; }
    setStatus('loading');
    const [{ data, error }, nominated] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      listApprovedNominatedPlayers().catch(() => []),
    ]);
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }
    // Freigegebene Nachmeldungs-Spieler zusätzlich zuordenbar machen.
    NOMINATED_OPTIONS = (nominated ?? []).map(n => ({ id: n.id, name: n.license ? `${n.name} · ${n.license}` : n.name }));
    setProfiles((data ?? []) as ProfileRow[]);
    setStatus('idle');
  }, []);

  useEffect(() => {
    // load() setzt synchron State → außerhalb des Effect-Bodys ausführen
    // (react-hooks/set-state-in-effect)
    if (allowed) queueMicrotask(() => load());
  }, [allowed, load]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onDelete(p: ProfileRow) {
    if (!supabase) return;
    if (!confirm(`Benutzer „${p.display_name}" (${p.email}) endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    setDeletingId(p.id);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    const res = await fetch(`/api/admin/users/${p.id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json().catch(() => ({}));
    setDeletingId(null);
    if (!res.ok) { alert(json.error ?? 'Löschen fehlgeschlagen.'); return; }
    setProfiles(prev => prev.filter(x => x.id !== p.id));
    setNotice(`Benutzer „${p.display_name}" wurde gelöscht.`);
  }

  // ── Zugriffsschutz ──────────────────────────────────────────
  if (authLoading) {
    return <Shell><p style={muted}>Lade …</p></Shell>;
  }
  if (!user) {
    return (
      <Shell>
        <Notice title="Bitte einloggen">
          Die Benutzerverwaltung ist nur für Ligaleitung und Super Admins verfügbar.{' '}
          <Link href="/login" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Zur Anmeldung →</Link>
        </Notice>
      </Shell>
    );
  }
  if (!allowed) {
    return (
      <Shell>
        <Notice title="Keine Berechtigung">
          Dieser Bereich ist nur für Ligaleitung und Super Admins. Deine Rolle: {ROLE_LABELS[user.role]}.
        </Notice>
      </Shell>
    );
  }

  return (
    <Shell>
      {status === 'loading' && <p style={muted}>Benutzer werden geladen …</p>}
      {status === 'error' && (
        <Notice title="Fehler beim Laden">
          {errorMsg}
        </Notice>
      )}

      {notice && (
        <div role="status" style={{ marginBottom: 16, padding: '11px 15px', borderRadius: 10, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.35)', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-win)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1 }}>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Schließen" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-text-faint)', fontFamily: 'var(--font-manrope)', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
      )}

      {status === 'idle' && (
        <>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', marginBottom: 16 }}>
            {profiles.length} Benutzer · Quelle: Supabase <code style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>public.profiles</code>
            {!canEdit && ' · Nur-Lese-Ansicht (Bearbeiten nur Super Admin)'}
          </div>

          {/* ── Desktop-Tabelle ──────────────────────────────── */}
          <div className="mdu-desktop-only mdu-table-scroll">
            <div style={{ minWidth: 820, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1.1fr 1.1fr 1fr 150px',
                padding: '12px 18px', borderBottom: '1px solid var(--th-line-8)',
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.1em', color: 'var(--th-text-dim)', textTransform: 'uppercase', gap: 12,
              }}>
                <span>Name</span><span>E-Mail</span><span>Rolle</span><span>Spieler</span><span>Team</span><span></span>
              </div>
              {profiles.map((p, i) => (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1.1fr 1.1fr 1fr 150px',
                  padding: '12px 18px', gap: 12, alignItems: 'center',
                  borderBottom: i < profiles.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                  fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</span>
                    <IntentBadge profile={p} />
                  </span>
                  <span style={{ color: 'var(--th-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</span>
                  <span><RoleBadge role={p.role} /></span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playerName(p.player_id)}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teamName(p.team_id)}</span>
                  <span style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                    {canEdit && canEditUserAccount(user, p.role) && <button onClick={() => setEditing(p)} style={editBtn}>Bearb.</button>}
                    {canDeleteUserAccount(user, p.role) && p.id !== user.id && (
                      <button onClick={() => onDelete(p)} disabled={deletingId === p.id} style={delBtn}>{deletingId === p.id ? '…' : 'Löschen'}</button>
                    )}
                    {!(canEdit && canEditUserAccount(user, p.role)) && !(canDeleteUserAccount(user, p.role) && p.id !== user.id) && (
                      <span style={{ color: 'var(--th-text-faint2)', fontSize: 12 }} title={p.role === 'super_admin' ? 'Super-Admin-Konten kann nur ein Super Admin verwalten.' : undefined}>—</span>
                    )}
                  </span>
                </div>
              ))}
              {profiles.length === 0 && <div style={{ padding: '24px 18px', ...muted }}>Noch keine Benutzer registriert.</div>}
            </div>
          </div>

          {/* ── Mobile-Karten ────────────────────────────────── */}
          <div className="mdu-mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {profiles.map(p => (
              <div key={p.id} style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</span>
                  <IntentBadge profile={p} />
                  <RoleBadge role={p.role} />
                </div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-body)', display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                  <span>Spieler: <strong style={{ color: 'var(--th-text-strong)' }}>{playerName(p.player_id)}</strong></span>
                  <span>Team: <strong style={{ color: 'var(--th-text-strong)' }}>{teamName(p.team_id)}</strong></span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {canEdit && canEditUserAccount(user, p.role) && <button onClick={() => setEditing(p)} style={{ ...editBtn, flex: 1, padding: '9px' }}>Bearbeiten</button>}
                  {canDeleteUserAccount(user, p.role) && p.id !== user.id && (
                    <button onClick={() => onDelete(p)} disabled={deletingId === p.id} style={{ ...delBtn, flex: 1, padding: '9px' }}>{deletingId === p.id ? 'Löschen …' : 'Löschen'}</button>
                  )}
                </div>
              </div>
            ))}
            {profiles.length === 0 && <p style={muted}>Noch keine Benutzer registriert.</p>}
          </div>
        </>
      )}

      {editing && (
        <EditModal
          actor={user}
          profile={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated, msg) => {
            setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
            setEditing(null);
            setNotice(msg ?? null);
          }}
        />
      )}
    </Shell>
  );
}

// ── Edit Modal ────────────────────────────────────────────────

function EditModal({ actor, profile, onClose, onSaved }: {
  actor: UserProfile | null;
  profile: ProfileRow;
  onClose: () => void;
  onSaved: (p: ProfileRow, notice?: string) => void;
}) {
  // Rollen, die der aktuelle Admin vergeben darf (Ligaleitung ohne 'super_admin').
  const roleOptions = ROLE_OPTIONS.filter(r => canAssignRole(actor, r));
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [role, setRole] = useState<UserRole>(profile.role);
  const [playerId, setPlayerId] = useState(profile.player_id ?? '');
  const [teamId, setTeamId] = useState(profile.team_id ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setErr('Supabase ist nicht konfiguriert.'); return; }
    setBusy(true);
    setErr(null);
    // Ein Konto gilt als „freigeschaltet", sobald ein Spieler verknüpft oder
    // eine Rolle über 'player' hinaus vergeben wird.
    const reviewed = !!playerId || role !== 'player';
    // match_status: 'confirmed' wenn der Vorschlag übernommen wurde, sonst 'manual'
    const matchStatus = playerId
      ? (playerId === (profile.matched_player_id ?? '') ? 'confirmed' : 'manual')
      : (reviewed ? 'confirmed' : (profile.match_status ?? 'pending'));
    const wasPending = (profile.match_status ?? 'pending') === 'pending';
    const justActivated = wasPending && reviewed; // nur beim ersten Bestätigen mailen
    const newName = displayName.trim() || profile.email.split('@')[0];
    const patch = {
      display_name: newName,
      role,
      player_id: playerId || null,
      team_id: teamId || null,
      match_status: matchStatus,
    };
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', profile.id)
      .select('*')
      .maybeSingle();
    if (error || !data) {
      setBusy(false);
      setErr(error?.message ?? 'Speichern fehlgeschlagen.');
      return;
    }

    // „Konto freigeschaltet"-Mail an den Benutzer (best-effort, blockiert nicht).
    let notice: string | undefined = 'Benutzer gespeichert.';
    if (justActivated) {
      const r = await triggerAccountActivatedEmail(profile.email, newName, {
        role,
        playerName: playerId ? playerName(playerId) : undefined,
        teamName: teamId ? teamName(teamId) : undefined,
        profileId: profile.id,
      });
      const hint = r.status === 'sent'
        ? 'Eine E-Mail mit Rolle und Rechten wurde an den Benutzer versendet.'
        : r.status === 'skipped_no_provider'
          ? 'E-Mail vorbereitet – es ist kein E-Mail-Anbieter konfiguriert.'
          : 'E-Mail konnte nicht versendet werden (siehe E-Mail-Log).';
      notice = `Konto freigeschaltet (${ROLE_LABELS[role]}). ${hint}`;
    }
    setBusy(false);
    onSaved(data as ProfileRow, notice);
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Benutzer ${profile.display_name} bearbeiten`}
        style={{
          width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto',
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)',
          borderRadius: 16, padding: '24px 26px', boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
        }}>
        <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, color: 'var(--th-text-strong)', margin: '0 0 4px', textTransform: 'uppercase' }}>
          Benutzer bearbeiten
        </h2>
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', margin: '0 0 18px' }}>
          {profile.email} · registriert {fmtDate(profile.created_at)}
        </p>

        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {err && (
            <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(212,0,0,0.10)', border: '1px solid rgba(212,0,0,0.35)', fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A' }}>{err}</div>
          )}

          {/* Automatischer Erkennungs-Vorschlag */}
          {(profile.registration_intent || profile.matched_player_id) && (
            <div style={{ background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', borderRadius: 10, padding: '12px 14px', fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-body)', lineHeight: 1.6 }}>
              {profile.registration_intent && (
                <div>Wunsch: <strong style={{ color: 'var(--th-text-strong)' }}>{profile.registration_intent === 'team_captain' ? 'Teamkapitän / TC' : 'Spieler'}</strong></div>
              )}
              {profile.matched_player_id ? (
                <>
                  <div>Erkannt: <strong style={{ color: 'var(--th-text-strong)' }}>{playerName(profile.matched_player_id)}</strong>
                    {profile.matched_team_id ? ` · ${teamName(profile.matched_team_id)}` : ''}
                    {profile.match_confidence ? ` (${profile.match_confidence})` : ''}</div>
                  <button type="button" onClick={() => {
                    setPlayerId(profile.matched_player_id ?? '');
                    if (profile.matched_team_id) setTeamId(profile.matched_team_id);
                    // Auch die gewünschte Rolle übernehmen (sofern der Admin sie vergeben darf).
                    const wished: UserRole | null = profile.registration_intent === 'team_captain' ? 'team_captain'
                      : profile.registration_intent === 'player' ? 'player' : null;
                    if (wished && roleOptions.includes(wished)) setRole(wished);
                  }}
                    style={{ marginTop: 8, padding: '7px 12px', borderRadius: 7, cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12 }}>
                    Vorschlag übernehmen
                  </button>
                </>
              ) : (
                <div style={{ color: 'var(--th-text-faint)' }}>Kein eindeutiger Spieler erkannt — bitte manuell zuordnen.</div>
              )}
            </div>
          )}

          <Field label="Anzeigename">
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} style={inputStyle} />
          </Field>

          <Field label="Rolle">
            <select value={role} onChange={e => setRole(e.target.value as UserRole)} style={inputStyle}>
              {roleOptions.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>

          <Field label="Verknüpfter Spieler">
            <select value={playerId} onChange={e => setPlayerId(e.target.value)} style={inputStyle}>
              <option value="">— keine Verknüpfung —</option>
              {combinedPlayerOptions().map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>

          <Field label="Verknüpftes Team">
            <select value={teamId} onChange={e => setTeamId(e.target.value)} style={inputStyle}>
              <option value="">— kein Team —</option>
              {TEAM_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" onClick={onClose} style={{ ...editBtn, flex: 1, padding: '12px' }}>Abbrechen</button>
            <button type="submit" disabled={busy} style={{
              flex: 1, padding: '12px', borderRadius: 8, cursor: busy ? 'wait' : 'pointer',
              background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)',
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.04em',
              opacity: busy ? 0.7 : 1,
            }}>{busy ? 'Speichern …' : 'Speichern'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Kleine Bausteine ──────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30, color: 'var(--th-text-strong)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        Benutzerverwaltung
      </h1>
      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', margin: '0 0 22px' }}>
        Rollen vergeben und Konten mit Spielern / Teams verknüpfen.
      </p>
      {children}
    </div>
  );
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '28px 24px', maxWidth: 520 }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)', marginBottom: 8 }}>{title}</div>
      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.6, margin: 0 }}>{children}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const isAdmin = role === 'super_admin' || role === 'league_admin';
  return (
    <span style={{
      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em',
      textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap',
      color: isAdmin ? 'var(--th-accent)' : 'var(--th-text-muted)',
      background: isAdmin ? 'var(--th-accent-a12)' : 'var(--th-line-5)',
      border: `1px solid ${isAdmin ? 'var(--th-accent-a25)' : 'var(--th-line-8)'}`,
    }}>
      {ROLE_LABELS[role]}
    </span>
  );
}

/** Zeigt den TC-Wunsch (nur solange noch nicht als Kapitän bestätigt). */
function IntentBadge({ profile }: { profile: ProfileRow }) {
  if (profile.registration_intent !== 'team_captain' || profile.role === 'team_captain') return null;
  return (
    <span style={{
      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9, letterSpacing: '0.08em',
      textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0,
      color: 'var(--th-gold)', background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.3)',
    }}>
      TC-Wunsch
    </span>
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

const muted: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' };

const editBtn: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 7, cursor: 'pointer',
  background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)',
  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
};

const delBtn: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 7, cursor: 'pointer',
  background: 'transparent', color: 'var(--th-loss)', border: '1.5px solid var(--th-loss)',
  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: 'var(--th-bg-header)',
  border: '1px solid var(--th-line-10)', borderRadius: 8,
  color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none',
};
