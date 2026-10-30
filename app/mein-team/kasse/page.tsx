'use client';

// ============================================================
// Team Manager → Teamkasse (Migration 0051, Vorbild SpielerPlus)
// ============================================================
//
// Kopf: Kassenstand + offen gesamt. Drei Reiter:
//   • Spieler — Kontostand je Spieler (offen), aufklappbar mit allen Posten;
//     „bezahlt“ je Posten oder „Alles bezahlt“.
//   • Kassenbuch — alle Bewegungen der Kasse (Einnahmen, Ausgaben, bezahlte
//     Strafen/Beiträge) mit Kassenstand.
//   • Strafenkatalog — feste Strafen mit Betrag, beim Eintragen antippbar.
// Buchen: TC, Kassenwart (vom TC bestimmt), Ligaleitung. Alle im Team sehen
// alles (Betreiber, 16.10.2026). Keine Erinnerungen in der Glocke.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { hatTcRecht } from '@/lib/auth/roles';
import { zusagenFreigeschaltet } from '@/lib/features';
import { team27, NEUE_SAISON } from '@/lib/data/saison-2027';
import { ladeKader, type KaderOption } from '@/lib/supabase/season-teams';
import {
  ladeKasse, bucheMehrere, bucheStrafen, setzeBezahlt, loescheBuchung, speichereStrafart, loescheStrafart,
  speichereKassenEinstellung, kassenstand, offenSumme, istForderung, centAus, euro,
  type Buchung, type BuchungsArt, type Strafart, type KassenEinstellung,
} from '@/lib/supabase/kasse';
import { karte, h2 as h2Karte } from '@/components/mdu/zusagen-ui';
import { Icon } from '@/components/mdu/icon';

