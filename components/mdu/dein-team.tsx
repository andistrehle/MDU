'use client';

// ============================================================
// „Dein Team“ auf der Startseite (Betreiber, 20.11.2026, nach Umfrage-Kritik
// „man muss sich zu viel durch alles prügeln“)
// ============================================================
// Direkt unter der Kopfzeile, ZUGEKLAPPT: Logo, Team, Tabellenplatz, nächstes Spiel in Kurzform.
// Aufgeklappt: nächstes Spiel (mit Team Manager: Zu-/Absage direkt hier), letztes Ergebnis, Schnellwege.
//  · Mit Konto + Team: das eigene Team.
//  · Ohne Konto (oder Konto ohne Team): Zeile „Welches Team verfolgst du?“ → Team wählen, gemerkt NUR
//    auf dem Gerät (localStorage `mdu-lieblingsteam`); × blendet die Zeile aus (`mdu-dein-team-aus`).
//  · Kapitän/Co-Captain ohne Team Manager: Hinweis „Team Manager holen“.
// Die Daten aller Teams rechnet der Server (lib/server/dein-team.ts); wer welches Team sieht,
// entscheidet erst der Browser — die Startseite bleibt statisch.
// ============================================================

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { hatTcRecht } from '@/lib/auth/roles';
import { zusagenFuerTeam } from '@/lib/features';
import { PREMIUM_OEFFENTLICH } from '@/lib/premium';
import { supabase } from '@/lib/supabase/client';
import { NEUE_SAISON } from '@/lib/data/saison-2027';
import { setzeZusage, GRUND_MIN, NOTIZ_MAX, type ZusageStatus } from '@/lib/supabase/zusagen';
import { ladeKader } from '@/lib/supabase/season-teams';
import { berichtPfad, spieltagPfad, spielSlug, wochentag, tagMonat } from '@/lib/spieltag';
import type { DeinTeamDaten } from '@/lib/dein-team';
import { TeamBadge } from './team-badge';

const FAVORIT = 'mdu-lieblingsteam';
const AUS = 'mdu-dein-team-aus';
const lies = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const schreib = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* privater Modus */ } };

const M = 'var(--font-manrope)';
const kopfSchrift = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em' } as const;
const etikett = { fontFamily: M, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--th-text-faint)', marginBottom: 7 } as const;
const klein = { fontFamily: M, fontSize: 12.5, color: 'var(--th-text-muted)', marginTop: 2 } as const;
const gruen = { color: 'var(--th-accent)', fontWeight: 800, textDecoration: 'none' } as const;
const teil = { padding: '13px 16px', borderTop: '1px solid var(--th-line-5)' } as const;

const wann = (datum: string, uhrzeit: string | null) => `${wochentag(datum)} ${tagMonat(datum)}${uhrzeit ? ` · ${uhrzeit} Uhr` : ''}`;

function HA({ heim }: { heim: boolean }) {
  return <span title={heim ? 'Heimspiel' : 'Auswärtsspiel'} style={{ fontFamily: M, fontSize: 10, fontWeight: 800, borderRadius: 5, padding: '2px 6px', marginLeft: 4, verticalAlign: 2, background: heim ? 'var(--th-accent)' : 'var(--th-line-8)', color: heim ? '#fff' : 'var(--th-text-muted)' }}>{heim ? 'H' : 'A'}</span>;
}

