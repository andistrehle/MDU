// ============================================================
// MDC — Ergebniszettel vom Foto lesen
// ============================================================
//
// Ein Turnierabend endet mit einer handgeschriebenen Liste: Platz, Name,
// manchmal die Passnummer. Hier wird sie gelesen — nicht ausgewertet. Was
// dieses Modul zurückgibt, ist ausdrücklich ein VORSCHLAG:
//
//   • Es rechnet keine Punkte. Die kommen aus dem Punkteschlüssel, sobald die
//     Feldgröße feststeht (`lib/mdc/points.ts`).
//   • Es ordnet keine Spieler zu. Das macht `lib/mdc/spieler-zuordnung.ts`
//     gegen den echten Stamm.
//   • Es geht nichts ungeprüft live. Die erkannte Liste wird angezeigt,
//     korrigiert und erst dann freigegeben.
//
// Handschrift ist Handschrift: „Micky" und „Nicky", „13" und „18" sehen sich
// ähnlich. Genau deshalb ist der Prüfschritt kein Beiwerk, sondern der Kern
// des Ablaufs — das Modell darf raten, die Seite darf es nicht.
// ============================================================

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { getUploadConfig } from './upload-config';

/** Bildformate, die Claude entgegennimmt. */
const SUPPORTED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const ErkanntZeileSchema = z.object({
  platz: z.number().int().min(1).max(64).nullable(),
  name: z.string().nullable(),
  passNr: z.number().int().min(1).max(9999).nullable(),
  confidence: z.number().min(0).max(1).nullable(),
});

const ErkanntSchema = z.object({
  istErgebnisliste: z.boolean(),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  spielort: z.string().nullable(),
  teilnehmerLautZettel: z.number().int().min(0).max(64).nullable(),
  zeilen: z.array(ErkanntZeileSchema),
  hinweise: z.array(z.string()),
});

export type ErkannteZeile = z.infer<typeof ErkanntZeileSchema>;
export type ErkannteListe = z.infer<typeof ErkanntSchema>;

const PROMPT = [
  'Du liest die handgeschriebene Ergebnisliste eines Dart-Turniers der Munich Darts Challenge (MDC) aus dem Bild aus.',
  'Auf dem Zettel steht je Zeile eine Platzierung und ein Spielername, manchmal zusätzlich eine Passnummer (ein- bis dreistellig).',
  '',
  'Regeln:',
  '- Gib NUR wieder, was tatsächlich lesbar ist. Erfinde nichts. Was du nicht entziffern kannst, ist null — nicht geraten.',
  '- Behalte die Reihenfolge des Zettels von oben nach unten bei. Sie entscheidet über die Platzierung.',
  '- Ab Platz 9 teilen sich im Doppel-K.-o. mehrere Spieler eine Platzierung (9.-12., 13.-16., 17.-24., 25.-32.). Auf dem Zettel steht die Gruppe dann oft nur einmal am Rand. Trage bei JEDEM Spieler dieser Gruppe dieselbe Zahl ein (also viermal die 9), und gib trotzdem jeden Spieler als eigene Zeile aus.',
  '- Namen so wiedergeben, wie sie dastehen — auch Spitznamen und Kurzformen („Micky", „Chriss"). Nichts vervollständigen, nichts eindeutschen, keine Reihenfolge von Vor- und Nachname ändern.',
  '- Eine Zahl neben dem Namen ist nur dann eine Passnummer, wenn sie erkennbar als solche geführt wird (eigene Spalte oder Beschriftung). Punktzahlen (dreistellig, 40 bis 226) sind KEINE Passnummern.',
  '- confidence je Zeile: 1 = klar lesbar, 0.5 = unsicher, 0.2 = kaum zu entziffern.',
  '- Steht die Teilnehmerzahl irgendwo auf dem Zettel, gib sie unter teilnehmerLautZettel an. Sonst null.',
  '- Ist das Bild offensichtlich keine Ergebnisliste (Speisekarte, Screenshot, leeres Blatt): istErgebnisliste = false und zeilen leer.',
  '- Alles, was dir auffällt (durchgestrichene Zeilen, doppelte Namen, unleserliche Stellen, nachträgliche Ergänzungen), gehört als kurzer deutscher Satz in hinweise.',
  '',
  'Gib AUSSCHLIESSLICH gültiges JSON zurück — kein Markdown, kein Text davor oder danach — nach genau diesem Schema:',
  '{',
  '  "istErgebnisliste": boolean,',
  '  "datum": "YYYY-MM-DD"|null,',
  '  "spielort": string|null,',
  '  "teilnehmerLautZettel": number|null,',
  '  "zeilen": [ { "platz": number|null, "name": string|null, "passNr": number|null, "confidence": number|null } ],',
  '  "hinweise": string[]',
  '}',
].join('\n');

/**
 * Erstes vollständiges JSON-Objekt aus der Modellantwort. Toleriert
 * Code-Fences und Zusatztext und zählt die Klammern korrekt mit — dasselbe
 * Vorgehen wie beim MDU-Spielbericht (`lib/ocr/providers/claude.ts`).
 */
function extractJson(text: string): unknown | null {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = t.indexOf('{');
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  try { return JSON.parse(end === -1 ? t.slice(start) : t.slice(start, end + 1)); } catch { return null; }
}

export class FotoNichtLesbarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FotoNichtLesbarError';
  }
}

/**
 * Liest ein Foto und gibt die erkannten Zeilen zurück.
 *
 * Wirft, statt ein leeres Ergebnis zurückzugeben, wenn etwas grundsätzlich
 * nicht stimmt (kein Schlüssel, unlesbares Format, Modellantwort ohne JSON).
 * Ein „hat leider nichts gefunden" wäre an dieser Stelle irreführend.
 */
export async function liesErgebniszettel(
  bild: { mimeType: string; base64: string },
): Promise<ErkannteListe> {
  const cfg = getUploadConfig();
  if (!cfg.apiKey) {
    throw new FotoNichtLesbarError(
      'Die Erkennung ist nicht eingerichtet (MDC_OCR_API_KEY fehlt).',
    );
  }
  if (!SUPPORTED.has(bild.mimeType)) {
    throw new FotoNichtLesbarError(
      `Dieses Bildformat geht nicht (${bild.mimeType}). Bitte JPG, PNG oder WebP.`,
    );
  }

  const client = new Anthropic({ apiKey: cfg.apiKey });
  const antwort = await client.messages.create({
    model: cfg.model,
    max_tokens: 4000,
    system: 'Antworte ausschließlich mit einem einzigen, gültigen JSON-Objekt nach dem vorgegebenen Schema. Kein Markdown, kein erklärender Text.',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: bild.mimeType as 'image/jpeg', data: bild.base64 },
        },
        { type: 'text', text: PROMPT },
      ],
    }],
  });

  const text = antwort.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  const geparst = text ? extractJson(text) : null;
  const geprueft = geparst ? ErkanntSchema.safeParse(geparst) : null;
  if (!geprueft?.success) {
    throw new FotoNichtLesbarError(
      'Die Antwort der Erkennung war nicht verwertbar. Bitte noch einmal versuchen — '
      + 'am besten mit einem geraden, gut ausgeleuchteten Foto des ganzen Zettels.',
    );
  }

  return geprueft.data;
}
