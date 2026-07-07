// ============================================================
// Zentrale Konfiguration für „Ask Andreas AI"
// ============================================================
// Ein Ort für alle Stellschrauben: Modell, Limits, Vorschlags-Chips,
// Kontaktadresse. Wer die Vorschlags-Chips ändern will, editiert nur
// SUGGESTION_CHIPS unten (siehe README).

/** Anthropic-Modell — schnell und günstig, passend für einen Chat-Assistenten. */
export const MODEL = "claude-haiku-4-5-20251001";

/** Maximale Antwortlänge pro Bot-Nachricht. */
export const MAX_TOKENS = 1024;

/** Client + Server: max. Zeichen pro Nutzer-Nachricht. */
export const MAX_INPUT_CHARS = 1000;

/** Client: max. Nutzer-Nachrichten pro Session, danach freundlicher Hinweis. */
export const MAX_MESSAGES_PER_SESSION = 20;

/** Client + Server: nur die letzten N Turns (Nachrichten) an die API senden. */
export const MAX_HISTORY_TURNS = 12;

/** Server-seitiges Abuse-Limit pro IP (großzügig, blockiert echte Recruiter nicht). */
export const RATE_LIMIT_MAX_REQUESTS = 60;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 Minuten

/**
 * Kontaktadresse von Andreas (Footer + Fallback-Hinweise).
 * PLATZHALTER — vor Go-live durch echte Adresse ersetzen.
 */
export const CONTACT_EMAIL = "andreas.strehle@example.com";

/** Hartkodierte Begrüßung (kein API-Call). */
export const GREETING =
  "Hallo! Ich bin der KI-Assistent zur Bewerbung von Andreas Strehle. " +
  "Frag mich gern etwas über seinen beruflichen Werdegang, seine Erfahrung mit " +
  "KI und Digitalisierung oder warum er sich für diese Rolle bewirbt.";

/**
 * Vorschlags-Chips unter der Begrüßung. Antippbar, senden die Frage direkt ab.
 * Zum Ändern: einfach diese Liste anpassen.
 */
export const SUGGESTION_CHIPS: string[] = [
  "Warum FC Bayern?",
  "Was bringt Andreas für die Rolle mit?",
  "Welche KI-Erfahrung hat er?",
  "Was sind seine Schwächen?",
];

/** Freundliche, generische Fehlermeldung (nie technische Details an den Client). */
export const FRIENDLY_ERROR =
  "Da ist etwas schiefgelaufen – bitte versuch es gleich nochmal.";

/** Hinweis, wenn das Session-Limit erreicht ist. */
export const RATE_LIMIT_NOTICE =
  "Du hast das Nachrichtenlimit für diese Session erreicht. Für ein " +
  "ausführliches Gespräch wende dich gern direkt an Andreas.";
