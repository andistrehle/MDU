'use client';

// ============================================================
// Mannschaftsübersicht mit Filter
// ============================================================
//
// 86 Mannschaften über zwei Spielzeiten — ohne Filter ist das eine Wand.
// Deshalb Staffel-Chips und ein Suchfeld, beides im Browser, ohne Nachladen.
// Die Daten kommen fertig aufbereitet vom Server; hier wird nur gefiltert.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { TeamWappen } from './team-wappen';
import { Badge, LeerZustand } from '../ui/bausteine';
import { normalisiere } from '@/data/bedv/suchindex';

export interface TeamEintrag {
  id: string;
  name: string;
  farben: [string, string];
  ligaSlug: string;
  ligaName: string;
  saisonId: string;
  ort: string;
  spielstaette: string;
  spieltag: string;
  platz: number | null;
  punkte: number | null;
  spieler: number;
}

export interface StaffelFilter {
  slug: string;
  name: string;
  saisonId: string;
}

export function TeamsListe({
  teams, staffeln, saisons,
}: {
  teams: TeamEintrag[];
  staffeln: StaffelFilter[];
  saisons: { id: string; name: string; aktuell: boolean }[];
}) {
  const [saison, setSaison] = useState(saisons.find(s => s.aktuell)?.id ?? saisons[0]?.id ?? '');
  const [staffel, setStaffel] = useState<string | null>(null);
  const [begriff, setBegriff] = useState('');

  const sichtbareStaffeln = staffeln.filter(s => s.saisonId === saison);

  const gefiltert = useMemo(() => {
    const q = normalisiere(begriff);
    return teams.filter(t =>
      t.saisonId === saison
      && (!staffel || t.ligaSlug === staffel)
      && (q.length < 2 || normalisiere(`${t.name} ${t.ort} ${t.spielstaette}`).includes(q)));
  }, [teams, saison, staffel, begriff]);

  return (
    <>
      <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
        {saisons.length > 1 && (
          <div className="bedv-tabs" role="tablist" aria-label="Spielzeit">
            {saisons.map(s => (
              <button
                key={s.id}
                role="tab"
                aria-selected={s.id === saison}
                className="bedv-tab"
                onClick={() => { setSaison(s.id); setStaffel(null); }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1, minWidth: 220 }}>
            <button
              className="bedv-btn bedv-btn--sm"
              onClick={() => setStaffel(null)}
              style={
                staffel === null
                  ? { background: 'var(--bedv-blue)', color: '#fff' }
                  : { background: 'var(--bedv-tint-2)', color: 'var(--bedv-ink-dim)' }
              }
            >
              Alle
            </button>
            {sichtbareStaffeln.map(s => (
              <button
                key={s.slug}
                className="bedv-btn bedv-btn--sm"
                onClick={() => setStaffel(s.slug)}
                style={
                  staffel === s.slug
                    ? { background: 'var(--bedv-blue)', color: '#fff' }
                    : { background: 'var(--bedv-tint-2)', color: 'var(--bedv-ink-dim)' }
                }
              >
                {s.name}
              </button>
            ))}
          </div>

          <label style={{ position: 'relative', minWidth: 200, flex: '0 1 260px' }}>
            <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
              Mannschaft oder Ort suchen
            </span>
            <Search
              size={15}
              aria-hidden="true"
              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--bedv-ink-faint)' }}
            />
            <input
              className="bedv-input"
              style={{ paddingLeft: 32 }}
              placeholder="Mannschaft oder Ort …"
              value={begriff}
              onChange={e => setBegriff(e.target.value)}
            />
          </label>
        </div>
      </div>

      {gefiltert.length === 0 ? (
        <LeerZustand
          titel="Keine Mannschaft gefunden"
          text="Für diese Auswahl gibt es keine Treffer. Andere Staffel wählen oder den Suchbegriff kürzen."
        />
      ) : (
        <>
          <div style={{ fontSize: '0.8rem', color: 'var(--bedv-ink-dim)', marginBottom: 12 }}>
            {gefiltert.length} {gefiltert.length === 1 ? 'Mannschaft' : 'Mannschaften'}
          </div>
          <div className="bedv-grid bedv-grid--3">
            {gefiltert.map(t => (
              <Link key={t.id} href={bedvPath(`/teams/${t.id}`)} className="bedv-card bedv-card--link" style={{ padding: '14px 15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <TeamWappen team={{ name: t.name, farben: t.farben }} groesse={38} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--bedv-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.spielstaette}, {t.ort}
                    </div>
                  </div>
                  {t.platz !== null && (
                    <span className="bedv-score" style={{ fontSize: '1.1rem', color: t.platz <= 2 ? 'var(--bedv-accent-deep)' : 'var(--bedv-ink-dim)', flex: 'none' }}>
                      {t.platz}.
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex', gap: 8, marginTop: 11, paddingTop: 10,
                    borderTop: '1px solid var(--bedv-line-soft)', flexWrap: 'wrap', alignItems: 'center',
                  }}
                >
                  <Badge ton="leise">{t.ligaName}</Badge>
                  <span style={{ fontSize: '0.76rem', color: 'var(--bedv-ink-dim)' }}>
                    {t.spieler} Spieler · {t.spieltag}
                    {t.punkte !== null ? ` · ${t.punkte} Pkt` : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
