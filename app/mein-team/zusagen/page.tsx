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
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canEditTeam } from '@/lib/auth/roles';
import { zusagenFreigeschaltet } from '@/lib/features';
import { alleBegegnungen27, team27, findLiga27, NEUE_SAISON, type Begegnung27 } from '@/lib/data/saison-2027';
import { ladeKader, type KaderOption } from '@/lib/supabase/season-teams';
import {
  ladeZusagen, ladeEinstellungen, setzeEinstellung, ladeDetails, ladeAufgaben, type Aufgabe,
  ERINNERUNG_VORGABE, TREFFEN_VORGABE, type Zusage, type SpielDetails, type TeamEinstellungen,
} from '@/lib/supabase/zusagen';
import { SpielKachel } from '@/components/mdu/spiel-kachel';
import { karte, h2 as h2Karte } from '@/components/mdu/zusagen-ui';
import { Icon } from '@/components/mdu/icon';

const heuteIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const datumVon = (b: Begegnung27) => b.termin?.datum ?? b.fri;
const ERINNERUNG_OPTIONEN = [0, 1, 2, 3, 5, 7, 10, 14];
const TREFFEN_OPTIONEN = [0, 15, 30, 45, 60, 90];

export default function ZusagenPage() {
  const { user, loading } = useAuth();
  const teamId = user?.teamId ?? null;
  const t = teamId ? team27(teamId) : undefined;
  const istKapitaen = !!teamId && canEditTeam(user, teamId);

  const [kader, setKader] = useState<KaderOption[] | null>(null);
  const [zusagen, setZusagen] = useState<Zusage[]>([]);
  const [details, setDetails] = useState<Record<string, SpielDetails>>({});
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [bereit, setBereit] = useState(true);
  const [einst, setEinst] = useState<TeamEinstellungen>({ reminder_days: ERINNERUNG_VORGABE, meet_minutes: TREFFEN_VORGABE });
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [alle, setAlle] = useState(false);

  const laden = useCallback(async () => {
    if (!teamId) return;
    const [k, z, e, d, a] = await Promise.all([ladeKader(NEUE_SAISON.id, teamId), ladeZusagen(teamId), ladeEinstellungen(teamId), ladeDetails(teamId), ladeAufgaben(teamId)]);
    setKader(k); setAufgaben(a); setZusagen(z.rows); setBereit(z.bereit); setEinst(e); setDetails(d);
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

  async function aendere(werte: Partial<TeamEinstellungen>, ok: string) {
    if (!user || !teamId) return;
    const alt = einst;
    setEinst(e => ({ ...e, ...werte }));
    const { error } = await setzeEinstellung(teamId, werte, user.id);
    if (error) { setEinst(alt); setMsg({ kind: 'err', text: error }); } else setMsg({ kind: 'ok', text: ok });
  }

  const sichtbar = alle ? spiele : spiele.slice(0, 4);
  const anzahlKader = (kader?.length ?? 0) + (user?.playerId && kader && !kader.some(k => k.id === user.playerId) ? 1 : 0);

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
            {msg && (
              <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`, color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{msg.text}</div>
            )}

            {istKapitaen && (
              <details className="mdu-einst" style={{ ...karte, padding: 0, overflow: 'hidden' }}>
                <summary style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', listStyle: 'none' }}>
                  <span style={iconKreis}><Icon name="settings" size={17} /></span>
                  <span style={{ flex: 1 }}>
                    <span style={{ ...h2Karte, display: 'block' }}>Einstellungen fürs Team</span>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>
                      Erinnerung {einst.reminder_days ? `${einst.reminder_days} ${einst.reminder_days === 1 ? 'Tag' : 'Tage'} vorher` : 'aus'} · Treffen {einst.meet_minutes ? `${einst.meet_minutes} Min. vorher` : 'keins'}
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
                  <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', lineHeight: 1.5, marginTop: 2 }}>Du bekommst jede Zu- und Absage in die Glocke.</span>
                </div>
                <style>{'.mdu-einst summary::-webkit-details-marker{display:none}.mdu-einst[open] .mdu-einst-pfeil{transform:rotate(180deg)}'}</style>
              </details>
            )}

            <h2 style={h2}>{spiele.length ? 'Nächster Termin' : 'Keine anstehenden Spiele'}</h2>
            {sichtbar.map((b, i) => (
              <div key={b.key}>
                {i === 1 && <h2 style={{ ...h2, margin: '8px 0 12px' }}>Weitere Termine</h2>}
                <SpielKachel b={b} teamId={teamId} liga={findLiga27(t.league)?.name ?? ''}
                  zusagen={zusagen.filter(z => z.match_key === b.key)} kaderAnzahl={anzahlKader}
                  ichId={user.playerId ?? null} treffenMin={einst.meet_minutes} meetTime={details[b.key]?.meet_time ?? null}
                  notiz={details[b.key]?.note ?? null} aufgaben={aufgaben.filter(x => x.match_key === b.key)} />
              </div>
            ))}

            {spiele.length > 4 && (
              <button type="button" onClick={() => setAlle(a => !a)} style={{ alignSelf: 'center', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, border: '1.5px solid var(--th-accent)', background: 'transparent', color: 'var(--th-accent)' }}>
                {alle ? 'Weniger anzeigen' : `Alle ${spiele.length} Spiele anzeigen`}
              </button>
            )}
            <Muted>Spielplan deines Teams: <Link href="/mein-team/spielplan" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Mein Spielplan</Link></Muted>
          </div>
        )}
    </MemberShell>
  );
}

const h2: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: 0 };
const auswahl: React.CSSProperties = { padding: '8px 12px', borderRadius: 999, fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-manrope)', background: 'var(--th-bg-card)', border: '1.5px solid var(--th-accent)', color: 'var(--th-accent)', cursor: 'pointer' };
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
