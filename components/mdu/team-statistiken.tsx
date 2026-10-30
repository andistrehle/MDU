'use client';

// ============================================================
// Team Manager → Statistiken (/mein-team/statistik), Betreiber 30.10.2026
// ============================================================
// Drei Reiter, alle für das ganze Team sichtbar:
//   • Teilnahme — Spieler × vergangene Termine. Grundlage ist die Zu-/Absage;
//     steht jemand im Spielbericht, wird unterschieden: zugesagt UND gespielt
//     oder ohne Zusage einfach gekommen. Teilnahme = zugesagt + gekommen.
//   • Spielberichte — je Spieler aus den Berichten (/api/team-statistik/detail):
//     Einsätze, Einzel, Doppel, Legs, 180er, 171er, High Finishes, Short Legs.
//   • Aufgaben — erledigte Aufgaben je Bezeichnung, wer sie wie oft übernommen hat.
// Filter: Terminart (MDU-Spiel, andere Spiele, Training, Event, Sonstiges),
// Zeitraum (Saison, Hin-/Rückrunde, letzte 30 Tage), Heim/Auswärts.
// Eigene Symbole (keine Emojis, nicht SpielerPlus).
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { zusagenFreigeschaltet } from '@/lib/features';
import { mitAnmeldung } from '@/lib/auth/mit-anmeldung';
import { NEUE_SAISON, alleBegegnungen27, team27 } from '@/lib/data/saison-2027';
import { ladeKader, type KaderOption } from '@/lib/supabase/season-teams';
import { ladeZusagen, ladeAufgaben, type Zusage, type Aufgabe } from '@/lib/supabase/zusagen';
import { ladeTermine, terminKey, terminTitel, type TeamTermin } from '@/lib/supabase/termine';
import type { SpielStat } from '@/lib/team-statistik';
import { MemberShell, Notice, Muted, LoginLink } from './member-area';
import { karte } from './zusagen-ui';
import { Icon } from './icon';

type Typ = 'mdu' | 'spiel' | 'training' | 'event' | 'sonstiges';
const TYPEN: { typ: Typ; name: string; mehrzahl: string; kurz: string }[] = [
  { typ: 'mdu', name: 'MDU-Spiel', mehrzahl: 'MDU-Spiele', kurz: 'Liga' },
  { typ: 'spiel', name: 'anderes Spiel', mehrzahl: 'andere Spiele', kurz: 'Spiel' },
  { typ: 'training', name: 'Training', mehrzahl: 'Trainings', kurz: 'Train.' },
  { typ: 'event', name: 'Event', mehrzahl: 'Events', kurz: 'Event' },
  { typ: 'sonstiges', name: 'Sonstiges', mehrzahl: 'Sonstige', kurz: 'Sonst.' },
];
type Zeitraum = 'saison' | 'hin' | 'rueck' | '30';
type Ort = 'alle' | 'heim' | 'aus';
type Reiter = 'teilnahme' | 'berichte' | 'aufgaben';

interface Termin { key: string; datum: string; typ: Typ; heim: boolean | null; titel: string }

const heuteIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const tagMonat = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
const minusTage = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const prozent = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

// ── Teilnahme-Symbole ──────────────────────────────────────

type Stand = 'dabei' | 'zugesagt' | 'gekommen' | 'abgesagt' | 'unsicher' | 'offen';
const GRUEN = '#1E9E57', ROT = '#D9534F', GOLD = '#C9921A';
const STAND_TEXT: Record<Stand, string> = {
  dabei: 'Zugesagt und gespielt', zugesagt: 'Zugesagt', gekommen: 'Ohne Zusage gekommen',
  abgesagt: 'Abgesagt', unsicher: 'Unsicher', offen: 'Keine Antwort',
};

