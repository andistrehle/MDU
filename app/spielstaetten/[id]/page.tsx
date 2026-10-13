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
          <SpielortDruck venueName={v.name} />
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

        {/* Wochen */}
        <div style={{ borderRadius: 12, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', overflow: 'hidden' }}>
          {wochen.map((w, i) => (
            // Flex mit Umbruch: Ist es zu schmal (Handy), rutscht das Datum über die Spiele.
            <div key={w.fri} style={{ display: 'flex', flexWrap: 'wrap', columnGap: 12, rowGap: 6, padding: '10px 16px', borderTop: i ? '1px solid var(--th-line-4)' : 'none', background: w.spiele.length ? 'transparent' : 'var(--th-line-3)' }}>
              <div style={{ flex: '0 0 120px', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, fontWeight: 700, color: w.spiele.length ? 'var(--th-text-strong)' : 'var(--th-text-faint)', paddingTop: 3 }}>
                {wochenendeText(w.fri, w.sun)}
                {w.zusatz && <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 700, color: 'var(--th-text-faint)', marginTop: 2 }}>außerhalb des Plans</div>}
              </div>
              {w.spiele.length === 0 ? (
                <div style={{ flex: '1 1 160px', fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-faint)', paddingTop: 2 }}>kein Heimspiel</div>
              ) : (
                <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {w.spiele.map(({ liga, spieltag, spiel, termin, verlegt }) => (
                    <div key={spiel.home + spiel.away}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px', marginBottom: 4 }}>
                        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, fontWeight: 700, color: termin ? 'var(--th-text-strong)' : 'var(--th-text-faint)' }}>
                          {termin ? `${terminKurz(termin)}${termin.uhrzeit ? ' Uhr' : ''}` : 'Termin offen'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: liga.color }}>
                          {liga.name} · {spieltag}. Spieltag{spiel.derby ? ' · Derby' : ''}
                        </span>
                        {verlegt && <Etikett>verlegt</Etikett>}
                        {termin?.vorlaeufig && <Etikett>wird geprüft</Etikett>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center', gap: 8 }}>
                        <TeamChip27 id={spiel.home} size={22} />
                        <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 12, color: 'var(--th-text-faint)' }}>VS</span>
                        <TeamChip27 id={spiel.away} align="right" size={22} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
