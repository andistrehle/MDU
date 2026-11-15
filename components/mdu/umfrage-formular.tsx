'use client';

// ============================================================
// Website-Umfrage: Formular (lib/umfrage.ts, /api/umfrage)
// ============================================================
// Anonym, je Gerät einmal (Geräte-Kennung im localStorage). Solange die
// Umfrage nicht läuft: Vorschau, „Absenden“ speichert nichts.
// Letzte Frage „Team Manager“: bei Nein/Weiß nicht ein Hinweis mit Weg zum
// kostenlosen Test — Kapitän/Co-Captain direkt zur Freischaltung, alle
// anderen zum Video-Beitrag (zum Weitergeben an den Kapitän).
// ============================================================

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { hatTcRecht } from '@/lib/auth/roles';
import { FRAGEN, NAME_MAX, TEXT_MAX, UMFRAGE, antwortenPruefen, fragenZahl, freitextBei, sichtbareFragen, sichtbareOptionen, umfrageEnde, umfrageLaeuft, type Antworten, type Frage, type UmfrageDef } from '@/lib/umfrage';
import { TESTTAGE } from '@/lib/premium';
import { SprachKnopf } from './sprach-knopf';

export const UMFRAGE_GERAET_KEY = 'mdu-umfrage-geraet';
export const umfrageFertigKey = (def: UmfrageDef = UMFRAGE) => `mdu-umfrage-${def.id}-fertig`;
/** „Geh ma ned auf’n Wecker“ — Popup auf diesem Gerät nicht mehr zeigen (nichts gespeichert). */
export const umfrageAbgelehntKey = (def: UmfrageDef = UMFRAGE) => `mdu-umfrage-${def.id}-abgelehnt`;
/** Zwischenstand (Antworten + Frage), damit ein × nichts kostet (Betreiber 15.11.2026). */
export const umfrageStandKey = (def: UmfrageDef = UMFRAGE) => `mdu-umfrage-${def.id}-stand`;

function geraetId(): string {
  try {
    let id = localStorage.getItem(UMFRAGE_GERAET_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(UMFRAGE_GERAET_KEY, id); }
    return id;
  } catch { return crypto.randomUUID(); }
}

const datumDe = (iso: string | null) => (iso ?? '').split('-').reverse().join('.');
const font = 'var(--font-manrope)';

/** Im Popup (Betreiber 15.11.2026: die ganze Umfrage läuft im Popup) ohne eigene Kartenrahmen. */
const ImPopup = createContext(false);

interface FormularProps {
  def?: UmfrageDef; fragen?: Frage[]; imPopup?: boolean; onSchliessen?: () => void;
  /** Eigener Einstiegstext (Popup vor/nach einem Bericht). */
  einstieg?: { titel: string; frage: string };
  /** Zeigt im Einstieg „Erst den Bericht lesen 📖“ statt „Später vielleicht“. */
  onErstLesen?: () => void;
}

export function UmfrageFormular(props: FormularProps = {}) {
  return <ImPopup.Provider value={!!props.imPopup}><FormularInnen {...props} /></ImPopup.Provider>;
}

