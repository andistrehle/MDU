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
import { VENUES, getVenue, venueWeekdayLabel, playDaysFrom } from '@/data/venues';
import { todayInMunich } from '@/data/season';
import { getUploadStatus } from '@/lib/mdc/upload-config';
import { werDaIst } from '@/lib/mdc/zugang';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Ranking ansetzen',
  description: 'Einen zusätzlichen Turnierabend eintragen oder einen Abend absagen.',
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

  // Die nächsten Abende je Lokal — daraus wählt die Absage aus, statt ein
  // freies Datumsfeld anzubieten. So kann niemand einen Tag erwischen, an dem
  // ohnehin nichts stattfindet; die Aktion lehnt das zwar auch ab, aber erst
  // NACH dem Tippen, und das ist eine Enttäuschung zu spät.
  const plan = playDaysFrom(heute, 121);
  const abende = new Map<string, { date: string; abgesagt: boolean }[]>();
  for (const tag of plan) {
    for (const eintrag of tag.eintraege) {
      // Nur die festen Abende: Was selbst angesetzt wurde, wird nicht
      // abgesagt, sondern unten in der Liste zurückgenommen.
      if (eintrag.zusatz) continue;
      const liste = abende.get(eintrag.venue.id) ?? [];
      liste.push({ date: tag.date, abgesagt: eintrag.abgesagt });
      abende.set(eintrag.venue.id, liste);
    }
  }

  const venues: AnsetzVenue[] = VENUES.map(v => ({
    id: v.id,
    name: v.name,
    time: v.time,
    weekdays: [...v.weekdays],
    weekdayLabel: venueWeekdayLabel(v),
    spieltage: abende.get(v.id) ?? [],
  }));

  // Alles, was die Lokale selbst eingetragen haben — angesetzt UND abgesagt.
  // Beides lässt sich hier zurücknehmen.
  const termine: AngesetzterTermin[] = KALENDER
    .filter(t => t.date >= heute)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(t => ({
      id: t.id,
      date: t.date,
      art: t.art,
      venueName: getVenue(t.venueId)?.name ?? t.venueId,
      time: t.time ?? getVenue(t.venueId)?.time ?? '20:00',
      note: t.note,
    }));

  return (
    <>
      <PageHero
        kicker="Für die Lokale"
        title="Ranking ansetzen oder absagen"
        description="Ihr macht am Freitag, Samstag oder Sonntag ein Ranking? Hier eintragen. Und fällt ein Abend aus, sagt ihr ihn hier ab — dann steht es auf der Seite, im Wochenplan und bei eurem Lokal, statt nur in der Facebook-Gruppe. Am festen Spieltag selbst ändert das nichts; der bleibt bei der Turnierleitung."
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
                  Du bist als <strong>Turnierleitung</strong> hier. Absagen an jedem Tag,
                  vergangene Termine und die ganze Übersicht stehen im{' '}
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
              stattfindet — oder fällt einmal weg. Soll sich der Wochentag dauerhaft ändern,
              bitte der Turnierleitung Bescheid sagen.
            </span>
          </p>
        </div>
      </section>
    </>
  );
}
