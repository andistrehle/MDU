// ============================================================
// Saison 2026/27 — feste Termine (Datum + Uhrzeit) je Begegnung
// ============================================================
// Quelle: Masterpläne der TC-Sitzung (11.10.2026). Bis sie eingetragen sind,
// ist diese Liste leer und überall steht das Spielwochenende (Fr–So) aus dem
// vorläufigen Plan.
//
// Schlüssel ist die Begegnung (Heim-ID|Gast-ID, siehe begegnungKey in
// saison-2027.ts) — in der Doppelrunde gibt es jede Paarung mit festem
// Heimrecht genau einmal. Ein Termin außerhalb des Plan-Wochenendes (z. B.
// in eine spielfreie Woche verlegt) ist erlaubt; der Spieltag bleibt derselbe.
// ============================================================

export interface Termin27 {
  /** YYYY-MM-DD */
  datum: string;
  /** HH:MM, fehlt = „Uhrzeit folgt" */
  uhrzeit?: string;
}

export const TERMINE_2027: Record<string, Termin27> = {};
