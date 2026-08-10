import type { Metadata } from 'next';
import { CoachBooking } from '@/components/tk/coaching/coach-booking';
import { nowMinutes, today } from '@/lib/tk/format';

export const metadata: Metadata = {
  title: 'Trainerstunde buchen',
  description:
    'Einzeln, zu zweit oder in der Gruppe: freie Trainerzeiten mit passendem Platz — ' +
    'in einem Schritt gebucht.',
};

export const revalidate = 0;

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const trainer = Array.isArray(params.trainer) ? params.trainer[0] : params.trainer;

  return <CoachBooking todayIso={today()} nowMinute={nowMinutes()} initialCoach={trainer} />;
}
