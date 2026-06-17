import type { Metadata } from 'next';

// Interner/geschützter Bereich — nicht von Suchmaschinen indexieren.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NoindexLayout({ children }: { children: React.ReactNode }) {
  return children;
}
