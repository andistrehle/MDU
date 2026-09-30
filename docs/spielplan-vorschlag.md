# Spielplan-Vorschlag 2026/2027 + Kontext (Session-Übergabe)

Dieses Dokument hält den Stand rund um den **Spielplan-Vorschlag** fest, damit
jede Session (auch am Handy / nach Neustart) sauber anknüpfen kann. Aller Code
ist auf `main` committet.

## Überblick / Dateien
- **Generator:** `scripts/mdu-spielplan-2627.ts` → erzeugt
  `app/admin/spielplan-vorschlag/spielplan.json`. Ausführen:
  `npx tsx scripts/mdu-spielplan-2627.ts` (dauert ~1,5 min wegen 1200 Restarts).
  Schreibt NICHTS in die DB — reiner Vorschlag.
- **Admin-Seite:** `app/admin/spielplan-vorschlag/page.tsx` (AdminGuard,
  `require="league"`). Umschalter **Ansicht: „Nach Liga" / „Nach Spielort"**.
- **Ansichten:** `spielplan-view.tsx` (je Liga, Spieltage), `spielorte-view.tsx`
  (je Lokal alle Heimspiele, Kapazitäts-Hinweis).
- **Druck/PDF:** `printing.ts` (+ `mdu-logo-data.ts` = eingebettetes MDU-Logo).
  Öffnet ein A4-Dokument im neuen Tab und ruft den Druckdialog auf.
- Kein Playoff-/Relegations-Teil mehr (wurde entfernt).

## Spielregeln des Generators (vom Betreiber festgelegt)
- **Gespiegelte Doppelrunde** je Liga (Hin = Rück, Heimrecht getauscht), gleiche
  Spielreihenfolge. **B-Liga in B1 (8) und B2 (7)** geteilt.
- **Derbys** (beide Teams im selben Lokal) liegen früh in jeder Runde.
- **Rotierendes Freilos** bei ungerader Ligagröße.
- **Alle Ligen starten am 23.–25.10.2026**, letztes Spielwochenende
  **7.–9.05.2027** (letztes WE vor den Pfingstferien). A-Liga (18 Spieltage)
  spielt jedes freie Wochenende durch = genau 18 Wochenenden; kleinere Ligen sind
  mit spielfreien Wochenenden dazwischen entzerrt, enden aber ebenfalls am 7.5.
- **KEINE Playoffs** (bewusst gestrichen).
- **Ferien frei** (echte bayerische Termine 2026/27, in `HOLIDAYS` im Generator):
  Herbst 31.10.–8.11. · Weihnachten 24.12.–10.1. · Fasching 6.–14.2. ·
  Ostern 20.3.–4.4. · 1. Mai (WE 30.4.–2.5.) · Pfingsten 15.–30.5.

## Heimrecht-Optimierung (Zielfunktion in `objective()`)
Die Entzerrung (welcher Spieltag auf welches Wochenende fällt) steht VOR der
Heim/Auswärts-Optimierung fest (hängt nur an Ligagröße + Position). Optimiert
werden nur die Heimrechte, gegen drei Regeln (Local Search, 1200 Restarts):
- **Lokal-Kapazität:** Fiaker Stüberl / Flotte Biene / Jolly Roger dürfen bis
  **3** Heimspiele am selben Wochenende, alle anderen **max 2** (mehr wird hart
  bestraft; Lokale mit ≤2 Teams ergeben ohnehin nie mehr). Vom Betreiber so
  vorgegeben.
- **Bistro 118:** Leider Geil nie zeitgleich heim mit De Hutzeldarter / Black
  Storm (alle drei im Bistro, 2 Automaten).
- **Heim/Auswärts-Wechsel je Team:** möglichst H/A/H/A, lange Serien
  überproportional bestraft. Ergebnis: **max 2 am Stück**, kein Team mit 3.
