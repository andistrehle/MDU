'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { Button } from '@/components/ui/button';

/** Zeigt nach dem Löschen eines Eintrags 8 s lang „Rückgängig“ an. */
export function UndoToast() {
  const lastDeleted = useAppStore((s) => s.lastDeleted);
  const undoDelete = useAppStore((s) => s.undoDelete);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastDeleted) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), Math.max(0, lastDeleted.expiresAt - Date.now()));
    return () => clearTimeout(t);
  }, [lastDeleted]);

  if (!visible || !lastDeleted) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-24 z-50 mx-auto flex w-fit max-w-[90vw] items-center gap-3 rounded-2xl border border-line bg-card px-4 py-2.5 shadow-xl"
    >
      <span className="truncate text-sm text-body">„{lastDeleted.entry.name}“ gelöscht</span>
      <Button size="sm" variant="secondary" onClick={undoDelete}>
        Rückgängig
      </Button>
    </div>
  );
}
