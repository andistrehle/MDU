'use client';

// ============================================================
// Admin — Wie werden die Spielberichte erfasst? (Betreiber, 22.10.2026)
// ============================================================
// Live am Automaten, Foto-Upload oder vom Zettel abgeschrieben — je Spieltag
// als Anteil, darunter jede Begegnung. Entscheidungshilfe für einen
// Live-Ticker. Regeln: lib/server/erfassung.ts, Protokoll: Migration 0055.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { LIGEN_2027 } from '@/lib/data/saison-2027';
import { ladeErfassung, zaehle, WEG, WEGE, type Erfassung } from '@/lib/supabase/erfassung';

const uhr = (iso: string | null) => iso ? new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '–';
const ligaName = (c: string) => LIGEN_2027.find(l => l.code === c)?.name ?? c;

export default function AdminErfassungPage() {
  const [daten, setDaten] = useState<Erfassung | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  const laden = useCallback(async () => { const r = await ladeErfassung(); setDaten(r.data); setFehler(r.error); }, []);
  useEffect(() => { queueMicrotask(() => { void laden(); }); }, [laden]);

  const spieltage = useMemo(() => {
    const m = new Map<number, Erfassung['zeilen']>();
    for (const z of daten?.zeilen ?? []) m.set(z.spieltag, [...(m.get(z.spieltag) ?? []), z]);
    return [...m.entries()].sort((a, b) => b[0] - a[0]);
  }, [daten]);
  const gesamt = zaehle(daten?.zeilen ?? []);

  return (
    <AdminGuard title="Erfassung der Spielberichte" subtitle="Wer trägt live ein, wer lädt ein Foto hoch, wer schreibt den Zettel hinterher ab?">
      {fehler && <p style={{ ...txt, color: 'var(--th-loss)' }}>{fehler}</p>}
      {daten && !daten.bereit && <p style={{ ...txt, marginBottom: 12, color: 'var(--th-gold)' }}>Das genaue Protokoll ist noch nicht eingerichtet (Migration 0055). Bis dahin ist jeder Weg aus dem Anlegen des Berichts geschätzt.</p>}
      <p style={{ ...txt, marginBottom: 14, lineHeight: 1.55 }}>
        <b style={{ color: 'var(--th-text-strong)' }}>Live</b>: erstes Spielergebnis vor Spielende (Beginn + 3,5 h) eingetippt ·{' '}
        <b style={{ color: 'var(--th-text-strong)' }}>Foto</b>: über den Foto-Upload angelegt ·{' '}
        <b style={{ color: 'var(--th-text-strong)' }}>Abgeschrieben</b>: erstes Ergebnis erst nach Spielende.
      </p>

      {!daten && !fehler ? <p style={txt}>Lade …</p> : daten && daten.zeilen.length === 0 ? <p style={txt}>Noch keine Spielberichte für 2026/27.</p> : daten && (
        <>
          <Anteile titel="Ganze Saison" z={gesamt} />
          {spieltage.map(([st, zeilen]) => (
            <section key={st} style={{ marginTop: 22 }}>
              <Anteile titel={`${st}. Spieltag`} z={zaehle(zeilen)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {zeilen.map(z => (
                  <div key={z.key} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                    <span style={{ ...txt, fontWeight: 800, color: WEG[z.weg].farbe, minWidth: 128 }}>{WEG[z.weg].icon} {WEG[z.weg].label}{z.geschaetzt ? ' (geschätzt)' : ''}</span>
                    <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                      <div style={{ ...txt, fontWeight: 800, color: 'var(--th-text-strong)' }}>{z.heim} – {z.gast}</div>
                      <div style={{ ...txt, fontSize: 12 }}>
                        {ligaName(z.liga)} · Beginn {uhr(z.beginn)} · erstes Ergebnis {uhr(z.erstes)} · letztes {uhr(z.letztes)}
                        {z.liveModus ? ' · Live-Anzeige genutzt' : ''} · {z.speicherungen}× gespeichert
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </AdminGuard>
  );
}

function Anteile({ titel, z }: { titel: string; z: Record<'live' | 'foto' | 'abgeschrieben', number> }) {
  const summe = WEGE.reduce((s, w) => s + z[w], 0);
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>{titel}</span>
        <span style={txt}>{summe} {summe === 1 ? 'Bericht' : 'Berichte'}</span>
      </div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'var(--th-line-6)' }}>
        {summe > 0 && WEGE.map(w => z[w] > 0 && <div key={w} style={{ width: `${(z[w] / summe) * 100}%`, background: WEG[w].farbe }} />)}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
        {WEGE.map(w => (
          <span key={w} style={{ ...txt, fontWeight: 700 }}>
            <span style={{ color: WEG[w].farbe }}>●</span> {WEG[w].label}: <b style={{ color: 'var(--th-text-strong)' }}>{z[w]}</b>{summe ? ` (${Math.round((z[w] / summe) * 100)} %)` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

const txt: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', margin: 0 };
