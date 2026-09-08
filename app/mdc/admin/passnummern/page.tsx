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
            naechsteNeue={u.naechsteNeue}
            kleinsteLuecke={u.kleinsteLuecke}
            hoechsteVergebene={u.hoechsteVergebene}
          />

          <div style={{ fontSize: '0.85rem', lineHeight: 1.75, color: 'var(--mdc-ink-dim)', maxWidth: 720 }}>
            <p>
              <strong>{'Was eine „Lücke" hier heißt:'}</strong> Die Nummer steht in keiner
              Wertung, die die Seite kennt — weder im Archiv 2025/26, noch im Sommer-Ranking
              2026, noch in der laufenden Saison, und sie wurde auch nicht beim Hochladen
              eines Zettels angelegt. Ob jemand mit dieser Nummer einen Pass in der Schublade
              hat und seit zwei Jahren nicht mehr gespielt hat, weiß die Seite nicht. Deshalb
              ist eine Lücke kein Vorschlag, sondern nur eine Beobachtung.
            </p>
            <p style={{ marginTop: 12 }}>
              <strong>Löschen geht hier nicht</strong>, und zwar mit Absicht: Der Spielerstamm
              wird nicht von Hand gepflegt, sondern aus den Wertungen aufgebaut. Wer eine
              Zeile in einer Rangliste hat, ist im Stamm — sonst hätten seine Turniere
              niemanden, zu dem sie gehören. Soll jemand wirklich verschwinden, muss die Zeile
              aus der Arbeitsmappe raus und die Saison neu eingelesen werden. Bei jemandem mit
              gespielten Turnieren wäre das falsch: Seine Ergebnisse sind passiert und stehen
              in der Auswertung.
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
