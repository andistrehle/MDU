import type { Metadata } from 'next';
import { DashboardClient } from '@/components/tk/admin/dashboard-client';
import { nowMinutes, today } from '@/lib/tk/format';

export const metadata: Metadata = {
  title: 'Betreiber-Dashboard',
  description:
    'Belegungsplan, Auslastung, Umsatz, Kurse und Platzsperren — die Betreibersicht der ' +
    'Tennis-Kail-Demo.',
};

export const revalidate = 0;

export default function DashboardPage() {
  return <DashboardClient todayIso={today()} nowMinute={nowMinutes()} />;
}
