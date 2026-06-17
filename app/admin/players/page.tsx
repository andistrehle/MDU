'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import {
  PLAYERS, getPlayerDisplayName, TEAMS,
  getPlayersForTeamInSeason, getCurrentSeason,
} from '@/lib/data';

// Spieler → Teamname (aktuelle Saison), einmal aufgebaut
const SEASON = getCurrentSeason();
const PLAYER_TEAM = new Map<string, string>();
for (const team of TEAMS) {
  for (const { player } of getPlayersForTeamInSeason(team.id, SEASON.id)) {
    if (!PLAYER_TEAM.has(player.id)) PLAYER_TEAM.set(player.id, team.name);
  }
}

const TEAM_NAMES = [...TEAMS].map(t => t.name).sort((a, b) => a.localeCompare(b, 'de'));

export default function AdminPlayersPage() {
  const [q, setQ] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PLAYERS
      .map(p => ({ p, name: getPlayerDisplayName(p), team: PLAYER_TEAM.get(p.id) ?? '–' }))
      .filter(r => (!needle || r.name.toLowerCase().includes(needle) || (r.p.licenseNumber ?? '').toLowerCase().includes(needle)))
      .filter(r => (!teamFilter || r.team === teamFilter))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [q, teamFilter]);

  return (
    <AdminGuard title="Spieler" subtitle="Spieler der Saison ansehen und öffnen.">
      {/* Suche + Filter */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, maxWidth: 720 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Name oder Passnummer suchen …"
          style={{ flex: 1, minWidth: 200, padding: '10px 14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }} />
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}
          style={{ padding: '10px 14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }}>
          <option value="">Alle Teams</option>
          {TEAM_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', marginBottom: 12 }}>
        {rows.length} von {PLAYERS.length} Spielern
      </div>

      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden', maxWidth: 820 }}>
        {rows.map((r, i) => (
          <div key={r.p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px',
            borderBottom: i < rows.length - 1 ? '1px solid var(--th-line-4)' : 'none',
          }}>
            <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
            <span style={{ width: 130, flexShrink: 0, fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="mdu-desktop-only">{r.team}</span>
            <span style={{ width: 96, flexShrink: 0, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-faint)' }} className="mdu-desktop-only">{r.p.licenseNumber ?? '—'}</span>
            <Link href={`/spieler/${r.p.id}`} style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none', flexShrink: 0 }}>Profil →</Link>
          </div>
        ))}
        {rows.length === 0 && <div style={{ padding: '22px 16px', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>Keine Spieler gefunden.</div>}
      </div>

      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 16, maxWidth: 720, lineHeight: 1.6 }}>
        Spieler-Stammdaten stammen aus dartunion.de. Das Verknüpfen eines Spielers mit einem
        Benutzerkonto erfolgt in der Benutzerverwaltung; Spitzname/„Über mich“ pflegt der
        Spieler selbst in seinem Profil.
      </p>
    </AdminGuard>
  );
}
