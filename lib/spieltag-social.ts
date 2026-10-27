// ============================================================
// Spieltagsbericht → Social Media (Facebook, Instagram-Reel, Story)
// ============================================================
// Datenform, die der Server beim Erzeugen ablegt (spieltag_berichte.social,
// Migration 0060) und die Admin → News im Browser zu Story-Bildern und einem
// Reel zeichnet (components/mdu/spieltag-social.tsx). Nur Gerechnetes, keine
// internen Punkte.
// ============================================================

export interface SocialErgebnis { heim: string; gast: string; erg: string; bestaetigt: boolean }
export interface SocialLiga { name: string; farbe: string; spieltag: string; ergebnisse: SocialErgebnis[] }
export interface SocialSpieler { name: string; team: string; text: string }

export interface SocialDaten {
  newsId: string;
  /** „23.–25.10.2026“ */
  wochenende: string;
  titel: string;
  ligen: SocialLiga[];
  sieger: SocialSpieler[];
  meiste: SocialSpieler[];
  finish: { wert: number; spieler: string[] } | null;
  fuehrer: { liga: string; farbe: string; teams: string[]; punkte: number }[];
}

export const SITE_MDU = 'https://www.mdudarts.de';
export const berichtLink = (newsId: string) => `${SITE_MDU}/news#${newsId}`;
