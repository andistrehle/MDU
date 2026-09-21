// ============================================================
// Startseite — kompakte Tabellenkarten
// ============================================================
//
// Drei Staffeln nebeneinander mit den ersten fünf Plätzen. Kein
// Reiterwechsel, kein Aufklappen: Wer auf der Startseite ist, will sehen —
// nicht bedienen. Der Weg in die vollständige Tabelle steht als Knopf
// darunter.
// ============================================================

import Link from 'next/link';
import { bedvPath } from '@/lib/bedv/site';
import { ligaBySlug } from '@/data/bedv/ligen';
import { tabelleDerLiga, gespielteSpieltage } from '@/data/bedv/tabelle';
import { Tabelle } from '../standings/tabelle';

export function TabellenKarten({ ligen }: { ligen: string[] }) {
  return (
    <div className="bedv-grid bedv-grid--3">
      {ligen.map(slug => {
        const liga = ligaBySlug(slug);
        if (!liga) return null;
        const zeilen = tabelleDerLiga(slug);
        return (
          <div key={slug} className="bedv-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                padding: '12px 15px', borderBottom: '1px solid var(--bedv-line)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              }}
            >
              <h3 style={{ fontSize: '1.05rem' }}>{liga.name}</h3>
              <span className="bedv-kicker">{gespielteSpieltage(slug)}. Spieltag</span>
            </div>
            <div style={{ padding: '4px 10px', flex: 1 }}>
              <Tabelle zeilen={zeilen} grenze={5} kompakt />
            </div>
            <div style={{ padding: '10px 15px 13px' }}>
              <Link href={bedvPath(`/ligen/${slug}#tabelle`)} className="bedv-btn bedv-btn--ghost bedv-btn--sm bedv-btn--block">
                Komplette Tabelle
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
