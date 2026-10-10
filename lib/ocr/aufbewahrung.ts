// ============================================================
// Spielbericht-Fotos aufbewahren — Schalter (Browser + Server)
// ============================================================
//
// false (bisher): Die Original-Fotos werden gelöscht, sobald der Bericht
//   bestätigt ist — so steht es in den Datenschutzhinweisen (Ziffer 7, 8, 13).
// true (vom Betreiber am 10.10.2026 gewünscht): Fotos bleiben bis zum
//   Saisonende, sichtbar für die Kapitäne der beiden Teams und die
//   Ligaleitung; am Saisonende löscht die Ligaleitung sie gesammelt
//   (Admin → Spielberichte → „Fotos der Saison löschen").
//
// NUR ZUSAMMEN MIT DEM GEÄNDERTEN DATENSCHUTZTEXT UMSTELLEN — sonst
// widerspricht die Seite ihren eigenen Hinweisen.
// ============================================================

// Eingeschaltet am 10.10.2026 zusammen mit Datenschutz Ziffer 7/8/13 und
// Nutzungsbedingungen Ziffer 4 (vom Betreiber freigegeben).
export const FOTOS_AUFBEWAHREN = true;
