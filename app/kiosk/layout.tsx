import type { Metadata } from 'next';

// Eingabeseite fürs Tablet im Lokal — gehört in keinen Suchindex.
export const metadata: Metadata = {
  title: 'Spielbericht – Tablet',
  robots: { index: false, follow: false },
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
