# Security-Checkliste — MDU-Plattform

Stand: [Stand-Datum eintragen] · Status: ✅ erfüllt · ⏳ vorbereitet/offen · 🔲 manuell zu testen

## Authentifizierung
- ✅ Login über Supabase (`signInWithPassword`)
- ✅ Logout beendet Session (`supabase.auth.signOut`) + UI zeigt wieder „Login"
- ✅ Passwort-Reset-Flow (`resetPasswordForEmail` → `/passwort-zuruecksetzen` → `updateUser`)
- ✅ Eingeloggter Nutzer bleibt nach Reload erkannt (`getSession` + `onAuthStateChange`)
- ✅ Nicht eingeloggte Nutzer sehen in internen Bereichen „Bitte einloggen" (kein Datenzugriff)
- 🔲 Manuell: E-Mail-Bestätigung in Supabase aktiv (Authentication → Providers → Email)

## Rollen / Autorisierung
- ✅ Zentrale Helper in `lib/auth/roles.ts`, keine verstreuten Hardcodes
- ✅ Spieler darf nur eigenes Profil bearbeiten (`canEditPlayerProfile`)
- ✅ Teamkapitän darf nur eigenes Team bearbeiten (`canEditTeam`)
- ✅ Ligaleitung: Verwaltungsbereiche; Benutzer nur lesen, **keine** Rollenvergabe
- ✅ Super Admin: Vollzugriff inkl. Rollenvergabe (`canManageRoles`)
- ✅ Falsche Rolle → „Keine Berechtigung", keine Formulare/Daten

## Datenbank (Supabase RLS)
- ✅ RLS aktiv auf `profiles`, `player_profiles`, `team_profiles`
- ✅ Keine Rollen-Selbsteskalation (`profiles_update_own` mit `with check`)
- ✅ Kein `service_role` Key im Frontend; nur `anon`/publishable Key clientseitig
- 🔲 Manuell: in Supabase prüfen, dass RLS bei allen drei Tabellen „Enabled" ist

## Indexierung / Sichtbarkeit
- ✅ `app/robots.ts` blockt interne Pfade (login, registrieren, passwort-*, mein-*, admin)
- ✅ Interne Routen via Layout-`metadata` auf `robots: { index:false, follow:false }`
- ✅ `app/sitemap.ts` enthält nur öffentliche Seiten (keine internen)
- 🔲 Manuell nach Deploy: `/<domain>/robots.txt` aufrufen und prüfen

## Uploads / Bildrechte
- ⏳ Upload (Storage) noch nicht produktiv — nur Bild-URL-Felder vorbereitet
- ✅ Bearbeitung der Bild-URLs nur durch Berechtigte (RLS + UI-Gate)
- ✅ Bildrechte-Hinweis dokumentiert (`docs/datenschutz-und-sicherheit.md`, Datenschutzseite)
- ⏳ Vor Upload: MIME-/Größen-Validierung + Bucket-Policies ergänzen

## Recht / Dokumente
- ⏳ `/datenschutz` als Vorlage mit Platzhaltern — TODO: final prüfen
- ⏳ `/impressum` als Vorlage mit Platzhaltern — TODO: echte Daten + prüfen
- ✅ Registrierung verlinkt Datenschutzerklärung

## Manuelle Rollentests (Durchführung dokumentieren)
- 🔲 Gast: interne Routen → „Bitte einloggen"
- 🔲 Spieler: nur eigenes Profil editierbar
- 🔲 Teamkapitän: nur eigenes Team; Admin-Route → „Keine Berechtigung"
- 🔲 Ligaleitung: Verwaltung sichtbar; Benutzer nur lesen
- 🔲 Super Admin: alles
