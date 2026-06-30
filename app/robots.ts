import type { MetadataRoute } from 'next';
import { SITE_INDEXABLE } from '@/lib/site-config';

// Basis-URL der Live-Seite. Über NEXT_PUBLIC_SITE_URL überschreibbar.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mdudarts.de';

/**
 * robots.txt — öffentliche Seiten dürfen indexiert werden,
 * interne/geschützte Bereiche sind ausgeschlossen.
 * Vor dem Go-live (SITE_INDEXABLE = false) wird das gesamte Crawling gesperrt.
 */
export default function robots(): MetadataRoute.Robots {
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
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
