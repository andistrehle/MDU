// ============================================================
// MDC — Kalender in der Turnierverwaltung
// ============================================================
//
// Liegt hinter derselben Passwortabfrage wie der Ergebnis-Upload
// (`proxy.ts`) und ist für Suchmaschinen gesperrt.
//
// Dynamisch, nicht vorgerechnet: Der Plan hängt am heutigen Datum, und die
// Liste soll den Stand des laufenden Deployments zeigen.
// ============================================================

import type { Metadata } from 'next';
import { CalendarPlus } from 'lucide-react';
import { PageHero } from '@/components/mdc/ui';
import { AdminNav } from '@/components/mdc/admin-nav';
import {
  KalenderEditor, type KalenderTermin, type KalenderVenue,
} from '@/components/mdc/kalender-editor';
import { KALENDER } from '@/data/kalender';
import { VENUES, playDaysFrom } from '@/data/venues';
import { todayInMunich } from '@/data/season';
import { getUploadStatus } from '@/lib/mdc/upload-config';
import { terminPasswortGesetzt } from '@/lib/mdc/zugang';
import { mdcPath } from '@/lib/mdc/site';
import { terminId } from '@/lib/mdc/kalender-commit';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Kalender',
  description: 'Termine absagen und Zusatztermine ansetzen.',
};

export const dynamic = 'force-dynamic';

export default async function AdminKalenderPage() {
  const heute = todayInMunich();
  const terminZugang = terminPasswortGesetzt();

  const venues: KalenderVenue[] = VENUES.map(v => ({
    id: v.id,
    name: v.name,
    time: v.time,
    weekdays: [...v.weekdays],
  }));

  // Drei Wochen reichen: Weiter im Voraus sagt niemand ein Ranking ab, und
  // die Liste bliebe sonst unübersichtlich.
  const plan: KalenderTermin[] = playDaysFrom(heute, 21).flatMap(tag =>
    tag.eintraege.map(e => ({
      date: tag.date,
      venueId: e.venue.id,
      venueName: e.venue.name,
      time: e.time,
      zusatz: e.zusatz,
      abgesagt: e.abgesagt,
      note: e.note,
      // Nur ein Eintrag, der aus dem Kalender stammt, lässt sich zurücknehmen.
      aenderungId: e.abgesagt
        ? terminId(tag.date, e.venue.id, 'absage')
        : e.zusatz
          ? terminId(tag.date, e.venue.id, 'zusatz')
          : null,
    })),
  );

  // Auch vergangene Änderungen, neueste zuerst — sie erklären, warum an einem
  // Tag etwas anders war.
  const aenderungen = [...KALENDER]
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));

  return (
    <>
      <PageHero
        kicker="Turnierverwaltung"
        title="Kalender"
        description="Fällt ein Ranking aus, hier absagen. Springt ein anderes Lokal ein oder gibt es spontan eines am Wochenende, hier ansetzen."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <AdminNav aktiv="kalender" />

          <KalenderEditor
            plan={plan}
            aenderungen={aenderungen}
            venues={venues}
            heute={heute}
            status={getUploadStatus()}
          />

          {/* ── Der Zugang für die Wirte ──
              Die Wirte setzen ihre Wochenendtermine selbst an; diese Karte
              sagt der Turnierleitung, wo das passiert und ob es überhaupt
              offen ist. Verweis als <a> und nicht als Link: Ein Vorabruf auf
              eine /admin-Adresse fragt sonst mitten im Scrollen nach dem
              Passwort. */}
          <div className="mdc-card" style={{ padding: '18px 20px' }}>
            <h2 className="mdc-display" style={{ fontSize: '1.05rem' }}>Die Lokale setzen selbst an</h2>
            <p style={{ marginTop: 8, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
              Unter <code>/admin/ansetzen</code> können die Wirte einen zusätzlichen Turnierabend
              eintragen — mit einem <strong>zweiten Passwort</strong>, das nur diese eine Seite
              öffnet. Absagen, fremde Tage und alles andere bleiben hier. Jeder Eintrag von dort
              steht oben in dieser Liste und lässt sich zurücknehmen.
            </p>
            <p style={{ marginTop: 8, fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
              {terminZugang
                ? <>Das Passwort ist vergeben (<code>MDC_TERMIN_PASSWORD</code> im Vercel-Projekt).</>
                : (
                  <>
                    <strong>Noch nicht vergeben:</strong> Solange <code>MDC_TERMIN_PASSWORD</code>{' '}
                    im Vercel-Projekt fehlt, kommt dort nur die Turnierleitung hinein. Es ist für
                    alle Lokale dasselbe Passwort — ein Eintrag lässt sich also keinem bestimmten
                    Wirt zuordnen.
                  </>
                )}
            </p>
            <a href={mdcPath('/admin/ansetzen')} className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ marginTop: 12 }}>
              <CalendarPlus size={15} />
              Die Seite ansehen
            </a>
          </div>

          <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--mdc-ink-dim)', maxWidth: 720 }}>
            Der Wochenplan selbst steht nicht in einer Terminliste, sondern in den Spielorten:
            Jedes Lokal hat seinen festen Wochentag und seine Uhrzeit. Hier stehen nur die
            Abweichungen davon — sie werden wie die Ergebnisse als Commit abgelegt und sind
            damit versioniert. Ändert sich ein fester Spieltag auf Dauer, gehört das nicht
            hierher, sondern in die Spielorte.
          </p>
        </div>
      </section>
    </>
  );
}
