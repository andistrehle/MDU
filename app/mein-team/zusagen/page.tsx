'use client';

// ============================================================
// Mein Bereich → Zu- und Absagen (Saison 2026/27)
// ============================================================
//
// Für alle Mitglieder mit Team: die nächsten Spiele des Teams, eigene Zu- oder
// Absage mit kurzer Notiz und der Stand im Team (Namen + Status). Der Kapitän
// (und die Ligaleitung) setzt zusätzlich den Status für jeden im Kader — auch
// für Spieler ohne Konto — und stellt ein, ab wann die Erinnerung in der Glocke
// erscheint. Keine Zeile = „offen“; keine harte Frist (Vorgabe des Betreibers).
// Daten + Rechte: Migration 0043, lib/supabase/zusagen.ts.
// Nominierung kommt im nächsten Schritt (docs/BACKLOG.md).
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canEditTeam } from '@/lib/auth/roles';
import { zusagenFreigeschaltet } from '@/lib/features';
import { alleBegegnungen27, team27, venue27, terminKurz, wochenendeText, NEUE_SAISON, type Begegnung27 } from '@/lib/data/saison-2027';
import { ladeKader, type KaderOption } from '@/lib/supabase/season-teams';
import {
  ladeZusagen, setzeZusage, ladeErinnerung, setzeErinnerung,
  NOTIZ_MAX, ERINNERUNG_VORGABE, type Zusage, type ZusageStatus,
} from '@/lib/supabase/zusagen';

const heuteIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const datumVon = (b: Begegnung27) => b.termin?.datum ?? b.fri;
const terminText = (b: Begegnung27) => (b.termin ? `${terminKurz(b.termin)}${b.termin.uhrzeit ? ' Uhr' : ''}` : `Wochenende ${wochenendeText(b.fri, b.sun, false)}`);
const labelVon = (b: Begegnung27) => `${b.termin ? terminKurz(b.termin) : wochenendeText(b.fri, b.sun, false)} · ${team27(b.home)?.name ?? b.home} – ${team27(b.away)?.name ?? b.away}`;

const ERINNERUNG_OPTIONEN = [0, 1, 2, 3, 5, 7, 10, 14];

