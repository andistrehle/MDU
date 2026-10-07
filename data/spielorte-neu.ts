// ============================================================
// MDC — Lokale, die auf der Seite angelegt wurden
// ============================================================
//
// GESCHRIEBEN VON DER SEITE SELBST. Unter `/admin/spielorte` legt die
// Turnierleitung ein neues Lokal an, von dort wird diese Datei als Commit
// abgelegt (`lib/mdc/spielort-commit.ts`) — genau wie News, Kalender und
// Ergebnisse. Von Hand bearbeiten ist erlaubt; nur die Form muss stimmen,
// weil die Verwaltung sie wieder einliest.
//
// WARUM NICHT EINFACH IN `data/venues.ts`? Dort steht die Spielorte-Übersicht
// des Betreibers: von Hand gepflegt, kommentiert, nach Wochentagen gruppiert.
// Ein Programm, das diese Datei neu erzeugt, risse all das heraus. Hier liegt
// deshalb nur, was dazugekommen ist; `VENUES` setzt beides zusammen.
//
// Ein Lokal von hier verhält sich sonst wie jedes andere: eigene Seite, eigener
// Wochentag im Plan, auswählbar beim Ergebnis-Upload und im Kalender.
//
// GEÄNDERT WIRD ES DIREKT HIER, nicht über `data/spielorte-aenderungen.ts`:
// Diese Datei gehört der Seite, es gibt keine ältere Fassung, über die sich
// eine Berichtigung legen müsste. Zwei Einträge für dasselbe Lokal wären nur
// eine Frage mehr, die beim Lesen niemand beantworten kann.
// ============================================================

import type { Venue } from './types';

export const NEUE_SPIELORTE: Venue[] = [];
