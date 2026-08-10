import type { Metadata } from 'next';
import { BookingClient } from '@/components/tk/booking/booking-client';
import { nowMinutes, today } from '@/lib/tk/format';

export const metadata: Metadata = {
  title: 'Platz buchen',
  description:
    'Freie Plätze in Harlaching und Neuperlach, sieben Tage im Voraus — Halle und Sand, ' +
    'mit Preis pro Zeitfenster.',
};

/** Der Referenztag muss frisch sein, sonst zeigt das Raster gestern. */
export const revalidate = 0;

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const von = Number(first(params.von));

  return (
    <div className="pb-16">
      <BookingClient
        todayIso={today()}
        nowMinute={nowMinutes()}
        initialLocation={first(params.standort)}
        initialDate={first(params.datum)}
        initialCourt={first(params.platz)}
        initialFrom={Number.isFinite(von) && von > 0 ? von : undefined}
      />
    </div>
  );
}
