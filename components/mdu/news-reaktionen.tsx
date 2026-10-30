'use client';

// ============================================================
// News: Auge (gelesen) + Daumen (Gefällt mir) — Migration 0065
// ============================================================
// Betreiber, 30.10.2026: für alle sichtbar, „gelesen“ = Beitrag geöffnet
// (einmal je Gerät), Gefällt mir ohne Konto, einmal je Gerät (nochmal tippen
// nimmt es zurück). Geräte-Kennung = Zufallszahl im localStorage. Die Zahlen
// aller Karten einer Seite holt EINE Anfrage (gesammelt im selben Moment).
// Vorschau-Karten im Admin (`vorschau-…`) zählen nicht.
// ============================================================

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Icon } from './icon';

export interface NewsZahlen { gelesen: number; gefaellt: number }

const GERAET = 'mdu-news-geraet', GELESEN = 'mdu-news-gelesen', GEFAELLT = 'mdu-news-gefaellt';
export const zaehlt = (id: string) => !id.startsWith('vorschau-');

// ── Speicher im Gerät (alles in try: Zählen ist nie wichtiger als die Seite) ──
function liste(k: string): string[] {
  try { const v = JSON.parse(localStorage.getItem(k) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
function merken(k: string, id: string, an: boolean) {
  try {
    const l = liste(k).filter(x => x !== id);
    if (an) l.push(id);
    localStorage.setItem(k, JSON.stringify(l.slice(-300)));
  } catch { /* egal */ }
}
function geraet(): string | null {
  try {
    let id = localStorage.getItem(GERAET);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(GERAET, id); }
    return id;
  } catch { return null; }
}

// ── Zahlen: gemeinsamer Zwischenspeicher, eine Anfrage je Seite ──
const cache = new Map<string, NewsZahlen>();
const hoerer = new Set<() => void>();
let offen = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;
const melden = () => hoerer.forEach(h => h());
function setzen(id: string, z: NewsZahlen) { cache.set(id, z); melden(); }

function anfordern(id: string) {
  if (cache.has(id) || offen.has(id)) return;
  offen.add(id);
  timer ??= setTimeout(() => {
    const ids = [...offen]; offen = new Set(); timer = null;
    void fetch(`/api/news/reaktion?ids=${ids.map(encodeURIComponent).join(',')}`, { cache: 'no-store' })
      .then(r => r.json() as Promise<{ zahlen?: Record<string, NewsZahlen> }>)
      .then(j => { for (const [k, v] of Object.entries(j.zahlen ?? {})) cache.set(k, v); melden(); })
      .catch(() => {});
  }, 30);
}

export function useNewsZahlen(id: string): NewsZahlen | undefined {
  useEffect(() => { if (zaehlt(id)) anfordern(id); }, [id]);
  return useSyncExternalStore(
    h => { hoerer.add(h); return () => { hoerer.delete(h); }; },
    () => cache.get(id),
    () => undefined,
  );
}

async function senden(id: string, aktion: 'gelesen' | 'gefaellt' | 'nicht'): Promise<boolean> {
  const g = geraet();
  if (!g) return false;
  try {
    const r = await fetch('/api/news/reaktion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, geraet: g, aktion }), keepalive: true });
    const j = await r.json().catch(() => ({})) as { ok?: boolean; zahlen?: NewsZahlen };
    if (j.zahlen) setzen(id, j.zahlen);
    return !!j.ok;
  } catch { return false; }
}

/** Beim Öffnen eines Beitrags aufrufen — meldet je Gerät nur einmal. */
export function alsGelesenMelden(id: string) {
  if (!zaehlt(id) || liste(GELESEN).includes(id)) return;
  void senden(id, 'gelesen').then(ok => { if (ok) merken(GELESEN, id, true); });
}

const zahlStil = { display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-manrope)', fontSize: 11.5, fontWeight: 600, color: 'var(--th-text-faint)' } as const;

/** Klein auf der Karte: Auge + Zahl, Daumen + Zahl (nur Anzeige). */
export function NewsZahlenKlein({ id }: { id: string }) {
  const z = useNewsZahlen(id);
  if (!z) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span style={zahlStil} title="Gelesen" aria-label={`${z.gelesen} mal gelesen`}><Icon name="eye" size={13} /> {z.gelesen}</span>
      <span style={zahlStil} title="Gefällt mir" aria-label={`${z.gefaellt} gefällt das`}><Icon name="thumb" size={12} /> {z.gefaellt}</span>
    </span>
  );
}

/** Im geöffneten Beitrag: Auge + Zahl und der Daumen zum Antippen. */
export function NewsReaktionen({ id }: { id: string }) {
  const z = useNewsZahlen(id);
  // Nur im geöffneten Beitrag eingebunden (rein im Browser) — localStorage direkt lesbar.
  const [mag, setMag] = useState(() => liste(GEFAELLT).includes(id));
  if (!zaehlt(id)) return null;

  const umschalten = async () => {
    const neu = !mag;
    setMag(neu);
    if (z) setzen(id, { ...z, gefaellt: Math.max(0, z.gefaellt + (neu ? 1 : -1)) });
    const ok = await senden(id, neu ? 'gefaellt' : 'nicht');
    if (ok) merken(GEFAELLT, id, neu); else setMag(!neu);
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      {z && <span style={zahlStil} title="Gelesen" aria-label={`${z.gelesen} mal gelesen`}><Icon name="eye" size={14} /> {z.gelesen}</span>}
      <button type="button" onClick={umschalten} aria-pressed={mag} aria-label={mag ? 'Gefällt mir zurücknehmen' : 'Gefällt mir'}
        style={{ ...zahlStil, background: 'transparent', border: 'none', padding: '4px 2px', cursor: 'pointer', color: mag ? 'var(--th-accent)' : 'var(--th-text-faint)' }}>
        <Icon name={mag ? 'thumb-fill' : 'thumb'} size={15} /> {z?.gefaellt ?? ''}
      </button>
    </span>
  );
}
