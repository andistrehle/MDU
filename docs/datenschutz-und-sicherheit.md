# Datenschutz- & Sicherheitskonzept — MDU-Plattform

> **Hinweis:** Dieses Dokument ist eine **interne technische Dokumentation**, keine
> Rechtsberatung. Vor dem offiziellen Livegang müssen die rechtlichen Texte
> (Datenschutzerklärung, Impressum) durch die MDU-Verantwortlichen geprüft und
> ggf. juristisch abgesichert werden. **TODO-Markierungen** kennzeichnen offene Punkte.

Stand: [Stand-Datum eintragen]

---

## 1. Verarbeitete Daten

| Datenkategorie | Quelle | Speicherort |
|---|---|---|
| E-Mail, Passwort-Hash | Registrierung | Supabase Auth (`auth.users`) |
| Anzeigename, Rolle, Spieler-/Team-Verknüpfung | Registrierung / Admin | Supabase `public.profiles` |
| Spitzname, „Über mich", Profilbild-URL | Spieler selbst | Supabase `public.player_profiles` |
| Teambeschreibung, Logo/Bild-URL, Social-Media | Teamkapitän/Admin | Supabase `public.team_profiles` |
| Spieler-/Team-/Liga-Stammdaten, Ergebnisse, Ranglisten | dartunion.de (öffentlich) | statisch im Code (`lib/data`) |
| Server-Logs (IP, Zeitstempel, Request) | automatisch | Vercel / Supabase (Infrastruktur) |

Passwörter werden **nicht** im Klartext gespeichert (Supabase Auth, gehasht). Im
Frontend werden **keine** Passwörter und **keine** Service-Keys gespeichert.

---

## 2. Sichtbarkeitskonzept

### Öffentlich (kein Login nötig)
Startseite, News, Ligen/Tabellen, Spielplan, Ergebnisse, Ranglisten/Einzelranglisten,
Teamprofile, Spielerprofile (Basis), Spielstätten, Downloads, Kontakt, Impressum,
Datenschutz.

### Nur eingeloggte Nutzer
Eigenes Profil bearbeiten (Spitzname, „Über mich", Profilbild-URL), Team-Bearbeitung
(nur eigener Kapitän), interne Bereiche unter „Mein Bereich".

### Nur berechtigte Rollen / Admins
Benutzer- & Rollenverwaltung, Saisonanmeldungen, Spielberichte-Freigabe, Teams-
Verwaltung, Admin-Dashboard. Siehe Rollenmatrix unten.

---

## 3. Rollen & Rechte (zentral in `lib/auth/roles.ts`)

| Rolle | Eigenes Profil | Eigenes Team | Benutzer sehen | Rollen vergeben | Verwaltung (Teams/Anmeldungen/Berichte) |
|---|---|---|---|---|---|
| `player` | ✅ | – | – | – | – |
| `team_captain` | ✅ | ✅ | – | – | – |
| `league_admin` | ✅ | ✅ (alle) | ✅ (nur lesen) | ❌ | ✅ |
| `super_admin` | ✅ | ✅ (alle) | ✅ | ✅ | ✅ |

Durchgesetzt über Helper: `canEditPlayerProfile`, `canEditTeam`, `canManageTeamPlayers`,
`canViewUsers`, `canManageRoles`/`isSuperAdmin`, `canManageLeague`, `canApproveMatchReports`.
Zusätzlich serverseitig über **Supabase Row Level Security** (siehe Abschnitt 5).

---

## 4. Externe Dienste

| Dienst | Zweck | Datenschutz-Relevanz |
|---|---|---|
| **Vercel** | Hosting / CDN / Server-Logs | Auftragsverarbeitung — TODO: AV-Vertrag prüfen |
| **Supabase** | Auth, Datenbank, später Storage | Auftragsverarbeitung, Region EU (Frankfurt) — TODO: AV-Vertrag prüfen |
| **GitHub** | Codeverwaltung (keine Nutzerdaten) | keine Endnutzerdaten |
| **dartunion.de** | Datenquelle (öffentliche Liga-Daten) | nur öffentlich verfügbare Daten |
| Claude / ChatGPT | nur Entwicklung | **kein** produktiver Nutzerdienst, keine Nutzerdaten |

TODO: Prüfen, ob Supabase/Vercel Daten außerhalb der EU verarbeiten (Sub-Prozessoren).

---

## 5. Datenbank-Sicherheit (Supabase RLS)

- RLS ist auf `profiles`, `player_profiles`, `team_profiles` **aktiviert**
  (siehe `supabase/schema.sql`, `supabase/migrations/0002_player_team_profiles.sql`).
- `profiles`: eigenes Profil lesen/eingeschränkt bearbeiten; **Rolle nicht selbst
  änderbar** (keine Selbst-Eskalation); Admins via `is_admin()`.
- `player_profiles`/`team_profiles`: öffentlich lesbar; schreiben nur eigener
  Spieler / eigener Team-Kapitän / Admin.
- Frontend nutzt **ausschließlich** den `anon`/publishable Key. Der `service_role`
  Key wird **nie** im Frontend verwendet.

---

## 6. Bildrechte & Upload-Regelung

- **Spielerbilder:** nur verwenden, wenn öffentlich vorhanden oder mit Zustimmung der
  Person. Korrektur/Löschung muss möglich sein → Kontakt siehe Datenschutzseite.
- **Mannschaftsbilder:** Upload nur durch Teamkapitän oder Admin. Der Kapitän muss die
  Zustimmung aller abgebildeten Personen sicherstellen. Keine fremden,
  urheberrechtlich geschützten Bilder.
- **Uploads (geplant):** erlaubte Formate jpg/png/webp (später pdf für Spielberichte),
  Größenlimit später definieren, rollenbasiert geschützt, keine sensiblen Dokumente
  öffentlich. Aktuell sind nur **Bild-URL-Felder** vorbereitet; direkter Upload
  (Supabase Storage) folgt — dann ist eine MIME-/Größenprüfung zu ergänzen (TODO).

---

## 7. Offene Punkte vor offiziellem Livegang (TODO)

- [ ] Datenschutzerklärung (`/datenschutz`) durch Verantwortliche/juristisch prüfen
- [ ] Impressum (`/impressum`) mit echten Daten füllen
- [ ] AV-Verträge mit Vercel und Supabase prüfen/abschließen
- [ ] Cookie-/Consent-Bedarf prüfen (aktuell nur technisch notwendige Auth-Cookies)
- [ ] Lösch-/Auskunftsprozess organisatorisch festlegen (Kontaktpostfach)
- [ ] Vor Upload-Feature: Storage-Bucket-Policies + Datei-Validierung
- [ ] E-Mail-Bestätigung in Supabase Auth aktiv lassen (Identitätssicherung)
