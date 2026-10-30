'use client';

// ============================================================
// Strafen-Tracker am Spielabend (Migration 0066, Betreiber 30.10.2026)
// ============================================================
// • StrafenAbende — Karte in der Teamkasse: offene Abende, „Neuer Strafen-Abend“
//   (an einem Spiel oder frei mit Datum), Ersatz-Kassenwart bestimmen.
// • StrafenTracker — Seite /mein-team/strafen/<id>: live mitzählen (− / + je
//   Spieler und Strafart), das ganze Team sieht mit, „Abschließen“ bucht alles
//   als „U26 × 3“ in die Kasse. Zählt jemand auf einem zweiten Handy mit,
//   holt die Seite alle paar Sekunden den Stand.
// Zählen dürfen Kapitän/Co-Captain (Kasse), Kassenwart, Ligaleitung und der
// Ersatz-Kassenwart DIESES Abends (bis zum Abschließen, spätestens Di 23:59).
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { hatTcRecht, hasMinRole } from '@/lib/auth/roles';
import { NEUE_SAISON, spieleFuerTeam27, team27, termin27 } from '@/lib/data/saison-2027';
import { ladeKader, type KaderOption } from '@/lib/supabase/season-teams';
import { ladeKasse, centAus, euro, type Strafart } from '@/lib/supabase/kasse';
import {
  ladeAbende, ladeAbend, abendAnlegen, ersatzSetzen, ersatzBenachrichtigen, abendLoeschen, zaehlen, abschliessen, darfZaehlen,
  type StrafenAbend, type Strich,
} from '@/lib/supabase/strafen-tracker';
import { MemberShell, Notice, Muted, LoginLink } from './member-area';
import { karte, h2 } from './zusagen-ui';
import { Icon } from './icon';

const heuteIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const plusTage = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const datumText = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`;
};
const mitKonto = (k: KaderOption[]) => k.filter(x => !x.id.startsWith('name:'));

/** Spiele des Teams rund um heute (7 Tage zurück, 3 Wochen voraus) mit echtem Termin. */
function spieleZurAuswahl(teamId: string) {
  const h = heuteIso(), von = plusTage(h, -7), bis = plusTage(h, 21);
  return spieleFuerTeam27(teamId).filter(s => s.gegner).map(s => {
    const heim = s.heim ? teamId : s.gegner, gast = s.heim ? s.gegner : teamId;
    const datum = termin27(heim, gast)?.datum ?? s.fri;
    return { key: `${heim}|${gast}`, datum, titel: `${s.heim ? 'vs.' : 'bei'} ${team27(s.gegner)?.name ?? s.gegner}` };
  }).filter(s => s.datum >= von && s.datum <= bis);
}

// ── Karte in der Teamkasse ─────────────────────────────────

export function StrafenAbende({ teamId, userId, playerId, kasseDarf, kader }: {
  teamId: string; userId: string; playerId: string | null; kasseDarf: boolean; kader: KaderOption[];
}) {
  const [abende, setAbende] = useState<StrafenAbend[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [neu, setNeu] = useState(false);

  const laden = useCallback(() => ladeAbende(teamId).then(r => { setAbende(r.data); setFehler(r.error); }), [teamId]);
  useEffect(() => { void laden(); }, [laden]);

  if (fehler && /Migration/.test(fehler)) return null;
  const offen = (abende ?? []).filter(a => a.status === 'offen');
  const fertig = (abende ?? []).filter(a => a.status === 'abgeschlossen').slice(0, 3);
  if (!kasseDarf && !offen.length) return null;

  return (
    <div style={{ ...karte, gap: 10 }}>
      <h2 style={h2}>Strafen-Tracker</h2>
      <div style={klein}>Am Spielabend mitzählen – am Ende landet alles mit einem Tipp in der Kasse.</div>

      {offen.map(a => {
        const ich = darfZaehlen(a, kasseDarf, playerId);
        return (
          <Link key={a.id} href={`/mein-team/strafen/${a.id}`} style={abendZeile}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <b style={{ display: 'block', color: 'var(--th-text-strong)' }}>{a.titel || 'Strafen-Abend'}</b>
              <span style={klein}>{datumText(a.datum)}{a.ersatz_name ? ` · Ersatz-Kassenwart: ${a.ersatz_name}` : ''}</span>
            </span>
            <span style={{ ...knopfKlein, background: ich ? 'var(--th-accent)' : 'transparent', color: ich ? '#fff' : 'var(--th-accent)' }}>{ich ? 'Zählen' : 'Ansehen'}</span>
          </Link>
        );
      })}

      {kasseDarf && (neu
        ? <NeuerAbend teamId={teamId} userId={userId} kader={kader} vorhanden={abende ?? []}
            onFertig={a => { setNeu(false); if (a) window.location.href = `/mein-team/strafen/${a.id}`; }} />
        : <button type="button" onClick={() => setNeu(true)} style={plusKnopf}><Icon name="plus" size={15} stroke={2.4} /> Neuer Strafen-Abend</button>)}

      {kasseDarf && fertig.length > 0 && (
        <div style={{ ...klein, marginTop: 2 }}>
          Zuletzt abgeschlossen: {fertig.map((a, i) => (
            <span key={a.id}>{i > 0 && ' · '}<Link href={`/mein-team/strafen/${a.id}`} style={{ color: 'var(--th-accent)' }}>{a.titel || datumText(a.datum)}</Link></span>
          ))}
        </div>
      )}
      {fehler && <div role="alert" style={fehlerStil}>{fehler}</div>}
    </div>
  );
}

function NeuerAbend({ teamId, userId, kader, vorhanden, onFertig }: {
  teamId: string; userId: string; kader: KaderOption[]; vorhanden: StrafenAbend[]; onFertig: (a: StrafenAbend | null) => void;
}) {
  const belegt = new Set(vorhanden.map(a => a.match_key).filter(Boolean));
  const spiele = useMemo(() => spieleZurAuswahl(teamId).filter(s => !belegt.has(s.key)), [teamId, vorhanden]); // eslint-disable-line react-hooks/exhaustive-deps
  const h = heuteIso();
  const vorschlag = spiele.find(s => s.datum >= h) ?? spiele[spiele.length - 1];
  const [wahl, setWahl] = useState<string>(vorschlag?.key ?? 'frei');
  const [titel, setTitel] = useState('');
  const [datum, setDatum] = useState(h);
  const [ersatz, setErsatz] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function anlegen() {
    const spiel = spiele.find(s => s.key === wahl);
    const e = mitKonto(kader).find(k => k.id === ersatz);
    setLaeuft(true); setFehler(null);
    const r = await abendAnlegen({
      teamId, userId, matchKey: spiel?.key ?? null, titel: spiel ? spiel.titel : (titel.trim() || 'Strafen-Abend'),
      datum: spiel?.datum ?? datum, ersatz: e ? { key: e.id, name: e.name } : null,
    });
    setLaeuft(false);
    if (r.error) return setFehler(r.error);
    if (r.data && e) await ersatzBenachrichtigen(r.data.id);
    onFertig(r.data);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, borderRadius: 12, border: '1px solid var(--th-line-8)' }}>
      <label><span style={label}>Wofür?</span>
        <select value={wahl} onChange={e => setWahl(e.target.value)} style={feld}>
          {spiele.map(s => <option key={s.key} value={s.key}>{datumText(s.datum)} · {s.titel}</option>)}
          <option value="frei">Freier Abend (Training, Feier …)</option>
        </select>
      </label>
      {wahl === 'frei' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 8 }}>
          <label><span style={label}>Bezeichnung</span><input value={titel} onChange={e => setTitel(e.target.value)} maxLength={60} placeholder="z. B. Training" style={feld} /></label>
          <label><span style={label}>Datum</span><input type="date" value={datum} onChange={e => setDatum(e.target.value || h)} style={feld} /></label>
        </div>
      )}
      <label><span style={label}>Ersatz-Kassenwart für diesen Abend (optional)</span>
        <select value={ersatz} onChange={e => setErsatz(e.target.value)} style={feld}>
          <option value="">Keiner – ich zähle selbst</option>
          {mitKonto(kader).map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
      </label>
      <div style={klein}>Der Ersatz darf nur an diesem Abend Strafen zählen und abschließen, bis spätestens Dienstag 24 Uhr danach, und bekommt eine Nachricht in die Glocke und aufs Handy. Er braucht ein Konto auf der Seite.</div>
      {fehler && <div role="alert" style={fehlerStil}>{fehler}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" disabled={laeuft} onClick={() => void anlegen()} style={{ ...hauptKnopf, opacity: laeuft ? 0.6 : 1 }}>{laeuft ? 'Legt an …' : 'Anlegen und zählen'}</button>
        <button type="button" onClick={() => onFertig(null)} style={nebenKnopf}>Abbrechen</button>
      </div>
    </div>
  );
}

// ── Die Tracker-Seite ──────────────────────────────────────

type Art = { key: string; title: string; cents: number };
const sKey = (spieler: string, art: string) => `${spieler}|${art}`;

export function StrafenTracker({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const [abend, setAbend] = useState<StrafenAbend | null | undefined>(undefined);
  const [striche, setStriche] = useState<Map<string, Strich>>(new Map());
  const [kader, setKader] = useState<KaderOption[]>([]);
  const [katalog, setKatalog] = useState<Strafart[]>([]);
  const [kassenwart, setKassenwart] = useState<string | null>(null);
  const [eigene, setEigene] = useState<Art[]>([]);
  const [fehler, setFehler] = useState<string | null>(null);
  const [neuArt, setNeuArt] = useState<{ title: string; betrag: string } | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [gebucht, setGebucht] = useState<number | null>(null);

  const holen = useCallback(async () => {
    const r = await ladeAbend(id);
    setAbend(r.abend);
    setStriche(new Map(r.striche.map(s => [sKey(s.player_key, s.art_key), s])));
    if (r.error) setFehler(r.error);
    return r.abend;
  }, [id]);

  useEffect(() => {
    let weg = false;
    queueMicrotask(() => {
      void holen().then(a => {
        if (weg || !a) return;
        void Promise.all([ladeKader(NEUE_SAISON.id, a.team_id), ladeKasse(a.team_id)]).then(([k, ka]) => {
          if (weg) return;
          setKader(k); setKatalog(ka.strafarten); setKassenwart(ka.einst.treasurer_player_id);
        });
      });
    });
    // Mitzählen von einem zweiten Handy: alle 5 s den Stand holen, solange die Seite sichtbar ist.
    const t = setInterval(() => { if (document.visibilityState === 'visible') void holen(); }, 5000);
    return () => { weg = true; clearInterval(t); };
  }, [holen]);

  const teamId = abend?.team_id ?? '';
  const kasseDarf = !!user && !!teamId && (hatTcRecht(user, teamId, 'kasse') || hasMinRole(user, 'league_admin') || (!!user.playerId && kassenwart === user.playerId));
  const darf = !!abend && darfZaehlen(abend, kasseDarf, user?.playerId);

  // Spalten: Katalog + alles, was an diesem Abend schon gezählt wurde + neu angelegte eigene.
  const arten: Art[] = useMemo(() => {
    const m = new Map<string, Art>();
    for (const s of katalog) m.set(s.id, { key: s.id, title: s.title, cents: s.amount_cents });
    for (const s of striche.values()) if (!m.has(s.art_key)) m.set(s.art_key, { key: s.art_key, title: s.title, cents: s.amount_cents });
    for (const e of eigene) if (!m.has(e.key)) m.set(e.key, e);
    return [...m.values()];
  }, [katalog, striche, eigene]);

  // Spieler: Kader + wer schon Striche hat (z. B. Gastspieler aus dem Kader genommen).
  const leute = useMemo(() => {
    const m = new Map(kader.map(k => [k.id, k.name]));
    for (const s of striche.values()) if (!m.has(s.player_key)) m.set(s.player_key, s.player_name);
    return [...m].map(([key, name]) => ({ key, name }));
  }, [kader, striche]);

  const summe = [...striche.values()].reduce((x, s) => ({ n: x.n + s.anzahl, c: x.c + s.anzahl * s.amount_cents }), { n: 0, c: 0 });

  async function tippen(p: { key: string; name: string }, a: Art, delta: 1 | -1) {
    if (!abend) return;
    const k = sKey(p.key, a.key);
    const alt = striche.get(k);
    const n = Math.max(0, Math.min(99, (alt?.anzahl ?? 0) + delta));
    if (n === (alt?.anzahl ?? 0)) return;
    setStriche(m => new Map(m).set(k, { player_key: p.key, player_name: p.name, art_key: a.key, title: a.title, amount_cents: a.cents, anzahl: n }));
    const r = await zaehlen({ abend: abend.id, spieler: p, art: a, delta });
    if (r.error) { setFehler(r.error); void holen(); return; }
    setStriche(m => { const x = m.get(k); return x ? new Map(m).set(k, { ...x, anzahl: r.anzahl ?? x.anzahl }) : m; });
  }

  function eigeneDazu() {
    if (!neuArt) return;
    const cents = centAus(neuArt.betrag), title = neuArt.title.trim();
    if (!title || !cents) return setFehler('Bitte Bezeichnung und Betrag eintragen, z. B. 0,50.');
    setFehler(null);
    setEigene(l => [...l, { key: `eigen:${title}|${cents}`, title, cents }]);
    setNeuArt(null);
  }

  async function fertig() {
    if (!abend) return;
    if (!window.confirm(summe.n
      ? `${summe.n} Strafen über ${euro(summe.c)} in die Teamkasse buchen und den Abend abschließen? Danach kann nicht mehr gezählt werden.`
      : 'Es wurde nichts gezählt. Abend trotzdem abschließen?')) return;
    setLaeuft(true);
    const r = await abschliessen(abend.id);
    setLaeuft(false);
    if (r.error) return setFehler(r.error);
    setGebucht(r.gebucht); void holen();
  }

  async function ersatzAendern(key: string) {
    if (!abend) return;
    const e = mitKonto(kader).find(k => k.id === key);
    const r = await ersatzSetzen(abend.id, e ? { key: e.id, name: e.name } : null);
    if (r.error) return setFehler(r.error);
    if (e) void ersatzBenachrichtigen(abend.id);
    void holen();
  }

  async function loeschen() {
    if (!abend || !window.confirm('Diesen Strafen-Abend mit allem Gezählten löschen? In der Kasse ändert sich nichts.')) return;
    const r = await abendLoeschen(abend.id);
    if (r.error) setFehler(r.error); else window.location.href = '/mein-team/kasse';
  }

  return (
    <MemberShell title="Strafen-Tracker">
      {loading || abend === undefined ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Der Strafen-Tracker ist nur für dein Team sichtbar.{' '}<LoginLink /></Notice>
        : !abend ? <Notice title="Nicht gefunden">{fehler ?? 'Diesen Strafen-Abend gibt es nicht (mehr), oder er gehört zu einem anderen Team.'}</Notice>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640 }}>
            <Link href="/mein-team/kasse" style={zurueck}><Icon name="chevron" size={12} style={{ transform: 'rotate(180deg)' }} /> Teamkasse</Link>

            <div style={{ ...karte, gap: 6 }}>
              <h2 style={h2}>{abend.titel || 'Strafen-Abend'}</h2>
              <div style={klein}>{datumText(abend.datum)} · {abend.status === 'offen' ? 'läuft' : 'abgeschlossen'}
                {abend.ersatz_name && ` · Ersatz-Kassenwart: ${abend.ersatz_name}`}</div>
              {kasseDarf && abend.status === 'offen' && (
                <label style={{ marginTop: 6 }}><span style={label}>Ersatz-Kassenwart für diesen Abend</span>
                  <select value={abend.ersatz_player_id ?? ''} onChange={e => void ersatzAendern(e.target.value)} style={feld}>
                    <option value="">Keiner</option>
                    {mitKonto(kader).map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                </label>
              )}
              {!darf && abend.status === 'offen' && <div style={{ ...klein, marginTop: 4 }}>Du siehst mit, zählen dürfen Kapitän, Kassenwart{abend.ersatz_name ? ` und ${abend.ersatz_name}` : ''}.</div>}
            </div>

            {gebucht !== null && <div role="status" style={okStil}>{gebucht} {gebucht === 1 ? 'Strafe' : 'Strafen'} in die Teamkasse gebucht.</div>}
            {fehler && <div role="alert" style={fehlerStil}>{fehler}</div>}

            {darf && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {neuArt ? (
                  <>
                    <input value={neuArt.title} onChange={e => setNeuArt({ ...neuArt, title: e.target.value })} maxLength={60} placeholder="Strafe, z. B. Schwarze" style={{ ...feld, flex: '1 1 160px', width: 'auto' }} />
                    <input value={neuArt.betrag} onChange={e => setNeuArt({ ...neuArt, betrag: e.target.value })} inputMode="decimal" placeholder="0,50" style={{ ...feld, width: 90 }} />
                    <button type="button" onClick={eigeneDazu} style={hauptKnopf}>Dazu</button>
                    <button type="button" onClick={() => setNeuArt(null)} style={nebenKnopf}>Abbrechen</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setNeuArt({ title: '', betrag: '' })} style={plusKnopf}><Icon name="plus" size={14} stroke={2.4} /> Andere Strafe</button>
                )}
                {arten.length === 0 && !neuArt && <span style={klein}>Tipp: Häufige Strafen legst du in der Teamkasse unter „Strafen“ an.</span>}
              </div>
            )}

            <div style={{ ...karte, padding: '6px 14px', gap: 0 }}>
              {leute.length === 0 && <Muted>Noch keine Spieler im Kader.</Muted>}
              {leute.map(p => {
                const meine = arten.map(a => ({ a, n: striche.get(sKey(p.key, a.key))?.anzahl ?? 0 }));
                const cent = meine.reduce((x, y) => x + y.n * y.a.cents, 0);
                if (!darf && !cent) return null;
                return (
                  <div key={p.key} style={{ padding: '10px 0', borderTop: '1px solid var(--th-line-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: darf ? 8 : 2 }}>
                      <b style={{ fontFamily: 'var(--font-manrope)', fontSize: 14.5, color: 'var(--th-text-strong)' }}>{p.name}</b>
                      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, color: cent ? 'var(--th-accent)' : 'var(--th-text-faint)' }}>{euro(cent)}</span>
                    </div>
                    {darf ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 14px' }}>
                        {meine.map(({ a, n }) => (
                          <span key={a.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, color: n ? 'var(--th-accent)' : 'var(--th-text-muted)' }}>{a.title}</span>
                            <button type="button" onClick={() => void tippen(p, a, -1)} disabled={!n} aria-label={`${a.title} bei ${p.name} weniger`} style={{ ...zaehlKnopf(false), opacity: n ? 1 : 0.35 }}>−</button>
                            <span style={{ minWidth: 18, textAlign: 'center', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: n ? 'var(--th-text-strong)' : 'var(--th-text-faint)' }}>{n}</span>
                            <button type="button" onClick={() => void tippen(p, a, 1)} aria-label={`${a.title} bei ${p.name} mehr`} style={zaehlKnopf(true)}>+</button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div style={klein}>{meine.filter(x => x.n).map(x => `${x.a.title} × ${x.n}`).join(' · ')}</div>
                    )}
                  </div>
                );
              })}
              {!darf && summe.n === 0 && <div style={{ ...klein, padding: '12px 0' }}>Noch keine Strafen gezählt.</div>}
            </div>

            <div style={{ ...karte, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>
                {summe.n} {summe.n === 1 ? 'Strafe' : 'Strafen'} · {euro(summe.c)}
              </span>
              {darf && <button type="button" disabled={laeuft} onClick={() => void fertig()} style={{ ...hauptKnopf, opacity: laeuft ? 0.6 : 1 }}>{laeuft ? 'Bucht …' : 'Abschließen & in die Kasse'}</button>}
            </div>
            {kasseDarf && abend.status === 'offen' && (
              <button type="button" onClick={() => void loeschen()} style={{ ...nebenKnopf, alignSelf: 'flex-start', color: '#D64545' }}>Abend löschen</button>
            )}
          </div>
        )}
    </MemberShell>
  );
}

// ── Stile ──────────────────────────────────────────────────

const klein: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.45 };
const label: React.CSSProperties = { display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-text-muted)', marginBottom: 6 };
const feld: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--th-line-8)', background: 'var(--th-bg-card)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 15 };
const hauptKnopf: React.CSSProperties = { padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13.5 };
const nebenKnopf: React.CSSProperties = { padding: '9px 16px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: '1.5px solid var(--th-line-8)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13.5 };
const plusKnopf: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', background: 'var(--th-bg-card)', border: '1.5px dashed var(--th-accent)', color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13 };
const knopfKlein: React.CSSProperties = { padding: '6px 12px', borderRadius: 999, border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5, flexShrink: 0 };
const abendZeile: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--th-line-8)', textDecoration: 'none', fontFamily: 'var(--font-manrope)', fontSize: 14 };
const zurueck: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)', textDecoration: 'none' };
const fehlerStil: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A' };
const okStil: React.CSSProperties = { padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.35)', color: 'var(--th-win)' };
function zaehlKnopf(plus: boolean): React.CSSProperties {
  return { width: 34, height: 34, borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, border: `1.5px solid ${plus ? 'var(--th-accent)' : 'var(--th-line-8)'}`, background: plus ? 'var(--th-accent)' : 'transparent', color: plus ? '#fff' : 'var(--th-text-muted)' };
}
