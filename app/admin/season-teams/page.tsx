'use client';

// ============================================================
// Admin: Saison-Teams — freigegebene Mannschaften je Saison
// ============================================================
//
// Zeigt die per Freigabe erzeugten season_team_assignments + Kader aus
// Supabase. Read-only-Übersicht; Standard-Saison ist die Anmelde-Saison.
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveRegistrations } from '@/lib/auth/roles';
import { listSeasons, getRegistrationSeason, SEASON_STATUS_LABELS, type DbSeason } from '@/lib/supabase/seasons';
import { listSeasonTeams, listSeasonRoster, setActiveSeason, finalizeNewRosterPlayers, setRosterPlayerName, addRosterPlayer, deleteRosterPlayer, setSeasonTeamVenue, listPaidTeams, setTeamPaid, teamFeeEuro, PLAYER_FEE_EUR, type SeasonTeamRow, type SeasonRosterRow } from '@/lib/supabase/season-teams';
import { normalizePersonName, getRegistrationMatchSuggestion } from '@/lib/auth/player-match';
import { playerLeagueHint, isNewPlayer } from '@/lib/data/roster-hints';
import { PhoneActions } from '@/components/mdu/phone-actions';
import { canManageUsers } from '@/lib/auth/roles';
import {
  MAIN_LEAGUE_LABELS, mainLeagueForSubCode, getPredeterminedLeagueForTeam,
  type MainLeague,
} from '@/lib/data';

const LEAGUE_ORDER: MainLeague[] = ['la_liga', 'a_liga', 'b_liga', 'c_liga'];

/**
 * Effektive Spieler-Id einer Kaderzeile: das verknüpfte player_id, sonst ein
 * eindeutiger Namenstreffer im Vorsaison-Bestand. So greift der „…, Liga (war
 * davor bei X)"-Hinweis auch bei noch nicht verknüpften „Prüfung"-Zeilen, und
 * die Freigabe-Zusammenfassung kann bekannte von wirklich neuen unterscheiden.
 */
function effectiveRosterPlayerId(p: { player_id: string | null; first_name: string | null; last_name: string | null }): string | null {
  if (p.player_id) return p.player_id;
  const s = getRegistrationMatchSuggestion(p.first_name ?? '', p.last_name ?? '');
  return (s.confidence === 'exact' || s.confidence === 'likely') ? s.matchedPlayerId : null;
}

/** Code (Hauptliga oder Staffel wie b1/b2) → Hauptliga. */
function toMainLeague(code: string | null | undefined): MainLeague | null {
  if (!code) return null;
  if (code === 'la_liga' || code === 'a_liga' || code === 'b_liga' || code === 'c_liga') return code;
  return mainLeagueForSubCode(code) ?? null;
}

/** Beste verfügbare Liga-Zuordnung eines Saison-Teams für die Gruppierung. */
function teamMainLeague(t: SeasonTeamRow): MainLeague | null {
  return toMainLeague(t.assigned_competition_id)
    ?? toMainLeague(t.requested_league)
    ?? getPredeterminedLeagueForTeam(t.team_id)?.league
    ?? null;
}