const heuteIso = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const datumKurz = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y.slice(2)}`; };
const GRUEN = 'var(--th-win)';
const ROT = '#D64545';

const ART: Record<BuchungsArt, { name: string; plus: string }> = {
  strafe: { name: 'Strafe', plus: 'Strafe eintragen' },
  beitrag: { name: 'Beitrag', plus: 'Beitrag eintragen' },
  einnahme: { name: 'Einnahme', plus: 'Einnahme buchen' },
  ausgabe: { name: 'Ausgabe', plus: 'Ausgabe buchen' },
};

type Reiter = 'offen' | 'spieler' | 'beitraege' | 'buch' | 'katalog';
type Msg = { kind: 'ok' | 'err'; text: string } | null;

export default function KassePage() {
  const { user, loading } = useAuth();
  const teamId = user?.teamId ?? null;
  const t = teamId ? team27(teamId) : undefined;
  // Kapitän oder Co-Captain mit Recht „Teamkasse“ (Migration 0062).
  const istKapitaen = !!teamId && hatTcRecht(user, teamId, 'kasse');

  const [kader, setKader] = useState<KaderOption[]>([]);
  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [strafarten, setStrafarten] = useState<Strafart[]>([]);
  const [einst, setEinst] = useState<KassenEinstellung>({ treasurer_player_id: null, opening_cents: 0 });
  const [bereit, setBereit] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [reiter, setReiter] = useState<Reiter>('spieler');
  const [formular, setFormular] = useState<BuchungsArt | null>(null);
  const [vorwahl, setVorwahl] = useState<string[] | null>(null);

  const laden = useCallback(async () => {
    if (!teamId) return;
    const [k, ka] = await Promise.all([ladeKader(NEUE_SAISON.id, teamId), ladeKasse(teamId)]);
    setKader(k); setBuchungen(ka.buchungen); setStrafarten(ka.strafarten); setEinst(ka.einst); setBereit(ka.bereit);
    if (ka.error) setMsg({ kind: 'err', text: ka.error });
  }, [teamId]);
  useEffect(() => { queueMicrotask(() => { void laden(); }); }, [laden]);

  const darfBuchen = istKapitaen || (!!user?.playerId && einst.treasurer_player_id === user.playerId);
  const stand = kassenstand(buchungen, einst.opening_cents);
  const offen = offenSumme(buchungen);
  const kassenwart = kader.find(k => k.id === einst.treasurer_player_id)?.name ?? null;

  // Spielerliste: Kader + alle, die noch Posten haben (z. B. aus dem Kader gegangen).
  const spieler = useMemo(() => {
    const m = new Map<string, { key: string; name: string; posten: Buchung[] }>();
    for (const k of kader) m.set(k.id, { key: k.id, name: k.name, posten: [] });
    for (const b of buchungen) if (istForderung(b) && b.player_key) {
      if (!m.has(b.player_key)) m.set(b.player_key, { key: b.player_key, name: b.player_name ?? '?', posten: [] });
      m.get(b.player_key)!.posten.push(b);
    }
    return [...m.values()]
      .map(s => ({ ...s, offen: s.posten.filter(p => !p.paid_at).reduce((x, p) => x + p.amount_cents, 0) }))
      .sort((a, b) => b.offen - a.offen || a.name.localeCompare(b.name, 'de'));
  }, [kader, buchungen]);

  const melde = (m: Msg) => { setMsg(m); };

  async function buchen(p: { kind: BuchungsArt; title: string; cents: number; datum: string; spieler: { key: string; name: string }[] }) {
    if (!user || !teamId) return false;
    const { data, error } = await bucheMehrere({ teamId, userId: user.id, ...p });
    if (error) { melde({ kind: 'err', text: error }); return false; }
    setBuchungen(l => [...data, ...l]); setFormular(null); setVorwahl(null);
    if (p.kind === 'beitrag') setReiter('beitraege');
    melde({ kind: 'ok', text: p.kind === 'strafe' || p.kind === 'beitrag'
      ? `${ART[p.kind].name} für ${data.length} ${data.length === 1 ? 'Spieler' : 'Spieler'} eingetragen.`
      : `${ART[p.kind].name} gebucht.` });
    return true;
  }

  async function strafenBuchen(datum: string, zeilen: { key: string; name: string; title: string; cents: number }[]) {
    if (!user || !teamId) return false;
    const { data, error } = await bucheStrafen({ teamId, userId: user.id, datum, zeilen });
    if (error) { melde({ kind: 'err', text: error }); return false; }
    setBuchungen(l => [...data, ...l]); setFormular(null); setVorwahl(null);
    const leute = new Set(data.map(b => b.player_key)).size;
    melde({ kind: 'ok', text: `${data.length} ${data.length === 1 ? 'Strafe' : 'Strafen'} für ${leute} Spieler eingetragen.` });
    return true;
  }

  async function bezahlt(ids: string[], ja: boolean) {
    if (!user) return;
    const vorher = buchungen;
    const jetzt = new Date().toISOString();
    setBuchungen(l => l.map(b => ids.includes(b.id) ? { ...b, paid_at: ja ? jetzt : null } : b));
    const { error } = await setzeBezahlt(ids, ja, user.id);
    if (error) { setBuchungen(vorher); melde({ kind: 'err', text: error }); }
  }

  async function weg(b: Buchung) {
    if (!window.confirm(`„${b.title}“ (${euro(b.amount_cents)}) wirklich löschen?`)) return;
    const vorher = buchungen;
    setBuchungen(l => l.filter(x => x.id !== b.id));
    const { error } = await loescheBuchung(b.id);
    if (error) { setBuchungen(vorher); melde({ kind: 'err', text: error }); }
  }

  return (
    <MemberShell title="Teamkasse">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Dieser Bereich ist nur für angemeldete Mitglieder.{' '}<LoginLink /></Notice>
        : !zusagenFreigeschaltet(user) ? (
          <Notice title="Noch nicht freigeschaltet">Die Teamkasse gehört zum Team Manager und ist für dein Team noch nicht verfügbar.</Notice>
        ) : !teamId || !t ? (
          <Notice title="Kein Team verknüpft">Deinem Konto ist noch kein Team zugeordnet. Bei Fragen melde dich bei der Ligaleitung.</Notice>
        ) : bereit === null ? <Muted>Lade …</Muted>
        : !bereit ? (
          <Notice title="Gleich startklar">Die Teamkasse wird gerade eingerichtet. Schau bitte etwas später noch mal vorbei.</Notice>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
            <Link href="/mein-team/zusagen" style={zurueck}><Icon name="chevron" size={12} style={{ transform: 'rotate(180deg)' }} /> Team Manager</Link>

            {msg && (
              <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`, color: msg.kind === 'err' ? '#E24B4A' : GRUEN }}>{msg.text}</div>
            )}

            {/* Kopf: Kassenstand */}
            <div style={{ ...karte, flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'stretch' }}>
              <Kennzahl titel="Kassenstand" wert={euro(stand)} farbe={stand < 0 ? ROT : 'var(--th-text-strong)'} />
              <Kennzahl titel="Noch offen" wert={euro(offen)} farbe={offen > 0 ? ROT : GRUEN} />
              <div style={{ flexBasis: '100%', fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>
                {kassenwart ? <>Kassenwart: <b style={{ color: 'var(--th-text-strong)' }}>{kassenwart}</b></> : 'Gebucht wird vom Kapitän.'}
                {!darfBuchen && ' · Du kannst die Kasse ansehen, buchen dürfen Kapitän und Kassenwart.'}
              </div>
            </div>

            {/* Buchen */}
            {darfBuchen && (formular === 'strafe' ? (
              <StrafenFormular kader={kader} strafarten={strafarten} vorwahl={vorwahl}
                onBuchen={strafenBuchen} onAbbrechen={() => { setFormular(null); setVorwahl(null); }} />
            ) : formular ? (
              <BuchFormular art={formular} kader={kader} strafarten={strafarten} vorwahl={vorwahl}
                onBuchen={buchen} onAbbrechen={() => { setFormular(null); setVorwahl(null); }} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                {(['strafe', 'beitrag', 'einnahme', 'ausgabe'] as BuchungsArt[]).map(a => (
                  <button key={a} type="button" onClick={() => { setFormular(a); setMsg(null); }} style={plusKnopf}>
                    <Icon name="plus" size={15} stroke={2.4} /> {ART[a].plus}
                  </button>
                ))}
              </div>
            ))}

            {/* Reiter */}
            <div role="tablist" style={{ display: 'flex', gap: 4, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)', borderRadius: 999, padding: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {([...(darfBuchen ? [['offen', 'Offen']] : []), ['spieler', 'Spieler'], ['beitraege', 'Beiträge'], ['buch', 'Kassenbuch'], ['katalog', 'Strafen']] as [Reiter, string][]).map(([r, n]) => (
                <button key={r} role="tab" aria-selected={reiter === r} type="button" onClick={() => setReiter(r)} style={{
                  flex: '1 0 auto', padding: '8px 10px', borderRadius: 999, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5,
                  background: reiter === r ? 'var(--th-accent)' : 'transparent', color: reiter === r ? '#fff' : 'var(--th-text-muted)',
                }}>{n}</button>
              ))}
            </div>

            {reiter === 'spieler' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {spieler.length === 0 && <Muted>Noch keine Spieler im Kader.</Muted>}
                {spieler.map(s => (
                  <SpielerZeile key={s.key} name={s.name} offen={s.offen} posten={s.posten} darfBuchen={darfBuchen}
                    onBezahlt={bezahlt} onLoeschen={weg}
                    onStrafe={() => { setVorwahl([s.key]); setFormular('strafe'); setMsg(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                ))}
              </div>
            )}

            {reiter === 'offen' && darfBuchen && <OffeneListe buchungen={buchungen} onBezahlt={bezahlt} />}

            {reiter === 'beitraege' && (
              <Beitraege buchungen={buchungen} kader={kader} darfBuchen={darfBuchen} onBezahlt={bezahlt} onLoeschen={weg}
                onNeu={() => { setFormular('beitrag'); setVorwahl(null); setMsg(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                onNachtragen={(b, k) => void buchen({ kind: 'beitrag', title: b.title, cents: b.cents, datum: b.datum, spieler: [{ key: k.id, name: k.name }] })} />
            )}

            {reiter === 'buch' && <Kassenbuch buchungen={buchungen} opening={einst.opening_cents} darfBuchen={darfBuchen} onLoeschen={weg} />}

            {reiter === 'katalog' && user && (
              <Katalog strafarten={strafarten} darfBuchen={darfBuchen}
                onSpeichern={async s => {
                  const { data, error } = await speichereStrafart(teamId, user.id, s);
                  if (error || !data) { melde({ kind: 'err', text: error ?? 'Konnte nicht speichern.' }); return false; }
                  setStrafarten(l => [...l.filter(x => x.id !== data.id), data].sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, 'de')));
                  return true;
                }}
                onLoeschen={async s => {
                  if (!window.confirm(`„${s.title}“ aus dem Katalog löschen? Schon eingetragene Strafen bleiben.`)) return;
                  const { error } = await loescheStrafart(s.id);
                  if (error) melde({ kind: 'err', text: error }); else setStrafarten(l => l.filter(x => x.id !== s.id));
                }} />
            )}

            {istKapitaen && user && (
              <Einstellungen einst={einst} kader={kader.filter(k => !k.id.startsWith('name:'))}
                onSpeichern={async (werte, ok) => {
                  const alt = einst;
                  setEinst(e => ({ ...e, ...werte }));
                  const { error } = await speichereKassenEinstellung(teamId, user.id, werte);
                  if (error) { setEinst(alt); melde({ kind: 'err', text: error }); } else melde({ kind: 'ok', text: ok });
                }} />
            )}
          </div>
        )}
    </MemberShell>
  );
}

