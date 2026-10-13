'use client';

// ============================================================
// Spieltag-Seite (/spieltag/[team]/[spiel]) — Inhalt im Browser
// ============================================================
// Oben die Übersicht (Datum, Gegner, Treffen/Beginn/Ende, Ort, Stand),
// darunter die Aufstellung und die Teilnehmerliste. Wer den Link ohne
// Anmeldung öffnet, sieht nur die Zahlen (/api/spieltag/stand) — Namen,
// Begründungen und Abstimmen gibt es nur für Teammitglieder (RLS).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { canEditTeam, hasMinRole } from '@/lib/auth/roles';
import { NEUE_SAISON, findLiga27, terminKurz, wochenendeText, type Begegnung27 } from '@/lib/data/saison-2027';
import { ladeKader, type KaderOption } from '@/lib/supabase/season-teams';
import {
  ladeZusagen, setzeZusage, ladeEinstellungen, ladeDetails, setzeDetails, TREFFEN_VORGABE,
  ladeAufgaben, neueAufgabe, setzeErledigt, loescheAufgabe, AUFGABE_MAX, SPIEL_NOTIZ_MAX,
  type Zusage, type ZusageStatus, type SpielDetails, type Aufgabe,
} from '@/lib/supabase/zusagen';
import { spielSlug, treffZeit } from '@/lib/spieltag';
import { Icon } from './icon';
import { STATUS, REIHE, MeineAntwort, KaderZeile, SpielKopf, Zeitleiste, StandLeiste, karte, knopf, h2 } from './zusagen-ui';

type Stand = { yes: number; maybe: number; no: number; meetTime: string | null; meetMinutes: number | null };

