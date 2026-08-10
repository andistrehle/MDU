'use client';

// ============================================================
// Tennis Kail — Spielpartner-Finder
// ============================================================
//
// UX-Gedanke: Das größte Hindernis beim Tennis ist nicht der Platz,
// sondern der zweite Mensch. Ein Finder muss deshalb ohne Konto und ohne
// Chat funktionieren: Gesuch lesen, Zeit sehen, Kontakt aufnehmen. Filter
// nach Spielstärke und Standort — mehr Struktur würde nur abschrecken.
//
// Datenschutz ist hier Gestaltung: Nachnamen sind abgekürzt, es gibt keine
// Telefonnummern in der Liste. Der Kontakt läuft in der Produktivversion
// über eine Weiterleitung, damit niemand seine Nummer öffentlich stellt.
// ============================================================

import { useMemo, useState } from 'react';
import { PARTNER_REQUESTS } from '@/data/tk/account';
import { LOCATIONS, getLocation } from '@/data/tk/facility';
import { formatSpan } from '@/lib/tk/format';
import { Button, Card, Chip, Empty } from '@/components/tk/ui/primitives';
import { Segment, Sheet } from '@/components/tk/ui/overlay';
import { cn } from '@/lib/utils';

type LookFilter = 'alle' | 'einzel' | 'doppel';

const ACCENT: Record<string, string> = {
  clay: 'var(--tk-clay)',
  forest: 'var(--tk-forest-3)',
  // Kein Ballgelb: Weiß auf Gelb sind 2,3:1. Ein dunkles Ocker trägt die
  // weißen Initialen mit 5,7:1.
  sun: '#8A5D12',
};

