'use client';

// ============================================================
// Team Manager — Dashboard (/mein-team/zusagen; die Terminliste liegt unter /mein-team/termine)
// ============================================================
//
// Vom Betreiber gewählt (16.10.2026): Entwurf „Dartscheibe“, nur stylischer.
//   • Kopf: nächstes Spiel. Die Scheibe zeigt das TEAM — ein Segment je Spieler,
//     gefärbt nach seiner Antwort; im Bull der Countdown.
//   • Darunter: was du noch zusagen musst, Teamkasse, Aufgaben, die nächsten Termine.
//   • Statistik: deine Quote zuerst (Ring), daneben der Team-Schnitt; darunter die
//     Teilnahme-Tabelle der letzten Termine wie unter /mein-team/statistik
//     (zugesagt oder laut Spielbericht gespielt, /api/team-statistik/detail).
// Zeigt nur, was wirklich in den Daten steht; ohne vergangene Termine sagt sie das.
// ============================================================

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Begegnung27 } from '@/lib/data/saison-2027';
import { team27 } from '@/lib/data/saison-2027';
import type { Zusage, ZusageStatus, Aufgabe } from '@/lib/supabase/zusagen';
import { terminTitel, terminPfad, terminFarbe, type TeamTermin } from '@/lib/supabase/termine';
import { euro } from '@/lib/supabase/kasse';
import { spieltagPfad, wochentag, tagMonat } from '@/lib/spieltag';
import { TeamBadge } from './team-badge';
import { Icon } from './icon';
import { STATUS, REIHE, StatusIcon, GrundEingabe } from './zusagen-ui';
import { TeilnahmeTabelle, teilnahmeZeilen, type Termin } from './team-statistiken';
import type { SpielStat } from '@/lib/team-statistik';

export type DashEintrag = { key: string; datum: string; zeit: string } & ({ art: 'mdu'; b: Begegnung27 } | { art: 'ext'; t: TeamTermin });
export interface DashKasse { stand: number; offen: number; meinOffen: number | null }

// Farben der Scheibe
const GRUEN = '#1FA34A', ROT = '#D2352B', GOLD = '#E8B84A', CREME = '#EFE6CF', SCHWARZ = '#141414';
const FARBE: Record<ZusageStatus | 'offen', string> = { yes: '#22C55E', maybe: GOLD, no: '#E5484D', offen: 'rgba(239,230,207,0.22)' };

const heuteIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const tageBis = (iso: string) => Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse(heuteIso() + 'T00:00:00Z')) / 86400000);
const initialen = (n: string) => n.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();

function titelVon(e: DashEintrag, teamId: string) {
  if (e.art === 'ext') return terminTitel(e.t);
  const gegner = e.b.home === teamId ? e.b.away : e.b.home;
  return `${e.b.home === teamId ? 'gegen' : 'bei'} ${team27(gegner)?.name ?? gegner}`;
}
const pfadVon = (e: DashEintrag, teamId: string) => (e.art === 'mdu' ? spieltagPfad(teamId, e.key) : terminPfad(e.t.id));

