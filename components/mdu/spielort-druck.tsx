'use client';

import { printVenueTermine, type VenueTerminBlock } from '@/lib/spielplan/printing';
import { alleTeams27, findLiga27, heimspieleImLokal27, venueBloecke27, kalenderwoche, venue27, wochenendeText, datumKurz27 } from '@/lib/data/saison-2027';

// Druckt den Spielort-Plan mit den festen Terminen — dieselben Daten wie die
// Seite (heimspieleImLokal27: Kalender-Wochenenden, echter Termin, Heimrechttausch).
const LIGA_DRUCKFARBE: Record<string, string> = { la: '#8a6d0b', a: '#2E7526', b1: '#4b5563', b2: '#4b5563', c: '#7a5a2a' };

export function SpielortDruck({ venueId }: { venueId: string }) {
  const drucken = () => {
    const v = venue27(venueId);
    if (!v) return;
    const name = (id: string) => alleTeams27().find(t => t.id === id)?.name ?? id;
    const teams = alleTeams27().filter(t => t.venueId === venueId).sort((a, b) => a.name.localeCompare(b.name, 'de'))
      .map(t => `${t.name} (${findLiga27(t.league)?.name ?? ''})`).join(', ');
    const bloecke: VenueTerminBlock[] = venueBloecke27(heimspieleImLokal27(venueId)).map(b => b.art === 'frei'
      ? { art: 'frei', text: `${wochenendeText(b.fri, b.sun, false)} · kein Heimspiel${b.anzahl > 1 ? ` (${b.anzahl} Wochenenden)` : ''}` }
      : {
        art: 'woche', titel: `KW ${kalenderwoche(b.w.fri)} · Wochenende ${wochenendeText(b.w.fri, b.w.sun)}`,
        spiele: b.w.spiele.map(s => ({
          tag: s.termin ? datumKurz27(s.termin.datum) : 'offen', zeit: s.termin?.uhrzeit ?? '—',
          liga: s.liga.name.replace(/\s*Liga$/, ''), ligaFarbe: LIGA_DRUCKFARBE[s.liga.code] ?? '#4b5563', spieltag: s.spieltag,
          home: name(s.spiel.home), away: name(s.spiel.away), derby: s.spiel.derby,
          hinweis: [...(s.verlegt ? ['verlegt'] : []), ...(s.termin?.vorlaeufig ? ['wird geprüft'] : [])],
        })),
      });
    printVenueTermine(v.name, teams, bloecke, 'Stand TC-Sitzung 11.10.2026');
  };
  return (
    <button type="button" onClick={drucken} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
      background: 'var(--th-accent)', color: '#fff', border: '1.5px solid var(--th-accent)',
    }}>
      Plan drucken / als PDF
    </button>
  );
}