/** „Sebastian Frey" → „Sebastian F." — Nachname bleibt privat. */
function shorten(name: string) {
  const parts = name.split(' ');
  if (parts.length < 2) return name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function PartnerFinder() {
  const [look, setLook] = useState<LookFilter>('alle');
  const [locationId, setLocationId] = useState<string>('alle');
  const [contacting, setContacting] = useState<string | null>(null);
  const [ownOpen, setOwnOpen] = useState(false);
  const [sent, setSent] = useState<string[]>([]);

  const list = useMemo(
    () =>
      PARTNER_REQUESTS.filter((p) => {
        if (look !== 'alle' && p.looksFor !== look && p.looksFor !== 'beides') return false;
        if (locationId !== 'alle' && p.preferredLocationId !== locationId) return false;
        return true;
      }),
    [look, locationId],
  );

  const active = PARTNER_REQUESTS.find((p) => p.id === contacting);

  return (
    <>
      <div className="tk-shell flex flex-wrap items-center gap-3">
        <Segment
          label="Was gesucht wird"
          value={look}
          onChange={setLook}
          options={[
            { value: 'alle', label: 'Alle' },
            { value: 'einzel', label: 'Einzel' },
            { value: 'doppel', label: 'Doppel' },
          ]}
        />
        <Segment
          label="Standort"
          value={locationId}
          onChange={setLocationId}
          options={[
            { value: 'alle', label: 'Beide Anlagen' },
            ...LOCATIONS.map((l) => ({ value: l.id, label: l.shortName })),
          ]}
        />
        <Button className="ml-auto" onClick={() => setOwnOpen(true)}>
          Eigenes Gesuch aufgeben
        </Button>
      </div>

      <div className="tk-shell mt-8">
        {list.length === 0 ? (
          <Empty
            title="Gerade nichts Passendes"
            body="Mit diesen Filtern sucht im Moment niemand. Filter weiter fassen oder selbst ein Gesuch aufgeben — meistens meldet sich innerhalb weniger Tage jemand."
            action={
              <Button tone="ghost" onClick={() => setOwnOpen(true)}>
                Gesuch aufgeben
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <Card key={p.id} className="flex flex-col gap-3 p-5" as="article">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-11 w-11 flex-none place-items-center rounded-full font-semibold text-white"
                    style={{ background: ACCENT[p.accent] ?? 'var(--tk-clay)' }}
                  >
                    {p.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{shorten(p.name)}</p>
                    <p className="text-[0.8rem] text-[var(--tk-ink-dim)]">
                      {p.lk} · {p.age} Jahre
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Chip tone="clay">
                    {p.looksFor === 'einzel' ? 'Einzel' : p.looksFor === 'doppel' ? 'Doppel' : 'Einzel oder Doppel'}
                  </Chip>
                  <Chip tone="outline">{getLocation(p.preferredLocationId)?.shortName}</Chip>
                </div>

                <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">{p.text}</p>

                <p className="text-[0.84rem] text-[var(--tk-ink-dim)]">
                  Am liebsten {p.slots.map((s) => formatSpan(s.from, s.to)).join(', ')} Uhr
                </p>

                <Button
                  tone={sent.includes(p.id) ? 'ghost' : 'clay'}
                  block
                  className={cn('mt-auto')}
                  disabled={sent.includes(p.id)}
                  onClick={() => setContacting(p.id)}
                >
                  {sent.includes(p.id) ? 'Anfrage gesendet' : 'Kontakt aufnehmen'}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Kontaktpanel */}
      <Sheet
        open={Boolean(active)}
        onClose={() => setContacting(null)}
        title={active ? `Nachricht an ${shorten(active.name)}` : ''}
        description="Die Nachricht wird weitergeleitet — deine Nummer bleibt bei dir."
        footer={
          <Button
            block
            onClick={() => {
              if (active) setSent((s) => [...s, active.id]);
              setContacting(null);
            }}
          >
            Anfrage senden
          </Button>
        }
      >
        {active ? (
          <div className="flex flex-col gap-4">
            <p className="rounded-[12px] bg-[var(--tk-chalk)] p-4 text-[0.9rem] text-[var(--tk-ink-soft)]">
              {active.text}
            </p>
            <div className="tk-field">
              <label className="tk-label" htmlFor="pf-name">
                Dein Name
              </label>
              <input id="pf-name" className="tk-input" autoComplete="name" />
            </div>
            <div className="tk-field">
              <label className="tk-label" htmlFor="pf-msg">
                Nachricht
              </label>
              <textarea
                id="pf-msg"
                className="tk-textarea"
                defaultValue={`Hallo, ich hätte Lust auf ein ${active.looksFor === 'doppel' ? 'Doppel' : 'Match'}. Passt dir einer der genannten Termine?`}
              />
            </div>
            <p className="tk-hint">
              In dieser Demo wird nichts verschickt. Im Echtbetrieb ginge die Nachricht per
              E-Mail weiter, ohne dass Kontaktdaten öffentlich werden.
            </p>
          </div>
        ) : null}
      </Sheet>

      {/* Eigenes Gesuch */}
      <Sheet
        open={ownOpen}
        onClose={() => setOwnOpen(false)}
        title="Eigenes Gesuch aufgeben"
        description="Erscheint nach Freigabe in der Liste."
        footer={
          <Button block onClick={() => setOwnOpen(false)}>
            Gesuch einstellen
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tk-field">
              <label className="tk-label" htmlFor="own-name">
                Name
              </label>
              <input id="own-name" className="tk-input" autoComplete="name" />
            </div>
            <div className="tk-field">
              <label className="tk-label" htmlFor="own-lk">
                Leistungsklasse
              </label>
              <input id="own-lk" className="tk-input" placeholder="z. B. LK 18 — oder ohne LK" />
            </div>
          </div>
          <div className="tk-field">
            <label className="tk-label" htmlFor="own-text">
              Was suchst du?
            </label>
            <textarea id="own-text" className="tk-textarea" placeholder="Einzel oder Doppel, wie oft, welches Niveau, wann am liebsten" />
          </div>
          <p className="tk-hint">
            Öffentlich sichtbar sind Vorname, erster Buchstabe des Nachnamens, Leistungsklasse
            und Wunschzeiten. Keine Telefonnummer, keine E-Mail.
          </p>
        </div>
      </Sheet>
    </>
  );
}
