// ============================================================
// Tennis Kail — Turnierverwaltung
// ============================================================
//
// UX-Gedanke: Ein Turniertableau ist die einzige Stelle, an der eine
// Tennisseite wirklich Tabelle sein darf. Auf dem Telefon scrollt es
// waagerecht, die Runden bleiben als Spalten erhalten — ein umgebrochener
// Baum ist unlesbar.
//
// Die Betreibersicht (Auslosung, Ergebnis eintragen) liegt im Dashboard;
// hier steht die öffentliche Sicht.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card, Chip, DemoNote, Meter } from '@/components/tk/ui/primitives';
import { TOURNAMENTS } from '@/data/tk/events';
import { getLocation } from '@/data/tk/facility';
import { formatDayLong, formatPrice } from '@/lib/tk/format';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Turniere',
  description:
    'Turniere bei Tennis Kail: Meldung, Auslosung und Tableau — vom offenen Herbstturnier ' +
    'bis zum Wintercup.',
};

const STATUS_LABEL: Record<string, string> = {
  anmeldung: 'Meldung offen',
  ausgelost: 'Ausgelost',
  laufend: 'Läuft',
  beendet: 'Beendet',
};

export default function TurnierePage() {
  return (
    <>
      <PageHeader
        eyebrow="Turniere"
        title="Meldung, Auslosung, Tableau"
        lede="Anmelden mit zwei Angaben, Auslosung sichtbar für alle, Ergebnisse direkt vom Platz. Kein Zettel am Schwarzen Brett."
      />

      <section className="tk-section">
        <div className="tk-shell flex flex-col gap-10">
          {TOURNAMENTS.map((t) => {
            const loc = getLocation(t.locationId);
            const free = t.drawSize - t.registered;
            return (
              <Card key={t.id} className="overflow-hidden" as="article">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--tk-line-soft)] p-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone={t.status === 'anmeldung' ? 'free' : t.status === 'beendet' ? 'neutral' : 'clay'}>
                        {STATUS_LABEL[t.status]}
                      </Chip>
                      <span className="text-[0.85rem] text-[var(--tk-ink-dim)]">
                        {formatDayLong(t.date)} · {loc?.shortName}
                      </span>
                    </div>
                    <h2 className="tk-h3">{t.title}</h2>
                    <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">{t.mode}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="tk-num text-[0.9rem]">
                      Meldegeld {formatPrice(t.entryCents)}
                    </span>
                    {t.status === 'anmeldung' ? (
                      <Link href={`/tk/kontakt?anliegen=${encodeURIComponent(t.title)}`} className="tk-btn tk-btn--sm">
                        Melden
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-6 p-6 lg:grid-cols-[240px_1fr]">
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="mb-1.5 flex justify-between text-[0.84rem]">
                        <span className="font-semibold">{t.registered} gemeldet</span>
                        <span className="text-[var(--tk-ink-dim)]">Feld {t.drawSize}</span>
                      </div>
                      <Meter value={(t.registered / t.drawSize) * 100} />
                      <p className="mt-1.5 text-[0.82rem] text-[var(--tk-ink-dim)]">
                        {free > 0 ? `${free} Plätze frei` : 'Feld voll'}
                      </p>
                    </div>
                    <dl className="flex flex-col gap-1 text-[0.86rem]">
                      <div className="flex justify-between border-b border-[var(--tk-line-soft)] pb-1">
                        <dt className="text-[var(--tk-ink-dim)]">Modus</dt>
                        <dd className="text-right">K.-o.</dd>
                      </div>
                      <div className="flex justify-between border-b border-[var(--tk-line-soft)] pb-1">
                        <dt className="text-[var(--tk-ink-dim)]">Bälle</dt>
                        <dd className="text-right">gestellt</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-[var(--tk-ink-dim)]">Plätze</dt>
                        <dd className="text-right">Sand, {loc?.shortName}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Tableau */}
                  <div className="tk-grid-scroll -mx-2 px-2" tabIndex={0} role="region" aria-label="Turniertableau, waagerecht scrollbar">
                    <div className="flex min-w-max gap-5">
                      {t.rounds.map((round) => (
                        <div key={round.name} className="flex w-[212px] flex-none flex-col gap-2">
                          <h3 className="text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-[var(--tk-ink-dim)]">
                            {round.name}
                          </h3>
                          {round.matches.length === 0 ? (
                            <div className="flex h-[72px] items-center justify-center rounded-[10px] border border-dashed border-[var(--tk-line-hard)] text-[0.8rem] text-[var(--tk-ink-faint)]">
                              wird ausgelost
                            </div>
                          ) : (
                            round.matches.map((m, mi) => (
                              <div
                                key={mi}
                                className="overflow-hidden rounded-[10px] border border-[var(--tk-line)] bg-[var(--tk-paper)]"
                              >
                                {(['a', 'b'] as const).map((side) => (
                                  <div
                                    key={side}
                                    className={cn(
                                      'flex items-center justify-between gap-2 px-3 py-2 text-[0.84rem]',
                                      side === 'a' && 'border-b border-[var(--tk-line-soft)]',
                                      m.winner === side && 'bg-[var(--tk-free-wash)] font-semibold',
                                      m[side] === 'Freilos' && 'text-[var(--tk-ink-faint)]',
                                    )}
                                  >
                                    <span className="truncate">{m[side]}</span>
                                    {m.winner === side ? (
                                      <span aria-label="Sieger" className="text-[var(--tk-free)]">
                                        ✓
                                      </span>
                                    ) : null}
                                  </div>
                                ))}
                                {m.score ? (
                                  <p className="tk-num border-t border-[var(--tk-line-soft)] bg-[var(--tk-chalk)] px-3 py-1.5 text-[0.78rem] text-[var(--tk-ink-dim)]">
                                    {m.score}
                                  </p>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ['Melden in 30 Sekunden', 'Name, LK, Telefon — mehr braucht eine Meldung nicht. Bestätigung kommt sofort, Meldegeld wird an der Anlage bezahlt.'],
              ['Auslosung für alle sichtbar', 'Sobald das Feld steht, ist das Tableau öffentlich. Wer wann spielt, steht in der eigenen Buchungsliste.'],
              ['Ergebnis vom Platz aus', 'Der Sieger trägt das Ergebnis am Telefon ein, der Baum aktualisiert sich. Kein Turnierleiter, der Zettel einsammelt.'],
            ].map(([t, b]) => (
              <Card key={t} className="flex flex-col gap-2 p-5">
                <h3 className="text-[1rem] font-semibold">{t}</h3>
                <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">{b}</p>
              </Card>
            ))}
          </div>

          <DemoNote>
            Turniere, Namen und Ergebnisse sind erfunden. Die Ergebniseingabe ist in dieser Demo
            nicht angeschlossen — sie gehört zu den Funktionen, die eine Produktivversion
            mitbringen würde (siehe Roadmap in der Projektdokumentation).
          </DemoNote>
        </div>
      </section>
    </>
  );
}
