'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import type { DiaryEntry, MealSlot } from '@/lib/food/types';
import { MEAL_SLOTS } from '@/lib/food/types';
import { summarizeDay, toDateKey } from '@/lib/diary/summary';
import { useAppStore, useBudget } from '@/lib/store/app-store';
import { useHydrated } from '@/lib/store/use-hydrated';
import { fmt, fmtDate } from '@/lib/utils';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Field, Input, Select } from '@/components/ui/input';

function shiftDate(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export default function DiaryPage() {
  const hydrated = useHydrated();
  const entries = useAppStore((s) => s.entries);
  const copyMeal = useAppStore((s) => s.copyMeal);
  const { dailyPoints } = useBudget();
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [editing, setEditing] = useState<DiaryEntry | null>(null);

  if (!hydrated) {
    return (
      <main className="space-y-4 p-4">
        <div className="fp-skeleton h-10 w-full" />
        <div className="fp-skeleton h-40 w-full" />
      </main>
    );
  }

  const day = summarizeDay(date, entries);
  const today = toDateKey(new Date());

  return (
    <main className="space-y-4 p-4">
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Vorheriger Tag" onClick={() => setDate(shiftDate(date, -1))}>
          <ChevronLeft size={22} />
        </Button>
        <div className="text-center">
          <h1 className="text-base font-extrabold text-ink">{fmtDate(date)}</h1>
          <button
            className="text-xs font-semibold text-brand-ink hover:underline"
            onClick={() => setDate(today)}
            disabled={date === today}
          >
            {date === today ? 'Heute' : 'Zu heute springen'}
          </button>
        </div>
        <Button variant="ghost" size="icon" aria-label="Nächster Tag" onClick={() => setDate(shiftDate(date, 1))}>
          <ChevronRight size={22} />
        </Button>
      </header>

      <Card className="flex items-center justify-between">
        <p className="text-sm text-body">Tagespunkte</p>
        <p className={`text-lg font-extrabold ${day.totalPoints > dailyPoints ? 'text-danger' : 'text-brand-ink'}`}>
          {day.totalPoints} / {dailyPoints}
        </p>
      </Card>

      {MEAL_SLOTS.map((slot) => {
        const mealData = day.byMeal[slot.id];
        return (
          <Card key={slot.id}>
            <div className="flex items-center justify-between">
              <CardTitle>
                <span aria-hidden className="mr-1.5">{slot.emoji}</span>
                {slot.label}
              </CardTitle>
              <div className="flex items-center gap-2">
                {mealData.entries.length > 0 && (
                  <button
                    aria-label={`${slot.label} auf morgen kopieren`}
                    title="Komplette Mahlzeit auf den nächsten Tag kopieren"
                    onClick={() => copyMeal(date, slot.id, shiftDate(date, 1))}
                    className="p-1 text-mut hover:text-body"
                  >
                    <Copy size={16} />
                  </button>
                )}
                <span className="rounded-full bg-inset px-2 py-0.5 text-xs font-bold text-body">
                  {mealData.points} P
                </span>
              </div>
            </div>

            {mealData.entries.length === 0 ? (
              <p className="mt-2 text-sm text-mut">Keine Einträge.</p>
            ) : (
              <ul className="mt-2 divide-y divide-line-soft">
                {mealData.entries.map((e) => (
                  <li key={e.id}>
                    <button
                      className="flex w-full items-center justify-between py-2.5 text-left"
                      onClick={() => setEditing(e)}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{e.name}</p>
                        <p className="text-xs text-mut">
                          {fmt(e.grams, 0)} g · {fmt(e.nutrients.calories, 0)} kcal
                        </p>
                      </div>
                      <span className="ml-2 shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-extrabold text-brand-ink">
                        {e.points} P
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/suche?meal=${slot.id}`}
              className="mt-2 inline-block text-sm font-semibold text-brand-ink hover:underline"
            >
              + Hinzufügen
            </Link>
          </Card>
        );
      })}

      <EditEntrySheet entry={editing} onClose={() => setEditing(null)} />
    </main>
  );
}

function EditEntrySheet({ entry, onClose }: { entry: DiaryEntry | null; onClose: () => void }) {
  const updateEntryGrams = useAppStore((s) => s.updateEntryGrams);
  const moveEntry = useAppStore((s) => s.moveEntry);
  const copyEntry = useAppStore((s) => s.copyEntry);
  const deleteEntry = useAppStore((s) => s.deleteEntry);
  const [grams, setGrams] = useState<string>('');

  if (!entry) return null;
  const effGrams = grams === '' ? entry.grams : Number.parseFloat(grams.replace(',', '.'));

  return (
    <Sheet open onClose={onClose} title={entry.name}>
      <div className="space-y-4">
        <Field label="Menge (g)" htmlFor="edit-grams">
          <Input
            id="edit-grams"
            inputMode="decimal"
            value={grams === '' ? String(entry.grams) : grams}
            onChange={(e) => setGrams(e.target.value)}
          />
        </Field>

        <Field label="Mahlzeit" htmlFor="edit-meal">
          <Select
            id="edit-meal"
            value={entry.meal}
            onChange={(e) => moveEntry(entry.id, e.target.value as MealSlot)}
          >
            {MEAL_SLOTS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              if (Number.isFinite(effGrams) && effGrams > 0) {
                updateEntryGrams(entry.id, effGrams);
              }
              onClose();
            }}
          >
            Speichern
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              copyEntry(entry.id, shiftDate(entry.date, 1));
              onClose();
            }}
          >
            Auf morgen kopieren
          </Button>
        </div>
        <Button
          variant="danger"
          className="w-full"
          onClick={() => {
            deleteEntry(entry.id);
            onClose();
          }}
        >
          Eintrag löschen
        </Button>
        <p className="text-center text-[11px] text-mut">
          Formelversion beim Erfassen: {entry.formulaVersion}
        </p>
      </div>
    </Sheet>
  );
}
