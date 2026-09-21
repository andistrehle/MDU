// ============================================================
// Mannschaftswappen — gezeichnet aus zwei Farben
// ============================================================
//
// Es gibt keine echten Mannschaftslogos, und erfinden lassen sie sich nicht
// sinnvoll. Statt überall denselben grauen Platzhalter zu zeigen, bekommt
// jede Mannschaft ein Zeichen aus ihren beiden Farben und ihren Initialen.
//
// Der Effekt in der Demo ist erstaunlich groß: Mannschaften werden auf
// Anhieb unterscheidbar — in der Tabelle, im Spielplan, auf der
// Ergebniskarte. In der echten Plattform lädt man an dieser Stelle die
// hochgeladenen Wappen; die Bauform bleibt dieselbe.
// ============================================================

import type { Team } from '@/data/bedv/typen';

/** Initialen aus dem Mannschaftsnamen: höchstens zwei Buchstaben. */
function initialen(name: string): string {
  const woerter = name
    .replace(/\b(DC|SV|SC|DSC|Team|Dartclub)\b/gi, '')
    .split(/\s+/)
    .filter(Boolean);
  if (woerter.length === 0) return name.slice(0, 2).toUpperCase();
  if (woerter.length === 1) return woerter[0].slice(0, 2).toUpperCase();
  return (woerter[0][0] + woerter[1][0]).toUpperCase();
}

export function TeamWappen({
  team,
  groesse = 36,
}: {
  team: Pick<Team, 'name' | 'farben'>;
  groesse?: number;
}) {
  const [vorn, hinten] = team.farben;
  const text = initialen(team.name);
  return (
    <span
      aria-hidden="true"
      style={{
        width: groesse,
        height: groesse,
        flex: 'none',
        borderRadius: Math.round(groesse * 0.28),
        display: 'grid',
        placeItems: 'center',
        background: `linear-gradient(140deg, ${vorn} 0%, ${hinten} 100%)`,
        color: '#fff',
        fontFamily: 'var(--bedv-font-display)',
        fontWeight: 800,
        fontSize: groesse * (text.length > 1 ? 0.38 : 0.46),
        letterSpacing: '-0.02em',
        // Feine helle Kante: Ohne sie verschwimmen dunkle Wappen auf
        // dunklem Grund (Kopfzeile, Hero).
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16)',
      }}
    >
      {text}
    </span>
  );
}

/** Rundes Zeichen für eine Person — es gibt keine Fotos in der Demo. */
export function SpielerAvatar({
  initialen: kuerzel,
  groesse = 40,
  akzent = false,
}: {
  initialen: string;
  groesse?: number;
  akzent?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: groesse,
        height: groesse,
        flex: 'none',
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        background: akzent
          ? 'linear-gradient(140deg, #F0A81C 0%, #C98207 100%)'
          : 'linear-gradient(140deg, #2E7BE8 0%, #10408F 100%)',
        color: akzent ? '#3A2600' : '#fff',
        fontFamily: 'var(--bedv-font-display)',
        fontWeight: 800,
        fontSize: groesse * 0.4,
      }}
    >
      {kuerzel}
    </span>
  );
}