- Rest-Kompromiss: 1 struktureller Bistro-Konflikt am B1-Derby-Wochenende (29.1.),
  innerhalb der 2er-Kapazität → akzeptiert („Option A", vom Betreiber gewählt).

Hinweis: Jede Änderung an Eingaben (Ferien, Kapazität, Teams) lässt den
Optimierer neu rechnen → viele Heimrechte können sich verschieben (der Plan ist
nicht „klebrig“). Termine/Paarungen bleiben dabei gleich, nur das Heimrecht kippt.

## Druck-/PDF-Vorlagen (`printing.ts`)
- **Team-Blatt** je Team (garantiert eigene Seite, `break-inside: avoid`): alle
  Spiele + Felder **Datum / Uhrzeit** (nebeneinander, „:“ für die Uhrzeit).
- **Masterplan** je Liga (fließt über mehrere Seiten): alle Spiele zum
  Zusammentragen.
- **Spielort-Blatt** je Lokal: alle Heimspiele im Überblick.
- Stil: Old-School-/Homepage-Look (helle Karten, grüner Header, Gold-Linie,
  Saira Condensed / Manrope via Google Fonts), **MDU-Logo** im Kopf.
- Buttons: Liga-Ansicht (diese Liga: Team-Blätter+Master / nur Master / alle
  Ligen), Spielort-Ansicht (dieses Lokal / alle Spielorte).

## Roster-Rekonstruktion 26/27 (Basis der `LEAGUES` im Generator)
Aus Screenshots + Repo rekonstruiert. B1/B2-Split ausgeglichen (Auf-/Absteiger/
Verbleiber gemischt), vom Betreiber bestätigt. C-Liga enthält **Jolly Pirates VII**
(früher Platzhalter „Jolly Pirates XY“, echter Name bestätigt).

## Team-Anmeldung (echte DB, separat vom Vorschlag)
- `app/admin/season-teams/team-anmelden/`: meldet ein Team im Namen der
  Mannschaft an und gibt es sofort frei.
- **Fallback auf die aktive Saison** ergänzt: ist keine Anmelde-Saison offen
  (Saison schon aktiviert), läuft die Nachmeldung in die aktive Saison (mit
  Bestätigung). `getRegistrationSeason()` liefert die aktive Saison nicht, daher
  der Fallback über `getActiveSeason()`.
- **Bugfix:** Die „Ja, trotzdem freigeben“-Bestätigung rief früher die ganze
  Kette erneut auf (`run(true)`) → legte eine ZWEITE Anmeldung an (Duplikat, eine
  blieb „eingereicht“). Jetzt: `confirmActiveSeason()` gibt nur die bereits
  erstellte Anmeldung frei.

## Jolly Pirates VII — Stand
- C-Liga, Spielort **Jolly Roger** (Poststr. 2, 85586 Poing).
- Kader (9): **Theresa Müller (Kapitän/TC)**, Tina Laus (Co-TC, keine eigene
  DB-Rolle), Philipp Fischer, Björn Freese, Miki Nyiri, Daniel Raz,
  Britta Schindler, Matthias Geupel, Roland Müller.
- Über die Admin-Maske angemeldet & **freigegeben**; ein doppeltes „eingereicht“
  wurde vom Betreiber **gelöscht**.
- **Offen / zu prüfen (Lesezugriff):** steht das Team genau einmal in
  `season_team_assignments` der aktiven Saison? Kader vollständig (9, genau ein
  Kapitän)? Passnummern vergeben oder noch `pending_review` / „unklar“?

## DB-Zugriff in der Cloud-Umgebung (Stand: eingerichtet, NUR LESEN)
- ENV in der Cloud-Umgebung „Default“ gesetzt: `NEXT_PUBLIC_SUPABASE_URL`
  (**ohne** `/rest/v1/` — sonst doppelter Pfad, Fehler PGRST125),
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`. **Kein Service-Role** (bewusst; RLS aktiv).
- Netzwerk: `*.supabase.co` freigegeben.
- **Node-Eigenheit dieser Umgebung:** Supabase-Aufrufe brauchen
  `NODE_USE_ENV_PROXY=1` und `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`
  (als Umgebungsvariablen gesetzt), sonst geht Node 22 nicht über den Proxy.
- Lesetest bestätigt: `seasons` = 2, `season_team_assignments` = 37 (HTTP 200).
- **Wichtig:** ENV greift nur in **neu gestarteten** Sessions. Mit dem Anon-Key
  sind evtl. nur öffentliche Tabellen lesbar (RLS) — Kader
  (`season_roster_assignments`) ggf. nicht; dann Admin-Oberfläche oder gezielt
  Service-Role.

## Arbeitsweise (aus CLAUDE.md)
Direkt auf `main` committen & pushen, keine PRs. Vor jedem Push
`npx tsc --noEmit` + `npm run build` grün. Vor Push `git pull --rebase origin main`.
UI-Texte Deutsch/Du-Form. Ehrlichkeitsprinzip (nichts vortäuschen).
