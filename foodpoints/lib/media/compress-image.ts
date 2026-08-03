'use client';

/**
 * Komprimiert ein Bild clientseitig über Canvas-Re-Encoding:
 * - max. 1600 px Kantenlänge, JPEG-Qualität 0,82
 * - entfernt EXIF-Metadaten (inkl. GPS), da nur Pixel neu kodiert werden
 * Rückgabe: Base64 ohne data:-Präfix.
 */
export async function compressImageToBase64(
  file: File,
  maxEdge = 1600,
  quality = 0.82,
): Promise<{ base64: string; mimeType: 'image/jpeg' }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Bitte wähle eine Bilddatei (JPG, PNG oder WebP).');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Das Bild ist zu groß (max. 20 MB).');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Bildverarbeitung nicht verfügbar.');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('Bild konnte nicht verarbeitet werden.');
  return { base64, mimeType: 'image/jpeg' };
}