export function TeamDashboard({ teamId, teamName, liga, spiele, vergangen, zusagen, personen, ichId, ichName, aufgaben, kasse, berichte, onAntwort }: {
  teamId: string; teamName: string; liga: string;
  /** anstehende Termine (MDU + eigene), nach Datum */
  spiele: DashEintrag[];
  /** VERGANGENE Termine der Saison, neueste zuerst (Teilnahme, wie /mein-team/statistik) */
  vergangen: Termin[];
  zusagen: Zusage[]; personen: { id: string; name: string }[]; ichId: string | null; ichName: string;
  aufgaben: Aufgabe[]; kasse: DashKasse | null; berichte: Record<string, SpielStat> | null;
  /** Eigene Zu-/Absage für einen Termin setzen; liefert eine Fehlermeldung oder null. */
  onAntwort?: (key: string, status: ZusageStatus, note: string | null) => Promise<string | null>;
}) {
  const naechstes = spiele[0];
  const zu = (key: string) => zusagen.filter(z => z.match_key === key);
  const meins = (key: string): ZusageStatus | null => (ichId ? zu(key).find(z => z.player_id === ichId)?.status ?? null : null);
  const vorname = ichName.split(' ')[0] || 'du';

  const ohneAntwort = ichId ? spiele.filter(e => !meins(e.key)) : [];
  const naechstesSpiel = spiele.find(e => e.art === 'mdu');
  const gegnerId = naechstesSpiel && naechstesSpiel.art === 'mdu' ? (naechstesSpiel.b.home === teamId ? naechstesSpiel.b.away : naechstesSpiel.b.home) : null;
  const keys = new Set(spiele.map(e => e.key));
  const offeneAufgaben = aufgaben.filter(a => !a.done && keys.has(a.match_key));
  const meineAufgaben = ichId ? offeneAufgaben.filter(a => a.assignee_id === ichId) : [];

  return (
    <section aria-label="Überblick" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Hero teamId={teamId} teamName={teamName} liga={liga} vorname={vorname} e={naechstes}
        zusagen={naechstes ? zu(naechstes.key) : []} personen={personen} ichId={ichId} meins={naechstes ? meins(naechstes.key) : null}
        meineNotiz={naechstes && ichId ? zu(naechstes.key).find(z => z.player_id === ichId)?.note ?? null : null}
        onAntwort={naechstes && onAntwort ? (st, note) => onAntwort(naechstes.key, st, note) : undefined} />


      {/* Kacheln */}
      <div className="mdu-dash-kacheln">
        {kasse && (
          <Kachel href="/mein-team/kasse" titel="Teamkasse" akzent={GOLD} symbol="€"
            gross={euro(kasse.stand)} grossFarbe={kasse.stand < 0 ? '#E5484D' : undefined}
            klein={kasse.meinOffen ? <b style={{ color: '#E5484D' }}>Du: {euro(kasse.meinOffen)} offen</b>
              : kasse.offen ? `${euro(kasse.offen)} offen im Team` : 'Alles bezahlt ✓'} />
        )}
        <Kachel href="/mein-team/termine" titel="Termine" akzent="#4E7DBD" symbol={<Icon name="calendar" size={15} stroke={2.2} />}
          gross={`${spiele.length} anstehend`}
          klein={ichId && ohneAntwort.length ? <b style={{ color: '#B07A00' }}>{ohneAntwort.length} noch zuzusagen</b> : 'Zu-/Absagen, Aufstellung'} />
        <Kachel href="/mein-team/termine" titel="Aufgaben" akzent="#7C5CD6" symbol={<Icon name="list" size={15} stroke={2.4} />}
          gross={offeneAufgaben.length ? `${offeneAufgaben.length} offen` : 'Keine'}
          klein={meineAufgaben.length ? <b style={{ color: '#7C5CD6' }}>{meineAufgaben.length} für dich</b> : 'an den Spieltagen'} />
        {gegnerId && (
          <Kachel href="/mein-team/gegner" titel="Gegneranalyse" akzent={ROT} symbol={<Icon name="flag" size={15} stroke={2.2} />}
            gross={team27(gegnerId)?.name ?? gegnerId} klein="nächster Gegner" kleinGross />
        )}
      </div>


      {/* Die nächsten Termine */}
      {spiele.length > 1 && (
        <div style={karte}>
          <KartenKopf titel="Danach" rechts={<Link href="/mein-team/termine" style={linkKlein}>Alle Termine →</Link>} />
          {spiele.slice(1, 4).map(e => {
            const m = meins(e.key);
            const farbe = e.art === 'ext' ? terminFarbe(e.t) : e.b.home === teamId ? GRUEN : '#4E7DBD';
            return (
              <Link key={e.key} href={pfadVon(e, teamId)} className="mdu-dash-zeile" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 6px', borderTop: '1px solid var(--th-line-5)', textDecoration: 'none', borderRadius: 8 }}>
                <span style={{ width: 46, flexShrink: 0, textAlign: 'center', borderRadius: 10, padding: '5px 0', background: `${farbe}1F`, color: farbe, fontFamily: 'var(--font-manrope)', fontWeight: 800, lineHeight: 1.1 }}>
                  <span style={{ display: 'block', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{wochentag(e.datum)}</span>
                  <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 17 }}>{tagMonat(e.datum)}</span>
                </span>
                <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)' }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titelVon(e, teamId)}</span>
                  <span style={{ fontSize: 12, color: 'var(--th-text-muted)' }}>{e.zeit ? `${e.zeit} Uhr` : 'Uhrzeit folgt'}{e.art === 'ext' ? ' · Extern' : ''} · {zu(e.key).filter(z => z.status === 'yes').length} dabei</span>
                </span>
                {ichId && (m ? <StatusIcon s={m} size={22} /> : <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, color: '#8A5F00', background: 'rgba(232,184,74,0.22)', borderRadius: 999, padding: '4px 9px' }}>antworten</span>)}
              </Link>
            );
          })}
        </div>
      )}

      <Statistik termine={vergangen} zusagen={zusagen} personen={personen} ichId={ichId} berichte={berichte} />

      <style>{'.mdu-dash-hover{transition:transform 160ms ease,box-shadow 160ms ease}.mdu-dash-hover:hover{transform:translateY(-2px);box-shadow:0 10px 26px var(--th-shadow)}.mdu-dash-zeile:hover{background:var(--th-bg-card3)}.mdu-dash-kacheln{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}@media (max-width:640px){.mdu-dash-kacheln{grid-template-columns:1fr 1fr}.mdu-dash-breit{grid-column:1/-1}}'}</style>
    </section>
  );
}