// ── Bausteine ──────────────────────────────────────────────

function Kennzahl({ titel, wert, farbe }: { titel: string; wert: string; farbe: string }) {
  return (
    <div style={{ flex: '1 1 140px', padding: '10px 12px', borderRadius: 12, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)' }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>{titel}</div>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28, color: farbe, lineHeight: 1.15 }}>{wert}</div>
    </div>
  );
}

function BuchFormular({ art, kader, strafarten, vorwahl, onBuchen, onAbbrechen }: {
  art: BuchungsArt; kader: KaderOption[]; strafarten: Strafart[]; vorwahl: string[] | null;
  onBuchen: (p: { kind: BuchungsArt; title: string; cents: number; datum: string; spieler: { key: string; name: string }[] }) => Promise<boolean>;
  onAbbrechen: () => void;
}) {
  const mitSpielern = art === 'strafe' || art === 'beitrag';
  const [titel, setTitel] = useState('');
  const [betrag, setBetrag] = useState('');
  const [datum, setDatum] = useState(heuteIso());
  const [wahl, setWahl] = useState<Set<string>>(() => new Set(vorwahl ?? (art === 'beitrag' ? kader.map(k => k.id) : [])));
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const umschalten = (id: string) => setWahl(w => { const n = new Set(w); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  async function senden() {
    const cents = centAus(betrag);
    if (!titel.trim()) return setFehler('Bitte eine Bezeichnung eintragen.');
    if (!cents) return setFehler('Bitte einen gültigen Betrag eintragen, z. B. 2,50.');
    if (mitSpielern && wahl.size === 0) return setFehler('Bitte mindestens einen Spieler auswählen.');
    setFehler(null); setLaeuft(true);
    await onBuchen({ kind: art, title: titel, cents, datum, spieler: kader.filter(k => wahl.has(k.id)).map(k => ({ key: k.id, name: k.name })) });
    setLaeuft(false);
  }

  return (
    <div style={{ ...karte, gap: 12 }}>
      <h2 style={h2Karte}>{ART[art].plus}</h2>

      {art === 'strafe' && strafarten.length > 0 && (
        <div>
          <div style={label}>Aus dem Strafenkatalog</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {strafarten.map(s => {
              const an = titel === s.title && centAus(betrag) === s.amount_cents;
              return (
                <button key={s.id} type="button" onClick={() => { setTitel(s.title); setBetrag((s.amount_cents / 100).toFixed(2).replace('.', ',')); }} style={chipKnopf(an)}>
                  {s.title} · {euro(s.amount_cents)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
        <label><span style={label}>Bezeichnung</span>
          <input value={titel} onChange={e => setTitel(e.target.value)} maxLength={80} placeholder={art === 'strafe' ? 'z. B. Zu spät' : art === 'beitrag' ? 'z. B. Saisonbeitrag' : art === 'einnahme' ? 'z. B. Spende' : 'z. B. Trikots'} style={feld} />
        </label>
        <label><span style={label}>Betrag (€)</span>
          <input value={betrag} onChange={e => setBetrag(e.target.value)} inputMode="decimal" placeholder="0,00" style={feld} />
        </label>
      </div>
      <label style={{ maxWidth: 200 }}><span style={label}>Datum</span>
        <input type="date" value={datum} onChange={e => setDatum(e.target.value || heuteIso())} style={feld} />
      </label>

      {mitSpielern && (
        <div>
          <div style={{ ...label, display: 'flex', justifyContent: 'space-between' }}>
            <span>Spieler ({wahl.size})</span>
            <button type="button" onClick={() => setWahl(w => w.size === kader.length ? new Set() : new Set(kader.map(k => k.id)))} style={textKnopf}>
              {wahl.size === kader.length ? 'Keinen' : 'Alle'}
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {kader.map(k => <button key={k.id} type="button" onClick={() => umschalten(k.id)} style={chipKnopf(wahl.has(k.id))}>{k.name}</button>)}
          </div>
        </div>
      )}

      {fehler && <div role="alert" style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A' }}>{fehler}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" disabled={laeuft} onClick={() => void senden()} style={{ ...hauptKnopf, opacity: laeuft ? 0.6 : 1 }}>{laeuft ? 'Speichert …' : 'Speichern'}</button>
        <button type="button" onClick={onAbbrechen} style={nebenKnopf}>Abbrechen</button>
      </div>
    </div>
  );
}

// ── Strafen mit Anzahl (Betreiber, 30.10.2026) ─────────────
// Mehrere Strafarten auf einmal; je Spieler und Strafart ein Zähler (− / +).
// Gespeichert wird je Spieler und Strafart EIN Posten: „U26 × 3“, Betrag × Anzahl.
type StrafSpalte = { id: string; title: string; cents: number; eigen?: boolean; betragText?: string };

function StrafenFormular({ kader, strafarten, vorwahl, onBuchen, onAbbrechen }: {
  kader: KaderOption[]; strafarten: Strafart[]; vorwahl: string[] | null;
  onBuchen: (datum: string, zeilen: { key: string; name: string; title: string; cents: number }[]) => Promise<boolean>;
  onAbbrechen: () => void;
}) {
  const [spalten, setSpalten] = useState<StrafSpalte[]>(() => strafarten.length === 1
    ? [{ id: strafarten[0].id, title: strafarten[0].title, cents: strafarten[0].amount_cents }] : []);
  const [anzahl, setAnzahl] = useState<Record<string, number>>({});
  const [datum, setDatum] = useState(heuteIso());
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  // Vom Spieler aus geöffnet: diesen zuerst zeigen.
  const leute = vorwahl?.length ? [...kader.filter(k => vorwahl.includes(k.id)), ...kader.filter(k => !vorwahl.includes(k.id))] : kader;

  const k = (spieler: string, spalte: string) => `${spieler}|${spalte}`;
  const umschalten = (s: Strafart) => setSpalten(l => l.some(x => x.id === s.id)
    ? l.filter(x => x.id !== s.id) : [...l, { id: s.id, title: s.title, cents: s.amount_cents }]);
  const eigeneDazu = () => setSpalten(l => [...l, { id: `eigen-${Date.now()}`, title: '', cents: 0, eigen: true, betragText: '' }]);
  const eigeneAendern = (id: string, w: Partial<StrafSpalte>) => setSpalten(l => l.map(x => x.id === id ? { ...x, ...w } : x));
  const zaehlen = (spieler: string, spalte: string, d: number) => setAnzahl(a => ({ ...a, [k(spieler, spalte)]: Math.max(0, Math.min(99, (a[k(spieler, spalte)] ?? 0) + d)) }));

  const centsVon = (s: StrafSpalte) => (s.eigen ? centAus(s.betragText ?? '') ?? 0 : s.cents);
  const posten = leute.flatMap(p => spalten.map(s => ({ p, s, n: anzahl[k(p.id, s.id)] ?? 0 }))).filter(x => x.n > 0);
  const summe = posten.reduce((x, { s, n }) => x + centsVon(s) * n, 0);

  async function senden() {
    if (!spalten.length) return setFehler('Bitte mindestens eine Strafe auswählen.');
    const kaputt = posten.find(({ s }) => s.eigen && (!s.title.trim() || !centsVon(s)));
    if (kaputt) return setFehler('Bitte bei der eigenen Strafe Bezeichnung und Betrag eintragen, z. B. 0,50.');
    if (!posten.length) return setFehler('Bitte bei mindestens einem Spieler eine Anzahl eintragen.');
    setFehler(null); setLaeuft(true);
    await onBuchen(datum, posten.map(({ p, s, n }) => ({
      key: p.id, name: p.name, title: n > 1 ? `${s.title.trim()} × ${n}` : s.title.trim(), cents: centsVon(s) * n,
    })));
    setLaeuft(false);
  }

  return (
    <div style={{ ...karte, gap: 12 }}>
      <h2 style={h2Karte}>Strafen eintragen</h2>

      <div>
        <div style={label}>Strafen (mehrere möglich)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {strafarten.map(s => (
            <button key={s.id} type="button" onClick={() => umschalten(s)} aria-pressed={spalten.some(x => x.id === s.id)} style={chipKnopf(spalten.some(x => x.id === s.id))}>
              {s.title} · {euro(s.amount_cents)}
            </button>
          ))}
          <button type="button" onClick={eigeneDazu} style={{ ...chipKnopf(false), borderStyle: 'dashed', color: 'var(--th-accent)' }}>+ Andere Strafe</button>
        </div>
        {strafarten.length === 0 && <div style={{ ...label, fontWeight: 600, marginTop: 6 }}>Tipp: Häufige Strafen legst du unter „Strafen“ im Katalog an, dann reicht hier ein Tipp.</div>}
      </div>

      {spalten.filter(s => s.eigen).map(s => (
        <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px auto', gap: 8, alignItems: 'end' }}>
          <label><span style={label}>Bezeichnung</span>
            <input value={s.title} onChange={e => eigeneAendern(s.id, { title: e.target.value })} maxLength={70} placeholder="z. B. Zu spät" style={feld} />
          </label>
          <label><span style={label}>Betrag (€)</span>
            <input value={s.betragText ?? ''} onChange={e => eigeneAendern(s.id, { betragText: e.target.value })} inputMode="decimal" placeholder="0,50" style={feld} />
          </label>
          <button type="button" onClick={() => setSpalten(l => l.filter(x => x.id !== s.id))} aria-label="Eigene Strafe entfernen" style={{ ...nebenKnopf, padding: '9px 12px' }}>
            <Icon name="close" size={14} stroke={2.4} />
          </button>
        </div>
      ))}

      <label style={{ maxWidth: 200 }}><span style={label}>Datum</span>
        <input type="date" value={datum} onChange={e => setDatum(e.target.value || heuteIso())} style={feld} />
      </label>

      {spalten.length > 0 && (
        <div>
          <div style={label}>Anzahl je Spieler</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {leute.map(p => (
              <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 14px', padding: '9px 0', borderTop: '1px solid var(--th-line-4)' }}>
                <span style={{ flex: '1 1 140px', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)' }}>{p.name}</span>
                <span style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px' }}>
                  {spalten.map(s => {
                    const n = anzahl[k(p.id, s.id)] ?? 0;
                    return (
                      <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: n ? 'var(--th-accent)' : 'var(--th-text-muted)' }}>{s.title.trim() || 'Andere'}</span>
                        <button type="button" onClick={() => zaehlen(p.id, s.id, -1)} disabled={!n} aria-label={`${s.title || 'Strafe'} bei ${p.name} weniger`} style={{ ...kleinKnopf(false), width: 28, height: 28, opacity: n ? 1 : 0.4 }}>−</button>
                        <span style={{ minWidth: 18, textAlign: 'center', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: n ? 'var(--th-text-strong)' : 'var(--th-text-faint)' }}>{n}</span>
                        <button type="button" onClick={() => zaehlen(p.id, s.id, 1)} aria-label={`${s.title || 'Strafe'} bei ${p.name} mehr`} style={{ ...kleinKnopf(n > 0), width: 28, height: 28 }}>+</button>
                      </span>
                    );
                  })}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'var(--th-text-strong)' }}>
            {posten.length ? `${posten.reduce((x, y) => x + y.n, 0)} Strafen · ${euro(summe)}` : 'Noch nichts gezählt.'}
          </div>
        </div>
      )}

      {fehler && <div role="alert" style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A' }}>{fehler}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" disabled={laeuft} onClick={() => void senden()} style={{ ...hauptKnopf, opacity: laeuft ? 0.6 : 1 }}>{laeuft ? 'Speichert …' : 'Speichern'}</button>
        <button type="button" onClick={onAbbrechen} style={nebenKnopf}>Abbrechen</button>
      </div>
    </div>
  );
}

function SpielerZeile({ name, offen, posten, darfBuchen, onBezahlt, onLoeschen, onStrafe }: {
  name: string; offen: number; posten: Buchung[]; darfBuchen: boolean;
  onBezahlt: (ids: string[], ja: boolean) => void; onLoeschen: (b: Buchung) => void; onStrafe: () => void;
}) {
  const [auf, setAuf] = useState(false);
  const offenIds = posten.filter(p => !p.paid_at).map(p => p.id);
  return (
    <div style={{ ...karte, padding: 0, gap: 0 }}>
      <button type="button" onClick={() => setAuf(a => !a)} aria-expanded={auf} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
        <span style={{ flex: 1, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14.5, color: 'var(--th-text-strong)' }}>{name}</span>
        <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: offen > 0 ? ROT : GRUEN }}>{offen > 0 ? `${euro(offen)} offen` : 'alles bezahlt'}</span>
        <Icon name="chevron-down" size={15} style={{ color: 'var(--th-text-muted)', transform: auf ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>
      {auf && (
        <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {posten.length === 0 && <Muted>Keine Strafen oder Beiträge.</Muted>}
          {posten.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)', fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, color: 'var(--th-text-strong)', textDecoration: p.paid_at ? 'line-through' : 'none' }}>{p.title}</span>
                <span style={{ fontSize: 11.5, color: 'var(--th-text-muted)' }}>{ART[p.kind].name} · {datumKurz(p.entry_date)}{p.paid_at ? ` · bezahlt ${datumKurz(p.paid_at.slice(0, 10))}` : ''}</span>
              </span>
              <span style={{ fontWeight: 800, color: p.paid_at ? 'var(--th-text-muted)' : ROT }}>{euro(p.amount_cents)}</span>
              {darfBuchen && <>
                <button type="button" onClick={() => onBezahlt([p.id], !p.paid_at)} title={p.paid_at ? 'Wieder auf offen' : 'Als bezahlt markieren'} style={kleinKnopf(!!p.paid_at)}>
                  <Icon name="check" size={14} stroke={2.6} />
                </button>
                <button type="button" onClick={() => onLoeschen(p)} title="Löschen" aria-label="Löschen" style={kleinKnopf(false)}><Icon name="close" size={13} stroke={2.4} /></button>
              </>}
            </div>
          ))}
          {darfBuchen && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {offenIds.length > 0 && <button type="button" onClick={() => onBezahlt(offenIds, true)} style={hauptKnopf}>Alles bezahlt ({euro(offen)})</button>}
              <button type="button" onClick={onStrafe} style={nebenKnopf}>+ Strafe</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Alle offenen Strafen und Beiträge auf einen Blick — ankreuzen, gesammelt abhaken (TC/Kassenwart). */
function OffeneListe({ buchungen, onBezahlt }: { buchungen: Buchung[]; onBezahlt: (ids: string[], ja: boolean) => Promise<void> }) {
  const offen = useMemo(() => buchungen.filter(b => istForderung(b) && !b.paid_at)
    .sort((a, b) => (a.player_name ?? '').localeCompare(b.player_name ?? '', 'de') || a.entry_date.localeCompare(b.entry_date)), [buchungen]);
  const [wahl, setWahl] = useState<Set<string>>(new Set());
  const gewaehlt = offen.filter(b => wahl.has(b.id));
  const summe = gewaehlt.reduce((x, b) => x + b.amount_cents, 0);
  const alle = offen.length > 0 && gewaehlt.length === offen.length;
  const umschalten = (id: string) => setWahl(w => { const n = new Set(w); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  if (offen.length === 0) return <Muted>Nichts offen – alle Strafen und Beiträge sind bezahlt. 🎯</Muted>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px 4px', fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)' }}>
        <button type="button" onClick={() => setWahl(alle ? new Set() : new Set(offen.map(b => b.id)))} aria-label={alle ? 'Keinen auswählen' : 'Alle auswählen'} style={kleinKnopf(alle)}>
          {alle && <Icon name="check" size={14} stroke={2.8} />}
        </button>
        <span style={{ flex: 1 }}>{offen.length} offene Posten · {euro(offenSumme(offen))}</span>
      </div>
      {offen.map(b => {
        const an = wahl.has(b.id);
        return (
          <button key={b.id} type="button" onClick={() => umschalten(b.id)} aria-pressed={an}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%',
              background: an ? 'rgba(34,197,94,0.10)' : 'var(--th-bg-card)', border: `1px solid ${an ? GRUEN : 'var(--th-line-6)'}`, fontFamily: 'var(--font-manrope)', fontSize: 13.5 }}>
            <span style={kleinKnopf(an)}>{an && <Icon name="check" size={14} stroke={2.8} />}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 800, color: 'var(--th-text-strong)' }}>{b.player_name}</span>
              <span style={{ fontSize: 12, color: 'var(--th-text-muted)' }}>{ART[b.kind].name}: {b.title} · {datumKurz(b.entry_date)}</span>
            </span>
            <span style={{ fontWeight: 800, color: ROT, whiteSpace: 'nowrap' }}>{euro(b.amount_cents)}</span>
          </button>
        );
      })}
      {gewaehlt.length > 0 && (
        <div style={{ position: 'sticky', bottom: 76, zIndex: 5, marginTop: 6 }}>
          <button type="button" onClick={async () => { const ids = gewaehlt.map(b => b.id); setWahl(new Set()); await onBezahlt(ids, true); }}
            style={{ ...hauptKnopf, width: '100%', padding: '13px 16px', fontSize: 14.5, background: GRUEN, boxShadow: '0 6px 18px var(--th-shadow)' }}>
            {gewaehlt.length} Posten als bezahlt abhaken · {euro(summe)}
          </button>
        </div>
      )}
    </div>
  );
}

/** Ein Beitrag = alle Beitrags-Posten mit gleicher Bezeichnung, gleichem Datum und Betrag. */
type BeitragGruppe = { key: string; title: string; datum: string; cents: number; posten: Buchung[] };

function Beitraege({ buchungen, kader, darfBuchen, onBezahlt, onLoeschen, onNeu, onNachtragen }: {
  buchungen: Buchung[]; kader: KaderOption[]; darfBuchen: boolean;
  onBezahlt: (ids: string[], ja: boolean) => void; onLoeschen: (b: Buchung) => void;
  onNeu: () => void; onNachtragen: (g: BeitragGruppe, k: KaderOption) => void;
}) {
  const gruppen = useMemo(() => {
    const m = new Map<string, BeitragGruppe>();
    for (const b of buchungen) if (b.kind === 'beitrag') {
      const key = `${b.title}|${b.entry_date}|${b.amount_cents}`;
      if (!m.has(key)) m.set(key, { key, title: b.title, datum: b.entry_date, cents: b.amount_cents, posten: [] });
      m.get(key)!.posten.push(b);
    }
    return [...m.values()].sort((a, b) => b.datum.localeCompare(a.datum));
  }, [buchungen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {darfBuchen && <button type="button" onClick={onNeu} style={{ ...plusKnopf, alignSelf: 'flex-start' }}><Icon name="plus" size={15} stroke={2.4} /> Neuer Beitrag</button>}
      {gruppen.length === 0 && <Muted>{darfBuchen ? 'Noch keine Beiträge. Leg einen an, z. B. „Saisonbeitrag 30 €“ – er gilt erst mal für alle, abhaken kannst du jeden einzeln.' : 'Noch keine Beiträge.'}</Muted>}
      {gruppen.map(g => <BeitragKarte key={g.key} g={g} kader={kader} darfBuchen={darfBuchen} onBezahlt={onBezahlt} onLoeschen={onLoeschen} onNachtragen={k => onNachtragen(g, k)} />)}
    </div>
  );
}

function BeitragKarte({ g, kader, darfBuchen, onBezahlt, onLoeschen, onNachtragen }: {
  g: BeitragGruppe; kader: KaderOption[]; darfBuchen: boolean;
  onBezahlt: (ids: string[], ja: boolean) => void; onLoeschen: (b: Buchung) => void; onNachtragen: (k: KaderOption) => void;
}) {
  const bezahlt = g.posten.filter(p => p.paid_at);
  const fehlen = kader.filter(k => !g.posten.some(p => p.player_key === k.id));
  const posten = [...g.posten].sort((a, b) => Number(!!a.paid_at) - Number(!!b.paid_at) || (a.player_name ?? '').localeCompare(b.player_name ?? '', 'de'));
  const anteil = g.posten.length ? bezahlt.length / g.posten.length : 0;
  return (
    <div style={{ ...karte, gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ ...h2Karte, flex: 1 }}>{g.title}</h2>
        <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>{euro(g.cents)} je Spieler</span>
      </div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)' }}>
        {datumKurz(g.datum)} · <b style={{ color: anteil === 1 ? GRUEN : 'var(--th-text-strong)' }}>{bezahlt.length} von {g.posten.length} bezahlt</b> · eingesammelt {euro(bezahlt.length * g.cents)}{bezahlt.length < g.posten.length ? `, offen ${euro((g.posten.length - bezahlt.length) * g.cents)}` : ''}
      </div>
      <div aria-hidden style={{ height: 6, borderRadius: 999, background: 'var(--th-line-8)', overflow: 'hidden' }}>
        <div style={{ width: `${anteil * 100}%`, height: '100%', background: GRUEN, transition: 'width 200ms ease' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {posten.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 10, background: 'var(--th-bg-card3)', border: '1px solid var(--th-line-6)', fontFamily: 'var(--font-manrope)', fontSize: 14 }}>
            <button type="button" disabled={!darfBuchen} onClick={() => onBezahlt([p.id], !p.paid_at)}
              aria-label={p.paid_at ? `${p.player_name}: bezahlt – wieder auf offen` : `${p.player_name}: als bezahlt abhaken`}
              style={{ ...kleinKnopf(!!p.paid_at), cursor: darfBuchen ? 'pointer' : 'default' }}>
              {p.paid_at && <Icon name="check" size={14} stroke={2.8} />}
            </button>
            <span style={{ flex: 1, fontWeight: 700, color: 'var(--th-text-strong)' }}>{p.player_name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: p.paid_at ? GRUEN : ROT }}>{p.paid_at ? `bezahlt ${datumKurz(p.paid_at.slice(0, 10))}` : 'offen'}</span>
            {darfBuchen && <button type="button" onClick={() => onLoeschen(p)} title="Aus dem Beitrag nehmen" aria-label="Aus dem Beitrag nehmen" style={kleinKnopf(false)}><Icon name="close" size={13} stroke={2.4} /></button>}
          </div>
        ))}
      </div>
      {darfBuchen && fehlen.length > 0 && (
        <div>
          <div style={label}>Noch nicht dabei – antippen zum Hinzufügen</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {fehlen.map(k => <button key={k.id} type="button" onClick={() => onNachtragen(k)} style={chipKnopf(false)}>+ {k.name}</button>)}
          </div>
        </div>
      )}
      {darfBuchen && bezahlt.length < g.posten.length && (
        <button type="button" onClick={() => onBezahlt(g.posten.filter(p => !p.paid_at).map(p => p.id), true)} style={{ ...nebenKnopf, alignSelf: 'flex-start' }}>Alle als bezahlt abhaken</button>
      )}
    </div>
  );
}

function Kassenbuch({ buchungen, opening, darfBuchen, onLoeschen }: { buchungen: Buchung[]; opening: number; darfBuchen: boolean; onLoeschen: (b: Buchung) => void }) {
  // Bewegungen der Kasse: Einnahmen, Ausgaben und bezahlte Strafen/Beiträge (am Zahltag).
  const zeilen = buchungen
    .filter(b => !istForderung(b) || b.paid_at)
    .map(b => ({ b, datum: istForderung(b) ? b.paid_at!.slice(0, 10) : b.entry_date, plus: b.kind !== 'ausgabe' }))
    .sort((x, y) => y.datum.localeCompare(x.datum) || y.b.created_at.localeCompare(x.b.created_at));
  if (zeilen.length === 0 && !opening) return <Muted>Noch keine Bewegungen in der Kasse.</Muted>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {zeilen.map(({ b, datum, plus }) => (
        <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
          <span style={{ width: 52, flexShrink: 0, fontSize: 12, color: 'var(--th-text-muted)' }}>{datumKurz(datum)}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 700, color: 'var(--th-text-strong)' }}>{b.title}</span>
            <span style={{ fontSize: 11.5, color: 'var(--th-text-muted)' }}>{ART[b.kind].name}{b.player_name ? ` · ${b.player_name}` : ''}</span>
          </span>
          <span style={{ fontWeight: 800, color: plus ? GRUEN : ROT, whiteSpace: 'nowrap' }}>{plus ? '+' : '−'} {euro(b.amount_cents)}</span>
          {darfBuchen && !istForderung(b) && <button type="button" onClick={() => onLoeschen(b)} title="Löschen" aria-label="Löschen" style={kleinKnopf(false)}><Icon name="close" size={13} stroke={2.4} /></button>}
        </div>
      ))}
      {opening !== 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)' }}>
          <span>Anfangsbestand</span><span style={{ fontWeight: 800 }}>{euro(opening)}</span>
        </div>
      )}
    </div>
  );
}

function Katalog({ strafarten, darfBuchen, onSpeichern, onLoeschen }: {
  strafarten: Strafart[]; darfBuchen: boolean;
  onSpeichern: (s: { id?: string; title: string; cents: number; sort: number }) => Promise<boolean>;
  onLoeschen: (s: Strafart) => void;
}) {
  const [bearb, setBearb] = useState<Strafart | 'neu' | null>(null);
  const [titel, setTitel] = useState('');
  const [betrag, setBetrag] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);

  const oeffne = (s: Strafart | 'neu') => {
    setBearb(s); setFehler(null);
    setTitel(s === 'neu' ? '' : s.title);
    setBetrag(s === 'neu' ? '' : (s.amount_cents / 100).toFixed(2).replace('.', ','));
  };
  async function speichern() {
    const cents = centAus(betrag);
    if (!titel.trim()) return setFehler('Bitte eine Bezeichnung eintragen.');
    if (!cents || cents > 100000) return setFehler('Bitte einen gültigen Betrag eintragen, z. B. 0,50.');
    const ok = await onSpeichern({ id: bearb && bearb !== 'neu' ? bearb.id : undefined, title: titel, cents, sort: bearb && bearb !== 'neu' ? bearb.sort : strafarten.length });
    if (ok) setBearb(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {strafarten.length === 0 && <Muted>{darfBuchen ? 'Noch keine Strafen im Katalog. Leg die üblichen an, dann sind sie beim Eintragen mit einem Tipp gewählt.' : 'Noch keine Strafen im Katalog.'}</Muted>}
      {strafarten.map(s => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', fontFamily: 'var(--font-manrope)', fontSize: 14 }}>
          <span style={{ flex: 1, fontWeight: 700, color: 'var(--th-text-strong)' }}>{s.title}</span>
          <span style={{ fontWeight: 800, color: 'var(--th-text-strong)' }}>{euro(s.amount_cents)}</span>
          {darfBuchen && <>
            <button type="button" onClick={() => oeffne(s)} title="Bearbeiten" aria-label="Bearbeiten" style={kleinKnopf(false)}><Icon name="edit" size={13} /></button>
            <button type="button" onClick={() => onLoeschen(s)} title="Löschen" aria-label="Löschen" style={kleinKnopf(false)}><Icon name="close" size={13} stroke={2.4} /></button>
          </>}
        </div>
      ))}
      {darfBuchen && (bearb ? (
        <div style={{ ...karte, gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 8 }}>
            <label><span style={label}>Strafe</span><input value={titel} onChange={e => setTitel(e.target.value)} maxLength={60} placeholder="z. B. Bull verfehlt" style={feld} /></label>
            <label><span style={label}>Betrag (€)</span><input value={betrag} onChange={e => setBetrag(e.target.value)} inputMode="decimal" placeholder="0,50" style={feld} /></label>
          </div>
          {fehler && <div role="alert" style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A' }}>{fehler}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => void speichern()} style={hauptKnopf}>Speichern</button>
            <button type="button" onClick={() => setBearb(null)} style={nebenKnopf}>Abbrechen</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => oeffne('neu')} style={{ ...plusKnopf, alignSelf: 'flex-start' }}><Icon name="plus" size={15} stroke={2.4} /> Strafe zum Katalog</button>
      ))}
    </div>
  );
}

