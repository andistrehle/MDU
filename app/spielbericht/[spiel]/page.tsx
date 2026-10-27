import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { alleBegegnungen27, team27, venue27, findLiga27, datumText, NEUE_SAISON } from '@/lib/data/saison-2027';
import { ladeBericht27, type Bericht27 } from '@/lib/server/ergebnisse-2027';
import { HIGHLIGHT_TYPE_LABELS, type HighlightType } from '@/lib/supabase/match-reports';
import { pointsForLegs } from '@/lib/legs';
import { passtSlug } from '@/lib/spieltag';

// ============================================================
// Öffentlicher Spielbericht 2026/27 (Betreiber, 23.10.2026)
// ============================================================
// Aufbau wie der Papierbogen (app/spielberichte/vorlage): Kopf, Mannschaften,
// Aufstellung H1–H8 / G1–G8, Spielablauf 1–18 (Doppel 9 + 18) mit
// Zwischenstand, Gesamtergebnis, Highlights. Dazu je Spieler die
// Einzelranglisten-Punkte des Abends. Bewusst NICHT: Passnummern,
// Teamkapitäne, Bemerkungen/Protest, Unterschriften, Fotos.
//
// Erreichbar über jedes Ergebnis 2026/27 (berichtPfad) und aus dem
// Spielerprofil (springt per #spiel-<nr> auf die Partie). Gebaut beim ersten
// Aufruf, danach statisch; /api/match-reports/published markiert neu.
// ============================================================

type Params = { params: Promise<{ spiel: string }> };

export function generateStaticParams() { return []; }

const finde = (spiel: string) => alleBegegnungen27().find(b => passtSlug(b.key, spiel)) ?? null;
const teamName = (id: string) => team27(id)?.name ?? id;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const b = finde((await params).spiel);
  if (!b) return {};
  return { title: `Spielbericht ${teamName(b.home)} – ${teamName(b.away)}` };
}

type Seite = 'home' | 'guest';
const P = (side: Seite) => (side === 'home' ? 'H' : 'G');