// ── Kopf mit der Team-Scheibe ───────────────────────────────

function Hero({ teamId, teamName, liga, vorname, e, zusagen, personen, ichId, meins, meineNotiz, onAntwort }: {
  teamId: string; teamName: string; liga: string; vorname: string; e: DashEintrag | undefined;
  zusagen: Zusage[]; personen: { id: string; name: string }[]; ichId: string | null; meins: ZusageStatus | null;
  meineNotiz: string | null; onAntwort?: (status: ZusageStatus, note: string | null) => Promise<string | null>;
}) {
  const [grundFuer, setGrundFuer] = useState<ZusageStatus | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  async function antworte(st: ZusageStatus, note: string | null) {
    if (!onAntwort) return;
    setFehler(null); setGrundFuer(null);
    const err = await onAntwort(st, note);
    if (err) setFehler(err);
  }
  const t = team27(teamId);
  const n = { yes: 0, maybe: 0, no: 0 } as Record<ZusageStatus, number>;
  for (const z of zusagen) n[z.status]++;
  const offen = Math.max(0, personen.length - zusagen.length);
  const tage = e ? tageBis(e.datum) : null;

  const inhalt = (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 24, color: '#fff', padding: '18px 18px 16px',
      background: 'radial-gradient(120% 80% at 0% 0%, #1E5A31 0%, transparent 60%), radial-gradient(90% 90% at 100% 100%, rgba(210,53,43,0.35) 0%, transparent 55%), linear-gradient(160deg, #10301C 0%, #0A1A10 100%)',
      boxShadow: '0 14px 34px rgba(10,26,16,0.35)',
    }}>
      {/* Scheiben-Segmente als Struktur im Hintergrund */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: `repeating-conic-gradient(from 9deg at 22% 62%, rgba(255,255,255,0.045) 0 18deg, transparent 18deg 36deg)` }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
        <TeamBadge initials={t?.short ?? teamName.slice(0, 3)} color={t?.color} logoUrl={t?.logoUrl ?? undefined} size={36} ring={CREME} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(239,230,207,0.75)' }}>Servus {vorname} 👋</div>
          <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, lineHeight: 1, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{teamName}</div>
        </div>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, border: `1px solid ${GOLD}66`, borderRadius: 999, padding: '4px 9px' }}>{liga}</span>
      </div>

      {e ? (
        <>
          <div className="mdu-dash-held" style={{ position: 'relative', marginTop: 16 }}>
            <Scheibe personen={personen} zusagen={zusagen} ichId={ichId} tage={tage ?? 0} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD }}>
                Nächstes {e.art === 'mdu' ? 'Spiel' : 'Termin'} · {tage === 0 ? 'heute' : tage === 1 ? 'morgen' : `in ${tage} Tagen`}
              </div>
              <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28, lineHeight: 1.02, textTransform: 'uppercase', marginTop: 4, overflowWrap: 'anywhere' }}>{titelVon(e, teamId)}</div>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'rgba(239,230,207,0.8)', marginTop: 4 }}>
                {wochentag(e.datum)} {tagMonat(e.datum)}{e.zeit ? ` · ${e.zeit} Uhr` : ''}{e.art === 'mdu' ? (e.b.home === teamId ? ' · Heimspiel' : ' · Auswärts') : ''}
              </div>
              {ichId && onAntwort && (
                <div style={{ position: 'relative', zIndex: 2, marginTop: 12 }}>
                  <div role="group" aria-label="Deine Antwort" style={{ display: 'flex', gap: 8 }}>
                    {REIHE.map(st => {
                      const an = meins === st;
                      return (
                        <button key={st} type="button" aria-pressed={an} aria-label={STATUS[st].knopf} title={STATUS[st].knopf}
                          onClick={() => { if (st === 'yes') { if (!an) void antworte('yes', null); } else setGrundFuer(g => (g === st ? null : st)); }}
                          style={{
                            width: 52, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, cursor: 'pointer',
                            background: an ? FARBE[st] : grundFuer === st ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)',
                            border: `1.5px solid ${an || grundFuer === st ? FARBE[st] : 'rgba(239,230,207,0.22)'}`,
                            color: an ? (st === 'maybe' ? '#3A2A00' : '#fff') : 'rgba(239,230,207,0.92)',
                            fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11.5, letterSpacing: '-0.01em', boxShadow: an ? `0 4px 14px ${FARBE[st]}55` : 'none',
                          }}>
                          <StatusIcon s={st} size={24} voll={an} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          {grundFuer && (
            <div style={{ position: 'relative', zIndex: 2 }}>
              <GrundEingabe key={grundFuer} status={grundFuer} start={meins === grundFuer ? meineNotiz ?? '' : ''}
                onSenden={g => void antworte(grundFuer, g)} onAbbrechen={() => setGrundFuer(null)} />
            </div>
          )}
          {fehler && <div role="alert" style={{ position: 'relative', zIndex: 2, marginTop: 8, fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, color: '#FF8A80' }}>{fehler}</div>}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 6, flexWrap: 'nowrap', marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(239,230,207,0.14)', fontFamily: 'var(--font-manrope)', fontSize: 'clamp(11px, 3.2vw, 12.5px)', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {([['yes', n.yes, 'dabei'], ['maybe', n.maybe, 'unsicher'], ['no', n.no, 'Absage'], ['offen', offen, 'offen']] as const).map(([k, z, l]) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'rgba(239,230,207,0.9)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: k === 'offen' ? 'rgba(239,230,207,0.4)' : FARBE[k] }} />
                <b style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 16, color: '#fff' }}>{z}</b> {l}
              </span>
            ))}
          </div>
          <style>{'.mdu-dash-held{display:grid;grid-template-columns:150px 1fr;gap:16px;align-items:center}@media (max-width:420px){.mdu-dash-held{grid-template-columns:128px 1fr;gap:12px}}'}</style>
        </>
      ) : (
        <div style={{ position: 'relative', marginTop: 14, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'rgba(239,230,207,0.85)' }}>Keine anstehenden Termine.</div>
      )}
      {/* Die ganze Karte führt zum Spiel — außer den Antwort-Knöpfen (liegen darüber, zIndex 2). */}
      {e && <Link href={pfadVon(e, teamId)} aria-label={`Zum Termin: ${titelVon(e, teamId)}`} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />}
    </div>
  );
  return e ? <div className="mdu-dash-hover" style={{ borderRadius: 24 }}>{inhalt}</div> : inhalt;
}

