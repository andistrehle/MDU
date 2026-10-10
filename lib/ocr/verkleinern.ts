// ============================================================
// Spielbericht-Foto im Browser verkleinern (vor dem Hochladen)
// ============================================================
//
// Warum: Handyfotos sind 3–8 MB groß. Vercel nimmt pro Anfrage nur etwa
// 4,5 MB an — größere Fotos scheiterten am Upload, obwohl die Seite 12 MB
// erlaubte. Außerdem bleibt der Speicher klein, falls die Fotos aufbewahrt
// werden (~0,5 MB statt 3–8 MB je Seite).
//
// Lange Seite höchstens 2400 px: Ein A4-Bogen ist damit noch gut lesbar
// (auch Handschrift); die Texterkennung rechnet intern ohnehin mit kleineren
// Bildern. Ausgabe JPEG (Qualität 0,82). HEIC (iPhone) wandelt der Browser
// mit um, soweit er es öffnen kann (Safari ja) — sonst bleibt die alte
// Meldung. PDFs bleiben unverändert.
// ============================================================

const MAX_SEITE = 2400;
const QUALITAET = 0.82;

export type VerkleinertErgebnis =
  | { ok: true; file: File; vorher: number; nachher: number }
  | { ok: false; grund: 'heic_nicht_lesbar' | 'nicht_lesbar' };

function istHeic(f: File) { return /heic|heif/i.test(f.type) || /\.hei[cf]$/i.test(f.name); }

async function ladeBild(f: File): Promise<{ w: number; h: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void } | null> {
  // createImageBitmap beachtet die EXIF-Drehung (Handy hochkant) mit „from-image".
  try {
    const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
    return { w: bmp.width, h: bmp.height, draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h) };
  } catch { /* Fallback über <img> */ }
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    return { w: img.naturalWidth, h: img.naturalHeight, draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h) };
  } catch { return null; } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

export async function verkleinereFoto(f: File): Promise<VerkleinertErgebnis> {
  if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) return { ok: true, file: f, vorher: f.size, nachher: f.size };
  const bild = await ladeBild(f);
  if (!bild || !bild.w || !bild.h) return { ok: false, grund: istHeic(f) ? 'heic_nicht_lesbar' : 'nicht_lesbar' };

  const faktor = Math.min(1, MAX_SEITE / Math.max(bild.w, bild.h));
  const w = Math.round(bild.w * faktor), h = Math.round(bild.h * faktor);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { ok: false, grund: 'nicht_lesbar' };
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); // transparente PNGs nicht schwarz werden lassen
  bild.draw(ctx, w, h);
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', QUALITAET));
  if (!blob) return { ok: false, grund: 'nicht_lesbar' };

  // Schon kleines JPG, das durch Umrechnen größer würde → Original behalten.
  if (!istHeic(f) && f.type === 'image/jpeg' && blob.size >= f.size) return { ok: true, file: f, vorher: f.size, nachher: f.size };
  const name = f.name.replace(/\.[^.]+$/, '') + '.jpg';
  return { ok: true, file: new File([blob], name, { type: 'image/jpeg' }), vorher: f.size, nachher: blob.size };
}
