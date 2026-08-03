import Link from 'next/link';
import { Camera, Barcode, FileScan, Search } from 'lucide-react';
import { AI_ESTIMATE_DISCLAIMER } from '@/lib/app-config';
import { Card } from '@/components/ui/card';

export const metadata = { title: 'Scannen' };

const options = [
  {
    href: '/scannen/foto',
    icon: Camera,
    title: 'Mahlzeit fotografieren',
    text: 'Foto aufnehmen — die KI schlägt Bestandteile und Mengen vor, du prüfst und bestätigst.',
  },
  {
    href: '/scannen/barcode',
    icon: Barcode,
    title: 'Barcode scannen',
    text: 'EAN/UPC mit der Kamera scannen und Produktdaten übernehmen.',
  },
  {
    href: '/scannen/etikett',
    icon: FileScan,
    title: 'Nährwerttabelle scannen',
    text: 'Etikett fotografieren — Werte werden ausgelesen und normalisiert.',
  },
  {
    href: '/suche',
    icon: Search,
    title: 'Manuell suchen',
    text: 'Ohne Kamera: Lebensmittel in der Datenbank suchen.',
  },
];

export default function ScanHubPage() {
  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-extrabold text-ink">Scannen</h1>
      <div className="space-y-3">
        {options.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="block">
            <Card className="flex items-center gap-4 hover:bg-card2">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink">
                <Icon size={24} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{title}</p>
                <p className="text-xs leading-relaxed text-mut">{text}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <p className="px-2 text-center text-[11px] leading-relaxed text-mut">{AI_ESTIMATE_DISCLAIMER}</p>
    </main>
  );
}
