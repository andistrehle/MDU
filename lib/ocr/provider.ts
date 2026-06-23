// ============================================================
// OCR — Provider-Abstraktion
// ============================================================
//
// Zentrale Schnittstelle, damit der Vision-/OCR-Anbieter austauschbar bleibt
// und niemals hart in UI-Komponenten landet. Provider werden ausschließlich
// serverseitig aufgerufen (API-Keys als server-only ENV).
// ============================================================

import 'server-only';
import { getOcrConfig, isProviderConfigured, type OcrConfig } from './config';
import type { MatchReportExtraction } from './schemas';

/** Eine Seite des hochgeladenen Berichts (Bild oder PDF), als Base64. */
export interface OcrInputPage {
  mimeType: string;
  base64: string;
}

/** Bekannte Begegnungsdaten zur Validierung/Zuordnung (vorab gewählt). */
export interface OcrMatchContext {
  season: string | null;
  league: string | null;
  matchday: number | null;
  date: string | null;
  venue: string | null;
  homeTeam: string | null;
  guestTeam: string | null;
  homeRoster: string[];
  guestRoster: string[];
}

export interface OcrFieldResult {
  fieldKey: string;
  detectedValue: string | null;
  confidence: number | null;
}

export interface OcrExtractionResult {
  rawText: string | null;
  structuredData: MatchReportExtraction | null;
  fields: OcrFieldResult[];
  confidence: number | null;
  warnings: string[];
  provider: string;
  modelVersion: string | null;
  providerRequestId: string | null;
}

export interface OcrProvider {
  readonly name: string;
  extract(pages: OcrInputPage[], context: OcrMatchContext): Promise<OcrExtractionResult>;
}

/** Fehler, wenn der Provider nicht konfiguriert ist (sauber, kein Fake-Erfolg). */
export class OcrNotConfiguredError extends Error {
  constructor(message = 'OCR-Provider ist nicht konfiguriert.') {
    super(message);
    this.name = 'OcrNotConfiguredError';
  }
}

/**
 * Liefert den aktiven Provider oder `null`, wenn nicht konfiguriert.
 * Lädt die Provider-Implementierung dynamisch, damit das SDK nur dann ins
 * Bundle kommt, wenn es gebraucht wird.
 */
export async function getOcrProvider(cfg: OcrConfig = getOcrConfig()): Promise<OcrProvider | null> {
  if (!isProviderConfigured(cfg)) return null;
  if (cfg.provider === 'stub') {
    const { StubProvider } = await import('./providers/stub');
    return new StubProvider();
  }
  if (cfg.provider === 'claude') {
    const { ClaudeProvider } = await import('./providers/claude');
    return new ClaudeProvider(cfg.apiKey!, cfg.model);
  }
  return null;
}
