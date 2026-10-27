'use client';

// ============================================================
// Spieltagsbericht → Facebook-Text, Instagram-Story (3 Bilder), Reel (Video)
// ============================================================
// Betreiber, 27.10.2026. Daten legt der Server beim Erzeugen ab
// (spieltag_berichte.facebook/social, Migration 0060, lib/spieltag-social.ts).
// Alles wird HIER im Browser gezeichnet (Canvas 1080×1920); das Reel nimmt
// MediaRecorder vom Canvas auf — ohne Ton, Musik kommt in Instagram dazu
// (das kann kein Programm). Instagram nimmt nur MP4: iPhone/Safari und
// aktuelles Chrome liefern MP4, ältere Browser nur WebM — das steht dann am Knopf.
// Den Link-Sticker der Story setzt man in Instagram von Hand.
// ============================================================

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ladeSpieltagSocial } from '@/lib/supabase/news';
import type { SocialDaten } from '@/lib/spieltag-social';

const W = 1080, H = 1920, PAD = 90;
const ROT = '#E24B4A', WEISS = '#F5F6FA', GRAU = '#AEB6C2', DUNKEL = '#8892A0';

type Ctx = CanvasRenderingContext2D;
interface Schrift { titel: string; text: string }

export function schriften(): Schrift {
  const css = getComputedStyle(document.body);
  const f = (v: string) => (css.getPropertyValue(v).trim() || 'Arial');
  return { titel: f('--font-saira-condensed'), text: f('--font-manrope') };
}
const font = (gewicht: number, px: number, fam: string) => `${gewicht} ${Math.round(px)}px ${fam}, Arial, sans-serif`;

/** Größte Schrift (≤ start), in der der Text in `maxW` passt; sonst mit „…“ gekürzt. */
function passend(ctx: Ctx, text: string, mk: (px: number) => string, maxW: number, start: number, min: number): { text: string; px: number } {
  for (let px = start; px >= min; px -= 2) { ctx.font = mk(px); if (ctx.measureText(text).width <= maxW) return { text, px }; }
  ctx.font = mk(min);
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return { text: t + '…', px: min };
}

function umbrechen(ctx: Ctx, text: string, maxW: number, maxZeilen: number): string[] {
  const out: string[] = []; let z = '';
  for (const w of text.split(' ')) {
    const t = z ? `${z} ${w}` : w;
    if (ctx.measureText(t).width > maxW && z) { out.push(z); z = w; if (out.length >= maxZeilen) return out; } else z = t;
  }
  if (z && out.length < maxZeilen) out.push(z);
  return out;
}

