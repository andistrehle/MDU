import 'server-only';
import { alleTeams27, spieleFuerTeam27, team27, venue27, findLiga27, begegnungKey, termin27 } from '@/lib/data/saison-2027';
import { ladeErgebnisse27, alleTabellen27 } from '@/lib/server/ergebnisse-2027';
import { naechstesUndLetztes, type DeinTeamDaten, type TeamSpielKurz } from '@/lib/dein-team';

/** Karte „Dein Team“: je Team Tabellenplatz, nächstes Spiel, letztes Ergebnis (Startseite, alle Teams). */
export async function ladeDeinTeam(): Promise<Record<string, DeinTeamDaten>> {
  const [{ byKey }, tabellen] = await Promise.all([ladeErgebnisse27(), alleTabellen27()]);
  const heute = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
  const out: Record<string, DeinTeamDaten> = {};
  for (const t of alleTeams27()) {
    const liga = findLiga27(t.league);
    if (!liga) continue;
    const spiele: TeamSpielKurz[] = spieleFuerTeam27(t.id).filter(s => s.gegner).map(s => {
      const [home, away] = s.heim ? [t.id, s.gegner] : [s.gegner, t.id];
      const termin = termin27(home, away);
      return { key: begegnungKey(home, away), heim: s.heim, gegner: s.gegner, datum: termin?.datum ?? s.fri, uhrzeit: termin?.uhrzeit ?? null, spieltag: s.spieltag };
    });
    const { naechstes, letztes } = naechstesUndLetztes(spiele, byKey, heute);
    const tab = tabellen[t.league] ?? [];
    const zeile = tab.find(z => z.team === t.id);
    const gegner = (id: string) => { const g = team27(id); return { gegnerName: g?.name ?? id, gegnerLogo: g?.logoUrl ?? null, gegnerFarbe: g?.color ?? '#9AA4B2' }; };
    const ort = naechstes ? venue27(team27(naechstes.heim ? t.id : naechstes.gegner)?.venueId) : undefined;
    out[t.id] = {
      id: t.id, name: t.name, kurz: t.short, logo: t.logoUrl, farbe: t.color,
      liga: t.league, ligaName: liga.name, ligaFarbe: liga.color,
      platz: zeile && zeile.sp > 0 ? zeile.pos : null, von: tab.length, pkt: zeile?.pts ?? 0,
      naechstes: naechstes ? { ...naechstes, ...gegner(naechstes.gegner), ort: ort?.name ?? null, ortId: ort?.id ?? null } : null,
      letztes: letztes ? { ...letztes, ...gegner(letztes.gegner) } : null,
    };
  }
  return out;
}