export default function ZusagenPage() {
  const { user, loading } = useAuth();
  const teamId = user?.teamId ?? null;
  const t = teamId ? team27(teamId) : undefined;
  const istKapitaen = !!teamId && canEditTeam(user, teamId);

  const [kader, setKader] = useState<KaderOption[] | null>(null);
  const [zusagen, setZusagen] = useState<Zusage[]>([]);
  const [bereit, setBereit] = useState(true);
  const [erinnerung, setErinnerungState] = useState(ERINNERUNG_VORGABE);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [alle, setAlle] = useState(false);

  const laden = useCallback(async () => {
    if (!teamId) return;
    const [k, z, e] = await Promise.all([ladeKader(NEUE_SAISON.id, teamId), ladeZusagen(teamId), ladeErinnerung(teamId)]);
    setKader(k); setZusagen(z.rows); setBereit(z.bereit); setErinnerungState(e);
    if (z.error) setMsg({ kind: 'err', text: z.error });
  }, [teamId]);

  useEffect(() => { queueMicrotask(() => { void laden(); }); }, [laden]);

  const spiele = useMemo(() => {
    if (!teamId) return [];
    const heute = heuteIso();
    return alleBegegnungen27()
      .filter(b => (b.home === teamId || b.away === teamId) && (b.termin?.datum ?? b.sun) >= heute)
      .sort((a, b) => datumVon(a).localeCompare(datumVon(b)) || (a.termin?.uhrzeit ?? '').localeCompare(b.termin?.uhrzeit ?? ''));
  }, [teamId]);

  // Kader + ggf. der eigene Eintrag, falls der Spieler (noch) nicht im Kader steht.
  const personen: KaderOption[] = [...(kader ?? [])];
  if (user?.playerId && !personen.some(p => p.id === user.playerId)) {
    personen.push({ id: user.playerId, name: user.displayName, isCaptain: false, passNo: null });
  }

  async function setze(b: Begegnung27, p: { id: string; name: string }, status: ZusageStatus | null, note?: string | null) {
    if (!user || !teamId) return;
    setMsg(null);
    const vorher = zusagen;
    // Sofort anzeigen, bei Fehler zurücknehmen.
    setZusagen(z => {
      const rest = z.filter(r => !(r.match_key === b.key && r.player_id === p.id));
      return status ? [...rest, { match_key: b.key, team_id: teamId, player_id: p.id, player_name: p.name, status, note: note ?? null, updated_by: user.id, updated_at: new Date().toISOString() }] : rest;
    });
    const { error } = await setzeZusage({ matchKey: b.key, teamId, playerId: p.id, playerName: p.name, status, note, label: labelVon(b), userId: user.id });
    if (error) { setZusagen(vorher); setMsg({ kind: 'err', text: error }); }
  }

  async function onErinnerung(tage: number) {
    if (!user || !teamId) return;
    const alt = erinnerung;
    setErinnerungState(tage);
    const { error } = await setzeErinnerung(teamId, tage, user.id);
    if (error) { setErinnerungState(alt); setMsg({ kind: 'err', text: error }); }
    else setMsg({ kind: 'ok', text: tage ? `Erinnerung kommt jetzt ${tage} ${tage === 1 ? 'Tag' : 'Tage'} vor dem Spiel.` : 'Erinnerung in der Glocke ist für dein Team ausgeschaltet.' });
  }

  const sichtbar = alle ? spiele : spiele.slice(0, 4);

  return (
    <MemberShell title="Zu- und Absagen">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Dieser Bereich ist nur für angemeldete Mitglieder.{' '}<LoginLink /></Notice>
        : !zusagenFreigeschaltet(user) ? (
          <Notice title="Noch nicht freigeschaltet">Diese Funktion wird gerade erprobt und ist für dein Team noch nicht verfügbar.</Notice>
        ) : !teamId || !t ? (
          <Notice title="Kein Team verknüpft">
            Deinem Konto ist noch kein Team der {NEUE_SAISON.name} zugeordnet. Bei Fragen melde dich bei der Ligaleitung.
          </Notice>
        ) : !bereit ? (
          <Notice title="Gleich startklar">Die Zu- und Absagen werden gerade eingerichtet. Schau bitte etwas später noch mal vorbei.</Notice>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-muted)', lineHeight: 1.55, margin: 0 }}>
              Sag für jedes Spiel von <b style={{ color: 'var(--th-text-strong)' }}>{t.name}</b> zu oder ab, damit {istKapitaen ? 'du' : 'dein Kapitän'} planen kann{istKapitaen ? 'st' : ''}. Ändern geht jederzeit bis Spielbeginn.
            </p>

            {msg && (
              <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`, color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{msg.text}</div>
            )}

            {istKapitaen && (
              <div style={karte}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13.5, color: 'var(--th-text-strong)' }}>🔔 Erinnerung in der Glocke</span>
                  <select value={erinnerung} onChange={e => void onErinnerung(Number(e.target.value))} aria-label="Erinnerung für offene Zu-/Absagen"
                    style={{ padding: '7px 10px', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)' }}>
                    {ERINNERUNG_OPTIONEN.map(n => <option key={n} value={n}>{n === 0 ? 'aus' : `${n} ${n === 1 ? 'Tag' : 'Tage'} vor dem Spiel`}</option>)}
                  </select>
                </div>
                <Muted>Wer für ein Spiel noch offen ist, sieht ab dann einen Hinweis in seiner Glocke. Du bekommst jede Zu- und Absage deiner Spieler in die Glocke.</Muted>
              </div>
            )}

            {!spiele.length && <Notice title="Keine anstehenden Spiele">Für dein Team steht diese Saison kein Spiel mehr an.</Notice>}

            {sichtbar.map(b => {
              const heim = b.home === teamId;
              const gegner = team27(heim ? b.away : b.home)?.name ?? '';
              const ort = venue27(team27(b.home)?.venueId)?.name;
              const zuB = zusagen.filter(z => z.match_key === b.key);
              const statusVon = (id: string) => zuB.find(z => z.player_id === id);
              const ja = personen.filter(p => statusVon(p.id)?.status === 'yes');
              const nein = personen.filter(p => statusVon(p.id)?.status === 'no');
              const offen = personen.filter(p => !statusVon(p.id));
              const ich = user.playerId ? personen.find(p => p.id === user.playerId) : undefined;
              const meins = ich ? statusVon(ich.id) : undefined;
              return (
                <div key={b.key} style={karte}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>
                      {terminText(b)}{b.termin?.vorlaeufig && <span style={{ color: '#9A6B00', fontWeight: 700 }}> (wird geprüft)</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700 }}>
                      <span style={{ color: 'var(--th-win)' }}>✓ {ja.length}</span>{'  ·  '}
                      <span style={{ color: '#C0392B' }}>✗ {nein.length}</span>{'  ·  '}
                      <span style={{ color: 'var(--th-text-faint)' }}>? {offen.length}</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 15, fontWeight: 800, color: 'var(--th-text-strong)', marginTop: 4 }}>
                    <span style={{ ...badge, background: heim ? 'var(--th-accent)' : 'var(--th-line-8)', color: heim ? '#fff' : 'var(--th-text-muted)' }}>{heim ? 'H' : 'A'}</span>{' '}
                    {heim ? 'gegen' : 'bei'} {gegner}
                  </div>
                  <Muted>{b.spieltag}. Spieltag{ort ? ` · ${ort}` : ''}{b.derby ? ' · Derby' : ''}</Muted>

                  {ich && <MeineAntwort key={meins?.updated_at ?? 'offen'} z={meins} onSetze={(s, n) => setze(b, ich, s, n)} />}

                  <details open={istKapitaen} style={{ marginTop: 10 }}>
                    <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, color: 'var(--th-accent)' }}>Team ({personen.length})</summary>
                    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 6 }}>
                      {kader === null ? <Muted>Lade Kader …</Muted> : personen.map(p => {
                        const z = statusVon(p.id);
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid var(--th-line-4)', flexWrap: 'wrap' }}>
                            <span style={{ ...punkt, background: z?.status === 'yes' ? 'var(--th-win)' : z?.status === 'no' ? '#C0392B' : 'var(--th-line-18)' }} aria-hidden />
                            <span style={{ flex: '1 1 160px', minWidth: 0, fontFamily: 'var(--font-manrope)', fontSize: 13.5, fontWeight: 700, color: 'var(--th-text-strong)' }}>
                              {p.name}{p.isCaptain ? ' (TC)' : ''}
                              <span style={{ fontWeight: 600, color: z?.status === 'yes' ? 'var(--th-win)' : z?.status === 'no' ? '#C0392B' : 'var(--th-text-faint)', fontSize: 12.5 }}>
                                {' · '}{z?.status === 'yes' ? 'zugesagt' : z?.status === 'no' ? 'abgesagt' : 'offen'}
                              </span>
                              {z?.note && <span style={{ display: 'block', fontWeight: 500, fontSize: 12.5, color: 'var(--th-text-muted)' }}>„{z.note}“</span>}
                            </span>
                            {istKapitaen && (
                              <span style={{ display: 'flex', gap: 6 }}>
                                <button type="button" onClick={() => void setze(b, p, 'yes', z?.note)} style={klein(z?.status === 'yes', 'var(--th-win)')} title="Zusage setzen">✓</button>
                                <button type="button" onClick={() => void setze(b, p, 'no', z?.note)} style={klein(z?.status === 'no', '#C0392B')} title="Absage setzen">✗</button>
                                <button type="button" onClick={() => void setze(b, p, null)} disabled={!z} style={{ ...klein(false, 'var(--th-text-muted)'), opacity: z ? 1 : 0.4 }} title="Zurück auf offen">↺</button>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </div>
              );
            })}

            {spiele.length > 4 && (
              <button type="button" onClick={() => setAlle(a => !a)} style={{ alignSelf: 'flex-start', ...knopf(false) }}>
                {alle ? 'Nur die nächsten Spiele' : `Alle ${spiele.length} Spiele anzeigen`}
              </button>
            )}
            <Muted>Spielplan deines Teams: <Link href="/mein-team/spielplan" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Mein Spielplan</Link></Muted>
          </div>
        )}
    </MemberShell>
  );
}

/** Eigene Zu-/Absage mit Notiz. */
function MeineAntwort({ z, onSetze }: { z?: Zusage; onSetze: (s: ZusageStatus | null, note: string | null) => void | Promise<void> }) {
  const [notiz, setNotiz] = useState(z?.note ?? '');
  const [offenNotiz, setOffenNotiz] = useState(!!z?.note);
  return (
    <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)' }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 800, color: 'var(--th-text-body)', marginBottom: 8 }}>
        Du: {z?.status === 'yes' ? <span style={{ color: 'var(--th-win)' }}>zugesagt</span> : z?.status === 'no' ? <span style={{ color: '#C0392B' }}>abgesagt</span> : <span style={{ color: 'var(--th-text-faint)' }}>noch offen</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={() => void onSetze('yes', notiz)} style={knopf(z?.status === 'yes', 'var(--th-win)')}>✓ Zusagen</button>
        <button type="button" onClick={() => void onSetze('no', notiz)} style={knopf(z?.status === 'no', '#C0392B')}>✗ Absagen</button>
        {!offenNotiz && <button type="button" onClick={() => setOffenNotiz(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5 }}>+ Notiz</button>}
      </div>
      {offenNotiz && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <input value={notiz} onChange={e => setNotiz(e.target.value.slice(0, NOTIZ_MAX))} maxLength={NOTIZ_MAX}
            placeholder="z. B. komme 30 Min. später" aria-label="Notiz zur Zu-/Absage"
            style={{ flex: '1 1 220px', padding: '8px 10px', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-18)', color: 'var(--th-text-strong)' }} />
          {z && <button type="button" onClick={() => void onSetze(z.status, notiz)} style={knopf(false)}>Notiz speichern</button>}
        </div>
      )}
    </div>
  );
}

const karte: React.CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4 };
const badge: React.CSSProperties = { display: 'inline-block', width: 22, textAlign: 'center', padding: '2px 0', borderRadius: 5, fontSize: 11, fontWeight: 800, verticalAlign: '2px' };
const punkt: React.CSSProperties = { width: 10, height: 10, borderRadius: 999, flexShrink: 0 };

function knopf(aktiv: boolean, farbe = 'var(--th-accent)'): React.CSSProperties {
  return {
    padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
    border: `1.5px solid ${farbe}`, background: aktiv ? farbe : 'transparent', color: aktiv ? '#fff' : farbe,
  };
}
function klein(aktiv: boolean, farbe: string): React.CSSProperties {
  return {
    width: 34, height: 30, borderRadius: 7, cursor: 'pointer', fontSize: 14, fontWeight: 800,
    border: `1.5px solid ${farbe}`, background: aktiv ? farbe : 'transparent', color: aktiv ? '#fff' : farbe,
  };
}
