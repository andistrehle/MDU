// ============================================================
// MDC — Spieler-Avatar
// ============================================================
//
// Es liegen keine Spielerfotos vor. Statt Platzhaltergesichter aus dem Netz
// zu laden (fremde Menschen auf einer Seite mit echten Namen — keine gute
// Idee), zeichnet die Demo einen Initialen-Avatar: dunkle Scheibe, roter Ring,
// Initialen. Der Farbton ergibt sich fest aus der Passnummer, damit derselbe
// Spieler immer gleich aussieht.
// ============================================================

import type { Player } from '@/data/types';
import { playerInitials } from '@/data/players';

interface PlayerAvatarProps {
  player: Player;
  size?: number;
  /** Rand in Rot statt neutral — für Podium und Profilkopf. */
  highlight?: boolean;
}

export function PlayerAvatar({ player, size = 40, highlight = false }: PlayerAvatarProps) {
  // Fester Farbton je Spieler: gedeckte Töne, damit die roten Akzente führen.
  const hue = (player.passNr * 47) % 360;

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(145deg, hsl(${hue} 18% 22%), hsl(${hue} 22% 13%))`,
        border: `${highlight ? 2 : 1}px solid ${highlight ? 'var(--mdc-red)' : 'var(--mdc-line-hard)'}`,
        color: 'var(--mdc-white)',
        fontFamily: 'var(--mdc-font-display)',
        fontWeight: 800,
        fontSize: size * 0.4,
        letterSpacing: '0.02em',
        lineHeight: 1,
      }}
    >
      {playerInitials(player)}
    </span>
  );
}
