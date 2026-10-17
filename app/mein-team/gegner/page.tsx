'use client';

// ============================================================
// Team Manager → Gegneranalyse (immer der Gegner des nächsten MDU-Spiels)
// ============================================================
//
// Vom Betreiber festgelegt (17.10.2026): eigene Seite hinter der Kachel im
// Dashboard. Inhalt: Tabelle & Form (letzte 5 Spiele), direkter Vergleich
// saisonübergreifend (2026/27 Spielberichte + 2025/26 Archiv, nur gleiche
// Team-Kennung), Top 5 im Einzel. Daten: /api/team-einblick (öffentlich).
// Premium wie der ganze Team Manager.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { zusagenFreigeschaltet } from '@/lib/features';
import { alleBegegnungen27, team27, findLiga27, venue27 } from '@/lib/data/saison-2027';
import { spieltagPfad, wochentag, tagMonat } from '@/lib/spieltag';
import { TeamBadge } from '@/components/mdu/team-badge';
import { Icon } from '@/components/mdu/icon';

interface Gegner {
  tabelle: { pos: number; pts: number; sp: number; s: number; u: number; n: number; teams: number } | null;
  letzte: { key: string; datum: string | null; gegen: string; gegenName: string; f: number; a: number; ergebnis: 'S' | 'U' | 'N'; wertung: boolean; bestaetigt: boolean }[];
  vergleich: { saison: string; wettbewerb: string; datum: string | null; wir: number; sie: number }[];
  beste: { name: string; points: number; wins: number; singles: number; b180: number }[];
}

