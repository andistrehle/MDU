// ============================================================
// Tennis Kail — UI-Grundbausteine
// ============================================================
//
// Bewusst eigene Bausteine statt einer eingekauften Bibliothek: Sie folgen
// der shadcn/ui-Denkweise (Komponenten liegen im Projekt, Varianten über
// Klassen, `cn()` zum Zusammenführen), bringen aber keine zusätzlichen
// Abhängigkeiten mit. Das Aussehen kommt aus app/tk/tk.css — so bleibt das
// Designsystem an einer Stelle und die Demo lädt kein zweites Theme.
// ============================================================

import Link from 'next/link';
import { cn } from '@/lib/utils';

type ButtonTone = 'clay' | 'ghost' | 'dark' | 'onDark' | 'onDarkGhost' | 'ball';
type ButtonSize = 'sm' | 'md' | 'lg';

const toneClass: Record<ButtonTone, string> = {
  clay: '',
  ghost: 'tk-btn--ghost',
  dark: 'tk-btn--dark',
  onDark: 'tk-btn--onDark',
  onDarkGhost: 'tk-btn--onDarkGhost',
  ball: 'tk-btn--ball',
};

const sizeClass: Record<ButtonSize, string> = { sm: 'tk-btn--sm', md: '', lg: 'tk-btn--lg' };

export function buttonClass(
  tone: ButtonTone = 'clay',
  size: ButtonSize = 'md',
  block = false,
  extra?: string,
) {
  return cn('tk-btn', toneClass[tone], sizeClass[size], block && 'tk-btn--block', extra);
}

export function Button({
  tone = 'clay',
  size = 'md',
  block,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
  size?: ButtonSize;
  block?: boolean;
}) {
  return <button className={buttonClass(tone, size, block, className)} {...rest} />;
}

export function ButtonLink({
  href,
  tone = 'clay',
  size = 'md',
  block,
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Link> & {
  tone?: ButtonTone;
  size?: ButtonSize;
  block?: boolean;
}) {
  return (
    <Link href={href} className={buttonClass(tone, size, block, className)} {...rest}>
      {children}
    </Link>
  );
}

export function Card({
  as: Tag = 'div',
  interactive,
  dark,
  flat,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  interactive?: boolean;
  dark?: boolean;
  flat?: boolean;
}) {
  return (
    <Tag
      className={cn(
        'tk-card',
        interactive && 'tk-card--link',
        dark && 'tk-card--dark',
        flat && 'tk-card--flat',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

type ChipTone = 'neutral' | 'free' | 'warn' | 'blocked' | 'clay' | 'dark' | 'outline';
const chipTone: Record<ChipTone, string> = {
  neutral: '',
  free: 'tk-chip--free',
  warn: 'tk-chip--warn',
  blocked: 'tk-chip--blocked',
  clay: 'tk-chip--clay',
  dark: 'tk-chip--dark',
  outline: 'tk-chip--outline',
};

export function Chip({
  tone = 'neutral',
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: ChipTone }) {
  return (
    <span className={cn('tk-chip', chipTone[tone], className)} {...rest}>
      {children}
    </span>
  );
}

export function Eyebrow({ dark, children }: { dark?: boolean; children: React.ReactNode }) {
  return <span className={cn('tk-eyebrow', dark && 'tk-eyebrow--dark')}>{children}</span>;
}

/** Abschnittskopf: Auszeichnung, Überschrift, Beschreibung, optionale Aktion. */
export function SectionHead({
  eyebrow,
  title,
  lede,
  action,
  dark,
  align = 'start',
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  action?: React.ReactNode;
  dark?: boolean;
  align?: 'start' | 'center';
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'md:flex-col md:items-center md:text-center',
      )}
    >
      <div className={cn('flex flex-col gap-3', align === 'center' && 'items-center')}>
        {eyebrow ? <Eyebrow dark={dark}>{eyebrow}</Eyebrow> : null}
        <h2 className="tk-h2">{title}</h2>
        {lede ? <p className="tk-lede">{lede}</p> : null}
      </div>
      {action ? <div className="flex-none">{action}</div> : null}
    </div>
  );
}

export function Meter({ value, tone }: { value: number; tone?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="tk-meter"
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Auslastung"
    >
      <div className="tk-meter__fill" style={{ width: `${clamped}%`, background: tone }} />
    </div>
  );
}

export function Kpi({
  value,
  label,
  hint,
}: {
  value: React.ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="tk-kpi">
      <span className="tk-kpi__value">{value}</span>
      <span className="tk-kpi__label">{label}</span>
      {hint ? <span className="text-[0.74rem] text-[var(--tk-ink-faint)]">{hint}</span> : null}
    </div>
  );
}

/** Ablaufanzeige für mehrstufige Strecken. */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="tk-steps" aria-label="Ablauf">
      {steps.map((s, i) => (
        <li
          key={s}
          className={cn('tk-step', i === current && 'tk-step--active', i < current && 'tk-step--done')}
          aria-current={i === current ? 'step' : undefined}
        >
          <span className="tk-step__num" aria-hidden>
            {i < current ? '✓' : i + 1}
          </span>
          {s}
        </li>
      ))}
    </ol>
  );
}

/** Kennzeichnung für Inhalte, die frei erfunden sind. */
export function DemoNote({ children }: { children: React.ReactNode }) {
  return <p className="tk-demo-note">{children}</p>;
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tk-field">
      <label className="tk-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <span className="tk-hint">{hint}</span> : null}
    </div>
  );
}

/** Leerer Zustand — nie eine leere Fläche ohne Erklärung. */
export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="tk-card tk-card--flat flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span aria-hidden className="text-2xl">
        ◌
      </span>
      <h3 className="tk-h3">{title}</h3>
      <p className="max-w-[46ch] text-sm text-[var(--tk-ink-dim)]">{body}</p>
      {action}
    </div>
  );
}
