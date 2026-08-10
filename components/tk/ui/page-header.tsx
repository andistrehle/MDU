// ============================================================
// Tennis Kail — Seitenkopf
// ============================================================
//
// Jede Unterseite beginnt gleich: Auszeichnung, Titel, ein Satz Erklärung,
// optional eine Handlung. Das ist kein Sparzwang, sondern Orientierung —
// wer aus der Navigation kommt, weiß nach zwei Zeilen, ob er richtig ist.
// ============================================================

import { Eyebrow } from './primitives';

export function PageHeader({
  eyebrow,
  title,
  lede,
  action,
  tone = 'light',
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  action?: React.ReactNode;
  tone?: 'light' | 'dark' | 'clay';
}) {
  const cls =
    tone === 'dark'
      ? 'tk-section--dark'
      : tone === 'clay'
        ? 'tk-section--clay'
        : 'border-b border-[var(--tk-line-soft)]';

  return (
    <header className={`${cls} py-10 md:py-14`}>
      <div className="tk-shell flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <Eyebrow dark={tone === 'dark'}>{eyebrow}</Eyebrow>
          <h1 className="tk-display text-[clamp(2rem,6vw,3.4rem)]">{title}</h1>
          {lede ? <p className="tk-lede">{lede}</p> : null}
        </div>
        {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
      </div>
    </header>
  );
}
