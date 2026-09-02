# MDC — Quelldateien

Hier liegen die Originaldateien des Betreibers, aus denen die Daten unter
`/data` entstehen. Nichts hier wird ausgeliefert; der Ordner ist reines
Arbeitsmaterial und liegt bewusst im Repo, damit nachvollziehbar bleibt,
woher eine Zahl stammt.

## Was hier hineingehört

**Am besten Tabellen** — `.xlsx`, `.xls` oder `.csv`. Daraus lassen sich die
Werte exakt lesen. Kein Abtippen, keine Ablesefehler.

**Zur Not Bilder** — `.png`, `.jpg`. Funktioniert auch, ist aber
fehleranfälliger: Zahlen müssen abgelesen werden. Als Gegenprobe rechne ich
immer `Punkte / Anzahl TN` gegen den angegebenen Schnitt.

## Wie benennen

```
rangliste-2025-26-maenner.xlsx
rangliste-2025-26-frauen.xlsx
sommer-2026-maenner.xlsx
turnier-2026-09-07-harlekin.xlsx
spielorte-2026-27.xlsx
```

Also: **Was** — **wann** — **wo**. Das Datum als `JJJJ-MM-TT`, damit die
Dateien von selbst in der richtigen Reihenfolge stehen.

## Was in eine Turnierdatei gehört

Damit ein Turnier vollständig auf die Seite kann:

| Feld | Beispiel | Pflicht |
| --- | --- | --- |
| Datum | 07.09.2026 | ja |
| Lokal | Harlekin | ja |
| Platz | 1, 2, 3 … | ja |
| Passnummer | 23 | ja — sicherer als der Name |
| Name, Vorname | Ruhland, Patrick | hilfreich zur Kontrolle |
| Punkte | 221 | ja |
| Legs +/− | 15:7 | optional |

Die Passnummer ist der verlässliche Schlüssel: Namen werden mal anders
geschrieben (siehe die drei Fälle in `docs/mdc-demo.md`), Nummern nicht.

## Wie die Dateien hierher kommen

Am einfachsten über den GitHub-Browser: in diesen Ordner gehen, **Add file →
Upload files**, ablegen, „Commit changes". Ich lese sie beim nächsten Mal
direkt aus.

## Warum nicht direkt von Facebook

Der Netzwerkzugang dieser Arbeitsumgebung lässt nur Paket-Registries und
GitHub durch; facebook.com ist gesperrt (getestet: 403 beim
Verbindungsaufbau). Ein Zugang oder Token würde daran nichts ändern.
Unabhängig davon liegen die Ergebnisse dort als Bilder vor — die Tabelle aus
der Quelle ist ohnehin die bessere Grundlage.
