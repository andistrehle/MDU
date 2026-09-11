// ============================================================
// MDC — Doppel-K.-o.-Turnierplan (noch nicht verlinkt)
// ============================================================
//
// ABSICHTLICH NICHT IN DER VERWALTUNGSLEISTE. Der Betreiber wollte den Plan
// zum Ausprobieren, bevor er im Lokal jemandem in die Hände fällt — wer die
// Adresse kennt, kommt hin, sonst niemand. Die Passwortabfrage gilt wie
// überall unter `/admin` (`proxy.ts`), und Suchmaschinen bleiben draußen.
//
// Aufgenommen wird hier nichts: keine Punkte, keine Wertung, kein Commit.
// Ergebnisse kommen weiter über `/admin/ergebnis` — so ist es abgesprochen.
// Wenn der Plan sich im Lokal bewährt, kann er später an derselben Stelle
// andocken, an der heute die erkannte Zettelliste steht.
//
// In die Leiste gehört er erst, wenn das entschieden ist: ein Eintrag, der
// „ändert nichts" bedeutet, verwirrt neben vier Einträgen, die wirklich etwas
// tun.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/mdc/ui';
import { AdminNav } from '@/components/mdc/admin-nav';
import { Turnierplan, type PlanSpieler } from '@/components/mdc/turnierplan';
import { PLAYERS, playerName } from '@/data/players';
import { SETZLISTE } from '@/lib/mdc/doppel-ko';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Turnierplan',
  description: 'Doppel-K.-o.-Plan zum Ausprobieren.',
};

export const dynamic = 'force-dynamic';

export default async function AdminTurnierplanPage() {
  const spieler: PlanSpieler[] = PLAYERS
    .filter(p => p.passNr !== null)
    .map(p => ({ passNr: p.passNr as number, name: playerName(p), nickname: p.nickname }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return (
    <>
      <PageHero
        kicker="Turnierverwaltung · zum Ausprobieren"
        title="Turnierplan"
        description="Das Doppel-K.-o. vom Papierplan, klickbar: Teilnehmer setzen, Sieger antippen, Platzierung entsteht von selbst. Noch nichts davon geht in die Wertung."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Die Leiste zeigt weiter die vier fertigen Seiten — dieser Plan
              steht bewusst nicht drin, man kommt über die Adresse her. */}
          <AdminNav aktiv="uebersicht" />

          <Turnierplan spieler={spieler} />

          <div style={{ fontSize: '0.85rem', lineHeight: 1.75, color: 'var(--mdc-ink-dim)', maxWidth: 720 }}>
            <p>
              <strong>Was vom Papier übernommen ist:</strong> die Setzliste der ersten Runde —
              beim 8er {SETZLISTE[8].map(([a, b]) => `${a}–${b}`).join(', ')}, beim 16er und
              32er entsprechend — und die Plätze der Ergebnisliste (1 bis 8 einzeln, dann 9,
              13, 17, 25 als Gruppe), samt der Spiele um Platz 5/6 und 7/8.
            </p>
            <p style={{ marginTop: 12 }}>
              <strong>Was nach dem üblichen Schema gebaut ist:</strong> die Verliererseite. Auf
              dem Papier führen dorthin Buchstaben (A, B, C …), die im Scan nicht überall zu
              verfolgen sind. Bitte einmal einen Abend gegen den Zettel gegenprüfen — weicht
              etwas ab, gehört der Plan hier geändert, nicht der Zettel.
            </p>
            <p style={{ marginTop: 12 }}>
              <strong>Und so kommt das Ergebnis in die Wertung:</strong> wie bisher über{' '}
              <Link href={mdcPath('/admin/ergebnis')}>Ergebnis hochladen</Link>. Dieser Plan
              schreibt nichts.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
