import type { Metadata, Viewport } from 'next';
import { Saira_Condensed, Manrope, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { GlobalChrome } from '@/components/mdu/global-chrome';
import { AppProviders } from '@/components/mdu/app-providers';
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

// Basis-URL für Canonical/OG (Fallback = Live-Domain), überschreibbar per ENV.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mdudarts.de';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Münchner Dart Union (MDU) – Dart-Liga München',
    template: '%s · Münchner Dart Union (MDU)',
  },
  description:
    'Offizielle Seite der Münchner Dart Union (MDU): Ligabetrieb, Tabellen, Spielpläne, ' +
    'Ergebnisse und Teams im organisierten Dartsport in München.',
  applicationName: 'Münchner Dart Union',
  keywords: [
    'Münchner Dart Union', 'MDU', 'MDU München', 'MDU Dart', 'MDU Darts',
    'Dart Liga München', 'Dartliga München', 'Darts München', 'Dartsport München',
    'Dartverein München', 'Dart München',
  ],
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'Münchner Dart Union',
    url: SITE_URL,
    title: 'Münchner Dart Union (MDU) – Dart-Liga München',
    description:
      'Ligabetrieb, Tabellen, Spielpläne, Ergebnisse und Teams der Münchner Dart Union.',
  },
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
        {/* Theme VOR dem ersten Paint setzen. Quelle: ZUERST localStorage
            (eindeutig, ohne Pfad-Probleme), Cookie nur als Fallback. Grund: ein
            evtl. veraltetes zweites „mdu-theme"-Cookie mit tieferem Pfad konnte
            sonst das (per path=/ gesetzte) aktuelle Cookie überstimmen und die
            Seite beim Neuöffnen fälschlich auf Dark zurückwerfen.
            Bewusst ein rohes, synchrones Inline-Script als erstes im <body> — es
            läuft beim HTML-Parsen, bevor der Body gezeichnet wird. So bleiben die
            Seiten statisch/ISR (kein cookies() im Layout → kein dynamisches
            Rendering, echtes 404) UND das Theme hält über Reloads. Default
            (keine Wahl) = „Old School" (light); nur ausdrückliches „dark" bleibt dunkel. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var t=null;try{t=localStorage.getItem('mdu-theme')}catch(e){}if(t!=='dark'&&t!=='light'){var m=document.cookie.match(/(?:^|;\\s*)mdu-theme=([^;]*)/);t=m?m[1]:null}if(t!=='dark')document.documentElement.dataset.theme='light'}catch(e){document.documentElement.dataset.theme='light'}",
          }}
        />
        <AppProviders>
          {children}
          {/* Bottom-Nav, Demo-Tour und Analytics gehören zur MDU-Seite und
              blenden sich unter /mdc (Munich Dart Challenge) selbst aus. */}
          <GlobalChrome />
        </AppProviders>
        {/* Vercel Web Analytics: cookielose, anonyme Seitenaufrufe. Erfasst erst,
            wenn im Vercel-Dashboard „Web Analytics" aktiviert ist. */}
        <Analytics />
      </body>
    </html>
  );
}
