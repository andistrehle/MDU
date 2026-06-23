'use client';

// ============================================================
// Offizieller MDU-Spielbericht — druckbare A4-Vorlage (Phase 0)
// ============================================================
//
// Druckoptimierte HTML-Ansicht des klassischen MDU-Spielberichts zum
// Ausdrucken und handschriftlichen Ausfüllen. Zwei A4-Seiten:
//   Seite 1  Kopf (Kästchen-Stil) · Mannschaften · Aufstellung ·
//            Spielablauf (2 Spalten) · Gesamtergebnis
//   Seite 2  Highlights (Heim/Gast) · Bemerkungen · Bestätigung
//
// Struktur 1:1 aus dem digitalen Bogen (lib/supabase/match-reports.ts):
//   18 Spiele, Doppel Nr. 9 (Mitte) + Nr. 18 (Ende), 4 Stamm + 4 Ersatz.
//
// Bewusst eigene, druckfeste Farben (#fff/#111/#000) statt Theme-Variablen,
// damit der Ausdruck unabhängig vom Dark/Light-Mode sauber in Schwarz-Weiß
// funktioniert. Optionaler Header-Prefill über Query-Params (siehe PREFILL).
// ============================================================

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GAME_SCHEDULE, HIGHLIGHT_TYPE_LABELS, HIGHLIGHT_TYPES } from '@/lib/supabase/match-reports';
import { TEMPLATE_VERSION, TEMPLATE_SEASON_NAME, templateDocTitle, templateFooter } from '@/lib/spielbericht-template';

/** Ligen als Ankreuz-Kästchen im Kopf (ohne D-Liga). */
const LEAGUES = ['La-Liga', 'A-Liga', 'B-Liga', 'C-Liga'];

// Optionale Vorbelegung (nur Kopfdaten — niemals Ergebnisse, niemals
// ungeprüfte Aufstellungen). Bleibt sichtbar, kann handschriftlich geändert
// werden. Beispiel: /spielberichte/vorlage?liga=A-Liga&heim=Alptraum&datum=2026-09-15
interface Prefill {
  liga: string; spieltag: string; datum: string; uhrzeit: string;
  heim: string; gast: string; ort: string; tcHeim: string; tcGast: string; id: string;
}
function readPrefill(sp: URLSearchParams): Prefill {
  const g = (k: string) => (sp.get(k) ?? '').trim();
  // Datum ggf. von ISO (YYYY-MM-DD) in DD.MM.YYYY für die Vorlage umwandeln.
  const rawDate = g('datum');
  const datum = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate.split('-').reverse().join('.')
    : rawDate;
  return {
    liga: g('liga'), spieltag: g('spieltag'), datum, uhrzeit: g('uhrzeit'),
    heim: g('heim'), gast: g('gast'), ort: g('ort'),
    tcHeim: g('tcHeim'), tcGast: g('tcGast'), id: g('id'),
  };
}

export default function SpielberichtVorlagePage() {
  return (
    <Suspense fallback={null}>
      <VorlageInner />
    </Suspense>
  );
}

