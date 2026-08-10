'use client';

// ============================================================
// Tennis Kail — Trainerbuchung
// ============================================================
//
// UX-Konzept
// ----------
// Eine Trainerstunde ist keine Platzbuchung mit anderem Preis: Es müssen
// zwei Kalender zusammenpassen — der des Trainers und der des Platzes.
// Genau das nimmt die Oberfläche dem Gast ab. Angezeigt werden nur
// Zeitfenster, in denen beides frei ist, und der Platz wird automatisch
// mitgebucht. Preis = Trainerhonorar + Platzmiete, aufgeschlüsselt, damit
// niemand am Ende überrascht ist.
//
// Der Weg ist derselbe wie bei der Platzbuchung (wählen → prüfen →
// bestätigen), weil ein zweites Bedienmuster für dieselbe Handlung nur
// Verwirrung stiftet.
//
// Produktivversion
// ----------------
// Die Verschneidung der Kalender liegt in `slotsFor()`. Später kommt die
// Trainerverfügbarkeit aus einer Tabelle `coach_availability` plus
// Abwesenheiten; die Verschneidung selbst bleibt gleich.
// ============================================================

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { COACHES, getCoach } from '@/data/tk/coaches';
import { COURTS, getLocation } from '@/data/tk/facility';
import { buildSlots, isBlockFree, blockPrice } from '@/lib/tk/availability';
import { addDays, formatDayShort, formatPrice, formatSpan, formatTime, weekdayOf } from '@/lib/tk/format';
import { useTkStore } from '@/lib/tk/store';
import { Button, Card, Chip, Steps } from '@/components/tk/ui/primitives';
import { Segment } from '@/components/tk/ui/overlay';
import { TkAvatar, TkImage } from '@/components/tk/media/tk-image';
import { cn } from '@/lib/utils';

type Format = 'einzel' | 'duo' | 'gruppe';

const FORMAT_LABEL: Record<Format, string> = {
  einzel: 'Einzelstunde',
  duo: 'Zu zweit',
  gruppe: 'Kleingruppe',
};

const STEPS = ['Trainer und Zeit', 'Prüfen', 'Bestätigt'];
const DAYS_AHEAD = 14;

interface Option {
  from: number;
  to: number;
  courtId: string;
  courtName: string;
  locationId: string;
  courtCents: number;
}

