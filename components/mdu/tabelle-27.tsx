import { TeamBadge } from './team-badge';
import { TeamLink } from './team-link';
import { AUF_AB_2027, findLiga27, team27, type Liga27, type Zone } from '@/lib/data/saison-2027';
import type { TabellenZeile } from '@/lib/tabelle-2027';

// Tabelle 2026/27 aus den Spielberichten (Server-tauglich, keine Hooks).
// Aufbau wie die Tabellen 2025/26 (standings-table.tsx, Klassen mdu-st-head /
// mdu-st-row für den Hell-Modus): Pl. · Team · Sp. · Pkt. · S · U · N · Spiele ·
// Legs · Diff., links ein Farbstreifen für Aufstieg / Relegation / Abstieg und
// darunter die Legende mit kurzer Erklärung (Plätze aus AUF_AB_2027).
// Vor dem ersten Ergebnis: Platz „–", alphabetisch, alles 0, noch KEINE
// Markierung — die alphabetische Reihenfolge sagt nichts über Plätze.
// Auf schmalen Bildschirmen fallen S/U/N, Spiele und Legs weg.

export const ZONE_FARBE: Record<Zone, string> = {
  auf: '#2E9E44',
  rel: '#E8B84A',
  ab: '#D40000',
  bleibt: 'var(--th-text-faint2)',
};

const zahl: React.CSSProperties = { fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12.5, textAlign: 'center', color: 'var(--th-text-body)' };
const diffText = (d: number) => (d > 0 ? `+${d}` : String(d));
const diffFarbe = (d: number) => (d > 0 ? 'var(--th-win)' : d < 0 ? 'var(--th-loss)' : 'var(--th-text-muted)');

export function Tabelle27({ liga, zeilen }: { liga: Liga27; zeilen: TabellenZeile[] }) {
  const gespielt = zeilen.some(z => z.sp > 0);
  const rows = gespielt ? zeilen : [...zeilen].sort((a, b) => (team27(a.team)?.name ?? '').localeCompare(team27(b.team)?.name ?? '', 'de'));
  const offen = zeilen.some(z => z.offen > 0);
  const abzug = zeilen.some(z => z.abzug < 0);
  return (
    <div className="t27" style={{ padding: '12px 12px 4px 16px' }}>
      <style>{`.t27 .t27-g{grid-template-columns:34px minmax(0,1fr) 34px 44px 28px 28px 28px 64px 72px 46px}@media (max-width:600px){.t27 .t27-g{grid-template-columns:24px minmax(0,1fr) 28px 36px 38px;gap:4px!important}.t27 .t27-x{display:none}}`}</style>
      <div className="mdu-st-head t27-g" style={{ display: 'grid', gap: 6, alignItems: 'center', padding: '10px 8px', borderBottom: '1px solid var(--th-line-8)', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>
        <span title="Platzierung">Pl.</span>
        <span>Team</span>
        <span title="Begegnungen" style={{ textAlign: 'center' }}>Sp.</span>
        <span title="Punkte" style={{ textAlign: 'center' }}>Pkt.</span>
        <span className="t27-x" title="Siege" style={{ textAlign: 'center' }}>S</span>
        <span className="t27-x" title="Unentschieden" style={{ textAlign: 'center' }}>U</span>
        <span className="t27-x" title="Niederlagen" style={{ textAlign: 'center' }}>N</span>
        <span className="t27-x" title="Gewonnene:verlorene Einzelspiele" style={{ textAlign: 'center' }}>Spiele</span>
        <span className="t27-x" title="Gewonnene:verlorene Legs" style={{ textAlign: 'center' }}>Legs</span>
        <span title="Spieldifferenz" style={{ textAlign: 'center' }}>Diff.</span>
      </div>
      {rows.map(z => {
        const t = team27(z.team);
        const zone = gespielt ? AUF_AB_2027[liga.code]?.[z.pos - 1]?.zone : undefined;
        const d = z.spieleFor - z.spieleAgainst;
        return (
          <div key={z.team} className="mdu-st-row t27-g" style={{ position: 'relative', display: 'grid', gap: 6, alignItems: 'center', padding: '11px 8px', borderBottom: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
            {zone && <span title={AUF_AB_2027[liga.code]?.[z.pos - 1]?.text} aria-hidden style={{ position: 'absolute', left: -10, top: 7, bottom: 7, width: 4, borderRadius: 2, background: ZONE_FARBE[zone] }} />}
            <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16, color: gespielt && z.pos <= 3 ? 'var(--th-gold)' : 'var(--th-text-strong)' }}>
              {gespielt ? z.pos : '–'}
            </span>
            <TeamLink teamId={z.team} teamName={t?.name ?? z.team} style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, textDecoration: 'none' }}>
              <TeamBadge initials={(t?.short ?? z.team).slice(0, 3)} color={t?.color} logoUrl={t?.logoUrl ?? undefined} size={26} />
              <span className="mdu-link-name" style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t?.name ?? z.team}{z.offen > 0 && <span title="Ergebnis noch nicht vom Gegner bestätigt" style={{ color: '#9A6B00', fontWeight: 800 }}> *</span>}
              </span>
            </TeamLink>
            <span style={zahl}>{z.sp}</span>
            <span style={{ ...zahl, fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: 'var(--th-text-strong)' }}>
              {z.pts}{z.abzug < 0 && <sup style={{ color: '#C0392B', fontSize: 9, fontFamily: 'var(--font-manrope)' }}>({z.abzug})</sup>}
            </span>
            <span className="t27-x" style={{ ...zahl, color: 'var(--th-win)' }}>{z.s}</span>
            <span className="t27-x" style={zahl}>{z.u}</span>
            <span className="t27-x" style={{ ...zahl, color: 'var(--th-loss)' }}>{z.n}</span>
            <span className="t27-x" style={zahl}>{z.spieleFor}:{z.spieleAgainst}</span>
            <span className="t27-x" style={zahl}>{z.legsFor}:{z.legsAgainst}</span>
            <span style={{ ...zahl, fontWeight: 700, color: diffFarbe(d) }}>{gespielt ? diffText(d) : '0'}</span>
          </div>
        );
      })}

      <TabellenLegende liga={liga} gespielt={gespielt} />

      {(offen || abzug) && (
        <div style={{ padding: '0 4px 10px', fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)', lineHeight: 1.5 }}>
          {offen && <div><span style={{ color: '#9A6B00', fontWeight: 800 }}>*</span> Ergebnis eingereicht, vom Gegner noch nicht bestätigt — kann sich noch ändern.</div>}
          {abzug && <div><span style={{ color: '#C0392B', fontWeight: 800 }}>(−3)</span> Punktabzug für Nichtantritt.</div>}
        </div>
      )}
    </div>
  );
}

