// ============================================================
// MDC — Grenzen des Ergebnis-Uploads
// ============================================================
//
// Steht bewusst in einer eigenen Datei: Die Zahl wird vom Browser gebraucht
// (die Auswahl nimmt nicht mehr Fotos an) UND von der Server-Aktion (sie
// verlässt sich nicht darauf, dass der Browser sich daran gehalten hat). Die
// Aktionsdatei kann sie nicht liefern — eine `'use server'`-Datei darf nichts
// ausführen, was keine Funktion ist —, und `ergebnis-commit.ts` ist
// `server-only`.
// ============================================================

/**
 * So viele Zettel gehen in einem Stapel.
 *
 * Nicht willkürlich: Jeder Zettel ist ein eigener Aufruf der Bilderkennung,
 * und die dauert je ein paar Sekunden. Zwölf decken den größten bisher
 * dagewesenen Abend (fünf Turniere am 13.09.2026) mit Luft nach oben ab; alles
 * darüber wäre eine Wartezeit, bei der im Lokal niemand mehr zuschaut.
 */
export const MAX_ZETTEL = 12;
