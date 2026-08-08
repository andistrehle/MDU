// ============================================================
// MDC — Namen aufbereiten
// ============================================================
//
// Die offizielle MDC-Auswertung führt Namen in Großbuchstaben. Für die
// Webseite werden sie in normale Schreibweise gebracht — mit ein paar
// Sonderfällen, die sonst falsch aussähen:
//
//  • Lokalnamen als Nachname („70ER" → „70er", „5STERNE" → „5Sterne"). Die MDC
//    führt Spieler ohne bekannten Nachnamen unter ihrem Stammlokal.
//  • Kürzel bleiben, wie sie sind („RG", „LB", „CB5", „X").
// ============================================================

/** Schreibweisen, die die reine Groß-/Kleinschreibung nicht richtig hinbekommt. */
const SPECIAL_CASE: Record<string, string> = {
  '70ER': '70er',
  '5STERNE': '5Sterne',
  SSTERNE: '5Sterne',
  RG: 'RG',
  LB: 'LB',
  CB5: 'CB5',
  X: 'X',
  A: 'A',
  F: 'F',
};

/** „MÜLLER-ROTONDO" → „Müller-Rotondo", „LISA/STEPHY" → „Lisa/Stephy" */
export function titleCase(value: string): string {
  return value
    .split(' ')
    .map(token => {
      const special = SPECIAL_CASE[token.toUpperCase()];
      if (special) return special;
      return token.replace(/[\p{L}\p{N}]+/gu, run =>
        run.charAt(0).toUpperCase() + run.slice(1).toLowerCase(),
      );
    })
    .join(' ');
}

/** URL-tauglicher Slug: „Müller-Rotondo" → „mueller-rotondo" */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Lokalnamen, unter denen die MDC Spieler ohne bekannten Nachnamen führt →
 * ID des Spielorts. Nur eindeutige Zuordnungen; alles andere bleibt offen.
 */
const VENUE_SURNAMES: Record<string, string> = {
  LEGENDARY: 'legendary',
  HARLEKIN: 'harlekin',
  TONYS: 'tonys-wirtshaus',
  RG: 'rg-bar',
  '5STERNE': 'fuenf-sterne-boazn',
  SSTERNE: 'fuenf-sterne-boazn',
  WÜRMTAL: 'djk-wuermtal',
  MACHETE: 'machete-1',
  '70ER': 'siebziger',
  FIAKER: 'fiakerstueberl',
  LB: 'lustiger-bauer',
};

/** Stammlokal aus dem Nachnamen ableiten — oder `null`, wenn unbekannt. */
export function venueFromSurname(lastName: string): string | null {
  return VENUE_SURNAMES[lastName.toUpperCase()] ?? null;
}
