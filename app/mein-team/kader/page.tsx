'use client';

import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canManageTeamPlayers } from '@/lib/auth/roles';
import { getRankedRosterForTeam, getCurrentSeason, getPlayerDisplayName, findTeam } from '@/lib/data';
import { NachmeldenButton } from '@/components/mdu/nachmelden-button';

export default function KaderPage() {
  const { user, loading } = useAuth();
  const teamId = user?.teamId ?? null;
  const allowed = !!teamId && canManageTeamPlayers(user, teamId);
  const team = teamId ? findTeam(teamId) : undefined;
  const season = getCurrentSeason();
  const roster = allowed && teamId ? getRankedRosterForTeam(teamId, season.id) : [];

  return (
    <MemberShell title="Kader">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Nur für Teamkapitäne.{' '}<LoginLink /></Notice>
        : !teamId ? <Notice title="Kein Team verknüpft">Deinem Konto ist noch kein Team zugeordnet.</Notice>
        : !allowed ? <Notice title="Keine Berechtigung">Du kannst nur den Kader deines eigenen Teams verwalten.</Notice>
        : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 200, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
                {team?.name ?? teamId} · Saison {season.name} · {roster.length} Spieler
              </div>
              <NachmeldenButton teamId={teamId} teamName={team?.name ?? teamId} />
            </div>

            <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden' }}>
              {roster.map((entry, i) => {
                const name = getPlayerDisplayName(entry.player);
                return (
                  <div key={entry.player.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i < roster.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-faint)', width: 22, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    {entry.isCaptain && (
                      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-gold)', background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.3)', borderRadius: 4, padding: '2px 6px' }}>Kapitän</span>
                    )}
                  </div>
                );
              })}
              {roster.length === 0 && <div style={{ padding: '22px 16px', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>Noch keine Spieler im Kader.</div>}
            </div>

            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 14 }}>
              Neue Spieler über „＋ Spieler nachmelden" einreichen — die Ligaleitung prüft die Nachmeldung.
            </p>
          </>
        )}
    </MemberShell>
  );
}