function VorlageInner() {
  const sp = useSearchParams();
  const pf = readPrefill(new URLSearchParams(sp.toString()));
  const autoPrint = sp.get('print') === '1';

  // Drucken: Default-Dateiname direkt vor dem Druck setzen (Next.js setzt den
  // Metadaten-Titel nach der Hydration zurück, daher hier statt im useEffect).
  const printSheet = () => {
    document.title = templateDocTitle();
    window.print();
  };

  // Optionales Direkt-Drucken (?print=1) — nach dem ersten Paint.
  useEffect(() => {
    if (!autoPrint) return;
    const t = setTimeout(() => { document.title = templateDocTitle(); window.print(); }, 350);
    return () => clearTimeout(t);
  }, [autoPrint]);

  return (
    <div className="mdu-vorlage-wrap">
      <style>{PRINT_CSS}</style>

      {/* Bildschirm-Toolbar (wird nicht mitgedruckt) */}
      <div className="mdu-no-print mdu-vorlage-toolbar">
        <Link href="/downloads" className="mdu-vorlage-back">← Downloads</Link>
        <div className="mdu-vorlage-toolbar-actions">
          <span className="mdu-vorlage-hint">Tipp: im Druckdialog „Als PDF speichern" wählen · Format A4</span>
          <button type="button" onClick={printSheet} className="mdu-vorlage-print">
            Als PDF speichern / drucken
          </button>
        </div>
      </div>

      {/* ── Seite 1 ──────────────────────────────────────────── */}
      <section className="mdu-sheet">
        <Header pf={pf} />

        {/* Kopfdaten — Kästchen-Stil */}
        <div className="vb-meta">
          <div className="vb-meta-leagues">
            <span className="vb-meta-label">Liga / Staffel</span>
            {LEAGUES.map(l => <Checkbox key={l} label={l} checked={pf.liga === l} />)}
          </div>
          <div className="vb-meta-row">
            <BoxField label="Spieltag" value={pf.spieltag} w={64} />
            <BoxField label="Datum" value={pf.datum} w={120} />
          </div>
          <BoxField label="Spielstätte" value={pf.ort} grow />
        </div>

        {/* Mannschaften */}
        <SectionTitle>Mannschaften</SectionTitle>
        <div className="vb-twocol">
          <TeamBlock side="Heimmannschaft" team={pf.heim} captain={pf.tcHeim} />
          <TeamBlock side="Gastmannschaft" team={pf.gast} captain={pf.tcGast} />
        </div>

        {/* Aufstellung */}
        <SectionTitle>Aufstellung <span className="vb-sub">(1–4 Stamm · 5–8 Ersatz)</span></SectionTitle>
        <div className="vb-twocol">
          <Lineup prefix="H" title="Heim" />
          <Lineup prefix="G" title="Gast" />
        </div>
        <p className="vb-note">
          Eingetragene Spielpositionen sind verbindlich. Ein ausgewechselter Spieler darf nur auf
          derselben Position wieder eingewechselt werden (ein für H3 eingewechselter Spieler spielt
          nicht später für H4); auf einer Position können jedoch mehrere Spieler:innen eingesetzt werden.
          Wechsel direkt im Spielablauf vermerken (neue Nummer über die alte schreiben).
        </p>

        {/* Spielablauf — zwei Spalten */}
        <SectionTitle>Spielablauf <span className="vb-sub">(Best of 3 Legs · Doppel Nr. 9 + Nr. 18)</span></SectionTitle>
        <div className="vb-twocol vb-games-2col">
          <GameTable rows={GAME_SCHEDULE.slice(0, 9)} />
          <GameTable rows={GAME_SCHEDULE.slice(9, 18)} />
        </div>
        <p className="vb-note">Punkte je Einzel: 2:0 = 3 · 2:1 = 2 · 1:2 = 1 · 0:2 = 0 · Doppel zählen nur für Spiele/Legs.</p>

        {/* Gesamtergebnis */}
        <div className="vb-result">
          <span className="vb-result-label">Gesamtergebnis</span>
          <span className="vb-result-line">
            Heim&nbsp;<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>&nbsp;:&nbsp;<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>&nbsp;Gast
          </span>
          <span className="vb-result-hint">
            Tabellenpunkte: Sieg = 3 · Unentschieden = je 1 · Niederlage = 0.<br />
            Tabellenpunkte, Legs und Einzelranglistenpunkte werden vom System automatisch berechnet.
          </span>
        </div>

        <PageFooter page={1} />
      </section>

      {/* ── Seite 2 (füllt eine volle A4-Seite) ──────────────── */}
      <section className="mdu-sheet mdu-sheet-fill">
        <Header pf={pf} />

        {/* Highlights */}
        <SectionTitle>Highlights</SectionTitle>
        <p className="vb-note">
          {HIGHLIGHT_TYPES.map(t => HIGHLIGHT_TYPE_LABELS[t]).join(' · ')} — 180er/171er als Strichliste in „Anzahl" zählen,
          High Finish = Checkout-Wert (≥ 100), Short Leg = Anzahl Darts (max. 20). Spieler über Position eintragen (z. B. H3 / G2).
        </p>
        <div className="vb-twocol">
          <HighlightBlock side="Heim" prefix="H" />
          <HighlightBlock side="Gast" prefix="G" />
        </div>

        {/* Bemerkungen */}
        <SectionTitle>Bemerkungen / besondere Vorkommnisse</SectionTitle>
        <p className="vb-note">z. B. verspäteter Spielbeginn, unvollständige Mannschaft, Protest, technischer Defekt, abweichende Spielstätte.</p>
        <div className="vb-remarks" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="vb-remarks-line" />)}
        </div>
        <div className="vb-protest">
          <span className="vb-protest-label">Protest eingelegt</span>
          <Checkbox label="ja" checked={false} />
          <Checkbox label="nein" checked={false} />
          <span className="vb-protest-hint">(Grund unter Bemerkungen angeben)</span>
        </div>

        {/* Bestätigung */}
        <SectionTitle>Bestätigung</SectionTitle>
        <p className="vb-note">Mit ihrer Unterschrift bestätigen beide Teamkapitäne die Richtigkeit des Spielberichts.</p>
        <div className="vb-signrow">
          <SignLine label="Unterschrift Teamkapitän Heim" />
          <SignLine label="Unterschrift Teamkapitän Gast" />
        </div>
        <div className="vb-signrow">
          <SignLine label="Unterschrift Ligaleitung / Spielleitung (optional)" />
          <SignLine label="Datum" />
        </div>

        {/* Allgemeine Hinweise */}
        <SectionTitle>Allgemeine Hinweise</SectionTitle>
        <ul className="vb-hints">
          <li>Den ausgefüllten Spielbericht eigenständig im Login-Bereich der MDU-Homepage hochladen. Bei Problemen alternativ per E-Mail oder WhatsApp an die Ligaleitung übermitteln.</li>
          <li>Die mit diesem Spielbericht erhobenen personenbezogenen Daten werden ausschließlich zur Durchführung des Spielbetriebs verarbeitet. Es gelten die Datenschutzrichtlinien der Münchner Dart Union (siehe Datenschutzerklärung auf der MDU-Homepage).</li>
        </ul>

        <PageFooter page={2} />
      </section>
    </div>
  );
}

