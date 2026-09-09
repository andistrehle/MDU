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
import { NamenEditor, type NamenSpieler } from '@/components/mdc/namen-editor';
import { alleKorrekturen } from '@/data/namen';
import { PLAYERS } from '@/data/players';
import { passUebersicht, quelleLabel } from '@/lib/mdc/passnummern';
import { getUploadStatus } from '@/lib/mdc/upload-config';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Passnummern',
  description: 'Welche MDC-Passnummern vergeben sind und welche frei.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPassnummernPage() {
  const u = passUebersicht();
  const status = getUploadStatus();

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

  // Für den Namenseditor: je Nummer der Mensch, der sie heute trägt — mit dem
  // Namen in der Schreibweise der Arbeitsmappe, damit die Felder gefüllt
  // dastehen und nur geändert werden muss, was falsch ist.
  const namenSpieler: NamenSpieler[] = u.belegungen.flatMap(b => {
    const haupt = b.inhaber.find(i => i.aktuell) ?? b.inhaber[0];
    const player = PLAYERS.find(p => p.id === haupt.playerId);
    if (!player) return [];
    return [{
      passNr: b.passNr,
      playerId: player.id,
      name: haupt.name,
      lastName: player.lastName.toUpperCase(),
      firstName: player.nickname
        ? `${player.firstName.toUpperCase()} (${player.nickname.toUpperCase()})`
        : player.firstName.toUpperCase(),
      starts: haupt.starts,
      mehrfach: b.inhaber.length > 1,
    }];
  });

  return (
    <>
      <PageHero
        kicker="Turnierverwaltung"
        title="Passnummern"
        description="Alle Nummern der Reihe nach: welche vergeben ist, welche frei, und welche zwei Menschen tragen. Und oben: Namen berichtigen, wenn jemand falsch geschrieben in der Auswertung steht."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <AdminNav aktiv="passnummern" />

          <NamenEditor
            spieler={namenSpieler}
            korrekturen={alleKorrekturen()}
            // Der Schlüssel für die Bilderkennung spielt hier keine Rolle —
            // eine Namenskorrektur wird nur abgelegt, nicht gelesen.
            status={{
              canPublish: status.canPublish,
              missing: status.missing.filter(m => m.startsWith('MDC_GITHUB_TOKEN')),
            }}
          />

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
              ohne Namen ist frei. <strong>Vergeben</strong> werden Nummern in der Mappe,
              nicht hier; die Seite liest das Register beim Einlesen einer Saison mit ein.
            </p>
            <p style={{ marginTop: 12 }}>
              <strong>Namen sind die Ausnahme:</strong> Die kann die Seite selbst berichtigen
              (oben). Die Korrektur wird als eigener Eintrag abgelegt und beim nächsten
              Einlesen nicht überschrieben — sie gilt für Register, laufende Wertung und
              Archiv zugleich, weil sie an der Passnummer hängt. Nur deshalb entstehen aus
              einem Menschen nicht zwei. Schön wäre trotzdem, den richtigen Namen auch in
              der Mappe nachzuziehen.
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