export function SpieltagAnsicht({ b, teamId, teamName, gegner, liga, ort }: {
  b: Begegnung27; teamId: string; teamName: string; gegner: string; liga: string;
  ort: { name: string; address: string | null } | null;
}) {
  const { user, loading } = useAuth();
  const pfad = usePathname();
  const mitglied = !!user && (user.teamId === teamId || hasMinRole(user, 'league_admin'));
  const istKapitaen = mitglied && canEditTeam(user, teamId);
  const heim = b.home === teamId;
  const t = b.termin;
  const label = `${t ? terminKurz(t) : wochenendeText(b.fri, b.sun, false)} · ${heim ? teamName : gegner} – ${heim ? gegner : teamName}`;

  const [stand, setStand] = useState<Stand | null>(null);
  const [kader, setKader] = useState<KaderOption[] | null>(null);
  const [zusagen, setZusagen] = useState<Zusage[]>([]);
  const [treffenMin, setTreffenMin] = useState(TREFFEN_VORGABE);
  const [details, setDetails] = useState<SpielDetails | null>(null);
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const laden = useCallback(async () => {
    if (loading) return;
    if (mitglied) {
      const [k, z, e, d, a] = await Promise.all([ladeKader(NEUE_SAISON.id, teamId), ladeZusagen(teamId), ladeEinstellungen(teamId), ladeDetails(teamId), ladeAufgaben(teamId, b.key)]);
      setKader(k); setAufgaben(a); setZusagen(z.rows.filter(r => r.match_key === b.key)); setTreffenMin(e.meet_minutes); setDetails(d[b.key] ?? null);
      if (z.error) setMsg({ kind: 'err', text: z.error });
    } else {
      const r = await fetch(`/api/spieltag/stand?team=${encodeURIComponent(teamId)}&spiel=${encodeURIComponent(spielSlug(b.key))}`).catch(() => null);
      const j = r?.ok ? await r.json() as Stand : null;
      setStand(j);
      if (j?.meetMinutes != null) setTreffenMin(j.meetMinutes);
    }
  }, [loading, mitglied, teamId, b.key]);

  useEffect(() => { queueMicrotask(() => { void laden(); }); }, [laden]);

  // Kader + ggf. der eigene Eintrag, falls der Spieler (noch) nicht im Kader steht.
  const personen: KaderOption[] = [...(kader ?? [])];
  if (mitglied && user?.playerId && user.teamId === teamId && !personen.some(p => p.id === user.playerId)) {
    personen.push({ id: user.playerId, name: user.displayName, isCaptain: false, passNo: null });
  }
  const zuVon = (id: string) => zusagen.find(z => z.player_id === id);
  const zahl = (s: ZusageStatus) => (mitglied ? zusagen.filter(z => z.status === s).length : stand?.[s] ?? 0);
  const offen = mitglied ? Math.max(0, personen.length - zusagen.length) : null;
  const meetTime = mitglied ? details?.meet_time ?? null : stand?.meetTime ?? null;
  const lineup = details?.lineup ?? [];

  async function setze(p: { id: string; name: string }, status: ZusageStatus | null, note?: string | null, ohneGrund = false) {
    if (!user) return;
    setMsg(null);
    const vorher = zusagen;
    setZusagen(z => {
      const rest = z.filter(r => r.player_id !== p.id);
      return status ? [...rest, { match_key: b.key, team_id: teamId, player_id: p.id, player_name: p.name, status, note: note ?? null, updated_by: user.id, updated_at: new Date().toISOString() }] : rest;
    });
    const { error } = await setzeZusage({ matchKey: b.key, teamId, playerId: p.id, playerName: p.name, status, note, label, userId: user.id, ohneGrund });
    if (error) { setZusagen(vorher); setMsg({ kind: 'err', text: error }); }
  }

  async function speichereDetails(werte: { meetTime?: string | null; lineup?: string[]; note?: string | null }, ok: string) {
    if (!user) return;
    const vorher = details;
    setDetails(d => ({ match_key: b.key, meet_time: werte.meetTime !== undefined ? werte.meetTime : d?.meet_time ?? null, lineup: werte.lineup ?? d?.lineup ?? [], note: werte.note !== undefined ? werte.note : d?.note ?? null }));
    const { error } = await setzeDetails({ matchKey: b.key, teamId, userId: user.id, ...werte });
    if (error) { setDetails(vorher); setMsg({ kind: 'err', text: /note/.test(error) ? 'Notizen sind noch nicht eingerichtet (Migration 0047).' : /match_team_details/.test(error) ? 'Aufstellung/Treffzeit sind noch nicht eingerichtet (Migration 0045).' : error }); }
    else setMsg({ kind: 'ok', text: ok });
  }

  async function aufgabeNeu(title: string, assignee: { id: string; name: string } | null) {
    if (!user) return false;
    const { data, error } = await neueAufgabe({ matchKey: b.key, teamId, title, assignee, label, userId: user.id });
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

  async function teilen() {
    const url = window.location.href;
    const text = `${teamName}: ${label} – bitte zu- oder absagen`;
    try {
      if (navigator.share) { await navigator.share({ title: label, text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setMsg({ kind: 'ok', text: 'Link kopiert – jetzt einfach in die Gruppe einfügen.' });
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') setMsg({ kind: 'err', text: 'Teilen hat nicht geklappt – kopier bitte die Adresse oben im Browser.' });
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {mitglied && (
        <Link href="/mein-team/zusagen" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)', textDecoration: 'none' }}><Icon name="chevron" size={12} style={{ transform: 'rotate(180deg)' }} /> Alle Spiele</Link>
      )}

      {/* ── Übersicht ── */}
      <div style={{ borderRadius: 18, overflow: 'hidden', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', boxShadow: '0 4px 20px var(--th-shadow)' }}>
        <SpielKopf b={b} teamId={teamId} liga={liga} ligaFarbe={findLiga27(b.liga)?.color ?? '#D40000'} gross />
        <Zeitleiste beginn={t?.uhrzeit} treffenMin={treffenMin} meetTime={meetTime} />
        {(t?.vorlaeufig || !t?.uhrzeit) && (
          <div style={{ padding: '8px 16px 0', fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, color: 'var(--th-gold)' }}>
            {t?.vorlaeufig ? 'Termin wird noch geprüft.' : !t ? 'Termin steht noch nicht fest.' : 'Uhrzeit folgt.'}
          </div>
        )}
        {ort && (
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ort.name}, ${ort.address ?? 'München'}`)}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 12px 0', padding: '10px 12px', borderRadius: 10, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)', textDecoration: 'none' }}>
            <Icon name="pin" size={18} style={{ color: 'var(--th-accent)', flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)' }}>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 13.5, color: 'var(--th-text-strong)' }}>{ort.name}</span>
              {ort.address && <span style={{ display: 'block', fontSize: 12.5, color: 'var(--th-text-muted)' }}>{ort.address}</span>}
            </span>
            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-accent)' }}>Route</span>
          </a>
        )}
        <StandLeiste zahl={{ yes: zahl('yes'), maybe: zahl('maybe'), no: zahl('no') }} offen={offen}
          meins={mitglied && user?.playerId ? zuVon(user.playerId)?.status ?? null : undefined} />
      </div>

      <button type="button" onClick={() => void teilen()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 16px', borderRadius: 12, cursor: 'pointer', border: 'none', background: 'var(--th-accent)', color: '#fff', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, boxShadow: '0 4px 14px var(--th-accent-a30)' }}>
        <Icon name="share" size={18} stroke={2.2} /> Spiel teilen
        <span style={{ fontWeight: 600, opacity: 0.85, fontSize: 12.5 }}>· z. B. WhatsApp-Gruppe</span>
      </button>

      {msg && (
        <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`, color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{msg.text}</div>
      )}

      {loading ? null : !mitglied ? (
        <div style={karte}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>Du spielst bei {teamName}?</div>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.55 }}>
            {user ? 'Dein Konto ist nicht mit diesem Team verknüpft – Namen und Abstimmung sieht nur das Team.' : <>Melde dich an, um zu- oder abzusagen und die Teilnehmerliste zu sehen.{' '}<Link href={`/login?next=${encodeURIComponent(pfad)}`} style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Zum Login</Link></>}
          </div>
        </div>
      ) : (
        <>
          {/* ── Eigene Antwort ── */}
          {user?.playerId && user.teamId === teamId && (
            <MeineAntwort key={zuVon(user.playerId)?.updated_at ?? 'neu'} z={zuVon(user.playerId)}
              onSetze={(s, n) => setze({ id: user.playerId!, name: user.displayName }, s, n)} />
          )}

          {/* ── Treffzeit (Kapitän) ── */}
          {istKapitaen && t?.uhrzeit && (
            <TreffzeitFeld eigene={details?.meet_time ?? null} vorgabe={treffZeit(t.uhrzeit, treffenMin, null)}
              onSpeichern={v => void speichereDetails({ meetTime: v }, v ? `Treffen für dieses Spiel: ${v} Uhr.` : 'Treffen wieder nach Vorgabe.')} />
          )}

          {/* ── Notiz + Aufgaben ── */}
          <NotizUndAufgaben key={details?.note ?? ''} note={details?.note ?? null} aufgaben={aufgaben} personen={personen} darf={istKapitaen}
            ich={user?.playerId ?? null}
            onNotiz={n => void speichereDetails({ note: n }, n ? 'Notiz gespeichert.' : 'Notiz gelöscht.')}
            onNeu={aufgabeNeu} onHaken={a => void aufgabeHaken(a)} onWeg={a => void aufgabeWeg(a)} />

          {/* ── Aufstellung ── */}
          <Aufstellung heim={heim} personen={personen} zusagen={zusagen} lineup={lineup} darf={istKapitaen}
            onSpeichern={l => void speichereDetails({ lineup: l }, l.some(Boolean) ? `Aufstellung gespeichert (${l.filter(Boolean).length} Spieler).` : 'Aufstellung geleert.')} />

          {/* ── Teilnehmerliste ── */}
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
                        ohneGrund={istKapitaen && p.id !== user?.playerId}
                        onSetze={(st, n) => setze(p, st, n, istKapitaen && p.id !== user?.playerId)} />
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

export function NotizUndAufgaben({ note, aufgaben, personen, darf, ich, onNotiz, onNeu, onHaken, onWeg }: {
  note: string | null; aufgaben: Aufgabe[]; personen: KaderOption[]; darf: boolean; ich: string | null;
  onNotiz: (n: string | null) => void; onNeu: (t: string, p: { id: string; name: string } | null) => Promise<boolean>;
  onHaken: (a: Aufgabe) => void; onWeg: (a: Aufgabe) => void;
}) {
  const [notizEdit, setNotizEdit] = useState(false);
  const [notiz, setNotiz] = useState(note ?? '');
  const [titel, setTitel] = useState('');
  const [wer, setWer] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const offen = aufgaben.filter(a => !a.done).length;
  if (!darf && !note && !aufgaben.length) return null;

  return (
    <section style={karte}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={h2}>Notizen & Aufgaben</h2>
        {aufgaben.length > 0 && <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: offen ? 'var(--th-gold)' : 'var(--th-win)' }}>{offen ? `${offen} offen` : 'alles erledigt'}</span>}
      </div>

      {/* Notiz */}
      {notizEdit ? (
        <div style={{ marginTop: 6 }}>
          <textarea autoFocus value={notiz} onChange={e => setNotiz(e.target.value.slice(0, SPIEL_NOTIZ_MAX))} rows={3} maxLength={SPIEL_NOTIZ_MAX}
            placeholder="z. B. Treffpunkt am Hintereingang, Darts für Neue mitbringen …" aria-label="Notiz zum Spiel" style={eingabe} />
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" onClick={() => { onNotiz(notiz.trim() || null); setNotizEdit(false); }} style={knopf(true)}>Speichern</button>
            <button type="button" onClick={() => { setNotiz(note ?? ''); setNotizEdit(false); }} style={knopf(false, 'var(--th-text-muted)')}>Abbrechen</button>
            <span style={{ marginLeft: 'auto', ...leise }}>{notiz.length}/{SPIEL_NOTIZ_MAX}</span>
          </div>
        </div>
      ) : note ? (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 6, padding: '10px 12px', borderRadius: 12, background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)' }}>
          <Icon name="edit" size={16} style={{ color: 'var(--th-accent)', flexShrink: 0, marginTop: 2 }} />
          <span style={{ flex: 1, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-strong)', lineHeight: 1.5 }}>{note}</span>
          {darf && <button type="button" onClick={() => setNotizEdit(true)} style={linkKnopf}>Ändern</button>}
        </div>
      ) : darf ? (
        <button type="button" onClick={() => setNotizEdit(true)} style={{ ...linkKnopf, alignSelf: 'flex-start', marginTop: 4 }}>+ Notiz fürs Team</button>
      ) : null}

      {/* Aufgaben */}
      {aufgaben.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {aufgaben.map(a => {
            const darfHaken = darf || (!!ich && a.assignee_id === ich);
            const meine = !!ich && a.assignee_id === ich;
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: '1px solid var(--th-line-4)' }}>
                <button type="button" disabled={!darfHaken} onClick={() => onHaken(a)} aria-label={a.done ? 'Als offen markieren' : 'Als erledigt abhaken'}
                  style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: darfHaken ? 'pointer' : 'default',
                    border: `1.5px solid ${a.done ? 'var(--th-win)' : 'var(--th-line-18)'}`, background: a.done ? 'var(--th-win)' : 'transparent', color: '#fff' }}>
                  {a.done && <Icon name="check" size={15} stroke={2.8} />}
                </button>
                <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)' }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: a.done ? 'var(--th-text-faint)' : 'var(--th-text-strong)', textDecoration: a.done ? 'line-through' : 'none' }}>{a.title}</span>
                  {a.assignee_name && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2, fontSize: 12, fontWeight: 700, color: meine ? 'var(--th-accent)' : 'var(--th-text-muted)' }}>
                      <Icon name="user" size={12} /> {meine ? 'Du' : a.assignee_name}
                    </span>
                  )}
                </span>
                {darf && <button type="button" onClick={() => onWeg(a)} aria-label="Aufgabe löschen" title="Löschen" style={{ ...linkKnopf, color: 'var(--th-text-faint)' }}><Icon name="close" size={15} /></button>}
              </div>
            );
          })}
        </div>
      )}

      {/* Neue Aufgabe (nur TC) */}
      {darf && (
        <form onSubmit={async e => { e.preventDefault(); if (!titel.trim() || laeuft) return; setLaeuft(true); const p = personen.find(x => x.id === wer); if (await onNeu(titel, p ? { id: p.id, name: p.name } : null)) { setTitel(''); setWer(''); } setLaeuft(false); }}
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, padding: 8, borderRadius: 12, background: 'var(--th-bg-card3)', border: '1px dashed var(--th-line-18)' }}>
          <input value={titel} onChange={e => setTitel(e.target.value.slice(0, AUFGABE_MAX))} placeholder="Neue Aufgabe, z. B. Spielbericht mitbringen" aria-label="Neue Aufgabe" style={{ ...eingabe, flex: '1 1 200px' }} />
          <select value={wer} onChange={e => setWer(e.target.value)} aria-label="Zuständig" style={{ ...eingabe, flex: '1 1 130px', width: 'auto' }}>
            <option value="">für alle</option>
            {personen.filter(p => !p.id.startsWith('name:')).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button type="submit" disabled={!titel.trim() || laeuft} style={{ ...knopf(true), opacity: titel.trim() && !laeuft ? 1 : 0.45, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="plus" size={15} stroke={2.4} /> Hinzufügen</button>
        </form>
      )}
    </section>
  );
}

