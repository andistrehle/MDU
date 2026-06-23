// ============================================================
// OCR — strukturiertes Ergebnis-Schema (Zod)
// ============================================================
//
// Klar definiertes Schema für das, was der Vision-Provider aus einem
// fotografierten MDU-Spielbericht extrahiert. Bewusst constraint-arm gehalten
// (keine min/max/length), damit es als Structured-Output-Schema beim Provider
// funktioniert. Fehlende Werte sind `null` — nichts wird erfunden.
//
// Kein 'server-only': Typen werden auch in der Review-UI gebraucht.
// ============================================================

import { z } from 'zod';

/** 0..1 — Konfidenz der Erkennung. */
const Confidence = z.number().nullable();

/** Erkannter Spieler einer Aufstellung. */
export const OcrPlayerSchema = z.object({
  /** Position auf dem Bogen: 'H1'..'H8' bzw. 'G1'..'G8'. */
  position: z.string(),
  detectedName: z.string().nullable(),
  passNo: z.string().nullable(),
  confidence: Confidence,
});
export type OcrPlayer = z.infer<typeof OcrPlayerSchema>;

/** Eine der 18 Begegnungen (16 Einzel + Doppel Nr. 9 und 18). */
export const OcrGameSchema = z.object({
  gameNo: z.number(),
  type: z.enum(['single', 'double']),
  /** Eingesetzte Heim-Positionen (Einzel: 1, Doppel: 2). */
  homePositions: z.array(z.string()),
  guestPositions: z.array(z.string()),
  legsHome: z.number().nullable(),
  legsGuest: z.number().nullable(),
  confidence: Confidence,
});
export type OcrGame = z.infer<typeof OcrGameSchema>;

/** Auswechslung (unsicher → zur Prüfung markieren). */
export const OcrSubstitutionSchema = z.object({
  side: z.enum(['home', 'guest']),
  position: z.string().nullable(),
  playerOut: z.string().nullable(),
  playerIn: z.string().nullable(),
  fromGameNo: z.number().nullable(),
  confidence: Confidence,
});
export type OcrSubstitution = z.infer<typeof OcrSubstitutionSchema>;

/** Highlight / Sonderleistung. */
export const OcrHighlightSchema = z.object({
  side: z.enum(['home', 'guest']),
  position: z.string().nullable(),
  type: z.enum(['180', '171', 'high_finish', 'short_leg']),
  value: z.number().nullable(),
  confidence: Confidence,
});
export type OcrHighlight = z.infer<typeof OcrHighlightSchema>;

export const OcrMatchHeaderSchema = z.object({
  season: z.string().nullable(),
  league: z.string().nullable(),
  matchday: z.number().nullable(),
  date: z.string().nullable(),
  venue: z.string().nullable(),
  homeTeam: z.string().nullable(),
  guestTeam: z.string().nullable(),
  captainHome: z.string().nullable(),
  captainGuest: z.string().nullable(),
});
export type OcrMatchHeader = z.infer<typeof OcrMatchHeaderSchema>;

/** Gesamtschema des erkannten Spielberichts. */
export const MatchReportExtractionSchema = z.object({
  documentType: z.enum(['mdu_match_report', 'unknown']),
  templateVersion: z.string().nullable(),
  match: OcrMatchHeaderSchema,
  homeLineup: z.array(OcrPlayerSchema),
  guestLineup: z.array(OcrPlayerSchema),
  games: z.array(OcrGameSchema),
  substitutions: z.array(OcrSubstitutionSchema),
  highlights: z.array(OcrHighlightSchema),
  finalScore: z.object({
    home: z.number().nullable(),
    guest: z.number().nullable(),
    confidence: Confidence,
  }),
  signatures: z.object({
    homePresent: z.boolean().nullable(),
    guestPresent: z.boolean().nullable(),
  }),
  /** Hinweise des Modells (z. B. „Bild unscharf", „Feld abgeschnitten"). */
  warnings: z.array(z.string()),
});
export type MatchReportExtraction = z.infer<typeof MatchReportExtractionSchema>;
