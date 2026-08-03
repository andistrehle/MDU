# FoodPoints — Backlog

Prioritäten: **P0** = MVP-kritisch · **P1** = wichtig, nach MVP · **P2** = später.
Status: ✅ umgesetzt · 🔄 in Arbeit · ⬜ offen.

## P0 — MVP

| Status | Thema | Beschreibung |
|---|---|---|
| ✅ | Projekt-Setup | Sub-App `foodpoints/` (Next.js 16, TS strict, Tailwind v4), eigenes Vercel-Projekt möglich |
| ✅ | Punkte-Engine | Eigene, konfigurierbare Näherungsformel, versioniert, server-/clientseitig identisch (`lib/points/`) |
| ✅ | Nährwert-Normalisierung | kJ→kcal, Dezimalkomma, pro 100 g / pro Portion / Gesamtmenge (`lib/nutrition/`) |
| ✅ | Budget-Modell | Tagesbudget, Wochenreserve, Übertragsregeln, manueller Modus (`lib/budget/`) |
| ✅ | Unit Tests Kernlogik | Vitest: Formel, Rundung, Portionsskalierung, kJ/kcal, Dezimalkomma, Budget, Tagessummen, Rezepte |
| ✅ | Datenmodell | Supabase-Migration: profiles, user_goals, user_settings, weight_entries, foods, food_sources, food_portions, diary_days, diary_entries, recipes, recipe_ingredients, meal_photos, scan_jobs, barcode_mappings, favorites, point_formula_versions — mit RLS |
| ✅ | App-Shell | Mobile Bottom-Nav (Heute · Tagebuch · Scannen · Rezepte · Profil), Scan-Button prominent, Light/Dark |
| ✅ | Demo-Modus | Ohne Registrierung/ENV lauffähig; Beispieltag, Beispielrezept, Mock-Scans; Daten in localStorage |
| ✅ | Heute-Dashboard | Punktering, Wochenreserve, Kalorien/Makros/Wasser, Mahlzeiten, Schnellaktionen |
| ✅ | Lebensmittelsuche + manuelle Erfassung | Suche (lokale DB + Open Food Facts), eigenes Lebensmittel anlegen, Portionswahl |
| ✅ | Tagebuch | Tagesansicht, Navigation, bearbeiten, Portion ändern, verschieben, kopieren, löschen (mit Undo) |
| ✅ | Fotoscan (Mahlzeit) | Upload/Kamera → VisionProvider (Mock/Claude) → Bestätigungsseite mit Korrektur → Tagebuch |
| ✅ | Nährwerttabellen-Scan | Foto → Label-Analyse → Normalisierung (100 g/100 ml/Portion) → Korrekturmaske → privates Lebensmittel |
| ✅ | Barcode-Scanner | Kamera (ZXing: EAN-8/13, UPC-A/E), OFF-Lookup, Fallback: Etikett-Scan oder manuell anlegen + Barcode verknüpfen |
| ✅ | Onboarding | Profil/Ziele erfassen, Kalorienziel + Punktebudget als transparente Schätzung |
| ✅ | Rezepte | Anlegen, Zutaten, Portionen, Punkte/Makros pro Portion, zum Tagebuch hinzufügen |
| ✅ | Supabase-Auth | Registrierung, Login, Passwort-Reset (aktiv sobald ENV gesetzt) |
| ✅ | API-Routen | analyze-meal, analyze-label, barcode, food-search — Zod-validiert, Keys nur serverseitig |
| ✅ | PWA-Basis | Manifest, Icons (Platzhalter), installierbar |

## P1 — nach MVP

| Status | Thema | Beschreibung |
|---|---|---|
| ✅ | Fortschritt | Gewichtsverlauf, Wochenübersicht, Tage im Budget |
| ⬜ | Supabase-Sync vollständig | SupabaseStore für alle Entitäten (Diary/Foods/Recipes/Weights) inkl. Konfliktbehandlung; aktuell: Demo-Store vollständig, Supabase-Anbindung für Auth + Schema vorhanden |
| ⬜ | Offline-Sync-Queue | Nicht synchronisierte Einträge lokal puffern, bei Verbindung nachsyncen (Service Worker + Background Sync) |
| ⬜ | Playwright-E2E | Die 10 Kern-Flows aus der Spezifikation als E2E-Tests gegen Demo-Modus |
| ⬜ | Datenexport / Account löschen | Export als JSON (Demo-Modus: umgesetzt als Download); serverseitig via Supabase-RPC + Storage-Cleanup |
| ⬜ | Häufige Mahlzeiten | Ganze Mahlzeiten als Favorit speichern und erneut eintragen |
| ⬜ | Wochenansicht Tagebuch | Aggregierte Wochenansicht mit Budgetverlauf |
| ⬜ | EXIF-Entfernung serverseitig | Aktuell: clientseitige Re-Kompression über Canvas entfernt EXIF; zusätzlich serverseitig absichern |
| ⬜ | Rate Limiting | Upstash/Vercel-KV o. ä. für Vision-/Scan-Endpunkte |
| ⬜ | Aktivitätspunkte | Optionale Punkte durch Bewegung |
| ⬜ | Foto→Rezept | Rezeptvorschlag aus Mahlzeitenfoto |

## P2 — später

| Status | Thema | Beschreibung |
|---|---|---|
| ⬜ | Adminbereich | Globale Lebensmittel pflegen, Dubletten, Barcode-Zuordnungen, Scan-Fehlerraten, Formel-Versionierung per UI |
| ⬜ | Apple-/Google-Login | OAuth über Supabase |
| ⬜ | Audit-Log | Kritische Vorgänge protokollieren |
| ⬜ | Maße (Bauchumfang etc.) | Zusätzliche Körpermaße im Fortschritt |
| ⬜ | i18n | Englische Oberfläche |
| ⬜ | Push-Erinnerungen | Erfassungs-Reminder |

## Risiken

1. **Rechtlich:** Keine WW-Formel, keine WW-Marken. Eigene Näherungsformel, überall als solche gekennzeichnet. Kein Medizinprodukt — alle Budgets/Ziele als allgemeine Schätzung deklariert.
2. **Vision-Kosten/Qualität:** KI-Mengenschätzung ist unsicher → Bestätigungspflicht vor jedem Speichern, Confidence sichtbar, Mock-Provider für Betrieb ohne API.
3. **Open Food Facts Datenqualität:** Quelle + Vertrauenswert werden gespeichert; Nutzer bestätigt Werte vor Übernahme; widersprüchliche Quellen werden markiert.
4. **iOS-Kamera/Barcode:** `BarcodeDetector` fehlt in Safari → ZXing als portable Lösung; Fallback: Foto der Nährwerttabelle oder manuelle Eingabe.
5. **Shared Repo:** FoodPoints lebt als Sub-App im MDU-Repo (Branch `claude/foodpoints-nutrition-tracker-2szche`); Root-Build der Darts-Plattform bleibt unberührt.
