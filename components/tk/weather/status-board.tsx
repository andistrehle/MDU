// ============================================================
// Tennis Kail — Platzstatus
// ============================================================
//
// Die Seite, die es auf keiner Tennisseite gibt und die trotzdem jeder
// sucht: Kann ich heute raus? Statt einer Wetter-Kachel steht hier die
// Antwort für jeden einzelnen Platz — und was zu tun ist, wenn sie „nein"
// lautet.
//
// Die Ableitung Wetter → Platz steht in lib/tk/weather.ts. Hier wird sie
// nur dargestellt.
// ============================================================

import Link from 'next/link';
import { COURTS, LOCATIONS, SURFACE_LABEL, courtsOf } from '@/data/tk/facility';
import { formatDayShort, formatTime } from '@/lib/tk/format';
import { courtStatusFor, forecast, summariseStatus, WEATHER_LABEL } from '@/lib/tk/weather';
import type { CourtCondition, WeatherSymbol } from '@/lib/tk/types';
import { Card, Chip } from '@/components/tk/ui/primitives';
import { Reveal } from '@/components/tk/motion/reveal';
import { cn } from '@/lib/utils';

const SYMBOL_GLYPH: Record<WeatherSymbol, string> = {
  sonne: '☀',
  wolkig: '⛅',
  bedeckt: '☁',
  schauer: '🌦',
  regen: '☂',
  gewitter: '⚡',
  schnee: '❄',
};

const CONDITION_CHIP: Record<CourtCondition, 'free' | 'warn' | 'blocked' | 'neutral'> = {
  bespielbar: 'free',
  feucht: 'warn',
  gesperrt: 'blocked',
  geschlossen: 'neutral',
};

