'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChartLine, Download, Moon, Sun, MonitorSmartphone } from 'lucide-react';
import { APP_NAME, BUDGET_DISCLAIMER, FORMULA_DISCLAIMER } from '@/lib/app-config';
import { ACTIVE_FORMULA } from '@/lib/points/config';
import { useAppStore, useBudget } from '@/lib/store/app-store';
import { useHydrated } from '@/lib/store/use-hydrated';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase/client';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export default function ProfilePage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const demoMode = useAppStore((s) => s.demoMode);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const setBudgetConfig = useAppStore((s) => s.setBudgetConfig);
  const resetAll = useAppStore((s) => s.resetAll);
  const { dailyPoints, weeklyReserve } = useBudget();
  const [confirmReset, setConfirmReset] = useState(false);

  if (!hydrated) {
    return <main className="p-4"><div className="fp-skeleton h-40 w-full" /></main>;
  }

  const setTheme = (theme: 'system' | 'light' | 'dark') => {
    updateSettings({ theme });
    try {
      if (theme === 'system') {
        localStorage.removeItem('fp-theme');
        delete document.documentElement.dataset.theme;
      } else {
        localStorage.setItem('fp-theme', theme);
        document.documentElement.dataset.theme = theme;
      }
    } catch {
      // localStorage nicht verfügbar (z. B. Privatmodus) — Theme gilt nur für diese Sitzung
    }
  };

  const exportData = () => {
    const state = useAppStore.getState();
    const data = {
      exportedAt: new Date().toISOString(),
      app: APP_NAME,
      profile: state.profile,
      settings: state.settings,
      entries: state.entries,
      customFoods: state.customFoods,
      recipes: state.recipes,
      weights: state.weights,
      water: state.water,
      favorites: state.favoriteFoodIds,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodpoints-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-extrabold text-ink">Profil</h1>

      <Card className="space-y-2">
        <CardTitle>{profile?.firstName ? `${profile.firstName}` : 'Dein Konto'}</CardTitle>
        <p className="text-sm text-body">
          Tagesbudget: <strong>{dailyPoints} Punkte</strong> · Wochenreserve:{' '}
          <strong>{weeklyReserve} Punkte</strong>
        </p>
        {demoMode && (
          <p className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-body">
            Demo-Modus aktiv — alle Daten liegen nur in diesem Browser.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href="/onboarding"><Button size="sm" variant="secondary">Ziele anpassen</Button></Link>
          <Link href="/fortschritt">
            <Button size="sm" variant="outline"><ChartLine size={15} aria-hidden /> Fortschritt</Button>
          </Link>
        </div>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Darstellung</CardTitle>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'light', label: 'Hell', icon: Sun },
            { id: 'dark', label: 'Dunkel', icon: Moon },
            { id: 'system', label: 'System', icon: MonitorSmartphone },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              aria-pressed={settings.theme === id}
              className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-semibold ${
                settings.theme === id
                  ? 'border-brand bg-brand-soft text-brand-ink'
                  : 'border-line bg-card text-body'
              }`}
            >
              <Icon size={18} aria-hidden /> {label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Budget-Regeln</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Wochenreserve (P)" htmlFor="b-reserve">
            <Input
              id="b-reserve" inputMode="numeric" value={settings.budget.weeklyReserve}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value, 10);
                if (Number.isFinite(v) && v >= 0 && v <= 200) setBudgetConfig({ weeklyReserve: v });
              }}
            />
          </Field>
          <Field label="Max. Übertrag/Tag (P)" htmlFor="b-rollover">
            <Input
              id="b-rollover" inputMode="numeric" value={settings.budget.maxRolloverPerDay}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value, 10);
                if (Number.isFinite(v) && v >= 0 && v <= 50) setBudgetConfig({ maxRolloverPerDay: v });
              }}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[var(--fp-brand)]"
            checked={settings.budget.rolloverEnabled}
            onChange={(e) => setBudgetConfig({ rolloverEnabled: e.target.checked })}
          />
          Nicht genutzte Punkte in die Wochenreserve übertragen
        </label>
        <Field
          label="Manuelles Tagesbudget (leer = automatisch)"
          htmlFor="b-manual"
          hint="Überschreibt die berechnete Schätzung."
        >
          <Input
            id="b-manual" inputMode="numeric"
            value={settings.budget.manualDailyPoints ?? ''}
            placeholder="automatisch"
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (raw === '') {
                setBudgetConfig({ manualDailyPoints: null });
              } else {
                const v = Number.parseInt(raw, 10);
                if (Number.isFinite(v) && v >= 10 && v <= 200) setBudgetConfig({ manualDailyPoints: v });
              }
            }}
          />
        </Field>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Fotos & Datenschutz</CardTitle>
        <label className="flex items-start gap-2 text-sm text-body">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-[var(--fp-brand)]"
            checked={settings.keepPhotosAfterAnalysis}
            onChange={(e) => updateSettings({ keepPhotosAfterAnalysis: e.target.checked })}
          />
          <span>
            Essensfotos nach der Analyse speichern
            <span className="block text-xs text-mut">
              Standard: aus — Fotos werden nur für die Analyse verwendet und danach verworfen.
            </span>
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={exportData}>
            <Download size={15} aria-hidden /> Daten exportieren (JSON)
          </Button>
          <Link href="/datenschutz"><Button size="sm" variant="ghost">Datenschutz</Button></Link>
          <Link href="/impressum"><Button size="sm" variant="ghost">Impressum</Button></Link>
        </div>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Konto</CardTitle>
        {isSupabaseConfigured() ? (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await getSupabase()?.auth.signOut();
              router.push('/login');
            }}
          >
            Abmelden
          </Button>
        ) : (
          <p className="text-xs text-mut">
            Kein Server-Konto verbunden (Demo-/Offline-Betrieb). Mit konfiguriertem Supabase
            stehen Registrierung und Geräte-Sync zur Verfügung.
          </p>
        )}
        {!confirmReset ? (
          <Button size="sm" variant="danger" onClick={() => setConfirmReset(true)}>
            Alle lokalen Daten löschen …
          </Button>
        ) : (
          <div className="space-y-2 rounded-xl bg-danger-soft p-3">
            <p className="text-sm font-semibold text-danger">
              Wirklich alle lokalen Daten (Tagebuch, Rezepte, Profil) unwiderruflich löschen?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                  router.push('/');
                }}
              >
                Ja, löschen
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmReset(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-2">
        <CardTitle>Über die Punkteformel</CardTitle>
        <p className="text-xs leading-relaxed text-body">{FORMULA_DISCLAIMER}</p>
        <p className="text-xs text-mut">
          Aktive Formelversion: <code>{ACTIVE_FORMULA.version}</code> · Faktoren: kcal ×{' '}
          {ACTIVE_FORMULA.calorieFactor} + ges. Fett × {ACTIVE_FORMULA.saturatedFatFactor} + Zucker ×{' '}
          {ACTIVE_FORMULA.sugarFactor} − Eiweiß × {ACTIVE_FORMULA.proteinFactor} − Ballaststoffe ×{' '}
          {ACTIVE_FORMULA.fiberFactor}
        </p>
        <p className="text-[11px] leading-relaxed text-mut">{BUDGET_DISCLAIMER}</p>
      </Card>
    </main>
  );
}