const GRUEN = '#1FA34A', ROT = '#D2352B', GOLD = '#E8B84A';
const ERG = { S: { f: '#22C55E', t: 'Sieg' }, U: { f: GOLD, t: 'Unentschieden' }, N: { f: '#E5484D', t: 'Niederlage' } } as const;
const heuteIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const datumKurz = (iso: string | null) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(2, 4)}` : '–');

export default function GegnerSeite() {
  const { user, loading } = useAuth();
  const teamId = user?.teamId ?? null;
  const [info, setInfo] = useState<Gegner | null | undefined>(undefined);

  // Nächstes MDU-Spiel des eigenen Teams
  const spiel = useMemo(() => {
    if (!teamId) return undefined;
    const heute = heuteIso();
    return alleBegegnungen27()
      .filter(b => (b.home === teamId || b.away === teamId) && (b.termin?.datum ?? b.sun) >= heute)
      .sort((a, b) => (a.termin?.datum ?? a.fri).localeCompare(b.termin?.datum ?? b.fri))[0];
  }, [teamId]);
  const gegnerId = spiel ? (spiel.home === teamId ? spiel.away : spiel.home) : null;

  useEffect(() => {
    if (!teamId || !gegnerId) return;
    let weg = false;
    fetch(`/api/team-einblick?team=${encodeURIComponent(teamId)}&gegner=${encodeURIComponent(gegnerId)}`)
      .then(r => (r.ok ? r.json() : null)).then(j => { if (!weg) setInfo(j?.gegner ?? null); }).catch(() => { if (!weg) setInfo(null); });
    return () => { weg = true; };
  }, [teamId, gegnerId]);

  const G = gegnerId ? team27(gegnerId) : undefined;
  const heim = spiel?.home === teamId;
  const ort = spiel ? venue27(team27(spiel.home)?.venueId ?? null) : undefined;
  const tab = info?.tabelle;
  const bilanz = info ? info.vergleich.reduce((b, v) => ({ s: b.s + (v.wir > v.sie ? 1 : 0), u: b.u + (v.wir === v.sie ? 1 : 0), n: b.n + (v.wir < v.sie ? 1 : 0) }), { s: 0, u: 0, n: 0 }) : null;

  return (
    <MemberShell title="Gegneranalyse">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Dieser Bereich ist nur für angemeldete Mitglieder.{' '}<LoginLink /></Notice>
        : !zusagenFreigeschaltet(user) ? <Notice title="Noch nicht freigeschaltet">Die Gegneranalyse gehört zum Team Manager und ist für dein Team noch nicht verfügbar.</Notice>
        : !spiel || !gegnerId ? <Notice title="Kein anstehendes Spiel">Für dein Team steht in dieser Saison kein weiteres MDU-Spiel an.</Notice>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640 }}>
            <Link href="/mein-team/zusagen" style={zurueck}><Icon name="chevron" size={12} style={{ transform: 'rotate(180deg)' }} /> Team Manager</Link>

            {/* Kopf */}
            <Link href={spieltagPfad(teamId!, spiel.key)} style={{
              position: 'relative', overflow: 'hidden', display: 'block', textDecoration: 'none', borderRadius: 22, padding: '18px', color: '#fff',
              background: 'radial-gradient(110% 90% at 100% 0%, rgba(210,53,43,0.45) 0%, transparent 55%), linear-gradient(160deg, #10301C 0%, #0A1A10 100%)',
              boxShadow: '0 12px 30px rgba(10,26,16,0.3)',
            }}>
              <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'repeating-conic-gradient(from 9deg at 85% 50%, rgba(255,255,255,0.045) 0 18deg, transparent 18deg 36deg)' }} />
              <div style={{ position: 'relative', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD }}>
                Nächstes Spiel · {spiel.termin ? `${wochentag(spiel.termin.datum)} ${tagMonat(spiel.termin.datum)}${spiel.termin.uhrzeit ? ` · ${spiel.termin.uhrzeit} Uhr` : ''}` : 'Termin folgt'} · {heim ? 'Heim' : 'Auswärts'}
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, marginTop: 12 }}>
                <TeamBadge initials={G?.short ?? gegnerId.slice(0, 3)} color={G?.color} logoUrl={G?.logoUrl ?? undefined} size={62} ring="#EFE6CF" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30, lineHeight: 1, textTransform: 'uppercase', overflowWrap: 'anywhere' }}>{G?.name ?? gegnerId}</div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'rgba(239,230,207,0.8)', marginTop: 4 }}>
                    {findLiga27(G?.league)?.name}{heim ? ' · bei euch' : ort ? ` · im ${ort.name}` : ''}
                  </div>
                </div>
                {tab && tab.sp > 0 && (
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 40, lineHeight: 0.9 }}>{tab.pos}.</div>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(239,230,207,0.75)' }}>Platz</div>
                  </div>
                )}
              </div>
            </Link>

            {info === undefined ? <Muted>Lade die Analyse …</Muted> : info === null ? (
              <Notice title="Gerade nicht verfügbar">Die Daten zum Gegner lassen sich im Moment nicht laden. Versuch es bitte später noch einmal.</Notice>
            ) : (
              <>
                {/* Tabelle & Form */}
                <section style={karte}>
                  <Kopf titel="Tabelle & Form" />
                  {tab && tab.sp > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                      {[['Platz', `${tab.pos}/${tab.teams}`], ['Punkte', String(tab.pts)], ['Spiele', String(tab.sp)], ['S-U-N', `${tab.s}-${tab.u}-${tab.n}`]].map(([l, w]) => (
                        <div key={l} style={zahlBox}><div style={zahl}>{w}</div><div style={miniTitel}>{l}</div></div>
                      ))}
                    </div>
                  ) : <p style={leise}>Noch kein Spiel in dieser Saison – Tabelle und Form füllen sich mit den ersten Ergebnissen.</p>}
                  {info.letzte.length > 0 && (
                    <>
                      <div style={miniTitel}>Letzte {info.letzte.length} Spiele</div>
                      {info.letzte.map(l => (
                        <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid var(--th-line-5)', fontFamily: 'var(--font-manrope)', fontSize: 13.5 }}>
                          <span title={ERG[l.ergebnis].t} style={{ width: 24, height: 24, borderRadius: 999, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: ERG[l.ergebnis].f, color: l.ergebnis === 'U' ? '#3A2A00' : '#fff', fontSize: 12, fontWeight: 900 }}>{l.ergebnis}</span>
                          <span style={{ width: 58, flexShrink: 0, fontSize: 12, color: 'var(--th-text-muted)' }}>{datumKurz(l.datum)}</span>
                          <span style={{ flex: 1, minWidth: 0, fontWeight: 700, color: 'var(--th-text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.gegen === teamId ? 'gegen euch' : l.gegenName}</span>
                          <b style={{ color: 'var(--th-text-strong)' }}>{l.f}:{l.a}{!l.bestaetigt ? '*' : ''}</b>
                        </div>
                      ))}
                    </>
                  )}
                </section>

                {/* Direkter Vergleich */}
                <section style={karte}>
                  <Kopf titel="Direkter Vergleich" />
                  {info.vergleich.length === 0 ? <p style={leise}>Ihr habt in den erfassten Saisons noch nicht gegeneinander gespielt.</p> : (
                    <>
                      {bilanz && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                          {([['Siege', bilanz.s, GRUEN], ['Unentschieden', bilanz.u, GOLD], ['Niederlagen', bilanz.n, ROT]] as const).map(([l, w, f]) => (
                            <div key={l} style={{ ...zahlBox, borderTop: `3px solid ${f}` }}><div style={zahl}>{w}</div><div style={miniTitel}>{l}</div></div>
                          ))}
                        </div>
                      )}
                      {[...info.vergleich].sort((a, b) => (b.datum ?? b.saison).localeCompare(a.datum ?? a.saison)).map((v, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid var(--th-line-5)', fontFamily: 'var(--font-manrope)', fontSize: 13.5 }}>
                          <span style={{ width: 58, flexShrink: 0, fontSize: 12, color: 'var(--th-text-muted)' }}>{v.datum ? datumKurz(v.datum) : v.saison}</span>
                          <span style={{ flex: 1, minWidth: 0, color: 'var(--th-text-body)' }}>{v.saison} · {v.wettbewerb}</span>
                          <b style={{ color: v.wir > v.sie ? '#16A34A' : v.wir < v.sie ? '#DC2626' : '#B07A00' }}>{v.wir}:{v.sie}</b>
                        </div>
                      ))}
                      <div style={{ ...leise, fontSize: 11.5, marginTop: 6 }}>Aus eurer Sicht. 2025/26 aus dem Archiv; hat ein Team seitdem den Namen gewechselt, fehlen dessen alte Spiele.</div>
                    </>
                  )}
                </section>

                {/* Top 5 */}
                <section style={karte}>
                  <Kopf titel="Top 5 im Einzel" />
                  {info.beste.length === 0 ? <p style={leise}>Sobald der Gegner gespielt hat, stehen hier seine besten Spieler aus der Einzelrangliste.</p> : info.beste.map((b, i) => (
                    <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i ? '1px solid var(--th-line-5)' : 'none', fontFamily: 'var(--font-manrope)', fontSize: 13.5 }}>
                      <span style={{ width: 22, textAlign: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: i === 0 ? GOLD : 'var(--th-text-faint)' }}>{i + 1}</span>
                      <span style={{ flex: 1, minWidth: 0, fontWeight: 800, color: 'var(--th-text-strong)' }}>{b.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--th-text-muted)', whiteSpace: 'nowrap' }}>{b.wins}/{b.singles} Siege{b.b180 ? ` · ${b.b180}× 180` : ''}</span>
                      <b style={{ width: 46, textAlign: 'right', color: 'var(--th-text-strong)' }}>{b.points} P.</b>
                    </div>
                  ))}
                </section>
              </>
            )}
          </div>
        )}
    </MemberShell>
  );
}

function Kopf({ titel }: { titel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span aria-hidden style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(${ROT} 50%, ${GRUEN} 50%)` }} />
      <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 17, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--th-text-strong)' }}>{titel}</span>
    </div>
  );
}

const karte: React.CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 20, padding: '14px 16px', boxShadow: '0 4px 16px var(--th-shadow)' };
const zurueck: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)', textDecoration: 'none' };
const miniTitel: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-text-muted)', marginBottom: 4 };
const zahlBox: React.CSSProperties = { padding: '10px 6px', borderRadius: 12, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)', textAlign: 'center' };
const zahl: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, lineHeight: 1.05, color: 'var(--th-text-strong)' };
const leise: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-muted)', lineHeight: 1.55, margin: 0 };
