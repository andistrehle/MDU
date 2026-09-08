// ============================================================
// MDC — eine Karte im Wochenplan
// ============================================================
//
// Steht auf der Startseite und unter „Turniere" — dieselbe Karte, damit ein
// abgesagter Termin nicht auf einer Seite durchgestrichen und auf der anderen
// gar nicht auftaucht.
//
// Eine Absage wird gezeigt, nicht weggelassen: Wer den Plan im Kopf hat und
// hinfahren wollte, soll sehen, dass es ausfällt — und warum, falls die
// Turnierleitung einen Grund hinterlegt hat.
// ============================================================

import Link from 'next/link';
import { ArrowRight, CalendarPlus, Target, X } from 'lucide-react';
import type { PlanEintrag } from '@/data/venues';
import { venueAddress } from '@/data/venues';
import { formatTime } from '@/lib/mdc/format';
import { mdcPath } from '@/lib/mdc/site';

export function PlanKarte({ eintrag, titelGroesse = '1.1rem' }: {
  eintrag: PlanEintrag;
  titelGroesse?: string;
}) {
  const { venue, time, zusatz, abgesagt, note } = eintrag;

  return (
    <div
      className={`mdc-card${abgesagt ? '' : ' mdc-card-hover'}`}
      style={{
        padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10,
        opacity: abgesagt ? 0.72 : 1,
        borderColor: zusatz ? 'var(--mdc-red-a35)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <h4
          className="mdc-display"
          style={{ fontSize: titelGroesse, textDecoration: abgesagt ? 'line-through' : undefined }}
        >
          {venue.name}
        </h4>
        <span
          className="mdc-num"
          style={{
            color: abgesagt ? 'var(--mdc-ink-dim)' : 'var(--mdc-red)',
            fontWeight: 700,
            textDecoration: abgesagt ? 'line-through' : undefined,
          }}
        >
          {formatTime(time)}
        </span>
      </div>

      {(abgesagt || zusatz) && (
        <span
          className={`mdc-chip ${abgesagt ? '' : 'mdc-chip-red'}`}
          style={{ alignSelf: 'flex-start' }}
        >
          {abgesagt ? <X size={12} /> : <CalendarPlus size={12} />}
          {abgesagt ? 'Fällt aus' : 'Zusatztermin'}
        </span>
      )}

      {note && (
        <p style={{ fontSize: '0.84rem', color: 'var(--mdc-ink-soft)', lineHeight: 1.5 }}>
          {note}
        </p>
      )}

      <p style={{ fontSize: '0.84rem', color: 'var(--mdc-ink-soft)', lineHeight: 1.5 }}>
        {venueAddress(venue)}
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--mdc-ink-dim)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <Target size={13} />
        {venue.boards} Dartautomaten
      </p>

      <Link
        href={mdcPath(`/spielorte/${venue.id}`)}
        className="mdc-btn mdc-btn-ghost mdc-btn-sm"
        style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
      >
        Spielort
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
