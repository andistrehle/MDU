// ============================================================
// MDC — Rangliste Frauen, Saison 2026/27 (Stand 2026-09-05)
// ============================================================
//
// ERZEUGT aus der Arbeitsmappe des Betreibers durch
// `scripts/mdc-import-saison.py` (Blatt „Frauen"). Nicht von Hand
// bearbeiten — sonst laufen Rangliste und Einzelergebnisse auseinander.
//
// Format je Zeile:
//
//   Platz | Passnr. | Name | Vorname | Anzahl TN | Punkte | % | Trend
//
// • Platz leer  → punktgleich mit der Zeile darüber (geteilter Platz).
//                 1 der 17 Zeilen teilen sich so einen Platz.
// • %           → Anteil an der Einzelranglisten-Ausschüttung (EZR).
//                 Der Euro-Betrag wird daraus berechnet (siehe ranking-final.ts),
//                 damit Prozent und Euro nicht auseinanderlaufen können.
// • Trend       → 'u' = ▲ gestiegen, 'd' = ▼ gefallen, leer = unverändert.
// • Schnitt     → wird als Punkte / Anzahl TN berechnet, nicht gepflegt.
//
// Jede Zeile ist gegen die Einzelergebnisse derselben Mappe gerechnet: Die
// Summe der Turnierpunkte einer Passnummer ergibt die Punktzahl hier, die
// Anzahl der Starts die Spalte „Anzahl TN".
//
// Die laufende Saison: Diese Datei wird bei jeder neuen Fassung der Mappe
// neu erzeugt. Vorher standen hier acht von Hand abgetippte Ergebniszettel;
// die Mappe hat sie ersetzt (siehe docs/mdc-demo.md).
// ============================================================

export const RANKING_WOMEN_2026_27_RAW: string[] = [
  '1|301|HOFNER|MARIA|4|534|14',
  '2|220|STRUCK|MONI|2|327|12|u',
  '3|236|MINIC|SAMY|2|235|10|d',
  '4|58|SEIDL|MANDY|2|221|8|u',
  '5|275|RG|HANNA|2|202|7',
  '6|225|DAMMICH|WANDA|2|186|6|d',
  '7|195|SCHWEIGER|BIANCA (BIBI)|1|170|5',
  '8|50|FOLWARK|ALEX|1|103|4|d',
  '9|67|FUSS|CHEYENNE|1|101|2.5|d',
  '|65|BAUER|GUDRUN|1|101|2.5|d',
  '11|518|PILSL|YVONNE|1|95|2.5|d',
  '12|264|NECKE|MELANIE|2|92|2.5',
  '13|204|MOLNAR|ILDIKO|1|90|2|d',
  '14|251|VASZI|CLAUDIA|1|70|2',
  '15|298|BECKER|CLAUDIA|1|62|2',
  '16|537|MÜLLER-ROTONDO|ANGI|1|53|2|d',
  '17|396|DORNER|KARIN|1|40|1.2|d',
];
