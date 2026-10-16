'use client';

// ============================================================
// Terminseite (/termin/[id]) — eigener Termin außerhalb der MDU
// ============================================================
// Gegenstück zur Spieltag-Seite für Termine aus dem Team Manager
// (Migration 0048): Übersicht, eigene Antwort, Treffen, Notiz + Aufgaben,
// Teilnehmerliste. Keine Aufstellung — die H1–H8 gelten nur für MDU-Spiele.
// Nur fürs eigene Team sichtbar (RLS); der TC ändert und löscht hier.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { canEditTeam, hasMinRole } from '@/lib/auth/roles';
import { NEUE_SAISON } from '@/lib/data/saison-2027';
import { ladeKader, type KaderOption } from '@/lib/supabase/season-teams';
import {
  ladeZusagen, setzeZusage, ladeEinstellungen, ladeDetails, setzeDetails, TREFFEN_VORGABE,
  ladeAufgaben, neueAufgabe, setzeErledigt, loescheAufgabe,
  type Zusage, type ZusageStatus, type SpielDetails, type Aufgabe,
} from '@/lib/supabase/zusagen';
import { ladeTermin, speichereTermin, loescheTermin, terminKey, type TeamTermin, type TerminEingabe } from '@/lib/supabase/termine';
import { treffZeit } from '@/lib/spieltag';
import { Icon } from './icon';
import { STATUS, REIHE, MeineAntwort, KaderZeile, Zeitleiste, StandLeiste, karte, knopf, h2 } from './zusagen-ui';
import { NotizUndAufgaben, TreffzeitFeld } from './spieltag-ansicht';
import { TerminKopf, TerminFormular, terminLabel, terminGrund } from './termin-ui';
import { terminFarbe } from '@/lib/supabase/termine';

