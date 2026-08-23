// ============================================================
// Zahlungsdaten fürs Startgeld (zentral pflegen)
// ============================================================
//
// Keine Geheimnisse — nur die öffentliche Empfänger-Info für die
// Startgeld-Zahlung (PayPal an den Kassier/Vorstand). Bei Änderung nur hier
// anpassen; die „Per PayPal bezahlen"-Funktion im Team-Bereich zieht daraus.
// ============================================================

/** PayPal-Empfängeradresse (E-Mail), an die das Startgeld gezahlt wird. */
export const STARTGELD_PAYPAL_EMAIL = 'toba1906@arcor.de';

/** Anzeigename des Empfängers. */
export const STARTGELD_RECIPIENT = 'Anton Bauer (Toni)';

/**
 * Optionaler PayPal.me-Handle (nur der Name, ohne URL) — z. B. 'tonibauer'.
 * Ist er gesetzt, öffnet der Bezahl-Button PayPal direkt mit vorbelegtem
 * Betrag (One-Tap). Ist er leer, führt der Button zu paypal.com und der Kapitän
 * gibt Empfänger/Betrag aus den kopierbaren Feldern ein.
 */
export const STARTGELD_PAYPAL_ME = 'AntonBauer855';
