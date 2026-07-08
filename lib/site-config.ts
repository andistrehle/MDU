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

// ============================================================
// Social-Media-Kanäle der MDU
// ============================================================
// Nur gesetzte Links werden im Footer angezeigt (keine toten Attrappen).
// Instagram-URL eintragen, sobald der Account existiert.
export const SOCIAL_LINKS: { facebook: string | null; instagram: string | null } = {
  facebook: 'https://www.facebook.com/groups/492288164134290/',
  instagram: null,
};
