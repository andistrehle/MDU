// ============================================================
// MDC — Endrangliste Frauen, Saison 2025/26 (Stand 27.07.2026)
// ============================================================
//
// ERZEUGT aus der Arbeitsmappe des Betreibers durch
// `scripts/mdc-import-saison-2025-26.py` (Blatt „Frauen"). Nicht von Hand
// bearbeiten — sonst laufen Rangliste und Einzelergebnisse auseinander.
//
// Format je Zeile:
//
//   Platz | Passnr. | Name | Vorname | Anzahl TN | Punkte | % | Trend
//
// • Platz leer  → punktgleich mit der Zeile darüber (geteilter Platz).
//                 2 der 77 Zeilen teilen sich so einen Platz.
// • %           → Anteil an der Einzelranglisten-Ausschüttung (EZR).
//                 Der Euro-Betrag wird daraus berechnet (siehe payout.ts),
//                 damit Prozent und Euro nicht auseinanderlaufen können.
// • Trend       → 'u' = ▲ gestiegen, 'd' = ▼ gefallen, leer = unverändert.
// • Schnitt     → wird als Punkte / Anzahl TN berechnet, nicht gepflegt.
//
// Jede Zeile ist gegen die Einzelergebnisse derselben Mappe gerechnet: Die
// Summe der Turnierpunkte einer Passnummer ergibt die Punktzahl hier, die
// Anzahl der Starts die Spalte „Anzahl TN".
//
// Vor dem ersten Import (September 2026) stand hier eine von Fotos der
// gedruckten Auswertung abgetippte Fassung. Der Abgleich mit der Mappe hat
// 13 Lesefehler in der Männer- und 2 in der Frauenwertung berichtigt, sieben
// übersehene geteilte Plätze erkannt und eine fehlende Zeile ergänzt.
// ============================================================

export const RANKING_WOMEN_2025_26_RAW: string[] = [
  '1|220|STRUCK|MONI|121|17420|14',
  '2|499|MAIER|MONIKA|130|14150|12',
  '3|301|HOFNER|MARIA|113|12773|10',
  '4|498|MAIER|LINDA|65|10838|8',
  '5|58|SEIDL|MANDY|69|8490|7',
  '6|537|MÜLLER-ROTONDO|ANGI|85|7850|6',
  '7|221|ROTHER|SANDRA|72|7593|5',
  '8|327|PAUL|EVI|50|7049|4',
  '9|530|WAGNER|MARGIT|71|6409|2.5',
  '10|143|REISINGER|ERIKA|59|5585|2.5',
  '11|518|PILSL|YVONNE|56|5411|2.5',
  '12|460|LACHNER|JUTTA|65|5399|2.5',
  '13|292|LODDERSTEDT|NICOLE|41|5019|2',
  '14|251|VASZI|CLAUDIA|62|4899|2',
  '15|65|BAUER|GUDRUN|45|4706|2',
  '16|195|SCHWEIGER|BIANCA (BIBI)|46|4576|2',
  '17|511|KÖGEL|SOPHIE|51|4205|1.2',
  '18|225|DAMMICH|WANDA|41|3386|1.2',
  '19|236|MINIC|SAMY|31|3376|1.2',
  '20|202|LANGER|SONJA|41|3030|1.2',
  '21|117|ZEHETMEIER|CAROL|31|2855|0.8',
  '22|396|DORNER|KARIN|38|2756|0.8',
  '23|122|LIEBL|MELLI (BATWIFE)|38|2728|0.8',
  '24|471|BITTNER-OTT|MICHA|27|2720|0.8',
  '25|264|NECKE|MELANIE|28|2691|0.8',
  '|204|MOLNAR|ILDIKO|31|2691|0.8',
  '27|660|OELLERER|KARIN|31|2609|0.8',
  '28|50|FOLWARK|ALEX|23|2599|0.8',
  '29|250|DÖLLE|MIRIAM|30|2579|0.8',
  '30|67|FUSS|CHEYENNE|21|2541|0.8',
  '31|467|KRANABETTER|WALTRAUD|19|2491|0.8',
  '32|9|KARNOLL|TAMARA|25|2464|0.8',
  '33|364|KRANABETTER|BECCI|23|2284',
  '34|275|RG|HANNA|15|1391',
  '35|115|BASIC|MANUELA|14|1326',
  '36|477|WEINDL|CHRISTINA|15|1316',
  '37|317|POHL|CHARLY|8|1254',
  '38|458|GISI|JULIA (LULU)|12|1173',
  '39|305|FLIERL|BIGGI|10|1137',
  '40|470|OTT|YASSI|8|906',
  '41|449|MANZKE|MELLY|10|875',
  '42|194|RG|LISA/STEPHY|9|776',
  '43|247|SCHMELZER|DANIELA|9|763',
  '44|307|CETA KOLLOC|ROSA|8|719',
  '45|304|MACHETE|EDITH|11|698',
  '46|14|CALYPSO|DANI|7|682',
  '47|8|JOSY|JOSY|4|483',
  '48|564|KAUSCH|MARIA|4|395',
  '49|296|PFEIFFER|FRANKA|3|382',
  '50|80|JUNG|MICHELLE|4|379',
  '51|238|WALDNER|SUSI|5|331',
  '52|82|HARLEKIN|STEFFY|4|326',
  '53|60|PFAFFENZELLER|ANNIKA (BOCKI)|3|283',
  '54|34|JOKER|TANJA|3|278',
  '55|2|BAUER|CHRISTEL|3|269',
  '56|27|TRIXI|TRIXI|2|264',
  '57|191|TONYS|NANCY|2|219',
  '58|452|5STERNE|VANESSA|4|214',
  '59|214|BECK|TANJA|2|206',
  '60|417|WÜSTNER|SABSE|1|202',
  '61|294|BAUMANN|MAIKE|2|181',
  '62|190|RUPP|BIANCA|2|136',
  '63|390|LEGENDARY|ANNA|3|132',
  '64|184|LÖDL|CARMEN|2|129',
  '65|555|VACCARO|STEFFI|1|119',
  '66|29|KIRSCHNER|ANNETTE|1|112',
  '67|79|WILK|DOMINIQUE|1|106',
  '68|104|MOOSLEITNER|ANDREA|1|103',
  '69|311|MACHETE|MEL|1|94',
  '70|357|EREGLIADIS|MICHAELA|1|82',
  '71|426|KÖHLER|MARION|2|80',
  '|306|MACHETE|MANU|2|80',
  '73|47|FIAKER|VICKY|1|76',
  '74|81|LUZI|MELLI|1|72',
  '75|329|WEINBERGER|TAMY|1|65',
  '76|507|BACHMAIER|PETRA|1|61',
  '77|540|WÜRMTAL|GABI|1|52',
];
