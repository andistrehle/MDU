// ============================================================
// Spieler-Kennung = Profil-Adresse /spieler/<kennung> (Betreiber, 18.11.2026)
// ============================================================
// Reine Logik fürs Umbenennen (Admin → Spieler, Migration 0071): neue Kennung aus dem
// neuen Namen, die angehängte Passnummer der alten Kennung bleibt erhalten
// („wolfgang-linprunner-2009“ → „wolfgang-limbrunner-2009“).
// ============================================================

/** Namensteil einer Kennung: klein, ohne Akzente, ß → ss, alles andere → Bindestrich (wie nominationPlayerSlug). */
export function namensSlug(name: string): string {
  return (name ?? '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Neue Kennung zum neuen Namen; eine Zahl am Ende der alten Kennung (Passnummer) wandert mit. */
export function neueKennung(alt: string, vorname: string, nachname: string): string {
  const basis = namensSlug(`${vorname} ${nachname}`) || 'spieler';
  const nummer = (alt ?? '').match(/-(\d{3,})$/)?.[1];
  return nummer ? `${basis}-${nummer}` : basis;
}

/** „Vorname(n) Nachname“ → getrennt: das letzte Wort ist der Nachname (wie bisher in Admin → Spieler). */
export function nameTeilen(voll: string): { vorname: string; nachname: string } {
  const teile = (voll ?? '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (teile.length <= 1) return { vorname: teile[0] ?? '', nachname: '' };
  return { vorname: teile.slice(0, -1).join(' '), nachname: teile[teile.length - 1] };
}

/** Wie viele Zeilen sind betroffen? (Antwort der Datenbank-Funktion, nur Tabellen mit Treffern.) */
export function betroffen(zahlen: Record<string, number>): { tabellen: number; zeilen: number } {
  const werte = Object.values(zahlen ?? {}).map(Number).filter(n => n > 0);
  return { tabellen: werte.length, zeilen: werte.reduce((a, b) => a + b, 0) };
}
