'use client';

// Liga-Knöpfe für die langen Listen-Seiten (Betreiber, 20.11.2026, nach Umfrage-Kritik „man muss
// sich zu viel durch alles prügeln“): Spielplan, Ergebnisse, Tabellen, Teams zeigen nur EINE Liga.
// Die Abschnitte rendert weiter der Server (alles bleibt im HTML), jeder trägt `data-liga="<code>"`;
// ausgeblendet wird per CSS über `data-aktiv` an der Hülle.
// Vorauswahl: #liga-<code> in der Adresse → Wahl dieses Besuchs → eigene Liga (Konto) →
// zuletzt gewählte Liga auf dem Gerät → erste Liga. Ein kleines Skript im HTML setzt sie
// VOR dem ersten Bild, damit die Seite nicht erst La Liga zeigt und dann springt.

import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { team27 } from '@/lib/data/saison-2027';

export type FilterLiga = { code: string; name: string; color: string };

const GEMERKT = 'mdu-liga';        // zuletzt gewählt (Gerät)
const BESUCH = 'mdu-liga-besuch';  // gewählt in diesem Besuch (sessionStorage)
const EIGEN = 'mdu-liga-eigen';    // Liga des eigenen Teams (vom Konto)

const lies = (art: 'local' | 'session', k: string) => {
  try { return (art === 'local' ? localStorage : sessionStorage).getItem(k); } catch { return null; }
};
const schreib = (art: 'local' | 'session', k: string, v: string | null) => {
  try {
    const s = art === 'local' ? localStorage : sessionStorage;
    if (v === null) s.removeItem(k); else s.setItem(k, v);
  } catch { /* privater Modus: dann eben ohne Merken */ }
};

// Läuft im HTML, bevor React da ist. Gleiche Reihenfolge wie `vorauswahl()`.
const skript = (erlaubt: string[]) => `(function(){try{var c=${JSON.stringify(erlaubt)},e=document.currentScript.parentElement,` +
  `h=(location.hash.match(/^#liga-(.+)$/)||[])[1],g=function(s,k){try{return s.getItem(k)}catch(x){return null}},` +
  `w=[h,g(sessionStorage,'${BESUCH}'),g(localStorage,'${EIGEN}'),g(localStorage,'${GEMERKT}')];` +
  `for(var i=0;i<w.length;i++){if(w[i]&&c.indexOf(w[i])>=0){e.setAttribute('data-aktiv',w[i]);break}}}catch(x){}})();`;

export function LigaFilter({ ligen, children, alle = true }: { ligen: FilterLiga[]; children: ReactNode; alle?: boolean }) {
  const { user, loading } = useAuth();
  const codes = ligen.map(l => l.code);
  const erste = codes[0] ?? 'alle';
  const [aktiv, setAktiv] = useState(erste);

  const gueltig = (c: string | null | undefined): c is string => !!c && (codes.includes(c) || (alle && c === 'alle'));

  // Beim Start: was das Skript gesetzt hat, übernehmen.
  useLayoutEffect(() => {
    const hash = window.location.hash.match(/^#liga-(.+)$/)?.[1];
    const w = [hash, lies('session', BESUCH), lies('local', EIGEN), lies('local', GEMERKT)].find(gueltig);
    if (w) setAktiv(w);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Konto geladen: eigene Liga merken; ohne Wahl in diesem Besuch gilt sie.
  const eigene = user?.teamId ? team27(user.teamId)?.league : undefined;
  useEffect(() => {
    if (loading) return;
    if (!user) { schreib('local', EIGEN, null); return; }
    if (!eigene) return;
    schreib('local', EIGEN, eigene);
    const hash = window.location.hash.match(/^#liga-(.+)$/)?.[1];
    if (!gueltig(hash) && !gueltig(lies('session', BESUCH)) && codes.includes(eigene)) setAktiv(eigene);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id, eigene]);

  const waehle = (c: string) => {
    setAktiv(c);
    schreib('session', BESUCH, c);
    if (c !== 'alle') schreib('local', GEMERKT, c);
  };

  const css = [
    `.mdu-lf:not([data-aktiv="alle"]) [data-liga]{display:none}`,
    ...codes.map(c => `.mdu-lf[data-aktiv="${c}"] [data-liga="${c}"]{display:block}`),
    ...[...codes, 'alle'].map(c => `.mdu-lf[data-aktiv="${c}"] [data-chip="${c}"]{background:var(--th-accent)!important;color:#fff!important;border-color:var(--th-accent)!important}`),
  ].join('');

  const chip = (code: string, name: string, color?: string) => (
    <button key={code} type="button" data-chip={code} aria-pressed={aktiv === code} onClick={() => waehle(code)} style={{
      padding: '8px 14px', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
      background: 'var(--th-bg-card)', color: 'var(--th-text-body)',
      border: '1px solid var(--th-line-8)', borderLeft: color ? `3px solid ${color}` : '1px solid var(--th-line-8)',
    }}>{name}{code === eigene ? ' ★' : ''}</button>
  );

  return (
    <div className="mdu-lf" data-aktiv={aktiv} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: skript(alle ? [...codes, 'alle'] : codes) }} />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <nav aria-label="Liga wählen" style={{
        position: 'sticky', top: 70, zIndex: 20, display: 'flex', gap: 8, overflowX: 'auto',
        margin: '0 -4px 24px', padding: '8px 4px', background: 'var(--th-bg-page)',
        scrollbarWidth: 'none',
      }}>
        {ligen.map(l => chip(l.code, l.name, l.color))}
        {alle && chip('alle', 'Alle')}
      </nav>
      {children}
    </div>
  );
}
