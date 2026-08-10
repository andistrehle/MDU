'use client';

// ============================================================
// Tennis Kail — Gutscheine
// ============================================================
//
// UX-Gedanke: Ein Gutschein ist ein Geschenk, kein Zahlungsvorgang.
// Deshalb steht die Vorschau im Mittelpunkt — man sieht sofort, was die
// beschenkte Person bekommt. Betrag, Anlass und Grußzeile ändern die
// Karte live; erst danach kommt der Kaufweg.
// ============================================================

import { useState } from 'react';
import { VOUCHER_PRESETS, VOUCHERS } from '@/data/tk/account';
import { formatPrice } from '@/lib/tk/format';
import { useTkStore } from '@/lib/tk/store';
import { Button, Card, Chip } from '@/components/tk/ui/primitives';
import { Segment } from '@/components/tk/ui/overlay';
import { FacilityArt } from '@/components/tk/media/facility-art';
import { cn } from '@/lib/utils';

type Design = 'sand' | 'halle' | 'kids';

const DESIGN: Record<Design, { label: string; tone: 'clay' | 'night' | 'sun'; variant: 'sand-court' | 'indoor-court' | 'kids' }> = {
  sand: { label: 'Sandplatz', tone: 'clay', variant: 'sand-court' },
  halle: { label: 'Halle', tone: 'night', variant: 'indoor-court' },
  kids: { label: 'Für Kinder', tone: 'sun', variant: 'kids' },
};

export function VoucherClient() {
  const [valueCents, setValueCents] = useState(5000);
  const [design, setDesign] = useState<Design>('sand');
  const [to, setTo] = useState('');
  const [from, setFrom] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const { addLine } = useTkStore();

  const d = DESIGN[design];

  return (
    <div className="tk-shell grid gap-10 lg:grid-cols-[1fr_420px] lg:items-start">
      {/* Formular */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="tk-h3 mb-3">Betrag</h2>
          <div className="flex flex-wrap gap-2">
            {VOUCHER_PRESETS.map((p) => (
              <button
                key={p.valueCents}
                onClick={() => setValueCents(p.valueCents)}
                aria-pressed={valueCents === p.valueCents}
                className={cn(
                  'flex flex-col items-start gap-0.5 rounded-[12px] border px-4 py-2.5 text-left transition-colors',
                  valueCents === p.valueCents
                    ? 'border-[var(--tk-clay)] bg-[var(--tk-clay)] text-white'
                    : 'border-[var(--tk-line-hard)] hover:bg-[var(--tk-chalk)]',
                )}
              >
                <span className="tk-num font-semibold">{formatPrice(p.valueCents)}</span>
                <span
                  className={cn(
                    'text-[0.74rem]',
                    valueCents === p.valueCents ? 'text-white/80' : 'text-[var(--tk-ink-dim)]',
                  )}
                >
                  {p.label}
                </span>
              </button>
            ))}
          </div>
          <div className="tk-field mt-4 max-w-[220px]">
            <label className="tk-label" htmlFor="v-amount">
              Eigener Betrag
            </label>
            <input
              id="v-amount"
              type="number"
              min={10}
              max={500}
              step={5}
              className="tk-input"
              value={valueCents / 100}
              onChange={(e) => setValueCents(Math.max(1000, Math.round(Number(e.target.value) * 100)))}
            />
          </div>
        </div>

        <div>
          <h2 className="tk-h3 mb-3">Motiv</h2>
          <Segment
            label="Motiv"
            value={design}
            onChange={setDesign}
            options={(Object.keys(DESIGN) as Design[]).map((k) => ({ value: k, label: DESIGN[k].label }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="tk-field">
            <label className="tk-label" htmlFor="v-to">
              Für wen?
            </label>
            <input id="v-to" className="tk-input" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Name" />
          </div>
          <div className="tk-field">
            <label className="tk-label" htmlFor="v-from">
              Von wem?
            </label>
            <input id="v-from" className="tk-input" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Dein Name" />
          </div>
          <div className="tk-field sm:col-span-2">
            <label className="tk-label" htmlFor="v-msg">
              Grußzeile
            </label>
            <input
              id="v-msg"
              className="tk-input"
              maxLength={70}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Auf viele lange Ballwechsel"
            />
            <span className="tk-hint">{70 - message.length} Zeichen übrig</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            onClick={() => {
              addLine({
                type: 'gutschein',
                title: `Gutschein ${formatPrice(valueCents)}`,
                subtitle: `${d.label}${to ? ` · für ${to}` : ''}`,
                priceCents: valueCents,
              });
              setDone(true);
            }}
          >
            Gutschein vormerken
          </Button>
          <span className="text-[0.86rem] text-[var(--tk-ink-dim)]">
            Ausdrucken oder an der Anlage abholen
          </span>
        </div>

        {done ? (
          <p className="rounded-[12px] bg-[var(--tk-free-wash)] px-4 py-3 text-[0.9rem] text-[var(--tk-free)]">
            Vorgemerkt. In der Demo passiert danach nichts weiter — kein Versand, keine Zahlung,
            kein Code. Im Echtbetrieb käme hier ein PDF zum Ausdrucken und ein Einlösecode.
          </p>
        ) : null}
      </div>

      {/* Vorschau und Bestand */}
      <aside className="flex flex-col gap-6 lg:sticky lg:top-[86px]">
        <div>
          <h2 className="tk-h3 mb-3">Vorschau</h2>
          <div className="overflow-hidden rounded-[var(--tk-radius-lg)] border border-[var(--tk-line)] shadow-[var(--tk-shadow)]">
            <div className="relative h-[132px]">
              <FacilityArt variant={d.variant} tone={d.tone} className="h-full w-full" />
              <span className="absolute left-4 top-4 rounded-full bg-[rgba(255,253,249,0.92)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--tk-clay-deep)]">
                Tennis Kail
              </span>
            </div>
            <div className="flex flex-col gap-3 bg-[var(--tk-paper)] p-5">
              <p className="font-[var(--tk-font-display)] text-[2.2rem] leading-none">
                {formatPrice(valueCents)}
              </p>
              <p className="text-[0.92rem] text-[var(--tk-ink-soft)]">
                {to ? <>Für <strong>{to}</strong></> : 'Für …'}
                {from ? <> · von <strong>{from}</strong></> : null}
              </p>
              {message ? (
                <p className="border-l-2 border-[var(--tk-clay-soft)] pl-3 text-[0.92rem] italic text-[var(--tk-ink-soft)]">
                  {"„"}{message}{"“"}
                </p>
              ) : null}
              <p className="text-[0.76rem] text-[var(--tk-ink-dim)]">
                Einlösbar für Platzmiete, Training, Kurse und Camps. Drei Jahre gültig.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="tk-h3 mb-3">Im Demo-Konto vorhanden</h2>
          <div className="flex flex-col gap-2">
            {VOUCHERS.map((v) => (
              <Card key={v.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{v.title}</p>
                  <p className="tk-num text-[0.78rem] text-[var(--tk-ink-dim)]">{v.code}</p>
                </div>
                <div className="text-right">
                  <p className="tk-num font-semibold">{formatPrice(v.balanceCents)}</p>
                  {v.balanceCents < v.valueCents ? (
                    <Chip tone="warn">teilweise eingelöst</Chip>
                  ) : (
                    <Chip tone="free">voll</Chip>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
