import type { MetadataRoute } from 'next';
import { LEAGUES, TEAMS, PLAYERS } from '@/lib/data';
import { MDC_STANDALONE, MDC_ORIGIN } from '@/lib/mdc/site';
import { PLAYERS as MDC_PLAYERS } from '@/data/players';
import { VENUES } from '@/data/venues';
import { ALL_TOURNAMENTS } from '@/data/tournament-results';

// Basis-URL der Live-Seite. Über NEXT_PUBLIC_SITE_URL überschreibbar.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mdudarts.de';

/**
 * Sitemap — NUR öffentliche Seiten. Interne Bereiche (Login, Registrierung,
 * Passwort-Seiten, Mein-Bereich, Admin, Bearbeitungsseiten) sind bewusst NICHT
 * enthalten.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Eigenständige MDC-Seite: eigene Adressen, ohne `/mdc`-Präfix. Die
  // MDU-Seiten gibt es dort nicht — sie gehören auch nicht in diese Sitemap.
  if (MDC_STANDALONE) {
    const mdcPaths = [
      '', '/rangliste', '/rangliste/archiv', '/turniere', '/turniere/ergebnisse',
      '/spieler', '/spielorte', '/regeln', '/kontakt', '/impressum', '/datenschutz',
    ];
    return [
      ...mdcPaths.map(p => ({ url: `${MDC_ORIGIN}${p}`, lastModified: now })),
      ...VENUES.map(v => ({ url: `${MDC_ORIGIN}/spielorte/${v.id}`, lastModified: now })),
      ...MDC_PLAYERS.map(p => ({ url: `${MDC_ORIGIN}/spieler/${p.id}`, lastModified: now })),
      ...ALL_TOURNAMENTS.map(t => ({
        url: `${MDC_ORIGIN}/turniere/ergebnisse/${t.id}`,
        lastModified: now,
      })),
    ];
  }

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
