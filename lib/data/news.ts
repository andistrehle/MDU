// ============================================================
// MDU News — full articles (Homepage „Aktuelles")
// ============================================================
//
// Source: dartunion.de (öffentliche Startseiten-News).
// Inhalt sinngemäß übernommen, in lesbare Absätze gebracht,
// Aussagen unverändert. Struktur unterstützt mehrere News.
// ============================================================

export interface NewsArticle {
  /** Stable slug id */
  id: string;
  /** Short key fact shown on the card */
  title: string;
  /** One-line teaser */
  teaser: string;
  /** Where the news originates */
  source: string;
  /** Display date, e.g. "2026" or "21.05.2026" */
  date: string;
  /** Short category label, e.g. "MDU News" */
  category: string;
  /** Full text as readable paragraphs */
  content: string[];
}

export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'dimo-uebergibt-an-toni-bauer-2026',
    title: 'Dimo übergibt nach 19 Jahren an Toni Bauer',
    teaser:
      'Nach 19 Jahren verlässt Dimo aus gesundheitlichen Gründen die MDU-Leitung. Die MDU macht weiter – unter Toni Bauer.',
    source: 'dartunion.de',
    date: '2026',
    category: 'MDU News',
    content: [
      '2026 ist ein Jahr der Überraschungen.',
      'Aus gesundheitlichen Gründen wird Dimo die Münchner Dart Union verlassen.',
      'Er war Gründer, Präsident, Vorstand, Vorstandsvorsitzender und sportlicher Leiter der MDU – über die Jahre in praktisch jeder Rolle, die der Verein zu vergeben hatte.',
      'Nach 19 schönen, aufregenden, kämpferischen und erfolgreichen Jahren hört er nun auf.',
      'Die MDU macht weiter: Neuer Präsident und Nachfolger ist Toni Bauer.',
      'Dimo bedankt sich für all den Erfolg, das Vertrauen und die Freundschaften, die in dieser Zeit entstanden sind.',
      'Er wünscht allen viel Glück und vor allem Gesundheit.',
    ],
  },
];

/** Returns the most recent (first) news article, or undefined. */
export function getLatestNews(): NewsArticle | undefined {
  return NEWS_ARTICLES[0];
}

/** Returns a news article by id, or undefined. */
export function findNews(id: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find(n => n.id === id);
}
