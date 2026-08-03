'use client';

import { useMemo, useState } from 'react';
import { summarizeDay, summarizeWeek, startOfWeek, toDateKey } from '@/lib/diary/summary';
import { useAppStore, useBudget } from '@/lib/store/app-store';
import { useHydrated } from '@/lib/store/use-hydrated';
import { fmt, fmtDateShort } from '@/lib/utils';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export default function ProgressPage() {
  const hydrated = useHydrated();
  const weights = useAppStore((s) => s.weights);
  const entries = useAppStore((s) => s.entries);
  const addWeight = useAppStore((s) => s.addWeight);
  const budgetCfg = useAppStore((s) => s.settings.budget);
  const { dailyPoints } = useBudget();
  const [newWeight, setNewWeight] = useState('');

  const week = useMemo(
    () => summarizeWeek(startOfWeek(new Date()), entries, dailyPoints, budgetCfg),
    [entries, dailyPoints, budgetCfg],
  );

  const last14 = useMemo(() => {
    const days: { date: string; points: number; calories: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      const s = summarizeDay(key, entries);
      days.push({ date: key, points: s.totalPoints, calories: s.totalNutrients.calories });
    }
    return days;
  }, [entries]);

  const trackedDays = last14.filter((d) => d.points > 0 || d.calories > 0);
  const avgPoints = trackedDays.length
    ? trackedDays.reduce((s, d) => s + d.points, 0) / trackedDays.length
    : 0;
  const avgCalories = trackedDays.length
    ? trackedDays.reduce((s, d) => s + d.calories, 0) / trackedDays.length
    : 0;

  if (!hydrated) {
    return <main className="p-4"><div className="fp-skeleton h-40 w-full" /></main>;
  }

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-extrabold text-ink">Fortschritt</h1>

      <Card>
        <CardTitle className="mb-2">Gewichtsverlauf</CardTitle>
        {weights.length < 2 ? (
          <p className="text-sm text-mut">
            Trage regelmäßig dein Gewicht ein, um hier deinen Verlauf zu sehen.
          </p>
        ) : (
          <WeightChart data={weights.map((w) => ({ date: w.date, value: w.weightKg }))} />
        )}
        <form
          className="mt-3 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const v = Number.parseFloat(newWeight.replace(',', '.'));
            if (Number.isFinite(v) && v > 20 && v < 500) {
              addWeight(v, toDateKey(new Date()));
              setNewWeight('');
            }
          }}
        >
          <div className="flex-1">
            <Field label="Heutiges Gewicht (kg)" htmlFor="w-new">
              <Input id="w-new" inputMode="decimal" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} />
            </Field>
          </div>
          <Button type="submit" disabled={!newWeight.trim()}>Eintragen</Button>
        </form>
      </Card>

      <Card>
        <CardTitle className="mb-3">Diese Woche</CardTitle>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-brand-soft py-3">
            <p className="text-xl font-extrabold text-brand-ink">{week.daysWithinBudget}</p>
            <p className="text-[11px] text-brand-ink/80">Tage im Budget</p>
          </div>
          <div className="rounded-xl bg-inset py-3">
            <p className="text-xl font-extrabold text-ink">{week.reserve.reserveRemaining}</p>
            <p className="text-[11px] text-mut">Reserve übrig</p>
          </div>
          <div className="rounded-xl bg-inset py-3">
            <p className="text-xl font-extrabold text-ink">{week.totalPoints}</p>
            <p className="text-[11px] text-mut">Punkte gesamt</p>
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between gap-1" aria-label="Punkte pro Wochentag">
          {week.days.map((d) => {
            const max = Math.max(dailyPoints * 1.4, ...week.days.map((x) => x.points), 1);
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-20 w-full items-end justify-center">
                  <div
                    className={`w-3/5 rounded-t-md ${d.points > dailyPoints ? 'bg-danger' : 'bg-brand'}`}
                    style={{ height: `${Math.max(4, (d.points / max) * 100)}%` }}
                    title={`${d.points} Punkte`}
                  />
                </div>
                <span className="text-[10px] text-mut">{fmtDateShort(d.date)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-2">Letzte 14 Tage</CardTitle>
        {trackedDays.length === 0 ? (
          <p className="text-sm text-mut">Noch keine erfassten Tage.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-inset py-3">
              <p className="text-xl font-extrabold text-ink">{fmt(avgPoints, 1)}</p>
              <p className="text-[11px] text-mut">Ø Punkte/Tag</p>
            </div>
            <div className="rounded-xl bg-inset py-3">
              <p className="text-xl font-extrabold text-ink">{fmt(avgCalories, 0)}</p>
              <p className="text-[11px] text-mut">Ø kcal/Tag</p>
            </div>
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-mut">
          Dranbleiben zählt mehr als ein einzelner Tag — kleine, stetige Schritte
          bringen dich verlässlich Richtung Ziel.
        </p>
      </Card>
    </main>
  );
}

/** Einfacher SVG-Linienchart für den Gewichtsverlauf. */
function WeightChart({ data }: { data: { date: string; value: number }[] }) {
  const w = 320;
  const h = 120;
  const pad = 8;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.5, max - min);

  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (w - 2 * pad);
    const y = pad + (1 - (d.value - min) / range) * (h - 2 * pad);
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        role="img"
        aria-label={`Gewichtsverlauf von ${fmt(data[0].value)} bis ${fmt(data[data.length - 1].value)} kg`}
      >
        <path d={path} fill="none" stroke="var(--fp-brand)" strokeWidth="2.5" strokeLinecap="round" />
        {points.map((p) => (
          <circle key={p.date} cx={p.x} cy={p.y} r="3" fill="var(--fp-brand)" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-mut">
        <span>{fmtDateShort(data[0].date)} · {fmt(data[0].value)} kg</span>
        <span>{fmtDateShort(data[data.length - 1].date)} · {fmt(data[data.length - 1].value)} kg</span>
      </div>
    </div>
  );
}
