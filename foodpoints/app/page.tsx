'use client';

import Link from 'next/link';
import { Camera, Barcode, FileScan, Search, PlusCircle, ChefHat, GlassWater, Sparkles } from 'lucide-react';
import { APP_NAME, BUDGET_DISCLAIMER } from '@/lib/app-config';
import { MEAL_SLOTS } from '@/lib/food/types';
import { summarizeDay, summarizeWeek, startOfWeek, toDateKey } from '@/lib/diary/summary';
import { useAppStore, useBudget } from '@/lib/store/app-store';
import { useHydrated } from '@/lib/store/use-hydrated';
import { activateDemoMode } from '@/lib/store/demo-seed';
import { fmt, fmtDate } from '@/lib/utils';
import { PointsRing } from '@/components/points-ring';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const quickActions = [
  { href: '/scannen/foto', label: 'Foto', icon: Camera },
  { href: '/scannen/barcode', label: 'Barcode', icon: Barcode },
  { href: '/scannen/etikett', label: 'Nährwerte', icon: FileScan },
  { href: '/suche', label: 'Suchen', icon: Search },
  { href: '/lebensmittel/neu', label: 'Eigenes', icon: PlusCircle },
  { href: '/rezepte', label: 'Rezept', icon: ChefHat },
];

export default function TodayPage() {
  const hydrated = useHydrated();
  const profile = useAppStore((s) => s.profile);
  const demoMode = useAppStore((s) => s.demoMode);
  const entries = useAppStore((s) => s.entries);
  const water = useAppStore((s) => s.water);
  const addWater = useAppStore((s) => s.addWater);
  const waterGoal = useAppStore((s) => s.settings.waterGoalMl);
  const budgetCfg = useAppStore((s) => s.settings.budget);
  const { dailyPoints } = useBudget();

  if (!hydrated) {
    return (
      <main className="space-y-4 p-4">
        <div className="fp-skeleton h-8 w-48" />
        <div className="fp-skeleton h-56 w-full" />
        <div className="fp-skeleton h-32 w-full" />
      </main>
    );
  }

  if (!profile && !demoMode) {
    return <WelcomeScreen />;
  }

  const today = toDateKey(new Date());
  const day = summarizeDay(today, entries);
  const week = summarizeWeek(startOfWeek(new Date()), entries, dailyPoints, budgetCfg);
  const waterToday = water[today] ?? 0;
  const n = day.totalNutrients;

  return (
    <main className="space-y-4 p-4">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-ink">
            {profile?.firstName ? `Hallo, ${profile.firstName}!` : APP_NAME}
          </h1>
          <p className="text-sm text-mut">{fmtDate(today)}</p>
        </div>
        {demoMode && (
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent">
            Demo
          </span>
        )}
      </header>

      <Card className="flex flex-col items-center gap-3 py-6">
        <PointsRing used={day.totalPoints} budget={dailyPoints} />
        <div className="flex items-center gap-2 rounded-full bg-inset px-3 py-1.5 text-xs font-semibold text-body">
          <Sparkles size={14} className="text-accent" aria-hidden />
          Wochenreserve: {week.reserve.reserveRemaining} Punkte
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-3">Schnell erfassen</CardTitle>
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl bg-card2 py-3 text-body hover:bg-inset"
            >
              <Icon size={22} className="text-brand" aria-hidden />
              <span className="text-xs font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle className="mb-3">Nährwerte heute</CardTitle>
        <div className="grid grid-cols-3 gap-y-3 text-center text-xs text-mut">
          <div><p className="text-base font-extrabold text-ink">{fmt(n.calories, 0)}</p>kcal</div>
          <div><p className="text-base font-extrabold text-ink">{fmt(n.protein)} g</p>Eiweiß</div>
          <div><p className="text-base font-extrabold text-ink">{fmt(n.carbs)} g</p>Kohlenhydrate</div>
          <div><p className="text-base font-extrabold text-ink">{fmt(n.fat)} g</p>Fett</div>
          <div><p className="text-base font-extrabold text-ink">{fmt(n.fiber)} g</p>Ballaststoffe</div>
          <div><p className="text-base font-extrabold text-ink">{fmt(n.sugar)} g</p>Zucker</div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Wasser</CardTitle>
          <span className="text-xs text-mut">{fmt(waterToday / 1000, 1)} / {fmt(waterGoal / 1000, 1)} l</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-ring-track">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${Math.min(100, (waterToday / waterGoal) * 100)}%` }}
          />
        </div>
        <div className="mt-3 flex gap-2">
          {[200, 300, 500].map((ml) => (
            <Button key={ml} size="sm" variant="secondary" onClick={() => addWater(today, ml)}>
              <GlassWater size={14} aria-hidden /> +{ml} ml
            </Button>
          ))}
        </div>
      </Card>

      <section className="space-y-3" aria-label="Mahlzeiten">
        {MEAL_SLOTS.map((slot) => {
          const mealData = day.byMeal[slot.id];
          return (
            <Card key={slot.id}>
              <div className="flex items-center justify-between">
                <CardTitle>
                  <span aria-hidden className="mr-1.5">{slot.emoji}</span>
                  {slot.label}
                </CardTitle>
                <span className="rounded-full bg-inset px-2 py-0.5 text-xs font-bold text-body">
                  {mealData.points} P
                </span>
              </div>
              {mealData.entries.length === 0 ? (
                <p className="mt-2 text-sm text-mut">Noch nichts eingetragen.</p>
              ) : (
                <ul className="mt-2 divide-y divide-line-soft">
                  {mealData.entries.map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="min-w-0 truncate text-body">{e.name}</span>
                      <span className="ml-2 shrink-0 text-xs text-mut">
                        {fmt(e.grams, 0)} g · {e.points} P
                      </span>
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
      </section>

      <p className="px-2 pb-2 text-center text-[11px] leading-relaxed text-mut">{BUDGET_DISCLAIMER}</p>
    </main>
  );
}

function WelcomeScreen() {
  return (
    <main className="flex min-h-[80dvh] flex-col justify-center gap-6 p-6">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand text-3xl">
          <span aria-hidden>🥗</span>
        </div>
        <h1 className="text-2xl font-extrabold text-ink">Willkommen bei {APP_NAME}</h1>
        <p className="text-sm leading-relaxed text-body">
          Verfolge Essen, Punkte und Fortschritt — mit Fotoerkennung, Barcode-Scanner
          und einem transparenten, offen dokumentierten Punktesystem.
        </p>
      </div>
      <div className="space-y-3">
        <Link href="/onboarding" className="block">
          <Button size="lg" className="w-full">Los geht’s — Ziele einrichten</Button>
        </Link>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          onClick={() => activateDemoMode()}
        >
          Demo ohne Registrierung ansehen
        </Button>
        <Link href="/login" className="block text-center text-sm font-semibold text-brand-ink hover:underline">
          Ich habe schon ein Konto
        </Link>
      </div>
      <p className="text-center text-[11px] leading-relaxed text-mut">{BUDGET_DISCLAIMER}</p>
    </main>
  );
}
