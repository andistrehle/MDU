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

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';
import { canViewUsers, canEditUsers, canEditUserAccount, canDeleteUserAccount, canAssignRole, ROLE_LABELS, type UserRole, type UserProfile } from '@/lib/auth/roles';
import { PLAYERS, getPlayerDisplayName, TEAMS, getCaptainForTeamInSeason, getCurrentSeason } from '@/lib/data';
import { normalizePersonName } from '@/lib/auth/player-match';
import { triggerAccountActivatedEmail } from '@/lib/supabase/notifications';
import { listApprovedNominatedPlayers } from '@/lib/supabase/nominations';
import { listDbPlayerOptions, listDbTeamOptions, listSeasonTeams } from '@/lib/supabase/season-teams';
import { getRegistrationSeason } from '@/lib/supabase/seasons';

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
// Aktuelle Passnummer je Spieler-Id (zur Laufzeit aus der DB) — hängt im Dropdown
// einheitlich an jeden Namen an, statisch wie neu.
let LICENSE_BY_ID = new Map<string, string>();
function combinedPlayerOptions(): { id: string; name: string }[] {
  return [...PLAYER_OPTIONS, ...NOMINATED_OPTIONS]
    .map(o => { const lic = LICENSE_BY_ID.get(o.id); return { id: o.id, name: lic ? `${o.name} · ${lic}` : o.name }; })
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

const TEAM_OPTIONS = [...TEAMS]
  .map(t => ({ id: t.id, name: t.name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'de'));

// Zusätzliche Teams aus der DB (bei Anmeldung neu angelegt), zur Laufzeit geladen.
let DB_TEAM_OPTIONS: { id: string; name: string }[] = [];
function combinedTeamOptions(): { id: string; name: string }[] {
  const ids = new Set(TEAM_OPTIONS.map(o => o.id));
  return [...TEAM_OPTIONS, ...DB_TEAM_OPTIONS.filter(t => !ids.has(t.id))]
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

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
  return TEAM_OPTIONS.find(t => t.id === id)?.name
    ?? DB_TEAM_OPTIONS.find(t => t.id === id)?.name
    ?? id;
}

// War der erkannte Spieler in der (letzten) Saison Teamkapitän seines Teams?
// Vergleich des Kapitäns-Namens der Team-Saison-Zuordnung mit dem Spielernamen
// (normalisiert). Rückgabe: { was, captainName } — captainName für den Gegencheck.
function captainCheck(playerId: string | null, teamId: string | null): { was: boolean; captainName: string | null } {
  if (!playerId || !teamId) return { was: false, captainName: null };
  const cap = getCaptainForTeamInSeason(teamId, getCurrentSeason().id);
  if (!cap) return { was: false, captainName: null };
  const capN = normalizePersonName(cap);
  // Gegen mehrere Namensformen prüfen (Anzeigename kann Spitzname/Format enthalten):
  const p = PLAYERS.find(x => x.id === playerId);
  const candidates = [
    playerName(playerId),
    p ? `${p.firstName} ${p.lastName}` : '',
    p?.displayName ?? '',
  ].filter(Boolean).map(normalizePersonName);
  return { was: candidates.includes(capN), captainName: cap };
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const allowed = canViewUsers(user);      // Ligaleitung aufwärts darf einsehen
  const canEdit = canEditUsers(user);      // Ligaleitung aufwärts darf bearbeiten (Super-Admin-Konten bleiben geschützt)

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  // Kapitäns-Kontakt (Telefon/E-Mail aus der Anmeldung) je Konto-Id — für Rückfragen.
  const [captainContact, setCaptainContact] = useState<Map<string, { phone: string | null; email: string | null; team: string }>>(new Map());
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [editing, setEditing] = useState<ProfileRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Filter über match_status:
  //   • „Zuzuweisen"     = noch ungeprüft (role player + pending) → löst den Badge aus.
  //   • „Ohne Zuordnung" = bewusst ohne Spieler/Team gespeichert (no_player).
  const [filter, setFilter] = useState<'all' | 'pending' | 'no_player'>('all');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'' | UserRole>('');
  const [teamFilter, setTeamFilter] = useState('');
  // Spalten-Filter-Optionen: nur tatsächlich vorkommende Rollen/Teams.
  const roleFilterOptions = useMemo(() => [...new Set(profiles.map(p => p.role))], [profiles]);
  const teamFilterOptions = useMemo(() => {
    const ids = [...new Set(profiles.map(p => p.team_id).filter((x): x is string => !!x))];
    return ids.map(id => ({ id, name: teamName(id) })).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [profiles]);
  const isPending = (p: ProfileRow) => p.role === 'player' && p.match_status === 'pending';
  // „Ohne Zuordnung" = bewusst geprüft, aber kein Spieler verknüpft. Gespeichert
  // als 'rejected' (bereits erlaubter Constraint-Wert; heißt „geprüft, keine
  // Verknüpfung") — so ist keine DB-Migration nötig.
  const isNoPlayer = (p: ProfileRow) => p.match_status === 'rejected';
  const pendingCount = useMemo(() => profiles.filter(isPending).length, [profiles]);
  const noPlayerCount = useMemo(() => profiles.filter(isNoPlayer).length, [profiles]);
  const shown = useMemo(() => {
    let list = filter === 'pending' ? profiles.filter(isPending)
      : filter === 'no_player' ? profiles.filter(isNoPlayer)
      : profiles;
    if (roleFilter) list = list.filter(p => p.role === roleFilter);
    if (teamFilter) list = list.filter(p => p.team_id === teamFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      // Volltext über alle sichtbaren Spalten + Passnummer.
      list = list.filter(p => {
        const lic = p.player_id ? (LICENSE_BY_ID.get(p.player_id) ?? '') : '';
        return [p.display_name, p.email, ROLE_LABELS[p.role], playerName(p.player_id), teamName(p.team_id), lic]
          .join(' ').toLowerCase().includes(q);
      });
    }
    return list;
  }, [profiles, filter, query, roleFilter, teamFilter]);

  const emptyMsg = query.trim() ? `Kein Treffer für „${query.trim()}".`
    : (roleFilter || teamFilter) ? 'Kein Treffer für die aktuelle Filterauswahl.'
    : filter === 'pending' ? 'Keine offenen Konten — alles zugeordnet. 🎉'
    : filter === 'no_player' ? 'Keine Konten „ohne Zuordnung".'
    : 'Noch keine Benutzer registriert.';

  const load = useCallback(async () => {
    if (!supabase) { setStatus('error'); setErrorMsg('Supabase ist nicht konfiguriert.'); return; }
    setStatus('loading');
    const [{ data, error }, nominated, dbPlayers, dbTeams, capTeams] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      listApprovedNominatedPlayers().catch(() => []),
      listDbPlayerOptions().catch(() => []),
      listDbTeamOptions().catch(() => []),
      (async () => {
        const rs = await getRegistrationSeason().catch(() => null);
        return rs ? listSeasonTeams(rs.id).catch(() => []) : [];
      })(),
    ]);
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }
    // Zusätzlich zuordenbar: freigegebene Nachmeldungs-Spieler UND alle in der DB
    // angelegten Spieler (Team-Freigabe/Registrierung), die nicht im statischen
    // Stamm stehen. Deduplizieren nach id, statische Ids überspringen (die stecken
    // schon in PLAYER_OPTIONS). Namen OHNE Passnummer — die Nummer hängt für ALLE
    // einheitlich combinedPlayerOptions() aus der DB an (aktuelle „MDU 27"-Nummer).
    const staticIds = new Set(PLAYER_OPTIONS.map(o => o.id));
    const extra = new Map<string, { id: string; name: string }>();
    for (const n of nominated ?? []) extra.set(n.id, { id: n.id, name: n.name });
    for (const p of dbPlayers ?? []) {
      if (staticIds.has(p.id) || extra.has(p.id)) continue;
      extra.set(p.id, { id: p.id, name: p.name });
    }
    NOMINATED_OPTIONS = [...extra.values()];
    // Aktuelle Passnummern aus der DB (für ALLE Spieler, auch statische) — damit
    // im Dropdown überall die gültige Nummer steht, nicht die veraltete statische.
    LICENSE_BY_ID = new Map((dbPlayers ?? []).filter(p => p.license).map(p => [p.id, p.license as string]));
    // Bei Anmeldung neu angelegte Teams zusätzlich auswählbar machen.
    DB_TEAM_OPTIONS = dbTeams ?? [];
    // Kapitäns-Kontaktdaten der offenen Anmelde-Saison je Konto-Id abbilden.
    const cmap = new Map<string, { phone: string | null; email: string | null; team: string }>();
    for (const t of capTeams ?? []) {
      if (t.captain_user_id && (t.contact_phone || t.contact_email)) {
        cmap.set(t.captain_user_id, { phone: t.contact_phone, email: t.contact_email, team: t.teams?.name ?? t.team_id });
      }
    }
    setCaptainContact(cmap);
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
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', marginBottom: 12 }}>
            {profiles.length} Benutzer{shown.length !== profiles.length ? ` · ${shown.length} angezeigt` : ''} · Quelle: Supabase <code style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>public.profiles</code>
            {!canEdit && ' · Nur-Lese-Ansicht (Bearbeiten nur Super Admin)'}
          </div>

          {/* Suche über alle Spalten (Name, E-Mail, Rolle, Spieler, Team, Passnr.) */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Suche: Name, E-Mail, Rolle, Spieler, Team, Passnummer …"
              style={{ width: '100%', padding: '10px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }}
            />
          </div>

          {/* Spalten-Filter: Rolle + Team (feste Werte) */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {(() => {
              const selStyle = { flex: '1 1 200px', minWidth: 150, padding: '9px 10px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none' } as const;
              return (
                <>
                  <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as '' | UserRole)} style={selStyle} aria-label="Nach Rolle filtern">
                    <option value="">Rolle: alle</option>
                    {roleFilterOptions.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                  <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} style={selStyle} aria-label="Nach Team filtern">
                    <option value="">Team: alle</option>
                    {teamFilterOptions.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </>
              );
            })()}
          </div>

          {/* Filter: alle / zuzuweisen (offen) / bewusst ohne Zuordnung */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {([['all', `Alle (${profiles.length})`], ['pending', `Zuzuweisen (${pendingCount})`], ['no_player', `Ohne Zuordnung (${noPlayerCount})`]] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                style={{
                  padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
                  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5,
                  background: filter === key ? 'var(--th-accent)' : 'transparent',
                  color: filter === key ? '#fff' : 'var(--th-text-muted)',
                  border: `1.5px solid ${filter === key ? 'var(--th-accent)' : 'var(--th-line-10)'}`,
                }}
              >{label}</button>
            ))}
          </div>
          {filter === 'pending' && (
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', margin: '0 0 14px' }}>
              Noch ungeprüfte Konten — diese lösen den „offene Aufgaben"-Hinweis aus. Verknüpfe einen Spieler oder markiere das Konto beim Bearbeiten als „bewusst ohne Zuordnung".
            </p>
          )}
          {filter === 'no_player' && (
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', margin: '0 0 14px' }}>
              Konten, die du bewusst ohne Spieler-/Team-Profil abgelegt hast — kein offener Fall mehr, keine Benachrichtigung.
            </p>
          )}

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
              {shown.map((p, i) => (
                <div key={p.id} style={{
                  display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 1.1fr 1.1fr 1fr 150px',
                  padding: '12px 18px', gap: 12, alignItems: 'center',
                  borderBottom: i < shown.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                  fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</span>
                    <IntentBadge profile={p} />
                  </span>
                  <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ color: 'var(--th-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</span>
                    {captainContact.get(p.id)?.phone && (
                      <a href={`tel:${captainContact.get(p.id)!.phone!.replace(/\s+/g, '')}`} style={{ color: 'var(--th-accent)', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>📞 {captainContact.get(p.id)!.phone}</a>
                    )}
                  </span>
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
              {shown.length === 0 && <div style={{ padding: '24px 18px', ...muted }}>{emptyMsg}</div>}
            </div>
          </div>

          {/* ── Mobile-Karten ────────────────────────────────── */}
          <div className="mdu-mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shown.map(p => (
              <div key={p.id} style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</span>
                  <IntentBadge profile={p} />
                  <RoleBadge role={p.role} />
                </div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                {captainContact.get(p.id)?.phone && (
                  <div style={{ marginBottom: 8 }}>
                    <a href={`tel:${captainContact.get(p.id)!.phone!.replace(/\s+/g, '')}`} style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none' }}>📞 {captainContact.get(p.id)!.phone}</a>
                  </div>
                )}
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
            {shown.length === 0 && <p style={muted}>{emptyMsg}</p>}
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
  // „Bewusst ohne Spieler-/Team-Zuordnung" — nimmt das Konto aus „Zuzuweisen"
  // und dem „offene Aufgaben"-Badge, ohne einen Spieler zu erfinden.
  const [noAssignment, setNoAssignment] = useState(profile.match_status === 'rejected');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Registrierungs-Kommentar (Team/Lokal/Liga) liegt in den Auth-Metadaten →
  // per Admin-API (service_role) nachladen, sobald der Dialog geöffnet ist.
  const [regComment, setRegComment] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/admin/users/${profile.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      if (!res || !res.ok || cancelled) return;
      const json = await res.json().catch(() => ({} as { registrationComment?: string | null }));
      if (!cancelled) setRegComment(json.registrationComment ?? null);
    })();
    return () => { cancelled = true; };
  }, [profile.id]);

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
    // match_status:
    //   • Spieler verknüpft → 'confirmed' (Vorschlag übernommen) / 'manual'
    //   • bewusst ohne Zuordnung (kein Spieler) → 'rejected' (= geprüft, keine Verknüpfung)
    //   • über Rolle freigeschaltet → 'confirmed'
    //   • sonst unverändert (bleibt ggf. 'pending')
    const matchStatus = playerId
      ? (playerId === (profile.matched_player_id ?? '') ? 'confirmed' : 'manual')
      : (noAssignment ? 'rejected' : (role !== 'player' ? 'confirmed' : (profile.match_status ?? 'pending')));
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
    // Serverseitig über die Admin-API speichern (Rechteprüfung + service_role),
    // statt direkt aus dem Client in die DB zu schreiben (REV-016).
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { setBusy(false); setErr('Keine aktive Sitzung.'); return; }
    const res = await fetch(`/api/admin/users/${profile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    const json = await res.json().catch(() => ({} as { profile?: ProfileRow; error?: string }));
    if (!res.ok || !json.profile) {
      setBusy(false);
      setErr(json.error ?? 'Speichern fehlgeschlagen.');
      return;
    }
    const data = json.profile as ProfileRow;

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
          {(profile.registration_intent || profile.matched_player_id || regComment) && (
            <div style={{ background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', borderRadius: 10, padding: '12px 14px', fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-body)', lineHeight: 1.6 }}>
              {profile.registration_intent && (
                <div>Wunsch: <strong style={{ color: 'var(--th-text-strong)' }}>{profile.registration_intent === 'team_captain' ? 'Teamkapitän / TC' : 'Spieler'}</strong></div>
              )}
              {regComment && (
                <div style={{ marginTop: 4 }}>
                  Angaben des Nutzers (Team/Lokal/Liga):{' '}
                  <strong style={{ color: 'var(--th-text-strong)', fontWeight: 700 }}>{regComment}</strong>
                </div>
              )}
              {profile.matched_player_id ? (
                <>
                  <div>Erkannt: <strong style={{ color: 'var(--th-text-strong)' }}>{playerName(profile.matched_player_id)}</strong>
                    {profile.matched_team_id ? ` · ${teamName(profile.matched_team_id)}` : ''}
                    {profile.match_confidence ? ` (${profile.match_confidence})` : ''}</div>
                  {/* Bei TC-Wunsch: war der erkannte Spieler bisher schon Kapitän? (Gegencheck) */}
                  {profile.registration_intent === 'team_captain' && (() => {
                    const { was, captainName } = captainCheck(profile.matched_player_id, profile.matched_team_id);
                    return (
                      <div style={{ marginTop: 4 }}>
                        War bisher TC:{' '}
                        <strong style={{ color: was ? '#16A34A' : '#E24B4A', fontWeight: 700 }}>
                          {profile.matched_team_id ? (was ? 'Ja' : 'Nein') : 'unbekannt (kein Team erkannt)'}
                        </strong>
                        {profile.matched_team_id && !was && captainName && (
                          <span style={{ color: 'var(--th-text-muted)' }}> · bisheriger TC: {captainName}</span>
                        )}
                      </div>
                    );
                  })()}
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
              {combinedTeamOptions().map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>

          {!playerId && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', padding: '2px 0' }}>
              <input type="checkbox" checked={noAssignment} onChange={e => setNoAssignment(e.target.checked)}
                style={{ marginTop: 2, width: 15, height: 15, accentColor: 'var(--th-accent)', flexShrink: 0, cursor: 'pointer' }} />
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.45 }}>
                <strong style={{ color: 'var(--th-text-body)' }}>Bewusst ohne Spieler-/Team-Zuordnung.</strong>{' '}
                Kein passender Spieler vorhanden — nimmt das Konto aus „Zuzuweisen" und aus dem „offene Aufgaben"-Hinweis. Sobald du später einen Spieler verknüpfst, hebt sich das automatisch auf.
              </span>
            </label>
          )}

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
