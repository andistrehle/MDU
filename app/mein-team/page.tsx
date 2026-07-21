'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/mdu/icon';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canEditTeam } from '@/lib/auth/roles';
import { findTeam, getCurrentSeason, getCurrentCompetitionForTeam, findLeague } from '@/lib/data';
import { getCaptainTeamView } from '@/lib/supabase/season-teams';

export default function MeinTeamPage() {
  const { user, loading } = useAuth();
  const teamId = user?.teamId ?? null;
  const canEdit = !!teamId && canEditTeam(user, teamId);
  const staticTeam = teamId ? findTeam(teamId) : undefined;
  const season = getCurrentSeason();

  // DB-Kontext für neu angemeldete Teams (Name/Kürzel/Saison/Liga aus der DB,
  // auch wenn die aktive Saison noch die alte ist). Fällt auf statisch zurück.
  const [dbView, setDbView] = useState<Awaited<ReturnType<typeof getCaptainTeamView>> | null>(null);
  useEffect(() => {
    if (teamId && !staticTeam) getCaptainTeamView(teamId).then(setDbView);
    else setDbView(null);
  }, [teamId, staticTeam]);

  const team = staticTeam;
  const teamName = staticTeam?.name ?? dbView?.teamName ?? teamId;
  const teamShort = staticTeam?.short ?? dbView?.shortName ?? '?';
  const teamColor = staticTeam?.color ?? '#888';
  const seasonLabel = staticTeam ? season.name : (dbView?.seasonName ?? season.name);
  const leagueName = staticTeam
    ? (getCurrentCompetitionForTeam(staticTeam.id, season.id)?.league?.name ?? '–')
    : (dbView?.leagueId ? (findLeague(dbView.leagueId)?.name ?? dbView.leagueId) : '–');

  return (
    <MemberShell title={team ? `Mein Team – ${team.name}` : 'Mein Team'}>
      {loading ? (
        <Muted>Lade …</Muted>
      ) : !user ? (
        <Notice title="Bitte einloggen">Dieser Bereich ist nur für angemeldete Mitglieder.{' '}<LoginLink /></Notice>
      ) : !teamId ? (
        <Notice title="Kein Team verknüpft">
          Deinem Konto ist noch kein Team zugeordnet. Die Ligaleitung kann das in der
          Benutzerverwaltung verknüpfen.
        </Notice>
      ) : (
        <>
          {/* Team-Kopf */}
          <div style={{
            background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
            borderRadius: 14, padding: '20px 22px', marginBottom: 18,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
              <div style={{
                width: 54, height: 54, borderRadius: 12, flexShrink: 0,
                background: `${teamColor}22`, border: `1px solid ${teamColor}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: teamColor,
              }}>
                {teamShort}
              </div>
              <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 24, color: 'var(--th-text-strong)', textTransform: 'uppercase', lineHeight: 1.1, minWidth: 0 }}>
                {teamName}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
              {leagueName} · {seasonLabel}
            </div>
            <Link href={`/teams/${teamId}`} style={ghostBtn}>Öffentliches Profil ansehen</Link>
          </div>

          {/* Aktionen — nur für Teamkapitäne/Ligaleitung */}
          {canEdit ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              <ActionTile href="/mein-team/bearbeiten" icon="edit" title="Team bearbeiten"
                desc="Beschreibung, Logo, Mannschaftsbild und Social Media." />
              <ActionTile href="/mein-team/kader" icon="list" title="Kader"
                desc="Spieler deines Teams ansehen." />
            </div>
          ) : (
            <Muted>Du bist diesem Team zugeordnet. Bearbeiten kann nur der Teamkapitän bzw. die Ligaleitung. Den vollständigen Kader und alle Statistiken findest du auf dem öffentlichen Teamprofil.</Muted>
          )}
        </>
      )}
    </MemberShell>
  );
}

function ActionTile({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="mdu-card-hover" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '18px', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9, flexShrink: 0,
            background: 'var(--th-accent-a12)', border: '1px solid var(--th-accent-a25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--th-accent)',
          }}>
            <Icon name={icon as 'edit'} size={18} stroke={2} />
          </div>
          <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>{title}</span>
        </div>
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
      </div>
    </Link>
  );
}

const ghostBtn: React.CSSProperties = {
  display: 'inline-block', padding: '9px 16px', borderRadius: 8,
  background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)',
  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, textDecoration: 'none',
};
