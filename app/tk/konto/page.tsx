import type { Metadata } from 'next';
import { AccountClient } from '@/components/tk/account/account-client';
import { today } from '@/lib/tk/format';

export const metadata: Metadata = {
  title: 'Mein Konto',
  description:
    'Buchungen, festes Abo, Guthaben, Gutscheine und Benachrichtigungen — die Kundensicht ' +
    'der Tennis-Kail-Demo.',
};

export const revalidate = 0;

export default function KontoPage() {
  return <AccountClient todayIso={today()} />;
}
