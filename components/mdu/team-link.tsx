'use client';

import Link from 'next/link';
import { getTeamUrl } from '@/lib/links';

interface TeamLinkProps {
  teamId: string;
  /** Optional competition context (e.g. a playoff group code) to carry through. */
  competitionId?: string;
  /** Team name — used for the accessible label. */
  teamName?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  /**
   * Stops click propagation so the link works inside rows that have their own
   * onClick (e.g. the standings desktop row that updates a side info card).
   */
  stopPropagation?: boolean;
}

/**
 * Wraps team content (badge + name, or just a name) in a link to the team
 * profile. Hover styling comes from `.mdu-entity-link` in globals.css; mark
 * the name element with `className="mdu-link-name"` to get the hover accent.
 */
export function TeamLink({
  teamId,
  competitionId,
  teamName,
  children,
  style,
  className,
  stopPropagation,
}: TeamLinkProps) {
  return (
    <Link
      href={getTeamUrl(teamId, competitionId)}
      aria-label={teamName ? `Teamprofil von ${teamName} öffnen` : undefined}
      onClick={stopPropagation ? e => e.stopPropagation() : undefined}
      className={`mdu-entity-link${className ? ` ${className}` : ''}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </Link>
  );
}
