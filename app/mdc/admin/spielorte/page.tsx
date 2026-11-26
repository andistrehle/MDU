// ============================================================
// MDC — Spielorte in der Turnierverwaltung
// ============================================================
//
// Liegt hinter derselben Passwortabfrage wie der Ergebnis-Upload (`proxy.ts`)
// und ist für Suchmaschinen gesperrt.
//
// Dynamisch, nicht vorgerechnet: Die Liste soll den Stand des laufenden
// Deployments zeigen, samt der Änderungen, die gerade daran hängen.
// ============================================================

import type { Metadata } from 'next';
import { PageHero } from '@/components/mdc/ui';
import { AdminNav } from '@/components/mdc/admin-nav';
import { SpielortEditor, type EditorSpielort } from '@/components/mdc/spielort-editor';
import { ALLE_BASIS, WEEKDAY_NAMES, istNeuerSpielort } from '@/data/venues';
import { entfernungFuer } from '@/data/spielorte-entfernt';
import { ALL_TOURNAMENTS } from '@/data/tournament-results';
import { KALENDER } from '@/data/kalender';
import { todayInMunich } from '@/data/season';
import {
  FELD_NAMEN, SPIELORT_FELDER, aenderungFuer, gleicherWert,
  type SpielortFeld,
} from '@/data/spielorte-aenderungen';
import type { Venue, Weekday } from '@/data/types';
import { getUploadStatus } from '@/lib/mdc/upload-config';
import { formatDate } from '@/lib/mdc/format';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Spielorte',
  description: 'Automaten, Spieltag, Beginn und Adresse der Lokale ändern.',
};

export const dynamic = 'force-dynamic';

/** Ein Wert lesbar — für „3 → 4" und „Montag → Montag & Freitag". */
function alsText(feld: SpielortFeld, wert: unknown): string {
  if (feld === 'weekdays') {
    return (wert as Weekday[]).map(d => WEEKDAY_NAMES[d]).join(' & ') || '—';
  }
  if (feld === 'phones') return (wert as string[]).join(', ') || '—';
  if (wert === null) return 'noch nicht bekannt';
  return String(wert);
}

export default function AdminSpielortePage() {
  // Nur die Termine ab heute zählen: Ein Lokal herauszunehmen, zu dem noch
  // ein Abend im Plan steht, ließe den Wochenplan auf etwas zeigen, das es
  // nicht mehr gibt. Vergangene stören nicht.
  const heute = todayInMunich();

  const spielorte: EditorSpielort[] = ALLE_BASIS.map(basis => {
    const aenderung = aenderungFuer(basis);
    const jetzt: Venue = aenderung ? { ...basis, ...aenderung.neu } : basis;

    const geaendert = SPIELORT_FELDER
      .filter(feld => !gleicherWert(jetzt[feld], basis[feld]))
      .map(feld => ({
        feld: FELD_NAMEN[feld],
        vorher: alsText(feld, basis[feld]),
        jetzt: alsText(feld, jetzt[feld]),
      }));

    return {
      id: basis.id,
      name: jetzt.name,
      street: jetzt.street,
      zip: jetzt.zip,
      city: jetzt.city,
      weekdays: [...jetzt.weekdays],
      time: jetzt.time,
      phones: [...jetzt.phones],
      boards: jetzt.boards,
      basis: {
        name: basis.name,
        street: basis.street,
        zip: basis.zip,
        city: basis.city,
        weekdays: [...basis.weekdays],
        time: basis.time,
        phones: [...basis.phones],
        boards: basis.boards,
      },
      geaendert,
      note: aenderung?.note ?? null,
      datum: aenderung ? formatDate(aenderung.datum) : null,
      neu: istNeuerSpielort(basis.id),
      // Entscheidet, WIE entfernt wird: Mit Turnieren bleibt der Name an den
      // Ergebnissen (früheres Lokal), ohne verschwindet es ganz.
      turniere: ALL_TOURNAMENTS.filter(t => t.venueId === basis.id).length,
      kommendeTermine: KALENDER.filter(k => k.venueId === basis.id && k.date >= heute).length,
      entfernt: (() => {
        const e = entfernungFuer(basis.id);
        return e ? { datum: formatDate(e.datum), note: e.note } : null;
      })(),
    };
  });

  return (
    <>
      <PageHero
        kicker="Turnierverwaltung"
        title="Spielorte"
        description="Ein Automat mehr, ein anderer Spieltag, neue Startzeit: Hier ändern — es wirkt sofort überall, auf der Spielorte-Seite, im Wochenplan und beim Ergebnis-Upload."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <AdminNav aktiv="spielorte" />

          <SpielortEditor spielorte={spielorte} status={getUploadStatus()} />

          <div style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--mdc-ink-dim)', maxWidth: 720 }}>
            <p>
              Maßgeblich bleibt die Spielorte-Übersicht des Betreibers
              (<code>data/venues.ts</code>). Was hier geändert wird, legt sich als eigener
              Eintrag darüber und wird wie alles andere als Commit abgelegt — nachlesbar und
              rücknehmbar. Jeder Eintrag merkt sich den alten Wert und <strong>gilt nur, solange
              der in der Übersicht noch steht</strong>: Sobald du dort nachziehst oder zur neuen
              Saison eine neue Übersicht einliest, fällt er von allein weg, statt eine überholte
              Angabe weiterzuschleppen.
            </p>
            <p style={{ marginTop: 10 }}>
              Ein <strong>neues Lokal</strong> wird oben angelegt und landet in
              <code> data/spielorte-neu.ts</code>.
            </p>
            <p style={{ marginTop: 10 }}>
              <strong>Herausnehmen</strong> geht bei jedem Lokal. Es verschwindet dann von der
              Spielorte-Seite, aus dem Wochenplan, aus dem Ergebnis-Upload und aus dem Kalender.
              Hängen <strong>Turniere</strong> daran, bleibt der Name an den Ergebnissen und das
              Lokal wird zu einem früheren Lokal (<code>data/spielorte-entfernt.ts</code>) — spurlos
              löschen ginge nicht, die Kennung steht in jeder Ergebniszeile, dort stünde danach
              „Unbekannter Spielort&ldquo;. Wurde dort nie gespielt und war es auf der Seite angelegt,
              ist es wirklich weg. <strong>Zurücknehmen geht immer</strong>; nur künftige
              Kalendereinträge müssen vorher raus.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
