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
// Coming-Soon- / Wartungsmodus
// ============================================================
//
// COMING_SOON = true  → JEDER Seitenaufruf wird in der Middleware (proxy.ts)
//   auf die Holding-Seite `/coming-soon` umgeschrieben („Neue MDU-Plattform –
//   Coming soon"). Die eigentliche Seite bleibt im Code vorhanden, ist nach
//   außen aber nicht mehr erreichbar.
//
// Wieder „aufmachen": einfach auf `false` setzen, committen, deployen.
//
// VORSCHAU (damit man sich nicht selbst aussperrt): Die echte Seite lässt sich
// trotz Coming-Soon ansehen, indem man einmal `…?vorschau=<PREVIEW_KEY>` aufruft
// (setzt ein Cookie für ~30 Tage). Mit `?vorschau=aus` wird die Vorschau wieder
// beendet. Der Key ist kein echtes Geheimnis (Seite ist ohnehin noindex), nur
// ein einfacher Riegel gegen zufällige Besucher.
export const COMING_SOON = true;
export const PREVIEW_KEY = 'mdu-intern';

// ============================================================
// Social-Media-Kanäle der MDU
// ============================================================
// Nur gesetzte Links werden im Footer angezeigt (keine toten Attrappen).
// Instagram-URL eintragen, sobald der Account existiert.
export const SOCIAL_LINKS: { facebook: string | null; instagram: string | null } = {
  facebook: 'https://www.facebook.com/groups/492288164134290/',
  instagram: 'https://www.instagram.com/muenchnerdartunion/',
};
