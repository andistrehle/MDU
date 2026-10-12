// Spielplan eines Teams als abonnierbarer Kalender: /kalender/<team-id>.ics
// Statisch beim Build erzeugt (je Team eine Datei), Aufbau in lib/kalender-ics.ts.
import { alleTeams27 } from '@/lib/data/saison-2027';
import { teamKalender } from '@/lib/kalender-ics';

export const dynamicParams = false;

export function generateStaticParams() {
  return alleTeams27().map(t => ({ datei: `${t.id}.ics` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ datei: string }> }) {
  const { datei } = await params;
  const ics = teamKalender(datei.replace(/\.ics$/, ''));
  if (!ics) return new Response('Unbekanntes Team', { status: 404 });
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${datei}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
