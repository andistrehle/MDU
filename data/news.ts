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

export const NEWS: NewsPost[] = [
  {
    "id": "die-neue-saison-laeuft-und-die-seite-ist-online",
    "date": "2026-09-08",
    "title": "Die neue Saison läuft — und die Seite ist online",
    "teaser": "Seit dem 31. August läuft die Saison 2026/27. Ab sofort stehen Rangliste, Turniere und Spielerprofile im Netz.",
    "category": "MDC",
    "paragraphs": [
      "Seit dem **31. August** läuft die Saison 2026/27. Die Wertung hat für alle wieder bei null angefangen. Die festen Turnierabende sind wie gewohnt von Montag bis Donnerstag in elf Lokalen in und um München, dazu kommen einzelne Termine am Wochenende.",
      "Neu ist, dass es das alles jetzt auch im Netz gibt: Unter **mdc-ranking.de** stehen die laufende Rangliste getrennt nach Herren und Damen, jedes einzelne Turnier mit der vollständigen Platzierungsliste, alle Spielorte mit ihrem Wochentag und eine eigene Seite für jeden Spieler mit sämtlichen Starts.",
      "Die Vorsaison ist ebenfalls da. Der Endstand der Saison 2025/26 mit allen 744 Turnieren und das Sommer-Ranking 2026 liegen im Archiv und bleiben dort unverändert stehen.",
      "Die Punkte rechnet die Seite selbst — aus Platzierung und Feldgröße, nach der Punktetabelle der Serie. Sie werden nirgends abgetippt. Ein Turnier steht online, sobald die Turnierleitung den Ergebniszettel eingetragen hat.",
      "Wenn dir etwas auffällt — ein falscher Platz, eine vertauschte Passnummer, ein fehlendes Turnier —, sag bitte Bescheid. Lieber einmal zu viel gemeldet als eine Zeile, die falsch stehen bleibt."
    ],
    "published": true
  },
  {
    "id": "vertretungsranking-fuers-fiaker",
    "date": "2026-09-08",
    "title": "!! VERTRETUNGSRANKING FÜRS FIAKER !!",
    "teaser": "DO. Ranking im 70ER",
    "category": "MDC",
    "paragraphs": [
      "**BITTE BACHTEN**   Do. 10.9. und Do. 17.9. findet das MDC Ranking nicht im Fiakerstüberl statt, sondern beim Donato im 70ER !!!"
    ],
    "published": true
  },
  {
    "id": "vertretungsranking-fuers-fiakerstueberl",
    "date": "2026-09-08",
    "title": "!!! VERTRETUNGSRANKING  FÜRS FIAKERSTÜBERL !!!",
    "teaser": "MDC Ranking Donnerstags im 70ER",
    "category": "MDC",
    "paragraphs": [
      "Bitte beachten !! Am Do. 10.9. und DO. 17.9. findet im FIAKER wg. Urlaub kein MDC Ranking statt. Vertretungsweise aber wieder jeweils  ab 19 Uhr im 70ER!!"
    ],
    "published": true
  }
];

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
