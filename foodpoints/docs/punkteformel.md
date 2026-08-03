# Die FoodPoints-Punkteformel

**Wichtig:** Dies ist eine **eigene, transparente Näherungsformel** von FoodPoints.
Sie ist bewusst offen dokumentiert und frei konfigurierbar. Sie ist **nicht** die
Punkteformel von WeightWatchers/WW oder eines anderen Anbieters und wird nirgends
als solche bezeichnet.

## Formel (Version `fp-v1`)

```
pointsRaw =
    calories        × calorieFactor      (0,030)
  + saturatedFatG   × saturatedFatFactor (0,90)
  + sugarG          × sugarFactor        (0,12)
  − proteinG        × proteinFactor      (0,08)
  − fiberG          × fiberFactor        (0,15)

points = max(0, roundHalfUp(pointsRaw))
```

- Kalorien treiben die Punkte primär.
- Gesättigte Fettsäuren und Zucker erhöhen die Punkte zusätzlich.
- Eiweiß und Ballaststoffe senken sie (Sättigung, Nährstoffdichte).
- Punkte sind nie negativ; gerundet wird kaufmännisch (half-up), reproduzierbar.

## Bezugsgrößen

Die Engine unterscheidet drei Bezugsgrößen (`computeFoodPoints`):

| Bezug | Berechnung |
|---|---|
| pro 100 g/ml | Formel direkt auf die 100-g-Nährwerte |
| pro Portion / Gesamtmenge | Nährwerte werden zuerst linear auf die Menge skaliert, dann gerundet |

Wichtig: Es werden immer die **skalierten Nährwerte** gerundet — nicht die Punkte
skaliert. Dadurch ergibt die doppelte Portion ungefähr doppelte Punkte und
Rundungsfehler summieren sich nicht.

## 0-Punkte-Basislebensmittel

Lebensmittel können als 0-Punkte-Basislebensmittel markiert werden. Die Regel greift nur, wenn **beides** gilt:

1. Das Lebensmittel ist explizit markiert (`isZeroPointFood`).
2. Die Kategorie ist grundsätzlich berechtigt (`zeroPointEligible` in
   `lib/points/config.ts`): Gemüse, Obst, mageres Eiweiß, Hülsenfrüchte, Eier.

Nicht berechtigt sind u. a. Fertigprodukte und Getränke — ein Fertigprodukt wird
**nie** 0 Punkte, auch wenn einzelne Zutaten auf einer 0-Punkte-Liste stehen.
Getränke mit Zucker werden immer berechnet (doppelte Absicherung in
`qualifiesAsZeroPoint`).

## Versionierung

- Jede Faktorenkombination hat eine Versionskennung (z. B. `fp-v1`).
- **Bestehende Versionen werden nie geändert** — Anpassungen erzeugen eine neue
  Version in `lib/points/config.ts` (Spiegel in DB-Tabelle `point_formula_versions`).
- Tagebucheinträge speichern die beim Erfassen verwendete Version
  (`formula_version`) sowie Punkte und Nährwerte als Snapshot. Historische Tage
  bleiben dadurch stabil, auch wenn sich Faktoren später ändern.

## Faktoren ändern

1. Neue Konstante in `lib/points/config.ts` anlegen (z. B. `FORMULA_V2` mit `version: 'fp-v2'`).
2. In `ALL_FORMULA_VERSIONS` aufnehmen und `ACTIVE_FORMULA` umstellen.
3. SQL-Insert in einer neuen Migration für `point_formula_versions` ergänzen
   (`is_active` umschalten).
4. Unit-Tests in `tests/points-engine.test.ts` prüfen/ergänzen.

## Punktebudget

Das Tagesbudget wird aus dem geschätzten Kalorienziel abgeleitet
(`lib/budget/engine.ts`): Grundumsatz nach Mifflin-St Jeor × Aktivitätsfaktor,
± Tempo-Defizit (7700 kcal ≈ 1 kg), Kalorien-Untergrenze als Sicherheitsnetz,
dann `targetCalories × calorieFactor`, begrenzt auf 23–71 Punkte. Wochenreserve,
Übertragsregeln und ein manueller Modus sind in den Einstellungen konfigurierbar.
Alle Werte werden als allgemeine Schätzung gekennzeichnet — keine medizinische Beratung.