export default async function SpielberichtPage({ params }: Params) {
  const b = finde((await params).spiel);
  if (!b) notFound();
  const r = await ladeBericht27(b.key);
  if (!r) notFound();
  const { e } = r;
  const liga = findLiga27(b.liga);
  const ort = venue27(team27(e.home)?.venueId);

  // Einzelranglisten-Punkte des Abends je Position (nur Einzel).
  const punkte = new Map<string, number>();
  for (const s of r.spiele) {
    if (s.doppel || s.legsHeim == null || s.legsGast == null) continue;
    const add = (k: string, n: number) => punkte.set(k, (punkte.get(k) ?? 0) + n);
    if (s.heim[0] != null) add(`home:${s.heim[0]}`, pointsForLegs(s.legsHeim, s.legsGast));
    if (s.gast[0] != null) add(`guest:${s.gast[0]}`, pointsForLegs(s.legsGast, s.legsHeim));
  }
  // Zwischenstand nach jedem Spiel.
  let zh = 0, zg = 0;
  const zwischen = new Map<number, string>();
  for (const s of r.spiele) {
    if (s.legsHeim != null && s.legsGast != null) {
      if (s.legsHeim > s.legsGast) zh += 1; else if (s.legsGast > s.legsHeim) zg += 1;
      zwischen.set(s.nr, `${zh}:${zg}`);
    }
  }
  const halbe = Math.ceil(r.spiele.length / 2);

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <style>{CSS}</style>
      <DesktopHeader activeHref="/ergebnisse" />
      <div className="sb-wrap">
        {/* Kopf */}
        <div className="sb-kopf">
          <div>
            <div className="sb-org">Münchner Dart Union</div>
            <h1 className="sb-titel">Spielbericht</h1>
            <div className="sb-saison">Saison {NEUE_SAISON.name.replace(/^Saison\s*/, '')}</div>
          </div>
          {!e.bestaetigt && <span className="sb-offen">* vom Gegner noch nicht bestätigt</span>}
          {r.korrekturAngefragt && <span className="sb-offen">Korrektur angefragt – bis zur Bestätigung gilt dieser Stand</span>}
        </div>
        <div className="sb-meta">
          <Feld label="Liga" wert={liga?.name ?? b.liga} />
          <Feld label="Spieltag" wert={String(b.spieltag)} />
          <Feld label="Datum" wert={e.datum ? datumText(e.datum) : '–'} />
          <Feld label="Spielstätte" wert={ort?.name ?? '–'} breit />
        </div>

        {/* Mannschaften + Gesamtergebnis */}
        <Titel>Mannschaften</Titel>
        <div className="sb-teams">
          <Link href={`/teams/${e.home}`} className="sb-team"><span className="sb-cap">Heim</span>{teamName(e.home)}</Link>
          <div className="sb-stand">{e.spieleHome}:{e.spieleAway}</div>
          <Link href={`/teams/${e.away}`} className="sb-team sb-rechts"><span className="sb-cap">Gast</span>{teamName(e.away)}</Link>
        </div>

        {/* Aufstellung */}
        <Titel>Aufstellung <span className="sb-sub">(1–4 Stamm · 5–8 Ersatz · Pkt. = Einzelranglisten-Punkte des Abends)</span></Titel>
        <div className="sb-zwei">
          <Aufstellung r={r} side="home" punkte={punkte} />
          <Aufstellung r={r} side="guest" punkte={punkte} />
        </div>

        {/* Spielablauf */}
        <Titel>Spielablauf <span className="sb-sub">({liga?.code === 'la' ? 'Best of 5' : 'Best of 3'} Legs · Doppel Nr. 9 + Nr. 18)</span></Titel>
        <div className="sb-zwei">
          <Spieltabelle r={r} spiele={r.spiele.slice(0, halbe)} zwischen={zwischen} />
          <Spieltabelle r={r} spiele={r.spiele.slice(halbe)} zwischen={zwischen} />
        </div>

        {/* Gesamtergebnis */}
        <Titel>Gesamtergebnis</Titel>
        <table className="sb-tab sb-gesamt">
          <thead><tr><th></th><th>Heim</th><th>Gast</th></tr></thead>
          <tbody>
            <tr><td>Spiele</td><td>{e.spieleHome}</td><td>{e.spieleAway}</td></tr>
            <tr><td>Legs</td><td>{e.legsHome}</td><td>{e.legsAway}</td></tr>
            <tr><td>Tabellenpunkte</td><td>{e.ptsHome}</td><td>{e.ptsAway}</td></tr>
          </tbody>
        </table>

        {/* Highlights */}
        <Titel>Highlights</Titel>
        <div className="sb-zwei">
          <Highlights r={r} side="home" />
          <Highlights r={r} side="guest" />
        </div>

        <div className="sb-fuss">
          <Link href={`/ligen/${b.liga}`}>Zur Tabelle der {liga?.name ?? 'Liga'} →</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Titel({ children }: { children: React.ReactNode }) {
  return <h2 className="sb-abschnitt">{children}</h2>;
}

function Feld({ label, wert, breit }: { label: string; wert: string; breit?: boolean }) {
  return (
    <div className={`sb-feld${breit ? ' sb-breit' : ''}`}>
      <span className="sb-cap">{label}</span>
      <span className="sb-wert">{wert}</span>
    </div>
  );
}

function SpielerName({ r, side, slot }: { r: Bericht27; side: Seite; slot: number }) {
  const p = r.spieler.find(x => x.side === side && x.slot === slot);
  if (!p) return <span className="sb-leer">–</span>;
  return p.playerId ? <Link href={`/spieler/${p.playerId}`}>{p.name}</Link> : <>{p.name}</>;
}

function Aufstellung({ r, side, punkte }: { r: Bericht27; side: Seite; punkte: Map<string, number> }) {
  return (
    <table className="sb-tab">
      <thead><tr><th style={{ width: 44 }}>{side === 'home' ? 'Heim' : 'Gast'}</th><th>Name</th><th style={{ width: 48, textAlign: 'right' }}>Pkt.</th></tr></thead>
      <tbody>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => {
          const p = r.spieler.find(x => x.side === side && x.slot === n);
          const pk = punkte.get(`${side}:${n}`);
          return (
            <tr key={n} className={n > 4 ? 'sb-ersatz' : undefined}>
              <td className="sb-pos">{P(side)}{n}</td>
              <td>{p ? <SpielerName r={r} side={side} slot={n} /> : <span className="sb-leer">–</span>}</td>
              <td style={{ textAlign: 'right' }} className="sb-zahl">{pk ?? (p ? '–' : '')}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Spieltabelle({ r, spiele, zwischen }: { r: Bericht27; spiele: Bericht27['spiele']; zwischen: Map<number, string> }) {
  const Paar = ({ side, slots }: { side: Seite; slots: number[] }) => (
    <div className="sb-paar">
      {slots.length ? slots.map(s => (
        <div key={s}><span className="sb-pos">{P(side)}{s}</span> <SpielerName r={r} side={side} slot={s} /></div>
      )) : <span className="sb-leer">–</span>}
    </div>
  );
  return (
    <table className="sb-tab sb-spiele">
      <thead>
        <tr><th style={{ width: 34 }}>Nr.</th><th>Heim</th><th>Gast</th><th style={{ width: 52, textAlign: 'center' }}>Legs</th><th style={{ width: 52, textAlign: 'center' }}>Stand</th></tr>
      </thead>
      <tbody>
        {spiele.map(s => {
          const fertig = s.legsHeim != null && s.legsGast != null;
          const hs = fertig && s.legsHeim! > s.legsGast!, gs = fertig && s.legsGast! > s.legsHeim!;
          return (
            <tr key={s.nr} id={`spiel-${s.nr}`} className={`sb-spiel${s.doppel ? ' sb-doppel' : ''}`}>
              <td className="sb-nr">{s.nr}{s.doppel && <div className="sb-dlabel">Doppel</div>}</td>
              <td className={hs ? 'sb-sieg' : gs ? 'sb-nieder' : undefined}><Paar side="home" slots={s.heim} /></td>
              <td className={gs ? 'sb-sieg' : hs ? 'sb-nieder' : undefined}><Paar side="guest" slots={s.gast} /></td>
              <td className="sb-zahl" style={{ textAlign: 'center', fontWeight: 800 }}>{fertig ? `${s.legsHeim}:${s.legsGast}` : '–'}</td>
              <td className="sb-zahl" style={{ textAlign: 'center', color: 'var(--th-text-muted)' }}>{zwischen.get(s.nr) ?? '–'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Highlights({ r, side }: { r: Bericht27; side: Seite }) {
  const liste = r.highlights.filter(h => h.side === side && h.value != null);
  return (
    <table className="sb-tab">
      <thead><tr><th colSpan={3}>Highlights {side === 'home' ? 'Heim' : 'Gast'}</th></tr></thead>
      <tbody>
        {liste.length ? liste.map((h, i) => (
          <tr key={i}>
            <td style={{ width: 120 }}><span className="sb-pos">{P(side)}{h.slot}</span> <SpielerName r={r} side={side} slot={h.slot} /></td>
            <td>{HIGHLIGHT_TYPE_LABELS[h.type as HighlightType] ?? h.type}</td>
            <td className="sb-zahl" style={{ textAlign: 'right' }}>{h.type === '180' || h.type === '171' ? `× ${h.value}` : h.type === 'short_leg' ? `${h.value} Darts` : h.value}</td>
          </tr>
        )) : <tr><td colSpan={3} className="sb-leer">Keine eingetragen.</td></tr>}
      </tbody>
    </table>
  );
}

const CSS = `
.sb-wrap{max-width:1000px;margin:0 auto;padding:24px 16px 64px;font-family:var(--font-manrope)}
.sb-kopf{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;border-bottom:2px solid var(--th-text-strong);padding-bottom:10px}
.sb-org{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--th-text-dim)}
.sb-titel{font-family:var(--font-saira-condensed);font-weight:900;font-size:30px;line-height:1.05;margin:2px 0 0;text-transform:uppercase;letter-spacing:.02em}
.sb-saison{font-size:12.5px;color:var(--th-text-muted);margin-top:2px}
.sb-offen{font-size:12.5px;font-weight:800;color:#9A6B00}
.sb-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) minmax(0,2fr);gap:8px;margin-top:12px}
.sb-feld{border:1px solid var(--th-line-8);border-radius:8px;padding:6px 10px;background:var(--th-bg-card);min-width:0}
.sb-cap{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--th-text-dim)}
.sb-wert{display:block;font-weight:700;font-size:14px;margin-top:2px;overflow-wrap:anywhere}
.sb-abschnitt{font-family:var(--font-saira-condensed);font-weight:800;font-size:17px;text-transform:uppercase;letter-spacing:.06em;margin:26px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--th-line-8)}
.sb-sub{font-family:var(--font-manrope);font-weight:600;font-size:11.5px;text-transform:none;letter-spacing:0;color:var(--th-text-muted)}
.sb-teams{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:12px;align-items:center}
.sb-team{font-family:var(--font-saira-condensed);font-weight:800;font-size:20px;line-height:1.15;color:var(--th-text-strong);text-decoration:none;border:1px solid var(--th-line-8);border-radius:10px;padding:8px 12px;background:var(--th-bg-card);overflow-wrap:anywhere}
.sb-rechts{text-align:right}
.sb-stand{font-family:var(--font-saira-condensed);font-weight:900;font-size:40px;line-height:1}
.sb-zwei{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
.sb-tab{width:100%;border-collapse:collapse;font-size:13.5px;background:var(--th-bg-card);border:1px solid var(--th-line-8)}
.sb-tab th{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--th-text-dim);text-align:left;padding:7px 8px;border-bottom:1px solid var(--th-line-8);background:var(--th-line-4)}
.sb-tab td{padding:7px 8px;border-top:1px solid var(--th-line-6);vertical-align:middle}
.sb-tab a{color:inherit;text-decoration:none}
.sb-tab a:hover{text-decoration:underline}
.sb-pos{font-family:var(--font-jetbrains-mono);font-size:11.5px;font-weight:700;color:var(--th-text-dim)}
.sb-zahl{font-family:var(--font-jetbrains-mono);font-size:13px}
.sb-leer{color:var(--th-text-faint)}
.sb-ersatz td{background:var(--th-line-3,transparent)}
.sb-ersatz .sb-pos{opacity:.75}
.sb-nr{font-weight:800;color:var(--th-text-dim);font-size:12px}
.sb-dlabel{font-size:9px;letter-spacing:.08em;text-transform:uppercase}
.sb-doppel td{background:var(--th-accent-a07)}
.sb-paar{display:flex;flex-direction:column;gap:2px;min-width:0}
.sb-sieg{font-weight:800}
.sb-nieder{color:var(--th-text-muted)}
.sb-spiel{scroll-margin-top:90px}
.sb-spiel:target td{background:var(--th-accent-a25)}
.sb-gesamt{max-width:420px}
.sb-gesamt td:not(:first-child),.sb-gesamt th:not(:first-child){text-align:center;font-family:var(--font-jetbrains-mono);font-weight:800}
.sb-fuss{margin-top:28px;font-size:13px}
.sb-fuss a{color:var(--th-accent);font-weight:700;text-decoration:none}
@media (max-width:760px){
  .sb-zwei{grid-template-columns:1fr}
  .sb-meta{grid-template-columns:repeat(3,minmax(0,1fr))}
  .sb-breit{grid-column:1 / -1}
  .sb-team{font-size:16px}
  .sb-stand{font-size:32px}
}
`;