function FormularInnen({ def = UMFRAGE, fragen = FRAGEN, imPopup = false, onSchliessen, einstieg, onErstLesen }: FormularProps) {
  const { user } = useAuth();
  const [a, setA] = useState<Antworten>({});
  // 'start' = Einstiegs-Bildschirm (nur wenn die Umfrage eine Einstiegsfrage hat), 'nein' = „Geh ma ned …“, 'spaeter'.
  const einstiegsFrage = fragen.find(f => f.einstieg);
  const [status, setStatus] = useState<'start' | 'neu' | 'sende' | 'fertig' | 'schon' | 'nein' | 'spaeter'>(einstiegsFrage ? 'start' : 'neu');
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);
  const [schritt, setSchritt] = useState(0);
  const [weiter, setWeiter] = useState(false); // „Schön, dass du wieder da bist“
  // Zwischenstand merken, solange noch nicht abgeschickt.
  useEffect(() => {
    if (status !== 'neu' || !Object.keys(a).length) return;
    try { localStorage.setItem(umfrageStandKey(def), JSON.stringify({ a, schritt })); } catch { /* egal */ }
  }, [a, schritt, status, def]);

  useEffect(() => {
    queueMicrotask(() => {
      setLaeuft(umfrageLaeuft(new Date(), def));
      try { if (localStorage.getItem(umfrageFertigKey(def))) { setStatus('schon'); return; } } catch { /* egal */ }
      // Zwischenstand von vorhin? Dann genau dort weiter (Einstieg überspringen).
      try {
        const roh = localStorage.getItem(umfrageStandKey(def));
        const st = roh ? JSON.parse(roh) as { a?: Antworten; schritt?: number } : null;
        if (st?.a && Object.keys(st.a).length) { setA(st.a); setSchritt(Math.max(0, st.schritt ?? 0)); setWeiter(true); setStatus('neu'); return; }
      } catch { /* egal */ }
      // Aus dem Popup mit „Ok, bin dabei“ gekommen (?los=1): Einstieg überspringen.
      const ein = fragen.find(f => f.einstieg);
      if (ein && new URLSearchParams(window.location.search).get('los') === '1') { setA(alt => ({ ...alt, [ein.id]: 'dabei' })); setStatus('neu'); }
    });
  }, [def, fragen]);

  const darfFreischalten = !!user?.teamId && hatTcRecht(user, user.teamId, 'team_manager');
  const hatTm = !!user?.teamManager;
  // Schritt für Schritt (Betreiber 15.11.2026): eine Frage je Bildschirm, Fortschritt oben, Zurück/Weiter unten.
  // Einfachauswahl, Sterne und Skala springen nach dem Antippen von selbst weiter (außer Freitext/Team-Manager-Hinweis).
  const oben = useRef<HTMLDivElement>(null);
  const weiterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sichtbar = sichtbareFragen(fragen, a);
  const geheZu = (n: number) => {
    if (weiterTimer.current) clearTimeout(weiterTimer.current);
    setSchritt(Math.max(0, n));
    oben.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const setze = (id: string, v: string | string[] | number | undefined) => {
    setA(alt => { const n = { ...alt }; if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) delete n[id]; else n[id] = v; return n; });
    const f = fragen.find(x => x.id === id);
    // Nicht selbst weiter, wenn unter der Frage etwas erscheint (Freitext, Tipp, Team-Manager-Hinweis) oder eine
    // Folgefrage dranhängt — die Liste der sichtbaren Fragen ändert sich dann erst mit dieser Antwort.
    const haengtDran = !!f && (typeof v === 'string' && (freitextBei(f).includes(v) || f.tippBei?.wert === v)
      || f.id === 'team_manager' || f.id === 'tm_nein' || fragen.some(x => x.nurWenn?.id === f.id));
    const selbst = f && v !== undefined && !haengtDran && (f.typ === 'sterne' || f.typ === 'skala' || f.typ === 'eine');
    const i = sichtbar.findIndex(x => x.id === id);
    if (selbst && i < sichtbar.length - 1) {
      if (weiterTimer.current) clearTimeout(weiterTimer.current);
      weiterTimer.current = setTimeout(() => geheZu(i + 1), 380);
    }
  };

  async function absenden() {
    setFehler(null);
    const sauber = antwortenPruefen(a, fragen);
    if (!sauber) { setFehler('Bitte beantworte mindestens eine Frage.'); return; }
    if (!laeuft) { try { localStorage.removeItem(umfrageStandKey(def)); } catch { /* egal */ } setStatus('fertig'); window.scrollTo({ top: 0 }); return; } // Vorschau: nichts speichern
    setStatus('sende');
    const r = await fetch('/api/umfrage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ umfrage: def.id, geraet: geraetId(), antworten: sauber }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) as { ok?: boolean; error?: string } : { error: 'Keine Verbindung.' };
    if (!r?.ok || !j.ok) { setStatus('neu'); setFehler(j.error ?? 'Absenden fehlgeschlagen. Versuch es bitte noch einmal.'); return; }
    try { localStorage.setItem(umfrageFertigKey(def), new Date().toISOString()); localStorage.removeItem(umfrageStandKey(def)); } catch { /* egal */ }
    setStatus('fertig');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // sonst steht man nach dem Absenden in der Fußzeile
  }

  // Team-Manager-Hinweis je Antwort (Betreiber 15.11.2026): „Kenne ich nicht“ → Video, „Okay, ich teste ihn“ → Probeabo,
  // „Ich sag's dem Captain“ → Video zum Weitergeben.
  const tmFall = hatTm ? null : a.team_manager === 'kenne_nicht' ? 'video' : a.tm_nein === 'okay' ? 'test' : a.tm_nein === 'captain' ? 'captain' : null;
  const tmHinweis = tmFall ? (
    <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(232,184,48,0.16), rgba(232,184,48,0.06))', border: '1px solid rgba(201,154,22,0.45)', fontFamily: font, fontSize: 14, lineHeight: 1.55, color: 'var(--th-text-body)' }}>
      <strong style={{ color: 'var(--th-text-strong)' }}>Der Team Manager:</strong> Zu- und Absagen, Aufstellung, Termine, Teamkasse und
      Statistik – alles fürs Team an einem Ort. {TESTTAGE} Tage kostenlos, ohne Abo und ohne Zahlungsdaten.
      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {tmFall === 'test'
          ? <>
              <Link href="/mein-team/premium" target={imPopup ? '_blank' : undefined} style={knopf}>{TESTTAGE} Tage kostenlos testen →</Link>
              {!darfFreischalten && <span style={{ fontSize: 13, color: 'var(--th-text-muted)' }}>Freischalten kann dein Teamcaptain oder Co-Captain.</span>}
            </>
          : <>
              <Link href="/news#team-manager-ist-da" target={imPopup ? '_blank' : undefined} style={knopf}>Video ansehen →</Link>
              {tmFall === 'captain' && <span style={{ fontSize: 13, color: 'var(--th-text-muted)' }}>Zeig es deinem Captain einfach.</span>}
            </>}
      </div>
    </div>
  ) : null;

  // ── Einstieg mit Augenzwinkern (Betreiber 15.11.2026) ──
  if (status === 'start' && einstiegsFrage) return (
    <Karte>
      {!laeuft && <p style={{ ...p, fontSize: 13, color: 'var(--th-loss)', margin: '0 0 8px' }}><strong>Vorschau</strong> – Antworten werden noch nicht gespeichert.</p>}
      <h2 style={h2}>{einstieg?.titel ?? 'Servus! 👋'}</h2>
      <p style={{ ...p, fontSize: 17, fontWeight: 800, color: 'var(--th-text-strong)', margin: '6px 0 4px' }}>{einstieg?.frage ?? einstiegsFrage.frage}</p>
      <p style={{ ...p, fontSize: 14, margin: '0 0 14px' }}>
        {fragenZahl(fragen)} schnelle Fragen, ganz anonym – wir speichern weder Namen noch Konto, nur eine zufällige Gerätekennung,
        damit keiner doppelt abstimmt. Und ja: Wir lesen wirklich alles 😉{def.ergebnisse ? ` ${def.ergebnisse}` : ''}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {einstiegsFrage.optionen!.map(o => (onErstLesen && o.wert === 'spaeter' ? { ...o, text: 'Erst den Bericht lesen 📖' } : o)).map(o => (
          <button key={o.wert} type="button" onClick={() => {
            if (onErstLesen && o.wert === 'spaeter') { onErstLesen(); return; }
            setA(alt => ({ ...alt, [einstiegsFrage.id]: o.wert }));
            if (o.wert === 'ned') {
              try { localStorage.setItem(umfrageAbgelehntKey(def), new Date().toISOString()); } catch { /* egal */ }
              setStatus('nein');
            } else if (o.wert === 'spaeter') { if (imPopup && onSchliessen) onSchliessen(); else setStatus('spaeter'); }
            else { setSchritt(0); setStatus('neu'); }
          }} style={{
            textAlign: 'left', fontFamily: font, fontSize: 15.5, fontWeight: 800, padding: '13px 16px', borderRadius: 12, cursor: 'pointer',
            border: `1px solid ${o.wert === 'dabei' ? 'var(--th-accent)' : 'var(--th-line-10)'}`,
            background: o.wert === 'dabei' ? 'var(--th-accent)' : 'var(--th-bg-card)', color: o.wert === 'dabei' ? '#fff' : 'var(--th-text-body)',
          }}>{o.text}</button>
        ))}
      </div>
    </Karte>
  );
  if (status === 'nein' || status === 'spaeter') return (
    <Karte>
      <h2 style={h2}>{status === 'nein' ? 'Na guad, dann hoid ned 😅' : 'Passt, bis später! ⏳'}</h2>
      <p style={p}>{status === 'nein'
        ? 'Kein Problem – wir nerven dich auf diesem Gerät nicht mehr damit. Servus und good Darts! 🎯'
        : 'Wir fragen dich beim nächsten Besuch einfach nochmal. Good Darts! 🎯'}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
        <button type="button" onClick={() => { try { localStorage.removeItem(umfrageAbgelehntKey(def)); } catch { /* egal */ } setSchritt(0); setStatus('neu'); }}
          style={{ ...knopf, border: 'none', cursor: 'pointer', fontSize: 14.5 }}>Na gut, doch mitmachen</button>
        {imPopup && onSchliessen
          ? <button type="button" onClick={onSchliessen} style={{ fontFamily: font, fontWeight: 700, fontSize: 14.5, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--th-line-10)', background: 'transparent', color: 'var(--th-text-body)', cursor: 'pointer' }}>Schließen</button>
          : <Link href="/" style={{ fontFamily: font, fontWeight: 700, fontSize: 14.5, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--th-line-10)', color: 'var(--th-text-body)', textDecoration: 'none' }}>Zur Startseite</Link>}
      </div>
    </Karte>
  );

  if (status === 'schon') return (
    <Karte>
      <h2 style={h2}>Danke, du hast schon mitgemacht!</h2>
      <p style={p}>Von diesem Gerät ist deine Antwort schon da.{umfrageEnde(def) ? ` Die Ergebnisse werten wir nach dem ${datumDe(umfrageEnde(def))} aus.` : ''}</p>
    </Karte>
  );

  if (status === 'fertig') return (
    <Karte>
      <h2 style={h2}>{laeuft ? 'Danke fürs Mitmachen!' : 'Vorschau – nichts gespeichert'}</h2>
      <p style={p}>{laeuft
        ? (def.danke ?? 'Deine Antworten helfen uns, die Seite besser zu machen. Was davon umgesetzt wird, liest du in den News.')
        : 'Die Umfrage ist noch nicht gestartet. So sieht der Abschluss später aus.'}</p>
      {def.ergebnisse && <p style={{ ...p, fontSize: 14, color: 'var(--th-text-muted)', marginTop: 6 }}>{def.ergebnisse}</p>}
      {def.id === UMFRAGE.id && <TeilenKnopf />}
      {tmHinweis}
      {imPopup && onSchliessen && (
        <button type="button" onClick={onSchliessen} style={{ ...knopf, border: 'none', cursor: 'pointer', fontSize: 15, marginTop: 14 }}>Schließen</button>
      )}
    </Karte>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {!laeuft && (
        <div role="status" style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(204,46,46,0.08)', border: '1px solid rgba(204,46,46,0.35)', fontFamily: font, fontSize: 13.5, color: 'var(--th-text-body)' }}>
          <strong>Vorschau:</strong> Die Umfrage ist noch nicht gestartet – Antworten werden nicht gespeichert.
        </div>
      )}
      {schritt === 0 && !imPopup && <p style={{ ...p, margin: 0 }}>
        {def.intro ?? <>
          {fragenZahl(fragen)} kurze Fragen, etwa 2 Minuten. Alles ist freiwillig – beantworte, was du magst.
          Die Umfrage ist <strong>anonym</strong>: Wir speichern keinen Namen und kein Konto, nur eine zufällige
          Kennung dieses Geräts, damit niemand doppelt abstimmt.{laeuft && umfrageEnde(def) ? ` Läuft bis ${datumDe(umfrageEnde(def))}.` : ''}
        </>}
      </p>}

      {(() => {
        const nr = Math.min(schritt, sichtbar.length - 1);
        const f = sichtbar[nr];
        const letzte = nr === sichtbar.length - 1;
        const beantwortet = a[f.id] !== undefined;
        return (
          <Karte>
            <div ref={oben} style={{ scrollMarginTop: 90 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--th-accent)' }}>{f.gruppe}</span>
                <span style={{ fontFamily: font, fontSize: 12.5, fontWeight: 700, color: 'var(--th-text-muted)', whiteSpace: 'nowrap' }}>Frage {nr + 1} von {sichtbar.length}</span>
              </div>
              <div aria-hidden style={{ height: 4, borderRadius: 2, background: 'var(--th-line-8)', marginBottom: 4 }}>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--th-accent)', width: `${Math.round(((nr + 1) / sichtbar.length) * 100)}%`, transition: 'width .25s' }} />
              </div>
            </div>
            {weiter && nr > 0 && (
              <p style={{ ...p, fontSize: 13.5, margin: '0 0 6px', color: 'var(--th-accent)', fontWeight: 700 }}>Schön, dass du wieder da bist – es geht da weiter, wo du aufgehört hast 👍</p>
            )}
            <FrageFeld key={f.id} f={f} nr={nr + 1} a={a} setze={setze}>
              {(f.id === 'team_manager' && a.team_manager === 'kenne_nicht') || f.id === 'tm_nein' ? tmHinweis : null}
              {f.id === 'tm_nein' && a.tm_nein === 'stur' && <p style={{ ...p, marginTop: 10, fontSize: 14 }}>Schade 😉 – falls du’s dir anders überlegst: {TESTTAGE} Tage kostenlos, ohne Abo.</p>}
            </FrageFeld>
            {fehler && letzte && <div role="alert" style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: 'var(--th-loss)', marginTop: 10 }}>{fehler}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 18 }}>
              {nr > 0
                ? <button type="button" onClick={() => geheZu(nr - 1)} style={{ fontFamily: font, fontWeight: 700, fontSize: 14, padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid var(--th-line-10)', color: 'var(--th-text-body)', cursor: 'pointer' }}>← Zurück</button>
                : <span />}
              {letzte
                ? <button type="button" onClick={absenden} disabled={status === 'sende'} style={{ ...knopf, border: 'none', cursor: 'pointer', fontSize: 15, padding: '12px 22px', opacity: status === 'sende' ? 0.6 : 1 }}>{status === 'sende' ? 'Sende …' : 'Absenden'}</button>
                : <button type="button" onClick={() => geheZu(nr + 1)} style={beantwortet ? { ...knopf, border: 'none', cursor: 'pointer', fontSize: 15, padding: '11px 20px' } : { fontFamily: font, fontWeight: 700, fontSize: 14, padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid var(--th-line-10)', color: 'var(--th-text-muted)', cursor: 'pointer' }}>
                    {beantwortet ? 'Weiter →' : 'Überspringen →'}
                  </button>}
            </div>
          </Karte>
        );
      })()}
    </div>
  );
}

function FrageFeld({ f, nr, a, setze, children }: { f: Frage; nr: number; a: Antworten; setze: (id: string, v: string | string[] | number | undefined) => void; children?: React.ReactNode }) {
  const v = a[f.id];
  return (
    <fieldset style={{ border: 'none', padding: '14px 0 4px', margin: 0, borderTop: '1px solid var(--th-line-6)' }}>
      <legend style={{ fontFamily: font, fontWeight: 800, fontSize: 15.5, color: 'var(--th-text-strong)', padding: 0, marginBottom: 4, float: 'left', width: '100%' }}>
        <span style={{ color: 'var(--th-text-faint)', fontWeight: 700, marginRight: 6 }}>{nr}.</span>{f.frage}
      </legend>
      {f.hinweis && <div style={{ clear: 'both', fontFamily: font, fontSize: 12.5, color: 'var(--th-text-muted)', marginBottom: 6 }}>{f.hinweis}</div>}
      <div style={{ clear: 'both', display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
        {f.typ === 'eine' && sichtbareOptionen(f, a).map(o => (
          <Chip key={o.wert} an={v === o.wert} onClick={() => setze(f.id, v === o.wert ? undefined : o.wert)}>{o.text}</Chip>
        ))}
        {f.typ === 'mehr' && sichtbareOptionen(f, a).map(o => {
          const liste = (Array.isArray(v) ? v : []) as string[];
          const an = liste.includes(o.wert);
          const voll = !an && f.max != null && liste.length >= f.max;
          return <Chip key={o.wert} an={an} gesperrt={voll} onClick={() => { if (!voll) setze(f.id, an ? liste.filter(x => x !== o.wert) : [...liste, o.wert]); }}>{an ? '✓ ' : ''}{o.text}</Chip>;
        })}
        {f.typ === 'sterne' && [1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" aria-label={`${n} von 5 Sternen`} aria-pressed={typeof v === 'number' && v >= n}
            onClick={() => setze(f.id, v === n ? undefined : n)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 32, lineHeight: 1, padding: '0 2px', color: typeof v === 'number' && v >= n ? '#E8B830' : 'var(--th-line-10)' }}>★</button>
        ))}
        {f.typ === 'skala' && Array.from({ length: 11 }, (_, n) => (
          <button key={n} type="button" aria-pressed={v === n} onClick={() => setze(f.id, v === n ? undefined : n)}
            style={{ width: 38, height: 38, borderRadius: 8, cursor: 'pointer', fontFamily: font, fontWeight: 800, fontSize: 14,
              border: `1px solid ${v === n ? 'var(--th-accent)' : 'var(--th-line-10)'}`,
              background: v === n ? 'var(--th-accent)' : 'var(--th-bg-card)', color: v === n ? '#fff' : 'var(--th-text-body)' }}>{n}</button>
        ))}
        {f.typ === 'name' && (
          <input type="text" value={(v as string) ?? ''} maxLength={NAME_MAX} onChange={e => setze(f.id, e.target.value)}
            placeholder="z. B. Marcus, Funny Darters" aria-label={f.frage} style={feld} />
        )}
        {f.typ === 'text' && (
          <div style={{ width: '100%' }}>
            <textarea value={(v as string) ?? ''} maxLength={TEXT_MAX} rows={3} onChange={e => setze(f.id, e.target.value)}
              placeholder="Schreib einfach drauflos – oder sprich es ein 🎤" style={feld} />
            <SprachKnopf wert={(v as string) ?? ''} onText={t => setze(f.id, t.slice(0, TEXT_MAX))} />
          </div>
        )}
      </div>
      {(typeof v === 'string' ? freitextBei(f).includes(v) : Array.isArray(v) && v.some(x => freitextBei(f).includes(x))) && (() => {
        const frage = f.freitextFrage ?? (f.typ === 'mehr' ? 'Was genau?' : 'Was wünschst du dir?');
        return (
          <label style={{ display: 'block', marginTop: 10 }}>
            {f.freitextFrage && <span style={{ display: 'block', fontFamily: font, fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', marginBottom: 4 }}>{frage}</span>}
            <textarea value={(a[`${f.id}_text`] as string) ?? ''} maxLength={TEXT_MAX} rows={2} onChange={e => setze(`${f.id}_text`, e.target.value)}
              placeholder={f.freitextFrage ? 'Schreib einfach drauflos …' : frage} aria-label={frage} style={feld} />
          </label>
        );
      })()}
      {f.tippBei && v === f.tippBei.wert && (
        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--th-accent-a07, rgba(46,140,87,0.08))', border: '1px solid var(--th-accent-a25, rgba(46,140,87,0.3))', fontFamily: font, fontSize: 13.5, lineHeight: 1.5, color: 'var(--th-text-body)' }}>
          💡 {f.tippBei.text}{f.tippBei.link && <> <Link href={f.tippBei.link.href} target="_blank" style={{ color: 'var(--th-accent)', fontWeight: 700 }}>{f.tippBei.link.text} →</Link></>}
        </div>
      )}
      {children}
    </fieldset>
  );
}

function Chip({ an, gesperrt = false, onClick, children }: { an: boolean; gesperrt?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={an} aria-disabled={gesperrt} title={gesperrt ? 'Höchstens 3 – erst eine andere abwählen' : undefined} onClick={onClick} style={{
      fontFamily: font, fontSize: 14, fontWeight: 700, padding: '8px 14px', borderRadius: 999, cursor: gesperrt ? 'not-allowed' : 'pointer', opacity: gesperrt ? 0.45 : 1,
      border: `1px solid ${an ? 'var(--th-accent)' : 'var(--th-line-10)'}`,
      background: an ? 'var(--th-accent)' : 'var(--th-bg-card)', color: an ? '#fff' : 'var(--th-text-body)',
    }}>{children}</button>
  );
}

function Karte({ children }: { children: React.ReactNode }) {
  const imPopup = useContext(ImPopup);
  if (imPopup) return <div>{children}</div>; // das Popup ist selbst die Karte
  return <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px' }}>{children}</div>;
}

const h2: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', margin: '0 0 8px', color: 'var(--th-text-strong)' };
const p: React.CSSProperties = { fontFamily: font, fontSize: 14.5, lineHeight: 1.6, color: 'var(--th-text-body)', margin: '0 0 4px' };
const knopf: React.CSSProperties = { display: 'inline-block', fontFamily: font, fontWeight: 800, fontSize: 14, padding: '9px 16px', borderRadius: 10, background: 'var(--th-accent)', color: '#fff', textDecoration: 'none' };
const feld: React.CSSProperties = { width: '100%', boxSizing: 'border-box', fontFamily: font, fontSize: 14.5, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--th-line-10)', background: 'var(--th-bg-inset)', color: 'var(--th-text-strong)', resize: 'vertical' };

/** Nach dem Absenden: Umfrage ans Team weiterschicken (Betreiber 15.11.2026). */
function TeilenKnopf() {
  async function teilen() {
    const url = `${window.location.origin}/umfrage`;
    const text = `Hab grad bei der MDU-Umfrage mitgemacht – dauert 2 Minuten, ganz anonym. Mach auch mit! 🎯 ${url}`;
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    if (nav.share) { try { await nav.share({ text }); return; } catch { /* abgebrochen → WhatsApp */ } }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }
  return (
    <button type="button" onClick={teilen} style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: font, fontWeight: 800, fontSize: 15,
      padding: '11px 18px', borderRadius: 10, cursor: 'pointer', border: 'none', background: '#25D366', color: '#fff' }}>
      📲 Schick’s deinem Team
    </button>
  );
}
