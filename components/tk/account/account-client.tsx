'use client';

// ============================================================
// Tennis Kail — Kundenkonto
// ============================================================
//
// UX-Konzept
// ----------
// Ein Konto bei einer Tennisanlage hat genau vier Aufgaben: Wann spiele
// ich als Nächstes, was habe ich noch offen, was ist mein Guthaben wert,
// und wovon will ich benachrichtigt werden. Alles andere ist Ballast.
// Deshalb: eine Übersicht, drei Reiter — keine Untermenüs.
//
// Die eigenen Buchungen aus der Demo (localStorage) stehen zusammen mit
// den vorbereiteten Demo-Buchungen in derselben Liste, damit die
// Vorführung sofort etwas zu zeigen hat.
// ============================================================

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ACCOUNT_BOOKINGS, DEMO_CUSTOMER, NOTIFICATIONS, NOTIFICATION_PREFS, VOUCHERS } from '@/data/tk/account';
import { getCoach } from '@/data/tk/coaches';
import { getCourse } from '@/data/tk/courses';
import { WEEKDAY_LABEL, getCourt, getLocation } from '@/data/tk/facility';
import { addDays, formatAgo, formatDayLong, formatPrice, formatSpan, relativeDay } from '@/lib/tk/format';
import { useTkStore } from '@/lib/tk/store';
import type { Booking } from '@/lib/tk/types';
import { Button, Card, Chip, Empty, Kpi } from '@/components/tk/ui/primitives';
import { Segment } from '@/components/tk/ui/overlay';
import { cn } from '@/lib/utils';

type Tab = 'buchungen' | 'guthaben' | 'nachrichten' | 'profil';

const STATUS_TONE = {
  bestaetigt: 'free',
  offen: 'warn',
  storniert: 'blocked',
  abgeschlossen: 'neutral',
} as const;

function describe(b: Booking): { title: string; sub: string } {
  if (b.type === 'training') {
    const coach = b.coachId ? getCoach(b.coachId) : undefined;
    const court = b.courtId ? getCourt(b.courtId) : undefined;
    return {
      title: `Training bei ${coach?.name ?? 'Trainer'}`,
      sub: court ? `${court.name} · ${getLocation(court.locationId)?.shortName}` : '',
    };
  }
  if (b.type === 'kurs') {
    const course = b.courseId ? getCourse(b.courseId) : undefined;
    return { title: course?.title ?? b.note ?? 'Kurs', sub: course?.schedule ?? '' };
  }
  const court = b.courtId ? getCourt(b.courtId) : undefined;
  return {
    title: court ? `${court.name} · ${getLocation(court.locationId)?.shortName}` : 'Platzbuchung',
    sub: b.note ?? '',
  };
}