/** „1–3“ bzw. „7“ aus einer Liste von Plätzen. */
function plaetze(nr: number[]): string {
  if (!nr.length) return '';
  const teile: string[] = [];
  let start = nr[0], prev = nr[0];
  for (const n of [...nr.slice(1), Infinity]) {
    if (n === prev + 1) { prev = n; continue; }
    teile.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = prev = n;
  }
  return teile.join(', ');
}

const STUFE_NAME: Record<string, string> = { La: 'La Liga', A: 'A Liga', B: 'B Liga', C: 'C Liga' };

/** Legende unter der Tabelle: Farbe + Plätze + kurze Erklärung, aus AUF_AB_2027. */
function TabellenLegende({ liga, gespielt }: { liga: Liga27; gespielt: boolean }) {
  const regeln = AUF_AB_2027[liga.code] ?? [];
  const nach = (z: Zone) => regeln.map((r, i) => (r.zone === z ? i + 1 : 0)).filter(Boolean);
  const eintraege: { zone: Zone; titel: string; text: string }[] = [];
  const auf = nach('auf'), rel = nach('rel'), ab = nach('ab'), bleibt = nach('bleibt');
  const ziel = (z: Zone) => STUFE_NAME[regeln.find(r => r.zone === z)?.ziel ?? ''] ?? '';
  if (auf.length) eintraege.push({ zone: 'auf', titel: 'Aufstieg', text: `Platz ${plaetze(auf)} steig${auf.length > 1 ? 'en' : 't'} direkt in die ${ziel('auf')} auf.` });
  for (const p of rel) {
    const gegen = regeln[p - 1].text.replace('Relegation vs ', '');
    const m = /^([A-Z][a-z]?\d?)-(\d+)\.$/.exec(gegen);
    const gegner = m ? `dem ${m[2]}. der ${findLiga27(m[1].toLowerCase())?.name ?? m[1]}` : gegen;
    eintraege.push({ zone: 'rel', titel: 'Relegation', text: `Platz ${p} spielt am Saisonende gegen ${gegner} — der Sieger spielt in der höheren Liga.` });
  }
  if (ab.length) eintraege.push({ zone: 'ab', titel: 'Abstieg', text: `Platz ${plaetze(ab)} steig${ab.length > 1 ? 'en' : 't'} direkt in die ${ziel('ab')} ab.` });
  if (bleibt.length) eintraege.push({ zone: 'bleibt', titel: 'Verbleib', text: `Platz ${plaetze(bleibt)} bleib${bleibt.length > 1 ? 'en' : 't'} in der ${liga.name}.` });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 4px 12px' }}>
      {eintraege.map(e => (
        <div key={e.zone + e.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontFamily: 'var(--font-manrope)', fontSize: 12.5, lineHeight: 1.45, color: 'var(--th-text-body)' }}>
          <span aria-hidden style={{ width: 4, height: 16, borderRadius: 2, flexShrink: 0, marginTop: 1, background: ZONE_FARBE[e.zone] }} />
          <span><b style={{ color: 'var(--th-text-strong)' }}>{e.titel}:</b> {e.text}</span>
        </div>
      ))}
      {!gespielt && (
        <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)', marginTop: 2 }}>
          Die Markierung links erscheint ab dem ersten Spieltag.
        </div>
      )}
    </div>
  );
}
