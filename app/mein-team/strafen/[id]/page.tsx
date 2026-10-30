import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { StrafenTracker } from '@/components/mdu/strafen-tracker';

// Strafen-Tracker eines Abends (Migration 0066). Daten nur fürs eigene Team (RLS),
// deshalb lädt der Browser sie — der Server liefert nur den Rahmen.
export const metadata: Metadata = {
  title: 'Strafen-Tracker',
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StrafenTrackerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  return <StrafenTracker id={id} />;
}
