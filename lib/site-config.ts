// ============================================================
// Zentraler Go-live-Schalter der öffentlichen Seite
// ============================================================
//
// SITE_INDEXABLE = false  → Pre-Go-live:
//   • <meta name="robots" content="noindex, nofollow"> auf allen Seiten
//   • robots.txt: "Disallow: /" (Suchmaschinen sollen nichts crawlen/indexieren)
//   Die Seite bleibt technisch erreichbar (z. B. zum Testen), wird aber von
//   Google & Co. nicht aufgenommen.
//
// BEIM ECHTEN GO-LIVE: einfach auf `true` setzen, committen, deployen.
// (Dann greift wieder die normale robots.txt mit den erlaubten Bereichen.)
// ============================================================

export const SITE_INDEXABLE = false;
