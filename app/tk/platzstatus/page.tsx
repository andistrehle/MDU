import type { Metadata } from 'next';
import { StatusBoard } from '@/components/tk/weather/status-board';
import { today } from '@/lib/tk/format';

export const metadata: Metadata = {
  title: 'Platzstatus und Wetter',
  description:
    'Welcher Platz ist heute bespielbar? Wetterlage, Regenverlauf und Status für jeden ' +
    'einzelnen Platz in Harlaching und Neuperlach.',
};

export const revalidate = 900;

export default function PlatzstatusPage() {
  return <StatusBoard todayIso={today()} />;
}
