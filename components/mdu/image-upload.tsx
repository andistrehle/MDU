'use client';

// ============================================================
// ImageUpload — Bild auswählen, im Browser verkleinern/komprimieren,
// in den öffentlichen Supabase-Bucket „media" hochladen.
// ============================================================
//
// Wiederverwendbar für Profilbild (Pilot) und später Teamlogo/Mannschaftsbild.
// Komprimiert clientseitig auf maxDim (WebP) → winzige Dateien, schnelle Ladezeit,
// minimale Speicher-/Bandbreitenkosten. Stabiler Pfad + upsert → die URL bleibt
// gleich; ein Cache-Buster (?t=) erzwingt die Neuanzeige nach dem Ersetzen.

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

const BUCKET = 'media';

/** Verkleinert ein Bild auf maxDim (längste Kante) und gibt ein WebP-Blob zurück. */
async function compressToWebp(file: File, maxDim: number, quality = 0.85): Promise<Blob> {
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error('Datei konnte nicht gelesen werden.'));
    r.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('Bild konnte nicht geladen werden.'));
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas nicht verfügbar.');
  ctx.drawImage(img, 0, 0, w, h);
  return await new Promise<Blob>((res, rej) =>
    canvas.toBlob(b => (b ? res(b) : rej(new Error('Komprimierung fehlgeschlagen.'))), 'image/webp', quality),
  );
}

export function ImageUpload({ value, onChange, folder, fileBase, maxDim = 512, shape = 'circle', disabled }: {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Zielordner im Bucket, z. B. `players/{playerId}`. */
  folder: string;
  /** Dateiname-Basis ohne Endung, z. B. `avatar`. */
  fileBase: string;
  maxDim?: number;
  shape?: 'circle' | 'square';
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const path = `${folder}/${fileBase}.webp`;

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (!supabase) { setErr('Bild-Speicher ist nicht konfiguriert.'); return; }
    setBusy(true); setErr(null);
    try {
      const blob = await compressToWebp(file, maxDim);
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: 'image/webp' });
      if (error) throw error;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(`${data.publicUrl}?t=${Date.now()}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload fehlgeschlagen.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onRemove() {
    if (supabase) { try { await supabase.storage.from(BUCKET).remove([path]); } catch { /* egal */ } }
    onChange(null);
  }

  const size = 96;
  const radius = shape === 'circle' ? '50%' : 12;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: size, height: size, borderRadius: radius, flexShrink: 0, overflow: 'hidden',
        background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--th-text-faint2)', fontFamily: 'var(--font-manrope)', fontSize: 11,
      }}>
        {value
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={value} alt="Vorschau" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : 'Kein Bild'}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label style={{
            padding: '8px 14px', borderRadius: 8, cursor: disabled || busy ? 'default' : 'pointer',
            background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)',
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, opacity: disabled || busy ? 0.6 : 1,
          }}>
            {busy ? 'Lädt …' : value ? 'Bild ersetzen' : 'Bild hochladen'}
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden
              disabled={disabled || busy} onChange={e => onPick(e.target.files?.[0])} />
          </label>
          {value && !busy && (
            <button type="button" onClick={onRemove} disabled={disabled} style={{
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
              background: 'transparent', color: 'var(--th-loss)', border: '1.5px solid var(--th-loss)',
              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12,
            }}>Entfernen</button>
          )}
        </div>
        {err
          ? <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: '#E24B4A' }}>{err}</span>
          : <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)' }}>JPG/PNG/WebP · wird automatisch verkleinert</span>}
      </div>
    </div>
  );
}
