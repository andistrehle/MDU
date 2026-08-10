'use client';

// ============================================================
// Tennis Kail — Demo-Zustand
// ============================================================
//
// EHRLICH: Es gibt kein Backend. Was hier gebucht wird, liegt im
// localStorage des Browsers und sonst nirgends. Keine E-Mail, keine
// Zahlung, keine Datenbank. Genau so sagt es die Oberfläche auch.
//
// Der Zuschnitt ist trotzdem der einer echten Anwendung: ein Warenkorb,
// eine Buchungsliste, ein Merkzettel. In der Produktivversion tauscht man
// die drei Schreibfunktionen (`addLine`, `confirmCart`, `cancelBooking`)
// gegen Server Actions gegen Supabase — die Oberfläche bleibt gleich.
// ============================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Booking, CartLine } from './types';

const STORAGE_KEY = 'tk-demo-v1';

interface Persisted {
  cart: CartLine[];
  bookings: Booking[];
  watchlist: string[];
  readNotifications: string[];
}

const EMPTY: Persisted = { cart: [], bookings: [], watchlist: [], readNotifications: [] };

interface StoreValue extends Persisted {
  ready: boolean;
  addLine: (line: Omit<CartLine, 'id'>) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;
  confirmCart: (todayIso: string) => Booking[];
  cancelBooking: (id: string) => void;
  toggleWatch: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: (ids: string[]) => void;
  reset: () => void;
  totalCents: number;
}

const StoreContext = createContext<StoreValue | null>(null);

let counter = 0;
/** IDs ohne Zufall und ohne Zeitstempel — sonst weicht der Server ab. */
function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function TkStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [ready, setReady] = useState(false);

  // Erst nach dem ersten Rendern lesen — sonst unterscheidet sich das
  // Server-HTML vom ersten Browser-Rendern (Hydration).
  //
  // Der Linter mahnt setState im Effekt an. Hier ist es die richtige Form:
  // Der localStorage ist ein externes System, das beim Start genau einmal
  // eingelesen wird — den Wert vorher zu kennen ist unmöglich, weil der
  // Server keinen localStorage hat.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        setState({ ...EMPTY, ...parsed });
      }
    } catch {
      // Kaputter Eintrag: leer weitermachen statt die Seite zu verlieren.
    }
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Privater Modus oder voller Speicher — die Demo läuft trotzdem weiter.
    }
  }, [state, ready]);

  const addLine = useCallback((line: Omit<CartLine, 'id'>) => {
    setState((s) => {
      // Doppelte Zeile (gleicher Platz, gleiche Zeit) nicht zweimal aufnehmen.
      const dup = s.cart.some(
        (l) =>
          l.type === line.type &&
          l.date === line.date &&
          l.from === line.from &&
          l.courtId === line.courtId &&
          l.courseId === line.courseId &&
          l.title === line.title,
      );
      if (dup) return s;
      return { ...s, cart: [...s.cart, { ...line, id: nextId('line') }] };
    });
  }, []);

  const removeLine = useCallback((id: string) => {
    setState((s) => ({ ...s, cart: s.cart.filter((l) => l.id !== id) }));
  }, []);

  const clearCart = useCallback(() => setState((s) => ({ ...s, cart: [] })), []);

  const confirmCart = useCallback((todayIso: string) => {
    const created: Booking[] = [];
    setState((s) => {
      const bookings = s.cart.map<Booking>((l) => ({
        id: nextId('bk'),
        type: l.type === 'shop' || l.type === 'gutschein' ? 'kurs' : l.type,
        courtId: l.courtId,
        coachId: l.coachId,
        courseId: l.courseId,
        locationId: l.courtId?.startsWith('n-') ? 'neuperlach' : 'harlaching',
        date: l.date ?? todayIso,
        from: l.from ?? 0,
        to: l.to ?? 0,
        priceCents: l.priceCents,
        status: 'bestaetigt',
        customer: 'Demo-Konto',
        createdAt: `${todayIso}T00:00:00`,
        note: l.subtitle,
      }));
      created.push(...bookings);
      return { ...s, cart: [], bookings: [...s.bookings, ...bookings] };
    });
    return created;
  }, []);

  const cancelBooking = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: 'storniert' } : b)),
    }));
  }, []);

  const toggleWatch = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      watchlist: s.watchlist.includes(id) ? s.watchlist.filter((w) => w !== id) : [...s.watchlist, id],
    }));
  }, []);

  const markRead = useCallback((id: string) => {
    setState((s) =>
      s.readNotifications.includes(id)
        ? s
        : { ...s, readNotifications: [...s.readNotifications, id] },
    );
  }, []);

  const markAllRead = useCallback((ids: string[]) => {
    setState((s) => ({ ...s, readNotifications: [...new Set([...s.readNotifications, ...ids])] }));
  }, []);

  const reset = useCallback(() => {
    setState(EMPTY);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* egal */
    }
  }, []);

  const totalCents = useMemo(() => state.cart.reduce((sum, l) => sum + l.priceCents, 0), [state.cart]);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      ready,
      addLine,
      removeLine,
      clearCart,
      confirmCart,
      cancelBooking,
      toggleWatch,
      markRead,
      markAllRead,
      reset,
      totalCents,
    }),
    [state, ready, addLine, removeLine, clearCart, confirmCart, cancelBooking, toggleWatch, markRead, markAllRead, reset, totalCents],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useTkStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useTkStore muss innerhalb von TkStoreProvider verwendet werden.');
  return ctx;
}