export function TerminAnsicht({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pfad = usePathname();
  const [t, setT] = useState<TeamTermin | null | undefined>(undefined);
  const [kader, setKader] = useState<KaderOption[] | null>(null);
  const [zusagen, setZusagen] = useState<Zusage[]>([]);
  const [treffenMin, setTreffenMin] = useState(TREFFEN_VORGABE);
  const [details, setDetails] = useState<SpielDetails | null>(null);
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [bearbeiten, setBearbeiten] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const key = terminKey(id);
  const teamId = t?.team_id ?? '';
  const mitglied = !!user && !!t && (user.teamId === t.team_id || hasMinRole(user, 'league_admin'));
  const istKapitaen = mitglied && canEditTeam(user, teamId);
  const label = t ? terminLabel(t) : '';

  const laden = useCallback(async () => {
    if (loading) return;
    if (!user) { setT(null); return; }
    const termin = await ladeTermin(id);
    setT(termin);
    if (!termin) return;
    const [k, z, e, d, a] = await Promise.all([ladeKader(NEUE_SAISON.id, termin.team_id), ladeZusagen(termin.team_id), ladeEinstellungen(termin.team_id), ladeDetails(termin.team_id), ladeAufgaben(termin.team_id, key)]);
    setKader(k); setAufgaben(a); setZusagen(z.rows.filter(r => r.match_key === key)); setTreffenMin(e.meet_minutes); setDetails(d[key] ?? null);
    if (z.error) setMsg({ kind: 'err', text: z.error });
  }, [loading, user, id, key]);

  useEffect(() => { queueMicrotask(() => { void laden(); }); }, [laden]);

  const personen: KaderOption[] = [...(kader ?? [])];
  if (mitglied && user?.playerId && user.teamId === teamId && !personen.some(p => p.id === user.playerId)) {
    personen.push({ id: user.playerId, name: user.displayName, isCaptain: false, passNo: null });
  }
  const zuVon = (pid: string) => zusagen.find(z => z.player_id === pid);
  const zahl = (s: ZusageStatus) => zusagen.filter(z => z.status === s).length;

  async function setze(p: { id: string; name: string }, status: ZusageStatus | null, note?: string | null, ohneGrund = false) {
    if (!user) return;
    setMsg(null);
    const vorher = zusagen;
    setZusagen(z => {
      const rest = z.filter(r => r.player_id !== p.id);
      return status ? [...rest, { match_key: key, team_id: teamId, player_id: p.id, player_name: p.name, status, note: note ?? null, updated_by: user.id, updated_at: new Date().toISOString() }] : rest;
    });
    const { error } = await setzeZusage({ matchKey: key, teamId, playerId: p.id, playerName: p.name, status, note, label, userId: user.id, ohneGrund });
    if (error) { setZusagen(vorher); setMsg({ kind: 'err', text: error }); }
  }

  async function speichereDetails(werte: { meetTime?: string | null; note?: string | null }, ok: string) {
    if (!user) return;
    const vorher = details;
    setDetails(d => ({ match_key: key, meet_time: werte.meetTime !== undefined ? werte.meetTime : d?.meet_time ?? null, lineup: d?.lineup ?? [], note: werte.note !== undefined ? werte.note : d?.note ?? null }));
    const { error } = await setzeDetails({ matchKey: key, teamId, userId: user.id, ...werte });
    if (error) { setDetails(vorher); setMsg({ kind: 'err', text: error }); } else setMsg({ kind: 'ok', text: ok });
  }

  async function aufgabeNeu(title: string, assignee: { id: string; name: string } | null) {
    if (!user) return false;
    const { data, error } = await neueAufgabe({ matchKey: key, teamId, title, assignee, label, userId: user.id });
    if (error || !data) { setMsg({ kind: 'err', text: error ?? 'Konnte nicht speichern.' }); return false; }
    setAufgaben(a => [...a, data]);
    setMsg({ kind: 'ok', text: assignee ? `Aufgabe angelegt – ${assignee.name} bekommt einen Hinweis.` : 'Aufgabe angelegt.' });
    return true;
  }
  async function aufgabeHaken(a: Aufgabe) {
    if (!user) return;
    setAufgaben(l => l.map(x => (x.id === a.id ? { ...x, done: !a.done } : x)));
    const { error } = await setzeErledigt(a.id, !a.done, user.id);
    if (error) { setAufgaben(l => l.map(x => (x.id === a.id ? a : x))); setMsg({ kind: 'err', text: error }); }
  }
  async function aufgabeWeg(a: Aufgabe) {
    const vorher = aufgaben;
    setAufgaben(l => l.filter(x => x.id !== a.id));
    const { error } = await loescheAufgabe(a.id);
    if (error) { setAufgaben(vorher); setMsg({ kind: 'err', text: error }); }
  }

  async function aendern(e: TerminEingabe) {
    if (!user || !t) return false;
    const { data, error } = await speichereTermin(t.team_id, e, user.id, t.id);
    if (error || !data) { setMsg({ kind: 'err', text: error ?? 'Konnte nicht speichern.' }); return false; }
    setT(data); setBearbeiten(false); setMsg({ kind: 'ok', text: 'Termin geändert.' });
    return true;
  }
  async function loeschen() {
    if (!t || !window.confirm('Termin wirklich löschen? Zu- und Absagen, Notiz und Aufgaben dazu werden mit gelöscht.')) return;
    const { error } = await loescheTermin(t);
    if (error) { setMsg({ kind: 'err', text: error }); return; }
    router.push('/mein-team/zusagen');
  }

  async function teilen() {
    const url = window.location.href;
    const text = `${label} – bitte zu- oder absagen`;
    try {
      // Link IM Text statt als eigenes Feld: iOS „Kopieren“ nimmt sonst nur den Text mit
      // (16.10.2026). WhatsApp & Co. erkennen den Link im Text trotzdem und zeigen die Vorschau.
      if (navigator.share) { await navigator.share({ title: label, text: `${text}\n${url}` }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMsg({ kind: 'ok', text: 'Link kopiert – jetzt einfach in die Gruppe einfügen.' });
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') setMsg({ kind: 'err', text: 'Teilen hat nicht geklappt – kopier bitte die Adresse oben im Browser.' });
    }
  }

  if (loading || t === undefined) return <span style={leise}>Lade …</span>;
  if (!user) return (
    <div style={karte}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>Termin deines Teams</div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.55 }}>
        Melde dich an, um den Termin zu sehen und zu- oder abzusagen.{' '}
        <Link href={`/login?next=${encodeURIComponent(pfad)}`} style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Zum Login</Link>
      </div>
    </div>
  );
  if (!t) return (
    <div style={karte}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>Termin nicht gefunden</div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.55 }}>
        Den Termin gibt es nicht mehr, oder er gehört zu einem anderen Team.{' '}
        <Link href="/mein-team/zusagen" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Zum Team Manager</Link>
      </div>
    </div>
  );

  const ortText = [t.venue, t.address].filter(Boolean).join(', ');
  const farbe = terminFarbe(t);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Link href="/mein-team/zusagen" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)', textDecoration: 'none' }}><Icon name="chevron" size={12} style={{ transform: 'rotate(180deg)' }} /> Alle Termine</Link>

      {bearbeiten ? (
        <TerminFormular start={t} titel="Termin ändern" onSpeichern={aendern} onAbbrechen={() => setBearbeiten(false)} onLoeschen={() => void loeschen()} />
      ) : (
        <div style={{ borderRadius: 18, overflow: 'hidden', background: terminGrund(farbe), border: `1.5px solid ${farbe}`, boxShadow: '0 4px 20px var(--th-shadow)' }}>
          <TerminKopf t={t} teamId={teamId} gross />
          <Zeitleiste beginn={t.start_time ?? undefined} treffenMin={t.kind === 'spiel' ? treffenMin : 0} meetTime={details?.meet_time ?? null} ende={t.end_time ?? (t.kind === 'spiel' ? undefined : null)} />
          {ortText && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ortText)}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 12px 0', padding: '10px 12px', borderRadius: 10, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)', textDecoration: 'none' }}>
              <Icon name="pin" size={18} style={{ color: farbe, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)' }}>
                <span style={{ display: 'block', fontWeight: 800, fontSize: 13.5, color: 'var(--th-text-strong)' }}>{t.venue ?? t.address}</span>
                {t.venue && t.address && <span style={{ display: 'block', fontSize: 12.5, color: 'var(--th-text-muted)' }}>{t.address}</span>}
              </span>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: farbe }}>Route</span>
            </a>
          )}
          <div style={{ padding: '8px 16px 0', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-text-faint)' }}>Termin außerhalb der MDU – vom Teamcaptain eingetragen.</div>
          <StandLeiste zahl={{ yes: zahl('yes'), maybe: zahl('maybe'), no: zahl('no') }} offen={mitglied ? Math.max(0, personen.length - zusagen.length) : null}
            meins={mitglied && user.playerId ? zuVon(user.playerId)?.status ?? null : undefined} />
        </div>
      )}

      {!bearbeiten && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => void teilen()} style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 16px', borderRadius: 12, cursor: 'pointer', border: 'none', background: 'var(--th-accent)', color: '#fff', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, boxShadow: '0 4px 14px var(--th-accent-a30)' }}>
            <Icon name="share" size={18} stroke={2.2} /> Termin teilen
          </button>
          {istKapitaen && (
            <button type="button" onClick={() => { setBearbeiten(true); setMsg(null); }} style={{ ...knopf(false, farbe), display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon name="edit" size={15} /> Ändern
            </button>
          )}
        </div>
      )}

      {msg && (
        <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`, color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{msg.text}</div>
      )}

      {mitglied && (
        <>
          {user.playerId && user.teamId === teamId && (
            <MeineAntwort key={zuVon(user.playerId)?.updated_at ?? 'neu'} z={zuVon(user.playerId)}
              onSetze={(s, n) => setze({ id: user.playerId!, name: user.displayName }, s, n)} />
          )}

          {istKapitaen && t.kind === 'spiel' && t.start_time && (
            <TreffzeitFeld eigene={details?.meet_time ?? null} vorgabe={treffZeit(t.start_time, treffenMin, null)}
              onSpeichern={v => void speichereDetails({ meetTime: v }, v ? `Treffen für diesen Termin: ${v} Uhr.` : 'Treffen wieder nach Vorgabe.')} />
          )}

          <NotizUndAufgaben key={details?.note ?? ''} note={details?.note ?? null} aufgaben={aufgaben} personen={personen} darf={istKapitaen}
            ich={user.playerId ?? null}
            onNotiz={n => void speichereDetails({ note: n }, n ? 'Notiz gespeichert.' : 'Notiz gelöscht.')}
            onNeu={aufgabeNeu} onHaken={a => void aufgabeHaken(a)} onWeg={a => void aufgabeWeg(a)} />

          <section style={karte}>
            <h2 style={h2}>Teilnehmerliste</h2>
            {kader === null ? <span style={leise}>Lade …</span> : (
              [...REIHE, null].map(s => {
                const gruppe = personen.filter(p => (zuVon(p.id)?.status ?? null) === s);
                if (!gruppe.length) return null;
                return (
                  <div key={s ?? 'offen'} style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0 4px', fontFamily: 'var(--font-manrope)', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: s ? STATUS[s].farbe : 'var(--th-text-faint)' }}>
                      {s ? STATUS[s].text : 'noch offen'}
                      <span style={{ padding: '1px 8px', borderRadius: 999, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-8)', color: 'var(--th-text-body)' }}>{gruppe.length}</span>
                      <span style={{ flex: 1, height: 1, background: 'var(--th-line-6)' }} />
                    </div>
                    {gruppe.map(p => (
                      <KaderZeile key={p.id + (zuVon(p.id)?.updated_at ?? '')} name={p.name + (p.isCaptain ? ' (TC)' : '')} z={zuVon(p.id)} darfSetzen={istKapitaen}
                        ohneGrund={istKapitaen && p.id !== user.playerId}
                        onSetze={(st, n) => setze(p, st, n, istKapitaen && p.id !== user.playerId)} />
                    ))}
                  </div>
                );
              })
            )}
          </section>
        </>
      )}
    </div>
  );
}

const leise: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)' };