export function CoachBooking({
  todayIso,
  nowMinute,
  initialCoach,
}: {
  todayIso: string;
  nowMinute: number;
  initialCoach?: string;
}) {
  const [coachId, setCoachId] = useState(
    initialCoach && getCoach(initialCoach) ? initialCoach : COACHES[0].id,
  );
  const [date, setDate] = useState(addDays(todayIso, 1));
  const [format, setFormat] = useState<Format>('einzel');
  const [chosen, setChosen] = useState<Option | null>(null);
  const [step, setStep] = useState(0);
  const [note, setNote] = useState('');

  const { addLine, cart, confirmCart, removeLine, totalCents } = useTkStore();
  const coach = getCoach(coachId)!;
  const dates = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(todayIso, i)),
    [todayIso],
  );
  const weekday = weekdayOf(date);

  /**
   * Verschneidung: Trainer-Fenster × freie Plätze an dessen Standorten.
   * Ergebnis sind 60-Minuten-Blöcke mit dem jeweils günstigsten freien Platz.
   */
  const options = useMemo<Option[]>(() => {
    const windows = coach.availability.filter((a) => a.weekday === weekday);
    if (windows.length === 0) return [];

    const courts = COURTS.filter((c) => coach.locationIds.includes(c.locationId));
    const perStart = new Map<number, Option>();

    for (const court of courts) {
      const loc = getLocation(court.locationId)!;
      const openBlocks = loc.hours.find((h) => h.weekday === weekday)?.blocks ?? [];
      const slots = buildSlots(court, date, { todayIso, nowMinute, openBlocks });
      for (const s of slots) {
        if (s.state !== 'frei') continue;
        if (!windows.some((w) => s.from >= w.from && s.from + 60 <= w.to)) continue;
        if (!isBlockFree(slots, s.from, 60)) continue;
        const courtCents = blockPrice(slots, s.from, 60);
        const existing = perStart.get(s.from);
        if (!existing || courtCents < existing.courtCents) {
          perStart.set(s.from, {
            from: s.from,
            to: s.from + 60,
            courtId: court.id,
            courtName: court.name,
            locationId: court.locationId,
            courtCents,
          });
        }
      }
    }
    return [...perStart.values()].sort((a, b) => a.from - b.from);
  }, [coach, date, weekday, todayIso, nowMinute]);

  const coachCents =
    format === 'einzel' ? coach.singleCents : format === 'duo' ? coach.duoCents : Math.round(coach.duoCents * 0.7);
  const perPerson = format === 'einzel' ? 1 : format === 'duo' ? 2 : 4;
  const totalForChosen = chosen ? coachCents * perPerson + chosen.courtCents : 0;

  function commit() {
    if (!chosen) return;
    const loc = getLocation(chosen.locationId)!;
    addLine({
      type: 'training',
      title: `${FORMAT_LABEL[format]} bei ${coach.name}`,
      subtitle: `${formatDayShort(date)} · ${formatSpan(chosen.from, chosen.to)} · ${chosen.courtName}, ${loc.shortName}`,
      priceCents: totalForChosen,
      date,
      from: chosen.from,
      to: chosen.to,
      courtId: chosen.courtId,
      coachId: coach.id,
    });
    setStep(1);
  }

  // ---- Bestätigung ------------------------------------------------------
  if (step === 2) {
    return (
      <div className="tk-shell py-12">
        <div className="mx-auto max-w-[560px]">
          <Steps steps={STEPS} current={2} />
          <Card className="mt-8 flex flex-col gap-4 p-6">
            <h1 className="tk-h2">Trainerstunde vorgemerkt</h1>
            <p className="text-[0.95rem] text-[var(--tk-ink-soft)]">
              In der Demo bleibt die Buchung im Browser. Im Echtbetrieb bekämen Gast und Trainer
              eine Bestätigung, und die Stunde stünde im Kalender beider Seiten — inklusive
              reserviertem Platz.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/tk/konto" className="tk-btn">
                Im Konto ansehen
              </Link>
              <Button tone="ghost" onClick={() => setStep(0)}>
                Weitere Stunde buchen
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ---- Prüfen -----------------------------------------------------------
  if (step === 1) {
    return (
      <div className="tk-shell py-12">
        <div className="mx-auto max-w-[600px]">
          <Steps steps={STEPS} current={1} />
          <h1 className="tk-h2 mt-6">Stunde prüfen</h1>

          <Card className="mt-6 divide-y divide-[var(--tk-line-soft)]">
            {cart.map((l) => (
              <div key={l.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold">{l.title}</p>
                  <p className="text-[0.86rem] text-[var(--tk-ink-dim)]">{l.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tk-num font-semibold">{formatPrice(l.priceCents)}</span>
                  <button
                    onClick={() => removeLine(l.id)}
                    aria-label="Entfernen"
                    className="grid h-8 w-8 place-items-center rounded-full bg-[var(--tk-chalk-2)] text-[var(--tk-ink-dim)]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-4">
              <span className="font-semibold">Summe</span>
              <span className="tk-num text-[1.15rem] font-semibold">{formatPrice(totalCents)}</span>
            </div>
          </Card>

          <Card className="mt-5 flex flex-col gap-3 p-5">
            <label className="tk-label" htmlFor="tr-note">
              Woran willst du arbeiten?
            </label>
            <textarea
              id="tr-note"
              className="tk-textarea"
              placeholder="Zum Beispiel: Aufschlag, Rückhand längs, Matchvorbereitung"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="tk-hint">
              Geht in der Produktivversion direkt an den Trainer, damit die Stunde nicht mit
              Fragen anfängt.
            </p>
          </Card>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() => {
                confirmCart(todayIso);
                setStep(2);
              }}
              disabled={cart.length === 0}
            >
              Stunde bestätigen
            </Button>
            <Button tone="ghost" size="lg" onClick={() => setStep(0)}>
              Zurück
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Auswahl ----------------------------------------------------------
  return (
    <div className="pb-16">
      <div className="tk-shell pt-8">
        <Steps steps={STEPS} current={0} />
        <h1 className="tk-h2 mt-5">Trainerstunde buchen</h1>
        <p className="tk-lede mt-2">
          Angezeigt wird nur, was wirklich geht: Zeiten, zu denen sowohl der Trainer als auch ein
          Platz frei ist. Der Platz wird gleich mitreserviert.
        </p>
      </div>

      {/* Trainerwahl */}
      <div className="tk-shell mt-8">
        <div className="grid gap-4 md:grid-cols-3">
          {COACHES.map((c) => {
            const active = c.id === coachId;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setCoachId(c.id);
                  setChosen(null);
                }}
                aria-pressed={active}
                className={cn(
                  'flex flex-col overflow-hidden rounded-[var(--tk-radius)] border text-left transition-all',
                  active
                    ? 'border-[var(--tk-clay)] shadow-[var(--tk-shadow)]'
                    : 'border-[var(--tk-line)] hover:border-[var(--tk-line-hard)]',
                )}
              >
                <TkImage slot={c.imageSlot} ratio="16 / 9" rounded={false} sizes="(max-width: 768px) 100vw, 33vw" />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{c.name}</span>
                    {active ? <Chip tone="clay">gewählt</Chip> : null}
                  </div>
                  <span className="text-[0.84rem] text-[var(--tk-ink-dim)]">{c.role}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {c.focus.slice(0, 3).map((f) => (
                      <Chip key={f} tone="outline">
                        {f}
                      </Chip>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profil und Formatwahl */}
      <div className="tk-shell mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <Segment
              label="Format"
              value={format}
              onChange={setFormat}
              options={[
                { value: 'einzel', label: 'Einzel' },
                { value: 'duo', label: 'Zu zweit' },
                { value: 'gruppe', label: 'Gruppe ab 4' },
              ]}
            />
          </div>

          {/* Datumsleiste */}
          <div className="tk-rail !grid-flow-col !auto-cols-[minmax(74px,1fr)]" tabIndex={0} role="region" aria-label="Datumsauswahl, waagerecht scrollbar">
            {dates.map((d) => {
              const has = coach.availability.some((a) => a.weekday === weekdayOf(d));
              const active = d === date;
              return (
                <button
                  key={d}
                  onClick={() => {
                    setDate(d);
                    setChosen(null);
                  }}
                  disabled={!has}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-[14px] border px-2 py-3 transition-colors',
                    active
                      ? 'border-[var(--tk-clay)] bg-[var(--tk-clay-wash)] text-[var(--tk-clay-deep)]'
                      : has
                        ? 'border-[var(--tk-line)] text-[var(--tk-ink-soft)] hover:border-[var(--tk-line-hard)]'
                        : 'border-[var(--tk-line-soft)] text-[var(--tk-ink-faint)]',
                  )}
                >
                  <span className="text-[0.74rem] font-semibold uppercase">
                    {d === todayIso ? 'Heute' : formatDayShort(d).split(',')[0]}
                  </span>
                  <span className="tk-num text-[1rem] font-semibold">{d.slice(8)}.</span>
                  <span className="text-[0.68rem]">{has ? 'frei' : '—'}</span>
                </button>
              );
            })}
          </div>

          {/* Zeitfenster */}
          <div className="mt-6">
            <h2 className="tk-h3">Freie Zeiten am {formatDayShort(date)}</h2>
            {options.length === 0 ? (
              <Card className="mt-4 p-6">
                <p className="text-[var(--tk-ink-soft)]">
                  {coach.name} trainiert an diesem Tag nicht — oder alle passenden Plätze sind
                  belegt. Anderen Tag wählen, oder{' '}
                  <Link href="/tk/kontakt" className="font-semibold text-[var(--tk-clay)] underline">
                    kurz anfragen
                  </Link>
                  .
                </p>
              </Card>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                {options.map((o) => {
                  const active = chosen?.from === o.from;
                  return (
                    <button
                      key={o.from}
                      onClick={() => setChosen(o)}
                      aria-pressed={active}
                      className={cn(
                        'flex flex-col items-start gap-0.5 rounded-[12px] border px-4 py-2.5 transition-colors',
                        active
                          ? 'border-[var(--tk-clay)] bg-[var(--tk-clay)] text-white'
                          : 'border-[var(--tk-line-hard)] hover:bg-[var(--tk-chalk)]',
                      )}
                    >
                      <span className="tk-num text-[0.95rem] font-semibold">
                        {formatTime(o.from)}
                      </span>
                      <span
                        className={cn(
                          'text-[0.72rem]',
                          active ? 'text-white/80' : 'text-[var(--tk-ink-dim)]',
                        )}
                      >
                        {o.courtName} · {getLocation(o.locationId)?.shortName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Zusammenfassung */}
        <aside className="lg:sticky lg:top-[86px] lg:self-start">
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <TkAvatar slot={coach.imageSlot} size={54} />
              <div>
                <p className="font-semibold">{coach.name}</p>
                <p className="text-[0.82rem] text-[var(--tk-ink-dim)]">{coach.role}</p>
              </div>
            </div>

            <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">{coach.bio}</p>

            <dl className="flex flex-col gap-1 text-[0.85rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--tk-ink-dim)]">Sprachen</dt>
                <dd className="text-right">{coach.languages.join(', ')}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--tk-ink-dim)]">Lizenzen</dt>
                <dd className="text-right">{coach.licences.join(', ')}</dd>
              </div>
            </dl>

            <div className="border-t border-[var(--tk-line-soft)] pt-4">
              <p className="tk-label mb-2">Preis</p>
              <dl className="flex flex-col gap-1.5 text-[0.88rem]">
                <div className="flex justify-between">
                  <dt>
                    {FORMAT_LABEL[format]}
                    {perPerson > 1 ? ` · ${perPerson} Personen` : ''}
                  </dt>
                  <dd className="tk-num">{formatPrice(coachCents * perPerson)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Platzmiete 60 min</dt>
                  <dd className="tk-num">
                    {chosen ? formatPrice(chosen.courtCents) : '—'}
                  </dd>
                </div>
                <div className="mt-1 flex justify-between border-t border-[var(--tk-line-soft)] pt-2 font-semibold">
                  <dt>Summe</dt>
                  <dd className="tk-num">{chosen ? formatPrice(totalForChosen) : '—'}</dd>
                </div>
                {perPerson > 1 && chosen ? (
                  <p className="text-[0.8rem] text-[var(--tk-ink-dim)]">
                    entspricht {formatPrice(Math.round(totalForChosen / perPerson))} pro Person
                  </p>
                ) : null}
              </dl>
            </div>

            <Button block size="lg" onClick={commit} disabled={!chosen}>
              {chosen
                ? `${formatTime(chosen.from)} übernehmen`
                : 'Zeit auswählen'}
            </Button>
            <p className="tk-hint">
              Platz und Trainer werden zusammen gebucht. Storno bis 24 Stunden vorher kostenlos.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
