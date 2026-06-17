'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canStartRegistration } from '@/lib/auth/roles';
import {
  TEAMS, findTeam, getCurrentSeason, getVenueForTeamInSeason,
  getRankedRosterForTeam, getPlayerDisplayName,
} from '@/lib/data';
import { loadTeamProfile } from '@/lib/supabase/profiles';
import {
  createRegistration, updateRegistration, submitRegistration,
  getRegistration, getRegistrationPlayers,
  type RegistrationDraft, type RegistrationPlayer,
} from '@/lib/supabase/registrations';

const SEASON = getCurrentSeason();
const TEAM_OPTIONS = [...TEAMS].map(t => ({ id: t.id, name: t.name })).sort((a, b) => a.name.localeCompare(b.name, 'de'));

function emptyDraft(): RegistrationDraft {
  return {
    season_id: SEASON.id, source_team_id: null, is_new_team: false,
    team_name: '', short_name: '', description: '',
    logo_url: '', team_image_url: '',
    venue_name: '', venue_address: '', venue_info: '',
    contact_name: '', contact_email: '', contact_phone: '',
    instagram_url: '', facebook_url: '', website_url: '', notes: '',
  };
}

export default function MannschaftAnmeldenPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = canStartRegistration(user);

  const [regId, setRegId] = useState<string | null>(null);
  const [choice, setChoice] = useState<string>('');      // '' | 'NEW' | teamId
  const [draft, setDraft] = useState<RegistrationDraft>(emptyDraft());
  const [players, setPlayers] = useState<RegistrationPlayer[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Bestehenden Entwurf laden (?id=…)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id || !allowed) return;
    (async () => {
      const reg = await getRegistration(id);
      if (!reg) return;
      setRegId(reg.id);
      setChoice(reg.is_new_team ? 'NEW' : (reg.source_team_id ?? 'NEW'));
      setDraft({
        season_id: reg.season_id, source_team_id: reg.source_team_id, is_new_team: reg.is_new_team,
        team_name: reg.team_name, short_name: reg.short_name ?? '', description: reg.description ?? '',
        logo_url: reg.logo_url ?? '', team_image_url: reg.team_image_url ?? '',
        venue_name: reg.venue_name ?? '', venue_address: reg.venue_address ?? '', venue_info: reg.venue_info ?? '',
        contact_name: reg.contact_name, contact_email: reg.contact_email, contact_phone: reg.contact_phone ?? '',
        instagram_url: reg.instagram_url ?? '', facebook_url: reg.facebook_url ?? '', website_url: reg.website_url ?? '', notes: reg.notes ?? '',
      });
      setPlayers(await getRegistrationPlayers(id));
    })();
  }, [allowed]);

  // Kontakt aus dem Konto vorbelegen (nur bei leerem neuem Formular).
  // setState außerhalb des Effect-Bodys (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!user || regId) return;
    queueMicrotask(() => {
      setDraft(d => ({
        ...d,
        contact_name: d.contact_name || user.displayName,
        contact_email: d.contact_email || user.email,
      }));
    });
  }, [user, regId]);

  async function onChoice(value: string) {
    setChoice(value);
    setMsg(null);
    if (value === 'NEW') {
      setDraft(d => ({ ...emptyDraft(), contact_name: d.contact_name, contact_email: d.contact_email, is_new_team: true, source_team_id: null }));
      setPlayers([]);
      return;
    }
    if (!value) return;
    // Bestehende Mannschaft → vorausfüllen
    const team = findTeam(value);
    const venue = getVenueForTeamInSeason(value, SEASON.id) as { name?: string; address?: string } | null;
    const extras = await loadTeamProfile(value);
    const roster = getRankedRosterForTeam(value, SEASON.id);
    setDraft(d => ({
      ...emptyDraft(),
      source_team_id: value, is_new_team: false,
      team_name: team?.name ?? '', short_name: team?.short ?? '',
      description: extras.description ?? '',
      logo_url: extras.logoUrl ?? team?.logoUrl ?? '',
      team_image_url: extras.teamImageUrl ?? '',
      venue_name: venue?.name ?? '', venue_address: venue?.address ?? '',
      instagram_url: extras.instagramUrl ?? '', facebook_url: extras.facebookUrl ?? '', website_url: extras.websiteUrl ?? '',
      contact_name: d.contact_name, contact_email: d.contact_email,
    }));
    setPlayers(roster.map(e => ({
      player_id: e.player.id,
      first_name: e.player.firstName,
      last_name: e.player.lastName,
      display_name: getPlayerDisplayName(e.player),
      license_number: e.player.licenseNumber ?? null,
      is_captain: e.isCaptain,
      is_existing_player: true,
      status: 'active',
    })));
  }

  function set<K extends keyof RegistrationDraft>(k: K, v: string) {
    setDraft(d => ({ ...d, [k]: v }));
  }

  function validate(): string | null {
    if (!draft.team_name.trim()) return 'Bitte einen Teamnamen angeben.';
    if (!draft.contact_name.trim()) return 'Bitte einen Ansprechpartner angeben.';
    if (!/^\S+@\S+\.\S+$/.test(draft.contact_email)) return 'Bitte eine gültige Kontakt-E-Mail angeben.';
    if (!draft.venue_name?.trim()) return 'Bitte den Namen der Spielstätte angeben.';
    if (!draft.venue_address?.trim()) return 'Bitte die Adresse der Spielstätte angeben.';
    if (players.length === 0) return 'Bitte mindestens einen Spieler im Kader angeben.';
    return null;
  }

  /** Entwurf anlegen/aktualisieren; gibt die id zurück. */
  async function persist(): Promise<string | null> {
    const payload: RegistrationDraft = {
      ...draft,
      is_new_team: choice === 'NEW',
      source_team_id: choice === 'NEW' ? null : (choice || null),
    };
    if (regId) {
      const { error } = await updateRegistration(regId, payload, players);
      if (error) { setMsg({ kind: 'err', text: error }); return null; }
      return regId;
    }
    const { id, error } = await createRegistration(payload, players);
    if (error || !id) { setMsg({ kind: 'err', text: error ?? 'Speichern fehlgeschlagen.' }); return null; }
    setRegId(id);
    return id;
  }

  async function onSaveDraft() {
    if (!choice) { setMsg({ kind: 'err', text: 'Bitte zuerst eine Mannschaft oder „Neue Mannschaft" wählen.' }); return; }
    setBusy(true); setMsg(null);
    const id = await persist();
    setBusy(false);
    if (id) setMsg({ kind: 'ok', text: 'Als Entwurf gespeichert.' });
  }

  async function onSubmit() {
    if (!choice) { setMsg({ kind: 'err', text: 'Bitte zuerst eine Mannschaft wählen.' }); return; }
    const v = validate();
    if (v) { setMsg({ kind: 'err', text: v }); return; }
    if (!confirmed) { setMsg({ kind: 'err', text: 'Bitte die Bestätigung der Rechte/Angaben ankreuzen.' }); return; }
    setBusy(true); setMsg(null);
    const id = await persist();
    if (!id) { setBusy(false); return; }
    const { error } = await submitRegistration(id);
    setBusy(false);
    if (error) { setMsg({ kind: 'err', text: error }); return; }
    router.push('/mein-bereich/anmeldungen');
  }

  return (
    <MemberShell title="Mannschaft anmelden">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Die Mannschaftsanmeldung ist nur mit Konto verfügbar.{' '}<LoginLink /></Notice>
        : !allowed ? <Notice title="Keine Berechtigung">Mannschaften anmelden dürfen Teamkapitäne und die Ligaleitung.</Notice>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
            {msg && (
              <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{
                padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13,
                background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)',
                border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`,
                color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)',
              }}>{msg.text}</div>
            )}

            {/* 1. Auswahl */}
            <Section title="1 · Mannschaft auswählen">
              <Field label="Bestehende Mannschaft oder neue Anmeldung">
                <select value={choice} onChange={e => onChoice(e.target.value)} style={inputStyle}>
                  <option value="">— bitte wählen —</option>
                  {TEAM_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  <option value="NEW">＋ Neue Mannschaft anmelden</option>
                </select>
              </Field>
              {choice && choice !== 'NEW' && (
                <p style={{ ...hintStyle }}>Die Daten der bestehenden Mannschaft wurden übernommen und können hier angepasst werden. Die offiziellen Teamdaten werden dadurch nicht verändert.</p>
              )}
            </Section>

            {choice && (
              <>
                {/* 2. Teamdaten */}
                <Section title="2 · Teamdaten">
                  <Field label="Teamname *"><input value={draft.team_name} onChange={e => set('team_name', e.target.value)} style={inputStyle} /></Field>
                  <Field label="Kurzname (optional)"><input value={draft.short_name ?? ''} onChange={e => set('short_name', e.target.value)} maxLength={4} style={inputStyle} /></Field>
                  <Field label="Beschreibung (optional)"><textarea value={draft.description ?? ''} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
                  <Field label="Teamlogo (Bild-URL)"><input value={draft.logo_url ?? ''} onChange={e => set('logo_url', e.target.value)} placeholder="https://…" style={inputStyle} /></Field>
                  <Field label="Mannschaftsbild (Bild-URL)"><input value={draft.team_image_url ?? ''} onChange={e => set('team_image_url', e.target.value)} placeholder="https://…" style={inputStyle} /></Field>
                  <p style={hintStyle}>Direkter Datei-Upload (Logo/Mannschaftsbild) folgt mit Supabase Storage. Bis dahin bitte Bild-URL angeben. Nur Bilder verwenden, für die die nötigen Rechte vorliegen.</p>
                </Section>

                {/* 3. Spielstätte */}
                <Section title="3 · Spielstätte">
                  <Field label="Name *"><input value={draft.venue_name ?? ''} onChange={e => set('venue_name', e.target.value)} style={inputStyle} /></Field>
                  <Field label="Adresse *"><input value={draft.venue_address ?? ''} onChange={e => set('venue_address', e.target.value)} style={inputStyle} /></Field>
                  <Field label="Zusatzinfo (optional)"><input value={draft.venue_info ?? ''} onChange={e => set('venue_info', e.target.value)} style={inputStyle} /></Field>
                </Section>

                {/* 4. Kontakt */}
                <Section title="4 · Kontakt">
                  <Field label="Ansprechpartner *"><input value={draft.contact_name} onChange={e => set('contact_name', e.target.value)} style={inputStyle} /></Field>
                  <Field label="E-Mail *"><input type="email" value={draft.contact_email} onChange={e => set('contact_email', e.target.value)} style={inputStyle} /></Field>
                  <Field label="Telefon (optional)"><input value={draft.contact_phone ?? ''} onChange={e => set('contact_phone', e.target.value)} style={inputStyle} /></Field>
                </Section>

                {/* 5. Social Media */}
                <Section title="5 · Social Media (optional)">
                  <Field label="Instagram"><input value={draft.instagram_url ?? ''} onChange={e => set('instagram_url', e.target.value)} placeholder="https://instagram.com/…" style={inputStyle} /></Field>
                  <Field label="Facebook"><input value={draft.facebook_url ?? ''} onChange={e => set('facebook_url', e.target.value)} placeholder="https://facebook.com/…" style={inputStyle} /></Field>
                  <Field label="Website"><input value={draft.website_url ?? ''} onChange={e => set('website_url', e.target.value)} placeholder="https://…" style={inputStyle} /></Field>
                </Section>

                {/* 6. Kader */}
                <Section title={`6 · Kader (${players.length})`}>
                  {players.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--th-line-4)' }}>
                      <input value={p.display_name} onChange={e => setPlayers(arr => arr.map((x, j) => j === i ? { ...x, display_name: e.target.value } : x))}
                        style={{ ...inputStyle, flex: 1, padding: '8px 10px' }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-muted)', flexShrink: 0 }}>
                        <input type="checkbox" checked={p.is_captain}
                          onChange={e => setPlayers(arr => arr.map((x, j) => ({ ...x, is_captain: j === i ? e.target.checked : (e.target.checked ? false : x.is_captain) })))} />
                        TC
                      </label>
                      <button type="button" aria-label="Entfernen" onClick={() => setPlayers(arr => arr.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-loss)', flexShrink: 0, fontFamily: 'var(--font-manrope)', fontSize: 18 }}>×</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setPlayers(arr => [...arr, { player_id: null, first_name: '', last_name: '', display_name: '', license_number: null, is_captain: false, is_existing_player: false, status: 'active' }])}
                    style={{ marginTop: 10, padding: '9px 14px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 }}>
                    ＋ Spieler hinzufügen
                  </button>
                  <p style={hintStyle}>Neue Spieler erhalten eine Display-Name-Eingabe; die Verknüpfung mit offiziellen Spielerdaten erfolgt bei der Freigabe durch die Ligaleitung.</p>
                </Section>

                {/* 7. Prüfung & Absenden */}
                <Section title="7 · Prüfung & Absenden">
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', lineHeight: 1.55 }}>
                    <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
                    <span>
                      Mit dem Absenden bestätige ich, dass ich berechtigt bin, die angegebenen Daten und Bilder
                      für die Mannschaftsanmeldung zu verwenden und dass für hochgeladene Mannschaftsbilder/Logos
                      die notwendigen Rechte bzw. Zustimmungen vorliegen.{' '}
                      <Link href="/datenschutz" style={{ color: 'var(--th-accent)', textDecoration: 'underline' }}>Datenschutz</Link>
                    </span>
                  </label>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                    <button type="button" onClick={onSaveDraft} disabled={busy}
                      style={{ padding: '12px 22px', borderRadius: 8, cursor: busy ? 'wait' : 'pointer', background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 }}>
                      Als Entwurf speichern
                    </button>
                    <button type="button" onClick={onSubmit} disabled={busy}
                      style={{ padding: '12px 28px', borderRadius: 8, cursor: busy ? 'wait' : 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.04em', opacity: busy ? 0.7 : 1 }}>
                      {busy ? 'Bitte warten …' : 'Anmeldung absenden'}
                    </button>
                  </div>
                </Section>
              </>
            )}
          </div>
        )}
    </MemberShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
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

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: 'var(--th-bg-header)',
  border: '1px solid var(--th-line-10)', borderRadius: 8,
  color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none',
};

const hintStyle: React.CSSProperties = {
  fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', lineHeight: 1.55, margin: 0,
};
