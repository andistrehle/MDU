'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveRegistrations } from '@/lib/auth/roles';
import {
  getRegistration, getRegistrationPlayers, reviewRegistration, applyApprovedTeamRegistration,
  updateRegistrationSeason, updateRegistrationAssignedCompetition, deleteRegistration,
  REGISTRATION_STATUS_LABELS, type TeamRegistration, type RegistrationPlayer,
} from '@/lib/supabase/registrations';
import {
  MAIN_LEAGUE_LABELS, MAIN_LEAGUES, type MainLeague,
  getPredeterminedLeagueForTeam, isLeagueDowngrade,
} from '@/lib/data';
import { playerLeagueHint } from '@/lib/data/roster-hints';
import { triggerRegistrationEmail, EMAIL_STATUS_HINT } from '@/lib/supabase/notifications';
import {
  getActiveSeason, listSeasons, canRegisterTeamsForSeason, SEASON_STATUS_LABELS, type DbSeason,
} from '@/lib/supabase/seasons';
import type { EmailType } from '@/lib/server/email/send-email';

const EMAIL_TYPE_FOR_STATUS: Partial<Record<'approved' | 'rejected' | 'changes_requested', EmailType>> = {
  approved: 'registration_approved',
  rejected: 'registration_rejected',
  changes_requested: 'registration_changes_requested',
};

