import type { MetadataRoute } from 'next';
import { SITE_INDEXABLE } from '@/lib/site-config';
import { MDC_STANDALONE, MDC_INDEXABLE, MDC_ORIGIN } from '@/lib/mdc/site';

// Basis-URL der Live-Seite. Über NEXT_PUBLIC_SITE_URL überschreibbar.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mdudarts.de';

/**
 * robots.txt — öffentliche Seiten dürfen indexiert werden,
 * interne/geschützte Bereiche sind ausgeschlossen.
 * Vor dem Go-live (SITE_INDEXABLE = false) wird das gesamte Crawling gesperrt.
 */
export default function robots(): MetadataRoute.Robots {
  // Eigenständige MDC-Seite: Dort gibt es die MDU-Bereiche gar nicht, dafür
  // eine eigene Sitemap. Freigegeben wird erst, wenn die Pflichtangaben im
  // Impressum stehen (siehe lib/mdc/site.ts).
  if (MDC_STANDALONE) {
    if (!MDC_INDEXABLE) {
      return { rules: { userAgent: '*', disallow: '/' } };
    }
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        // Die Turnierverwaltung ist eine reine Oberflächen-Demo ohne Daten —
        // die gehört nicht in den Suchindex.
        disallow: ['/admin'],
      },
      sitemap: `${MDC_ORIGIN}/sitemap.xml`,
    };
  }

  if (!SITE_INDEXABLE) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/login',
        '/registrieren',
        '/passwort-vergessen',
        '/passwort-zuruecksetzen',
        '/mein-bereich',
        '/mein-profil',
        '/mein-team',
        '/admin',
        '/api/',
        // Demo der Munich Dart Challenge: erreichbar, wer den Link hat —
        // aber nicht crawlen, nicht indexieren (zusätzlich noindex im Layout).
        '/mdc',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
