'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TeamBadge } from './team-badge';
import { TeamLink } from './team-link';
import { VorlaeufigHinweis } from './saison-umschalter';
import { LigaSpielplan27, SpieltagKarte27, type ErgebnisMap27 } from './spielplan-27';
import { Tabelle27 } from './tabelle-27';
import { Einzelrangliste27 } from './einzelrangliste-27';
import type { EinzelZeile } from '@/lib/einzelrangliste-2027';
import type { TabellenZeile } from '@/lib/tabelle-2027';
import { AufAbstiegKarte, AufAbstiegLegende, RelegationUndAusblick } from './auf-abstieg-27';
import {
  findLiga27, team27, venue27, spieltage27, wochenendeText, datumText, begegnungKey,
  NEUE_SAISON, SAISON_START, SAISON_ENDE, TABS_27, type Liga27Code,
} from '@/lib/data/saison-2027';

// Liga-Seite Saison 2026/2027. Tabelle und Ergebnisse kommen gerechnet vom
// Server (lib/server/ergebnisse-2027.ts, aus den Spielberichten).
// Die Ansicht der Saison 2025/26 bleibt LeagueDetailClient (Archiv).


const card: React.CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '18px 20px' };
const label: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 12 };
const body: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 13.5, lineHeight: 1.6, color: 'var(--th-text-body)' };

export function Liga27Client({ code, initialTab = 0, tabelle, ergebnisse, einzel }: {
  code: Liga27Code; initialTab?: number; tabelle: TabellenZeile[]; ergebnisse: ErgebnisMap27; einzel: EinzelZeile[];
}) {
  const [tab, setTab] = useState(initialTab);
  const liga = findLiga27(code)!;
  const mds = spieltage27(code);
  const gespielt = tabelle.some(z => z.sp > 0);
  // Spieltage mit mindestens einem Ergebnis, neueste zuerst.
  const mitErgebnis = mds.filter(md => md.games.some(g => ergebnisse[begegnungKey(g.home, g.away)])).reverse();
  const teams = liga.teams.map(id => team27(id)!).sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return (
    <>
      <div style={{ borderTop: '1px solid var(--th-line-6)', background: 'var(--th-bg-tabbar1)', position: 'sticky', top: 70, zIndex: 10 }}>
        <div className="mdu-tabs-row" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', gap: 36, overflowX: 'auto', overflowY: 'hidden' }}>
          {TABS_27.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '16px 0', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
              color: i === tab ? 'var(--th-accent)' : 'var(--th-text-muted)',
              border: 'none', borderBottom: i === tab ? '2px solid var(--th-accent)' : '2px solid transparent',
              marginBottom: -1, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase',
              background: 'none', whiteSpace: 'nowrap', flexShrink: 0,
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 28px 80px' }}>
        {tab === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 16, alignItems: 'start' }}>
            <div style={card}>
              <div style={label}>Liga Übersicht</div>
              {[
                ['Saison', NEUE_SAISON.name],
                ['Teams', String(liga.teams.length)],
                ['Spieltage', `${mds.length} (Hin- und Rückrunde)`],
                // Der letzte Spieltag ist nicht das Saisonende — danach folgen die Relegationsspiele.
                ['Termine', `${datumText(SAISON_START)} – ${datumText(SAISON_ENDE)}, danach Relegation`],
                ['Status', gespielt ? `läuft · ${mitErgebnis.length} von ${mds.length} Spieltagen mit Ergebnissen` : 'Saison beginnt · Spielplan vorläufig'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '7px 0', borderTop: '1px solid var(--th-line-4)', ...body, fontSize: 13 }}>
                  <span style={{ width: 90, flexShrink: 0, color: 'var(--th-text-faint)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ ...label, marginBottom: 10 }}>Erster Spieltag</div>
              {mds[0] && <SpieltagKarte27 md={mds[0]} color={liga.color} ergebnisse={ergebnisse} />}
              <button type="button" onClick={() => setTab(2)} style={{ marginTop: 10, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 }}>
                Ganzer Spielplan →
              </button>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div style={{ maxWidth: 760 }}>
            <p style={{ ...body, margin: '0 0 14px', color: 'var(--th-text-muted)' }}>
              {gespielt
                ? 'Reihenfolge: Punkte, dann Spieldifferenz, Legdifferenz, direkter Vergleich. Ein Ergebnis zählt ab dem Einreichen des Spielberichts.'
                : `Die Tabelle füllt sich ab dem ersten Spieltag (${wochenendeText(mds[0].fri, mds[0].sun)}). Bis dahin stehen alle Teams bei null.`}
            </p>
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <Tabelle27 liga={liga} zeilen={tabelle} />
            </div>

            <div style={{ ...label, marginTop: 28 }}>Auf- und Abstieg</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <AufAbstiegLegende />
              <AufAbstiegKarte liga={liga} />
              <RelegationUndAusblick nurLiga={code} />
            </div>
          </div>
        )}

        {tab === 2 && (
          <>
            <VorlaeufigHinweis />
            <LigaSpielplan27 liga={liga} ergebnisse={ergebnisse} />
          </>
        )}

        {tab === 3 && (mitErgebnis.length ? (
          <div className="mdu-spieltag-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))', gap: 12 }}>
            {mitErgebnis.map(md => <SpieltagKarte27 key={md.nr} md={md} color={liga.color} ergebnisse={ergebnisse} />)}
          </div>
        ) : (
          <div style={{ ...card, maxWidth: 640, ...body }}>
            <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', color: 'var(--th-text-strong)', marginBottom: 6 }}>Noch keine Ergebnisse</div>
            Der erste Spieltag der {liga.name} ist am Wochenende {wochenendeText(mds[0].fri, mds[0].sun)}.{' '}
            <Link href="/ergebnisse/2025-26" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Ergebnisse 2025/26</Link>
          </div>
        ))}

        {tab === 4 && (
          <div style={{ ...card, padding: 0, overflow: 'hidden', maxWidth: 900 }}>
            <Einzelrangliste27 zeilen={einzel} />
          </div>
        )}

        {tab === 5 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
            {teams.map(t => {
              const v = venue27(t.venueId);
              return (
                <TeamLink key={t.id} teamId={t.id} teamName={t.name} className="mdu-card-hover" style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
                  <TeamBadge initials={t.short.slice(0, 3)} color={t.color} logoUrl={t.logoUrl ?? undefined} size={44} />
                  <span style={{ minWidth: 0 }}>
                    <span className="mdu-link-name" style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14.5, color: 'var(--th-text-strong)' }}>{t.name}</span>
                    <span style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>{v?.name ?? 'Spielort folgt'}</span>
                    {v?.address && <span style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)' }}>{v.address}</span>}
                  </span>
                </TeamLink>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
