# Typografie-Angleichung an die MDC (Wiedererkennungswert)

**Wann:** 11.09.2026 · **Baseline-Commit davor:** `81b5cb4`
(„ISR-Writes senken…"). Wer zum Stand *vor* dieser Angleichung zurück will,
findet dort den unveränderten Aufbau.

## Ziel
MDU und MDC (mdc-ranking.de) sollen eine gemeinsame Typo-Signatur haben.
**Schrift und Schriftgrößen waren ohnehin schon identisch** (beide nutzen
Saira Condensed als Display- und Manrope als Fließtext-Schrift, zentral in
`app/layout.tsx`). Übernommen wurde nur **ein** sichtbares MDC-Element: der
**Kicker** (kondensierte Versalien, weite Laufweite, kurzer Balken davor —
auf der MDC z. B. „MÜNCHEN · EINZELRANGLISTE").

**Farbschema unverändert:** Der Kicker nutzt `--th-accent` (nicht hart rot),
also weiterhin die MDU-Akzentfarbe inkl. Hell-/Dunkel-Thema.

## Was genau geändert wurde (3 Stellen)

1. **`app/globals.css`** — neue Klasse `.mdu-kicker` (+ `::before`-Balken)
   hinzugefügt, direkt nach `.section-heading`. Rein additiv; ändert nichts an
   bestehenden Elementen.

2. **`components/mdu/page-banner.tsx`** — die Überzeile (`eyebrow`) nutzt jetzt
   `.mdu-kicker`. **Vorher** war es ein Inline-Style:
   ```jsx
   <div style={{
     fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
     letterSpacing: '0.2em', color: 'var(--th-accent)',
     textTransform: 'uppercase', marginBottom: 8,
   }}>{eyebrow}</div>
   ```

3. **`app/page.tsx`** — Startseiten-Hero: **eine neue Zeile** über dem Titel:
   ```jsx
   <div className="mdu-kicker" style={{ marginBottom: 16 }}>München · Dart-Liga</div>
   ```
   **Vorher** gab es dort keinen Kicker; der `<h1>` stand direkt im
   `.mdu-hero-inner`. Der Titel selbst (Saira Condensed 900, 96px, Versalien)
   ist **unverändert**.

## Zurückrollen
- **Ganz zurück (exakt der vorige Aufbau):**
  `git revert <Commit dieser Änderung>` — oder gezielt die drei Stellen oben
  auf die „Vorher"-Fassung zurücksetzen.
- **Nur den Hero-Kicker weglassen, Rest behalten:** die eine neue Zeile in
  `app/page.tsx` löschen.
- **Nur die Banner-Überzeile zurück:** in `page-banner.tsx` wieder den
  Inline-Style von oben einsetzen.
- Die Klasse `.mdu-kicker` in `globals.css` stört nichts, wenn sie ungenutzt
  bleibt; sie kann stehen bleiben oder entfernt werden.