/** Die Team-Scheibe: ein Segment je Spieler (Farbe = Antwort), innen die Scheibe, im Bull der Countdown. */
function Scheibe({ personen, zusagen, ichId, tage }: { personen: { id: string; name: string }[]; zusagen: Zusage[]; ichId: string | null; tage: number }) {
  const n = Math.max(personen.length, 1);
  const c = 75, rAus = 72, rIn = 58;
  const pt = (r: number, w: number) => [c + r * Math.sin(w), c - r * Math.cos(w)];
  const bogen = (r1: number, r2: number, a: number, b: number) => {
    const [x1, y1] = pt(r2, a), [x2, y2] = pt(r2, b), [x3, y3] = pt(r1, b), [x4, y4] = pt(r1, a);
    const gross = b - a > Math.PI ? 1 : 0;
    return `M${x1} ${y1}A${r2} ${r2} 0 ${gross} 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 ${gross} 0 ${x4} ${y4}Z`;
  };
  const schritt = (2 * Math.PI) / n;
  const st = (id: string) => zusagen.find(z => z.player_id === id)?.status ?? 'offen';
  return (
    <svg viewBox="0 0 150 150" style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))' }} role="img"
      aria-label={personen.map(p => `${p.name}: ${st(p.id) === 'offen' ? 'offen' : STATUS[st(p.id) as ZusageStatus].text}`).join(', ')}>
      <circle cx={c} cy={c} r={74} fill={SCHWARZ} />
      {/* Außenring: je Spieler ein Segment */}
      {personen.map((p, i) => {
        const a = i * schritt + 0.025, b = (i + 1) * schritt - 0.025;
        const s = st(p.id);
        const [tx, ty] = pt((rAus + rIn) / 2, (a + b) / 2);
        return (
          <g key={p.id}>
            <path d={bogen(rIn, rAus, a, b)} fill={FARBE[s]} stroke={p.id === ichId ? '#fff' : 'none'} strokeWidth={p.id === ichId ? 1.6 : 0} />
            {n <= 16 && <text x={tx} y={ty + 2.6} textAnchor="middle" fontSize="7" fontWeight="800" fontFamily="var(--font-manrope)" fill={s === 'offen' ? 'rgba(239,230,207,0.75)' : s === 'maybe' ? '#3A2A00' : '#fff'}>{initialen(p.name)}</text>}
          </g>
        );
      })}
      {/* Innen: klassische Scheibe (20 Segmente) */}
      {Array.from({ length: 20 }, (_, i) => {
        const a = (i - 0.5) * (Math.PI / 10), b = (i + 0.5) * (Math.PI / 10);
        return (
          <g key={i}>
            <path d={bogen(16, 55, a, b)} fill={i % 2 ? CREME : SCHWARZ} opacity={i % 2 ? 0.92 : 1} />
            <path d={bogen(34, 39, a, b)} fill={i % 2 ? GRUEN : ROT} />
          </g>
        );
      })}
      <circle cx={c} cy={c} r={16} fill={GRUEN} />
      <circle cx={c} cy={c} r={11.5} fill={ROT} />
      <text x={c} y={c + 4.6} textAnchor="middle" fontSize={tage > 9 ? 11 : 13} fontWeight="900" fontFamily="var(--font-saira-condensed)" fill="#fff">{tage <= 0 ? '!' : tage}</text>
    </svg>
  );
}