// ── Kopf ────────────────────────────────────────────────────────
function Header({ pf }: { pf: Prefill }) {
  return (
    <header className="vb-header">
      <div className="vb-header-text">
        <div className="vb-org">Münchner Dart Union</div>
        <div className="vb-title">Offizieller Spielbericht</div>
        <div className="vb-season">{TEMPLATE_SEASON_NAME}</div>
      </div>
      {/* Transparentes Logo (kein blauer Hintergrund) — zentriert */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mdu-logo.webp" alt="Münchner Dart Union" className="vb-logo" />
      <div className="vb-header-meta">
        <div>Vorlage v{TEMPLATE_VERSION}</div>
        <div className="vb-id">Spielbericht-ID: <u>{pf.id || '            '}</u></div>
      </div>
    </header>
  );
}

// ── Aufstellung ─────────────────────────────────────────────────
function Lineup({ prefix, title }: { prefix: string; title: string }) {
  return (
    <table className="vb-table vb-lineup">
      <thead>
        <tr>
          <th style={{ width: '12%' }}>{title}</th>
          <th>Vorname</th>
          <th>Nachname</th>
          <th style={{ width: '22%' }}>Pass-Nr.</th>
        </tr>
      </thead>
      <tbody>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
          <tr key={n} className={n > 4 ? 'vb-sub-row' : undefined}>
            <td className="vb-pos">{prefix}{n}</td>
            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Spielablauf (Teilmenge von GAME_SCHEDULE) ───────────────────
function GameTable({ rows }: { rows: typeof GAME_SCHEDULE }) {
  return (
    <table className="vb-table vb-games">
      <thead>
        <tr>
          <th style={{ width: '9%' }}>Nr.</th>
          <th style={{ width: '28%' }}>Heim</th>
          <th style={{ width: '28%' }}>Gast</th>
          <th style={{ width: '35%' }} colSpan={2}>Legs (H : G)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(s => {
          const isDouble = s.type === 'double';
          return (
            <tr key={s.no} className={isDouble ? 'vb-double-row' : undefined}>
              <td className="vb-gameno">{s.no}</td>
              <td className="vb-pair">{isDouble ? 'H_ + H_' : `H${s.homeSlot}`}</td>
              <td className="vb-pair">{isDouble ? 'G_ + G_' : `G${s.guestSlot}`}</td>
              <td className="vb-leg">&nbsp;</td>
              <td className="vb-leg">&nbsp;</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Highlights (Heim/Gast) ──────────────────────────────────────
function HighlightBlock({ side, prefix }: { side: string; prefix: string }) {
  return (
    <table className="vb-table vb-hl">
      <thead>
        <tr><th colSpan={3} className="vb-hl-head">Highlights {side}</th></tr>
        <tr>
          <th style={{ width: '20%' }}>Spieler</th>
          <th>Leistung</th>
          <th style={{ width: '30%' }}>Wert / Anzahl</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 7 }).map((_, i) => (
          <tr key={i}>
            <td className="vb-hl-pos">{prefix}</td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Kleine Bausteine ────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="vb-section">{children}</h2>;
}

function Checkbox({ label, checked }: { label: string; checked: boolean }) {
  return (
    <span className="vb-cb">
      <span className="vb-cb-box">{checked ? '×' : ' '}</span>{label}
    </span>
  );
}

function BoxField({ label, value, w, grow }: { label: string; value?: string; w?: number; grow?: boolean }) {
  return (
    <div className={`vb-bf${grow ? ' vb-bf-grow' : ''}`}>
      <span className="vb-bf-label">{label}</span>
      <span className="vb-bf-box" style={w ? { width: w } : undefined}>{value || ' '}</span>
    </div>
  );
}

function TeamBlock({ side, team, captain }: { side: string; team: string; captain: string }) {
  return (
    <div className="vb-teamblock">
      <div className="vb-teamblock-head">{side}</div>
      <WriteLine caption="Teamname" value={team} />
      <WriteLine caption="Teamkapitän" value={captain} />
    </div>
  );
}

/** Schreiblinie oben, Bezeichnung darunter (klassischer Formular-Stil). */
function WriteLine({ caption, value }: { caption: string; value?: string }) {
  return (
    <div className="vb-wl">
      <div className="vb-wl-line">{value || ' '}</div>
      <div className="vb-wl-cap">{caption}</div>
    </div>
  );
}

function SignLine({ label }: { label: string }) {
  return (
    <div className="vb-sign">
      <div className="vb-sign-line">&nbsp;</div>
      <div className="vb-sign-caption">{label}</div>
    </div>
  );
}

function PageFooter({ page }: { page: number }) {
  return (
    <footer className="vb-footer">
      <span>{templateFooter()}</span>
      <span>Seite {page} / 2</span>
    </footer>
  );
}

// ── Druck-/Bildschirm-CSS (druckfest, A4) ───────────────────────
const PRINT_CSS = `
.mdu-vorlage-wrap { background:#e9eaee; min-height:100vh; padding:20px 12px 60px; }
.mdu-sheet {
  background:#fff; color:#111; box-sizing:border-box;
  width:210mm; max-width:100%; margin:0 auto 22px; padding:15mm;
  box-shadow:0 2px 16px rgba(0,0,0,.22);
  font-family:var(--font-manrope), system-ui, Arial, sans-serif;
  font-size:9.5pt; line-height:1.25;
}
/* Seite 2 füllt eine volle A4-Seite: Inhalt wird über die Höhe verteilt,
   die Bemerkungen dehnen sich als flexibler Füller. */
.mdu-sheet-fill { display:flex; flex-direction:column; min-height:297mm; }
.mdu-sheet-fill .vb-remarks { flex:1 1 auto; justify-content:space-between; min-height:60px; }

/* Toolbar (nur Bildschirm) */
.mdu-vorlage-toolbar {
  max-width:210mm; margin:0 auto 14px; display:flex; align-items:center;
  justify-content:space-between; gap:12px; flex-wrap:wrap;
  font-family:var(--font-manrope), system-ui, sans-serif;
}
.mdu-vorlage-back { color:#1f4fd6; font-weight:700; font-size:13px; text-decoration:none; }
.mdu-vorlage-toolbar-actions { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.mdu-vorlage-hint { color:#444; font-size:12px; }
.mdu-vorlage-print {
  padding:10px 18px; border-radius:8px; cursor:pointer; border:1px solid #b00000;
  background:#d40000; color:#fff; font-weight:800; font-size:13px;
  font-family:var(--font-manrope), system-ui, sans-serif;
}

/* Kopf — Logo zentriert zwischen Titel (links) und Meta (rechts) */
.vb-header { display:flex; align-items:center; gap:12px; border-bottom:2.5px solid #000; padding-bottom:7px; position:relative; }
.vb-header-text { flex:1.45; min-width:0; }
.vb-logo { height:46px; width:auto; flex-shrink:0; }
.vb-org { font-size:8.5pt; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#333; margin-bottom:2px; }
.vb-title { font-family:var(--font-saira-condensed), var(--font-manrope), sans-serif; font-weight:900; font-size:19pt; letter-spacing:.01em; text-transform:uppercase; line-height:1; }
.vb-season { font-size:9pt; font-weight:700; color:#333; margin-top:3px; }
.vb-header-meta { flex:1; text-align:right; font-size:7.7pt; color:#444; line-height:1.4; white-space:nowrap; }
.vb-header-meta .vb-id u { letter-spacing:.04em; }

/* Kopfdaten — Kästchen-Stil */
.vb-meta { display:flex; flex-direction:column; gap:8px; margin-top:13px; border:1.2px solid #000; padding:9px 11px; }
.vb-meta-leagues { display:flex; align-items:center; gap:8px 16px; flex-wrap:wrap; }
.vb-meta-label { font-size:7.8pt; font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
.vb-cb { display:inline-flex; align-items:center; gap:5px; font-size:9.5pt; font-weight:600; }
.vb-cb-box { width:13px; height:13px; border:1.3px solid #000; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; line-height:1; }
.vb-meta-row { display:flex; gap:8px 18px; flex-wrap:wrap; }
.vb-bf { display:flex; align-items:center; gap:7px; }
.vb-bf-grow { flex:1; }
.vb-bf-label { font-size:7.8pt; font-weight:800; text-transform:uppercase; letter-spacing:.04em; white-space:nowrap; }
.vb-bf-box { border:1px solid #000; min-height:17px; min-width:54px; padding:2px 6px; font-size:10pt; }
.vb-bf-grow .vb-bf-box { flex:1; }

/* Abschnittstitel */
.vb-section { font-family:var(--font-manrope), sans-serif; font-weight:800; font-size:9.5pt; letter-spacing:.06em; text-transform:uppercase; color:#111; margin:9px 0 4px; padding-bottom:2px; border-bottom:1px solid #000; }
.vb-section .vb-sub { font-weight:600; text-transform:none; letter-spacing:0; color:#555; font-size:8.5pt; }

/* Zwei-Spalten */
.vb-twocol { display:flex; gap:12px; }
.vb-twocol > * { flex:1; min-width:0; }

/* Mannschaftsblock — Schreiblinie oben, Bezeichnung darunter */
.vb-teamblock { border:1px solid #000; padding:9px 11px 11px; }
.vb-teamblock-head { font-weight:800; font-size:9pt; text-transform:uppercase; letter-spacing:.05em; }
.vb-wl { margin-top:9px; }
.vb-wl-line { border-bottom:1px solid #000; min-height:19px; font-size:11pt; padding:0 2px 1px; }
.vb-wl-cap { font-size:7.4pt; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#555; margin-top:2px; }

/* Tabellen */
.vb-table { width:100%; border-collapse:collapse; margin-top:2px; }
.vb-table th, .vb-table td { border:1px solid #000; padding:2px 5px; text-align:left; vertical-align:middle; }
.vb-table th { font-size:7.6pt; font-weight:800; text-transform:uppercase; letter-spacing:.03em; background:#f0f0f0; }
.vb-table td { height:15px; font-size:9.5pt; }
.vb-lineup .vb-pos, .vb-games .vb-gameno { font-weight:800; font-family:var(--font-jetbrains-mono), monospace; }
.vb-lineup .vb-sub-row .vb-pos { color:#555; font-weight:700; }
.vb-lineup .vb-sub-row td { background:#fafafa; }
.vb-games .vb-double-row td { background:#f0f0f0; }
.vb-games .vb-pair { font-family:var(--font-jetbrains-mono), monospace; font-weight:700; }
/* Leg-Ergebnis: zwei gleich breite Felder, getrennt durch die Zellenlinie (H | G). */
.vb-games .vb-leg { width:17.5%; text-align:center; }

/* Highlights */
.vb-hl .vb-hl-head { text-align:left; font-size:8.4pt; background:#e6e6e6; }
.vb-hl .vb-hl-pos { font-family:var(--font-jetbrains-mono), monospace; font-weight:800; }

/* Gesamtergebnis */
.vb-result { margin-top:9px; border:1.5px solid #000; padding:7px 14px; display:flex; align-items:center; gap:18px; flex-wrap:wrap; }
.vb-result-label { font-weight:800; font-size:9.5pt; text-transform:uppercase; letter-spacing:.06em; }
.vb-result-line { font-family:var(--font-saira-condensed), sans-serif; font-weight:900; font-size:16pt; }
.vb-result-hint { margin-left:auto; max-width:50%; font-size:7.6pt; color:#555; line-height:1.4; }

/* Notizen / Hinweise */
.vb-note { font-size:8pt; color:#444; margin:4px 0 4px; line-height:1.35; }

/* Bemerkungen */
.vb-remarks { display:flex; flex-direction:column; gap:22px; margin-top:10px; }
.vb-remarks-line { border-bottom:1px solid #000; height:1px; }

/* Protest */
.vb-protest { display:flex; align-items:center; gap:16px; margin-top:11px; }
.vb-protest-label { font-size:8.5pt; font-weight:800; text-transform:uppercase; letter-spacing:.04em; }
.vb-protest-hint { font-size:7.6pt; color:#666; }

/* Allgemeine Hinweise */
.vb-hints { margin:5px 0 0; padding-left:16px; }
.vb-hints li { font-size:8pt; color:#444; line-height:1.45; margin-bottom:4px; }

/* Unterschriften */
.vb-signrow { display:flex; gap:24px; margin-top:24px; }
.vb-sign { flex:1; }
.vb-sign-line { border-bottom:1px solid #000; min-height:36px; }
.vb-sign-caption { font-size:7.5pt; color:#555; margin-top:3px; }

/* Fußzeile */
.vb-footer { display:flex; justify-content:space-between; font-size:7.3pt; color:#666; border-top:1px solid #000; margin-top:14px; padding-top:4px; }

/* ── Druck ──────────────────────────────────────────────── */
@media print {
  @page { size:A4; margin:15mm; }
  html, body { background:#fff !important; }
  .mdu-vorlage-wrap { background:#fff; padding:0; }
  .mdu-sheet { width:auto; max-width:none; margin:0; padding:0; box-shadow:none; }
  /* Im Druck entspricht die nutzbare Höhe der Seite dem A4-Satzspiegel (297 - 2×15mm). */
  .mdu-sheet-fill { min-height:267mm; }
  .mdu-sheet + .mdu-sheet { page-break-before:always; }
  .vb-table, .vb-teamblock, .vb-result, .vb-signrow, tr { page-break-inside:avoid; }
  .vb-table th, .vb-cb-box, .vb-double-row td, .vb-hl-head { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
}
`;
