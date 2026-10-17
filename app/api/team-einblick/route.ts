// ============================================================
// GET /api/team-einblick?team=<id>&gegner=<id>
// ============================================================
//
// Für das Team-Manager-Dashboard (Betreiber, 17.10.2026):
//   • Highlights-Wand: 180er, 171er, höchstes Finish, kürzestes Leg je Spieler
//     des eigenen Teams — aus der Einzelrangliste (Spielberichte).
//   • Gegner-Infos zum nächsten Spiel: Tabellenplatz, letzte Ergebnisse,
//     bisheriger Vergleich in dieser Saison, beste Spieler.
// Alles davon steht ohnehin öffentlich auf Tabelle/Ergebnisse/Einzelrangliste
// — deshalb ohne Anmeldung; nur zusammengefasst. Kurz zwischengespeichert.
// ============================================================

import { NextResponse } from 'next/server';
import { ladeErgebnisse27, ladeEinzel27, tabelle27 } from '@/lib/server/ergebnisse-2027';
import { team27, alleBegegnungen27 } from '@/lib/data/saison-2027';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const u = new URL(request.url);
  const team = u.searchParams.get('team') ?? '';
  const gegner = u.searchParams.get('gegner') ?? '';
  const T = team27(team);
  if (!T) return NextResponse.json({ error: 'Unbekanntes Team' }, { status: 404 });

  const [{ byKey }, einzel] = await Promise.all([ladeErgebnisse27(), ladeEinzel27()]);
  const alleEinzel = Object.values(einzel.jeLiga).flat();

  const highlights = alleEinzel.filter(z => z.teamId === team).map(z => ({
    name: z.name, playerId: z.playerId, b180: z.b180, b171: z.b171, highFinish: z.highFinish, shortLeg: z.shortLeg,
    einsaetze: z.einsaetze, singles: z.singles, wins: z.wins, points: z.points,
  }));

  let gegnerInfo = null;
  const G = gegner ? team27(gegner) : undefined;
  if (G) {
    const tab = await tabelle27(G.league);
    const zeile = tab.find(z => z.team === gegner) ?? null;
    const plan = new Map(alleBegegnungen27().map(b => [b.key, b]));
    const spiele = Object.values(byKey).filter(e => e.home === gegner || e.away === gegner)
      .map(e => {
        const heim = e.home === gegner;
        const f = heim ? e.spieleHome : e.spieleAway, a = heim ? e.spieleAway : e.spieleHome;
        return { key: e.key, datum: e.datum ?? plan.get(e.key)?.termin?.datum ?? plan.get(e.key)?.fri ?? null, gegen: heim ? e.away : e.home, f, a, ergebnis: f > a ? 'S' : f < a ? 'N' : 'U', wertung: !!e.wertung, bestaetigt: e.bestaetigt };
      })
      .sort((x, y) => (y.datum ?? '').localeCompare(x.datum ?? ''));
    gegnerInfo = {
      tabelle: zeile ? { pos: zeile.pos, pts: zeile.pts, sp: zeile.sp, s: zeile.s, u: zeile.u, n: zeile.n, teams: tab.length } : null,
      letzte: spiele.slice(0, 5).map(s => ({ ...s, gegenName: team27(s.gegen)?.name ?? s.gegen })),
      vergleich: spiele.filter(s => s.gegen === team).map(s => ({ datum: s.datum, wir: s.a, sie: s.f })),
      beste: alleEinzel.filter(z => z.teamId === gegner).sort((a, b) => b.points - a.points || b.wins - a.wins).slice(0, 3)
        .map(z => ({ name: z.name, points: z.points, wins: z.wins, singles: z.singles, b180: z.b180 })),
    };
  }

  return NextResponse.json({ highlights, gegner: gegnerInfo }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
}
