'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/mdu/icon';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canEditTeam } from '@/lib/auth/roles';
import { findTeam, getCurrentSeason, getCurrentCompetitionForTeam, findLeague } from '@/lib/data';
import { getCaptainTeamView } from '@/lib/supabase/season-teams';
import { supabase } from '@/lib/supabase/client';
import type { TeamFee } from '@/lib/startgeld';
import { StartgeldPay } from '@/components/mdu/startgeld-pay';
import { team27, findLiga27, NEUE_SAISON } from '@/lib/data/saison-2027';

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
    // Immer laden: liefert Name/Kürzel/Liga für neue Teams UND den Kader der
    // (neuesten) DB-Saison für die Startgeld-Berechnung.
    if (teamId) getCaptainTeamView(teamId).then(setDbView);
    else setDbView(null);
  }, [teamId]);

  // Startgeld der (neuesten) DB-Saison — nur für Kapitäne/Ligaleitung, nie
  // öffentlich. Gerechnet auf dem Server (/api/startgeld): Der Satz einer
  // Nachmeldung hängt am Meldedatum, und das dürfen Kapitäne nicht für jede
  // Meldung selbst lesen.
  const [fee, setFee] = useState<{ fee: TeamFee; breakdown: string; paid: boolean; open: number; seasonName: string | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFee(null);
      if (!canEdit || !teamId || !supabase) return;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch(`/api/startgeld?team=${encodeURIComponent(teamId)}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
      if (!res?.ok || cancelled) return;
      const d = await res.json();
      if (!cancelled) setFee(d);
    })();
    return () => { cancelled = true; };
  }, [canEdit, teamId]);
  const rest = fee && fee.paid && fee.open > 0;

  // Saison 2026/27 (Spielplan-Momentaufnahme) hat Vorrang vor den statischen 2025/26-Daten.
  const t27 = teamId ? team27(teamId) : undefined;
  const teamName = t27?.name ?? staticTeam?.name ?? dbView?.teamName ?? teamId;
  const teamShort = t27?.short ?? staticTeam?.short ?? dbView?.shortName ?? '?';
  const teamColor = t27?.color ?? staticTeam?.color ?? '#888';
  const seasonLabel = t27 ? NEUE_SAISON.name : staticTeam ? season.name : (dbView?.seasonName ?? season.name);
  const leagueName = t27
    ? (findLiga27(t27.league)?.name ?? '–')
    : staticTeam
      ? (getCurrentCompetitionForTeam(staticTeam.id, season.id)?.league?.name ?? '–')
      : (dbView?.leagueId ? (findLeague(dbView.leagueId)?.name ?? dbView.leagueId) : '–');

  return (
    <MemberShell title={teamName && teamName !== teamId ? `Mein Team – ${teamName}` : 'Mein Team'}>
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

          {/* Startgeld — nur für Kapitän/Ligaleitung, nur im eingeloggten Bereich */}
          {canEdit && fee && fee.fee.total > 0 && (
            <div style={{
              background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
              borderRadius: 14, padding: '16px 20px', marginBottom: 18,
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, color: 'var(--th-text-strong)', marginBottom: 3 }}>
                    Startgeld {fee.seasonName ? `· ${fee.seasonName}` : ''}
                  </div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
                    {fee.breakdown.replace(/ = \d+ €$/, '')} = <strong style={{ color: 'var(--th-text-strong)' }}>{fee.fee.total} €</strong>
                  </div>
                  {fee.fee.earlyNominations > 0 && (
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)', marginTop: 3 }}>
                      Davon {fee.fee.earlyNominations} {fee.fee.earlyNominations === 1 ? 'Nachmeldung' : 'Nachmeldungen'} vor Saisonstart (20 €).
                    </div>
                  )}
                </div>
                <span style={{
                  fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5, letterSpacing: '0.02em',
                  padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                  background: fee.open === 0 ? 'rgba(34,197,94,0.12)' : 'rgba(212,0,0,0.10)',
                  color: fee.open === 0 ? 'var(--th-win)' : '#c0392b',
                  border: `1px solid ${fee.open === 0 ? 'rgba(34,197,94,0.45)' : 'rgba(212,0,0,0.35)'}`,
                }}>
                  {fee.open === 0 ? '✓ Bezahlt' : rest ? `Restbetrag ${fee.open} € offen` : 'Zahlung noch offen'}
                </span>
              </div>
              {fee.open > 0 && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--th-line-4)' }}>
                  {rest && (
                    <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
                      Seit eurer Zahlung sind Nachmeldungen dazugekommen. Offen ist nur die Differenz von <strong>{fee.open} €</strong>.
                    </p>
                  )}
                  <StartgeldPay
                    amount={fee.open}
                    reference={`${teamName} – ${rest ? 'Restbetrag Startgeld' : 'Startgeld'} ${fee.seasonName ?? ''}`.trim()}
                  />
                  <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)', margin: '10px 0 0', lineHeight: 1.5 }}>
                    Die Freigabe als „bezahlt" erfolgt durch die Ligaleitung, sobald das Geld eingegangen ist.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Aktionen — nur für Teamkapitäne/Ligaleitung */}
          {canEdit ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              <ActionTile href="/mein-team/bearbeiten" icon="edit" title="Team bearbeiten"
                desc="Beschreibung, Logo, Mannschaftsbild und Social Media." />
              <ActionTile href="/mein-team/kader" icon="list" title="Kader"
                desc="Spieler deines Teams ansehen." />
              {t27 && <ActionTile href="/mein-team/spielplan" icon="calendar" title="Spielplan"
                desc="Spiele 2026/27 (vorläufig) und Druckvorlage für die TC-Sitzung." />}
            </div>
          ) : (
            <>
            {t27 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginBottom: 12 }}>
                <ActionTile href="/mein-team/spielplan" icon="calendar" title="Spielplan"
                  desc="Spiele deines Teams in der Saison 2026/27 (vorläufig)." />
              </div>
            )}
            <Muted>Du bist diesem Team zugeordnet. Bearbeiten kann nur der Teamkapitän bzw. die Ligaleitung. Den vollständigen Kader und alle Statistiken findest du auf dem öffentlichen Teamprofil.</Muted>
            </>
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
