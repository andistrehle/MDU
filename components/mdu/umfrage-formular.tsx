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

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { hatTcRecht } from '@/lib/auth/roles';
import { FRAGEN, NAME_MAX, TEXT_MAX, UMFRAGE, antwortenPruefen, umfrageEnde, umfrageLaeuft, type Antworten, type Frage, type UmfrageDef } from '@/lib/umfrage';
import { TESTTAGE } from '@/lib/premium';

export const UMFRAGE_GERAET_KEY = 'mdu-umfrage-geraet';
export const umfrageFertigKey = (def: UmfrageDef = UMFRAGE) => `mdu-umfrage-${def.id}-fertig`;

function geraetId(): string {
  try {
    let id = localStorage.getItem(UMFRAGE_GERAET_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(UMFRAGE_GERAET_KEY, id); }
    return id;
  } catch { return crypto.randomUUID(); }
}

const datumDe = (iso: string | null) => (iso ?? '').split('-').reverse().join('.');
const font = 'var(--font-manrope)';

export function UmfrageFormular({ def = UMFRAGE, fragen = FRAGEN }: { def?: UmfrageDef; fragen?: Frage[] } = {}) {
  const { user } = useAuth();
  const [a, setA] = useState<Antworten>({});
  const [status, setStatus] = useState<'neu' | 'sende' | 'fertig' | 'schon'>('neu');
  const [fehler, setFehler] = useState<string | null>(null);
  const [laeuft, setLaeuft] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setLaeuft(umfrageLaeuft(new Date(), def));
      try { if (localStorage.getItem(umfrageFertigKey(def))) setStatus('schon'); } catch { /* egal */ }
    });
  }, [def]);

  const darfFreischalten = !!user?.teamId && hatTcRecht(user, user.teamId, 'team_manager');
  const hatTm = !!user?.teamManager;
  // Schritt für Schritt (Betreiber 15.11.2026): eine Frage je Bildschirm, Fortschritt oben, Zurück/Weiter unten.
  // Einfachauswahl, Sterne und Skala springen nach dem Antippen von selbst weiter (außer Freitext/Team-Manager-Hinweis).
  const [schritt, setSchritt] = useState(0);
  const oben = useRef<HTMLDivElement>(null);
  const weiterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geheZu = (n: number) => {
    if (weiterTimer.current) clearTimeout(weiterTimer.current);
    setSchritt(Math.max(0, Math.min(fragen.length - 1, n)));
    oben.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const setze = (id: string, v: string | string[] | number | undefined) => {
    setA(alt => { const n = { ...alt }; if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) delete n[id]; else n[id] = v; return n; });
    const f = fragen.find(x => x.id === id);
    const selbst = f && v !== undefined && (f.typ === 'sterne' || f.typ === 'skala' || (f.typ === 'eine' && v !== f.freitextBei && f.id !== 'team_manager'));
    const i = fragen.findIndex(x => x.id === id);
    if (selbst && i < fragen.length - 1) {
      if (weiterTimer.current) clearTimeout(weiterTimer.current);
      weiterTimer.current = setTimeout(() => geheZu(i + 1), 380);
    }
  };

  async function absenden() {
    setFehler(null);
    const sauber = antwortenPruefen(a, fragen);
    if (!sauber) { setFehler('Bitte beantworte mindestens eine Frage.'); return; }
    if (!laeuft) { setStatus('fertig'); window.scrollTo({ top: 0 }); return; } // Vorschau: nichts speichern
    setStatus('sende');
    const r = await fetch('/api/umfrage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ umfrage: def.id, geraet: geraetId(), antworten: sauber }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) as { ok?: boolean; error?: string } : { error: 'Keine Verbindung.' };
    if (!r?.ok || !j.ok) { setStatus('neu'); setFehler(j.error ?? 'Absenden fehlgeschlagen. Versuch es bitte noch einmal.'); return; }
    try { localStorage.setItem(umfrageFertigKey(def), new Date().toISOString()); } catch { /* egal */ }
    setStatus('fertig');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // sonst steht man nach dem Absenden in der Fußzeile
  }

  const tmHinweis = (a.team_manager === 'nein' || a.team_manager === 'weiss_nicht') && !hatTm ? (
    <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(232,184,48,0.16), rgba(232,184,48,0.06))', border: '1px solid rgba(201,154,22,0.45)', fontFamily: font, fontSize: 14, lineHeight: 1.55, color: 'var(--th-text-body)' }}>
      <strong style={{ color: 'var(--th-text-strong)' }}>Der Team Manager:</strong> Zu- und Absagen, Aufstellung, Termine, Teamkasse und
      Statistik – alles fürs Team an einem Ort. {TESTTAGE} Tage kostenlos, ohne Abo und ohne Zahlungsdaten.
      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        {darfFreischalten
          ? <Link href="/mein-team/premium" style={knopf}>{TESTTAGE} Tage kostenlos testen →</Link>
          : <>
              <Link href="/news#team-manager-ist-da" style={knopf}>Video ansehen →</Link>
              <span style={{ fontSize: 13, color: 'var(--th-text-muted)' }}>Freischalten kann dein Teamcaptain – zeig es ihm einfach.</span>
            </>}
      </div>
    </div>
  ) : null;

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
      {tmHinweis}
    </Karte>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {!laeuft && (
        <div role="status" style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(204,46,46,0.08)', border: '1px solid rgba(204,46,46,0.35)', fontFamily: font, fontSize: 13.5, color: 'var(--th-text-body)' }}>
          <strong>Vorschau:</strong> Die Umfrage ist noch nicht gestartet – Antworten werden nicht gespeichert.
        </div>
      )}
      {schritt === 0 && <p style={{ ...p, margin: 0 }}>
        {def.intro ?? <>
          {fragen.length} kurze Fragen, etwa 2 Minuten. Alles ist freiwillig – beantworte, was du magst.
          Die Umfrage ist <strong>anonym</strong>: Wir speichern keinen Namen und kein Konto, nur eine zufällige
          Kennung dieses Geräts, damit niemand doppelt abstimmt.{laeuft && umfrageEnde(def) ? ` Läuft bis ${datumDe(umfrageEnde(def))}.` : ''}
        </>}
      </p>}

      {(() => {
        const f = fragen[schritt];
        const letzte = schritt === fragen.length - 1;
        const beantwortet = a[f.id] !== undefined;
        return (
          <Karte>
            <div ref={oben} style={{ scrollMarginTop: 90 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--th-accent)' }}>{f.gruppe}</span>
                <span style={{ fontFamily: font, fontSize: 12.5, fontWeight: 700, color: 'var(--th-text-muted)', whiteSpace: 'nowrap' }}>Frage {schritt + 1} von {fragen.length}</span>
              </div>
              <div aria-hidden style={{ height: 4, borderRadius: 2, background: 'var(--th-line-8)', marginBottom: 4 }}>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--th-accent)', width: `${Math.round(((schritt + 1) / fragen.length) * 100)}%`, transition: 'width .25s' }} />
              </div>
            </div>
            <FrageFeld key={f.id} f={f} nr={schritt + 1} a={a} setze={setze}>
              {f.id === 'team_manager' ? tmHinweis : null}
            </FrageFeld>
            {fehler && letzte && <div role="alert" style={{ fontFamily: font, fontSize: 14, fontWeight: 700, color: 'var(--th-loss)', marginTop: 10 }}>{fehler}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 18 }}>
              {schritt > 0
                ? <button type="button" onClick={() => geheZu(schritt - 1)} style={{ fontFamily: font, fontWeight: 700, fontSize: 14, padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid var(--th-line-10)', color: 'var(--th-text-body)', cursor: 'pointer' }}>← Zurück</button>
                : <span />}
              {letzte
                ? <button type="button" onClick={absenden} disabled={status === 'sende'} style={{ ...knopf, border: 'none', cursor: 'pointer', fontSize: 15, padding: '12px 22px', opacity: status === 'sende' ? 0.6 : 1 }}>{status === 'sende' ? 'Sende …' : 'Absenden'}</button>
                : <button type="button" onClick={() => geheZu(schritt + 1)} style={beantwortet ? { ...knopf, border: 'none', cursor: 'pointer', fontSize: 15, padding: '11px 20px' } : { fontFamily: font, fontWeight: 700, fontSize: 14, padding: '10px 14px', borderRadius: 10, background: 'transparent', border: '1px solid var(--th-line-10)', color: 'var(--th-text-muted)', cursor: 'pointer' }}>
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
        {f.typ === 'eine' && f.optionen!.map(o => (
          <Chip key={o.wert} an={v === o.wert} onClick={() => setze(f.id, v === o.wert ? undefined : o.wert)}>{o.text}</Chip>
        ))}
        {f.typ === 'mehr' && f.optionen!.map(o => {
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
          <textarea value={(v as string) ?? ''} maxLength={TEXT_MAX} rows={3} onChange={e => setze(f.id, e.target.value)}
            placeholder="Schreib einfach drauflos …" style={feld} />
        )}
      </div>
      {f.freitextBei && (v === f.freitextBei || (Array.isArray(v) && v.includes(f.freitextBei))) && (
        <textarea value={(a[`${f.id}_text`] as string) ?? ''} maxLength={TEXT_MAX} rows={2} onChange={e => setze(`${f.id}_text`, e.target.value)}
          placeholder={f.typ === 'mehr' ? 'Was genau?' : 'Was wünschst du dir?'} aria-label={f.typ === 'mehr' ? 'Was genau?' : 'Was wünschst du dir?'} style={{ ...feld, marginTop: 8 }} />
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
  return <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px' }}>{children}</div>;
}

const h2: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', margin: '0 0 8px', color: 'var(--th-text-strong)' };
const p: React.CSSProperties = { fontFamily: font, fontSize: 14.5, lineHeight: 1.6, color: 'var(--th-text-body)', margin: '0 0 4px' };
const knopf: React.CSSProperties = { display: 'inline-block', fontFamily: font, fontWeight: 800, fontSize: 14, padding: '9px 16px', borderRadius: 10, background: 'var(--th-accent)', color: '#fff', textDecoration: 'none' };
const feld: React.CSSProperties = { width: '100%', boxSizing: 'border-box', fontFamily: font, fontSize: 14.5, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--th-line-10)', background: 'var(--th-bg-inset)', color: 'var(--th-text-strong)', resize: 'vertical' };
