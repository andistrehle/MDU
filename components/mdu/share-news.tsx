'use client';

// ============================================================
// ShareNews — halb-automatisches Teilen einer News auf Social Media
// ============================================================
//
// Erzeugt clientseitig ein fertiges 1080×1080-Bild (Marken-Look) zum
// Herunterladen (Instagram/Facebook), eine kopierfertige Bildunterschrift und
// einen Facebook-Teilen-Link. Kein Meta-API/Review nötig — der Betreiber teilt
// mit wenigen Klicks in die FB-Gruppe und zu Instagram.
// Nur für die Ligaleitung sichtbar (Publishing-Hilfe).
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NewsArticle } from '@/lib/data/news';

const SITE = 'https://www.mdudarts.de/news';

export function ShareNews({ article }: { article: NewsArticle }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const caption = `${article.title}\n\n${article.teaser}\n\n👉 ${SITE}\n\n#münchnerdartunion #mdu #darts #münchen #dartsliga #steeldarts`;

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const W = 1080, H = 1080, PAD = 96;

    // Hintergrund (dunkel + dezenter roter Radial — wie die Homepage).
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#151A22'); g.addColorStop(1, '#0A0D12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const rg = ctx.createRadialGradient(W / 2, H * 0.34, 0, W / 2, H * 0.34, W * 0.72);
    rg.addColorStop(0, 'rgba(212,0,0,0.20)'); rg.addColorStop(1, 'rgba(212,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

    ctx.textBaseline = 'alphabetic';
    const maxW = W - PAD * 2;

    // Zeilenumbruch-Helfer (füllt max. `maxLines` Zeilen).
    const wrap = (font: string, text: string, maxLines = 99): string[] => {
      ctx.font = font;
      const out: string[] = [];
      let line = '';
      for (const w of text.split(' ')) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW && line) {
          out.push(line); line = w;
          if (out.length >= maxLines - 1) break;
        } else line = test;
      }
      if (line && out.length < maxLines) out.push(line);
      return out;
    };

    // Kategorie-Label
    ctx.fillStyle = '#E24B4A';
    ctx.font = '800 34px Arial, sans-serif';
    ctx.fillText((article.category || 'MDU News').toUpperCase(), PAD, 430);

    // Headline — Schriftgröße reduzieren, wenn sie sonst >3 Zeilen bräuchte.
    let hFont = '900 74px Arial, sans-serif', hLH = 86;
    let hLines = wrap(hFont, article.title.toUpperCase());
    if (hLines.length > 3) { hFont = '900 58px Arial, sans-serif'; hLH = 70; hLines = wrap(hFont, article.title.toUpperCase()); }
    ctx.fillStyle = '#F5F6FA';
    ctx.font = hFont;
    let y = 500;
    for (const l of hLines) { ctx.fillText(l, PAD, y); y += hLH; }

    // Teaser (max. 2 Zeilen, sicher über der Fußzeile).
    ctx.fillStyle = '#AEB6C2';
    const tFont = '400 34px Arial, sans-serif';
    const tLines = wrap(tFont, article.teaser, 2);
    ctx.font = tFont;
    let ty = y + 24;
    for (const l of tLines) { if (ty > H - 150) break; ctx.fillText(l, PAD, ty); ty += 46; }

    // Fußzeile: Datum + Domain
    ctx.fillStyle = '#8892A0';
    ctx.font = '600 30px Arial, sans-serif';
    ctx.fillText(article.date, PAD, H - 92);
    ctx.fillStyle = '#E24B4A';
    ctx.font = '800 30px Arial, sans-serif';
    const domain = 'www.mdudarts.de';
    ctx.fillText(domain, W - PAD - ctx.measureText(domain).width, H - 92);

    // Logo oben links (asynchron nachzeichnen)
    const img = new Image();
    img.onload = () => {
      const lw = 380, lh = lw * (img.height / img.width);
      ctx.drawImage(img, PAD, 96, lw, lh);
    };
    img.src = '/mdu-logo.webp';
  }, [article]);

  useEffect(() => { if (open) draw(); }, [open, draw]);

  function download() {
    canvasRef.current?.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `mdu-news-${article.id}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  async function copyCaption() {
    try { await navigator.clipboard.writeText(caption); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* Clipboard nicht verfügbar */ }
  }

  return (
    <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--th-line-6)' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 8, cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13 }}>
        📣 Für Social Media aufbereiten
      </button>

      {open && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <canvas ref={canvasRef} width={1080} height={1080}
            style={{ width: '100%', maxWidth: 360, alignSelf: 'center', borderRadius: 12, border: '1px solid var(--th-line-8)' }} />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={download} style={actionBtn}>⬇ Bild herunterladen</button>
            <button type="button" onClick={copyCaption} style={actionBtn}>{copied ? '✓ Kopiert' : '📋 Text kopieren'}</button>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE)}`} target="_blank" rel="noopener noreferrer" style={{ ...actionBtn, textDecoration: 'none' }}>
              f  Auf Facebook teilen
            </a>
          </div>

          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', lineHeight: 1.55, margin: 0 }}>
            <strong style={{ color: 'var(--th-text-muted)' }}>Instagram:</strong> Bild herunterladen, in der Instagram-App als Beitrag hochladen und den kopierten Text als Bildunterschrift einfügen.{' '}
            <strong style={{ color: 'var(--th-text-muted)' }}>Facebook:</strong> „Auf Facebook teilen" öffnet den Teilen-Dialog — dort die MDU-Gruppe als Ziel wählen (oder Bild + Text posten).
          </p>
        </div>
      )}
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '9px 14px', borderRadius: 8, cursor: 'pointer',
  background: 'transparent', color: 'var(--th-accent)',
  border: '1.5px solid var(--th-accent)',
  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
};