function hintergrund(ctx: Ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#151A22'); g.addColorStop(1, '#0A0D12');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(W / 2, H * 0.28, 0, W / 2, H * 0.28, W * 0.9);
  r.addColorStop(0, 'rgba(212,0,0,0.22)'); r.addColorStop(1, 'rgba(212,0,0,0)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
}

function kopf(ctx: Ctx, s: Schrift, logo: HTMLImageElement | null, d: SocialDaten, label: string) {
  if (logo) { const lw = 300; ctx.drawImage(logo, PAD, 110, lw, lw * (logo.height / logo.width)); }
  ctx.textAlign = 'right'; ctx.fillStyle = ROT; ctx.font = font(800, 40, s.titel);
  ctx.fillText(label.toUpperCase(), W - PAD, 170);
  ctx.fillStyle = GRAU; ctx.font = font(600, 34, s.text);
  ctx.fillText(d.wochenende, W - PAD, 220);
  ctx.textAlign = 'left';
}

function fuss(ctx: Ctx, s: Schrift, text = 'www.mdudarts.de') {
  ctx.textAlign = 'center'; ctx.fillStyle = ROT; ctx.font = font(800, 40, s.titel);
  ctx.fillText(text, W / 2, H - 110); ctx.textAlign = 'left';
}

function ueberschrift(ctx: Ctx, s: Schrift, text: string, y: number) {
  ctx.fillStyle = WEISS; ctx.font = font(900, 92, s.titel); ctx.fillText(text.toUpperCase(), PAD, y);
  ctx.fillStyle = ROT; ctx.fillRect(PAD, y + 26, 120, 8);
}

/** Ergebnisblock (Story 1 / Reel): Liga-Kopf + Zeilen „Heim  erg  Gast“; `sichtbar` = 0..1 je Zeile. */
function ergebnisse(ctx: Ctx, s: Schrift, ligen: SocialDaten['ligen'], top: number, unten: number, sichtbar?: (i: number) => number, maxK = 1.35, mittig = false) {
  const zeilen = ligen.reduce((n, l) => n + l.ergebnisse.length, 0);
  const roh = ligen.length * 86 + zeilen * 74;
  const k = Math.min(maxK, (unten - top) / roh);
  let y = mittig ? top + ((unten - top) - roh * k) / 2 : top, i = 0;
  const mitte = W / 2, spalte = (W - PAD * 2) / 2 - 90 * k;
  for (const l of ligen) {
    const a = sichtbar ? sichtbar(i) : 1;
    ctx.globalAlpha = a;
    ctx.fillStyle = l.farbe; ctx.fillRect(PAD, y + 12 * k, 10, 46 * k);
    ctx.fillStyle = WEISS; ctx.font = font(800, 46 * k, s.titel); ctx.fillText(l.name.toUpperCase(), PAD + 30, y + 52 * k);
    ctx.fillStyle = DUNKEL; ctx.font = font(600, 30 * k, s.text); ctx.textAlign = 'right'; ctx.fillText(l.spieltag, W - PAD, y + 50 * k); ctx.textAlign = 'left';
    y += 86 * k;
    for (const e of l.ergebnisse) {
      ctx.globalAlpha = sichtbar ? sichtbar(++i) : 1;
      const mk = (px: number) => font(600, px, s.text);
      const h = passend(ctx, e.heim, mk, spalte, 38 * k, 24 * k), g = passend(ctx, e.gast, mk, spalte, 38 * k, 24 * k);
      ctx.fillStyle = WEISS;
      ctx.font = mk(h.px); ctx.textAlign = 'right'; ctx.fillText(h.text, mitte - 80 * k, y + 48 * k);
      ctx.font = mk(g.px); ctx.textAlign = 'left'; ctx.fillText(g.text, mitte + 80 * k, y + 48 * k);
      ctx.fillStyle = ROT; ctx.font = font(900, 46 * k, s.titel); ctx.textAlign = 'center';
      ctx.fillText(e.erg + (e.bestaetigt ? '' : '*'), mitte, y + 50 * k);
      ctx.textAlign = 'left';
      y += 74 * k;
    }
    i++;
  }
  ctx.globalAlpha = 1;
  return y;
}

/** Reel: eine Liga, je Begegnung Heim über Gast, Ergebnis groß rechts — volle Namen. */
function ligaGestapelt(ctx: Ctx, s: Schrift, l: SocialDaten['ligen'][number], sichtbar: (i: number) => number) {
  const n = l.ergebnisse.length, zeile = Math.min(230, (H - 760) / Math.max(1, n));
  let y = 380 + ((H - 760) - n * zeile) / 2;
  ctx.globalAlpha = sichtbar(0);
  ctx.fillStyle = l.farbe; ctx.fillRect(PAD, y, 14, 84);
  ctx.fillStyle = WEISS; ctx.font = font(900, 96, s.titel); ctx.fillText(l.name.toUpperCase(), PAD + 40, y + 78);
  ctx.fillStyle = GRAU; ctx.font = font(600, 40, s.text); ctx.textAlign = 'right'; ctx.fillText(l.spieltag, W - PAD, y + 74); ctx.textAlign = 'left';
  y += 150;
  const px = Math.min(62, zeile * 0.3), breit = W - PAD * 2 - 280;
  l.ergebnisse.forEach((e, i) => {
    ctx.globalAlpha = sichtbar(i + 1);
    const mk = (g: number) => font(700, g, s.text);
    const h = passend(ctx, e.heim, mk, breit, px, 30), g = passend(ctx, e.gast, mk, breit, px, 30);
    ctx.fillStyle = WEISS; ctx.font = mk(h.px); ctx.fillText(h.text, PAD, y + px);
    ctx.fillStyle = GRAU; ctx.font = mk(g.px); ctx.fillText(g.text, PAD, y + px * 2.25);
    ctx.fillStyle = ROT; ctx.font = font(900, px * 2, s.titel); ctx.textAlign = 'right';
    ctx.fillText(e.erg + (e.bestaetigt ? '' : '*'), W - PAD, y + px * 2.05); ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(PAD, y + zeile - 18, W - PAD * 2, 2);
    y += zeile;
  });
  ctx.globalAlpha = 1;
}

function spielerBlock(ctx: Ctx, s: Schrift, label: string, sp: SocialDaten['sieger'], y: number, gross: number, k = 1) {
  ctx.fillStyle = ROT; ctx.font = font(800, 40 * k, s.titel); ctx.fillText(label.toUpperCase(), PAD, y);
  y += 24 * k;
  for (const p of sp.slice(0, 2)) {
    const n = passend(ctx, p.name, px => font(900, px, s.titel), W - PAD * 2, gross, 60);
    ctx.fillStyle = WEISS; ctx.font = font(900, n.px, s.titel); ctx.fillText(n.text, PAD, y + n.px * 0.9);
    y += n.px * 0.9 + 20 * k;
    ctx.fillStyle = GRAU; ctx.font = font(700, 40 * k, s.text); ctx.fillText(p.team, PAD, y + 40 * k); y += 64 * k;
    ctx.fillStyle = WEISS; ctx.font = font(500, 36 * k, s.text);
    for (const z of umbrechen(ctx, p.text, W - PAD * 2, 3)) { ctx.fillText(z, PAD, y + 40 * k); y += 52 * k; }
    y += 30 * k;
  }
  return y;
}

// ── Story (3 Bilder) ─────────────────────────────────────────

export function story(ctx: Ctx, s: Schrift, logo: HTMLImageElement | null, d: SocialDaten, nr: number) {
  hintergrund(ctx);
  kopf(ctx, s, logo, d, 'Spieltag');
  if (nr === 0) {
    ueberschrift(ctx, s, 'Ergebnisse', 420);
    const y = ergebnisse(ctx, s, d.ligen, 500, H - 220);
    if (d.ligen.some(l => l.ergebnisse.some(e => !e.bestaetigt))) {
      ctx.fillStyle = DUNKEL; ctx.font = font(500, 28, s.text); ctx.fillText('* noch nicht bestätigt', PAD, Math.min(y + 30, H - 180));
    }
    fuss(ctx, s);
  } else if (nr === 1) {
    let y = spielerBlock(ctx, s, 'Spieler des Spieltages', d.sieger, 480, 150, 1.25);
    if (d.finish) {
      y += 50;
      ctx.fillStyle = ROT; ctx.font = font(800, 40, s.titel); ctx.fillText('HÖCHSTES FINISH', PAD, y);
      ctx.fillStyle = WEISS; ctx.font = font(900, 220, s.titel); ctx.fillText(String(d.finish.wert), PAD - 8, y + 210);
      ctx.fillStyle = GRAU; ctx.font = font(600, 36, s.text);
      for (const z of umbrechen(ctx, d.finish.spieler.join(', '), W - PAD * 2, 2)) { y += 46; ctx.fillText(z, PAD, y + 230); }
      y += 300;
    }
    if (d.meiste.length && y < H - 520) spielerBlock(ctx, s, 'Die meisten Highlights', d.meiste, y + 40, 110, 1.2);
    fuss(ctx, s);
  } else {
    ueberschrift(ctx, s, 'Tabellenspitze', 420);
    let y = 540;
    for (const f of d.fuehrer) {
      ctx.fillStyle = f.farbe; ctx.fillRect(PAD, y, 10, 120);
      ctx.fillStyle = GRAU; ctx.font = font(800, 38, s.titel); ctx.fillText(f.liga.toUpperCase(), PAD + 34, y + 40);
      const t = passend(ctx, f.teams.join(' / '), px => font(900, px, s.titel), W - PAD * 2 - 230, 70, 40);
      ctx.fillStyle = WEISS; ctx.font = font(900, t.px, s.titel); ctx.fillText(t.text, PAD + 34, y + 108);
      ctx.fillStyle = ROT; ctx.font = font(900, 64, s.titel); ctx.textAlign = 'right'; ctx.fillText(`${f.punkte} Pkt`, W - PAD, y + 108); ctx.textAlign = 'left';
      y += 170;
    }
    // Unten Platz für den Link-Sticker (wird in Instagram gesetzt).
    ctx.textAlign = 'center'; ctx.fillStyle = WEISS; ctx.font = font(800, 54, s.titel);
    ctx.fillText('DER GANZE BERICHT', W / 2, H - 400);
    ctx.fillStyle = GRAU; ctx.font = font(600, 36, s.text); ctx.fillText('auf mdudarts.de', W / 2, H - 350);
    ctx.textAlign = 'left';
    fuss(ctx, s);
  }
}

// ── Reel (Video) ─────────────────────────────────────────────

interface Szene { dauer: number; male: (ctx: Ctx, p: number, t: number) => void }

export function szenen(s: Schrift, logo: HTMLImageElement | null, d: SocialDaten): Szene[] {
  const ein = (t: number, ab = 0, lang = 0.45) => Math.max(0, Math.min(1, (t - ab) / lang));
  const out: Szene[] = [{
    dauer: 2.8, male: (ctx, _p, t) => {
      hintergrund(ctx);
      ctx.globalAlpha = ein(t);
      if (logo) { const lw = 620, lh = lw * (logo.height / logo.width); ctx.drawImage(logo, (W - lw) / 2, 380 - (1 - ein(t)) * 40, lw, lh); }
      ctx.globalAlpha = ein(t, 0.4); ctx.textAlign = 'center';
      ctx.fillStyle = ROT; ctx.font = font(900, 120, s.titel); ctx.fillText('SPIELTAG', W / 2, 960);
      ctx.fillStyle = WEISS; ctx.font = font(800, 64, s.titel); ctx.fillText(d.wochenende, W / 2, 1050);
      ctx.globalAlpha = ein(t, 0.9); ctx.fillStyle = GRAU; ctx.font = font(600, 44, s.text);
      umbrechen(ctx, d.titel, W - PAD * 2, 3).forEach((z, i) => ctx.fillText(z, W / 2, 1190 + i * 60));
      ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    },
  }];
  for (const l of d.ligen) out.push({
    dauer: 1.6 + l.ergebnisse.length * 0.45, male: (ctx, _p, t) => {
      hintergrund(ctx); kopf(ctx, s, logo, d, 'Ergebnisse');
      ligaGestapelt(ctx, s, l, i => ein(t, i * 0.3));
      fuss(ctx, s);
    },
  });
  if (d.sieger.length) out.push({
    dauer: 3.6, male: (ctx, _p, t) => {
      hintergrund(ctx); kopf(ctx, s, logo, d, 'Spieltag');
      ctx.globalAlpha = ein(t); spielerBlock(ctx, s, 'Spieler des Spieltages', d.sieger, 700 + (1 - ein(t)) * 60, 190, 1.6); ctx.globalAlpha = 1;
      fuss(ctx, s);
    },
  });
  if (d.finish) {
    const f = d.finish;
    out.push({
      dauer: 3.2, male: (ctx, _p, t) => {
        hintergrund(ctx); kopf(ctx, s, logo, d, 'Highlight');
        ctx.textAlign = 'center';
        ctx.fillStyle = ROT; ctx.font = font(800, 54, s.titel); ctx.fillText('HÖCHSTES FINISH', W / 2, 720);
        ctx.fillStyle = WEISS; ctx.font = font(900, 360, s.titel);
        ctx.fillText(String(Math.round(f.wert * Math.min(1, t / 1.2))), W / 2, 1080);
        ctx.globalAlpha = ein(t, 1.2); ctx.fillStyle = GRAU; ctx.font = font(700, 46, s.text);
        umbrechen(ctx, f.spieler.join(', '), W - PAD * 2, 3).forEach((z, i) => ctx.fillText(z, W / 2, 1200 + i * 60));
        ctx.globalAlpha = 1; ctx.textAlign = 'left';
        fuss(ctx, s);
      },
    });
  }
  if (d.meiste.length) out.push({
    dauer: 3, male: (ctx, _p, t) => {
      hintergrund(ctx); kopf(ctx, s, logo, d, 'Highlights');
      ctx.globalAlpha = ein(t); spielerBlock(ctx, s, 'Die meisten Highlights', d.meiste, 720 + (1 - ein(t)) * 60, 170, 1.5); ctx.globalAlpha = 1;
      fuss(ctx, s);
    },
  });
  out.push({
    dauer: 3.2, male: (ctx, _p, t) => {
      hintergrund(ctx);
      ctx.globalAlpha = ein(t); ctx.textAlign = 'center';
      if (logo) { const lw = 520, lh = lw * (logo.height / logo.width); ctx.drawImage(logo, (W - lw) / 2, 480, lw, lh); }
      ctx.fillStyle = WEISS; ctx.font = font(900, 84, s.titel);
      ['ALLE ERGEBNISSE,', 'HIGHLIGHTS & TABELLEN'].forEach((z, i) => ctx.fillText(z, W / 2, 1000 + i * 96));
      ctx.globalAlpha = ein(t, 0.6); ctx.fillStyle = ROT; ctx.font = font(900, 96, s.titel); ctx.fillText('mdudarts.de', W / 2, 1300);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    },
  });
  return out;
}

const VIDEO_TYPEN = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];

