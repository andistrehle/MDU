'use client';

// ============================================================
// Spielerübersicht mit Filter
// ============================================================
//
// Über 500 Einträge. Alle auf einmal zu rendern wäre am Telefon spürbar
// langsam, deshalb wird in Schritten nachgeladen — und vor allem lässt sich
// filtern: Staffel, Wertungsklasse, Name oder Passnummer.
//
// Die Liste ist nach Ranglistenpunkten sortiert. Wer eine Spielerübersicht
// öffnet, sucht entweder eine bestimmte Person (dafür das Suchfeld) oder
// will wissen, wer vorne steht — alphabetisch hilft bei beidem nicht.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { SpielerAvatar } from '../teams/team-wappen';
import { Badge, LeerZustand } from '../ui/bausteine';
import { normalisiere } from '@/data/bedv/suchindex';

export interface SpielerEintrag {
  id: string;
  name: string;
  spitzname?: string;
  initialen: string;
  passnummer: string;
  wertung: 'herren' | 'damen';
  teamId: string;
  teamName: string;
  ligaSlug: string;
  ligaName: string;
  saisonId: string;
  platz: number | null;
  punkte: number;
  spiele: number;
  siege: number;
  hundertachtziger: number;
}

const SCHRITT = 60;

export function SpielerListe({
  spieler, staffeln, saisons,
}: {
  spieler: SpielerEintrag[];
  staffeln: { slug: string; name: string; saisonId: string }[];
  saisons: { id: string; name: string; aktuell: boolean }[];
}) {
  const [saison, setSaison] = useState(saisons.find(s => s.aktuell)?.id ?? saisons[0]?.id ?? '');
  const [staffel, setStaffel] = useState<string | null>(null);
  const [wertung, setWertung] = useState<'alle' | 'herren' | 'damen'>('alle');
  const [begriff, setBegriff] = useState('');
  const [grenze, setGrenze] = useState(SCHRITT);

  const gefiltert = useMemo(() => {
    const q = normalisiere(begriff);
    return spieler.filter(s =>
      s.saisonId === saison
      && (!staffel || s.ligaSlug === staffel)
      && (wertung === 'alle' || s.wertung === wertung)
      && (q.length < 2 || normalisiere(`${s.name} ${s.spitzname ?? ''} ${s.passnummer} ${s.teamName}`).includes(q)));
  }, [spieler, saison, staffel, wertung, begriff]);

  const aendern = (fn: () => void) => { fn(); setGrenze(SCHRITT); };
  const sichtbar = gefiltert.slice(0, grenze);

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
                onClick={() => aendern(() => { setSaison(s.id); setStaffel(null); })}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className="bedv-btn bedv-btn--sm"
            onClick={() => aendern(() => setStaffel(null))}
            style={staffel === null
              ? { background: 'var(--bedv-blue)', color: '#fff' }
              : { background: 'var(--bedv-tint-2)', color: 'var(--bedv-ink-dim)' }}
          >
            Alle Staffeln
          </button>
          {staffeln.filter(s => s.saisonId === saison).map(s => (
            <button
              key={s.slug}
              className="bedv-btn bedv-btn--sm"
              onClick={() => aendern(() => setStaffel(s.slug))}
              style={staffel === s.slug
                ? { background: 'var(--bedv-blue)', color: '#fff' }
                : { background: 'var(--bedv-tint-2)', color: 'var(--bedv-ink-dim)' }}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['alle', 'herren', 'damen'] as const).map(w => (
              <button
                key={w}
                className="bedv-btn bedv-btn--sm"
                onClick={() => aendern(() => setWertung(w))}
                style={wertung === w
                  ? { background: 'var(--bedv-navy-800)', color: '#fff' }
                  : { background: 'var(--bedv-tint-2)', color: 'var(--bedv-ink-dim)' }}
              >
                {w === 'alle' ? 'Alle' : w === 'herren' ? 'Herren' : 'Damen'}
              </button>
            ))}
          </div>

          <label style={{ position: 'relative', minWidth: 210, flex: '0 1 300px' }}>
            <Search
              size={15}
              aria-hidden="true"
              style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--bedv-ink-faint)' }}
            />
            <input
              className="bedv-input"
              style={{ paddingLeft: 32 }}
              placeholder="Name, Spitzname oder Passnummer …"
              aria-label="Spieler suchen"
              value={begriff}
              onChange={e => aendern(() => setBegriff(e.target.value))}
            />
          </label>
        </div>
      </div>

      {gefiltert.length === 0 ? (
        <LeerZustand titel="Kein Spieler gefunden" text="Für diese Auswahl gibt es keine Treffer. Filter zurücksetzen oder anders suchen." />
      ) : (
        <>
          <div style={{ fontSize: '0.8rem', color: 'var(--bedv-ink-dim)', marginBottom: 12 }}>
            {gefiltert.length} Spieler · nach Ranglistenpunkten
          </div>

          <div className="bedv-grid bedv-grid--3">
            {sichtbar.map(s => (
              <Link key={s.id} href={bedvPath(`/spieler/${s.id}`)} className="bedv-card bedv-card--link" style={{ padding: '13px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <SpielerAvatar initialen={s.initialen} groesse={38} akzent={s.platz === 1} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.93rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--bedv-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.spitzname ? `„${s.spitzname}" · ` : ''}{s.teamName}
                    </div>
                  </div>
                  {s.platz !== null && (
                    <span className="bedv-score" style={{ fontSize: '1.05rem', flex: 'none', color: s.platz <= 3 ? 'var(--bedv-accent-deep)' : 'var(--bedv-ink-dim)' }}>
                      {s.platz}.
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex', gap: 10, marginTop: 10, paddingTop: 9,
                    borderTop: '1px solid var(--bedv-line-soft)', flexWrap: 'wrap', alignItems: 'center',
                    fontSize: '0.76rem', color: 'var(--bedv-ink-dim)',
                  }}
                >
                  <Badge ton="leise">{s.ligaName}</Badge>
                  <span><strong style={{ color: 'var(--bedv-ink)' }}>{s.siege}</strong>/{s.spiele}</span>
                  <span><strong style={{ color: 'var(--bedv-ink)' }}>{s.punkte}</strong> Pkt</span>
                  {s.hundertachtziger > 0 && <span>{s.hundertachtziger}× 180</span>}
                </div>
              </Link>
            ))}
          </div>

          {grenze < gefiltert.length && (
            <div style={{ textAlign: 'center', marginTop: 22 }}>
              <button className="bedv-btn bedv-btn--ghost" onClick={() => setGrenze(g => g + SCHRITT)}>
                Weitere {Math.min(SCHRITT, gefiltert.length - grenze)} anzeigen
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