export default function AdminSeasonTeamsPage() {
  const { user } = useAuth();
  const canView = canApproveRegistrations(user);

  const [seasons, setSeasons] = useState<DbSeason[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [teams, setTeams] = useState<SeasonTeamRow[] | null>(null);
  const [roster, setRoster] = useState<SeasonRosterRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  // Startgeld: Team-Ids mit „bezahlt" + laufende Umschaltung.
  const [paidTeams, setPaidTeams] = useState<Set<string>>(new Set());
  const [savingPay, setSavingPay] = useState<string | null>(null);

  // Saisons laden + Standard = Anmelde-Saison (sonst erste).
  useEffect(() => {
    if (!canView) return;
    (async () => {
      const all = await listSeasons();
      setSeasons(all);
      const reg = await getRegistrationSeason();
      queueMicrotask(() => setSeasonId(reg?.id ?? all[0]?.id ?? ''));
    })();
  }, [canView]);

  // Teams + Kader der gewählten Saison laden.
  useEffect(() => {
    if (!canView || !seasonId) return;
    let cancelled = false;
    (async () => {
      setTeams(null);
      const [t, r, paid] = await Promise.all([listSeasonTeams(seasonId), listSeasonRoster(seasonId), listPaidTeams(seasonId)]);
      if (cancelled) return;
      setTeams(t);
      setRoster(r);
      setPaidTeams(paid);
    })();
    return () => { cancelled = true; };
  }, [canView, seasonId]);

  const rosterFor = (teamId: string) => roster.filter(p => p.team_id === teamId);

  // Startgeld eines Teams umschalten (bezahlt / offen) — nur Admin per RLS.
  async function onTogglePaid(teamId: string, paid: boolean) {
    setSavingPay(teamId);
    const { error } = await setTeamPaid(seasonId, teamId, paid);
    setSavingPay(null);
    if (error) return;
    setPaidTeams(prev => { const n = new Set(prev); if (paid) n.add(teamId); else n.delete(teamId); return n; });
  }
  const season = seasons.find(s => s.id === seasonId) ?? null;
  const activeSeason = seasons.find(s => s.status === 'active') ?? null;
  const canSwitch = canManageUsers(user); // Saison aktivieren: nur Super Admin

  const [switching, setSwitching] = useState(false);
  const [switchMsg, setSwitchMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Neue Spieler eines Teams freigeben (Profil + Passnummer erzeugen).
  const [finalizing, setFinalizing] = useState<string | null>(null);
  const [finalizeMsg, setFinalizeMsg] = useState<{ teamId: string; kind: 'ok' | 'err'; text: string } | null>(null);

  // Namenlose Kaderzeilen (Altbestand) direkt hier nachtragen / Namen korrigieren.
  const [nameEdit, setNameEdit] = useState<Record<string, string>>({});
  const [savingName, setSavingName] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);

  // Einen „Vor- und Nachname"-String in Vor-/Nachname aufteilen (letztes Wort = Nachname).
  function splitFullName(val: string): { first: string; last: string } {
    const parts = val.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
    return {
      first: parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] ?? '',
      last: parts.length > 1 ? parts[parts.length - 1] : '',
    };
  }

  async function onSaveName(rowId: string, playerId?: string | null) {
    const { first, last } = splitFullName(nameEdit[rowId] ?? '');
    if (!first && !last) return;
    setSavingName(rowId);
    const { error } = await setRosterPlayerName(rowId, first, last, playerId ?? null);
    setSavingName(null);
    if (!error) {
      setRoster(await listSeasonRoster(seasonId));
      setNameEdit(m => { const n = { ...m }; delete n[rowId]; return n; });
      setEditingRow(null);
    }
  }

  // Neuen Spieler zum Kader hinzufügen (nachgemeldete Spieler).
  const [addName, setAddName] = useState<Record<string, string>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);

  // Spielstätte eines Teams ändern.
  const [venueEditTeam, setVenueEditTeam] = useState<string | null>(null);
  const [venueName, setVenueName] = useState('');
  const [venueAddr, setVenueAddr] = useState('');
  const [savingVenue, setSavingVenue] = useState(false);
  async function onSaveVenue(teamId: string) {
    if (!venueName.trim()) return;
    setSavingVenue(true);
    const { error } = await setSeasonTeamVenue(seasonId, teamId, venueName, venueAddr);
    setSavingVenue(false);
    if (error) { setFinalizeMsg({ teamId, kind: 'err', text: error }); return; }
    setTeams(await listSeasonTeams(seasonId));
    setVenueEditTeam(null);
  }

  const [deletingRow, setDeletingRow] = useState<string | null>(null);
  async function onDeletePlayer(teamId: string, row: SeasonRosterRow) {
    const name = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'diesen Spieler';
    if (!confirm(`„${name}"${row.license_number ? ` (${row.license_number})` : ''} aus dem Kader entfernen?\n\nDie Kaderzuordnung wird gelöscht. Ein neu angelegtes Spielerprofil ohne weitere Verknüpfung wird ebenfalls entfernt.`)) return;
    setDeletingRow(row.id);
    const { error, warning } = await deleteRosterPlayer(seasonId, teamId, row.id, row.player_id);
    setDeletingRow(null);
    if (error) { setFinalizeMsg({ teamId, kind: 'err', text: error }); return; }
    setRoster(await listSeasonRoster(seasonId));
    if (warning) setFinalizeMsg({ teamId, kind: 'ok', text: warning });
  }

  async function onAddPlayer(teamId: string) {
    const { first, last } = splitFullName(addName[teamId] ?? '');
    if (!first && !last) return;
    setAddingTo(teamId);
    const { error } = await addRosterPlayer(seasonId, teamId, first, last);
    setAddingTo(null);
    if (!error) {
      setRoster(await listSeasonRoster(seasonId));
      setAddName(m => ({ ...m, [teamId]: '' }));
    }
  }

  async function onFinalize(teamId: string, teamName: string) {
    const pending = rosterFor(teamId).filter(p => p.status === 'pending_review');
    if (pending.length === 0) return;
    if (!confirm(
      `Für „${teamName}" ${pending.length} neue${pending.length === 1 ? 'n' : ''} Spieler freigeben und ` +
      `${pending.length === 1 ? 'eine Passnummer' : 'Passnummern'} vergeben?\n\n` +
      `Es werden echte Spielerprofile mit Passnummer angelegt. Das lässt sich nicht einfach rückgängig machen.`,
    )) return;
    setFinalizing(teamId); setFinalizeMsg(null);
    const { finalized, created, linked, ambiguous, nameless, error } = await finalizeNewRosterPlayers(seasonId, teamId);
    if (error) {
      setFinalizing(null);
      setFinalizeMsg({ teamId, kind: 'err', text: `Fehler nach ${finalized} Spieler(n): ${error}` });
      return;
    }
    setRoster(await listSeasonRoster(seasonId));
    setFinalizing(null);
    // Ehrliche Rückmeldung: neu angelegt vs. mit bestehendem Profil verknüpft
    // (Teamwechsler) vs. mehrdeutige Namen, die manuell zugeordnet werden müssen.
    const parts: string[] = [];
    if (created) parts.push(`${created} neu angelegt (mit Passnummer)`);
    if (linked) parts.push(`${linked} mit bestehendem Profil verknüpft`);
    let text = parts.length ? parts.join(' · ') : `${finalized} Spieler freigegeben.`;
    if (ambiguous?.length) text += ` · ⚠ ${ambiguous.length} mehrdeutig (bitte manuell zuordnen): ${ambiguous.join(', ')}`;
    if (nameless) text += ` · ${nameless} Zeile(n) ohne Namen übersprungen (bitte Namen ergänzen)`;
    setFinalizeMsg({ teamId, kind: (ambiguous?.length || nameless) ? 'err' : 'ok', text });
  }

  async function onActivate() {
    if (!season) return;
    if (!confirm(
      `„${season.name}" als AKTIVE Saison schalten?\n\n` +
      `Die bisher aktive Saison (${activeSeason?.name ?? '—'}) wird archiviert (bleibt vollständig erhalten). ` +
      `Die öffentliche Seite zeigt danach die neue Saison.`,
    )) return;
    setSwitching(true); setSwitchMsg(null);
    const { error } = await setActiveSeason(season.id);
    if (error) { setSwitching(false); setSwitchMsg({ kind: 'err', text: error }); return; }
    setSeasons(await listSeasons());
    setSwitching(false);
    setSwitchMsg({ kind: 'ok', text: `„${season.name}" ist jetzt die aktive Saison.` });
  }

  // Aufklappbare Team-Karte (in beiden Gruppen-Rendern identisch).
  const renderTeam = (t: SeasonTeamRow) => {
    const r = rosterFor(t.team_id);
    const isOpen = open === t.id;
    const captain = r.find(p => p.is_captain);
    const paid = paidTeams.has(t.team_id);
    const memberCount = r.length;
    const fee = teamFeeEuro(memberCount);
    return (
      <div key={t.id} style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setOpen(isOpen ? null : t.id)}
          style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '14px 18px', cursor: 'pointer', background: 'transparent', border: 'none' }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' }}>
              {t.teams?.name ?? t.team_id}
            </div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>
              {r.length} Spieler{captain ? ` · Kapitän: ${captain.first_name} ${captain.last_name}` : ''}{t.venues?.name ? ` · ${t.venues.name}` : ''}
            </div>
          </div>
          <span title={`Startgeld: ${memberCount} × ${PLAYER_FEE_EUR} € = ${fee} €`} style={{
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10.5, letterSpacing: '0.04em', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: 20, flexShrink: 0,
            background: paid ? 'rgba(34,197,94,0.12)' : 'rgba(212,0,0,0.10)',
            color: paid ? 'var(--th-win)' : '#c0392b',
          }}>{paid ? 'bezahlt' : 'offen'}</span>
          <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-win)' }}>
            {t.status}
          </span>
          <span style={{ color: 'var(--th-text-faint)', fontSize: 18, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>⌄</span>
        </button>

        {isOpen && (
          <div style={{ padding: '4px 18px 16px', borderTop: '1px solid var(--th-line-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 8, padding: '12px 0', fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
              <span style={{ color: 'var(--th-text-muted)' }}>Kurzname</span>
              <span style={{ color: t.teams?.short_name ? 'var(--th-text-strong)' : 'var(--th-text-faint2)', letterSpacing: t.teams?.short_name ? '0.08em' : undefined }}>{t.teams?.short_name ?? '–'}</span>
              <span style={{ color: 'var(--th-text-muted)' }}>Spielstätte</span>
              {venueEditTeam === t.team_id ? (
                <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="Name (z. B. Ambasador)"
                    style={{ padding: '6px 9px', borderRadius: 7, background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none' }} />
                  <input value={venueAddr} onChange={e => setVenueAddr(e.target.value)} placeholder="Adresse (z. B. Bodenseestr. 19, 81241 München)"
                    style={{ padding: '6px 9px', borderRadius: 7, background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none' }} />
                  <span style={{ display: 'flex', gap: 6 }}>
                    <button type="button" onClick={() => onSaveVenue(t.team_id)} disabled={savingVenue || !venueName.trim()}
                      style={{ padding: '6px 12px', borderRadius: 7, cursor: savingVenue ? 'wait' : 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12 }}>
                      {savingVenue ? 'Speichere …' : 'Speichern'}
                    </button>
                    <button type="button" onClick={() => setVenueEditTeam(null)}
                      style={{ padding: '6px 10px', borderRadius: 7, cursor: 'pointer', background: 'transparent', color: 'var(--th-text-muted)', border: '1px solid var(--th-line-10)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12 }}>Abbrechen</button>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--th-text-faint)' }}>Ändert die Spielstätte nur für dieses Team.</span>
                </span>
              ) : (
                <span style={{ color: 'var(--th-text-strong)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>{t.venues?.name ?? '–'}{t.venues?.address ? ` · ${t.venues.address}` : ''}</span>
                  <button type="button" title="Spielstätte ändern"
                    onClick={() => { setVenueEditTeam(t.team_id); setVenueName(t.venues?.name ?? ''); setVenueAddr(t.venues?.address ?? ''); }}
                    style={{ padding: '3px 8px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'var(--th-text-faint)', border: '1px solid var(--th-line-10)', fontSize: 12 }}>✎</button>
                </span>
              )}
              <span style={{ color: 'var(--th-text-muted)' }}>Team-ID</span>
              <span style={{ color: 'var(--th-text-strong)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12 }}>{t.team_id}</span>
              <span style={{ color: 'var(--th-text-muted)' }}>Liga/Wettbewerb</span>
              <span style={{ color: t.assigned_competition_id ? 'var(--th-text-strong)' : 'var(--th-text-faint2)' }}>{t.assigned_competition_id ?? 'noch nicht zugewiesen'}</span>
              <span style={{ color: 'var(--th-text-muted)' }}>Kapitän/Kontakt</span>
              <span style={{ color: 'var(--th-text-strong)', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {t.contact_name ? <span>{t.contact_name}</span> : <span style={{ color: 'var(--th-text-faint2)' }}>–</span>}
                {t.contact_phone && <PhoneActions phone={t.contact_phone} />}
                {t.contact_email && <a href={`mailto:${t.contact_email}`} style={{ color: 'var(--th-accent)', textDecoration: 'none' }}>✉ {t.contact_email}</a>}
                {!t.contact_phone && <span style={{ color: 'var(--th-text-faint2)', fontSize: 12 }}>(keine Telefonnummer angegeben)</span>}
              </span>
              <span style={{ color: 'var(--th-text-muted)' }}>Startgeld</span>
              <span style={{ color: 'var(--th-text-strong)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <span>{memberCount} × {PLAYER_FEE_EUR} € = <strong>{fee} €</strong></span>
                <button
                  type="button"
                  onClick={() => onTogglePaid(t.team_id, !paid)}
                  disabled={savingPay === t.team_id}
                  style={{
                    padding: '5px 12px', borderRadius: 20, cursor: savingPay === t.team_id ? 'wait' : 'pointer',
                    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, border: '1px solid',
                    background: paid ? 'rgba(34,197,94,0.12)' : 'transparent',
                    color: paid ? 'var(--th-win)' : '#c0392b',
                    borderColor: paid ? 'rgba(34,197,94,0.5)' : 'rgba(212,0,0,0.4)',
                  }}
                >
                  {savingPay === t.team_id ? '…' : paid ? '✓ Bezahlt (auf „offen" setzen)' : 'Als bezahlt markieren'}
                </button>
              </span>
            </div>

            <Link href={`/mein-team/bearbeiten?team=${t.team_id}`}
              style={{ display: 'inline-block', marginBottom: 10, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-accent)', textDecoration: 'none' }}>
              Team-Profil bearbeiten (Logo, Beschreibung, Social) →
            </Link>

            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--th-text-faint)', margin: '6px 0 8px' }}>
              Kader ({r.length})
            </div>
            {r.length === 0 ? (
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)' }}>Kein Kader übernommen.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(() => {
                  // Dubletten im Kader erkennen: gleiche Passnummer oder gleicher Name.
                  const numCount = new Map<string, number>();
                  const nameCount = new Map<string, number>();
                  for (const q of r) {
                    const lic = (q.license_number ?? '').trim();
                    if (lic) numCount.set(lic, (numCount.get(lic) ?? 0) + 1);
                    const nm = normalizePersonName(`${q.first_name ?? ''} ${q.last_name ?? ''}`);
                    if (nm) nameCount.set(nm, (nameCount.get(nm) ?? 0) + 1);
                  }
                  return r.map(p => {
                  const hasName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
                  const editing = !hasName || editingRow === p.id;
                  const dupNum = !!p.license_number && (numCount.get(p.license_number.trim()) ?? 0) > 1;
                  const dupName = !!hasName && (nameCount.get(normalizePersonName(`${p.first_name ?? ''} ${p.last_name ?? ''}`)) ?? 0) > 1;
                  return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
                    {!editing ? (
                      <>
                        <span style={{ flex: 1 }}>
                          {p.first_name} {p.last_name}{p.license_number ? ` · ${p.license_number}` : ''}
                          {p.status === 'pending_review' ? (() => {
                            // Auch „in Prüfung" den gewohnten Hinweis zeigen: bekannte Rückkehrer
                            // werden bei der Freigabe wiederverwendet, nicht neu angelegt.
                            const effId = effectiveRosterPlayerId(p);
                            const hint = playerLeagueHint(effId, t.team_id);
                            if (effId) return <span style={{ color: 'var(--th-text-muted)' }}>{hint || ' · bereits bekannt'} · in Prüfung</span>;
                            return <span style={{ color: 'var(--th-text-muted)' }}> · neu (Prüfung)</span>;
                          })() : (() => {
                            const hint = playerLeagueHint(p.player_id, t.team_id);
                            if (hint) return <span style={{ color: 'var(--th-text-muted)' }}>{hint}</span>;
                            return isNewPlayer(p.player_id)
                              ? <span style={{ color: 'var(--th-text-muted)' }}> · neu</span>
                              : null;
                          })()}
                          {(dupNum || dupName) && (
                            <span title={dupNum ? 'Passnummer doppelt vergeben' : 'Name doppelt im Kader'} style={{ marginLeft: 8, fontSize: 9, fontWeight: 800, color: '#E24B4A', textTransform: 'uppercase', border: '1px solid rgba(212,0,0,0.4)', borderRadius: 4, padding: '1px 5px' }}>
                              ⚠ {dupNum ? 'Nummer doppelt' : 'Name doppelt'}
                            </span>
                          )}
                        </span>
                        {p.is_captain && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--th-gold)', textTransform: 'uppercase' }}>Kapitän</span>}
                        <button
                          type="button"
                          title="Namen bearbeiten"
                          onClick={() => { setNameEdit(m => ({ ...m, [p.id]: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() })); setEditingRow(p.id); }}
                          style={{ padding: '3px 8px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'var(--th-text-faint)', border: '1px solid var(--th-line-10)', fontSize: 12 }}
                        >✎</button>
                        <button
                          type="button"
                          title="Aus dem Kader entfernen"
                          onClick={() => onDeletePlayer(t.team_id, p)}
                          disabled={deletingRow === p.id}
                          style={{ padding: '3px 8px', borderRadius: 6, cursor: deletingRow === p.id ? 'wait' : 'pointer', background: 'transparent', color: '#E24B4A', border: '1px solid rgba(212,0,0,0.35)', fontSize: 12 }}
                        >🗑</button>
                      </>
                    ) : (
                      <span style={{ flex: 1, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {!hasName && <span style={{ color: '#E24B4A', fontWeight: 700 }}>⚠ ohne Namen:</span>}
                        <input
                          value={nameEdit[p.id] ?? ''}
                          onChange={e => setNameEdit(m => ({ ...m, [p.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') onSaveName(p.id, p.player_id); }}
                          placeholder="Vor- und Nachname"
                          autoFocus
                          style={{ flex: 1, minWidth: 140, padding: '5px 9px', borderRadius: 7, background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => onSaveName(p.id, p.player_id)}
                          disabled={savingName === p.id || !(nameEdit[p.id] ?? '').trim()}
                          style={{ padding: '6px 12px', borderRadius: 7, cursor: savingName === p.id ? 'wait' : 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, opacity: (nameEdit[p.id] ?? '').trim() ? 1 : 0.6 }}
                        >
                          {savingName === p.id ? 'Speichere …' : 'Speichern'}
                        </button>
                        {hasName && (
                          <button
                            type="button"
                            onClick={() => { setEditingRow(null); setNameEdit(m => { const n = { ...m }; delete n[p.id]; return n; }); }}
                            style={{ padding: '6px 10px', borderRadius: 7, cursor: 'pointer', background: 'transparent', color: 'var(--th-text-muted)', border: '1px solid var(--th-line-10)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12 }}
                          >Abbrechen</button>
                        )}
                        {!hasName && <span style={{ color: 'var(--th-text-faint)' }}>· neu (Prüfung)</span>}
                      </span>
                    )}
                  </div>
                  );
                  });
                })()}
              </div>
            )}

            {/* Spieler nachtragen (nachgemeldete Spieler zum Kader hinzufügen) */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
              <input
                value={addName[t.team_id] ?? ''}
                onChange={e => setAddName(m => ({ ...m, [t.team_id]: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') onAddPlayer(t.team_id); }}
                placeholder="Spieler nachtragen: Vor- und Nachname"
                style={{ flex: 1, minWidth: 180, padding: '6px 10px', borderRadius: 7, background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none' }}
              />
              <button
                type="button"
                onClick={() => onAddPlayer(t.team_id)}
                disabled={addingTo === t.team_id || !(addName[t.team_id] ?? '').trim()}
                style={{ padding: '7px 12px', borderRadius: 7, cursor: addingTo === t.team_id ? 'wait' : 'pointer', background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, opacity: (addName[t.team_id] ?? '').trim() ? 1 : 0.6 }}
              >
                {addingTo === t.team_id ? 'Füge hinzu …' : '+ Hinzufügen'}
              </button>
            </div>

            {/* Neue Spieler freigeben + Passnummern vergeben */}
            {(() => {
              const pendingRows = r.filter(p => p.status === 'pending_review');
              const pending = pendingRows.length;
              if (pending === 0) return null;
              // Bekannte Rückkehrer werden bei der Freigabe wiederverwendet (Nummer/Historie
              // bleiben), nur wirklich neue bekommen ein frisches Profil + Passnummer.
              const known = pendingRows.filter(p => effectiveRosterPlayerId(p) != null).length;
              const fresh = pending - known;
              return (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--th-line-4)' }}>
                  <button
                    type="button"
                    onClick={() => onFinalize(t.team_id, t.teams?.name ?? t.team_id)}
                    disabled={finalizing === t.team_id}
                    style={{ padding: '9px 14px', borderRadius: 8, cursor: finalizing === t.team_id ? 'wait' : 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5 }}
                  >
                    {finalizing === t.team_id ? 'Vergebe Passnummern …' : `${pending} Spieler freigeben & Passnummer${pending === 1 ? '' : 'n'} vergeben`}
                  </button>
                  <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', margin: '8px 0 0', lineHeight: 1.5 }}>
                    {known > 0
                      ? `Davon sind mind. ${known} bereits bekannt – diese werden mit ihrem vorhandenen Profil verknüpft (Passnummer & Historie bleiben, keine neue Nummer). Für die ${fresh > 0 ? `${fresh} wirklich neuen` : 'neuen'} Spieler wird ein Profil angelegt und eine Passnummer vergeben (Regel: höchste Teamkollegen-Nummer + 1, nächste freie). `
                      : 'Legt für die als „neu (Prüfung)" markierten Spieler ein Spielerprofil an und vergibt eine Passnummer (Regel: höchste Teamkollegen-Nummer + 1, nächste freie). '}
                    Danach sind sie im „Verknüpfter Spieler"-Feld auswählbar.
                  </p>
                  {finalizeMsg?.teamId === t.team_id && (
                    <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, marginTop: 8, color: finalizeMsg.kind === 'ok' ? 'var(--th-win)' : '#E24B4A' }}>
                      {finalizeMsg.text}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  // Teams nach Hauptliga gruppieren (La → A → B → C, dann „ohne Zuordnung").
  const grouped = (() => {
    if (!teams) return [] as { key: string; label: string; teams: SeasonTeamRow[] }[];
    const buckets = new Map<string, SeasonTeamRow[]>();
    for (const t of teams) {
      const key = teamMainLeague(t) ?? '_none';
      (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(t);
    }
    const out: { key: string; label: string; teams: SeasonTeamRow[] }[] = [];
    for (const lg of LEAGUE_ORDER) {
      const arr = buckets.get(lg);
      if (arr?.length) out.push({ key: lg, label: MAIN_LEAGUE_LABELS[lg], teams: arr });
    }
    const none = buckets.get('_none');
    if (none?.length) out.push({ key: '_none', label: 'Noch keine Liga zugewiesen', teams: none });
    return out;
  })();

  return (
    <AdminGuard title="Saison-Teams" subtitle="Freigegebene Mannschaften je Saison (aus den Anmeldungen übernommen).">
      {/* Saison-Auswahl */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'var(--th-text-muted)' }}>Saison:</span>
        <select value={seasonId} onChange={e => { setSeasonId(e.target.value); setOpen(null); }}
          style={{ padding: '9px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }}>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name} – {SEASON_STATUS_LABELS[s.status]}</option>)}
        </select>
        {season && (
          <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)' }}>
            {teams ? `${teams.length} Team${teams.length === 1 ? '' : 's'}` : 'lädt …'}
          </span>
        )}
      </div>

      {/* Saison verwalten — aktive Saison + Umschalten (nur Super Admin) */}
      {canSwitch && (
        <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '14px 18px', marginBottom: 18, maxWidth: 900, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
            Aktive Saison: <strong style={{ color: 'var(--th-text-strong)' }}>{activeSeason?.name ?? '—'}</strong>
            <div style={{ fontSize: 11.5, color: 'var(--th-text-faint)', marginTop: 3 }}>
              Beim Go-live die neue Saison aktivieren — die alte wird archiviert (bleibt als Historie erhalten).
            </div>
          </div>
          {season && season.id !== activeSeason?.id && (
            <button type="button" onClick={onActivate} disabled={switching} style={{
              padding: '10px 16px', borderRadius: 8, cursor: switching ? 'wait' : 'pointer',
              background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)',
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5, opacity: switching ? 0.7 : 1,
            }}>{switching ? 'Schalte …' : `„${season.name}" aktivieren`}</button>
          )}
          {season && season.id === activeSeason?.id && (
            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-win)' }}>● aktiv</span>
          )}
        </div>
      )}
      {switchMsg && (
        <div role={switchMsg.kind === 'err' ? 'alert' : 'status'} style={{
          maxWidth: 900, marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13,
          background: switchMsg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)',
          border: `1px solid ${switchMsg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`,
          color: switchMsg.kind === 'err' ? '#E24B4A' : 'var(--th-win)',
        }}>{switchMsg.text}</div>
      )}

      {teams === null ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>Lade …</p>
      ) : teams.length === 0 ? (
        <div style={{ background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-10)', borderRadius: 14, padding: '32px 24px', maxWidth: 620, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>
          Für diese Saison wurden noch keine Mannschaften freigegeben.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 900 }}>
          {grouped.map(g => (
            <div key={g.key}>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8, margin: '0 0 10px',
                paddingBottom: 6, borderBottom: '2px solid var(--th-line-10)',
              }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 16, color: 'var(--th-text-strong)' }}>
                  {g.label}
                </h3>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)' }}>
                  {g.teams.length} Team{g.teams.length === 1 ? '' : 's'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {g.teams.map(renderTeam)}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}