export function TeilnahmeSymbol({ s, size = 22 }: { s: Stand; size?: number }) {
  const r = 10, c = 12;
  const scheibe = (farbe: string) => (<><circle cx={c} cy={c} r={5.2} fill="none" stroke={farbe} strokeWidth={1.8} /><circle cx={c} cy={c} r={1.9} fill={farbe} /></>);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={STAND_TEXT[s]}>
      <title>{STAND_TEXT[s]}</title>
      {s === 'dabei' && <><circle cx={c} cy={c} r={r} fill={GRUEN} />{scheibe('#fff')}</>}
      {s === 'zugesagt' && <><circle cx={c} cy={c} r={r} fill={`${GRUEN}26`} stroke={GRUEN} strokeWidth={1.4} /><path d="M7.6 12.3l3 3 5.8-6.2" fill="none" stroke={GRUEN} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /></>}
      {s === 'gekommen' && <><circle cx={c} cy={c} r={r - 0.7} fill="none" stroke={GRUEN} strokeWidth={1.6} strokeDasharray="3.2 2.2" />{scheibe(GRUEN)}</>}
      {s === 'abgesagt' && <><circle cx={c} cy={c} r={r} fill={`${ROT}1F`} /><path d="M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8" stroke={ROT} strokeWidth={2.2} strokeLinecap="round" /></>}
      {s === 'unsicher' && <><circle cx={c} cy={c} r={r} fill={`${GOLD}26`} /><path d="M9.4 9.6a2.7 2.7 0 1 1 3.9 2.4c-.8.4-1.3 1-1.3 1.9v.4" fill="none" stroke={GOLD} strokeWidth={2} strokeLinecap="round" /><circle cx={c} cy={17.2} r={1.2} fill={GOLD} /></>}
      {s === 'offen' && <circle cx={c} cy={c} r={r - 2} fill="none" stroke="var(--th-text-faint)" strokeWidth={1.4} strokeDasharray="2 2.4" />}
    </svg>
  );
}

// ── Seite ──────────────────────────────────────────────────

