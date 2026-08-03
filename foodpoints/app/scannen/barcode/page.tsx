'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import type { Food } from '@/lib/food/types';
import { useAppStore } from '@/lib/store/app-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { AddFoodSheet } from '@/components/add-food-sheet';

type LookupState =
  | { phase: 'scan' }
  | { phase: 'loading'; code: string }
  | { phase: 'found'; code: string; food: Food }
  | { phase: 'not-found'; code: string }
  | { phase: 'error'; code: string; message: string };

export default function BarcodeScanPage() {
  const customFoods = useAppStore((s) => s.customFoods);
  const [state, setState] = useState<LookupState>({ phase: 'scan' });
  const [sheetOpen, setSheetOpen] = useState(false);

  const lookup = useCallback(
    async (code: string) => {
      // Zuerst eigene Lebensmittel mit verknüpftem Barcode
      const own = customFoods.find((f) => f.barcode === code);
      if (own) {
        setState({ phase: 'found', code, food: own });
        setSheetOpen(true);
        return;
      }
      setState({ phase: 'loading', code });
      try {
        const res = await fetch(`/api/barcode/${code}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Abfrage fehlgeschlagen.');
        if (data.food) {
          setState({ phase: 'found', code, food: data.food as Food });
          setSheetOpen(true);
        } else {
          setState({ phase: 'not-found', code });
        }
      } catch (err) {
        setState({
          phase: 'error',
          code,
          message: err instanceof Error ? err.message : 'Abfrage fehlgeschlagen.',
        });
      }
    },
    [customFoods],
  );

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-extrabold text-ink">Barcode scannen</h1>

      {state.phase === 'scan' && <BarcodeScanner onDetected={lookup} />}

      {state.phase === 'loading' && (
        <Card className="space-y-2">
          <p className="text-sm font-semibold text-body">Barcode {state.code} wird gesucht …</p>
          <div className="fp-skeleton h-4 w-2/3" />
        </Card>
      )}

      {state.phase === 'found' && !sheetOpen && (
        <Card className="space-y-2">
          <p className="text-sm font-bold text-ink">{state.food.name}</p>
          <Button className="w-full" onClick={() => setSheetOpen(true)}>
            Portion wählen & eintragen
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setState({ phase: 'scan' })}>
            Weiter scannen
          </Button>
        </Card>
      )}

      {state.phase === 'not-found' && (
        <Card className="space-y-3">
          <p className="text-sm font-semibold text-ink">
            Kein Produkt zum Barcode {state.code} gefunden.
          </p>
          <p className="text-xs text-mut">
            Du kannst die Nährwerttabelle fotografieren oder das Produkt manuell anlegen —
            der Barcode wird dabei verknüpft.
          </p>
          <div className="grid gap-2">
            <Link href={`/scannen/etikett?barcode=${state.code}`} className="block">
              <Button className="w-full">Nährwerttabelle fotografieren</Button>
            </Link>
            <Link href={`/lebensmittel/neu?barcode=${state.code}`} className="block">
              <Button variant="secondary" className="w-full">Manuell anlegen</Button>
            </Link>
            <Button variant="outline" onClick={() => setState({ phase: 'scan' })}>
              Erneut scannen
            </Button>
          </div>
        </Card>
      )}

      {state.phase === 'error' && (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-danger">{state.message}</p>
          <div className="grid gap-2">
            <Button variant="outline" onClick={() => lookup(state.code)}>Erneut versuchen</Button>
            <Link href={`/lebensmittel/neu?barcode=${state.code}`} className="block">
              <Button variant="secondary" className="w-full">Produkt manuell anlegen</Button>
            </Link>
          </div>
        </Card>
      )}

      <AddFoodSheet
        food={state.phase === 'found' ? state.food : null}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </main>
  );
}