// ── Statistik ───────────────────────────────────────────────

function Statistik({ termine, zusagen, personen, ichId, berichte }: {
  termine: Termin[]; zusagen: Zusage[]; personen: { id: string; name: string }[]; ichId: string | null; berichte: Record<string, SpielStat> | null;
}) {
  // Gleiche Rechnung wie /mein-team/statistik: Teilnahme = zugesagt oder laut Spielbericht gespielt.
  const zeilen = useMemo(() => teilnahmeZeilen(termine, personen, zusagen, berichte ?? {}), [termine, personen, zusagen, berichte]);
  const basis = termine.length;
  const quote = (n: number) => (basis ? n / basis : 0);
  const ich = ichId ? zeilen.find(z => z.id === ichId) : undefined;
  const schnitt = zeilen.length ? zeilen.reduce((s, z) => s + quote(z.n), 0) / zeilen.length : 0;
  const platz = ich ? zeilen.filter(z => z.n > ich.n).length + 1 : null;

  return (
    <div style={karte}>
      <KartenKopf titel="Statistik" />

      {basis === 0 ? (
        <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-muted)', lineHeight: 1.55, padding: '6px 0 2px' }}>
          Die Statistik startet nach dem ersten Termin – dann siehst du hier, wie oft du dabei warst, und wo du im Team stehst.
        </div>
      ) : (
        <>
          {/* Deine Quote zuerst */}
          {ich && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '6px 0 12px' }}>
              <QuotenScheibe quote={quote(ich.n)} />
              <div style={{ flex: 1, fontFamily: 'var(--font-manrope)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>Deine Saison</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--th-text-strong)', marginTop: 2 }}>{ich.n} von {basis} {basis === 1 ? 'Termin' : 'Terminen'} dabei</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ width: 52, fontSize: 11.5, fontWeight: 800, color: 'var(--th-text-strong)' }}>Du</span>
                  <Balken anteil={quote(ich.n)} farbe={GRUEN} />
                  <b style={{ width: 38, textAlign: 'right', fontSize: 12.5 }}>{Math.round(quote(ich.n) * 100)}%</b>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ width: 52, fontSize: 11.5, fontWeight: 800, color: 'var(--th-text-muted)', whiteSpace: 'nowrap' }}>Team Ø</span>
                  <Balken anteil={schnitt} farbe="var(--th-text-faint)" />
                  <b style={{ width: 38, textAlign: 'right', fontSize: 12.5, color: 'var(--th-text-muted)' }}>{Math.round(schnitt * 100)}%</b>
                </div>
                {platz && <div style={{ fontSize: 12.5, color: 'var(--th-text-muted)', marginTop: 8 }}>Platz {platz} von {zeilen.length} im Team</div>}
              </div>
            </div>
          )}

          {/* Teilnahme wie unter Statistiken: die letzten Termine */}
          <div style={{ borderTop: '1px solid var(--th-line-5)', paddingTop: 6 }}>
            <TeilnahmeTabelle kompakt termine={termine.slice(0, 5)} personen={personen} zusagen={zusagen} berichte={berichte ?? {}} ichId={ichId} />
          </div>
        </>
      )}
      <Link href="/mein-team/statistik" style={{ ...linkKlein, display: 'inline-block', marginTop: 10 }}>Alle Statistiken: Teilnahme, Spielberichte, Aufgaben →</Link>
    </div>
  );
}

