'use client';

import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * true, sobald der Client gerendert hat (Store aus localStorage hydriert).
 * Verhindert Hydration-Mismatches bei persistierten Daten.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
