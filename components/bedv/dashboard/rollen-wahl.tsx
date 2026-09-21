'use client';

// ============================================================
// Demo-Login — Rolle wählen
// ============================================================
//
// Kein Passwort, kein Konto, kein Server. Die Wahl landet im `localStorage`
// des Geräts und verändert von da an die Seite.
//
// Im Verkaufsgespräch ist das der Dreh- und Angelpunkt: „Und jetzt loggen
// wir uns mal als Teamkapitän ein" muss in einem Klick funktionieren — und
// der Wechsel zur Ligaleitung genauso. Deshalb stehen alle Rollen
// nebeneinander statt hinter einem Formular.
// ============================================================

import { useRouter } from 'next/navigation';
import { ArrowRight, Check, LogOut, UserRound, Users, ShieldCheck, Settings } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { DEMO_KONTEN } from '@/data/bedv/demo-konten';
import type { DemoRolle } from '@/data/bedv/typen';
import { useDemoAuth } from '../layout/demo-auth';
import { DemoHinweis } from '../ui/bausteine';

const SYMBOL: Record<DemoRolle, typeof UserRound> = {
  spieler: UserRound, kapitaen: Users, ligaleitung: ShieldCheck, admin: Settings,
};

export function RollenWahl() {
  const router = useRouter();
  const { rolle, bereit, anmelden, abmelden } = useDemoAuth();

  const waehlen = (neu: DemoRolle) => {
    anmelden(neu);
    router.push(bedvPath(neu === 'ligaleitung' || neu === 'admin' ? '/ligaleitung' : '/mein-bereich'));
  };

  return (
    <>
      <div className="bedv-grid bedv-grid--2">
        {DEMO_KONTEN.map(k => {
          const Symbol = SYMBOL[k.rolle];
          const aktiv = bereit && rolle === k.rolle;
          return (
            <button
              key={k.rolle}
              onClick={() => waehlen(k.rolle)}
              className="bedv-card bedv-card--link"
              style={{
                padding: '18px 19px', textAlign: 'left', cursor: 'pointer',
                borderColor: aktiv ? 'var(--bedv-accent)' : undefined,
                borderWidth: aktiv ? 2 : 1,
                background: aktiv ? 'var(--bedv-accent-soft)' : undefined,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 44, height: 44, flex: 'none', borderRadius: 11, display: 'grid', placeItems: 'center',
                    background: aktiv ? 'var(--bedv-accent)' : 'var(--bedv-blue-mist)',
                    color: aktiv ? '#3A2600' : 'var(--bedv-blue-deep)',
                  }}
                >
                  <Symbol size={21} />
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: '1.14rem' }}>{k.titel}</h3>
                    {aktiv && <span className="bedv-badge bedv-badge--accent">aktiv</span>}
                  </div>
                  <div className="bedv-kicker" style={{ marginTop: 3 }}>{k.untertitel}</div>
                  <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.88rem', marginTop: 9, lineHeight: 1.55 }}>
                    {k.beschreibung}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '11px 0 0', display: 'grid', gap: 5 }}>
                    {k.kann.map(z => (
                      <li key={z} style={{ display: 'flex', gap: 7, fontSize: '0.83rem', color: 'var(--bedv-ink-soft)' }}>
                        <Check size={14} aria-hidden="true" style={{ color: 'var(--bedv-green)', flex: 'none', marginTop: 3 }} />
                        {z}
                      </li>
                    ))}
                  </ul>
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 13,
                      color: 'var(--bedv-blue-deep)', fontWeight: 600, fontSize: '0.87rem',
                    }}
                  >
                    Als {k.titel} ansehen <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {bereit && rolle && (
        <div style={{ marginTop: 18 }}>
          <button className="bedv-btn bedv-btn--ghost bedv-btn--sm" onClick={abmelden}>
            <LogOut size={15} aria-hidden="true" /> Demo-Anmeldung zurücksetzen
          </button>
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <DemoHinweis>
          Es gibt keine Anmeldung: Die Rolle wird nur im Browser dieses Geräts gemerkt
          (<code>localStorage</code>). Es werden keine Daten übertragen, kein Konto
          angelegt und kein Cookie gesetzt. Die Rolle lässt sich jederzeit wechseln.
        </DemoHinweis>
      </div>
    </>
  );
}
