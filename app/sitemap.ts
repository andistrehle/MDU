import type { MetadataRoute } from 'next';
import { LEAGUES, TEAMS, PLAYERS } from '@/lib/data';
import { LIGEN_2027, alleTeams27, alleVenues27 } from '@/lib/data/saison-2027';
import { MDC_STANDALONE, MDC_ORIGIN } from '@/lib/mdc/site';
import { publishedNews } from '@/data/news';
import { PLAYERS as MDC_PLAYERS } from '@/data/players';
import { VENUES } from '@/data/venues';
import { ALL_TOURNAMENTS, appearancesOf } from '@/data/tournament-results';

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
      '/spieler', '/spielorte', '/regeln', '/news', '/kontakt', '/impressum', '/datenschutz',
    ];
    return [
      ...mdcPaths.map(p => ({ url: `${MDC_ORIGIN}${p}`, lastModified: now })),
      ...VENUES.map(v => ({ url: `${MDC_ORIGIN}/spielorte/${v.id}`, lastModified: now })),
      // NUR Profile mit mindestens einem Turnier. Wer im Register steht, aber
      // nie angetreten ist, hat auf seiner Seite nichts als seinen Namen —
      // das gehört nicht in den Suchindex (dieselbe Überlegung setzt
      // `app/mdc/spieler/[id]/page.tsx` dort als `noindex` um).
      ...MDC_PLAYERS
        .filter(p => appearancesOf(p.id).length > 0)
        .map(p => ({ url: `${MDC_ORIGIN}/spieler/${p.id}`, lastModified: now })),
      ...ALL_TOURNAMENTS.map(t => ({
        url: `${MDC_ORIGIN}/turniere/ergebnisse/${t.id}`,
        lastModified: now,
      })),
      ...publishedNews().map(post => ({
        url: `${MDC_ORIGIN}/news/${post.id}`,
        lastModified: new Date(post.date),
      })),
    ];
  }

  const staticPaths = [
    '', '/ligen', '/tabellen', '/spielplan', '/ergebnisse',
    '/teams', '/spielstaetten', '/downloads', '/news',
    '/kontakt', '/impressum', '/datenschutz',
    // Archiv Saison 2025/26
    '/ligen/2025-26', '/tabellen/2025-26', '/spielplan/2025-26', '/ergebnisse/2025-26',
    '/teams/2025-26', '/spielstaetten/2025-26',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map(p => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
  }));

  // Dynamische öffentliche Seiten
  // Ligen/Teams beider Saisons (Codes bzw. IDs, die in beiden vorkommen, nur einmal).
  const leagueIds = [...new Set([...LIGEN_2027.map(l => l.code), ...LEAGUES.map(l => l.id)])];
  const teamIds   = [...new Set([...alleTeams27().map(t => t.id), ...TEAMS.map(t => t.id)])];
  const leagueEntries = leagueIds.map(id => ({ url: `${SITE_URL}/ligen/${id}`, lastModified: now }));
  const teamEntries   = teamIds.map(id => ({ url: `${SITE_URL}/teams/${id}`, lastModified: now }));
  const playerEntries = PLAYERS.map(p => ({ url: `${SITE_URL}/spieler/${p.id}`, lastModified: now }));

  const venueEntries  = alleVenues27().map(v => ({ url: `${SITE_URL}/spielstaetten/${v.id}`, lastModified: now }));

  return [...staticEntries, ...leagueEntries, ...teamEntries, ...venueEntries, ...playerEntries];
}
