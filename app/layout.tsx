import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Theme serverseitig aus dem Cookie bestimmen und direkt ins <html> schreiben.
  // Dadurch liefert schon der Server das richtige Theme aus — kein Flash, kein
  // „springt auf Dunkel", unabhängig von Client-Script, localStorage-Timing,
  // Hydration oder Cache. Default (kein Cookie) = „Old School" (light); nur eine
  // ausdrückliche „dark"-Wahl (New Design) bleibt dunkel (dann kein data-theme).
  const themeCookie = (await cookies()).get('mdu-theme')?.value;
  const dataTheme = themeCookie === 'dark' ? undefined : 'light';

  return (
    <html
      lang="de"
      data-theme={dataTheme}
      className={`${sairaCondensed.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
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
