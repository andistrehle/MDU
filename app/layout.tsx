import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Saira_Condensed, Manrope, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/mdu/bottom-nav';
import { DemoTour } from '@/components/mdu/demo-tour';
import { DemoTourButton } from '@/components/mdu/tour-restart-link';
import { AuthProvider } from '@/lib/auth/auth-context';
import { SITE_INDEXABLE } from '@/lib/site-config';

const sairaCondensed = Saira_Condensed({
  variable: '--font-saira-condensed',
  subsets: ['latin'],
  weight: ['400', '700', '800', '900'],
  display: 'swap',
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Münchner Dart Union',
  description: 'Die offizielle Liga-Seite für den organisierten Dartsport in München.',
  // Pre-Go-live: Seite erreichbar, aber nicht für Suchmaschinen. Schalter: lib/site-config.ts
  robots: SITE_INDEXABLE ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      className={`${sairaCondensed.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Restore the persisted theme before first paint (no flash).
            Default (Erstbesuch / keine Auswahl) = „Old School" (light);
            nur eine ausdrückliche „dark"-Wahl (New Design) bleibt dunkel. */}
        <Script id="mdu-theme-init" strategy="beforeInteractive">
          {"try{if(localStorage.getItem('mdu-theme')!=='dark')document.documentElement.dataset.theme='light'}catch(e){document.documentElement.dataset.theme='light'}"}
        </Script>
        <AuthProvider>
          {children}
          <BottomNav />
          <DemoTourButton />
          <DemoTour />
        </AuthProvider>
      </body>
    </html>
  );
}
