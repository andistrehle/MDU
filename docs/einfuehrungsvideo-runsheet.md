# Aufnahme-Runsheet – MDU Einführungsvideo

Begleitblatt zum [Konzept](einfuehrungsvideo-konzept.md). Zum Mitlesen während der Bildschirmaufnahme.
**Reihenfolge: erst die komplette öffentliche Tour, dann der Login-Bereich.** Keine Ligaleitungs-/Admin-Funktionen.

---

## Vorbereitung (einmalig, vor der Aufnahme)

1. **Demo-Daten anlegen** (Repo-Root):
   ```
   node scripts/seed-demo-video.mjs
   ```
   Legt an: Demo-Kapitän, 4 ungelesene Benachrichtigungen, 1 eingereichte Demo-Anmeldung „DC Demo München".
2. **Demo-Login** (für die Login-Szenen):
   - E-Mail: `demo.kapitaen@example.com`
   - Passwort: `MduDemo2026!`
   - Team des Demo-Kapitäns: **Silberpfeile II** (für „Mein Team")
3. **Browser:** 1920×1080, Vollbild (F11), Zoom 100 %, keine Lesezeichenleiste, keine DevTools.
4. **OCR-Szene separat** auf `localhost:3000` aufnehmen (mit `OCR_PROVIDER=stub` in `.env.local`) –
   Stub liefert feste Demo-Daten, jedes beliebige Foto genügt. Auf `www.mdudarts.de` **nicht** auf Stub umstellen.
5. Nach der Aufnahme **aufräumen**:
   ```
   node scripts/cleanup-demo-video.mjs
   ```

---

## TEIL 1 – Öffentliche Tour (ohne Login)

> Aufnahme auf `https://www.mdudarts.de`.

| # | Aktion | Worauf achten |
|---|---|---|
| 1 | `/` öffnen, langsam scrollen: Hero → „Nächste Spiele" → „Letzte Spiele" | ruhige Maus, kurze Pausen |
| 2 | **Theme-Switch** im Header 1× klicken (New Design → Old School), 2 Sek., zurück | der „Wow"-Moment |
| 3 | Header **„Ligen"** → eine **A-Liga-Staffel** öffnen | Tabelle mit Auf-/Abstiegs-/Playoff-Markierungen + Legende |
| 4 | In der Liga den Tab/Bereich **Einzelrangliste** zeigen | kurz scrollen |
| 5 | Header **„Teams"** → ein vollständiges Team öffnen (Vorschlag: **Freibad Bazis**) | Logo, Kader, Spielstätte, Ergebnisse, Teamstatistik |
| 6 | Direkt ein **Spielerprofil** öffnen (Vorschlag: ein Spieler **mit Foto**) | Foto, Spitzname, Platz, Punkte, Leg-/Spiele-Bilanz |
|   | ⚠️ **Formkurve nur zeigen, wenn gefüllt**; **180er/High Finishes nur, wenn Werte vorhanden** – sonst überspringen |  |

---

## TEIL 2 – Login-Bereich (als Demo-Kapitän)

| # | Aktion | Worauf achten |
|---|---|---|
| 7 | `/login` → mit Demo-Login anmelden | **Passwort-Tippen nicht filmen** |
| 8 | `/mein-bereich` – Kacheln zeigen | Mein Profil, Meine Liga, Mein Team, Mannschaft anmelden, Meine Anmeldungen, Spielbericht erfassen … |
| 9 | **Glocke** oben rechts: roten Badge zeigen → klicken → Dropdown | 4 Demo-Meldungen sichtbar |
| 10 | Kachel **„Mannschaft anmelden"** → Formular durchscrollen | Ligawunsch (La/A/B/C), Spielstätte, Logo, Kader – **NICHT absenden** |
| 11 | Kachel **„Meine Anmeldungen"** → Status „DC Demo München – eingereicht" | zeigt den Rückmeldungs-Status |
| 12 | Kachel **„Spielbericht erfassen"** → einen Bericht **ansehen** | 18 Spiele, 2 Doppel, Auto-Wertung, Einzelranglistenpunkte |
| 13 | Header **„Downloads"** → PDF-Spielbericht öffnen | 2-seitige A4-Vorlage |

---

## TEIL 3 – OCR (separater Mobile-Take auf localhost, Stub)

| # | Aktion | Worauf achten |
|---|---|---|
| 14 | `/mein-bereich/spielberichte/ocr` → Foto/Datei hochladen | Smartphone-Optik / Hochformat |
| 15 | Verarbeitung → **Prüfansicht**: erkannte Felder, unsichere markiert, 1 Korrektur → **Bestätigen** | „Geprüft wird immer selbst" |

---

## Abschluss
- Zurück zu `/` für die Avatar-Outro-Überblendung.
- **Datenschutz-Sichtung** (siehe Konzept Abschnitt 10) vor dem Teilen.
- `node scripts/cleanup-demo-video.mjs` ausführen.

> Sprechertext + Einblendungen je Szene: siehe Konzept Abschnitte 4–5 und 12.