export default function RegistrationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user } = useAuth();
  const canReview = canApproveRegistrations(user);

  const [reg, setReg] = useState<TeamRegistration | null>(null);
  const [players, setPlayers] = useState<RegistrationPlayer[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [activeSeason, setActiveSeason] = useState<DbSeason | null>(null);
  const [seasons, setSeasons] = useState<DbSeason[]>([]);
  const [targetSeasonId, setTargetSeasonId] = useState<string>('');
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmActiveSeason, setConfirmActiveSeason] = useState(false);
  const [assignedCompetition, setAssignedCompetition] = useState('');

  // Aktuell gewählte Ziel-Saison (für Anzeige + Validierung).
  const targetSeason = seasons.find(s => s.id === targetSeasonId) ?? null;

  // Aus den Abschlussergebnissen vorbestimmte Liga (nur bestehende Teams).
  const predetermined = reg && !reg.is_new_team && reg.source_team_id
    ? getPredeterminedLeagueForTeam(reg.source_team_id) : null;
  const requestedDowngrade = predetermined && reg?.requested_league
    ? isLeagueDowngrade(reg.requested_league as MainLeague, predetermined.league) : false;

  useEffect(() => {
    if (!canReview || !id) return;
    (async () => {
      const r = await getRegistration(id);
      setReg(r);
      // Zugewiesene Liga vorbelegen: gespeicherte Zuweisung, sonst der Ligawunsch des Teams.
      setAssignedCompetition(r?.assigned_competition_id ?? r?.requested_league ?? '');
      setPlayers(await getRegistrationPlayers(id));
      const all = await listSeasons();
      setSeasons(all);
      setActiveSeason(await getActiveSeason());
      // Standard-Ziel: gespeicherte Saison — außer sie ist die aktive und es gibt
      // eine offene Anmelde-Saison, dann diese vorauswählen (häufigster Fall).
      if (r) {
        const stored = all.find(s => s.id === r.season_id);
        const regOpen = all.find(s => s.status === 'registration_open');
        const preferred = (stored?.status === 'active' && regOpen) ? regOpen.id : r.season_id;
        queueMicrotask(() => setTargetSeasonId(preferred));
      }
    })();
  }, [canReview, id]);

  /** E-Mail je Statuswechsel (best-effort) → liefert Hinweistext. */
  async function sendStatusEmail(fresh: TeamRegistration, status: 'in_review' | 'approved' | 'rejected' | 'changes_requested', reason: string): Promise<string> {
    const emailType = EMAIL_TYPE_FOR_STATUS[status as 'approved' | 'rejected' | 'changes_requested'];
    if (!emailType) return '';
    // Bei Freigabe: zugewiesene Liga + ggf. Abweichung vom Ligawunsch mitschicken.
    const assignedLeague = fresh.assigned_competition_id
      ? (MAIN_LEAGUE_LABELS[fresh.assigned_competition_id as MainLeague] ?? fresh.assigned_competition_id) : null;
    const requestedLeague = fresh.requested_league
      ? (MAIN_LEAGUE_LABELS[fresh.requested_league as MainLeague] ?? fresh.requested_league) : null;
    const result = await triggerRegistrationEmail({
      type: emailType, to: fresh.contact_email, name: fresh.contact_name,
      teamName: fresh.team_name, reason: reason || null, registrationId: id,
      assignedLeague, requestedLeague,
    });
    return EMAIL_STATUS_HINT[result.status];
  }

  /** In Prüfung / Nachbesserung / Ablehnen (kein automatischer Übernahme-Workflow). */
  async function act(status: 'in_review' | 'rejected' | 'changes_requested') {
    if ((status === 'rejected' || status === 'changes_requested') && !note.trim()) {
      setMsg('Bitte eine Begründung / Anmerkung eingeben.');
      return;
    }
    setBusy(true); setMsg(null); setOkMsg(null);
    const reason = note.trim();
    const { error } = await reviewRegistration(id, status, reason || undefined);
    if (error) { setMsg(error); setBusy(false); return; }
    const fresh = await getRegistration(id);
    const hint = fresh ? await sendStatusEmail(fresh, status, reason) : '';

    // Ablehnung/Nachbesserung: Fenster schließen → zur Übersicht, Meldung als Flash.
    if (status === 'rejected' || status === 'changes_requested') {
      const teamName = fresh?.team_name ?? reg?.team_name ?? 'Die Mannschaft';
      const label = status === 'rejected'
        ? `${teamName} wurde abgelehnt.`
        : `Für ${teamName} wurde eine Nachbesserung angefordert.`;
      try { sessionStorage.setItem('mdu_admin_flash', `${label} ${hint}`.trim()); } catch { /* optional */ }
      router.push('/admin/registrations');
      return;
    }

    // In Prüfung: bleibt auf der Detailseite.
    setReg(fresh);
    setOkMsg(`Status gespeichert. ${hint}`);
    setBusy(false);
    setNote('');
  }

  /** Anmeldung löschen (nur nicht-übernommene, z. B. ein doppelter Entwurf). */
  async function handleDelete() {
    if (!reg) return;
    if (!confirm(`Anmeldung „${reg.team_name}" (${REGISTRATION_STATUS_LABELS[reg.status]}) endgültig löschen?\n\nDamit verschwindet nur diese eine Anmeldung samt gemeldetem Kader – bereits freigegebene Mannschaften bleiben unberührt. Das kann nicht rückgängig gemacht werden.`)) return;
    setBusy(true); setMsg(null); setOkMsg(null);
    const { error } = await deleteRegistration(id);
    if (error) { setMsg(error); setBusy(false); return; }
    try { sessionStorage.setItem('mdu_admin_flash', `Anmeldung „${reg.team_name}" wurde gelöscht.`); } catch { /* optional */ }
    router.push('/admin/registrations');
  }

  /** Freigeben + automatische Übernahme (atomar, idempotent, saisongetrennt). */
  async function runApprove(allowActive: boolean) {
    setBusy(true); setMsg(null); setOkMsg(null);
    const reason = note.trim();

    // Ziel-Saison ggf. korrigieren, bevor die RPC sie liest.
    if (reg && targetSeasonId && targetSeasonId !== reg.season_id) {
      const up = await updateRegistrationSeason(id, targetSeasonId);
      if (up.error) { setMsg(up.error); setBusy(false); setConfirmApprove(false); return; }
      setReg({ ...reg, season_id: targetSeasonId });
    }

    // Endgültige Staffel (Entscheidung Ligaleitung) speichern, bevor die RPC sie übernimmt.
    if (reg && (assignedCompetition || null) !== (reg.assigned_competition_id ?? null)) {
      const upc = await updateRegistrationAssignedCompetition(id, assignedCompetition || null);
      if (upc.error) { setMsg(upc.error); setBusy(false); setConfirmApprove(false); return; }
      setReg({ ...reg, assigned_competition_id: assignedCompetition || null });
    }

    const r = await applyApprovedTeamRegistration(id, { reviewNote: reason || undefined, allowActiveSeason: allowActive });

    if (r.activeSeasonWarning) {
      setBusy(false); setConfirmApprove(false); setConfirmActiveSeason(true);
      return;
    }
    if (r.error) {
      setMsg(`Automatische Übernahme fehlgeschlagen. Es wurden keine vollständigen Saisondaten erzeugt. ${r.error}`);
      setReg(await getRegistration(id)); // application_error sichtbar machen
      setBusy(false); setConfirmApprove(false); setConfirmActiveSeason(false);
      return;
    }

    const fresh = await getRegistration(id);
    const hint = fresh ? await sendStatusEmail(fresh, 'approved', reason) : '';
    // Fenster schließen → zur Übersicht springen; Erfolgsmeldung dort via Flash anzeigen.
    const teamName = fresh?.team_name ?? reg?.team_name ?? 'Die Mannschaft';
    // Automatische Passnummern-Vergabe zusammenfassen (kein separater Schritt mehr).
    const f = r.finalize;
    const parts: string[] = [];
    if (f?.created) parts.push(`${f.created} neue Passnummer${f.created === 1 ? '' : 'n'}`);
    if (f?.linked) parts.push(`${f.linked} mit bestehendem Profil verknüpft`);
    let passInfo = parts.length ? ` Passnummern: ${parts.join(' · ')}.` : '';
    if (f?.ambiguous?.length) passInfo += ` ⚠ ${f.ambiguous.length} mehrdeutig – bitte unter „Saison-Teams" manuell zuordnen: ${f.ambiguous.join(', ')}.`;
    try {
      sessionStorage.setItem('mdu_admin_flash',
        `${teamName} freigegeben und für ${targetSeason?.name ?? 'die Ziel-Saison'} übernommen.${passInfo} ${hint}`.trim());
    } catch { /* sessionStorage optional */ }
    router.push('/admin/registrations');
  }

  return (
    <AdminGuard title="Anmeldung prüfen" subtitle="Details und Freigabe-Workflow.">
      <Link href="/admin/registrations" style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none' }}>← Zur Übersicht</Link>

      {!canReview ? null : !reg ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)', marginTop: 16 }}>Lade …</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760, marginTop: 16 }}>
          {msg && <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(212,0,0,0.10)', border: '1px solid rgba(212,0,0,0.35)', fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A' }}>{msg}</div>}
          {okMsg && <div role="status" style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.35)', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-win)' }}>{okMsg}</div>}

          {/* Kopf */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 24, color: 'var(--th-text-strong)', textTransform: 'uppercase' }}>{reg.team_name}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>
                  {reg.is_new_team ? 'Neue Mannschaft' : 'Bestehende Mannschaft'} · {seasons.find(s => s.id === reg.season_id)?.name ?? reg.season_id}
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-accent)' }}>
                {REGISTRATION_STATUS_LABELS[reg.status]}
              </span>
            </div>
          </Card>

          <Card title="Teamdaten">
            <Row k="Kurzname" v={reg.short_name} />
            <Row k="Beschreibung" v={reg.description} />
            <Row k="Logo-URL" v={reg.logo_url} />
            <Row k="Mannschaftsbild-URL" v={reg.team_image_url} />
          </Card>

          <Card title="Spielstätte">
            <Row k="Name" v={reg.venue_name} />
            <Row k="Adresse" v={reg.venue_address} />
            <Row k="Zusatzinfo" v={reg.venue_info} />
          </Card>

          <Card title="Kontakt">
            <Row k="Ansprechpartner" v={reg.contact_name} />
            <Row k="E-Mail" v={reg.contact_email} />
            <Row k="Telefon" v={reg.contact_phone} />
          </Card>

          <Card title="Social Media">
            <Row k="Instagram" v={reg.instagram_url} />
            <Row k="Facebook" v={reg.facebook_url} />
            <Row k="Website" v={reg.website_url} />
          </Card>

          <Card title={`Kader (${players.length})`}>
            {players.length === 0 ? <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)' }}>Kein Kader angegeben.</span> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {players.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
                    <span style={{ flex: 1 }}>
                      {p.display_name}{p.license_number ? ` · ${p.license_number}` : ''}
                      <span style={{ color: 'var(--th-text-muted)' }}>{playerLeagueHint(p.player_id, reg.source_team_id ?? null)}</span>
                      {p.is_existing_player ? '' : ' · neu'}
                    </span>
                    {p.is_captain && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--th-gold)', textTransform: 'uppercase' }}>Kapitän</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {reg.notes && <Card title="Notizen"><span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>{reg.notes}</span></Card>}

          {/* Prüf-Verlauf */}
          {(reg.submitted_at || reg.reviewed_at || reg.review_note) && (
            <Card title="Verlauf">
              <Row k="Eingereicht am" v={reg.submitted_at ? new Date(reg.submitted_at).toLocaleString('de-DE') : null} />
              <Row k="Geprüft am" v={reg.reviewed_at ? new Date(reg.reviewed_at).toLocaleString('de-DE') : null} />
              <Row k="Begründung / Anmerkung" v={reg.review_note} />
            </Card>
          )}

          {/* Saison-Kontext */}
          <Card title="Saison">
            <Row k="Aktuelle Saison" v={activeSeason ? `${activeSeason.name} – ${SEASON_STATUS_LABELS[activeSeason.status]}` : '–'} />
            {reg.applied_at ? (
              <Row k="Ziel-Saison" v={targetSeason ? `${targetSeason.name} – ${SEASON_STATUS_LABELS[targetSeason.status]}` : reg.season_id} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10, padding: '5px 0', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>Ziel-Saison</span>
                <select
                  value={targetSeasonId}
                  onChange={e => setTargetSeasonId(e.target.value)}
                  style={{ width: '100%', maxWidth: 320, padding: '9px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none' }}
                >
                  {seasons.map(s => (
                    <option key={s.id} value={s.id} disabled={s.status === 'archived' || s.status === 'completed'}>
                      {s.name} – {SEASON_STATUS_LABELS[s.status]}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Row k="Mannschaft" v={reg.is_new_team ? 'Neue Mannschaft' : 'Bestehende Mannschaft (Vorlage)'} />
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 8, lineHeight: 1.55 }}>
              Die aktuell laufende Saison bleibt unverändert. Die freigegebenen Daten werden ausschließlich
              für die gewählte Ziel-Saison übernommen.{!reg.is_new_team && ' Bestehende Mannschaftsdaten dienen nur als Vorlage; laufende/historische Saisoninformationen werden nicht überschrieben.'}
            </p>
          </Card>

          {/* Liga: Wunsch + tatsächliche Zuweisung */}
          <Card title="Liga">
            <Row k="Gewünschte Liga (Team)" v={reg.requested_league ? (MAIN_LEAGUE_LABELS[reg.requested_league as MainLeague] ?? reg.requested_league) : 'Keine Angabe'} />
            {predetermined && (
              <Row k="Vorbestimmte Liga" v={`Eigentlich eine ${predetermined.label} Mannschaft${predetermined.withdrawn ? ' (in der Vorsaison zurückgezogen)' : ''}`} />
            )}
            {requestedDowngrade && predetermined && (
              <div role="alert" style={{
                marginTop: 6, marginBottom: 2, background: 'rgba(232,184,74,0.10)', border: '1px solid rgba(232,184,74,0.4)',
                borderRadius: 8, padding: '10px 14px',
                fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-body)', lineHeight: 1.55,
              }}>
                ⚠️ Abweichung nach unten: Die Mannschaft hat sich für eine niedrigere Liga gemeldet als
                vorgesehen (eigentlich <strong>{predetermined.label}</strong>).
              </div>
            )}
            {reg.applied_at ? (
              <Row k="Zugewiesene Liga" v={reg.assigned_competition_id ? (MAIN_LEAGUE_LABELS[reg.assigned_competition_id as MainLeague] ?? reg.assigned_competition_id) : 'noch nicht zugewiesen'} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10, padding: '5px 0', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>Zugewiesene Liga</span>
                <select
                  value={assignedCompetition}
                  onChange={e => setAssignedCompetition(e.target.value)}
                  style={{ width: '100%', maxWidth: 320, padding: '9px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none' }}
                >
                  <option value="">— noch nicht zuweisen —</option>
                  {MAIN_LEAGUES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            )}
            {assignedCompetition && reg.requested_league && assignedCompetition !== reg.requested_league && (
              <div role="alert" style={{
                marginTop: 8, background: 'rgba(232,184,74,0.10)', border: '1px solid rgba(232,184,74,0.4)',
                borderRadius: 8, padding: '10px 14px',
                fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-body)', lineHeight: 1.55,
              }}>
                ⚠️ Weicht vom Ligawunsch ab: gemeldet für{' '}
                <strong>{MAIN_LEAGUE_LABELS[reg.requested_league as MainLeague] ?? reg.requested_league}</strong>, zugewiesen wird{' '}
                <strong>{MAIN_LEAGUE_LABELS[assignedCompetition as MainLeague] ?? assignedCompetition}</strong>.
                Der Anmelder wird darüber in der Freigabe-E-Mail und der Benachrichtigung ausdrücklich informiert.
              </div>
            )}
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 8, lineHeight: 1.55 }}>
              Der Ligawunsch des Teams bleibt erhalten. Die Liga-Zuweisung kann auch später noch erfolgen;
              eine Freigabe ist auch ohne Zuweisung möglich. Die endgültige Staffel (z. B. B1/B2) wird separat vergeben.
            </p>
          </Card>

          {/* Ergebnis der Übernahme */}
          {reg.applied_at && reg.result_team_id && (
            <Card title="Übernahme abgeschlossen">
              <Row k="Status" v="Freigegeben · übernommen (completed)" />
              <Row k="Erzeugtes Team" v={reg.result_team_id} />
              <Row k="Übernommen am" v={new Date(reg.applied_at).toLocaleString('de-DE')} />
              <Link href="/admin/season-teams" style={{ display: 'inline-block', marginTop: 8, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-accent)', textDecoration: 'none' }}>
                Zu den Saison-Teams →
              </Link>
            </Card>
          )}

          {/* Fehler bei der Übernahme */}
          {reg.application_status === 'failed' && reg.application_error && (
            <Card title="Übernahme fehlgeschlagen">
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A', margin: 0, lineHeight: 1.55 }}>
                Es wurden keine vollständigen Saisondaten erzeugt. Technische Meldung:<br />
                <code style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12 }}>{reg.application_error}</code>
              </p>
            </Card>
          )}

          {/* Workflow-Aktionen */}
          {!reg.applied_at && (
            <Card title="Freigabe-Workflow">
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                placeholder="Begründung / Anmerkung (Pflicht bei Ablehnung & Nachbesserung)"
                style={{ width: '100%', padding: '10px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 12 }} />

              {!confirmApprove && !confirmActiveSeason && (
                <>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => act('in_review')} disabled={busy} style={btn('ghost')}>In Prüfung</button>
                    <button onClick={() => act('changes_requested')} disabled={busy} style={btn('gold')}>Nachbesserung</button>
                    <button onClick={() => act('rejected')} disabled={busy} style={btn('red')}>Ablehnen</button>
                    <button
                      onClick={() => setConfirmApprove(true)}
                      disabled={busy || !canRegisterTeamsForSeason(targetSeason)}
                      style={{ ...btn('green'), opacity: (busy || !canRegisterTeamsForSeason(targetSeason)) ? 0.5 : 1 }}
                    >
                      Mannschaft freigeben und übernehmen
                    </button>
                  </div>
                  {!canRegisterTeamsForSeason(targetSeason) && (
                    <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#E24B4A', marginTop: 10 }}>
                      Freigabe nicht möglich: Die Ziel-Saison erlaubt derzeit keine Anmeldungen
                      {targetSeason ? ` (Status: ${SEASON_STATUS_LABELS[targetSeason.status]})` : ' (keine gültige Ziel-Saison)'}.
                    </p>
                  )}
                </>
              )}

              {/* Bestätigung Freigabe */}
              {confirmApprove && (
                <div style={{ background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', margin: '0 0 12px', lineHeight: 1.55 }}>
                    Durch die Freigabe wird die Mannschaft <strong>{reg.team_name}</strong> automatisch erstellt bzw. der
                    Ziel-Saison <strong>{targetSeason?.name ?? reg.season_id}</strong> zugeordnet und der gemeldete Kader
                    ({players.length}) übernommen. Die aktuell laufende Saison bleibt unverändert.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => runApprove(false)} disabled={busy} style={btn('green')}>{busy ? 'Übernahme läuft …' : 'Jetzt freigeben & übernehmen'}</button>
                    <button onClick={() => setConfirmApprove(false)} disabled={busy} style={btn('ghost')}>Abbrechen</button>
                  </div>
                </div>
              )}

              {/* Warnung: aktive Saison gewählt */}
              {confirmActiveSeason && (
                <div style={{ background: 'rgba(232,184,74,0.10)', border: '1px solid rgba(232,184,74,0.4)', borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', margin: '0 0 12px', lineHeight: 1.55 }}>
                    ⚠️ Die Ziel-Saison ist die <strong>aktuell laufende</strong> Saison ({targetSeason?.name}). Eine Freigabe
                    legt eine neue Saisonzuordnung in dieser Saison an. Nur fortfahren, wenn es sich ausdrücklich um eine
                    <strong> Nachmeldung für die laufende Saison</strong> handelt.
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => runApprove(true)} disabled={busy} style={btn('gold')}>{busy ? 'Übernahme läuft …' : 'Als Nachmeldung freigeben'}</button>
                    <button onClick={() => setConfirmActiveSeason(false)} disabled={busy} style={btn('ghost')}>Abbrechen</button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Anmeldung entfernen (nur nicht-übernommene, z. B. doppelter Entwurf) */}
          {!reg.applied_at && reg.status !== 'approved' && (
            <Card title="Anmeldung entfernen">
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', margin: '0 0 12px', lineHeight: 1.55 }}>
                Löscht diese Anmeldung samt gemeldetem Kader endgültig – sinnvoll z. B. bei einem
                versehentlich doppelt angelegten Entwurf. Bereits freigegebene Mannschaften bleiben
                davon unberührt.
              </p>
              <button onClick={handleDelete} disabled={busy} style={btn('red')}>Anmeldung löschen</button>
            </Card>
          )}
        </div>
      )}
    </AdminGuard>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '18px 20px' }}>
      {title && <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10, padding: '5px 0' }}>
      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>{k}</span>
      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: v ? 'var(--th-text-strong)' : 'var(--th-text-faint2)', wordBreak: 'break-word' }}>{v || '–'}</span>
    </div>
  );
}

function btn(kind: 'ghost' | 'gold' | 'red' | 'green'): React.CSSProperties {
  const base: React.CSSProperties = { padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, border: '1px solid' };
  if (kind === 'green') return { ...base, background: '#1E9E5A', color: '#fff', borderColor: '#1E9E5A' };
  if (kind === 'red')   return { ...base, background: 'transparent', color: 'var(--th-loss)', borderColor: 'var(--th-loss)' };
  if (kind === 'gold')  return { ...base, background: 'transparent', color: 'var(--th-gold)', borderColor: 'var(--th-gold)' };
  return { ...base, background: 'transparent', color: 'var(--th-text-muted)', borderColor: 'var(--th-line-10)' };
}
