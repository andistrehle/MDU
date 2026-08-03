# VisionProvider — Foto- und Etikett-Analyse

Die Bilderkennung ist hinter einer austauschbaren Schnittstelle gekapselt
(`lib/vision/types.ts`):

```ts
interface VisionProvider {
  analyzeMealImage(input: AnalyzeMealImageInput): Promise<MealAnalysisResult>;
  analyzeNutritionLabel(input: AnalyzeLabelInput): Promise<LabelAnalysisResult>;
}
```

## Implementierungen

| Provider | Auswahl | Beschreibung |
|---|---|---|
| `MockVisionProvider` | `VISION_PROVIDER=mock` (Default) | Deterministische Demo-Ergebnisse, kein externer Dienst. Ergebnisse sind als Demo-Analyse gekennzeichnet. |
| `ClaudeVisionProvider` | `VISION_PROVIDER=claude` + `VISION_API_KEY` | Anthropic Messages API (`VISION_MODEL`, Default `claude-sonnet-5`). Antwort wird mit Zod validiert; ungültige Antworten führen zu einem Fehler, nie zu erfundenen Daten. |

Ein neuer Anbieter braucht nur eine weitere Klasse + einen Zweig in
`lib/vision/index.ts` (`getVisionProvider`).

## Sicherheits- und Produktregeln

- Provider laufen **nur serverseitig** (API-Routen `/api/vision/*`);
  `VISION_API_KEY` erreicht nie den Client (`import 'server-only'`).
- Bilder werden clientseitig komprimiert (max. 1600 px, JPEG 0,82) und durch das
  Canvas-Re-Encoding von EXIF-Metadaten (inkl. GPS) befreit
  (`lib/media/compress-image.ts`).
- Uploads sind Zod-validiert (Mime-Whitelist, Größenlimit) und rate-limitiert.
- **KI-Ergebnisse werden nie ungeprüft übernommen.** Beide Flows zeigen eine
  Bestätigungsseite: Mengen und Zuordnungen sind editierbar, niedrige
  Confidence wird markiert, unzugeordnete Bestandteile werden nicht gespeichert.
- Fehlende Etikettenwerte bleiben `null` (werden nie erfunden) und werden in der
  Korrekturmaske als fehlend/unsicher angezeigt.
- Fotos werden standardmäßig nach der Analyse verworfen; dauerhaftes Speichern
  ist Opt-in (Profil → „Fotos & Datenschutz“).

## Ergebnisformate

`MealAnalysisResult` (Foto einer Mahlzeit):

```json
{
  "mealName": "Beispielgericht",
  "confidence": 0.78,
  "items": [
    {
      "name": "Lebensmittel",
      "estimatedGrams": 150,
      "confidence": 0.84,
      "preparation": "gebraten",
      "possibleHiddenIngredients": ["Öl"]
    }
  ],
  "warnings": ["Mengen sind nur geschätzt."]
}
```

`LabelAnalysisResult` (Nährwerttabelle): Produktname/Marke, Bezugsgröße
(`per100g` | `per100ml` | `perPortion`), Portionsgröße, Rohwerte (kcal/kJ, Fett,
gesättigt, KH, Zucker, Ballaststoffe, Eiweiß, Salz — jeweils nullable), Barcode,
`uncertainFields`, `warnings`. Die Normalisierung auf 100 g (inkl. kJ→kcal und
Dezimalkomma) übernimmt `lib/nutrition/normalize.ts`.
