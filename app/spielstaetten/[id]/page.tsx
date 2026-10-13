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
import { alleVenues27, alleTeams27, venue27, findLiga27, heimspieleImLokal27, venueBloecke27, kalenderwoche, wochenendeText, NEUE_SAISON } from '@/lib/data/saison-2027';

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
  const bloecke = venueBloecke27(wochen);
  const anzahl = wochen.reduce((n, w) => n + w.spiele.length, 0);
  const mitSpiel = wochen.filter(w => w.spiele.length).length;
  const ohneTermin = wochen.reduce((n, w) => n + w.spiele.filter(s => !s.termin).length, 0);
  // Meiste Spiele an EINEM Abend (gleiches Datum) — wichtig für die Automaten.
  const proAbend = new Map<string, number>();
  for (const w of wochen) for (const s of w.spiele) if (s.termin) proAbend.set(s.termin.datum, (proAbend.get(s.termin.datum) ?? 0) + 1);
  const maxAbend = Math.max(0, ...proAbend.values());

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
            <b style={{ color: 'var(--th-text-strong)' }}>{anzahl} Heimspiele</b> an {mitSpiel} Wochenenden
            {maxAbend > 1 && <> · bis zu {maxAbend} Spiele am selben Abend</>}
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

        {/* Kalender-Wochenenden: je Wochenende eine Karte (Kopf mit KW, Datum,
            Anzahl), darin je Spiel eine Zeile Tag · Uhrzeit · Liga · Heim vs Gast ·
            Hinweis. Mehrere Spiele am selben Tag teilen sich die Tagesangabe.
            Strecken ohne Heimspiel stehen als eine schmale Zeile dazwischen.
            Am Handy rutschen die Teams unter Tag, Uhrzeit und Liga. */}
        <style>{`
          .vp-zeile{display:grid;grid-template-columns:62px 50px 92px minmax(0,1fr) 22px minmax(0,1fr) 150px;align-items:center;gap:10px;padding:10px 16px}
          .vp-zeile+.vp-zeile{border-top:1px solid var(--th-line-4)}
          .vp-zeile.vp-folge{border-top-style:dashed}
          .vp-eti{display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end}
          @media (max-width:700px){
            .vp-zeile{grid-template-columns:auto auto 1fr;grid-template-areas:"t z l" "h h h" "g g g" "e e e";row-gap:6px;padding:10px 14px}
            .vp-t{grid-area:t}.vp-z{grid-area:z}.vp-l{grid-area:l;justify-self:end}.vp-h{grid-area:h}.vp-v{display:none}.vp-g{grid-area:g}.vp-e{grid-area:e;justify-content:flex-start}
            .vp-e:empty{display:none}
            .vp-zeile.vp-folge .vp-t{visibility:visible!important}
          }
        `}</style>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bloecke.map(b => {
            if (b.art === 'frei') return (
              <div key={b.fri} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 10, border: '1px dashed var(--th-line-8)', fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-faint)' }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: 'var(--th-text-muted)' }}>{wochenendeText(b.fri, b.sun, false)}</span>
                <span>kein Heimspiel{b.anzahl > 1 ? ` · ${b.anzahl} Wochenenden` : ''}</span>
              </div>
            );
            const w = b.w;
            return (
              <section key={w.fri} style={{ borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
                <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', background: 'var(--th-line-3)', borderBottom: '1px solid var(--th-line-6)' }}>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--th-text-faint)' }}>KW {kalenderwoche(w.fri)}</span>
                  <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 17, letterSpacing: '0.02em', color: 'var(--th-text-strong)' }}>{wochenendeText(w.fri, w.sun)}</span>
                  <span style={{ marginLeft: 'auto', padding: '2px 10px', borderRadius: 999, background: 'var(--th-accent)', color: '#fff', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800 }}>
                    {w.spiele.length} Heimspiel{w.spiele.length > 1 ? 'e' : ''}
                  </span>
                </header>
                {w.spiele.map(({ liga, spieltag, spiel, termin, verlegt }, k) => {
                  const folge = k > 0 && !!termin && w.spiele[k - 1].termin?.datum === termin.datum;
                  const x = termin ? new Date(termin.datum + 'T12:00:00Z') : null;
                  return (
                    <div key={spiel.home + spiel.away} className={`vp-zeile${folge ? ' vp-folge' : ''}`}>
                      <div className="vp-t" style={{ visibility: folge ? 'hidden' : 'visible', display: 'flex', alignItems: 'baseline', gap: 6, whiteSpace: 'nowrap' }}>
                        {x ? <>
                          <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--th-accent)' }}>{['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][x.getUTCDay()]}</span>
                          <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16, color: 'var(--th-text-strong)' }}>{x.getUTCDate()}.{x.getUTCMonth() + 1}.</span>
                        </> : <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, fontWeight: 700, color: 'var(--th-text-faint)' }}>offen</span>}
                      </div>
                      <div className="vp-z" style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, fontWeight: 700, color: termin?.uhrzeit ? 'var(--th-text-body)' : 'var(--th-text-faint)', whiteSpace: 'nowrap' }}>
                        {termin?.uhrzeit ?? '—'}
                      </div>
                      <div className="vp-l" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span title={`${liga.name} · ${spieltag}. Spieltag`} style={{ minWidth: 26, textAlign: 'center', padding: '2px 6px', borderRadius: 5, background: liga.color, color: '#fff', fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 12, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                          {liga.name.replace(/\s*Liga$/, '')}
                        </span>
                        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, color: 'var(--th-text-muted)', whiteSpace: 'nowrap' }}>{spieltag}. ST</span>
                      </div>
                      <div className="vp-h"><TeamChip27 id={spiel.home} size={22} /></div>
                      <span className="vp-v" style={{ textAlign: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 11, color: 'var(--th-text-faint)' }}>VS</span>
                      <div className="vp-g"><TeamChip27 id={spiel.away} size={22} /></div>
                      <div className="vp-e vp-eti">
                        {spiel.derby && <Etikett ton="grau">Derby</Etikett>}
                        {verlegt && <Etikett>verlegt</Etikett>}
                        {termin?.vorlaeufig && <Etikett>wird geprüft</Etikett>}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 10 }}>
          Tag und Uhrzeit aus den Masterplänen der Teams (Stand TC-Sitzung 11.10.2026).
          {ohneTermin > 0 && <> Bei „offen“ steht nur das Spielwochenende fest.</>}
          {' '}„verlegt“ = außerhalb des eigentlichen Spielwochenendes.
        </p>
      </div>

      <Footer />
    </div>
  );
}
