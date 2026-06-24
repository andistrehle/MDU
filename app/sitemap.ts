import type { MetadataRoute } from 'next';
import { LEAGUES, TEAMS, PLAYERS } from '@/lib/data';

// Basis-URL der Live-Seite. Über NEXT_PUBLIC_SITE_URL überschreibbar.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mdudarts.de';

/**
 * Sitemap — NUR öffentliche Seiten. Interne Bereiche (Login, Registrierung,
 * Passwort-Seiten, Mein-Bereich, Admin, Bearbeitungsseiten) sind bewusst NICHT
 * enthalten.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths = [
    '', '/ligen', '/tabellen', '/spielplan', '/ergebnisse',
    '/teams', '/spielstaetten', '/downloads', '/news',
    '/kontakt', '/impressum', '/datenschutz',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map(p => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
  }));

  // Dynamische öffentliche Seiten
  const leagueEntries = LEAGUES.map(l => ({ url: `${SITE_URL}/ligen/${l.id}`, lastModified: now }));
  const teamEntries   = TEAMS.map(t => ({ url: `${SITE_URL}/teams/${t.id}`, lastModified: now }));
  const playerEntries = PLAYERS.map(p => ({ url: `${SITE_URL}/spieler/${p.id}`, lastModified: now }));

  return [...staticEntries, ...leagueEntries, ...teamEntries, ...playerEntries];
}