// ── Teilen / Speichern ───────────────────────────────────────

async function teilen(dateien: File[], text?: string): Promise<'geteilt' | 'gespeichert' | 'abgebrochen'> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: dateien })) {
    try { await navigator.share({ files: dateien, ...(text ? { text } : {}) }); return 'geteilt'; }
    catch (e) { if ((e as Error).name === 'AbortError') return 'abgebrochen'; }
  }
  for (const f of dateien) {
    const url = URL.createObjectURL(f), a = document.createElement('a');
    a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  return 'gespeichert';
}

const leinwandDatei = (c: HTMLCanvasElement, name: string) =>
  new Promise<File>((ok, nein) => c.toBlob(b => (b ? ok(new File([b], name, { type: 'image/png' })) : nein(new Error('Bild'))), 'image/png'));

// ── Oberfläche ───────────────────────────────────────────────

const knopf: CSSProperties = {
  padding: '8px 14px', borderRadius: 8, background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)',
  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
};
const titelStil: CSSProperties = { fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13.5, color: 'var(--th-text-strong)', margin: '14px 0 6px' };
const hinweisStil = (ok = true): CSSProperties => ({ fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, marginTop: 6, color: ok ? 'var(--th-text-strong)' : 'var(--th-loss, #d64545)' });

export function SpieltagSocial({ newsId, veroeffentlicht }: { newsId: string; veroeffentlicht: boolean }) {
  const [daten, setDaten] = useState<{ facebook: string; social: SocialDaten } | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [fb, setFb] = useState('');
  const [fbMeldung, setFbMeldung] = useState<{ text: string; ok: boolean } | null>(null);
  const [storyMeldung, setStoryMeldung] = useState<{ text: string; ok: boolean } | null>(null);
  const [reel, setReel] = useState<{ laeuft: boolean; fortschritt: number; datei?: File; url?: string; meldung?: { text: string; ok: boolean } }>({ laeuft: false, fortschritt: 0 });
  const storyRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const reelRef = useRef<HTMLCanvasElement>(null);
  const fbRef = useRef<HTMLTextAreaElement>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let weg = false;
    void ladeSpieltagSocial(newsId).then(({ data, error }) => {
      if (weg) return;
      if (error || !data) { setFehler(error ?? 'Keine Daten.'); return; }
      const d = data as unknown as { facebook: string; social: SocialDaten };
      setDaten(d); setFb(d.facebook ?? '');
    });
    return () => { weg = true; };
  }, [newsId]);

  // Story zeichnen, sobald Daten, Schrift und Logo da sind.
  const zeichneStory = useCallback(() => {
    if (!daten) return;
    const s = schriften();
    storyRefs.current.forEach((c, i) => { const ctx = c?.getContext('2d'); if (ctx) story(ctx, s, logoRef.current, daten.social, i); });
  }, [daten]);
  useEffect(() => {
    if (!daten) return;
    const img = new Image();
    img.onload = () => { logoRef.current = img; void document.fonts.ready.then(zeichneStory); };
    img.onerror = () => { void document.fonts.ready.then(zeichneStory); };
    img.src = '/mdu-logo.webp';
  }, [daten, zeichneStory]);

  async function fbKopieren() {
    try { await navigator.clipboard.writeText(fb); setFbMeldung({ text: 'Text kopiert – jetzt in Facebook einfügen.', ok: true }); return; } catch { /* weiter */ }
    const t = fbRef.current;
    if (t) { t.focus(); t.select(); try { if (document.execCommand('copy')) { setFbMeldung({ text: 'Text kopiert – jetzt in Facebook einfügen.', ok: true }); return; } } catch { /* weiter */ } }
    setFbMeldung({ text: 'Kopieren ist hier gesperrt – der Text ist markiert, bitte von Hand kopieren.', ok: false });
  }

  async function storyTeilen() {
    try {
      const dateien = await Promise.all([0, 1, 2].map(i => leinwandDatei(storyRefs.current[i]!, `mdu-story-${i + 1}.png`)));
      const r = await teilen(dateien);
      setStoryMeldung(r === 'abgebrochen' ? null : { text: r === 'geteilt' ? 'Geteilt. Link-Sticker in Instagram auf das 3. Bild setzen.' : '3 Bilder gespeichert. Link-Sticker in Instagram auf das 3. Bild setzen.', ok: true });
    } catch { setStoryMeldung({ text: 'Bilder konnten nicht erstellt werden.', ok: false }); }
  }

  async function reelErzeugen() {
    const c = reelRef.current, d = daten?.social;
    if (!c || !d) return;
    const typ = VIDEO_TYPEN.find(t => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t));
    if (!typ) { setReel({ laeuft: false, fortschritt: 0, meldung: { text: 'Dieser Browser kann keine Videos aufnehmen – bitte am iPhone (Safari) oder in aktuellem Chrome.', ok: false } }); return; }
    await document.fonts.ready;
    const ctx = c.getContext('2d')!;
    const sz = szenen(schriften(), logoRef.current, d);
    const gesamt = sz.reduce((n, x) => n + x.dauer, 0);
    const strom = c.captureStream(30);
    const rec = new MediaRecorder(strom, { mimeType: typ, videoBitsPerSecond: 6_000_000 });
    const teile: Blob[] = [];
    rec.ondataavailable = e => { if (e.data.size) teile.push(e.data); };
    const fertig = new Promise<void>(ok => { rec.onstop = () => ok(); });
    setReel({ laeuft: true, fortschritt: 0 });
    rec.start(250);
    const start = performance.now();
    await new Promise<void>(ok => {
      const bild = () => {
        const t = (performance.now() - start) / 1000;
        let rest = t, i = 0;
        while (i < sz.length - 1 && rest > sz[i].dauer) { rest -= sz[i].dauer; i++; }
        sz[i].male(ctx, Math.min(1, rest / sz[i].dauer), Math.min(rest, sz[i].dauer));
        // Weiche Blende in den letzten 0,3 s einer Szene.
        const aus = sz[i].dauer - rest;
        if (aus < 0.3 && i < sz.length - 1) { ctx.fillStyle = `rgba(10,13,18,${(0.3 - aus) / 0.3})`; ctx.fillRect(0, 0, W, H); }
        setReel(r => ({ ...r, fortschritt: Math.min(1, t / gesamt) }));
        if (t < gesamt) requestAnimationFrame(bild); else ok();
      };
      requestAnimationFrame(bild);
    });
    rec.stop(); await fertig;
    const mp4 = typ.startsWith('video/mp4');
    const datei = new File([new Blob(teile, { type: typ.split(';')[0] })], `mdu-reel-${d.newsId}.${mp4 ? 'mp4' : 'webm'}`, { type: typ.split(';')[0] });
    setReel({
      laeuft: false, fortschritt: 1, datei, url: URL.createObjectURL(datei),
      meldung: mp4 ? { text: `Fertig (${Math.round(gesamt)} s, ohne Ton – Musik in Instagram auswählen).`, ok: true }
        : { text: 'Fertig, aber als WebM – Instagram nimmt nur MP4. Bitte am iPhone (Safari) oder in aktuellem Chrome erzeugen.', ok: false },
    });
  }

  if (fehler) return <div style={hinweisStil(false)}>{fehler}</div>;
  if (!daten) return <div style={hinweisStil()}>Lädt …</div>;

  return (
    <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--th-line-8)', background: 'var(--th-bg-page)' }}>
      <div style={{ ...titelStil, marginTop: 0 }}>Facebook</div>
      <textarea ref={fbRef} value={fb} onChange={e => setFb(e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', minHeight: 170, padding: '9px 11px', borderRadius: 8, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, lineHeight: 1.5, resize: 'vertical' }} />
      <button type="button" onClick={fbKopieren} style={{ ...knopf, marginTop: 6 }}>Text kopieren</button>
      {!veroeffentlicht && <div style={hinweisStil(false)}>Der Link im Text funktioniert erst, wenn der Bericht veröffentlicht ist.</div>}
      {fbMeldung && <div style={hinweisStil(fbMeldung.ok)}>{fbMeldung.text}</div>}

      <div style={titelStil}>Instagram-Story (3 Bilder)</div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        {[0, 1, 2].map(i => (
          <canvas key={i} ref={el => { storyRefs.current[i] = el; }} width={W} height={H} style={{ width: 120, height: 213, borderRadius: 8, border: '1px solid var(--th-line-8)', flexShrink: 0 }} />
        ))}
      </div>
      <button type="button" onClick={storyTeilen} style={{ ...knopf, marginTop: 8 }}>Story-Bilder teilen / speichern</button>
      {storyMeldung && <div style={hinweisStil(storyMeldung.ok)}>{storyMeldung.text}</div>}

      <div style={titelStil}>Instagram-Reel (Video)</div>
      <canvas ref={reelRef} width={W} height={H} style={{ width: 120, height: 213, borderRadius: 8, border: '1px solid var(--th-line-8)', display: reel.url ? 'none' : 'block' }} />
      {reel.url && <video src={reel.url} controls playsInline muted style={{ width: 160, borderRadius: 8, border: '1px solid var(--th-line-8)' }} />}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        <button type="button" onClick={reelErzeugen} disabled={reel.laeuft} style={{ ...knopf, opacity: reel.laeuft ? 0.6 : 1 }}>
          {reel.laeuft ? `Wird aufgenommen … ${Math.round(reel.fortschritt * 100)} %` : reel.url ? 'Neu aufnehmen' : 'Reel erzeugen'}
        </button>
        {reel.datei && <button type="button" onClick={() => void teilen([reel.datei!])} style={knopf}>Reel teilen / speichern</button>}
      </div>
      {reel.laeuft && <div style={hinweisStil()}>Bitte Bildschirm anlassen und auf dieser Seite bleiben, bis 100 % erreicht sind.</div>}
      {reel.meldung && <div style={hinweisStil(reel.meldung.ok)}>{reel.meldung.text}</div>}
    </div>
  );
}
