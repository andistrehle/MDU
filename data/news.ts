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
  /**
   * Tag der Veröffentlichung, `JJJJ-MM-TT`. Bestimmt die Reihenfolge:
   * NEUESTE ZUERST. Fallen zwei Beiträge auf denselben Tag, entscheidet die
   * Reihenfolge in der Datei — und dort steht der zuletzt geschriebene oben
   * (`lib/mdc/news-commit.ts` stellt ihn nach vorn). Früher wurde bei
   * Gleichstand alphabetisch nach Kennung sortiert; das hieß, dass von zwei
   * Beiträgen desselben Tages der mit dem früheren Anfangsbuchstaben oben
   * stand — mit „neuer" hatte das nichts zu tun.
   */
  date: string;
  title: string;
  /** Ein Satz für die Übersicht und die Startseite. */
  teaser: string;
  /**
   * Das Schlagwort — und zugleich der Reiter auf der Startseite. Gemeint sind
   * die drei aus `KATEGORIEN`; etwas anderes ist erlaubt (die Verwaltung lässt
   * freie Eingabe) und landet dann unter „Neuigkeiten".
   */
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
    "id": "termin-2026-11-10-ambasador-absage",
    "date": "2026-11-09",
    "title": "Kein Ranking am 10.11.2026 im Ambasador",
    "teaser": "Das Ranking am Dienstag, 10.11.2026 im Ambasador fällt aus: Veranstaltung im Lokal.",
    "category": "Termine",
    "paragraphs": [
      "Am **Dienstag, 10.11.2026** gibt es im **Ambasador** kein Ranking. Grund: Veranstaltung im Lokal. Der Termin steht durchgestrichen im Wochenplan. Danach läuft wieder alles wie gewohnt."
    ],
    "published": true
  },
  {
    "id": "wirte-koennen-jetzt-auch-absagen",
    "date": "2026-11-09",
    "title": "Wirte können ihr Ranking jetzt auch selbst absagen",
    "teaser": "Fällt ein Abend aus, trägt das Lokal es selbst ein — der Termin bleibt durchgestrichen mit dem Grund stehen.",
    "category": "Features",
    "paragraphs": [
      "Im **Wirte-Login** (Spielorte, ganz unten) gibt es jetzt neben „Ranking ansetzen“ auch **„Ranking absagen“**: Abend auswählen, kurz dazuschreiben warum, fertig. Der Termin verschwindet nicht, er bleibt durchgestrichen mit dem Grund stehen — damit keiner umsonst herfährt. Zurücknehmen geht genauso."
    ],
    "published": true
  },
  {
    "id": "wochenendranking-selbst-ansetzen",
    "date": "2026-10-17",
    "title": "Jetzt neu: Wochenendranking über die Homepage ansetzen",
    "teaser": "Die Wirte tragen ihr Ranking am Freitag, Samstag oder Sonntag ab sofort selbst auf der Seite ein — Zugang unter Spielorte, „Wirte-Login“.",
    "category": "Features",
    "paragraphs": [
      "Das Ranking am Wochenende ist kein fester Abend: Es wird von Lokal zu Lokal verabredet, oft kurzfristig. Bisher ging das nur über die Turnierleitung. **Ab sofort tragen die Wirte den Abend selbst ein** — und er steht sofort dort, wo die Spieler ihn suchen: auf der Startseite, im Wochenplan und beim eigenen Lokal.",
      "Den Zugang gibt es auf der Seite **Spielorte**, ganz unten: **Wirte-Login**. Antippen, Passwort eingeben, Lokal und Tag auswählen, Beginn eintragen — fertig. Ein kurzer Hinweis wie „Anmeldung bis 17:45“ kann dazu. Ein, zwei Minuten später steht der Termin online.",
      "**Das Passwort gibt es bei der Turnierleitung.** Es öffnet nur diese eine Seite: Ergebnisse, Passnummern und alles andere bleiben zu. Dauerhafte Änderungen am festen Spieltag laufen weiter über die Turnierleitung. **Nachtrag vom 9. November:** Absagen gehen inzwischen auch selbst — siehe den neueren Beitrag.",
      "Vertippt? Jeder selbst angesetzte Termin lässt sich an derselben Stelle wieder zurücknehmen."
    ],
    "published": true
  },
  {
    "id": "neues-ranking-in-der-aubinger-boazn",
    "date": "2026-10-07",
    "title": "Neues Ranking in der Aubinger Boazn",
    "teaser": "Ab dem 15. Oktober kommt ein zwölftes Lokal dazu: die Aubinger Boazn in der Bodenseestraße — donnerstags ab 20 Uhr.",
    "category": "Termine",
    "paragraphs": [
      "Ab **Donnerstag, 15. Oktober** gibt es ein MDC-Ranking in der **Aubinger Boazn**, Bodenseestraße 238 in München-Aubing. Damit sind es zwölf Lokale.",
      "Gespielt wird **donnerstags ab 20 Uhr**, freigemünzt wird ab 19 Uhr. Angemeldet wird wie überall vor Ort im Lokal — eine Liste führt die MDC nicht.",
      "Das Lokal bietet zusätzlich **sonntags ab 20 Uhr** an. Der Sonntag ist ohnehin einer der Tage, an denen in jedem MDC-Lokal ein Ranking laufen kann, sobald genug Leute da sind — im Wochenplan steht als fester Termin deshalb der Donnerstag.",
      "Wer noch keine MDC-Passnummer hat, bekommt sie beim ersten Start. Punkte gibt es ab der ersten Teilnahme, und das Turnier steht noch am selben Abend oder tags darauf in der Rangliste."
    ],
    "published": true
  },
  {
    "id": "die-neue-saison-laeuft-und-die-seite-ist-online",
    "date": "2026-09-08",
    "title": "Die neue Saison läuft — und die Seite ist online",
    "teaser": "Seit dem 31. August läuft die Saison 2026/27. Ab sofort stehen Rangliste, Turniere und Spielerprofile im Netz.",
    "category": "Neuigkeiten",
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
    "category": "Termine",
    "paragraphs": [
      "**BITTE BACHTEN**   Do. 10.9. und Do. 17.9. findet das MDC Ranking nicht im Fiakerstüberl statt, sondern beim Donato im 70ER !!!"
    ],
    "published": true
  }
];

