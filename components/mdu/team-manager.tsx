'use client';

// ============================================================
// Mein Bereich → Zu- und Absagen (Saison 2026/27) — Übersicht
// ============================================================
//
// Je Spiel eine Kachel (Vorbild SpielerPlus): Datum, Heim/Auswärts, Gegner,
// Treffen/Beginn/Ende, Liga-Zeile und unten der Stand mit dem eigenen Status
// hervorgehoben. Antippen öffnet die Spieltag-Seite (/spieltag/[team]/[spiel],
// teilbar). Der Kapitän stellt hier Erinnerung und Treffen-Vorgabe ein.
// Vorerst nur freigeschaltete Teams (lib/features.ts). Daten: Migration 0043–0045.
// Dazu EIGENE Termine des Teams (Migration 0048): Spiele anderer Ligen und
// Sonstiges, vom TC eingetragen, violett mit „Extern“ — in derselben Liste
// nach Datum einsortiert.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { hatTcRecht } from '@/lib/auth/roles';
import { KapitaensTeam } from '@/components/mdu/kapitaens-team';
import { zusagenFreigeschaltet } from '@/lib/features';
import { PREMIUM_OEFFENTLICH, TESTTAGE } from '@/lib/premium';
import { alleBegegnungen27, team27, findLiga27, NEUE_SAISON, terminKurz, wochenendeText, type Begegnung27 } from '@/lib/data/saison-2027';
import { ladeKader, type KaderOption } from '@/lib/supabase/season-teams';
import {
  ladeZusagen, ladeEinstellungen, setzeEinstellung, ladeDetails, ladeAufgaben, setzeZusage, type Aufgabe, type ZusageStatus,
  ERINNERUNG_VORGABE, TREFFEN_VORGABE, type Zusage, type SpielDetails, type TeamEinstellungen,
} from '@/lib/supabase/zusagen';
import { SpielKachel } from '@/components/mdu/spiel-kachel';
import { TerminKachel, TerminFormular, EXTERN_FARBE, terminLabel } from '@/components/mdu/termin-ui';
import { TerminImport } from '@/components/mdu/termin-import';
import { sendeTeamNachricht, empfaengerText } from '@/lib/supabase/team-nachricht';
import { NachrichtAnsTeam } from '@/components/mdu/team-push';
import { ladeTermine, speichereTermin, importiereTermine, terminKey, type TeamTermin, type TerminEingabe } from '@/lib/supabase/termine';
import { karte, h2 as h2Karte } from '@/components/mdu/zusagen-ui';
import { Icon } from '@/components/mdu/icon';
import { TeamDashboard, type DashKasse, type DashGespielt } from '@/components/mdu/team-dashboard';
import { mitAnmeldung } from '@/lib/auth/mit-anmeldung';
import { ladeKasse, kassenstand, offenSumme, istForderung } from '@/lib/supabase/kasse';

const heuteIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const datumVon = (b: Begegnung27) => b.termin?.datum ?? b.fri;
const ERINNERUNG_OPTIONEN = [0, 1, 2, 3, 5, 7, 10, 14];
const TREFFEN_OPTIONEN = [0, 15, 30, 45, 60, 90];

