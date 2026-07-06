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
    id: 'saison-2025-2026-abgeschlossen',
    title: 'Saison 2025/2026 ist beendet – alle Entscheidungen im Überblick 🏁',
    teaser:
      'Alle Spiele sind absolviert, alle Tabellen final. Wer aufsteigt, wer bleibt und wer runtermuss – die komplette Übersicht.',
    source: 'Münchner Dart Union',
    date: '06.07.2026',
    category: 'MDU News',
    content: [
      'Die Saison 2025/2026 der Münchner Dart Union ist **offiziell abgeschlossen**. Alle Begegnungen sind gespielt, die Tabellen und Einzelranglisten sind final. Ein großes Dankeschön an alle Mannschaften, Kapitäne und Spielstätten für eine tolle Saison!',
      '**🏆 La Liga:** Meister werden die **Spartans** – Glückwunsch zu einer überragenden Saison! Ebenfalls in der La Liga bleiben **Jolly Pirates KT\'s**, **Ohne Jackie** und **No Ma\'am**. Den Gang in die A-Liga antreten müssen **DC Null Bull** und **Les Dartagnons**.',
      '**⬆️ Aufstieg in die La Liga:** Über die Aufstiegs-Playoffs der A-Liga setzen sich **Silberpfeile II**, **Alptraum** und **Gambas** durch – willkommen im Oberhaus! **Treff Nix Freimann**, **DC Animals II** und **Jolly Pirates V** bleiben in der A-Liga.',
      '**A-Liga Abstiegs-Playoffs:** **Spartans VI** und **Oldies & Co** sichern den Klassenerhalt in der A-Liga. **Sound Warrior\'s** und **Game Over** steigen in die B-Liga ab.',
      '**⬆️ Aufstieg in die A-Liga:** In den Aufstiegs-Playoffs der B-Liga schaffen es **Fiaker Deife**, **Belfort Evolution** und die **Freibad Bazis** nach oben. **Flying Seven**, **Master of Desaster** und **Flying Fighters** bleiben in der B-Liga.',
      '**B-Liga Abstiegs-Playoffs:** **De Vogelwuid\'n**, **Lucky Darts One** und **Team Desaster** halten die Klasse. **De Hutzeldarter**, **Massl Ghabt** und **DC Dark Angels** geht es in die C-Liga hinunter.',
      '**🏆 C-Liga:** Meister werden die **Wild Indians** – und steigen gemeinsam mit **Lucky Darts Two** und **München 08/15** direkt in die B-Liga auf. **Funny Darters Munich**, **Black Devils** und das **5 Sterne Boazn Team** treten auch nächste Saison in der C-Liga an.',
      'Alle finalen Tabellen, Ergebnisse und Einzelranglisten findet ihr wie immer unter **Ligen**. Die Anmeldung zur **Saison 2026/2027** läuft bereits – Teamkapitäne können ihre Mannschaft direkt hier auf der Plattform anmelden. Wir sehen uns am Board! 🎯',
    ],
  },
  {
    id: 'sensation-perfekt-freibad-bazis-steigen-in-die-a-liga-auf',
    title: 'Sensation perfekt: Freibad Bazis steigen in die A-Liga auf! 🎯',
    teaser:
      'Dank Schützenhilfe von Master of Desaster ist der Aufstieg perfekt – nach zehn Jahren geht es für die Freibad Bazis hoch in die A-Liga.',
    source: 'Münchner Dart Union',
    date: '21.06.2026',
    category: 'MDU News',
    content: [
      'Was nach dem dramatischen 9:9 am vergangenen Spieltag kaum noch jemand für möglich gehalten hätte, ist tatsächlich eingetreten: **Die Freibad Bazis steigen in die A-Liga der Münchner Dart Union auf!**',
      'Nach dem verpassten Sieg und zwei Punkten Rückstand waren die Bazis auf Schützenhilfe angewiesen. Diese kam von **Master of Desaster**, die mit ihrem Ergebnis den entscheidenden Beitrag zum Aufstieg leisteten.',
      'Nach **zehn Jahren** harter Arbeit, unzähligen Ligaabenden und einer starken Saison ist der Traum endlich Wirklichkeit geworden.',
      '**Willkommen in der A-Liga, Freibad Bazis!** 🏆🍻',
    ],
  },
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