export function TeamStatistiken() {
  const { user, loading } = useAuth();
  const teamId = user?.teamId ?? null;
  const [kader, setKader] = useState<KaderOption[]>([]);
  const [zusagen, setZusagen] = useState<Zusage[]>([]);
  const [termine, setTermine] = useState<TeamTermin[]>([]);
  const [aufgaben, setAufgaben] = useState<Aufgabe[]>([]);
  const [berichte, setBerichte] = useState<Record<string, SpielStat> | null>(null);
  const [geladen, setGeladen] = useState(false);
  const [reiter, setReiter] = useState<Reiter>('teilnahme');
  const [typen, setTypen] = useState<Set<Typ>>(new Set(TYPEN.map(t => t.typ)));
  const [zeitraum, setZeitraum] = useState<Zeitraum>('saison');
  const [ort, setOrt] = useState<Ort>('alle');
  const [filterOffen, setFilterOffen] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    let weg = false;
    queueMicrotask(() => {
      void Promise.all([ladeKader(NEUE_SAISON.id, teamId), ladeZusagen(teamId), ladeTermine(teamId), ladeAufgaben(teamId)]).then(([k, z, t, a]) => {
        if (weg) return;
        setKader(k); setZusagen(z.rows); setTermine(t.rows); setAufgaben(a); setGeladen(true);
      });
      mitAnmeldung(`/api/team-statistik/detail?team=${encodeURIComponent(teamId)}`)
        .then(r => (r.ok ? r.json() : null)).then(j => { if (!weg) setBerichte((j?.spiele as Record<string, SpielStat>) ?? {}); }).catch(() => { if (!weg) setBerichte({}); });
    });
    return () => { weg = true; };
  }, [teamId]);

  // Alle VERGANGENEN Termine (heute eingeschlossen), neueste zuerst.
  const alleTermine = useMemo<(Termin & { half: 'hin' | 'rueck' })[]>(() => {
    if (!teamId) return [];
    const h = heuteIso();
    const eigene = alleBegegnungen27().filter(b => b.home === teamId || b.away === teamId);
    const rueckStart = eigene.filter(b => b.half === 'rueck').map(b => b.fri).sort()[0] ?? '9999';
    const mdu = eigene.map(b => {
      const heim = b.home === teamId, gegner = heim ? b.away : b.home;
      return { key: b.key, datum: b.termin?.datum ?? b.fri, typ: 'mdu' as Typ, heim, titel: `${heim ? 'gegen' : 'bei'} ${team27(gegner)?.name ?? gegner}`, half: b.half };
    });
    const ext = termine.map(t => ({
      key: terminKey(t.id), datum: t.event_date, typ: (t.kind === 'spiel' ? 'spiel' : t.kind) as Typ,
      heim: t.kind === 'spiel' ? t.is_home : null, titel: terminTitel(t), half: (t.event_date >= rueckStart ? 'rueck' : 'hin') as 'hin' | 'rueck',
    }));
    return [...mdu, ...ext].filter(t => t.datum <= h).sort((a, b) => b.datum.localeCompare(a.datum));
  }, [teamId, termine]);

  const gefiltert = useMemo(() => {
    const ab = minusTage(heuteIso(), 30);
    return alleTermine.filter(t => typen.has(t.typ)
      && (zeitraum === 'saison' || (zeitraum === '30' ? t.datum >= ab : t.half === zeitraum))
      && (ort === 'alle' || (t.heim !== null && t.heim === (ort === 'heim'))));
  }, [alleTermine, typen, zeitraum, ort]);

  // Personen: Kader + wer in Zusagen/Berichten vorkommt.
  const personen = useMemo(() => {
    const m = new Map(kader.map(k => [k.id, k.name]));
    for (const z of zusagen) if (!m.has(z.player_id)) m.set(z.player_id, z.player_name);
    for (const s of Object.values(berichte ?? {})) for (const [k, p] of Object.entries(s.spieler)) if (!m.has(k)) m.set(k, p.name);
    return [...m].map(([id, name]) => ({ id, name }));
  }, [kader, zusagen, berichte]);

  const filterAktiv = typen.size !== TYPEN.length || zeitraum !== 'saison' || ort !== 'alle';

  return (
    <MemberShell title="Statistiken">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Die Statistiken sind nur für dein Team sichtbar.{' '}<LoginLink /></Notice>
        : !zusagenFreigeschaltet(user) ? <Notice title="Noch nicht freigeschaltet">Die Statistiken gehören zum Team Manager.</Notice>
        : !teamId ? <Notice title="Kein Team verknüpft">Deinem Konto ist noch kein Team zugeordnet.</Notice>
        : !geladen ? <Muted>Lade …</Muted>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Link href="/mein-team/zusagen" style={zurueck}><Icon name="chevron" size={12} style={{ transform: 'rotate(180deg)' }} /> Team Manager</Link>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-muted)' }}>Teilnahme, Spielberichte und Aufgaben deines Teams in der {NEUE_SAISON.kurz}.</div>

            <div role="tablist" style={{ display: 'flex', gap: 4, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)', borderRadius: 999, padding: 4 }}>
              {([['teilnahme', 'Teilnahme'], ['berichte', 'Spielberichte'], ['aufgaben', 'Aufgaben']] as [Reiter, string][]).map(([r, n]) => (
                <button key={r} role="tab" aria-selected={reiter === r} type="button" onClick={() => setReiter(r)} style={{
                  flex: 1, padding: '9px 8px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
                  background: reiter === r ? 'var(--th-accent)' : 'transparent', color: reiter === r ? '#fff' : 'var(--th-text-muted)',
                }}>{n}</button>
              ))}
            </div>

            <button type="button" onClick={() => setFilterOffen(o => !o)} aria-expanded={filterOffen} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              border: 'none', background: 'var(--th-text-strong)', color: 'var(--th-bg-card)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14,
            }}>
              <Icon name="settings" size={16} stroke={2.2} /> Statistiken filtern{filterAktiv ? ' · aktiv' : ''}
            </button>
            {filterOffen && (
              <div style={{ ...karte, gap: 12 }}>
                <FilterZeile titel="Terminart">
                  {TYPEN.map(t => (
                    <Chip key={t.typ} an={typen.has(t.typ)} onClick={() => setTypen(s => { const n = new Set(s); if (n.has(t.typ)) { if (n.size > 1) n.delete(t.typ); } else n.add(t.typ); return n; })}>{t.mehrzahl}</Chip>
                  ))}
                </FilterZeile>
                <FilterZeile titel="Zeitraum">
                  {([['saison', 'Ganze Saison'], ['hin', 'Hinrunde'], ['rueck', 'Rückrunde'], ['30', 'Letzte 30 Tage']] as [Zeitraum, string][]).map(([z, n]) => <Chip key={z} an={zeitraum === z} onClick={() => setZeitraum(z)}>{n}</Chip>)}
                </FilterZeile>
                <FilterZeile titel="Heim / Auswärts">
                  {([['alle', 'Alle'], ['heim', 'Heim'], ['aus', 'Auswärts']] as [Ort, string][]).map(([o, n]) => <Chip key={o} an={ort === o} onClick={() => setOrt(o)}>{n}</Chip>)}
                </FilterZeile>
                {ort !== 'alle' && <div style={klein}>Heim/Auswärts gibt es nur bei Spielen – Trainings und Events fallen dabei weg.</div>}
                {filterAktiv && <button type="button" onClick={() => { setTypen(new Set(TYPEN.map(t => t.typ))); setZeitraum('saison'); setOrt('alle'); }} style={{ ...textKnopf, alignSelf: 'flex-start' }}>Filter zurücksetzen</button>}
              </div>
            )}

            <div style={{ ...klein, padding: '10px 12px', borderRadius: 10, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)' }}>
              {TYPEN.filter(t => typen.has(t.typ)).map((t, i) => (
                <span key={t.typ}>{i > 0 && <span style={{ color: 'var(--th-text-faint)' }}>{'  |  '}</span>}<b style={{ color: 'var(--th-text-strong)' }}>{gefiltert.filter(x => x.typ === t.typ).length}</b> {t.mehrzahl}</span>
              ))}
            </div>

            {reiter === 'teilnahme' && <Teilnahme termine={gefiltert} personen={personen} zusagen={zusagen} berichte={berichte ?? {}} ichId={user.playerId ?? null} />}
            {reiter === 'berichte' && (berichte === null ? <Muted>Lade Spielberichte …</Muted> : <Spielberichte termine={gefiltert} berichte={berichte} ichId={user.playerId ?? null} />)}
            {reiter === 'aufgaben' && <Aufgaben termine={gefiltert} aufgaben={aufgaben} />}
          </div>
        )}
    </MemberShell>
  );
}