export function DeinTeam({ teams }: { teams: Record<string, DeinTeamDaten> }) {
  const { user, loading } = useAuth();
  const [bereit, setBereit] = useState(false);
  const [favorit, setFavorit] = useState<string | null>(null);
  const [aus, setAus] = useState(false);
  const [auf, setAuf] = useState(false);
  const [wahl, setWahl] = useState(false);

  useEffect(() => { setFavorit(lies(FAVORIT)); setAus(lies(AUS) === '1'); setBereit(true); }, []);

  if (!bereit || loading) return null;
  const eigenes = user?.teamId && teams[user.teamId] ? user.teamId : null;
  const teamId = eigenes ?? (favorit && teams[favorit] ? favorit : null);
  const t = teamId ? teams[teamId] : null;

  const waehle = (id: string | null) => { setFavorit(id); schreib(FAVORIT, id); setWahl(false); if (id) setAuf(true); };
  const huelle = (inhalt: React.ReactNode, farbe: string) => (
    <div style={{ background: 'var(--th-bg-page)' }}>
      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 28px' }}>
        <div style={{ maxWidth: 560, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderLeft: `4px solid ${farbe}`, borderRadius: 14, overflow: 'hidden' }}>{inhalt}</div>
      </div>
    </div>
  );

  if (wahl) return huelle(<TeamWahl teams={teams} aktuell={teamId} onWahl={waehle} onZu={() => setWahl(false)} />, 'var(--th-accent)');

  if (!t) {
    if (aus) return null;
    return huelle(
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px 12px 16px' }}>
        <div aria-hidden style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--th-line-6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0, color: 'var(--th-text-muted)' }}>★</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: M, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--th-accent)' }}>Dein Team</div>
          <div style={{ fontFamily: M, fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' }}>Welches Team verfolgst du?</div>
          <div style={klein}>
            <button type="button" onClick={() => setWahl(true)} style={{ ...gruen, fontFamily: M, fontSize: 12.5, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>Team wählen</button>
            {!user && <> – oder <Link href="/login" style={gruen}>anmelden</Link></>}
          </div>
        </div>
        <button type="button" aria-label="Ausblenden" title="Ausblenden" onClick={() => { setAus(true); schreib(AUS, '1'); }} style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '10px 12px', color: 'var(--th-text-faint)' }}>×</button>
      </div>, 'var(--th-accent)');
  }

  const meins = !!eigenes;
  const tmAktiv = meins && (!!user?.teamManager || zusagenFuerTeam(t.id));
  const tcOhneTm = meins && !tmAktiv && PREMIUM_OEFFENTLICH && hatTcRecht(user, t.id, 'team_manager');
  const n = t.naechstes, l = t.letztes;
  const kurz = n ? `${wochentag(n.datum)} ${tagMonat(n.datum)} ${n.heim ? 'gegen' : 'bei'} ${n.gegnerName}` : 'Kein Spiel mehr offen';
  const wege: [string, string][] = [
    ['Tabelle', `/ligen/${t.liga}?tab=tabelle`],
    ['Spielplan', meins ? '/mein-team/spielplan' : `/teams/${t.id}`],
    ['Kader', `/teams/${t.id}#kader`],
    ...(meins ? [tmAktiv ? ['Team Manager', '/mein-team/zusagen'] : ['Mein Bereich', '/mein-bereich']] as [string, string][] : []),
  ];

  return huelle(
    <>
      <button type="button" onClick={() => setAuf(a => !a)} aria-expanded={auf} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 14px 13px 16px', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }}>
        <TeamBadge initials={t.kurz.slice(0, 3)} color={t.farbe} size={44} logoUrl={t.logo ?? undefined} />
        <span style={{ flex: 1, minWidth: 0, display: 'block' }}>
          <span style={{ display: 'block', fontFamily: M, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--th-accent)' }}>{meins ? 'Dein Team' : 'Dein Lieblingsteam'}</span>
          <span style={{ ...kopfSchrift, display: 'block', fontSize: 22, lineHeight: 1.1, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
          <span style={{ ...klein, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.ligaName} · {auf ? `${t.pkt} Pkt.` : kurz}</span>
        </span>
        <span style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ ...kopfSchrift, display: 'block', fontSize: 28, lineHeight: 1, color: 'var(--th-text-strong)' }}>{t.platz ? `${t.platz}.` : '–'}</span>
          <span style={{ display: 'block', fontFamily: M, fontSize: 11, color: 'var(--th-text-faint)', fontWeight: 600 }}>{t.platz ? `von ${t.von}` : 'Platz'}</span>
        </span>
        <span aria-hidden style={{ fontFamily: M, fontSize: 16, color: 'var(--th-text-faint)', marginLeft: 4 }}>{auf ? '▴' : '▾'}</span>
      </button>

      {auf && (
        <>
          <div style={teil}>
            <div style={etikett}>{n ? `Nächstes Spiel · ${n.spieltag}. Spieltag` : 'Nächstes Spiel'}</div>
            {n ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TeamBadge initials={n.gegnerName.slice(0, 3)} color={n.gegnerFarbe} size={36} logoUrl={n.gegnerLogo ?? undefined} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: M, fontWeight: 800, fontSize: 15 }}>
                      <Link href={`/teams/${n.gegner}`} style={{ color: 'var(--th-text-strong)', textDecoration: 'none' }}>{n.gegnerName}</Link><HA heim={n.heim} />
                    </div>
                    <div style={klein}>
                      {wann(n.datum, n.uhrzeit)}
                      {n.ort && <> · {n.ortId ? <Link href={`/spielstaetten/${n.ortId}`} style={gruen}>{n.ort} ›</Link> : n.ort}</>}
                    </div>
                  </div>
                </div>
                {tmAktiv && user && <Zusage teamId={t.id} matchKey={n.key} label={`${wann(n.datum, null)} · ${n.heim ? t.name : n.gegnerName} – ${n.heim ? n.gegnerName : t.name}`} />}
              </>
            ) : <div style={klein}>Für dieses Team steht kein Spiel mehr aus.</div>}
          </div>

          {tcOhneTm && (
            <div style={{ ...teil, background: 'rgba(232,184,74,0.12)' }}>
              <div style={{ fontFamily: M, fontSize: 13, lineHeight: 1.5, color: 'var(--th-text-body)' }}>
                Mit dem Team Manager sagt dein Team hier mit einem Tipp zu oder ab.{' '}
                <Link href="/mein-team/premium" style={gruen}>Team Manager holen ›</Link>
              </div>
            </div>
          )}

          {l && (
            <div style={teil}>
              <div style={etikett}>Letztes Spiel · {tagMonat(l.datum)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TeamBadge initials={l.gegnerName.slice(0, 3)} color={l.gegnerFarbe} size={36} logoUrl={l.gegnerLogo ?? undefined} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: M, fontWeight: 800, fontSize: 15 }}>
                    <Link href={`/teams/${l.gegner}`} style={{ color: 'var(--th-text-strong)', textDecoration: 'none' }}>{l.gegnerName}</Link><HA heim={l.heim} />
                  </div>
                  <div style={klein}>
                    {l.wertung ? 'Wertung' : <Link href={berichtPfad(l.key)} style={gruen}>Spielbericht ›</Link>}
                    {!l.bestaetigt && ' · noch nicht bestätigt'}
                  </div>
                </div>
                <div style={{ ...kopfSchrift, marginLeft: 'auto', fontSize: 24, color: l.eigen > l.fremd ? 'var(--th-win)' : l.eigen < l.fremd ? '#C0392B' : 'var(--th-text-strong)' }}>{l.eigen}:{l.fremd}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${wege.length}, 1fr)`, borderTop: '1px solid var(--th-line-5)' }}>
            {wege.map(([text, href], i) => (
              <Link key={href} href={href} style={{ ...gruen, textAlign: 'center', padding: '13px 2px', fontFamily: M, fontSize: 12, borderRight: i < wege.length - 1 ? '1px solid var(--th-line-5)' : undefined }}>{text}</Link>
            ))}
          </div>

          {!meins && (
            <div style={{ ...teil, ...klein, marginTop: 0 }}>
              Nur auf diesem Gerät gemerkt.{' '}
              <button type="button" onClick={() => setWahl(true)} style={{ ...gruen, fontFamily: M, fontSize: 12.5, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>Anderes Team</button>
              {' · '}
              <button type="button" onClick={() => waehle(null)} style={{ ...gruen, fontFamily: M, fontSize: 12.5, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>Entfernen</button>
            </div>
          )}
        </>
      )}
    </>, t.ligaFarbe);
}

// ── Team wählen (ohne Konto) ─────────────────────────────────
const glatt = (s: string) => s.toLowerCase().replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');

function TeamWahl({ teams, aktuell, onWahl, onZu }: { teams: Record<string, DeinTeamDaten>; aktuell: string | null; onWahl: (id: string) => void; onZu: () => void }) {
  const [q, setQ] = useState('');
  const liste = useMemo(() => Object.values(teams).sort((a, b) => a.name.localeCompare(b.name, 'de')), [teams]);
  const treffer = q.trim() ? liste.filter(t => glatt(`${t.name} ${t.kurz} ${t.ligaName}`).includes(glatt(q.trim()))) : liste;
  return (
    <div style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: M, fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' }}>Welches Team verfolgst du?</div>
        <button type="button" onClick={onZu} style={{ ...gruen, fontFamily: M, fontSize: 13, background: 'none', border: 0, cursor: 'pointer', padding: '4px 0 4px 12px' }}>Abbrechen</button>
      </div>
      <input type="search" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Team suchen" aria-label="Team suchen" style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 10, fontSize: 16, fontFamily: M, color: 'var(--th-text-strong)', background: 'var(--th-bg-page)', border: '1px solid var(--th-line-10)' }} />
      <div style={{ ...klein, margin: '6px 0 8px' }}>Gemerkt wird das nur auf diesem Gerät.</div>
      <div style={{ maxHeight: 300, overflowY: 'auto', margin: '0 -6px' }}>
        {treffer.map(t => (
          <button key={t.id} type="button" onClick={() => onWahl(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 6px', background: t.id === aktuell ? 'var(--th-line-5)' : 'none', border: 0, borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
            <TeamBadge initials={t.kurz.slice(0, 3)} color={t.farbe} size={30} logoUrl={t.logo ?? undefined} />
            <span style={{ flex: 1, minWidth: 0, fontFamily: M, fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
            <span style={{ fontFamily: M, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.ligaFarbe, flexShrink: 0 }}>{t.ligaName}</span>
          </button>
        ))}
        {!treffer.length && <div style={{ ...klein, padding: '8px 6px' }}>Kein Team gefunden.</div>}
      </div>
    </div>
  );
}

// ── Zu-/Absage direkt in der Karte (nur mit Team Manager) ────
const TEXT: Record<ZusageStatus, string> = { yes: '✓ Bin dabei', maybe: '? Vielleicht', no: '✕ Kann nicht' };

function Zusage({ teamId, matchKey, label }: { teamId: string; matchKey: string; label: string }) {
  const { user } = useAuth();
  const playerId = user?.playerId ?? null;
  const [status, setStatus] = useState<ZusageStatus | null | undefined>(undefined);   // undefined = lädt
  const [zahl, setZahl] = useState<{ yes: number; maybe: number; no: number } | null>(null);
  const [grundFuer, setGrundFuer] = useState<ZusageStatus | null>(null);
  const [grund, setGrund] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  const ladeZahl = () => fetch(`/api/spieltag/stand?team=${encodeURIComponent(teamId)}&spiel=${encodeURIComponent(spielSlug(matchKey))}`)
    .then(r => (r.ok ? r.json() : null)).then(j => { if (j) setZahl({ yes: j.yes ?? 0, maybe: j.maybe ?? 0, no: j.no ?? 0 }); }).catch(() => {});

  useEffect(() => {
    let weg = false;
    void ladeZahl();
    if (!supabase || !playerId) { setStatus(null); return; }
    void supabase.from('match_availability').select('status, note').eq('season_id', NEUE_SAISON.id).eq('team_id', teamId).eq('match_key', matchKey).eq('player_id', playerId).maybeSingle()
      .then(({ data }) => { if (weg) return; const d = data as { status: ZusageStatus; note: string | null } | null; setStatus(d?.status ?? null); setGrund(d?.note ?? ''); });
    return () => { weg = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, matchKey, playerId]);

  const spielseite = <Link href={spieltagPfad(teamId, matchKey)} style={gruen}>Zur Spielseite ›</Link>;
  // Ohne verknüpftes Spielerprofil gibt es keine eigene Zusage – dann nur Stand + Weg.
  if (!playerId || !user) return <div style={{ ...klein, marginTop: 10 }}>{zahl && `${zahl.yes} zugesagt · ${zahl.no} abgesagt · `}{spielseite}</div>;

  async function speichere(neu: ZusageStatus, note: string | null) {
    if (!user || !playerId || laeuft) return;
    setLaeuft(true); setFehler(null);
    const kader = await ladeKader(NEUE_SAISON.id, teamId).catch(() => []);
    const name = kader.find(k => k.id === playerId)?.name ?? user.displayName;
    const { error } = await setzeZusage({ matchKey, teamId, playerId, playerName: name, status: neu, note, label, userId: user.id });
    setLaeuft(false);
    if (error) { setFehler(error); return; }
    setStatus(neu); setGrundFuer(null); void ladeZahl();
  }
  const tippe = (s: ZusageStatus) => {
    setFehler(null);
    if (s === 'yes') { void speichere('yes', null); return; }
    setGrundFuer(g => (g === s ? null : s));
  };

  return (
    <div style={{ marginTop: 11 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {(['yes', 'maybe', 'no'] as ZusageStatus[]).map(s => {
          const an = status === s;
          const farbe = s === 'yes' ? 'var(--th-accent)' : s === 'no' ? '#B23A3A' : 'var(--th-text-muted)';
          return (
            <button key={s} type="button" disabled={laeuft || status === undefined} aria-pressed={an} onClick={() => tippe(s)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontFamily: M, fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap',
              border: `1.5px solid ${an || grundFuer === s ? farbe : 'var(--th-line-10)'}`, background: an ? farbe : 'var(--th-bg-card)', color: an ? '#fff' : 'var(--th-text-strong)',
              opacity: status === undefined ? 0.5 : 1,
            }}>{TEXT[s]}</button>
          );
        })}
      </div>
      {grundFuer && (
        <div style={{ marginTop: 8 }}>
          <input value={grund} onChange={e => setGrund(e.target.value.slice(0, NOTIZ_MAX))} autoFocus placeholder={`Kurze Begründung (mind. ${GRUND_MIN} Zeichen)`} aria-label="Begründung" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, fontSize: 16, fontFamily: M, color: 'var(--th-text-strong)', background: 'var(--th-bg-page)', border: '1px solid var(--th-line-10)' }} />
          <button type="button" disabled={laeuft || grund.trim().length < GRUND_MIN} onClick={() => void speichere(grundFuer, grund)} style={{ marginTop: 8, width: '100%', padding: '10px 0', borderRadius: 10, border: 0, cursor: 'pointer', fontFamily: M, fontWeight: 800, fontSize: 13, background: 'var(--th-accent)', color: '#fff', opacity: laeuft || grund.trim().length < GRUND_MIN ? 0.5 : 1 }}>
            {grundFuer === 'no' ? 'Absage speichern' : '„Vielleicht“ speichern'}
          </button>
        </div>
      )}
      {fehler && <div style={{ ...klein, color: '#B23A3A', marginTop: 8 }}>{fehler}</div>}
      <div style={{ ...klein, marginTop: 8 }}>
        {zahl ? `${zahl.yes} zugesagt · ${zahl.maybe ? `${zahl.maybe} unsicher · ` : ''}${zahl.no} abgesagt · ` : ''}{spielseite}
      </div>
    </div>
  );
}
