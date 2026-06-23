// ============================================================
// OCR-Provider: Claude Vision (Anthropic)
// ============================================================
//
// Erkennt UND strukturiert einen fotografierten MDU-Spielbericht in einem
// Aufruf (Vision + Structured Output via Zod). Server-only; API-Key kommt aus
// server-only ENV. Handschrift-Erkennung ist der Kern, daher Vision-Modell
// statt klassischem OCR.
// ============================================================

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { GAME_SCHEDULE } from '@/lib/supabase/match-reports';
import { MatchReportExtractionSchema } from '../schemas';
import type { OcrProvider, OcrInputPage, OcrMatchContext, OcrExtractionResult } from '../provider';

const SUPPORTED_IMAGE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function buildPrompt(ctx: OcrMatchContext): string {
  const order = GAME_SCHEDULE.map(g =>
    g.type === 'double'
      ? `${g.no}: Doppel`
      : `${g.no}: Einzel H${g.homeSlot}–G${g.guestSlot}`,
  ).join(' · ');
  const home = ctx.homeRoster.length ? ctx.homeRoster.join(', ') : '(unbekannt)';
  const guest = ctx.guestRoster.length ? ctx.guestRoster.join(', ') : '(unbekannt)';
  return [
    'Du liest einen handschriftlich ausgefüllten, offiziellen MDU-Spielbericht (Dart, Münchner Dart Union) aus dem/den Bild(ern) aus.',
    'Gib NUR das, was tatsächlich lesbar ist; erfinde nichts. Unsichere Werte mit niedriger confidence (0..1) markieren, fehlende Werte als null.',
    '',
    'Feste Spielreihenfolge (18 Begegnungen, Doppel Nr. 9 in der Mitte und Nr. 18 am Ende):',
    order,
    '',
    'Aufstellung: H1–H4 / G1–G4 sind Stammspieler, H5–H8 / G5–G8 Ersatz. Positionen exakt als "H1".."H8" bzw. "G1".."G8" zurückgeben.',
    'Einzel-Leg-Ergebnisse sind i. d. R. 2:0/2:1/1:2/0:2 (in der La-Liga Best of 5: bis 3 Legs). legsHome/legsGuest als Zahlen.',
    'Highlights: Typen 180, 171, high_finish (Checkout ≥100), short_leg (Anzahl Darts).',
    'Unterschriften: nur erkennen, ob vorhanden (true/false) — KEINE biometrische Analyse.',
    'Wenn das Dokument offensichtlich KEIN MDU-Spielbericht ist, documentType = "unknown".',
    '',
    'Bekannter Kontext der vorab gewählten Begegnung (zur Plausibilisierung der Namen/Teams; nicht blind übernehmen):',
    `- Saison: ${ctx.season ?? '?'} · Liga: ${ctx.league ?? '?'} · Spieltag: ${ctx.matchday ?? '?'} · Datum: ${ctx.date ?? '?'}`,
    `- Heim: ${ctx.homeTeam ?? '?'} · Gast: ${ctx.guestTeam ?? '?'} · Spielstätte: ${ctx.venue ?? '?'}`,
    `- Heim-Kader: ${home}`,
    `- Gast-Kader: ${guest}`,
  ].join('\n');
}

function toContentBlock(page: OcrInputPage): Anthropic.ContentBlockParam {
  if (page.mimeType === 'application/pdf') {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: page.base64 } };
  }
  if (SUPPORTED_IMAGE.has(page.mimeType)) {
    return {
      type: 'image',
      source: { type: 'base64', media_type: page.mimeType as 'image/jpeg', data: page.base64 },
    };
  }
  throw new Error(`Nicht unterstütztes Format für OCR: ${page.mimeType} (bitte JPG, PNG oder PDF).`);
}

export class ClaudeProvider implements OcrProvider {
  readonly name = 'claude';
  private client: Anthropic;

  constructor(apiKey: string, private model: string) {
    this.client = new Anthropic({ apiKey });
  }

  async extract(pages: OcrInputPage[], context: OcrMatchContext): Promise<OcrExtractionResult> {
    const content: Anthropic.ContentBlockParam[] = [
      ...pages.map(toContentBlock),
      { type: 'text', text: buildPrompt(context) },
    ];

    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 12000,
      thinking: { type: 'adaptive' },
      output_config: { format: zodOutputFormat(MatchReportExtractionSchema) },
      messages: [{ role: 'user', content }],
    });

    const structured = response.parsed_output ?? null;
    const rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n') || null;

    return {
      rawText,
      structuredData: structured,
      fields: [], // Feld-Flachliste baut parse-match-report aus structuredData
      confidence: null,
      warnings: structured?.warnings ?? [],
      provider: this.name,
      modelVersion: response.model ?? this.model,
      providerRequestId: response._request_id ?? null,
    };
  }
}
