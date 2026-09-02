// ============================================================
// MDC — Sommer-Ranking 2026, Männer (Endstand 01.09.2026)
// ============================================================
//
// Übertragen aus der offiziellen MDC-Auswertung. Zeilenformat wie bei den
// Saison-Endranglisten:
//
//   Platz | Passnr. | Name | Vorname | Anzahl TN | Punkte | % | Trend
//
// Das Sommer-Ranking hat keine Ausschüttung — die Prozentspalte bleibt leer.
// Der Schnitt wird als Punkte / Anzahl TN berechnet, nicht gepflegt.
// ============================================================

export const RANKING_SOMMER_MEN_RAW: string[] = [
  '1|23|RUHLAND|PATRICK|10|2172',
  '2|71|MASTRIA|DONATO|11|1883',
  '3|51|JUNG|MANUEL|9|1708',
  '4|262|FRÖSE|PETER|14|1550||u',
  '5|140|ODIN|MICHI|11|1519||u',
  '6|259|70ER|DOMINIC|8|1510||u',
  '7|63|MÜLLER|RONNY|13|1483||u',
  '8|340|BURDULEA|MITA|11|1475||d',
  '9|26|LEHNER|MARTIN|7|1468||d',
  '10|53|SCHUL|MIKKY|13|1419||d',
  '11|260|BRUNN|MICHAEL|12|1332||d',
  '12|56|MÜLLER|PATRICK|7|1311||d',
  '13|153|POGREMNO|JIMMY|9|1266||u',
  '14|74|MASTRIA|ANTONIO|11|1245||d',
  '15|12|BRUNNER|STEPHAN|10|1233||d',
  '16|501|X|ANDI|11|1030',
  '17|102|JAURICH|ENRICO|12|929',
  '18|338|SCHMIDT|CHRIS|9|927',
  '19|68|MOHR|CHRISTIAN|4|842',
  '20|198|FREINBERGER|FRANZ|8|803',
  '21|533|BIBER|ULI|4|801',
  '22|231|HERCEG|DRAGAN|5|734||u',
  '23|119|NEUMAIER|MICHAEL|4|699||d',
  '24|281|HUNDSEDER|MARKUS|3|582',
  '25|124|SCHULZ-NEUBER|THORSTEN|4|469',
  '26|263|MUHIC|ASIM|5|455',
  '27|78|TOMIC|MLADEN|3|454',
  '28|450|LACHNER|ALEX|3|450',
  '29|454|LENTNER|DENNIS|3|397',
  '30|185|KETIASHVILI|GIORGI|4|375',
  '31|1|BAUER|TONI|3|372',
  '32|237|LOZANCIC|ZLATKO (LOCA)|3|361',
  '33|179|MATEJKA|BALU|2|357',
  '34|277|70ER|ERIC|2|347',
  '35|269|KAISER|MICHAEL|3|342',
  '36|300|STRIESE|UWE|2|322',
  '37|234|RALL|ALEX|2|314',
  '38|5|ALBRECHT|SVEN|2|311',
  '39|461|VEITINGER|STEFAN|3|296',
  '40|267|BUCHHOLZ|MANUEL|2|274',
  '41|428|SKARUPSKI|ENRICO|1|165',
  '|174|MÜLLER|UWE|1|165',
  '43|266|FISCHER|KURTI|2|159',
  '44|64|HANSL|MATHIAS|2|158',
  '45|84|HARLEKIN|ERNA|1|137',
  '46|312|BEHREND|REINHOLD|1|132',
  '47|422|SCHÄFER|TOBI|1|105',
  '48|113|MENDE|LARS|1|102',
  '49|297|KRÜBL|CHRIS|1|99',
  '50|4|MÜLLER|FRITZ|1|94',
  '51|302|AUST|DANIEL|1|76',
  '52|30|KRANABETTER|HERBIE|1|70',
  '53|200|LUDWIG|LEON|1|40',
  '|21|LENZ|RENE (STANGL)|1|40',
];