function Einstellungen({ einst, kader, onSpeichern }: {
  einst: KassenEinstellung; kader: KaderOption[];
  onSpeichern: (werte: Partial<KassenEinstellung>, ok: string) => void;
}) {
  const [anfang, setAnfang] = useState((einst.opening_cents / 100).toFixed(2).replace('.', ','));
  const [fehler, setFehler] = useState<string | null>(null);
  return (
    <details style={{ ...karte, padding: '14px 16px' }}>
      <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>Einstellungen der Kasse</summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        <label><span style={label}>Kassenwart (darf buchen, braucht ein Konto)</span>
          <select value={einst.treasurer_player_id ?? ''} onChange={e => {
            const id = e.target.value || null;
            const n = kader.find(k => k.id === id)?.name;
            onSpeichern({ treasurer_player_id: id }, n ? `${n} ist jetzt Kassenwart.` : 'Kein Kassenwart mehr – gebucht wird vom Kapitän.');
          }} style={feld}>
            <option value="">– keiner, nur der Kapitän –</option>
            {kader.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </label>
        <div>
          <span style={label}>Anfangsbestand (€) – was schon in der Kasse war</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={anfang} onChange={e => setAnfang(e.target.value)} inputMode="decimal" style={{ ...feld, maxWidth: 140 }} />
            <button type="button" onClick={() => {
              const t = anfang.trim();
              const c = t === '' || /^0+([,.]0+)?$/.test(t) ? 0 : centAus(t);
              if (c === null) { setFehler('Bitte einen gültigen Betrag eintragen, z. B. 120,00.'); return; }
              setFehler(null); onSpeichern({ opening_cents: c }, `Anfangsbestand: ${euro(c)}.`);
            }} style={hauptKnopf}>Speichern</button>
          </div>
          {fehler && <div role="alert" style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A', marginTop: 6 }}>{fehler}</div>}
        </div>
      </div>
    </details>
  );
}

// ── Stile ──────────────────────────────────────────────────

const zurueck: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)', textDecoration: 'none' };
const label: React.CSSProperties = { display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-text-muted)', marginBottom: 6 };
const feld: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--th-line-8)', background: 'var(--th-bg-card)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 15 };
const plusKnopf: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 12px', borderRadius: 12, cursor: 'pointer', background: 'var(--th-bg-card)', border: '1.5px dashed var(--th-accent)', color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13 };
const hauptKnopf: React.CSSProperties = { padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13.5 };
const nebenKnopf: React.CSSProperties = { padding: '9px 16px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: '1.5px solid var(--th-line-8)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13.5 };
const textKnopf: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12, padding: 0 };
function chipKnopf(an: boolean): React.CSSProperties {
  return { padding: '7px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, border: `1.5px solid ${an ? 'var(--th-accent)' : 'var(--th-line-8)'}`, background: an ? 'var(--th-accent)' : 'var(--th-bg-card)', color: an ? '#fff' : 'var(--th-text-strong)' };
}
function kleinKnopf(an: boolean): React.CSSProperties {
  return { width: 30, height: 30, flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, cursor: 'pointer', border: `1.5px solid ${an ? GRUEN : 'var(--th-line-8)'}`, background: an ? GRUEN : 'transparent', color: an ? '#fff' : 'var(--th-text-muted)' };
}
