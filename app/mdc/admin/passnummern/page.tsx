// ============================================================
// MDC — Passnummern in der Turnierverwaltung
// ============================================================
//
// Liegt hinter derselben Passwortabfrage wie der Ergebnis-Upload
// (`proxy.ts`) und ist für Suchmaschinen gesperrt.
//
// Dynamisch, nicht vorgerechnet: Die Liste soll den Stand des laufenden
// Deployments zeigen — nach einem hochgeladenen Ergebnis mit einem Neuling
// ist eine Nummer mehr vergeben.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/mdc/ui';
import { AdminNav } from '@/components/mdc/admin-nav';
import { PassUebersicht, type PassZeile } from '@/components/mdc/pass-uebersicht';
import { passUebersicht, quelleLabel } from '@/lib/mdc/passnummern';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Passnummern',
  description: 'Welche MDC-Passnummern vergeben sind und welche frei.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPassnummernPage() {
  const u = passUebersicht();

  const zeilen: PassZeile[] = u.belegungen.map(b => ({
    passNr: b.passNr,
    imRegister: b.imRegister,
    inhaber: b.inhaber.map(i => ({
      playerId: i.playerId,
      name: i.name,
      division: i.division,
      quelle: quelleLabel(i.quelle),
      letzterStart: i.letzterStart,
      starts: i.starts,
      aktuell: i.aktuell,
    })),
  }));

  return (
    <>
      <PageHero
        kicker="Turnierverwaltung"
        title="Passnummern"
        description="Alle Nummern der Reihe nach: welche vergeben ist, welche frei, und welche zwei Menschen tragen."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <AdminNav aktiv="passnummern" />

          <PassUebersicht
            zeilen={zeilen}
            frei={u.frei}
            naechsteFreie={u.naechsteFreie}
            hoechsteVergebene={u.hoechsteVergebene}
          />

          <div style={{ fontSize: '0.85rem', lineHeight: 1.75, color: 'var(--mdc-ink-dim)', maxWidth: 720 }}>
            <p>
              <strong>Woher die Nummern kommen:</strong> {'aus dem Blatt „Teilnehmer" der'}
              {' '}Arbeitsmappe. Das ist die maßgebliche Liste — eine Nummer, die dort einen Namen
              trägt, ist vergeben, auch wenn die Person noch nie gespielt hat. Eine Nummer
              ohne Namen ist frei. Geändert wird das Register in der Mappe, nicht hier; die
              Seite liest es beim Einlesen einer Saison mit ein.
            </p>
            <p style={{ marginTop: 12 }}>
              <strong>Der Reihe nach vergeben:</strong> Die kleinste freie Nummer steht oben.
              Solange das Register vollständig ist, kann eine Lücke bedenkenlos aufgefüllt
              werden. Genau deshalb ist die gelbe Meldung wichtig, falls sie erscheint: Eine
              Nummer, mit der gespielt wurde, die aber im Register fehlt, sieht frei aus und
              ist es nicht.
            </p>
            <p style={{ marginTop: 12 }}>
              <strong>Löschen ist nicht nötig</strong> — auch nicht bei einer Nummer, die
              früher jemand anderem gehört hat. Die Saisons stehen unabhängig voneinander:
              Jede löst ihre Passnummern über ihre eigene Rangliste auf, ein neuer Inhaber
              kann dem alten nichts wegnehmen. Soll jemand trotzdem ganz verschwinden, muss
              seine Zeile aus der Arbeitsmappe raus und die Saison neu eingelesen werden. Bei
              jemandem mit gespielten Turnieren wäre das falsch: Dann fehlen Punkte in der
              Endrangliste und alle darunter rutschen einen Platz nach oben.
            </p>
            <p style={{ marginTop: 12 }}>
              Fehlt oder stimmt etwas nicht, steht der Weg dafür auf der{' '}
              <Link href={mdcPath('/kontakt')}>Kontaktseite</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
