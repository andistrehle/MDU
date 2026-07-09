// ============================================================
// OCR — Vorverarbeitung / Datei-Validierung (Phase 1: schlank)
// ============================================================
//
// Format-/Größenprüfung und Konvertierung Datei → Base64 für den Provider.
// Aggressive Bildverbesserung (Deskew, Perspektive, Kontrast) ist für eine
// spätere Phase vorgesehen; das Original wird unverändert gespeichert.
// ============================================================

import 'server-only';
import type { OcrInputPage } from './provider';

/** Akzeptierte Upload-Formate. HEIC wird angenommen, aber für OCR (noch) nicht
 *  direkt an den Vision-Provider gegeben (Konvertierung folgt später). */
export const ACCEPTED_MIME = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf',
] as const;

/** Formate, die der Vision-Provider direkt verarbeiten kann. */
export const OCR_READY_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export function isAcceptedMime(mime: string): boolean {
  return (ACCEPTED_MIME as readonly string[]).includes(mime);
}

export function isOcrReadyMime(mime: string): boolean {
  return OCR_READY_MIME.includes(mime);
}

/**
 * Erkennt das tatsächliche Format anhand der „Magic Bytes" (Dateisignatur) —
 * unabhängig vom fälschbaren, client-deklarierten MIME. Gibt den erkannten
 * akzeptierten MIME zurück oder null, wenn die Signatur zu keinem passt (REV-015).
 */
export function sniffAcceptedMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  // PDF: %PDF
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return 'application/pdf';
  // WEBP: 'RIFF' … 'WEBP'
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  // ISO-BMFF (HEIC/HEIF): 'ftyp' bei Offset 4, Brand bei Offset 8
  if (buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12);
    if (['heic', 'heix', 'hevc', 'heim', 'heis', 'hevm', 'hevs', 'heif'].includes(brand)) return 'image/heic';
    if (['mif1', 'msf1'].includes(brand)) return 'image/heif';
  }
  return null;
}

export function extForMime(mime: string): string {
  switch (mime) {
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    case 'image/heic': return 'heic';
    case 'image/heif': return 'heif';
    case 'application/pdf': return 'pdf';
    default: return 'bin';
  }
}

/** Liest eine hochgeladene Datei in eine Base64-Provider-Seite. */
export async function fileToInputPage(buf: ArrayBuffer, mimeType: string): Promise<OcrInputPage> {
  return { mimeType, base64: Buffer.from(buf).toString('base64') };
}
