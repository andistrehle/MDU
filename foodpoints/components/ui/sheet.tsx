'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Bottom-Sheet für mobile Dialoge (Portionswahl, Aktionen).
 * Schließt per Backdrop, X-Button und Escape; blockiert Body-Scroll.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Schließen"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto max-h-[88dvh] w-full max-w-lg overflow-y-auto',
          'rounded-t-3xl border-t border-line bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
          className,
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <button
            aria-label="Schließen"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-mut hover:bg-inset"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