export function AccountClient({ todayIso }: { todayIso: string }) {
  const [tab, setTab] = useState<Tab>('buchungen');
  const { bookings: ownBookings, cancelBooking, readNotifications, markAllRead, markRead, reset } = useTkStore();

  // Demo-Buchungen relativ zum heutigen Tag, damit „morgen" auch morgen heißt.
  const seeded = useMemo<Booking[]>(
    () => ACCOUNT_BOOKINGS.map(({ dayOffset, ...b }) => ({ ...b, date: addDays(todayIso, dayOffset) })),
    [todayIso],
  );

  const all = useMemo(
    () => [...seeded, ...ownBookings].sort((a, b) => (a.date === b.date ? a.from - b.from : a.date.localeCompare(b.date))),
    [seeded, ownBookings],
  );

  const upcoming = all.filter((b) => b.date >= todayIso && b.status !== 'storniert');
  const past = all.filter((b) => b.date < todayIso || b.status === 'storniert');
  const next = upcoming[0];

  const voucherTotal = VOUCHERS.reduce((s, v) => s + v.balanceCents, 0);
  const unread = NOTIFICATIONS.filter((n) => !n.read && !readNotifications.includes(n.id));

  return (
    <>
      {/* Kopf */}
      <section className="tk-section--dark py-10">
        <div className="tk-shell flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="tk-eyebrow tk-eyebrow--dark">Mein Konto</span>
              <h1 className="tk-display mt-3 text-[clamp(2rem,6vw,3.2rem)] text-[var(--tk-on-dark)]">
                Servus, {DEMO_CUSTOMER.firstName}
              </h1>
              <p className="mt-2 text-[0.92rem] text-[var(--tk-on-dark-dim)]">
                Mitglied seit {DEMO_CUSTOMER.memberSince.slice(0, 4)} · {DEMO_CUSTOMER.lk} ·{' '}
                {getLocation(DEMO_CUSTOMER.homeLocationId)?.shortName}
              </p>
            </div>

            {next ? (
              <Card dark className="min-w-[260px] p-5">
                <p className="text-[0.72rem] uppercase tracking-[0.14em] text-[var(--tk-moss)]">
                  Als Nächstes
                </p>
                <p className="mt-1.5 font-[var(--tk-font-display)] text-[1.4rem] leading-tight">
                  {describe(next).title}
                </p>
                <p className="mt-1 text-[0.88rem] text-[var(--tk-on-dark-dim)]">
                  {relativeDay(todayIso, next.date)} · {formatSpan(next.from, next.to)}
                </p>
              </Card>
            ) : null}
          </div>

          <div className="grid gap-6 border-t border-[var(--tk-line-dark)] pt-6 sm:grid-cols-4">
            {[
              { v: String(upcoming.length), l: 'kommende Buchungen' },
              { v: formatPrice(DEMO_CUSTOMER.balanceCents + voucherTotal), l: 'Guthaben und Gutscheine' },
              { v: String(DEMO_CUSTOMER.stats.hoursThisYear), l: 'Stunden dieses Jahr' },
              { v: String(unread.length), l: 'ungelesene Nachrichten' },
            ].map((k) => (
              <div key={k.l}>
                <p className="font-[var(--tk-font-display)] text-[1.7rem] leading-none text-[var(--tk-on-dark)]">
                  {k.v}
                </p>
                <p className="mt-1 text-[0.78rem] text-[var(--tk-on-dark-dim)]">{k.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reiter */}
      <div className="tk-shell mt-8">
        <Segment
          label="Bereich"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'buchungen', label: 'Buchungen' },
            { value: 'guthaben', label: 'Guthaben' },
            { value: 'nachrichten', label: `Nachrichten${unread.length ? ` (${unread.length})` : ''}` },
            { value: 'profil', label: 'Profil' },
          ]}
        />
      </div>

      <section className="tk-section--tight pb-16">
        <div className="tk-shell">
          {tab === 'buchungen' ? (
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
              <div>
                <h2 className="tk-h3 mb-4">Kommende Termine</h2>
                {upcoming.length === 0 ? (
                  <Empty
                    title="Nichts geplant"
                    body="Im Moment steht kein Termin an. Das Buchungsraster zeigt, was in den nächsten sieben Tagen frei ist."
                    action={
                      <Link href="/tk/buchen" className="tk-btn">
                        Platz buchen
                      </Link>
                    }
                  />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {upcoming.map((b) => {
                      const d = describe(b);
                      const own = ownBookings.some((o) => o.id === b.id);
                      return (
                        <li key={b.id}>
                          <Card className="flex flex-wrap items-center gap-4 p-4">
                            <div className="flex w-[74px] flex-none flex-col items-center rounded-[10px] bg-[var(--tk-clay-wash)] py-2">
                              <span className="text-[0.72rem] font-semibold uppercase text-[var(--tk-clay-deep)]">
                                {relativeDay(todayIso, b.date)}
                              </span>
                              <span className="tk-num text-[1.1rem] font-semibold text-[var(--tk-clay-deep)]">
                                {b.date.slice(8)}.
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">{d.title}</p>
                              <p className="text-[0.85rem] text-[var(--tk-ink-dim)]">
                                {b.from > 0 ? `${formatSpan(b.from, b.to)} · ` : ''}
                                {d.sub}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Chip tone={STATUS_TONE[b.status]}>{b.status}</Chip>
                              <span className="tk-num text-[0.92rem] font-semibold">
                                {formatPrice(b.priceCents)}
                              </span>
                              {own ? (
                                <Button tone="ghost" size="sm" onClick={() => cancelBooking(b.id)}>
                                  Stornieren
                                </Button>
                              ) : null}
                            </div>
                          </Card>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <h2 className="tk-h3 mb-4 mt-10">Vergangen</h2>
                <Card className="divide-y divide-[var(--tk-line-soft)]">
                  {past.map((b) => {
                    const d = describe(b);
                    return (
                      <div key={b.id} className="flex flex-wrap items-center gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.94rem] font-medium">{d.title}</p>
                          <p className="text-[0.82rem] text-[var(--tk-ink-dim)]">
                            {formatDayLong(b.date)}
                            {b.note ? ` · ${b.note}` : ''}
                          </p>
                        </div>
                        <Chip tone={STATUS_TONE[b.status]}>{b.status}</Chip>
                        <span className="tk-num text-[0.88rem] text-[var(--tk-ink-dim)]">
                          {formatPrice(b.priceCents)}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              </div>

              {/* Abo */}
              <aside className="flex flex-col gap-4">
                <Card className="flex flex-col gap-3 p-5">
                  <h2 className="tk-h3">Feste Stunde</h2>
                  <p className="text-[0.94rem] text-[var(--tk-ink-soft)]">
                    {DEMO_CUSTOMER.subscription.label}
                  </p>
                  <dl className="flex flex-col gap-1.5 text-[0.88rem]">
                    <div className="flex justify-between border-b border-[var(--tk-line-soft)] pb-1.5">
                      <dt className="text-[var(--tk-ink-dim)]">Termin</dt>
                      <dd>
                        {WEEKDAY_LABEL[DEMO_CUSTOMER.subscription.weekday]}{' '}
                        {formatSpan(DEMO_CUSTOMER.subscription.from, DEMO_CUSTOMER.subscription.to)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-[var(--tk-line-soft)] pb-1.5">
                      <dt className="text-[var(--tk-ink-dim)]">Laufzeit</dt>
                      <dd>
                        {DEMO_CUSTOMER.subscription.validFrom.slice(8)}.
                        {DEMO_CUSTOMER.subscription.validFrom.slice(5, 7)}. –{' '}
                        {DEMO_CUSTOMER.subscription.validTo.slice(8)}.
                        {DEMO_CUSTOMER.subscription.validTo.slice(5, 7)}.
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-[var(--tk-ink-dim)]">Preis</dt>
                      <dd className="tk-num font-semibold">
                        {formatPrice(DEMO_CUSTOMER.subscription.priceCents)}
                      </dd>
                    </div>
                  </dl>
                  <p className="tk-hint">
                    Abo-Stunden erscheinen im Raster als belegt und müssen nicht einzeln gebucht
                    werden.
                  </p>
                </Card>

                <Card className="flex flex-col gap-3 p-5">
                  <h2 className="tk-h3">Lieblingsplatz</h2>
                  <Kpi value={DEMO_CUSTOMER.stats.favouriteCourt} label="am häufigsten gebucht" />
                  <p className="text-[0.88rem] text-[var(--tk-ink-soft)]">
                    {DEMO_CUSTOMER.stats.bookingsThisYear} Buchungen in diesem Jahr,{' '}
                    {DEMO_CUSTOMER.stats.hoursThisYear} Stunden auf dem Platz.
                  </p>
                </Card>
              </aside>
            </div>
          ) : null}

          {tab === 'guthaben' ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className="flex flex-col gap-4 p-6">
                <h2 className="tk-h3">Guthaben</h2>
                <p className="font-[var(--tk-font-display)] text-[2.6rem] leading-none">
                  {formatPrice(DEMO_CUSTOMER.balanceCents)}
                </p>
                <p className="text-[0.92rem] text-[var(--tk-ink-soft)]">
                  Entstanden aus einer 10er-Karte und einer Gutschrift für eine wegen Regen
                  gesperrte Stunde. Wird bei der nächsten Buchung automatisch verrechnet.
                </p>
                <Link href="/tk/buchen" className="tk-btn mt-auto">
                  Guthaben einlösen
                </Link>
              </Card>

              <div className="flex flex-col gap-3">
                <h2 className="tk-h3">Gutscheine</h2>
                {VOUCHERS.map((v) => (
                  <Card key={v.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-semibold">{v.title}</p>
                      <p className="tk-num text-[0.8rem] text-[var(--tk-ink-dim)]">
                        {v.code} · gültig bis {v.validUntil.slice(8)}.{v.validUntil.slice(5, 7)}.
                        {v.validUntil.slice(0, 4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tk-num font-semibold">{formatPrice(v.balanceCents)}</p>
                      {v.balanceCents < v.valueCents ? (
                        <p className="text-[0.76rem] text-[var(--tk-ink-dim)]">
                          von {formatPrice(v.valueCents)}
                        </p>
                      ) : null}
                    </div>
                  </Card>
                ))}
                <Link href="/tk/gutscheine" className="tk-btn tk-btn--ghost">
                  Gutschein verschenken
                </Link>
              </div>
            </div>
          ) : null}

          {tab === 'nachrichten' ? (
            <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
              <div>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="tk-h3">Posteingang</h2>
                  {unread.length > 0 ? (
                    <Button tone="ghost" size="sm" onClick={() => markAllRead(NOTIFICATIONS.map((n) => n.id))}>
                      Alle als gelesen
                    </Button>
                  ) : null}
                </div>
                <ul className="flex flex-col gap-3">
                  {NOTIFICATIONS.map((n) => {
                    const isRead = n.read || readNotifications.includes(n.id);
                    return (
                      <li key={n.id}>
                        <Card
                          className={cn(
                            'flex gap-4 p-4',
                            !isRead && 'border-[var(--tk-clay-soft)] bg-[var(--tk-clay-wash)]',
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              'mt-1.5 h-2 w-2 flex-none rounded-full',
                              isRead ? 'bg-[var(--tk-line-hard)]' : 'bg-[var(--tk-clay)]',
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{n.title}</p>
                              <Chip tone="outline">{n.channel}</Chip>
                              <span className="text-[0.78rem] text-[var(--tk-ink-dim)]">
                                {formatAgo(n.hoursAgo)}
                              </span>
                            </div>
                            <p className="mt-1 text-[0.9rem] text-[var(--tk-ink-soft)]">{n.body}</p>
                            {!isRead ? (
                              <button
                                onClick={() => markRead(n.id)}
                                className="mt-2 text-[0.82rem] font-semibold text-[var(--tk-clay)] underline-offset-4 hover:underline"
                              >
                                Als gelesen markieren
                              </button>
                            ) : null}
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <Card className="flex flex-col gap-4 p-5">
                <h2 className="tk-h3">Wovon willst du hören?</h2>
                <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">
                  Jede Art von Nachricht lässt sich einzeln pro Kanal einstellen. Ohne
                  Einstellung wird nichts verschickt.
                </p>
                <table className="tk-table">
                  <thead>
                    <tr>
                      <th scope="col">Anlass</th>
                      <th scope="col" className="text-center">
                        Push
                      </th>
                      <th scope="col" className="text-center">
                        Mail
                      </th>
                      <th scope="col" className="text-center">
                        SMS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {NOTIFICATION_PREFS.map((p) => (
                      <tr key={p.id}>
                        <th scope="row" className="text-[0.88rem] font-normal">
                          {p.label}
                        </th>
                        {(['push', 'email', 'sms'] as const).map((ch) => (
                          <td key={ch} className="text-center">
                            <input
                              type="checkbox"
                              defaultChecked={p[ch]}
                              aria-label={`${p.label} per ${ch}`}
                              className="h-4 w-4 accent-[var(--tk-clay)]"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="tk-hint">
                  Einstellungen werden in der Demo nicht gespeichert.
                </p>
              </Card>
            </div>
          ) : null}

          {tab === 'profil' ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="flex flex-col gap-4 p-6">
                <h2 className="tk-h3">Stammdaten</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ['Name', DEMO_CUSTOMER.name, 'name'],
                    ['E-Mail', DEMO_CUSTOMER.email, 'email'],
                    ['Telefon', DEMO_CUSTOMER.phone, 'tel'],
                    ['Leistungsklasse', DEMO_CUSTOMER.lk, 'off'],
                  ].map(([label, value, ac]) => (
                    <div key={label} className="tk-field">
                      <label className="tk-label" htmlFor={`pf-${label}`}>
                        {label}
                      </label>
                      <input
                        id={`pf-${label}`}
                        className="tk-input"
                        defaultValue={value}
                        autoComplete={ac}
                      />
                    </div>
                  ))}
                </div>
                <p className="tk-hint">
                  Änderungen werden in der Demo nicht übernommen — es gibt keinen Server dahinter.
                </p>
              </Card>

              <Card className="flex flex-col gap-4 p-6">
                <h2 className="tk-h3">Demo zurücksetzen</h2>
                <p className="text-[0.94rem] text-[var(--tk-ink-soft)]">
                  Alles, was in dieser Demo gebucht wurde, liegt im Speicher dieses Browsers.
                  Zurücksetzen löscht Auswahl, Buchungen und gelesene Nachrichten — der
                  Ausgangszustand für die nächste Vorführung.
                </p>
                <Button tone="ghost" onClick={reset}>
                  Demo-Daten löschen
                </Button>
                <p className="tk-hint">
                  Betrifft nur diesen Browser. Es werden keine Daten an einen Server übertragen.
                </p>
              </Card>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