/** Team Manager: `dashboard` (/mein-team/zusagen) oder `termine` (/mein-team/termine, die Terminliste). */
export function TeamManager({ ansicht }: { ansicht: 'dashboard' | 'termine' }) {
  const dash = ansicht === 'dashboard';
  const { user, loading } = useAuth();
  const teamId = user?.teamId ?? null;
  const t = teamId ? team27(teamId) : undefined;
  // Kapitän oder Co-Captain mit Recht „Team Manager“ (Migration 0062).
  const istKapitaen = !!teamId && hatTcRecht(user, teamId, 'team_manager');

  const [kader, setKader] = useState<KaderOption[] | null>(null);
  const [zusagen, setZusagen] = useState<Zusage[]>([]);
  const [details, setDetails] = useState<Record<string, SpielDetails>>({});
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [bereit, setBereit] = useState(true);
  const [einst, setEinst] = useState<TeamEinstellungen>({ reminder_days: ERINNERUNG_VORGABE, meet_minutes: TREFFEN_VORGABE });
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [alle, setAlle] = useState(false);
  const [termine, setTermine] = useState<TeamTermin[]>([]);
  const [termineBereit, setTermineBereit] = useState(false);
  const [neu, setNeu] = useState<null | 'eintragen' | 'import'>(null);
  const [kasse, setKasse] = useState<DashKasse | null>(null);
  const [gespielt, setGespielt] = useState<DashGespielt | null>(null);

  const laden = useCallback(async () => {
    if (!teamId) return;
    const [k, z, e, d, a, tr] = await Promise.all([ladeKader(NEUE_SAISON.id, teamId), ladeZusagen(teamId), ladeEinstellungen(teamId), ladeDetails(teamId), ladeAufgaben(teamId), ladeTermine(teamId)]);
    setKader(k); setAufgaben(a); setZusagen(z.rows); setBereit(z.bereit); setEinst(e); setDetails(d); setTermine(tr.rows); setTermineBereit(tr.bereit);
    if (z.error) setMsg({ kind: 'err', text: z.error });
    if (!dash) return;
    // „Gespielt“-Statistik aus den Spielberichten (Server, nur Zählungen).
    mitAnmeldung(`/api/team-statistik?team=${encodeURIComponent(teamId)}`)
      .then(r => (r.ok ? r.json() : null)).then(j => { if (j && typeof j.berichte === 'number') setGespielt(j as DashGespielt); }).catch(() => {});
    // Teamkasse fürs Dashboard (fehlt die Migration, bleibt die Kachel weg).
    const ka = await ladeKasse(teamId);
    if (ka.bereit && !ka.error) {
      const ich = user?.playerId ?? null;
      setKasse({
        stand: kassenstand(ka.buchungen, ka.einst.opening_cents),
        offen: offenSumme(ka.buchungen),
        meinOffen: ich ? ka.buchungen.filter(b => istForderung(b) && !b.paid_at && b.player_key === ich).reduce((x, b) => x + b.amount_cents, 0) : null,
      });
    }
  }, [teamId, user?.playerId, dash]);

  useEffect(() => { queueMicrotask(() => { void laden(); }); }, [laden]);

  // MDU-Spiele (Code) und eigene Termine (DB) in EINER Liste nach Datum + Uhrzeit.
  const spiele = useMemo<Eintrag[]>(() => {
    if (!teamId) return [];
    const heute = heuteIso();
    const mdu: Eintrag[] = alleBegegnungen27()
      .filter(b => (b.home === teamId || b.away === teamId) && (b.termin?.datum ?? b.sun) >= heute)
      .map(b => ({ art: 'mdu', key: b.key, datum: datumVon(b), zeit: b.termin?.uhrzeit ?? '', b }));
    const ext: Eintrag[] = termine.filter(t => t.event_date >= heute)
      .map(t => ({ art: 'ext', key: terminKey(t.id), datum: t.event_date, zeit: t.start_time ?? '', t }));
    return [...mdu, ...ext].sort((a, b) => a.datum.localeCompare(b.datum) || a.zeit.localeCompare(b.zeit));
  }, [teamId, termine]);

  // Eigene Zu-/Absage direkt aus dem Dashboard (gleiche Regeln wie auf der Spielseite).
  async function antworte(key: string, status: ZusageStatus, note: string | null): Promise<string | null> {
    if (!user?.playerId || !teamId || !t) return 'Dein Konto ist noch nicht mit einem Spieler verknüpft.';
    const e = spiele.find(x => x.key === key);
    if (!e) return 'Termin nicht gefunden.';
    const label = e.art === 'mdu'
      ? `${e.b.termin ? terminKurz(e.b.termin) : wochenendeText(e.b.fri, e.b.sun, false)} · ${team27(e.b.home)?.name ?? e.b.home} – ${team27(e.b.away)?.name ?? e.b.away}`
      : terminLabel(e.t);
    const ich = { id: user.playerId, name: user.displayName };
    const vorher = zusagen;
    setZusagen(z => [...z.filter(r => !(r.match_key === key && r.player_id === ich.id)),
      { match_key: key, team_id: teamId, player_id: ich.id, player_name: ich.name, status, note, updated_by: user.id, updated_at: new Date().toISOString() }]);
    const { error } = await setzeZusage({ matchKey: key, teamId, playerId: ich.id, playerName: ich.name, status, note, label, userId: user.id });
    if (error) setZusagen(vorher);
    return error;
  }

  // Vergangene Termine der Saison (für die Zusage-Quote im Dashboard).
  const vergangen = useMemo<string[]>(() => {
    if (!teamId) return [];
    const heute = heuteIso();
    return [
      ...alleBegegnungen27().filter(b => (b.home === teamId || b.away === teamId) && datumVon(b) < heute).map(b => b.key),
      ...termine.filter(t => t.event_date < heute).map(t => terminKey(t.id)),
    ];
  }, [teamId, termine]);

  async function terminNeu(e: Parameters<typeof speichereTermin>[1], team: boolean) {
    if (!user || !teamId) return false;
    const { data, error } = await speichereTermin(teamId, e, user.id);
    if (error || !data) { setMsg({ kind: 'err', text: error ?? 'Konnte nicht speichern.' }); return false; }
    setTermine(l => [...l, data]); setNeu(null);
    const basis = 'Termin eingetragen – dein Team kann jetzt zu- oder absagen.';
    setMsg({ kind: 'ok', text: basis });
    if (team) {
      const r = await sendeTeamNachricht(teamId, { art: 'termin_neu', terminId: data.id });
      setMsg(r.error ? { kind: 'err', text: `${basis} Benachrichtigung hat nicht geklappt: ${r.error}` } : { kind: 'ok', text: `${basis} ${empfaengerText(r.empfaenger)}` });
    }
    return true;
  }

  async function termineImport(liste: TerminEingabe[], team: boolean) {
    if (!user || !teamId) return false;
    const { data, error } = await importiereTermine(teamId, liste, user.id);
    if (error) { setMsg({ kind: 'err', text: error }); return false; }
    setTermine(l => [...l, ...data]); setNeu(null);
    const basis = `${data.length} ${data.length === 1 ? 'Termin' : 'Termine'} importiert – dein Team kann jetzt zu- oder absagen.`;
    setMsg({ kind: 'ok', text: basis });
    if (team && data.length) {
      const r = await sendeTeamNachricht(teamId, { art: 'termine_neu', anzahl: data.length });
      setMsg(r.error ? { kind: 'err', text: `${basis} Benachrichtigung hat nicht geklappt: ${r.error}` } : { kind: 'ok', text: `${basis} ${empfaengerText(r.empfaenger)}` });
    }
    return true;
  }

  async function aendere(werte: Partial<TeamEinstellungen>, ok: string) {
    if (!user || !teamId) return;
    const alt = einst;
    setEinst(e => ({ ...e, ...werte }));
    const { error } = await setzeEinstellung(teamId, werte, user.id);
    if (error) { setEinst(alt); setMsg({ kind: 'err', text: error }); } else setMsg({ kind: 'ok', text: ok });
  }

  const sichtbar = alle ? spiele : spiele.slice(0, 4);
  const anzahlKader = (kader?.length ?? 0) + (user?.playerId && kader && !kader.some(k => k.id === user.playerId) ? 1 : 0);
  // Kader + ich (falls nicht im Kader) — für die Namen hinter den Zahlen der Kacheln.
  const ichId = user?.playerId ?? null;
  const ichName = user?.displayName ?? '';
  const personen = useMemo(() => {
    if (!kader) return undefined;
    const l = kader.map(k => ({ id: k.id, name: k.name }));
    if (ichId && !l.some(p => p.id === ichId)) l.push({ id: ichId, name: ichName });
    return l;
  }, [kader, ichId, ichName]);

  return (
    <MemberShell title={dash ? 'Team Manager' : 'Termine'}>
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Dieser Bereich ist nur für angemeldete Mitglieder.{' '}<LoginLink /></Notice>
        : !zusagenFreigeschaltet(user) ? (
          <Notice title="Noch nicht freigeschaltet">
            {PREMIUM_OEFFENTLICH
              ? <>Dein Team hat den Team Manager noch nicht.{' '}<Link href="/mein-team/premium" style={{ color: 'var(--th-accent)', fontWeight: 800 }}>{TESTTAGE} Tage gratis testen oder buchen →</Link></>
              : 'Der Team Manager wird gerade erprobt und ist für dein Team noch nicht verfügbar. Er soll später als Premium-Funktion angeboten werden.'}
          </Notice>
        ) : !teamId || !t ? (
          <Notice title="Kein Team verknüpft">
            Deinem Konto ist noch kein Team der {NEUE_SAISON.name} zugeordnet. Bei Fragen melde dich bei der Ligaleitung.
          </Notice>
        ) : !bereit ? (
          <Notice title="Gleich startklar">Der Team Manager wird gerade eingerichtet. Schau bitte etwas später noch mal vorbei.</Notice>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
            {msg && (
              <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`, color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{msg.text}</div>
            )}

            {dash ? (
            <TeamDashboard teamId={teamId} teamName={t.name} liga={findLiga27(t.league)?.name ?? ''} spiele={spiele} vergangen={vergangen}
              zusagen={zusagen} personen={personen ?? []} ichId={user.playerId ?? null} ichName={user.displayName ?? ''}
              aufgaben={aufgaben} kasse={kasse} gespielt={gespielt} onAntwort={antworte} />
            ) : null}
            {dash && istKapitaen && <NachrichtAnsTeam teamId={teamId} />}
            {dash && <KapitaensTeam teamId={teamId} />}
            {dash ? null : (<>
            <Link href="/mein-team/zusagen" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)', textDecoration: 'none' }}><Icon name="chevron" size={12} style={{ transform: 'rotate(180deg)' }} /> Team Manager</Link>

            {istKapitaen && (
              <details className="mdu-einst" style={{ ...karte, padding: 0, overflow: 'hidden' }}>
                <summary style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', listStyle: 'none' }}>
                  <span style={iconKreis}><Icon name="settings" size={17} /></span>
                  <span style={{ flex: 1 }}>
                    <span style={{ ...h2Karte, display: 'block' }}>Einstellungen fürs Team</span>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>
                      Erinnerung {einst.reminder_days ? `${einst.reminder_days} ${einst.reminder_days === 1 ? 'Tag' : 'Tage'} vorher${einst.email_reminder ? ' + Mail' : ''}` : 'aus'} · Treffen {einst.meet_minutes ? `${einst.meet_minutes} Min. vorher` : 'keins'}
                    </span>
                  </span>
                  <Icon name="chevron-down" size={16} className="mdu-einst-pfeil" style={{ color: 'var(--th-text-muted)', transition: 'transform 160ms ease' }} />
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px 16px' }}>
                  <EinstZeile icon="bell" titel="Erinnerung in der Glocke" text="Offene Spieler bekommen ab dann einen Hinweis.">
                    <select value={einst.reminder_days} aria-label="Erinnerung" onChange={e => { const n = Number(e.target.value); void aendere({ reminder_days: n }, n ? `Erinnerung kommt jetzt ${n} ${n === 1 ? 'Tag' : 'Tage'} vor dem Spiel.` : 'Erinnerung ist ausgeschaltet.'); }} style={auswahl}>
                      {ERINNERUNG_OPTIONEN.map(n => <option key={n} value={n}>{n === 0 ? 'aus' : `${n} ${n === 1 ? 'Tag' : 'Tage'} vorher`}</option>)}
                    </select>
                  </EinstZeile>
                  <EinstZeile icon="meet" titel="Treffen (Vorgabe)" text="Je Spiel auf der Spielseite änderbar.">
                    <select value={einst.meet_minutes} aria-label="Treffen" onChange={e => { const n = Number(e.target.value); void aendere({ meet_minutes: n }, n ? `Treffen jetzt ${n} Min. vor Beginn (je Spiel änderbar).` : 'Kein Treffpunkt mehr angezeigt.'); }} style={auswahl}>
                      {TREFFEN_OPTIONEN.map(n => <option key={n} value={n}>{n === 0 ? 'kein Treffen' : `${n} Min. vorher`}</option>)}
                    </select>
                  </EinstZeile>
                  {einst.email_moeglich && (
                    <EinstZeile icon="mail" titel="E-Mail-Erinnerung" text="Wer noch offen ist, bekommt zusätzlich eine Mail – im selben Zeitraum wie die Glocke, je Termin einmal. Jeder kann sich selbst abmelden.">
                      <select value={einst.email_reminder ? 'an' : 'aus'} aria-label="E-Mail-Erinnerung" onChange={e => { const an = e.target.value === 'an'; void aendere({ email_reminder: an }, an ? (einst.reminder_days ? 'E-Mail-Erinnerung ist an – offene Spieler bekommen eine Mail.' : 'E-Mail-Erinnerung ist an – sie kommt aber erst, wenn auch die Erinnerung eingeschaltet ist.') : 'E-Mail-Erinnerung ist aus.'); }} style={auswahl}>
                        <option value="aus">aus</option>
                        <option value="an">an</option>
                      </select>
                    </EinstZeile>
                  )}
                  <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', lineHeight: 1.5, marginTop: 2 }}>Du bekommst jede Zu- und Absage in die Glocke.</span>
                </div>
                <style>{'.mdu-einst summary::-webkit-details-marker{display:none}.mdu-einst[open] .mdu-einst-pfeil{transform:rotate(180deg)}'}</style>
              </details>
            )}

            {istKapitaen && termineBereit && (neu === 'eintragen' ? (
              <TerminFormular titel="Termin eintragen" onSpeichern={terminNeu} onAbbrechen={() => setNeu(null)} />
            ) : neu === 'import' ? (
              <TerminImport teamName={t.name} vorhanden={termine} onImport={termineImport} onAbbrechen={() => setNeu(null)} />
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { setNeu('eintragen'); setMsg(null); }} style={{ ...neuKnopf, flex: '2 1 240px' }}>
                  <span style={{ ...iconKreis, background: `${EXTERN_FARBE}22`, color: EXTERN_FARBE }}><Icon name="plus" size={18} stroke={2.4} /></span>
                  <span style={{ flex: 1, fontFamily: 'var(--font-manrope)' }}>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 14 }}>Termin eintragen</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--th-text-muted)' }}>Spiele anderer Ligen, Pokal, Training, Teamabend …</span>
                  </span>
                </button>
                <button type="button" onClick={() => { setNeu('import'); setMsg(null); }} style={{ ...neuKnopf, flex: '1 1 160px' }}>
                  <span style={{ ...iconKreis, background: `${EXTERN_FARBE}22`, color: EXTERN_FARBE }}><Icon name="upload" size={17} stroke={2.2} /></span>
                  <span style={{ flex: 1, fontFamily: 'var(--font-manrope)' }}>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 14 }}>Importieren</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--th-text-muted)' }}>Viele auf einmal aus Excel</span>
                  </span>
                </button>
              </div>
            ))}

            <h2 style={h2}>{spiele.length ? 'Nächster Termin' : 'Keine anstehenden Termine'}</h2>
            {sichtbar.map((x, i) => (
              <div key={x.key}>
                {i === 1 && <h2 style={{ ...h2, margin: '8px 0 12px' }}>Weitere Termine</h2>}
                {x.art === 'mdu' ? (
                  <SpielKachel b={x.b} teamId={teamId} liga={findLiga27(t.league)?.name ?? ''}
                    zusagen={zusagen.filter(z => z.match_key === x.key)} kaderAnzahl={anzahlKader}
                    ichId={user.playerId ?? null} treffenMin={einst.meet_minutes} meetTime={details[x.key]?.meet_time ?? null}
                    notiz={details[x.key]?.note ?? null} aufgaben={aufgaben.filter(a => a.match_key === x.key)} personen={personen}
                    onAntwort={(st, note) => antworte(x.key, st, note)} />
                ) : (
                  <TerminKachel t={x.t} teamId={teamId}
                    zusagen={zusagen.filter(z => z.match_key === x.key)} kaderAnzahl={anzahlKader}
                    ichId={user.playerId ?? null} treffenMin={einst.meet_minutes} meetTime={details[x.key]?.meet_time ?? null}
                    notiz={details[x.key]?.note ?? null} aufgaben={aufgaben.filter(a => a.match_key === x.key)} personen={personen}
                    onAntwort={(st, note) => antworte(x.key, st, note)} />
                )}
              </div>
            ))}

            {spiele.length > 4 && (
              <button type="button" onClick={() => setAlle(a => !a)} style={{ alignSelf: 'center', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, border: '1.5px solid var(--th-accent)', background: 'transparent', color: 'var(--th-accent)' }}>
                {alle ? 'Weniger anzeigen' : `Alle ${spiele.length} Termine anzeigen`}
              </button>
            )}
            <Muted>Spielplan deines Teams: <Link href="/mein-team/spielplan" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Mein Spielplan</Link></Muted>
            </>)}
          </div>
        )}
    </MemberShell>
  );
}

type Eintrag = { key: string; datum: string; zeit: string } & ({ art: 'mdu'; b: Begegnung27 } | { art: 'ext'; t: TeamTermin });

const h2: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: 0 };
const auswahl: React.CSSProperties = { padding: '8px 12px', borderRadius: 999, fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-card)', border: '1.5px solid var(--th-accent)', color: 'var(--th-accent)', cursor: 'pointer' };
const neuKnopf: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left', background: 'var(--th-bg-card)', border: `1.5px dashed ${EXTERN_FARBE}`, color: 'var(--th-text-strong)' };
const iconKreis: React.CSSProperties = { width: 34, height: 34, borderRadius: 999, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--th-accent-a12)', color: 'var(--th-accent)' };

function EinstZeile({ icon, titel, text, children }: { icon: string; titel: string; text: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 12px', borderRadius: 12, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)' }}>
      <span style={iconKreis}><Icon name={icon} size={16} /></span>
      <span style={{ flex: '1 1 150px', minWidth: 0, fontFamily: 'var(--font-manrope)' }}>
        <span style={{ display: 'block', fontWeight: 800, fontSize: 13.5, color: 'var(--th-text-strong)' }}>{titel}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--th-text-muted)' }}>{text}</span>
      </span>
      {children}
    </div>
  );
}
