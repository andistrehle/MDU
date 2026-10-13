'use client';

import { printVenueTermine } from '@/lib/spielplan/printing';
import { alleTeams27, findLiga27, heimspieleImLokal27, terminKurz, venue27, wochenendeText } from '@/lib/data/saison-2027';

// Druckt den Spielort-Plan mit den festen Terminen — dieselben Daten wie die
// Seite (heimspieleImLokal27: echter Termin, Heimrechttausch, verlegt).
const LIGA_DRUCKFARBE: Record<string, string> = { la: '#8a6d0b', a: '#2E7526', b1: '#4b5563', b2: '#4b5563', c: '#7a5a2a' };

export function SpielortDruck({ venueId }: { venueId: string }) {
  const drucken = () => {
    const v = venue27(venueId);
    if (!v) return;
    const teams = alleTeams27().filter(t => t.venueId === venueId).sort((a, b) => a.name.localeCompare(b.name, 'de'))
      .map(t => `${t.name} (${findLiga27(t.league)?.name ?? ''})`).join(', ');
    const wochen = heimspieleImLokal27(venueId).map(w => ({
      text: wochenendeText(w.fri, w.sun, false), zusatz: w.zusatz,
      spiele: w.spiele.map(s => ({
        tag: s.termin ? `${terminKurz(s.termin)}${s.termin.uhrzeit ? ' Uhr' : ''}` : 'Termin offen',
        liga: s.liga.name.replace(/\s*Liga$/, ''), ligaFarbe: LIGA_DRUCKFARBE[s.liga.code] ?? '#4b5563', spieltag: s.spieltag,
        home: alleTeams27().find(t => t.id === s.spiel.home)?.name ?? s.spiel.home,
        away: alleTeams27().find(t => t.id === s.spiel.away)?.name ?? s.spiel.away,
        derby: s.spiel.derby,
        hinweis: [...(s.verlegt ? ['verlegt'] : []), ...(s.termin?.vorlaeufig ? ['wird geprüft'] : [])],
      })),
    }));
    printVenueTermine(v.name, teams, wochen, 'Stand TC-Sitzung 11.10.2026');
  };
  return (
    <button type="button" onClick={drucken} style={{
      padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
      background: 'var(--th-accent)', color: '#fff', border: '1.5px solid var(--th-accent)',
    }}>
      Plan drucken / als PDF
    </button>
  );
}
