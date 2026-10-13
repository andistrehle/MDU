import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { Icon } from '@/components/mdu/icon';
import { VorlaeufigHinweis, InfoZeile } from '@/components/mdu/saison-umschalter';
import { TeamChip27, Etikett } from '@/components/mdu/spielplan-27';
import { SpielortDruck } from '@/components/mdu/spielort-druck';
import { alleVenues27, alleTeams27, venue27, findLiga27, heimspieleImLokal27, wochenendeText, terminKurz, NEUE_SAISON } from '@/lib/data/saison-2027';

// Spielort-Plan 2026/27 für die Wirte: alle Spielwochenenden der Saison mit den
// Heimspielen in diesem Lokal (alle Ligen), freie Wochenenden sichtbar markiert.
// Maßgeblich ist der echte Termin (Masterpläne, termine-2027.ts) samt
// Heimrechttausch: Jedes Spiel steht mit Tag und Uhrzeit an seinem echten
// Wochenende, verlegte Spiele sind markiert.
// Statisch je Lokal (generateStaticParams), Daten aus lib/data/saison-2027.

export function generateStaticParams() {
  return alleVenues27().map(v => ({ id: v.id }));
}
export const dynamicParams = false;

export async function generateMetadata(props: PageProps<'/spielstaetten/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  const v = venue27(id);
  return { title: v ? `Spielplan ${v.name}` : 'Spielstätte' };
}

export default async function SpielortPlanPage(props: PageProps<'/spielstaetten/[id]'>) {
  const { id } = await props.params;
  const v = venue27(id);
  if (!v) notFound();
  const teams = alleTeams27().filter(t => t.venueId === id).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const wochen = heimspieleImLokal27(id);
  const anzahl = wochen.reduce((n, w) => n + w.spiele.length, 0);
  const planWochen = wochen.filter(w => !w.zusatz);
  const mitSpiel = planWochen.filter(w => w.spiele.length).length;
  const ohneTermin = wochen.reduce((n, w) => n + w.spiele.filter(s => !s.termin).length, 0);
  const maxGleichzeitig = Math.max(0, ...wochen.map(w => w.spiele.length));

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/spielstaetten" />

      <PageBanner
        eyebrow={`${NEUE_SAISON.name} · Spielort-Plan`}
        title={v.name}
        boardRight="max(28px, calc(50vw - 452px))"
        breadcrumb={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginBottom: 12 }}>
            <Link href="/spielstaetten" style={{ color: 'var(--th-text-muted)', textDecoration: 'none' }}>Spielstätten</Link>
            <Icon name="chevron" size={12} />
            <span style={{ color: 'var(--th-text-strong)' }}>{v.name}</span>
          </div>
        }
      />

      <div className="mdu-section-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 80px' }}>
        <VorlaeufigHinweis />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <InfoZeile style={{ margin: 0, flex: '1 1 320px' }}>
            {v.address && <>{v.address} · </>}
            <b style={{ color: 'var(--th-text-strong)' }}>{anzahl} Heimspiele</b> an {mitSpiel} von {planWochen.length} Spielwochenenden
            {maxGleichzeitig > 1 && <> · höchstens {maxGleichzeitig} am selben Wochenende</>}
          </InfoZeile>
          <SpielortDruck venueId={id} />
        </div>

        {/* Heimteams */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {teams.map(t => {
            const liga = findLiga27(t.league);
            return (
              <Link key={t.id} href={`/teams/${t.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, textDecoration: 'none', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', borderLeft: `3px solid ${liga?.color ?? 'var(--th-accent)'}`, fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, color: 'var(--th-text-strong)' }}>
                {t.name}
                <span style={{ fontWeight: 700, fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: liga?.color }}>{liga?.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Wochen: je Wochenende ein schmaler Kopf, darunter je Spiel EINE Zeile
            (Termin · Liga/Spieltag · Heim vs Gast · Hinweis). Am Handy rutschen
            die Teams unter Termin und Liga. */}
        <style>{`
          .vp-zeile{display:grid;grid-template-columns:132px 74px minmax(0,1fr) 22px minmax(0,1fr) 96px;align-items:center;gap:10px;padding:9px 16px;border-top:1px solid var(--th-line-4)}
          .vp-eti{display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end}
          @media (max-width:700px){
            .vp-zeile{grid-template-columns:auto 1fr;grid-template-areas:"t l" "h h" "v v" "g g" "e e";row-gap:6px;padding:10px 14px}
            .vp-t{grid-area:t}.vp-l{grid-area:l}.vp-h{grid-area:h}.vp-v{grid-area:v;display:none}.vp-g{grid-area:g}.vp-e{grid-area:e;justify-content:flex-start}
            .vp-h>*,.vp-g>*{justify-content:flex-start!important;flex-direction:row!important}
            .vp-h .mdu-link-name{text-align:left!important}
          }
        `}</style>
        <div style={{ borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', overflow: 'hidden' }}>
          {wochen.map((w, i) => (
            <div key={w.fri}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderTop: i ? '1px solid var(--th-line-6)' : 'none', background: 'var(--th-line-3)' }}>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: w.spiele.length ? 'var(--th-text-muted)' : 'var(--th-text-faint)' }}>
                  Wochenende {wochenendeText(w.fri, w.sun)}
                </span>
                {w.zusatz && <Etikett ton="grau">außerhalb des Plans</Etikett>}
                {!w.spiele.length && <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)' }}>kein Heimspiel</span>}
              </div>
              {w.spiele.map(({ liga, spieltag, spiel, termin, verlegt }) => (
                <div key={spiel.home + spiel.away} className="vp-zeile">
                  <div className="vp-t" style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, color: termin ? 'var(--th-text-strong)' : 'var(--th-text-faint)' }}>
                    {termin ? <>{terminKurz({ datum: termin.datum })}<span style={{ color: 'var(--th-text-muted)' }}>{termin.uhrzeit ? ` ${termin.uhrzeit}` : ''}</span></> : 'Termin offen'}
                  </div>
                  <div className="vp-l" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span title={`${liga.name} · ${spieltag}. Spieltag`} style={{ padding: '2px 7px', borderRadius: 5, background: liga.color, color: '#fff', fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 12, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                      {liga.name.replace(/\s*Liga$/, '')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, color: 'var(--th-text-muted)', whiteSpace: 'nowrap' }}>{spieltag}. ST</span>
                  </div>
                  <div className="vp-h"><TeamChip27 id={spiel.home} align="right" size={22} /></div>
                  <span className="vp-v" style={{ textAlign: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 11, color: 'var(--th-text-faint)' }}>VS</span>
                  <div className="vp-g"><TeamChip27 id={spiel.away} size={22} /></div>
                  <div className="vp-e vp-eti">
                    {spiel.derby && <Etikett ton="grau">Derby</Etikett>}
                    {verlegt && <Etikett>verlegt</Etikett>}
                    {termin?.vorlaeufig && <Etikett>wird geprüft</Etikett>}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 10 }}>
          Tag und Uhrzeit aus den Masterplänen der Teams (Stand TC-Sitzung 11.10.2026).
          {ohneTermin > 0 && <> Bei „Termin offen“ steht nur das Spielwochenende fest.</>}
          {' '}„verlegt“ = außerhalb des eigentlichen Spielwochenendes. Ferienwochenenden ohne Spiel sind nicht aufgeführt.
        </p>
      </div>

      <Footer />
    </div>
  );
}
