'use client';

// ============================================================
// Normale News → Facebook & Instagram (Betreiber, 12.11.2026)
// ============================================================
// Ein Vorschaubild 1080×1350 (4:5 — passt in den Feed von Facebook UND Instagram)
// im Stil der Seite: blaues Kopfband mit Logo (ohne Dartscheibe — die stand als harter Kasten im Band), Überschrift groß, Teaser darunter.
// Dazu je ein Begleittext zum Kopieren (Facebook mit Direktlink, Instagram mit
// Adresse als Text — Links sind dort nicht anklickbar). Gezeichnet im Browser.
// Spieltagsberichte haben ihre eigene, größere Ausgabe (spieltag-social.tsx).
// ============================================================

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { schriften } from './spieltag-social';

const W = 1080, H = 1350, PAD = 90, BAND = 300;
const GRUEN = '#3E9C33', DUNKEL = '#1A1D24', GRAU = '#4A515C', BLAU1 = '#6B95CE', BLAU2 = '#4E7DBD';
const font = (g: number, px: number, fam: string) => `${g} ${Math.round(px)}px ${fam}, Arial, sans-serif`;
const ohneMarkdown = (t: string) => t.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();

function umbrechen(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = []; let z = '';
  for (const w of text.split(/\s+/)) {
    const t = z ? `${z} ${w}` : w;
    if (ctx.measureText(t).width > maxW && z) { out.push(z); z = w; } else z = t;
  }
  if (z) out.push(z);
  return out;
}

function zeichne(ctx: CanvasRenderingContext2D, titel: string, teaser: string, label: string, logo: HTMLImageElement | null) {
  const s = schriften();
  ctx.fillStyle = '#F2F4F7'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W, BAND); g.addColorStop(0, BLAU1); g.addColorStop(1, BLAU2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, BAND);
  ctx.fillStyle = GRUEN; ctx.fillRect(0, BAND, W, 8);
  if (logo) { const lw = 290, lh = lw * (logo.height / logo.width); ctx.drawImage(logo, PAD, (BAND - lh) / 2, lw, lh); }
  ctx.textAlign = 'right'; ctx.fillStyle = '#FFFFFF'; ctx.font = font(900, 48, s.titel);
  ctx.fillText(label.toUpperCase(), W - PAD, BAND / 2 + 16); ctx.textAlign = 'left';

  // Überschrift: größte Schrift, bei der sie in höchstens 4 Zeilen passt.
  const maxW = W - PAD * 2;
  let px = 112, zeilen: string[] = [];
  for (; px >= 60; px -= 4) { ctx.font = font(900, px, s.titel); zeilen = umbrechen(ctx, titel.toUpperCase(), maxW); if (zeilen.length <= 4) break; }
  let y = BAND + 120 + px * 0.8;
  ctx.fillStyle = DUNKEL;
  for (const z of zeilen.slice(0, 4)) { ctx.fillText(z, PAD, y); y += px * 1.05; }
  ctx.fillStyle = GRUEN; ctx.fillRect(PAD, y - px * 0.55 + 30, 140, 9);

  // Teaser: bis zu 5 Zeilen, Rest mit „…“.
  ctx.font = font(500, 44, s.text); ctx.fillStyle = GRAU;
  const tz = umbrechen(ctx, teaser, maxW);
  let ty = y + 80;
  tz.slice(0, 5).forEach((z, i) => { ctx.fillText(i === 4 && tz.length > 5 ? `${z.replace(/\s*\S*$/, '')} …` : z, PAD, ty); ty += 62; });

  ctx.textAlign = 'center'; ctx.fillStyle = GRUEN; ctx.font = font(800, 42, s.titel);
  ctx.fillText('www.mdudarts.de', W / 2, H - 80); ctx.textAlign = 'left';
}

const HASHTAGS = '#münchnerdartunion #mdu #darts #edarts #dartsliga #münchen';

async function kopiere(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

const knopf: CSSProperties = {
  padding: '8px 14px', borderRadius: 8, background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)',
  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
};
const feld: CSSProperties = { width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-manrope)', fontSize: 13, padding: 10, borderRadius: 8, border: '1px solid var(--th-line-10)', background: 'var(--th-bg-inset)', color: 'var(--th-text-strong)', resize: 'vertical' };

export function NewsSocial({ id, titel, teaser, kategorie }: { id: string; titel: string; teaser: string; kategorie: string }) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const t = ohneMarkdown(titel), tz = ohneMarkdown(teaser);
  const label = /feature/i.test(kategorie) ? 'Neu' : 'News';
  const [fb, setFb] = useState(`${t}\n\n${tz}\n\n👉 https://www.mdudarts.de/news#${id}\n\n${HASHTAGS}`);
  const [ig, setIg] = useState(`${t}\n\n${tz}\n\nAlles dazu auf mdudarts.de/news\n\n${HASHTAGS}`);

  useEffect(() => {
    let logo: HTMLImageElement | null = null;
    const neu = () => { const ctx = canvas.current?.getContext('2d'); if (ctx) zeichne(ctx, t, tz, label, logo); };
    const a = new Image(); a.onload = () => { logo = a; void document.fonts.ready.then(neu); }; a.src = '/mdu-logo.webp';
    void document.fonts.ready.then(neu);
  }, [t, tz, label]);

  async function bildTeilen() {
    const c = canvas.current; if (!c) return;
    const blob = await new Promise<Blob | null>(ok => c.toBlob(ok, 'image/png'));
    if (!blob) { setHinweis('Bild ließ sich nicht erzeugen.'); return; }
    const datei = new File([blob], `mdu-${id}.png`, { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [datei] })) {
      try { await navigator.share({ files: [datei] }); setHinweis('Geteilt.'); return; }
      catch (e) { if ((e as Error).name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(datei), el = document.createElement('a');
    el.href = url; el.download = datei.name; document.body.appendChild(el); el.click(); el.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setHinweis('Bild gespeichert.');
  }

  return (
    <div style={{ marginTop: 12, padding: 14, borderRadius: 12, border: '1px solid var(--th-line-8)', background: 'var(--th-bg-card)' }}>
      <canvas ref={canvas} width={W} height={H} style={{ width: '100%', maxWidth: 320, height: 'auto', borderRadius: 8, border: '1px solid var(--th-line-8)', display: 'block' }} aria-label="Vorschaubild für Facebook und Instagram" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button type="button" onClick={() => void bildTeilen()} style={knopf}>Bild teilen / speichern</button>
      </div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13.5, color: 'var(--th-text-strong)', margin: '14px 0 6px' }}>Facebook-Text</div>
      <textarea value={fb} onChange={e => setFb(e.target.value)} rows={6} style={feld} />
      <button type="button" onClick={async () => setHinweis(await kopiere(fb) ? 'Facebook-Text kopiert.' : 'Kopieren ging nicht – bitte von Hand markieren.')} style={{ ...knopf, marginTop: 6 }}>Facebook-Text kopieren</button>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13.5, color: 'var(--th-text-strong)', margin: '14px 0 6px' }}>Instagram-Text</div>
      <textarea value={ig} onChange={e => setIg(e.target.value)} rows={6} style={feld} />
      <button type="button" onClick={async () => setHinweis(await kopiere(ig) ? 'Instagram-Text kopiert.' : 'Kopieren ging nicht – bitte von Hand markieren.')} style={{ ...knopf, marginTop: 6 }}>Instagram-Text kopieren</button>
      {hinweis && <div role="status" style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, marginTop: 8, color: 'var(--th-text-strong)' }}>{hinweis}</div>}
    </div>
  );
}
