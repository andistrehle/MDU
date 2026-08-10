// ============================================================
// Tennis Kail — Preise
// ============================================================
//
// UX-Gedanke: Preisseiten scheitern meist daran, dass man erst rechnen
// muss. Deshalb steht oben eine Tafel je Kategorie, darunter die
// vollständige Tarifmatrix nach Tageszeit — und am Ende die Regeln, die
// sonst im Kleingedruckten verschwinden (Storno, Regen, Abos).
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card, Chip, DemoNote } from '@/components/tk/ui/primitives';
import { Reveal } from '@/components/tk/motion/reveal';
import { PRICE_CARDS, PRICE_NOTES, RATES } from '@/data/tk/pricing';
import { formatPrice, formatTime } from '@/lib/tk/format';
import { priceJsonLd } from '@/lib/tk/seo';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Preise',
  description:
    'Platzmiete für Halle und Sandplatz nach Tageszeit, Trainerstunden, Abos und ' +
    'Mehrfachkarten — vollständig aufgeschlüsselt.',
};

const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export default function PreisePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(priceJsonLd()) }}
      />

      <PageHeader
        eyebrow="Preise"
        title="Was eine Stunde kostet"
        lede="Pro Platz und Stunde, unabhängig davon, ob ihr zu zweit oder zu viert spielt. Bezahlt wird an der Anlage."
        action={
          <Link href="/tk/buchen" className="tk-btn">
            Direkt buchen
          </Link>
        }
      />

      {/* Tafeln */}
      <section className="tk-section">
        <div className="tk-shell grid gap-5 md:grid-cols-3">
          {PRICE_CARDS.map((card, i) => (
            <Reveal key={card.id} delay={i * 0.07}>
              <Card
                className={cn(
                  'flex h-full flex-col gap-4 p-6',
                  card.highlight && 'border-[var(--tk-clay-soft)] bg-[var(--tk-clay-wash)]',
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="tk-h3">{card.title}</h2>
                    {card.highlight ? <Chip tone="clay">ganzjährig</Chip> : null}
                  </div>
                  <p className="mt-1 text-[0.88rem] text-[var(--tk-ink-dim)]">{card.subtitle}</p>
                </div>
                <dl className="flex flex-col gap-2.5">
                  {card.rows.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-[var(--tk-line-soft)] pb-2">
                      <dt className="text-[0.92rem] text-[var(--tk-ink-soft)]">{row.label}</dt>
                      <dd className="text-right">
                        <span className="tk-num font-semibold">{row.value}</span>
                        {row.hint ? (
                          <span className="block text-[0.74rem] text-[var(--tk-ink-dim)]">{row.hint}</span>
                        ) : null}
                      </dd>
                    </div>
                  ))}
                </dl>
                {card.footnote ? (
                  <p className="mt-auto pt-1 text-[0.82rem] text-[var(--tk-ink-dim)]">{card.footnote}</p>
                ) : null}
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Vollständige Tarifmatrix */}
      <section className="tk-section tk-section--wash">
        <div className="tk-shell">
          <h2 className="tk-h2">Alle Tarife nach Tageszeit</h2>
          <p className="tk-lede mt-2">
            Genau diese Werte rechnet auch das Buchungsraster — kein zweiter Datensatz, keine
            Abweichung zwischen Preisliste und Rechnung.
          </p>

          <Card className="mt-8 overflow-hidden">
            <div className="tk-grid-scroll" tabIndex={0} role="region" aria-label="Tariftabelle, waagerecht scrollbar">
              <table className="tk-table">
                <caption className="tk-sr">
                  Tarife nach Platzart, Wochentagen und Uhrzeit
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Tarif</th>
                    <th scope="col">Tage</th>
                    <th scope="col">Zeit</th>
                    <th scope="col">Saison</th>
                    <th scope="col" className="text-right">
                      pro Stunde
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RATES.map((r) => (
                    <tr key={r.id}>
                      <th scope="row" className="font-semibold">
                        {r.label}
                        {r.description ? (
                          <span className="block text-[0.8rem] font-normal text-[var(--tk-ink-dim)]">
                            {r.description}
                          </span>
                        ) : null}
                      </th>
                      <td className="whitespace-nowrap">
                        {r.weekdays.length === 5 ? 'Mo–Fr' : r.weekdays.map((w) => WD[w]).join(', ')}
                      </td>
                      <td className="tk-num whitespace-nowrap">
                        {formatTime(r.from)}–{formatTime(r.to)}
                      </td>
                      <td className="whitespace-nowrap capitalize">
                        {r.season === 'ganzjaehrig' ? 'ganzjährig' : r.season}
                      </td>
                      <td className="tk-num text-right font-semibold">{formatPrice(r.cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Regeln */}
      <section className="tk-section">
        <div className="tk-shell grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="tk-h2">Gut zu wissen</h2>
            <ul className="mt-6 flex flex-col gap-4">
              {PRICE_NOTES.map((n) => (
                <li key={n} className="flex gap-3 text-[0.95rem] text-[var(--tk-ink-soft)]">
                  <span aria-hidden className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-[var(--tk-clay)]" />
                  {n}
                </li>
              ))}
            </ul>
          </div>

          <Card className="flex flex-col gap-4 p-6">
            <h2 className="tk-h3">Abo und Mehrfachkarte</h2>
            <p className="text-[0.94rem] text-[var(--tk-ink-soft)]">
              Wer wöchentlich zur selben Zeit spielt, bekommt die Stunde fest zugeteilt — die
              Abo-Stunden werden im Raster als belegt geführt und tauchen im Konto auf. Freie
              Restzeiten bleiben für alle buchbar.
            </p>
            <dl className="flex flex-col gap-2 text-[0.92rem]">
              {[
                ['Winterabo Halle, 22 Wochen', 'ab 620 €'],
                ['Sommerabo Sand, 26 Wochen', 'ab 480 €'],
                ['10er-Karte Sandplatz', '190 €'],
                ['10er-Karte Halle', '245 €'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-[var(--tk-line-soft)] pb-2">
                  <dt className="text-[var(--tk-ink-soft)]">{k}</dt>
                  <dd className="tk-num font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <Link href="/tk/kontakt" className="tk-btn tk-btn--ghost mt-auto">
              Abo anfragen
            </Link>
          </Card>
        </div>

        <div className="tk-shell mt-10">
          <DemoNote>
            Alle Preise auf dieser Seite sind Demo-Werte. Sie stammen nicht von tennis-kail.de,
            sondern sind an marktübliche Münchner Platzmieten angelehnt, damit die Buchung
            realistisch rechnet. Die echten Tarife trägt der Betrieb an einer Stelle ein
            (<code className="tk-num text-[0.85em]">data/tk/pricing.ts</code>) — Preisseite und
            Buchung übernehmen sie automatisch.
          </DemoNote>
        </div>
      </section>
    </>
  );
}