export function TreffzeitFeld({ eigene, vorgabe, onSpeichern }: { eigene: string | null; vorgabe: string | null; onSpeichern: (v: string | null) => void }) {
  const [wert, setWert] = useState(eigene ?? vorgabe ?? '');
  return (
    <section style={karte}>
      <h2 style={h2}>Treffen</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
        <input type="time" value={wert} onChange={e => setWert(e.target.value)} aria-label="Treffzeit"
          style={{ padding: '8px 10px', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)' }} />
        <button type="button" disabled={!wert || wert === (eigene ?? vorgabe)} onClick={() => onSpeichern(wert)} style={{ ...knopf(true), opacity: !wert || wert === (eigene ?? vorgabe) ? 0.45 : 1 }}>Speichern</button>
        {eigene && <button type="button" onClick={() => { setWert(vorgabe ?? ''); onSpeichern(null); }} style={knopf(false)}>Auf Vorgabe ({vorgabe ?? 'keins'})</button>}
      </div>
      <span style={leise}>Nur für dieses Spiel. Die Vorgabe fürs Team stellst du in der Übersicht ein.</span>
    </section>
  );
}

// Aufstellung wie auf dem Spielbericht: H1–H8 (Heim) bzw. G1–G8 (Gast),
// 1–4 Stamm, 5–8 Ersatz. Gespeichert als Liste mit 8 Plätzen (Index = Position,
// '' = frei). Nichts davon ist Pflicht — der Kapitän füllt, was schon feststeht.
const PLAETZE = 8;

export function Aufstellung({ heim, personen, zusagen, lineup, darf, onSpeichern }: {
  heim: boolean; personen: KaderOption[]; zusagen: Zusage[]; lineup: string[]; darf: boolean; onSpeichern: (l: string[]) => void;
}) {
  const auf8 = (l: string[]) => Array.from({ length: PLAETZE }, (_, i) => l[i] ?? '');
  const [bearbeiten, setBearbeiten] = useState(false);
  const [wahl, setWahl] = useState<string[]>(auf8(lineup));
  const pos = (i: number) => `${heim ? 'H' : 'G'}${i + 1}`;
  const name = (id: string) => personen.find(p => p.id === id)?.name ?? zusagen.find(z => z.player_id === id)?.player_name ?? 'Unbekannt';
  const status = (id: string) => zusagen.find(z => z.player_id === id)?.status;
  // Auswahl: alle Zusagen, dazu wer schon aufgestellt ist (falls er inzwischen abgesagt hat).
  const kandidaten = [...new Set([...zusagen.filter(z => z.status === 'yes').map(z => z.player_id), ...lineup.filter(Boolean)])];
  const besetzt = auf8(lineup).filter(Boolean).length;
  const hinweis = (id: string) => { const st = status(id); return st === 'yes' ? '' : ` (${st ? STATUS[st].text : 'offen'})`; };

  const zeile = (i: number, inhalt: React.ReactNode) => (
    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: i === 4 ? '1px dashed var(--th-line-18)' : '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)' }}>
      <span style={{ flexShrink: 0, width: 34, textAlign: 'center', padding: '3px 0', borderRadius: 6, fontWeight: 800, fontSize: 13, background: i < 4 ? 'var(--th-accent)' : 'var(--th-line-8)', color: i < 4 ? '#fff' : 'var(--th-text-body)' }}>{pos(i)}</span>
      {inhalt}
    </div>
  );

  return (
    <section style={karte}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={h2}>Aufstellung</h2>
        {darf && !bearbeiten && <button type="button" onClick={() => { setWahl(auf8(lineup)); setBearbeiten(true); }} style={{ ...knopf(false), padding: '6px 12px', fontSize: 12.5 }}>{besetzt ? 'Ändern' : 'Aufstellen'}</button>}
      </div>
      <span style={leise}>{pos(0)}–{pos(3)} Stamm · {pos(4)}–{pos(7)} Ersatz – wie auf dem Spielbericht. Muss nicht vorab komplett sein.</span>
      {bearbeiten ? (
        <>
          {!kandidaten.length && <span style={leise}>Noch keine Zusagen – aufstellen kannst du nur, wer zugesagt hat.</span>}
          {wahl.map((id, i) => zeile(i, (
            <select value={id} onChange={e => { const v = e.target.value; setWahl(w => w.map((x, j) => (j === i ? v : x))); }} aria-label={`Position ${pos(i)}`}
              style={{ flex: 1, minWidth: 0, padding: '7px 8px', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-manrope)', fontWeight: 700, background: 'var(--th-bg-header)', border: '1px solid var(--th-line-18)', color: id ? 'var(--th-text-strong)' : 'var(--th-text-faint)' }}>
              <option value="">– frei –</option>
              {kandidaten.map(k => (
                <option key={k} value={k} disabled={k !== id && wahl.includes(k)}>{name(k)}{hinweis(k)}{k !== id && wahl.includes(k) ? ` · auf ${pos(wahl.indexOf(k))}` : ''}</option>
              ))}
            </select>
          )))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => { const l = [...wahl]; while (l.length && !l[l.length - 1]) l.pop(); onSpeichern(l); setBearbeiten(false); }} style={knopf(true)}>Speichern ({wahl.filter(Boolean).length})</button>
            <button type="button" onClick={() => setBearbeiten(false)} style={knopf(false, 'var(--th-text-muted)')}>Abbrechen</button>
          </div>
        </>
      ) : besetzt ? (
        <div style={{ marginTop: 4 }}>
          {auf8(lineup).map((id, i) => zeile(i, id
            ? <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--th-text-strong)' }}>{name(id)}{status(id) !== 'yes' && <span style={{ fontSize: 12, fontWeight: 600, color: status(id) ? STATUS[status(id)!].farbe : 'var(--th-text-faint)' }}>{hinweis(id)}</span>}</span>
            : <span style={{ fontSize: 13, color: 'var(--th-text-faint)' }}>frei</span>))}
        </div>
      ) : (
        <span style={leise}>{darf ? 'Noch keine Aufstellung. Wähle aus den Zusagen aus.' : 'Der Kapitän hat noch nicht aufgestellt.'}</span>
      )}
    </section>
  );
}

const leise: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.5 };
const eingabe: React.CSSProperties = { display: 'block', width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 10, fontSize: 14, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)', resize: 'vertical' };
const linkKnopf: React.CSSProperties = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, display: 'inline-flex', alignItems: 'center' };