// ── Teilnahme ──────────────────────────────────────────────

function Teilnahme({ termine, personen, zusagen, berichte, ichId }: {
  termine: Termin[]; personen: { id: string; name: string }[]; zusagen: Zusage[]; berichte: Record<string, SpielStat>; ichId: string | null;
}) {
  const z = useMemo(() => new Map(zusagen.map(x => [`${x.match_key}|${x.player_id}`, x.status])), [zusagen]);
  const stand = (t: Termin, p: string): Stand => {
    const s = z.get(`${t.key}|${p}`);
    const gespielt = !!berichte[t.key]?.spieler[p];
    if (gespielt) return s === 'yes' ? 'dabei' : 'gekommen';
    return s === 'yes' ? 'zugesagt' : s === 'no' ? 'abgesagt' : s === 'maybe' ? 'unsicher' : 'offen';
  };
  const zeilen = personen.map(p => {
    const st = termine.map(t => stand(t, p.id));
    const n = st.filter(s => s === 'dabei' || s === 'zugesagt' || s === 'gekommen').length;
    return { ...p, st, n, spontan: st.filter(s => s === 'gekommen').length };
  }).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'de'));

  if (!termine.length) return <div style={{ ...karte, ...klein }}>Für diese Auswahl gibt es noch keine vergangenen Termine.</div>;
  return (
    <div style={{ ...karte, padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontFamily: 'var(--font-manrope)', fontSize: 13, minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...kopf, ...links, left: 0, minWidth: 128 }}>Spieler</th>
              <th style={{ ...kopf, ...links, left: 128, minWidth: 92, borderRight: '1px solid var(--th-line-8)' }}>Teilnahme</th>
              {termine.map(t => (
                <th key={t.key} title={`${t.titel} · ${TYPEN.find(x => x.typ === t.typ)?.name}`} style={{ ...kopf, textAlign: 'center', minWidth: 54 }}>
                  <div style={{ fontWeight: 800, color: 'var(--th-text-strong)' }}>{tagMonat(t.datum)}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: t.typ === 'mdu' ? (t.heim ? GRUEN : '#4E7DBD') : 'var(--th-text-faint)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {TYPEN.find(x => x.typ === t.typ)?.kurz}{t.heim !== null ? (t.heim ? ' · H' : ' · A') : ''}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zeilen.map(p => (
              <tr key={p.id}>
                <td style={{ ...zelle, ...links, left: 0, fontWeight: p.id === ichId ? 800 : 700, color: 'var(--th-text-strong)', maxWidth: 128, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                <td style={{ ...zelle, ...links, left: 128, borderRight: '1px solid var(--th-line-8)', whiteSpace: 'nowrap' }}>
                  <b style={{ color: 'var(--th-text-strong)' }}>{p.n}</b> <span style={{ color: 'var(--th-text-muted)' }}>({prozent(p.n, termine.length)} %)</span>
                  {p.spontan > 0 && <div style={{ fontSize: 10.5, color: GRUEN, fontWeight: 700 }}>davon {p.spontan} ohne Zusage</div>}
                </td>
                {p.st.map((s, i) => <td key={termine[i].key} style={{ ...zelle, textAlign: 'center' }}><TeilnahmeSymbol s={s} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', padding: '12px 14px', borderTop: '1px solid var(--th-line-6)' }}>
        {(Object.keys(STAND_TEXT) as Stand[]).map(s => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...klein }}><TeilnahmeSymbol s={s} size={18} /> {STAND_TEXT[s]}</span>
        ))}
        <span style={{ ...klein, flexBasis: '100%' }}>Teilnahme = zugesagt oder laut Spielbericht gespielt. „Gespielt“ gibt es nur bei MDU-Spielen mit Spielbericht.</span>
      </div>
    </div>
  );
}

// ── Spielberichte ──────────────────────────────────────────

function Spielberichte({ termine, berichte, ichId }: { termine: Termin[]; berichte: Record<string, SpielStat>; ichId: string | null }) {
  const spiele = termine.filter(t => t.typ === 'mdu' && berichte[t.key]);
  const zeilen = useMemo(() => {
    const m = new Map<string, { id: string; name: string; sp: number; eS: number; eN: number; dS: number; dN: number; lp: number; lm: number; b180: number; b171: number; hf: number[]; sl: number[] }>();
    for (const t of spiele) for (const [k, p] of Object.entries(berichte[t.key].spieler)) {
      const z = m.get(k) ?? { id: k, name: p.name, sp: 0, eS: 0, eN: 0, dS: 0, dN: 0, lp: 0, lm: 0, b180: 0, b171: 0, hf: [], sl: [] };
      z.sp += 1; z.eS += p.eS; z.eN += p.eN; z.dS += p.dS; z.dN += p.dN; z.lp += p.lp; z.lm += p.lm; z.b180 += p.b180; z.b171 += p.b171;
      z.hf.push(...p.hf); z.sl.push(...p.sl); z.name = p.name;
      m.set(k, z);
    }
    return [...m.values()].sort((a, b) => b.sp - a.sp || b.eS - a.eS || a.name.localeCompare(b.name, 'de'));
  }, [spiele, berichte]);

  if (!spiele.length) return <div style={{ ...karte, ...klein }}>Für diese Auswahl gibt es noch keine Spielberichte. Sie zählen nur bei MDU-Spielen.</div>;
  const spalten: [string, string][] = [['Spiele', 'Einsätze'], ['Einzel', 'Einzel Siege:Niederlagen'], ['Doppel', 'Doppel Siege:Niederlagen'], ['Legs', 'Legs im Einzel'], ['180', '180er'], ['171', '171er'], ['HF', 'High Finishes (Anzahl, höchstes)'], ['SL', 'Short Legs (Anzahl, kürzestes)']];
  return (
    <div style={{ ...karte, padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, fontFamily: 'var(--font-manrope)', fontSize: 13, minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ ...kopf, ...links, left: 0, minWidth: 128, borderRight: '1px solid var(--th-line-8)' }}>Spieler</th>
              {spalten.map(([k, t]) => <th key={k} title={t} style={{ ...kopf, textAlign: 'center', minWidth: 54 }}>{k}</th>)}
            </tr>
          </thead>
          <tbody>
            {zeilen.map(z => {
              const dl = z.lp - z.lm;
              return (
                <tr key={z.id}>
                  <td style={{ ...zelle, ...links, left: 0, borderRight: '1px solid var(--th-line-8)', fontWeight: z.id === ichId ? 800 : 700, color: 'var(--th-text-strong)', maxWidth: 128, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.name}</td>
                  <Zahl>{z.sp}</Zahl>
                  <Zahl>{z.eS}:{z.eN}</Zahl>
                  <Zahl>{z.dS}:{z.dN}</Zahl>
                  <Zahl farbe={dl > 0 ? GRUEN : dl < 0 ? ROT : undefined}>{dl > 0 ? `+${dl}` : dl}</Zahl>
                  <Zahl hell={!z.b180}>{z.b180}</Zahl>
                  <Zahl hell={!z.b171}>{z.b171}</Zahl>
                  <Zahl hell={!z.hf.length}>{z.hf.length ? <>{z.hf.length}<small style={{ color: 'var(--th-text-muted)' }}> ({Math.max(...z.hf)})</small></> : 0}</Zahl>
                  <Zahl hell={!z.sl.length}>{z.sl.length ? <>{z.sl.length}<small style={{ color: 'var(--th-text-muted)' }}> ({Math.min(...z.sl)})</small></> : 0}</Zahl>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ ...klein, padding: '10px 14px', borderTop: '1px solid var(--th-line-6)' }}>
        Aus {spiele.length} {spiele.length === 1 ? 'Spielbericht' : 'Spielberichten'}{spiele.some(t => !berichte[t.key].bestaetigt) ? ' (auch noch nicht bestätigte)' : ''}. Legs zählen nur aus den Einzeln.
      </div>
    </div>
  );
}

// ── Aufgaben ───────────────────────────────────────────────

function Aufgaben({ termine, aufgaben }: { termine: Termin[]; aufgaben: Aufgabe[] }) {
  const gruppen = useMemo(() => {
    const keys = new Set(termine.map(t => t.key));
    const g = new Map<string, { titel: string; leute: Map<string, { name: string; n: number }> }>();
    for (const a of aufgaben) {
      if (!a.done || !keys.has(a.match_key) || !a.assignee_id) continue;
      const k = a.title.trim().toLowerCase();
      const x = g.get(k) ?? { titel: a.title.trim(), leute: new Map() };
      const p = x.leute.get(a.assignee_id) ?? { name: a.assignee_name ?? 'Unbekannt', n: 0 };
      p.n += 1; x.leute.set(a.assignee_id, p); g.set(k, x);
    }
    return [...g.values()].map(x => ({ titel: x.titel, leute: [...x.leute.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, 'de')) }))
      .sort((a, b) => b.leute.reduce((s, p) => s + p.n, 0) - a.leute.reduce((s, p) => s + p.n, 0));
  }, [aufgaben, termine]);

  if (!gruppen.length) return <div style={{ ...karte, ...klein }}>Noch keine erledigten Aufgaben in dieser Auswahl. Aufgaben verteilst du auf der Seite eines Spiels oder Termins.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {gruppen.map(g => (
        <div key={g.titel} style={{ ...karte, gap: 0 }}>
          <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 19, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--th-text-strong)', paddingBottom: 8, borderBottom: '2px solid var(--th-text-strong)' }}>{g.titel}</div>
          {g.leute.map((p, i) => (
            <div key={p.name + i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: i ? '1px solid var(--th-line-5)' : 'none' }}>
              <span style={{ width: 30, height: 30, borderRadius: 999, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-8)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, color: 'var(--th-text-muted)' }}>
                {p.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </span>
              <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <b style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, width: 24, textAlign: 'right' }}>{p.n}</b>
              <span style={{ display: 'inline-flex', gap: 2, color: i === 0 ? GOLD : 'var(--th-text-faint)', width: 120, flexWrap: 'wrap' }}>
                {Array.from({ length: Math.min(p.n, 6) }, (_, j) => <Icon key={j} name="trophy" size={15} stroke={2} />)}
                {p.n > 6 && <span style={{ ...klein, fontWeight: 800 }}>+{p.n - 6}</span>}
              </span>
            </div>
          ))}
        </div>
      ))}
      <div style={klein}>Gezählt werden erledigte Aufgaben mit zugeteilter Person. Gleiche Bezeichnungen werden zusammengefasst.</div>
    </div>
  );
}

