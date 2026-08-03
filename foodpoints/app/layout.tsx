import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/app-config';
import { BottomNav } from '@/components/nav/bottom-nav';
import { UndoToast } from '@/components/undo-toast';

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} – Ernährung & Punkte im Blick`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  robots: { index: false, follow: false }, // Pre-Launch: noindex
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F8F6' },
    { media: '(prefers-color-scheme: dark)', color: '#0E1412' },
  ],
};

/** Setzt das Theme vor dem ersten Paint (verhindert Flackern). */
const themeScript = `
try {
  var t = localStorage.getItem('fp-theme');
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${manrope.variable} antialiased`}>
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col pb-24">
          {children}
        </div>
        <UndoToast />
        <BottomNav />
      </body>
    </html>
  );
}