/** Veröffentlichte Beiträge, neueste zuerst. */
export function publishedNews(): NewsPost[] {
  // `sort` ist in JavaScript stabil: Bei gleichem Datum bleibt die Reihenfolge
  // der Datei erhalten, und die ist neueste zuerst.
  return NEWS
    .filter(post => post.published)
    .sort((a, b) => b.date.localeCompare(a.date));
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

// ------------------------------------------------------------
// Die drei Reiter unter „Aktuelles" (Betreiber, 09.11.2026 — wie bei der MDU,
// nur mit zwei Beiträgen je Reiter statt drei).
// ------------------------------------------------------------

/**
 * Die Schlagwörter, die es geben soll. Die Verwaltung bietet sie zur Auswahl
 * an, erzwingt sie aber nicht: Ein Beitrag mit einem anderen Schlagwort
 * verschwindet nicht, er steht unter „Neuigkeiten".
 */
export const KATEGORIEN = ['Features', 'Neuigkeiten', 'Termine'] as const;
export type Reiter = 'features' | 'neuigkeiten' | 'termine';

// Termine zuerst (Betreiber, 09.11.2026) — siehe `newsReiter`.
const REITER: Reiter[] = ['termine', 'features', 'neuigkeiten'];
const REITER_NAME: Record<Reiter, string> = {
  features: 'Features', neuigkeiten: 'Neuigkeiten', termine: 'Termine',
};

/** Welcher Reiter? Alles Unbekannte ist eine Neuigkeit. */
export function reiterVon(post: NewsPost): Reiter {
  if (post.category === 'Features') return 'features';
  if (post.category === 'Termine') return 'termine';
  return 'neuigkeiten';
}

export interface NewsReiter {
  code: Reiter;
  name: string;
  beitraege: NewsPost[];
}

/**
 * Die Reiter für die Startseite: je höchstens `proReiter` Beiträge, in jedem
 * Reiter der neueste oben. Leere Reiter fallen weg — ein Reiter, hinter dem
 * nichts steht, wäre eine leere Zusage.
 *
 * TERMINE STEHT IMMER VORN (Betreiber, 09.11.2026). Es ist das, wofür die
 * Leute die Seite aufmachen: Wo wird heute gespielt, und fällt etwas aus.
 * Features und Neuigkeiten dahinter nach Aktualität — der Reiter mit der
 * neueren Meldung zuerst.
 */
export function newsReiter(proReiter = 2): NewsReiter[] {
  const alle = publishedNews();
  return REITER
    .map(code => ({
      code,
      name: REITER_NAME[code],
      beitraege: alle.filter(p => reiterVon(p) === code).slice(0, proReiter),
    }))
    .filter(r => r.beitraege.length > 0)
    .sort((a, b) => {
      if (a.code === 'termine') return -1;
      if (b.code === 'termine') return 1;
      // Dahinter entscheidet der neueste Beitrag des Reiters.
      return b.beitraege[0].date.localeCompare(a.beitraege[0].date);
    });
}