// ── Bausteine/Stile ────────────────────────────────────────

function FilterZeile({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, color: 'var(--th-text-muted)', marginBottom: 6 }}>{titel}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
    </div>
  );
}
function Chip({ an, onClick, children }: { an: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={an} onClick={onClick} style={{ padding: '7px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, border: `1.5px solid ${an ? 'var(--th-accent)' : 'var(--th-line-8)'}`, background: an ? 'var(--th-accent)' : 'var(--th-bg-card)', color: an ? '#fff' : 'var(--th-text-strong)' }}>{children}</button>
  );
}
function Zahl({ children, farbe, hell }: { children: React.ReactNode; farbe?: string; hell?: boolean }) {
  return <td style={{ ...zelle, textAlign: 'center', fontWeight: 700, color: farbe ?? (hell ? 'var(--th-text-faint)' : 'var(--th-text-strong)'), whiteSpace: 'nowrap' }}>{children}</td>;
}

const klein: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.45 };
const textKnopf: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5, padding: 0 };
const zurueck: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)', textDecoration: 'none' };
const kopf: React.CSSProperties = { padding: '10px 8px', fontSize: 11.5, fontWeight: 800, color: 'var(--th-text-muted)', textAlign: 'left', borderBottom: '1px solid var(--th-line-8)', background: 'var(--th-bg-card)', whiteSpace: 'nowrap' };
const zelle: React.CSSProperties = { padding: '9px 8px', borderBottom: '1px solid var(--th-line-5)', background: 'var(--th-bg-card)' };
const links: React.CSSProperties = { position: 'sticky', zIndex: 1 };
