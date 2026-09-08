// ============================================================
// MDC — News
// ============================================================
//
// GESCHRIEBEN VON DER SEITE SELBST. Beiträge entstehen in der
// Turnierverwaltung unter `/admin/news` und werden von dort als Commit
// abgelegt (`lib/mdc/news-commit.ts`) — genau wie die hochgeladenen
// Ergebnisse. Von Hand bearbeiten ist erlaubt, es ist eine gewöhnliche Datei;
// nur die Form muss stimmen, weil die Verwaltung sie wieder einliest.
//
// Warum kein CMS und keine Datenbank: Ein paar Beiträge im Jahr rechtfertigen
// keinen zweiten Dienst mit eigener Anmeldung, eigener Sicherung und eigenem
// Vertrag zur Auftragsverarbeitung. Im Repository liegt der Text neben allem
// anderen, ist versioniert und lässt sich zurückholen.
//
// Der Text kennt genau eine Auszeichnung: **fett**. Mehr braucht eine
// Vereinsnachricht nicht, und alles Weitere wäre eine halbe Textverarbeitung,
// die niemand pflegt.
// ============================================================

export interface NewsPost {
  /** Sprechende Kennung aus dem Titel — steht in der Adresse. */
  id: string;
  /** Tag der Veröffentlichung, `JJJJ-MM-TT`. Bestimmt die Reihenfolge. */
  date: string;
  title: string;
  /** Ein Satz für die Übersicht und die Startseite. */
  teaser: string;
  /** Kurzes Schlagwort, z. B. „Ranking" oder „Termine". */
  category: string;
  /** Absätze des Fließtexts. Leere Zeile im Editor = neuer Absatz. */
  paragraphs: string[];
  /**
   * Entwürfe stehen in der Datei, aber nicht auf der Seite. So kann ein
   * Beitrag vorbereitet und später sichtbar gemacht werden, ohne dass er
   * zwischendurch irgendwo auftaucht.
   */
  published: boolean;
}

export const NEWS: NewsPost[] = [];

/** Veröffentlichte Beiträge, neueste zuerst. */
export function publishedNews(): NewsPost[] {
  return NEWS
    .filter(post => post.published)
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

/** Die neuesten `anzahl` Beiträge — für die Startseite. */
export function latestNews(anzahl: number): NewsPost[] {
  return publishedNews().slice(0, anzahl);
}

/** Ein Beitrag über seine Kennung. Entwürfe bleiben hier absichtlich außen vor. */
export function getNewsPost(id: string): NewsPost | undefined {
  return publishedNews().find(post => post.id === id);
}

/** Gibt es überhaupt schon etwas? Die Seiten schalten sich danach. */
export const HAS_NEWS = NEWS.some(post => post.published);
