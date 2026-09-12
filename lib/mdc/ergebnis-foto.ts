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
  /**
   * Die Punktzahl aus der Spalte „PKT" — NICHT um sie zu übernehmen (die
   * rechnet der Schlüssel), sondern als Gegenprobe: Sie verrät die Feldgröße,
   * die der Auswerter im Kopf hatte. Weichen die Punkte ab, stimmt die Zahl
   * der Zeilen nicht.
   */
  punkte: z.number().int().min(0).max(300).nullable(),
  /**
   * Kreuz in der Spalte „neu" — die Turnierleitung erklärt damit auf dem
   * Zettel selbst, dass diese Person noch keine Passnummer hat. Das ist keine
   * Vermutung, die die Seite anstellen müsste, sondern eine Angabe: Zusammen
   * mit der leeren Spalte PASSNR ist die Zeile eindeutig ein Neuling und wird
   * gar nicht erst gegen den Spielerstamm geraten.
   */
  neu: z.boolean().nullable(),
  /**
   * Kreuz in der Spalte M oder F. Zählt nur für Neulinge — bei allen anderen
   * sagt der Stamm, in welcher Wertung sie stehen. Ohne diese Angabe landete
   * jede neu angelegte Spielerin in der Herrenwertung.
   */
  weiblich: z.boolean().nullable(),
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

/**
 * Die Anweisung ans Modell. Das heutige Datum steht mit drin, weil sonst die
 * JAHRESZAHL rät: Handschriftlich sehen 2026 und 2016 sich zum Verwechseln
 * ähnlich, und ein verlesenes Jahr fällt erst ganz am Ende auf — bei der
 * Freigabe, wenn das Datum in keiner Saison liegt.
 */
function prompt(heute: string): string {
  return [
  'Du liest die handgeschriebene Ergebnisliste eines Dart-Turniers der Munich Darts Challenge (MDC) aus dem Bild aus.',
  'Auf dem Zettel steht je Zeile eine Platzierung und ein Spielername, manchmal zusätzlich eine Passnummer (ein- bis dreistellig).',
  '',
  'Der Zettel ist ein VORGEDRUCKTES Formular: Die Spalte PLATZ ist fertig bedruckt (1, 2, 3, … und die 9 mehrfach), unabhängig davon, wie viele Leute mitgespielt haben. Handschriftlich sind nur Passnummer, Punkte und Name.',
  '',
  'Regeln:',
  '- ENTSCHEIDEND: Gib NUR Zeilen aus, in denen tatsächlich etwas HANDSCHRIFTLICHES steht — ein Name oder eine Passnummer. Eine vorgedruckte Zeile, die leer geblieben ist, ist KEIN Teilnehmer. Ebenso wenig eine durchgestrichene oder ausgestrichene Zeile. Solche Zeilen gehören NICHT in "zeilen"; erwähne sie höchstens in "hinweise".',
  '- Im Zweifel weglassen: Eine zu viel ausgegebene Zeile verfälscht die Punkte ALLER Teilnehmer, weil der Punkteschlüssel an der Feldgröße hängt.',
  '- Ist der untere Teil des Zettels abgeschnitten oder unlesbar, gib die betroffenen Zeilen NICHT aus und schreib es in "hinweise".',
  '- Gib NUR wieder, was tatsächlich lesbar ist. Erfinde nichts. Was du nicht entziffern kannst, ist null — nicht geraten.',
  '- Behalte die Reihenfolge des Zettels von oben nach unten bei. Sie entscheidet über die Platzierung.',
  '- Ab Platz 9 teilen sich im Doppel-K.-o. mehrere Spieler eine Platzierung (9.-12., 13.-16., 17.-24., 25.-32.). Auf dem Zettel steht die Gruppe dann oft nur einmal am Rand. Trage bei JEDEM Spieler dieser Gruppe dieselbe Zahl ein (also viermal die 9), und gib trotzdem jeden Spieler als eigene Zeile aus.',
  '- Namen so wiedergeben, wie sie dastehen — auch Spitznamen und Kurzformen („Micky", „Chriss"). Nichts vervollständigen, nichts eindeutschen, keine Reihenfolge von Vor- und Nachname ändern.',
  '- Die Spalten heißen üblicherweise PLATZ · M · F · neu · PASSNR · PKT · VORNAME/NAME. Aus PASSNR kommt passNr, aus PKT kommt punkte. Verwechsle die beiden nicht: PKT liegt zwischen 40 und 226 und fällt von Zeile zu Zeile.',
  '- Spalte "neu": Ein Kreuz dort heißt, dass der Spieler noch keine Passnummer hat und neu aufgenommen wird. Dann steht in PASSNR üblicherweise nichts oder ein Strich („–"). Gib neu = true zurück, wenn in dieser Spalte ein Kreuz oder Haken steht, sonst false. Ein Strich in PASSNR ist KEINE Zahl: passNr bleibt dann null.',
  '- Spalten M und F: Kreuz bei M = männlich, Kreuz bei F = weiblich. Gib weiblich = true zurück, wenn das Kreuz in der Spalte F steht, false bei M, null wenn keins von beiden erkennbar ist. Achte auf die waagerechte Lage des Kreuzes — M und F stehen dicht nebeneinander.',
  '- punkte NICHT ausrechnen und NICHT korrigieren — gib nur wieder, was in der Spalte PKT steht, sonst null. Diese Zahlen dienen als Gegenprobe.',
  '- confidence je Zeile: 1 = klar lesbar, 0.5 = unsicher, 0.2 = kaum zu entziffern.',
  '- Steht die Teilnehmerzahl irgendwo auf dem Zettel, gib sie unter teilnehmerLautZettel an. Sonst null.',
  `- Das Datum: Heute ist der ${heute}. Ein Ergebniszettel wird am Turnierabend ausgefüllt und kurz darauf hochgeladen, ist also so gut wie nie älter als ein paar Wochen. Handschriftlich sehen sich Ziffern ähnlich (eine 2 kann wie eine 1 aussehen) — prüfe die Jahreszahl deshalb gegen das heutige Datum. Ein Jahr, das mehrere Jahre zurückliegt, ist mit hoher Wahrscheinlichkeit verlesen. Bist du dir bei der Jahreszahl nicht sicher, gib das ganze Datum als null zurück und schreib es in "hinweise" — ein falsches Datum ist schlimmer als gar keins.`,
  '- Ist das Bild offensichtlich keine Ergebnisliste (Speisekarte, Screenshot, leeres Blatt): istErgebnisliste = false und zeilen leer.',
  '- Alles, was dir auffällt (durchgestrichene Zeilen, doppelte Namen, unleserliche Stellen, nachträgliche Ergänzungen), gehört als kurzer deutscher Satz in hinweise.',
  '',
  'Gib AUSSCHLIESSLICH gültiges JSON zurück — kein Markdown, kein Text davor oder danach — nach genau diesem Schema:',
  '{',
  '  "istErgebnisliste": boolean,',
  '  "datum": "YYYY-MM-DD"|null,',
  '  "spielort": string|null,',
  '  "teilnehmerLautZettel": number|null,',
  '  "zeilen": [ { "platz": number|null, "name": string|null, "passNr": number|null, "punkte": number|null, "neu": boolean|null, "weiblich": boolean|null, "confidence": number|null } ],',
  '  "hinweise": string[]',
  '}',
  ].join('\n');
}

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
  /** Heutiges Datum als `JJJJ-MM-TT` — Maßstab für die Jahreszahl. */
  heute: string,
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
        { type: 'text', text: prompt(heute) },
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
