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
import { RegisterDoppelt, type Stillgelegt } from '@/components/mdc/register-doppelt';
import {
  NummernVergabe, type NummerStand, type Vergabe, type VergabeSpieler,
} from '@/components/mdc/nummern-vergabe';
import { alleKorrekturen } from '@/data/namen';
import { PLAYERS, playerName } from '@/data/players';
import { AKTIVE_REGISTER_KORREKTUREN, ERLEDIGTE_REGISTER_KORREKTUREN } from '@/data/register';
import { appearancesOf } from '@/data/tournament-results';
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

  // Die Berichtigungen nach Art auf die beiden Karten verteilt.
  const nurStill = (liste: typeof AKTIVE_REGISTER_KORREKTUREN): Stillgelegt[] =>
    liste.filter((k): k is Stillgelegt => k.art === 'stillgelegt');
  const nurVergabe = (liste: typeof AKTIVE_REGISTER_KORREKTUREN): Vergabe[] =>
    liste.filter((k): k is Vergabe => k.art === 'inhaber' || k.art === 'vergeben');

  const vergabeSpieler: VergabeSpieler[] = PLAYERS.map(p => ({
    playerId: p.id,
    name: playerName(p),
    division: p.division,
    passNr: p.passNr,
    formerPassNr: p.formerPassNr,
    starts: appearancesOf(p.id).length,
  }));

  const nummernStand: NummerStand[] = u.belegungen.map(b => ({
    passNr: b.passNr,
    heute: b.inhaber.find(i => i.aktuell)?.name ?? null,
    divison: b.inhaber[0]?.division ?? null,
    frueher: b.inhaber.filter(i => !i.aktuell).map(i => i.name),
  }));

  return (
    <>
      <PageHero
        kicker="Turnierverwaltung"
        title="Passnummern"
        description="Alle Nummern der Reihe nach: welche vergeben ist, welche frei, und welche zwei Menschen tragen. Und oben: Namen berichtigen — sowie den Fall auflösen, dass jemand im Register unter zwei Nummern steht."
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

          {/* Doppelte Registereinträge — der einzige Fall, in dem die Seite
              eine Nummer aus dem Register nehmen darf. Steht über der langen
              Liste, weil es ein Fehler ist und nicht bloß eine Auskunft. */}
          <RegisterDoppelt
            doppelt={u.doppelt.map(d => ({
              name: d.name,
              nummern: d.nummern.map(n => ({ passNr: n.passNr, gespielt: n.gespielt })),
            }))}
            korrekturen={nurStill(AKTIVE_REGISTER_KORREKTUREN)}
            erledigt={nurStill(ERLEDIGTE_REGISTER_KORREKTUREN)}
            canPublish={status.canPublish}
            missing={status.missing.filter(m => m.startsWith('MDC_GITHUB_TOKEN'))}
          />

          <NummernVergabe
            spieler={vergabeSpieler}
            nummern={nummernStand}
            frei={u.frei}
            naechsteFreie={u.naechsteFreie}
            vergaben={nurVergabe(AKTIVE_REGISTER_KORREKTUREN)}
            erledigt={nurVergabe(ERLEDIGTE_REGISTER_KORREKTUREN)}
            canPublish={status.canPublish}
            missing={status.missing.filter(m => m.startsWith('MDC_GITHUB_TOKEN'))}
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
              ohne Namen ist frei. Die Seite liest das Register beim Einlesen einer Saison
              mit ein.
            </p>
            <p style={{ marginTop: 12 }}>
              <strong>Vergeben und umschreiben geht trotzdem hier</strong> (ganz oben): Eine
              freie Nummer an jemanden ausgeben — auch an einen, der schon gespielt hat —
              oder eine vergebene Nummer jemand anderem zuschreiben, wenn die Mappe noch den
              Vorgänger führt. Beides wird als eigene Berichtigung abgelegt, übersteht jeden
              Import und fällt von selbst weg, sobald die Mappe nachgezogen ist. An den
              Turnieren ändert es nichts: Wer eine Nummer abgibt, behält alle Ergebnisse und
              steht künftig als {'„früher Passnr. …"'} da.
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
              <strong>Zwei Nummern für einen Menschen</strong> sind die zweite Ausnahme.
              Steht jemand im Blatt {'„Teilnehmer"'} doppelt, macht die Seite daraus zwei
              Personen — die Spieler-Adresse entsteht aus dem Namen, und beim zweiten Eintrag
              hängt die Nummer daran. Die Zeile ohne einen einzigen Start lässt sich oben
              stilllegen; die Nummer wird damit wieder frei. Die mit den Turnieren nicht: Da
              verlören Ergebnisse ihren Menschen. In der Mappe gehört die doppelte Zeile
              trotzdem gelöscht — danach meldet der Prüflauf {'„ERLEDIGT"'}.
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
