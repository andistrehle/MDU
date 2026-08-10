import type { Metadata } from 'next';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card } from '@/components/tk/ui/primitives';
import { ContactForm } from '@/components/tk/contact/contact-form';
import { FacilityArt } from '@/components/tk/media/facility-art';
import { BRAND, LOCATIONS, hoursSummary } from '@/data/tk/facility';
import { facilityJsonLd } from '@/lib/tk/seo';

export const metadata: Metadata = {
  title: 'Kontakt und Anfahrt',
  description:
    'Adressen, Öffnungszeiten und Anfahrt zu beiden Anlagen von Tennis Kail in Harlaching ' +
    'und Neuperlach.',
};

export default async function KontaktPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const anliegen = Array.isArray(params.anliegen) ? params.anliegen[0] : params.anliegen;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(facilityJsonLd()) }}
      />

      <PageHeader
        eyebrow="Kontakt"
        title="Anrufen geht immer noch am schnellsten"
        lede="Für alles, was kein Formular braucht: Die Anlage ist zu den Öffnungszeiten am Telefon erreichbar."
        action={
          <a href={`tel:${BRAND.phoneHref}`} className="tk-btn tk-btn--lg">
            {BRAND.phone}
          </a>
        }
      />

      <section className="tk-section">
        <div className="tk-shell grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <div className="flex flex-col gap-6">
            <h2 className="tk-h2">Schreiben</h2>
            <ContactForm initialTopic={anliegen} />
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="tk-h2">Beide Anlagen</h2>
            {LOCATIONS.map((loc) => (
              <Card key={loc.id} className="overflow-hidden">
                {/* Ortsskizze statt Karte: keine Fremdeinbindung, kein Tracking. */}
                <div className="relative h-[150px]">
                  <FacilityArt variant="aerial" tone={loc.id === 'harlaching' ? 'forest' : 'clay'} className="h-full w-full" />
                  <span className="absolute bottom-3 left-4 rounded-full bg-[rgba(255,253,249,0.94)] px-3 py-1 text-[0.76rem] font-semibold text-[var(--tk-ink)]">
                    {loc.district}
                  </span>
                </div>
                <div className="flex flex-col gap-4 p-5">
                  <div>
                    <h3 className="tk-h3">{loc.name}</h3>
                    <address className="mt-1 not-italic text-[0.92rem] text-[var(--tk-ink-soft)]">
                      {loc.street}
                      <br />
                      {loc.zip} {loc.city}
                    </address>
                  </div>

                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-0.5 text-[0.9rem] text-[var(--tk-ink-soft)]">
                    {hoursSummary(loc).map((r) => (
                      <div key={r.days} className="contents">
                        <dt className="font-semibold">{r.days}</dt>
                        <dd className="tk-num">{r.time}</dd>
                      </div>
                    ))}
                  </dl>

                  <ul className="flex flex-col gap-1 text-[0.9rem] text-[var(--tk-ink-soft)]">
                    {loc.arrival.map((a) => (
                      <li key={a} className="flex gap-2">
                        <span aria-hidden className="text-[var(--tk-clay)]">
                          ·
                        </span>
                        {a}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2">
                    {loc.phone ? (
                      <a href={`tel:${BRAND.phoneHref}`} className="tk-btn tk-btn--ghost tk-btn--sm">
                        {loc.phone}
                      </a>
                    ) : null}
                    {loc.email ? (
                      <a href={`mailto:${loc.email}`} className="tk-btn tk-btn--ghost tk-btn--sm">
                        {loc.email}
                      </a>
                    ) : null}
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=17/${loc.lat}/${loc.lng}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="tk-btn tk-btn--ghost tk-btn--sm"
                    >
                      Auf der Karte
                    </a>
                  </div>
                </div>
              </Card>
            ))}

            <p className="tk-demo-note">
              Statt einer eingebetteten Karte steht hier eine gezeichnete Skizze und ein Link.
              Eine eingebettete Google-Karte würde beim Seitenaufruf Daten an Dritte übertragen —
              das gehört in eine Einwilligung, nicht in eine Demo.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
