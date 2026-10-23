import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { alleBegegnungen27, team27, venue27, findLiga27, datumText } from '@/lib/data/saison-2027';
import { ladeBericht27 } from '@/lib/server/ergebnisse-2027';
import { passtSlug } from '@/lib/spieltag';

// ============================================================
// Öffentlicher Spielbericht 2026/27 (Betreiber, 23.10.2026)
// ============================================================
// Erreichbar aus dem Spielerprofil („Letzte Ergebnisse“ → Spiel antippen,
// springt per #spiel-<nr> auf die Partie). Inhalt aus ladeBericht27 — nur
// das, was zum Ergebnis gehört. Gebaut beim ersten Aufruf, danach statisch;
// /api/match-reports/published markiert die Seiten nach jeder Änderung.
// ============================================================

type Params = { params: Promise<{ spiel: string }> };

export function generateStaticParams() { return []; }

const finde = (spiel: string) => alleBegegnungen27().find(b => passtSlug(b.key, spiel)) ?? null;
const name = (id: string) => team27(id)?.name ?? id;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const b = finde((await params).spiel);
  if (!b) return {};
  return { title: `Spielbericht ${name(b.home)} – ${name(b.away)}` };
}

const HL: Record<string, string> = { '180': '180er', '171': '171er', high_finish: 'Highfinish', short_leg: 'Shortleg' };

export default async function SpielberichtPage({ params }: Params) {
  const b = finde((await params).spiel);
  if (!b) notFound();
  const r = await ladeBericht27(b.key);
  if (!r) notFound();
  const { e } = r;
  const heim = team27(e.home), gast = team27(e.away);
  const spieler = (side: 'home' | 'guest', slot: number) => r.spieler.find(p => p.side === side && p.slot === slot);
  const ort = venue27(heim?.venueId);

  const Name = ({ side, slot }: { side: 'home' | 'guest'; slot: number }) => {
    const p = spieler(side, slot);
    if (!p) return <span style={{ color: 'var(--th-text-faint)' }}>–</span>;
    return p.playerId
      ? <Link href={`/spieler/${p.playerId}`} style={{ color: 'inherit', textDecoration: 'none' }}>{p.name}</Link>
      : <>{p.name}</>;
  };
  const Seite = ({ side, slots, rechts }: { side: 'home' | 'guest'; slots: number[]; rechts?: boolean }) => (
    <div style={{ flex: 1, minWidth: 0, textAlign: rechts ? 'right' : 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {slots.length ? slots.map(s => <span key={s} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><Name side={side} slot={s} /></span>) : <span style={{ color: 'var(--th-text-faint)' }}>–</span>}
    </div>
  );

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <style>{`.mdu-sb-spiel:target{outline:2px solid var(--th-accent);background:var(--th-accent-a07)}`}</style>
      <DesktopHeader activeHref="/ergebnisse" />
      <div className="mdu-section-pad" style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px 64px', fontFamily: 'var(--font-manrope)' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--th-text-dim)' }}>
          Spielbericht · {findLiga27(b.liga)?.name ?? b.liga} · {b.spieltag}. Spieltag
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/teams/${e.home}`} style={teamStil}>{heim?.name ?? e.home}</Link>
          <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 40, lineHeight: 1, whiteSpace: 'nowrap' }}>
            {e.spieleHome}:{e.spieleAway}
          </div>
          <Link href={`/teams/${e.away}`} style={{ ...teamStil, textAlign: 'right' }}>{gast?.name ?? e.away}</Link>
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.6 }}>
          Legs {e.legsHome}:{e.legsAway}
          {e.datum && <> · {datumText(e.datum)}</>}
          {ort && <> · {ort.name}</>}
          {!e.bestaetigt && <> · <span style={{ color: '#9A6B00', fontWeight: 800 }}>* vom Gegner noch nicht bestätigt</span></>}
        </div>

        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {r.spiele.map(s => {
            const fertig = s.legsHeim != null && s.legsGast != null;
            const heimSieg = fertig && s.legsHeim! > s.legsGast!, gastSieg = fertig && s.legsGast! > s.legsHeim!;
            return (
              <div key={s.nr} id={`spiel-${s.nr}`} className="mdu-sb-spiel" style={{
                scrollMarginTop: 90, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', fontSize: 13.5,
              }}>
                <div style={{ width: 34, flexShrink: 0, fontSize: 11, fontWeight: 800, color: 'var(--th-text-dim)' }}>
                  {s.nr}{s.doppel && <div style={{ fontSize: 9.5, letterSpacing: '0.08em' }}>DOPPEL</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}>
                  <div style={{ flex: 1, minWidth: 0, fontWeight: heimSieg ? 800 : 600, color: gastSieg ? 'var(--th-text-muted)' : 'var(--th-text-strong)' }}>
                    <Seite side="home" slots={s.heim} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {fertig ? `${s.legsHeim}:${s.legsGast}` : '–'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontWeight: gastSieg ? 800 : 600, color: heimSieg ? 'var(--th-text-muted)' : 'var(--th-text-strong)' }}>
                    <Seite side="guest" slots={s.gast} rechts />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {r.highlights.some(h => h.value != null) && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--th-text-dim)', marginBottom: 8 }}>Highlights</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13.5 }}>
              {r.highlights.filter(h => h.value != null).map((h, i) => (
                <div key={i}>
                  <b>{HL[h.type] ?? h.type}</b>{h.type === '180' || h.type === '171' ? ` ×${h.value}` : ` ${h.value}${h.type === 'short_leg' ? ' Darts' : ''}`}
                  {' · '}<Name side={h.side} slot={h.slot} />
                  <span style={{ color: 'var(--th-text-faint)' }}> ({name(h.side === 'home' ? e.home : e.away)})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 28, fontSize: 13 }}>
          <Link href={`/ligen/${b.liga}`} style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Zur Tabelle der {findLiga27(b.liga)?.name ?? 'Liga'} →</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

const teamStil: React.CSSProperties = {
  flex: 1, minWidth: 0, fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 20, lineHeight: 1.15,
  color: 'var(--th-text-strong)', textDecoration: 'none',
};
