// ============================================================
// OCR-Provider: Claude Vision (Anthropic)
// ============================================================
//
// Erkennt UND strukturiert einen fotografierten MDU-Spielbericht in einem
// Aufruf. Claude gibt JSON nach unserem Schema zurück; die Validierung machen
// wir serverseitig mit Zod (kein API-Structured-Output-Compiler, der die Zahl
// der Nullable-/Union-Felder begrenzt). Server-only; Key aus server-only ENV.
// ============================================================

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { GAME_SCHEDULE } from '@/lib/supabase/match-reports';
import { LEAGUES } from '@/lib/data';
import { MatchReportExtractionSchema, type MatchReportExtraction } from '../schemas';
import type { OcrProvider, OcrInputPage, OcrMatchContext, OcrExtractionResult } from '../provider';

/** Gültige reguläre Liganamen (zum Ankreuzen auf dem Bogen). */
const LEAGUE_NAMES = LEAGUES.filter(l => l.type !== 'playoff').map(l => l.name);

const SUPPORTED_IMAGE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const JSON_SPEC = [
  'Gib AUSSCHLIESSLICH gültiges JSON zurück — kein Markdown, kein Text davor oder danach — nach genau diesem Schema:',
  '{',
  '  "documentType": "mdu_match_report" | "unknown",',
  '  "templateVersion": string|null,',
  '  "match": { "season": string|null, "league": string|null, "matchday": number|null, "date": "YYYY-MM-DD"|null, "venue": string|null, "homeTeam": string|null, "guestTeam": string|null, "captainHome": string|null, "captainGuest": string|null },',
  '  "homeLineup": [ { "position": "H1".."H8", "detectedName": string|null, "passNo": string|null, "confidence": number|null } ],',
  '  "guestLineup": [ { "position": "G1".."G8", "detectedName": string|null, "passNo": string|null, "confidence": number|null } ],',
  '  "games": [ { "gameNo": 1-18, "type": "single"|"double", "homePositions": string[], "guestPositions": string[], "legsHome": number|null, "legsGuest": number|null, "confidence": number|null } ],',
  '  "substitutions": [ { "side": "home"|"guest", "position": string|null, "playerOut": string|null, "playerIn": string|null, "fromGameNo": number|null, "confidence": number|null } ],',
  '  "highlights": [ { "side": "home"|"guest", "position": string|null, "type": "180"|"171"|"high_finish"|"short_leg", "value": number|null, "confidence": number|null } ],',
  '  "finalScore": { "home": number|null, "guest": number|null, "confidence": number|null },',
  '  "signatures": { "homePresent": boolean|null, "guestPresent": boolean|null },',
  '  "warnings": string[]',
  '}',
  'confidence ist 0..1. Fehlende/nicht lesbare Werte als null. games enthält alle 18 Begegnungen.',
].join('\n');

function buildPrompt(ctx: OcrMatchContext): string {
  const order = GAME_SCHEDULE.map(g =>
    g.type === 'double' ? `${g.no}: Doppel` : `${g.no}: Einzel H${g.homeSlot}–G${g.guestSlot}`,
  ).join(' · ');
  const home = ctx.homeRoster.length ? ctx.homeRoster.join(', ') : '(unbekannt)';
  const guest = ctx.guestRoster.length ? ctx.guestRoster.join(', ') : '(unbekannt)';
  return [
    'Du liest einen handschriftlich ausgefüllten, offiziellen MDU-Spielbericht (Dart, Münchner Dart Union) aus dem/den Bild(ern) aus.',
    'Gib NUR das wieder, was tatsächlich lesbar ist; erfinde nichts. Unsichere Werte mit niedriger confidence markieren, fehlende Werte als null.',
    '',
    'Feste Spielreihenfolge (18 Begegnungen, Doppel Nr. 9 in der Mitte und Nr. 18 am Ende):',
    order,
    '',
    `Die Liga ist auf dem Bogen ANGEKREUZT (Kästchen), nicht handschriftlich. Gib bei "league" exakt einen dieser Namen zurück (das angekreuzte Kästchen): ${LEAGUE_NAMES.join(', ')}. Achtung: "B" wird leicht als "8" fehlgelesen — es gibt keine Zahlen-Liga.`,
    'Aufstellung: H1–H4 / G1–G4 sind Stammspieler, H5–H8 / G5–G8 Ersatz. Positionen exakt als "H1".."H8" bzw. "G1".."G8".',
    'Für jeden Spieler die Pass-/Lizenznummer (passNo) so genau wie möglich auslesen — sie ist der eindeutige Schlüssel (z. B. "MDU 26 5707" oder nur die Ziffern). Namen können unvollständig sein; die Pass-Nr. hat Vorrang.',
    'Einzel-Leg-Ergebnisse sind i. d. R. 2:0/2:1/1:2/0:2 (in der La-Liga Best of 5: bis 3 Legs).',
    'Highlights: 180, 171, high_finish (Checkout ≥100), short_leg (Anzahl Darts). Liegen mehrere Bilder/Seiten vor, stehen die Highlights meist auf der zweiten Seite — werte sie von dort aus. Unterschriften: nur ob vorhanden (true/false) — KEINE biometrische Analyse.',
    'Ist das Dokument offensichtlich KEIN MDU-Spielbericht: documentType = "unknown".',
    '',
    'Bekannter Kontext der Begegnung (zur Plausibilisierung; nicht blind übernehmen):',
    `- Saison: ${ctx.season ?? '?'} · Liga: ${ctx.league ?? '?'} · Spieltag: ${ctx.matchday ?? '?'} · Datum: ${ctx.date ?? '?'}`,
    `- Heim: ${ctx.homeTeam ?? '?'} · Gast: ${ctx.guestTeam ?? '?'} · Spielstätte: ${ctx.venue ?? '?'}`,
    `- Heim-Kader: ${home}`,
    `- Gast-Kader: ${guest}`,
    '',
    JSON_SPEC,
  ].join('\n');
}

function toContentBlock(page: OcrInputPage): Anthropic.ContentBlockParam {
  if (page.mimeType === 'application/pdf') {
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: page.base64 } };
  }
  if (SUPPORTED_IMAGE.has(page.mimeType)) {
    return { type: 'image', source: { type: 'base64', media_type: page.mimeType as 'image/jpeg', data: page.base64 } };
  }
  throw new Error(`Nicht unterstütztes Format für OCR: ${page.mimeType} (bitte JPG, PNG oder PDF).`);
}

/** Extrahiert das erste JSON-Objekt aus der Modellantwort (toleriert Code-Fences). */
function extractJson(text: string): unknown | null {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(t.slice(start, end + 1)); } catch { return null; }
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

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 8000,
      messages: [{ role: 'user', content }],
    });

    const rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n') || null;

    let structured: MatchReportExtraction | null = null;
    if (rawText) {
      const parsed = extractJson(rawText);
      const safe = parsed ? MatchReportExtractionSchema.safeParse(parsed) : null;
      if (safe?.success) structured = safe.data;
    }

    return {
      rawText,
      structuredData: structured,
      fields: [],
      confidence: null,
      warnings: structured?.warnings ?? [],
      provider: this.name,
      modelVersion: response.model ?? this.model,
      providerRequestId: response._request_id ?? null,
    };
  }
}
