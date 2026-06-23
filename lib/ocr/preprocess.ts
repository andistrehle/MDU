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