/** Quote als feiner Fortschrittsring (Betreiber, 30.10.2026: Entwurf 1 — ein grüner Bogen mit runden Enden). */
function QuotenScheibe({ quote }: { quote: number }) {
  const r = 36, umfang = 2 * Math.PI * r;
  const anteil = Math.max(0, Math.min(1, quote));
  const zahl = Math.round(quote * 100);
  return (
    <svg viewBox="0 0 96 96" width="88" height="88" style={{ flexShrink: 0 }} aria-hidden>
      <circle cx={48} cy={48} r={r} fill="none" stroke="var(--th-line-8)" strokeWidth={5} />
      {anteil > 0 && (
        <circle cx={48} cy={48} r={r} fill="none" stroke={GRUEN} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={`${umfang * anteil} ${umfang}`} transform="rotate(-90 48 48)" />
      )}
      <text x={48} y={55} textAnchor="middle" fontSize={zahl >= 100 ? 18 : 20} fontWeight={700} fontFamily="var(--font-manrope)" fill="var(--th-text-strong)">{zahl}%</text>
    </svg>
  );
}

function Balken({ anteil, farbe }: { anteil: number; farbe: string }) {
  return (
    <span style={{ flex: 1, height: 8, borderRadius: 999, background: 'var(--th-line-8)', overflow: 'hidden' }}>
      <span style={{ display: 'block', width: `${Math.max(0, Math.min(1, anteil)) * 100}%`, height: '100%', borderRadius: 999, background: farbe, transition: 'width 300ms ease' }} />
    </span>
  );
}

// ── Bausteine ───────────────────────────────────────────────

function Kachel({ href, titel, akzent, symbol, gross, grossFarbe, klein, breit = false, kleinGross = false }: {
  breit?: boolean; kleinGross?: boolean; href: string; titel: string; akzent: string; symbol: React.ReactNode; gross: React.ReactNode; grossFarbe?: string; klein: React.ReactNode;
}) {
  const inhalt = (
    <>
      {/* Doppelring-Ecke als Deko */}
      <svg aria-hidden viewBox="0 0 60 60" style={{ position: 'absolute', right: -14, bottom: -14, width: 64, opacity: 0.16 }}>
        <circle cx="30" cy="30" r="26" fill="none" stroke={akzent} strokeWidth="6" strokeDasharray="8 4" />
        <circle cx="30" cy="30" r="12" fill="none" stroke={akzent} strokeWidth="5" />
      </svg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        <span style={{ width: 28, height: 28, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: akzent, color: '#fff', fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: 14 }}>{symbol}</span>
        <span style={{ flex: 1, fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>{titel}</span>
      </div>
      <div style={{ position: 'relative', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: kleinGross ? 22 : 28, lineHeight: 1.05, marginTop: 10, color: grossFarbe ?? 'var(--th-text-strong)', overflowWrap: 'anywhere' }}>{gross}</div>
      <div style={{ position: 'relative', fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>{klein}</div>
    </>
  );
  const stil: React.CSSProperties = { ...karte, position: 'relative', overflow: 'hidden', display: 'block', textDecoration: 'none', padding: '13px 14px' };
  const cls = `mdu-dash-hover${breit ? ' mdu-dash-breit' : ''}`;
  return href.startsWith('#')
    ? <a href={href} className={cls} style={stil}>{inhalt}</a>
    : <Link href={href} className={cls} style={stil}>{inhalt}</Link>;
}

function KartenKopf({ titel, rechts }: { titel: string; rechts?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span aria-hidden style={{ width: 4, height: 16, borderRadius: 2, background: `linear-gradient(${ROT} 50%, ${GRUEN} 50%)` }} />
      <span style={{ flex: 1, fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 17, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--th-text-strong)' }}>{titel}</span>
      {rechts}
    </div>
  );
}

const karte: React.CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 20, padding: '14px 16px', boxShadow: '0 4px 16px var(--th-shadow)' };
const linkKlein: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, color: 'var(--th-accent)', textDecoration: 'none' };
