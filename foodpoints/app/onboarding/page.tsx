'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BUDGET_DISCLAIMER, FORMULA_DISCLAIMER } from '@/lib/app-config';
import {
  ACTIVITY_LEVELS,
  computeBudget,
  type ActivityLevel,
  type Gender,
  type PaceKgPerWeek,
} from '@/lib/budget/engine';
import { useAppStore } from '@/lib/store/app-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';

const PACES: { value: PaceKgPerWeek; label: string }[] = [
  { value: -1, label: 'Schneller abnehmen (−1 kg/Woche)' },
  { value: -0.75, label: 'Zügig abnehmen (−0,75 kg/Woche)' },
  { value: -0.5, label: 'Moderat abnehmen (−0,5 kg/Woche)' },
  { value: -0.25, label: 'Langsam abnehmen (−0,25 kg/Woche)' },
  { value: 0, label: 'Gewicht halten' },
  { value: 0.25, label: 'Zunehmen (+0,25 kg/Woche)' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useAppStore((s) => s.setProfile);
  const budgetCfg = useAppStore((s) => s.settings.budget);

  const [firstName, setFirstName] = useState('');
  const [birthYear, setBirthYear] = useState('1990');
  const [gender, setGender] = useState<Gender>('unspecified');
  const [heightCm, setHeightCm] = useState('170');
  const [weightKg, setWeightKg] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');
  const [pace, setPace] = useState<PaceKgPerWeek>(-0.5);
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [allergies, setAllergies] = useState('');
  const [dietStyle, setDietStyle] = useState('');

  const num = (s: string) => Number.parseFloat(s.replace(',', '.'));
  /** lb → kg für die Berechnung */
  const toKg = (v: number) => (unit === 'lb' ? v * 0.45359237 : v);

  const inputsValid =
    Number.isFinite(num(birthYear)) && num(birthYear) > 1900 &&
    Number.isFinite(num(heightCm)) && num(heightCm) > 100 &&
    Number.isFinite(num(weightKg)) && toKg(num(weightKg)) > 30 &&
    Number.isFinite(num(targetWeightKg)) && toKg(num(targetWeightKg)) > 30;

  const preview = useMemo(() => {
    if (!inputsValid) return null;
    return computeBudget(
      {
        birthYear: num(birthYear),
        gender,
        heightCm: num(heightCm),
        weightKg: toKg(num(weightKg)),
        targetWeightKg: toKg(num(targetWeightKg)),
        activityLevel,
        paceKgPerWeek: pace,
      },
      budgetCfg,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthYear, gender, heightCm, weightKg, targetWeightKg, activityLevel, pace, unit, budgetCfg, inputsValid]);

  const submit = () => {
    if (!inputsValid) return;
    setProfile({
      firstName: firstName.trim(),
      birthYear: num(birthYear),
      gender,
      heightCm: num(heightCm),
      weightKg: toKg(num(weightKg)),
      targetWeightKg: toKg(num(targetWeightKg)),
      activityLevel,
      paceKgPerWeek: pace,
      unit,
      allergies: allergies.trim(),
      dietStyle: dietStyle.trim(),
      onboardingComplete: true,
    });
    const store = useAppStore.getState();
    store.addWeight(toKg(num(weightKg)), new Date().toISOString().slice(0, 10));
    router.push('/');
  };

  return (
    <main className="space-y-4 p-4">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold text-ink">Deine Ziele</h1>
        <p className="text-sm text-mut">
          Aus deinen Angaben schätzen wir ein Kalorienziel und dein Punktebudget.
        </p>
      </header>

      <Card className="space-y-3">
        <Field label="Vorname" htmlFor="ob-name">
          <Input id="ob-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Geburtsjahr *" htmlFor="ob-year">
            <Input id="ob-year" inputMode="numeric" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} />
          </Field>
          <Field label="Geschlecht (optional)" htmlFor="ob-gender">
            <Select id="ob-gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
              <option value="unspecified">Keine Angabe</option>
              <option value="female">Weiblich</option>
              <option value="male">Männlich</option>
            </Select>
          </Field>
          <Field label="Größe (cm) *" htmlFor="ob-height">
            <Input id="ob-height" inputMode="decimal" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </Field>
          <Field label="Einheit" htmlFor="ob-unit">
            <Select id="ob-unit" value={unit} onChange={(e) => setUnit(e.target.value as 'kg' | 'lb')}>
              <option value="kg">Kilogramm</option>
              <option value="lb">Pfund (lb)</option>
            </Select>
          </Field>
          <Field label={`Gewicht (${unit}) *`} htmlFor="ob-weight">
            <Input id="ob-weight" inputMode="decimal" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </Field>
          <Field label={`Zielgewicht (${unit}) *`} htmlFor="ob-target">
            <Input id="ob-target" inputMode="decimal" value={targetWeightKg} onChange={(e) => setTargetWeightKg(e.target.value)} />
          </Field>
        </div>
        <Field label="Aktivitätslevel" htmlFor="ob-activity">
          <Select id="ob-activity" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}>
            {ACTIVITY_LEVELS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </Select>
        </Field>
        <Field label="Gewünschtes Tempo" htmlFor="ob-pace">
          <Select id="ob-pace" value={String(pace)} onChange={(e) => setPace(Number.parseFloat(e.target.value) as PaceKgPerWeek)}>
            {PACES.map((p) => <option key={p.value} value={String(p.value)}>{p.label}</option>)}
          </Select>
        </Field>
        <Field label="Allergien / Unverträglichkeiten (optional)" htmlFor="ob-allergies">
          <Input id="ob-allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="z. B. Laktose, Nüsse" />
        </Field>
        <Field label="Ernährungsform (optional)" htmlFor="ob-diet">
          <Input id="ob-diet" value={dietStyle} onChange={(e) => setDietStyle(e.target.value)} placeholder="z. B. vegetarisch" />
        </Field>
      </Card>

      {preview && (
        <Card className="space-y-2">
          <h2 className="text-sm font-bold text-ink">Deine Schätzung</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-brand-soft py-3">
              <p className="text-xl font-extrabold text-brand-ink">{preview.dailyPoints}</p>
              <p className="text-[11px] text-brand-ink/80">Punkte/Tag</p>
            </div>
            <div className="rounded-xl bg-inset py-3">
              <p className="text-xl font-extrabold text-ink">{preview.weeklyReserve}</p>
              <p className="text-[11px] text-mut">Wochenreserve</p>
            </div>
            <div className="rounded-xl bg-inset py-3">
              <p className="text-xl font-extrabold text-ink">{preview.targetCalories}</p>
              <p className="text-[11px] text-mut">kcal-Ziel/Tag</p>
            </div>
          </div>
          {preview.floorApplied && (
            <p className="text-xs text-body">
              Hinweis: Dein Ziel wurde auf eine sichere Kalorien-Untergrenze angehoben.
            </p>
          )}
          <p className="text-[11px] leading-relaxed text-mut">{BUDGET_DISCLAIMER}</p>
          <p className="text-[11px] leading-relaxed text-mut">{FORMULA_DISCLAIMER}</p>
        </Card>
      )}

      <Button size="lg" className="w-full" disabled={!inputsValid} onClick={submit}>
        Loslegen
      </Button>
    </main>
  );
}
