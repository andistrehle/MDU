import type { MetadataRoute } from 'next';

// Basis-URL der Live-Seite. Über NEXT_PUBLIC_SITE_URL überschreibbar.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mdudarts.de';

/**
 * robots.txt — öffentliche Seiten dürfen indexiert werden,
 * interne/geschützte Bereiche sind ausgeschlossen.
 */
export default function robots(): MetadataRoute.Robots {
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
