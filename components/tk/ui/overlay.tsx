'use client';

// ============================================================
// Tennis Kail — Overlays und Umschalter
// ============================================================
//
// Eigene, schlanke Umsetzung statt Radix: Fokusfalle, Escape, Klick auf den
// Hintergrund, Scroll-Sperre. Auf dem Telefon fährt das Panel von unten ein
// (Sheet), ab Tablet steht es mittig (Dialog) — dieselbe Komponente, weil
// der Inhalt derselbe ist.
// ============================================================

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    // Fokus in das Panel holen, damit Tastatur und Screenreader dort landen.
    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (first ?? panelRef.current)?.focus();
    }, 30);
    return () => {
      document.body.style.overflow = '';
      window.clearTimeout(t);
      previous?.focus?.();
    };
  }, [open]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
        >
          <button
            aria-label="Schließen"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-[rgba(22,38,29,0.55)] backdrop-blur-[2px]"
            tabIndex={-1}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.99 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cn(
              'relative z-10 flex max-h-[88vh] w-full flex-col overflow-hidden bg-[var(--tk-paper)]',
              'rounded-t-[22px] sm:max-w-[520px] sm:rounded-[22px]',
              'shadow-[0_-10px_60px_-20px_rgba(27,30,26,0.5)]',
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--tk-line-soft)] px-5 py-4">
              <div className="flex flex-col gap-1">
                <h2 id={titleId} className="tk-h3">
                  {title}
                </h2>
                {description ? (
                  <p className="text-sm text-[var(--tk-ink-dim)]">{description}</p>
                ) : null}
              </div>
              <button
                onClick={onClose}
                aria-label="Schließen"
                className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[var(--tk-chalk-2)] text-[var(--tk-ink-soft)]"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer ? (
              <div className="border-t border-[var(--tk-line-soft)] bg-[var(--tk-chalk)] px-5 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Segmentierter Umschalter — als Radiogruppe für die Tastatur. */
export function Segment<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}) {
  return (
    <div className={cn('tk-segment', className)} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
