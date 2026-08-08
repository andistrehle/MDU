// ============================================================
// MDC — Turnierbaum-Darstellung
// ============================================================
//
// Winner Bracket, Loser Bracket und Finale je als waagerecht scrollbare
// Spaltenreihe. Auf dem Handy scrollt man seitlich durch die Runden — das ist
// bei Turnierbäumen ehrlicher als jede Stauchung.
// ============================================================

import type { Bracket, BracketRound } from '@/lib/mdc/bracket';
import { getPlayer, playerShortName } from '@/data/players';

function PlayerRow({
  playerId, legs, isWinner, bye,
}: {
  playerId: string | null;
  legs: number | null;
  isWinner: boolean;
  bye: boolean;
}) {
  const player = playerId ? getPlayer(playerId) : undefined;

  return (
    <div
      className="mdc-match-row"
      data-winner={isWinner && !bye}
      data-empty={!player}
    >
      <span className="mdc-match-name">
        {player ? playerShortName(player) : 'Freilos'}
      </span>
      <span className="mdc-num" style={{ color: 'inherit', opacity: 0.9 }}>
        {legs ?? (bye && player ? 'w. o.' : '–')}
      </span>
    </div>
  );
}

function RoundColumn({ round }: { round: BracketRound }) {
  // Paarungen ohne jeden Spieler (bei großen Feldern mit vielen Freilosen
  // unvermeidlich) sagen nichts aus und werden nicht gezeichnet.
  const matches = round.matches.filter(m => m.playerAId || m.playerBId);
  if (matches.length === 0) return null;

  return (
    <div className="mdc-bracket-round">
      <div className="mdc-bracket-head">{round.label}</div>
      {matches.map(match => (
        <div key={match.id} className="mdc-match">
          <PlayerRow
            playerId={match.playerAId}
            legs={match.legsA}
            isWinner={match.winnerId !== null && match.winnerId === match.playerAId}
            bye={match.bye}
          />
          <PlayerRow
            playerId={match.playerBId}
            legs={match.legsB}
            isWinner={match.winnerId !== null && match.winnerId === match.playerBId}
            bye={match.bye}
          />
        </div>
      ))}
    </div>
  );
}

export function BracketView({ bracket }: { bracket: Bracket }) {
  const sections: { title: string; rounds: BracketRound[] }[] = [
    { title: 'Winner Bracket', rounds: bracket.winner },
    { title: 'Loser Bracket', rounds: bracket.loser },
    { title: 'Finale', rounds: [bracket.final] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      {sections.map(section => (
        <div key={section.title}>
          <h3
            className="mdc-display"
            style={{ fontSize: '1.1rem', letterSpacing: '0.1em', marginBottom: 12 }}
          >
            {section.title}
          </h3>
          <div className="mdc-scroll-x">
            <div className="mdc-bracket">
              {section.rounds.map(round => (
                <RoundColumn key={`${round.side}-${round.round}`} round={round} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
