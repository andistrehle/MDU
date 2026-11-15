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

// ── Überschrift für Facebook hervorheben (Betreiber 15.11.2026) ──
// Facebook kennt in normalen Beiträgen kein Fett. Üblicher Weg: die fetten Buchstaben aus dem Unicode-Block
// „Mathematical Sans-Serif Bold“. Umlaute gibt es dort nicht — sie werden aus fettem Grundbuchstaben + Trema
// (U+0308) gebaut; „ß“ und Satzzeichen bleiben normal. Emojis und alles andere bleiben unverändert.
const FETT_GROSS = 0x1d5d4, FETT_KLEIN = 0x1d5ee, FETT_ZIFFER = 0x1d7ec;
const UMLAUT: Record<string, string> = { 'ä': 'a', 'ö': 'o', 'ü': 'u', 'Ä': 'A', 'Ö': 'O', 'Ü': 'U' };

export function fettSchrift(text: string): string {
  let out = '';
  for (const z of text) {
    const basis = UMLAUT[z] ?? z;
    const c = basis.codePointAt(0)!;
    const fett = c >= 65 && c <= 90 ? String.fromCodePoint(FETT_GROSS + c - 65)
      : c >= 97 && c <= 122 ? String.fromCodePoint(FETT_KLEIN + c - 97)
      : c >= 48 && c <= 57 ? String.fromCodePoint(FETT_ZIFFER + c - 48) : null;
    out += fett ? fett + (UMLAUT[z] ? '\u0308' : '') : z;
  }
  return out;
}

/** Kopf eines Facebook-Beitrags: Überschrift fett zwischen zwei Dartscheiben, darunter eine Leerzeile. */
export const facebookKopf = (titel: string) => `🎯 ${fettSchrift(titel.trim())} 🎯`;