export function StatusBoard({ todayIso }: { todayIso: string }) {
  const days = forecast(todayIso, 7);
  const todayWeather = days[0];
  const outdoor = COURTS.filter((c) => c.kind === 'freiplatz');
  const overall = summariseStatus(outdoor, todayIso);

  return (
    <>
      {/* Heute */}
      <section className="tk-section--dark py-12">
        <div className="tk-shell grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-4">
            <span className="tk-eyebrow tk-eyebrow--dark">Platzstatus</span>
            <h1 className="tk-display text-[var(--tk-on-dark)]">{overall.headline}</h1>
            <p className="tk-lede">
              {overall.closed > 0
                ? 'Die Halle läuft unabhängig vom Wetter — draußen entscheidet der Regen.'
                : 'Die Plätze sind abgezogen, die Linien sind frei. Nichts spricht gegen ein Match.'}
            </p>
          </div>
          <div className="flex items-center gap-6 rounded-[var(--tk-radius-lg)] border border-[var(--tk-line-dark)] px-7 py-6">
            <span aria-hidden className="text-[3.2rem] leading-none">
              {SYMBOL_GLYPH[todayWeather.symbol]}
            </span>
            <div>
              <p className="font-[var(--tk-font-display)] text-[2.4rem] leading-none text-[var(--tk-on-dark)]">
                {todayWeather.maxC}°
              </p>
              <p className="mt-1 text-[0.85rem] text-[var(--tk-on-dark-dim)]">
                {WEATHER_LABEL[todayWeather.symbol]} · {todayWeather.rainChance} % Regen
              </p>
              <p className="text-[0.78rem] text-[var(--tk-moss)]">
                Tief {todayWeather.minC}° · {todayWeather.rainMm} mm
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stundenverlauf */}
      <section className="tk-section--tight">
        <div className="tk-shell">
          <h2 className="tk-h3">Heute im Verlauf</h2>
          <div className="tk-grid-scroll mt-4 rounded-[var(--tk-radius)] border border-[var(--tk-line)] bg-[var(--tk-paper)] p-4" tabIndex={0} role="region" aria-label="Stundenverlauf, waagerecht scrollbar">
            <div className="flex gap-2">
              {todayWeather.hours.map((h) => (
                <div key={h.minute} className="flex w-[62px] flex-none flex-col items-center gap-1.5">
                  <span className="tk-num text-[0.74rem] text-[var(--tk-ink-dim)]">
                    {formatTime(h.minute)}
                  </span>
                  <span aria-hidden className="text-[1.15rem] leading-none">
                    {SYMBOL_GLYPH[h.symbol]}
                  </span>
                  <span className="tk-num text-[0.88rem] font-semibold">{h.tempC}°</span>
                  {/* Regensäule: der Balken ist die Aussage, die Zahl die Belegung */}
                  <div className="flex h-14 w-full items-end justify-center">
                    <div
                      className={cn(
                        'w-4 rounded-t-[4px]',
                        h.rainChance > 55 ? 'bg-[var(--tk-blocked)]' : 'bg-[var(--tk-clay-soft)]',
                      )}
                      style={{ height: `${Math.max(3, h.rainChance)}%` }}
                    />
                  </div>
                  <span className="text-[0.7rem] text-[var(--tk-ink-dim)]">{h.rainChance}%</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-[0.82rem] text-[var(--tk-ink-dim)]">
            Simulierte Werte. In der Produktivversion liefert ein Wetterdienst dieselben Felder —
            die Ableitung auf den Platzstatus bleibt unverändert.
          </p>
        </div>
      </section>

      {/* Platz für Platz */}
      {LOCATIONS.map((loc) => {
        const courts = courtsOf(loc.id);
        return (
          <section key={loc.id} className="tk-section--tight">
            <div className="tk-shell">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="tk-h3">{loc.name}</h2>
                <Link
                  href={`/tk/buchen?standort=${loc.id}`}
                  className="text-[0.86rem] font-semibold text-[var(--tk-clay)] underline-offset-4 hover:underline"
                >
                  Raster ansehen →
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {courts.map((court, i) => {
                  const status = courtStatusFor(court, todayIso, todayWeather);
                  return (
                    <Reveal key={court.id} delay={Math.min(0.24, i * 0.03)}>
                      <Card className="flex h-full flex-col gap-2 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{court.name}</span>
                          <Chip tone={CONDITION_CHIP[status.condition]}>{status.headline}</Chip>
                        </div>
                        <p className="text-[0.8rem] text-[var(--tk-ink-dim)]">
                          {SURFACE_LABEL[court.surface]}
                          {court.kind === 'halle' ? ' · Halle' : ' · draußen'}
                          {court.floodlight ? ' · Flutlicht' : ''}
                        </p>
                        <p className="text-[0.88rem] text-[var(--tk-ink-soft)]">{status.detail}</p>
                        {status.suggestion ? (
                          <p className="mt-auto pt-2 text-[0.84rem] text-[var(--tk-clay-deep)]">
                            {status.suggestion}
                          </p>
                        ) : null}
                      </Card>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })}

      {/* Woche */}
      <section className="tk-section tk-section--wash">
        <div className="tk-shell">
          <h2 className="tk-h2">Die nächsten sieben Tage</h2>
          <p className="tk-lede mt-2">
            Rot heißt: Sandplätze werden an dem Tag voraussichtlich gesperrt. Die Halle ist an
            allen Tagen buchbar.
          </p>
          <div className="tk-rail mt-8" tabIndex={0} role="region" aria-label="Wochenvorhersage, waagerecht scrollbar">
            {days.map((d) => {
              const s = summariseStatus(outdoor, d.date);
              const blocked = s.open === 0 && s.limited === 0;
              return (
                <Card key={d.date} className="flex flex-col gap-2 p-4">
                  <span className="text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-[var(--tk-ink-dim)]">
                    {d.date === todayIso ? 'Heute' : formatDayShort(d.date)}
                  </span>
                  <span aria-hidden className="text-[1.6rem] leading-none">
                    {SYMBOL_GLYPH[d.symbol]}
                  </span>
                  <span className="tk-num text-[1.1rem] font-semibold">
                    {d.maxC}° <span className="text-[0.9rem] font-normal text-[var(--tk-ink-dim)]">/ {d.minC}°</span>
                  </span>
                  <span className="text-[0.82rem] text-[var(--tk-ink-dim)]">
                    {d.rainChance} % Regen{d.rainMm > 0 ? ` · ${d.rainMm} mm` : ''}
                  </span>
                  <Chip tone={blocked ? 'blocked' : s.limited > 0 ? 'warn' : 'free'} className="mt-auto self-start">
                    {blocked ? 'Sand gesperrt' : s.limited > 0 ? 'Sand feucht' : 'Sand frei'}
                  </Chip>
                  <Link
                    href={`/tk/buchen?datum=${d.date}`}
                    className="text-[0.82rem] font-semibold text-[var(--tk-clay)] underline-offset-4 hover:underline"
                  >
                    Zeiten ansehen →
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Was das für Buchungen bedeutet */}
      <section className="tk-section--tight pb-16">
        <div className="tk-shell grid gap-5 md:grid-cols-3">
          {[
            {
              t: 'Sperre kommt automatisch',
              b: 'Ab acht Millimetern Regen oder über 75 Prozent Wahrscheinlichkeit sperrt sich der Sandplatz selbst. Niemand muss anrufen und niemand fährt umsonst hin.',
            },
            {
              t: 'Buchung verfällt nicht',
              b: 'Gesperrte Stunden werden als Guthaben gutgeschrieben. Sichtbar im Konto, einlösbar bei der nächsten Buchung.',
            },
            {
              t: 'Halle wird vorgeschlagen',
              b: 'Ist zur selben Zeit ein Hallenplatz frei, steht der Wechsel als ein Tipp bereit — statt einer Absage ohne Alternative.',
            },
          ].map((x) => (
            <Card key={x.t} className="flex flex-col gap-2 p-5">
              <h3 className="text-[1rem] font-semibold">{x.t}</h3>
              <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">{x.b}</p>
            </Card>
          ))}
        </div>
        <div className="tk-shell mt-6">
          <p className="tk-demo-note">
            Diese Regeln sind in der Demo umgesetzt und im Raster sichtbar — der Wetterdienst
            dahinter ist simuliert. Für den Echtbetrieb reicht ein kostenloser Anbieter wie
            Open-Meteo; die Koordinaten beider Anlagen stehen bereits in der Datenschicht.
          </p>
        </div>
      </section>
    </>
  );
}
