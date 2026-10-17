// ============================================================
// MDC — Ranking ansetzen (die Seite für die Wirte)
// ============================================================
//
// Die einzige Seite des Verwaltungsbereichs, die auch mit dem zweiten
// Passwort aufgeht (`MDC_TERMIN_PASSWORD`, siehe `proxy.ts` und
// `lib/mdc/zugang.ts`). Deshalb steht hier BEWUSST KEINE `AdminNav`:
//
// Next lädt Verweise vorab, sobald sie ins Blickfeld scrollen. Ein Wirt, der
// nur dieses Passwort hat, bekäme dann mitten im Scrollen die Passwortabfrage
// für den Ergebnis-Upload — eine Tür, die ihm ohnehin nicht aufgeht. Also
// zeigen wir sie gar nicht erst. Die Turnierleitung kommt über den Kalender
// hierher.
//
// Dynamisch, nicht vorgerechnet: Die Seite hängt am heutigen Datum und daran,
// wer gerade davorsitzt.
// ============================================================

import type { Metadata } from 'next';
import { CalendarDays, ShieldCheck } from 'lucide-react';
import { PageHero } from '@/components/mdc/ui';
import {
  AnsetzForm, type AnsetzVenue, type AngesetzterTermin,
} from '@/components/mdc/ansetz-form';
import { KALENDER } from '@/data/kalender';
import { VENUES, getVenue, venueWeekdayLabel } from '@/data/venues';
import { todayInMunich } from '@/data/season';
import { getUploadStatus } from '@/lib/mdc/upload-config';
import { werDaIst } from '@/lib/mdc/zugang';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Ranking ansetzen',
  description: 'Einen zusätzlichen Turnierabend eintragen.',
};

export const dynamic = 'force-dynamic';

/** Vier Monate voraus — weiter nimmt auch die Aktion nichts an. */
function maxDatumAb(heute: string): string {
  const d = new Date(`${heute}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 120);
  return d.toISOString().slice(0, 10);
}

export default async function AnsetzenPage() {
  const heute = todayInMunich();
  const rolle = await werDaIst();
  const status = getUploadStatus();

  const venues: AnsetzVenue[] = VENUES.map(v => ({
    id: v.id,
    name: v.name,
    time: v.time,
    weekdays: [...v.weekdays],
    weekdayLabel: venueWeekdayLabel(v),
  }));

  // Nur die eigenen Zusatztermine ab heute — Absagen gehören nicht hierher,
  // die kann hier auch niemand zurücknehmen.
  const termine: AngesetzterTermin[] = KALENDER
    .filter(t => t.art === 'zusatz' && t.date >= heute)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(t => ({
      id: t.id,
      date: t.date,
      venueName: getVenue(t.venueId)?.name ?? t.venueId,
      time: t.time ?? getVenue(t.venueId)?.time ?? '20:00',
      note: t.note,
    }));

  return (
    <>
      <PageHero
        kicker="Für die Lokale"
        title="Ranking ansetzen"
        description="Ihr macht am Freitag, Samstag oder Sonntag ein Ranking? Hier eintragen — dann steht es auf der Seite, im Wochenplan und bei eurem Lokal. Ein fester Spieltag ändert sich damit nicht; das bleibt bei der Turnierleitung."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <AnsetzForm
            venues={venues}
            termine={termine}
            heute={heute}
            maxDatum={maxDatumAb(heute)}
            darfAblegen={status.canPublish}
            fehlt={status.missing}
          />

          <div className="mdc-card" style={{ padding: '18px 20px', display: 'flex', gap: 12 }}>
            <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-ink-dim)' }} />
            <div style={{ fontSize: '0.86rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
              <p>
                Dieses Passwort öffnet <strong>nur diese Seite</strong>. Ergebnisse, Passnummern
                und News bleiben zu — dafür hat die Turnierleitung ein eigenes.
              </p>
              <p style={{ marginTop: 8 }}>
                Es ist für alle Lokale <strong>dasselbe</strong> Passwort. Ein Eintrag lässt sich
                deshalb keinem bestimmten Wirt zuordnen, und wer es hat, kann auch für ein anderes
                Lokal ansetzen. Die Turnierleitung sieht jeden Eintrag und kann ihn zurücknehmen.
              </p>
              {rolle === 'leitung' && (
                <p style={{ marginTop: 8 }}>
                  Du bist als <strong>Turnierleitung</strong> hier. Absagen, Zusatztermine für
                  jeden Tag und die ganze Übersicht stehen im{' '}
                  {/* Als <a>, nicht als Link: Ein Vorabruf auf /admin fragt sonst
                      mitten im Scrollen nach dem Passwort. */}
                  <a href={mdcPath('/admin/kalender')} style={{ color: 'var(--mdc-red)' }}>
                    Kalender der Verwaltung
                  </a>.
                </p>
              )}
            </div>
          </div>

          <p style={{ fontSize: '0.86rem', lineHeight: 1.7, color: 'var(--mdc-ink-dim)', display: 'flex', gap: 10 }}>
            <CalendarDays size={16} style={{ flexShrink: 0, marginTop: 3 }} />
            <span>
              Der feste Wochenplan steht nicht hier, sondern bei den Lokalen: jeder Spielort mit
              seinem Wochentag und seiner Uhrzeit. Hier kommt nur dazu, was sonst nicht
              stattfindet.
            </span>
          </p>
        </div>
      </section>
    </>
  );
}
