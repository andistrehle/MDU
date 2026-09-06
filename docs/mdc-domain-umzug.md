# MDC auf mdc-ranking.de umziehen

Die Munich Darts Challenge liegt im selben Repository wie die MDU-Plattform,
soll aber unter **mdc-ranking.de** in der Wurzel laufen — also
`mdc-ranking.de/rangliste`, nicht `…/mdc/rangliste`.

Dafür wird **dasselbe Repository ein zweites Mal bei Vercel deployed**. Eine
Umgebungsvariable entscheidet, welche Ausprägung dabei herauskommt:

| Projekt | Domain | `NEXT_PUBLIC_MDC_STANDALONE` | zeigt |
| --- | --- | --- | --- |
| bestehendes MDU-Projekt | www.mdudarts.de | *nicht gesetzt* | MDU-Plattform, MDC unter `/mdc` |
| neues MDC-Projekt | mdc-ranking.de | `1` | nur die MDC, ohne Präfix |

Im MDC-Projekt schreibt der Proxy (`proxy.ts`) jeden Aufruf intern auf `/mdc/…`
um. Die Seiten liegen im Code weiterhin unter `app/mdc`; nach außen ist davon
nichts zu sehen, weil alle Verweise über `mdcPath()` laufen
(`lib/mdc/site.ts`). MDU-Seiten sind dort nicht erreichbar — auch
`mdc-ranking.de/tabellen` landet in `/mdc/tabellen` und damit auf 404.

---

## 1. Vorher: Rechtstexte

Erledigt. Impressum und Datenschutz stehen mit echten Angaben
(`data/mdc-legal.ts`, Anbieter wie bei der MDU). Solange dort etwas fehlt,
bleibt die Seite automatisch für Suchmaschinen gesperrt — `MDC_INDEXABLE` in
`lib/mdc/site.ts` verlangt vollständige Pflichtangaben.

**Nicht anwaltlich geprüft.** Die Texte sind sorgfältig auf das geschrieben,
was die Seite tatsächlich tut (keine Cookies, keine Anmeldung, keine fremden
Server, Veröffentlichung von Namen und Ergebnissen auf Grundlage berechtigten
Interesses). Eine Prüfung durch die DSB, die auch die MDU-Texte gesehen hat,
ist trotzdem empfehlenswert.

## 2. Neues Vercel-Projekt anlegen

1. Vercel → **Add New… → Project** → dasselbe GitHub-Repository (`andistrehle/MDU`) importieren.
2. Framework Next.js, Root Directory und Build Command auf den Vorgaben lassen.
3. **Environment Variables** (Production *und* Preview):

   ```
   NEXT_PUBLIC_MDC_STANDALONE = 1
   ```

   **Sonst nichts.** Insbesondere KEINE Supabase-, Resend- oder OCR-Variablen:
   Ohne sie ist der Anmeldeteil der MDU von selbst untätig — kein Zugriff auf
   die Produktivdatenbank, keine Cookies, keine Verbindung zu fremden Servern.
   Genau das steht so auch in den Datenschutzhinweisen.
4. Deployen und über die vercel.app-Adresse prüfen (Punkt 5).

> Beide Projekte hängen am selben Repository und bauen bei jedem Push auf
> `main` neu. Das ist gewollt: Eine Änderung an der MDC landet damit auf beiden
> Adressen gleichzeitig.

## 3. Domain in Vercel hinterlegen

Im **neuen** Projekt unter Settings → Domains eintragen:

- `mdc-ranking.de` (Hauptadresse)
- `www.mdc-ranking.de` → Vercel bietet an, sie auf die Hauptadresse
  umzuleiten. Annehmen; eine Adresse je Seite.

Vercel zeigt danach die konkreten DNS-Werte an (A-Record für die Hauptdomain,
CNAME für `www`). **Diese angezeigten Werte verwenden** — sie ändern sich von
Zeit zu Zeit, deshalb stehen hier bewusst keine IP-Adressen.

## 4. DNS bei STRATO umstellen

Im STRATO-Kundenbereich → Domainverwaltung → `mdc-ranking.de`:

1. **Umleitung/Platzhalter abschalten.** Die Domain steht aktuell auf
   „Platzhalter aktiviert" — solange das so ist, kommt nichts durch.
2. **DNS-Einträge setzen** (Verwaltung → DNS-Einstellungen):
   - `@` → A-Record auf die von Vercel genannte Adresse
   - `www` → CNAME auf den von Vercel genannten Wert
3. Speichern und warten: STRATO braucht meist Minuten bis wenige Stunden,
   bis die Änderung überall greift. Vercel stellt das TLS-Zertifikat danach
   automatisch aus (Let's Encrypt) — im Vercel-Dashboard steht dann „Valid
   Configuration".

Autodiscover, Subdomains und die digitale Visitenkarte bei STRATO bleiben
unangetastet; die brauchen wir nicht.

## 5. Abnahme

Wenn die Domain steht, der Reihe nach prüfen:

| Aufruf | Erwartung |
| --- | --- |
| `mdc-ranking.de` | MDC-Startseite |
| `mdc-ranking.de/rangliste` | laufende Wertung |
| `mdc-ranking.de/turniere/ergebnisse` | alle Turniere |
| `mdc-ranking.de/mdc/rangliste` | 308-Weiterleitung auf `/rangliste` |
| `mdc-ranking.de/tabellen` | 404 (MDU gibt es hier nicht) |
| `mdc-ranking.de/robots.txt` | `Allow: /`, Sitemap-Verweis |
| `mdc-ranking.de/sitemap.xml` | Adressen auf mdc-ranking.de |
| `mdc-ranking.de/impressum` | vollständige Angaben, kein roter Hinweis |

## 6. Alte Adresse umleiten

Erst **wenn die neue Domain wirklich läuft**, im **MDU-Projekt** setzen:

```
NEXT_PUBLIC_MDC_MOVED = 1
```

Danach ein Redeploy. `mdudarts.de/mdc/...` leitet dann dauerhaft (308) auf
`mdc-ranking.de/...` um — eine Adresse, keine doppelten Inhalte.

Vorher nicht setzen: Sonst schickt die Weiterleitung Besucher auf die
STRATO-Platzhalterseite.

## 7. Bei Google anmelden (optional)

Sobald die Seite steht: Google Search Console → Property `mdc-ranking.de`
anlegen (Nachweis per DNS-TXT-Eintrag bei STRATO), dann
`https://mdc-ranking.de/sitemap.xml` einreichen. Ohne das dauert es länger,
bis die Seite auftaucht — kaputt ist ohne Search Console aber nichts.

---

## Was im Code wo steckt

| Datei | Aufgabe |
| --- | --- |
| `lib/mdc/site.ts` | `MDC_STANDALONE`, `MDC_BASE`, `mdcPath()`, `MDC_INDEXABLE` |
| `proxy.ts` | Umschreibung auf `/mdc/…`, Weiterleitung der alten Adresse |
| `app/robots.ts`, `app/sitemap.ts` | eigene Regeln und Adressen je Ausprägung |
| `app/mdc/layout.tsx` | `metadataBase`, `robots` je nach Ausprägung |
| `data/mdc-legal.ts` | Anbieterangaben für Impressum und Datenschutz |

**Beim Verlinken innerhalb der MDC immer `mdcPath()` benutzen** — ein fest
geschriebenes `/mdc/...` zeigt auf der eigenen Domain ins Leere.
