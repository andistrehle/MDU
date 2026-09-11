// ============================================================
// MDC — Rangliste für Facebook
// ============================================================
//
// Liegt hinter derselben Passwortabfrage wie der Rest der Verwaltung
// (`proxy.ts`) und ist für Suchmaschinen gesperrt.
//
// Dynamisch: Der Beitrag soll den Stand von JETZT zeigen, nicht den vom
// letzten Neubau. Sonst stünde nach einem hochgeladenen Turnier noch die alte
// Rangliste im Textfeld.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/mdc/ui';
import { AdminNav } from '@/components/mdc/admin-nav';
import { FacebookEditor } from '@/components/mdc/facebook-editor';
import { aktuellerFacebookPost, PLAETZE } from '@/lib/mdc/facebook-post';
import { bildHoehe } from '@/lib/mdc/facebook-bild';
import { facebookStatus } from '@/lib/mdc/facebook-api';
import { mdcPath, MDC_FACEBOOK_GROUP } from '@/lib/mdc/site';
import { RUNNING_SEASON } from '@/data/season';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Rangliste für Facebook',
  description: 'Die aktuelle Rangliste als fertigen Facebook-Beitrag.',
};

export const dynamic = 'force-dynamic';

export default async function AdminFacebookPage() {
  const post = aktuellerFacebookPost();
  const status = facebookStatus();

  return (
    <>
      <PageHero
        kicker="Turnierverwaltung"
        title="Rangliste für Facebook"
        description={`Die ersten ${PLAETZE.men} Herren und ${PLAETZE.women} Damen als fertiges Bild — dazu der Text mit Jackpot-Stand und Link auf die komplette Rangliste.`}
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <AdminNav aktiv="facebook" />

          {post ? (
            <FacebookEditor
              vorlage={post.kurz}
              langfassung={post.text}
              bilder={[
                {
                  src: mdcPath('/admin/facebook/bild/men'),
                  titel: 'Herren',
                  dateiname: `mdc-rangliste-herren-${post.daten.stand}.png`,
                  breite: 1200,
                  hoehe: bildHoehe(post.daten.men.length),
                  zeilen: post.daten.men.length,
                },
                {
                  src: mdcPath('/admin/facebook/bild/women'),
                  titel: 'Damen',
                  dateiname: `mdc-rangliste-damen-${post.daten.stand}.png`,
                  breite: 1200,
                  hoehe: bildHoehe(post.daten.women.length),
                  zeilen: post.daten.women.length,
                },
              ]}
              gruppe={MDC_FACEBOOK_GROUP}
              canPost={status.canPost}
              missing={status.missing}
              zusammenfassung={
                `${post.daten.men.length} Herren · ${post.daten.women.length} Damen`
              }
            />
          ) : (
            <div className="mdc-card" style={{ padding: '22px 20px' }}>
              <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Noch keine Wertung</h2>
              <p style={{ marginTop: 8, fontSize: '0.94rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
                Für die Saison {RUNNING_SEASON.label} liegt noch kein Turnier vor. Sobald das
                erste ausgewertet ist, steht hier der fertige Beitrag.
              </p>
            </div>
          )}

          <div style={{ fontSize: '0.85rem', lineHeight: 1.75, color: 'var(--mdc-ink-dim)', maxWidth: 720 }}>
            <p>
              <strong>Jede Woche von selbst:</strong> Ein Wochenlauf erzeugt jeden
              Montagmorgen denselben Text und legt ihn als Zusammenfassung ab
              (GitHub → Actions → „MDC · Rangliste für Facebook"). Von dort lässt er sich auch
              am Handy kopieren. Die Bilder entstehen dagegen erst beim Aufruf dieser Seite —
              sie zeigen also immer den Stand von jetzt.
            </p>
            <p style={{ marginTop: 12 }}>
              <strong>Warum nicht direkt in die Gruppe:</strong> Meta hat die Schnittstelle zum
              Schreiben in Gruppen abgeschaltet. Kein Werkzeug kann das noch — deshalb der
              Kopierknopf statt eines Versprechens, das nicht einzuhalten wäre.
            </p>
            <p style={{ marginTop: 12 }}>
              Die Zahlen kommen aus derselben Quelle wie die{' '}
              <Link href={mdcPath('/rangliste')}>Rangliste auf der Seite</Link> — sie können also
              gar nicht auseinanderlaufen.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
