'use client';

// ============================================================
// Mikrofon zum Diktieren (Betreiber 15.11.2026, Umfrage Freitext)
// ============================================================
// Nutzt die eingebaute Spracherkennung des Browsers (Web Speech API): Chrome
// (Android/PC) und Safari (iPhone/Mac). Wo es sie nicht gibt (z. B. Firefox),
// erscheint der Knopf gar nicht. Die Aufnahme verarbeitet der BROWSER bzw.
// sein Anbieter (Google/Apple) — bei uns kommt nur der fertige Text an, wie
// getippt. Der erkannte Text wird an das Vorhandene angehängt.
// ============================================================

import { useEffect, useRef, useState } from 'react';

type Ergebnis = { isFinal: boolean; 0: { transcript: string } };
type Erkenner = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<Ergebnis> }) => void) | null;
  onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null;
  start: () => void; stop: () => void;
};

function erkennerKlasse(): (new () => Erkenner) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Erkenner; webkitSpeechRecognition?: new () => Erkenner };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function SprachKnopf({ wert, onText }: { wert: string; onText: (neu: string) => void }) {
  const [moeglich, setMoeglich] = useState(false);
  const [an, setAn] = useState(false);
  const [zwischen, setZwischen] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const rec = useRef<Erkenner | null>(null);
  const basis = useRef('');

  useEffect(() => { queueMicrotask(() => setMoeglich(!!erkennerKlasse())); return () => rec.current?.stop(); }, []);

  function starten() {
    const K = erkennerKlasse();
    if (!K) return;
    setFehler(null);
    const r = new K();
    r.lang = 'de-DE'; r.continuous = true; r.interimResults = true;
    basis.current = wert.trim();
    r.onresult = (e) => {
      let fest = '', vorlaeufig = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fest += t; else vorlaeufig += t;
      }
      const text = [basis.current, fest.trim()].filter(Boolean).join(' ');
      onText(text);
      setZwischen(vorlaeufig.trim());
    };
    r.onerror = (e) => {
      setFehler(e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? 'Mikrofon nicht erlaubt – bitte in den Browser-Einstellungen freigeben.'
        : e.error === 'no-speech' ? 'Nichts gehört – nochmal probieren?' : 'Spracheingabe hat nicht geklappt.');
    };
    r.onend = () => { setAn(false); setZwischen(''); rec.current = null; };
    rec.current = r;
    try { r.start(); setAn(true); } catch { setAn(false); }
  }

  if (!moeglich) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
      <button type="button" onClick={() => (an ? rec.current?.stop() : starten())} aria-pressed={an}
        aria-label={an ? 'Aufnahme beenden' : 'Sprechen statt tippen'} title={an ? 'Aufnahme beenden' : 'Sprechen statt tippen'}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, cursor: 'pointer',
          fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700,
          border: `1px solid ${an ? '#C0392B' : 'var(--th-line-10)'}`, background: an ? '#C0392B' : 'var(--th-bg-card)', color: an ? '#fff' : 'var(--th-text-body)',
        }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><line x1="12" y1="17" x2="12" y2="22" />
        </svg>
        {an ? 'Aufnahme läuft … tippen zum Beenden' : 'Sprechen'}
      </button>
      {zwischen && <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', fontStyle: 'italic' }}>{zwischen} …</span>}
      {fehler && <span role="alert" style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-loss)' }}>{fehler}</span>}
    </div>
  );
}
