// ============================================================
// MDC — Spieler, die beim Hochladen neu dazugekommen sind
// ============================================================
//
// GESCHRIEBEN VON DER SEITE SELBST, genau wie `results-uploaded.ts`.
//
// Der Spielerstamm entsteht sonst ausschließlich aus den Wertungen der
// Arbeitsmappe: Wer in einer Rangliste steht, ist im Stamm. Beim Hochladen
// eines Ergebniszettels kann aber jemand auftauchen, der noch in keiner
// Wertung steht — der Neuling, der an diesem Abend zum ersten Mal mitgespielt
// hat. Ohne einen Platz für ihn müsste die Freigabe abgelehnt werden.
//
// Deshalb diese Datei. Sie enthält NUR, was auf dem Zettel steht:
// Passnummer, Name und die Wertungsklasse. Kein Geburtsdatum, keine Anschrift,
// kein Foto — was die Ergebnisliste nicht hergibt, wird auch hier nicht
// erfunden.
//
// Format wie eine Ranglistenzeile (`data/parse-ranking.ts`), damit Spieler-ID
// und Spitzname genau so entstehen wie bei allen anderen:
//
//   'Platz|Passnr.|NACHNAME|VORNAME|Anzahl TN|Punkte|%|Trend'
//
// Platz, Anzahl TN und Punkte stehen auf 0 — sie ergeben sich aus den
// Turnieren, nicht aus dieser Datei. Ein Spitzname darf wie üblich in
// Klammern hinter dem Vornamen stehen: 'CHRISS (BONSAI)'.
//
// Sobald die Person in der Arbeitsmappe auftaucht, gewinnt deren Schreibweise
// (siehe `data/players.ts`) — die Zeile hier darf dann stehen bleiben.
// ============================================================

/** Neue Spieler der Herrenwertung, aus hochgeladenen Ergebniszetteln. */
export const PLAYERS_UPLOADED_MEN_RAW: string[] = [];

/** Neue Spielerinnen der Damenwertung, aus hochgeladenen Ergebniszetteln. */
export const PLAYERS_UPLOADED_WOMEN_RAW: string[] = [];
