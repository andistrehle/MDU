'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_NAME } from '@/lib/app-config';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { activateDemoMode } from '@/lib/store/demo-seed';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError('Anmeldung fehlgeschlagen — bitte prüfe E-Mail und Passwort.');
      return;
    }
    router.push('/');
  };

  return (
    <main className="flex min-h-[80dvh] flex-col justify-center gap-4 p-6">
      <h1 className="text-center text-2xl font-extrabold text-ink">Anmelden</h1>

      {configured ? (
        <Card>
          <form onSubmit={submit} className="space-y-3">
            <Field label="E-Mail" htmlFor="login-email">
              <Input id="login-email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Passwort" htmlFor="login-password">
              <Input id="login-password" type="password" autoComplete="current-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Wird angemeldet …' : 'Anmelden'}
            </Button>
          </form>
          <div className="mt-3 flex justify-between text-sm">
            <Link href="/registrieren" className="font-semibold text-brand-ink hover:underline">
              Konto erstellen
            </Link>
            <Link href="/passwort-vergessen" className="text-mut hover:underline">
              Passwort vergessen?
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="space-y-3 text-center">
          <p className="text-sm text-body">
            {APP_NAME} läuft gerade ohne Server-Konto (kein Supabase konfiguriert).
            Du kannst die App vollständig im Demo-Modus nutzen — alle Daten bleiben in deinem Browser.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              activateDemoMode();
              router.push('/');
            }}
          >
            Demo-Modus starten
          </Button>
          <Link href="/onboarding" className="block text-sm font-semibold text-brand-ink hover:underline">
            Oder direkt lokal loslegen (ohne Beispieldaten)
          </Link>
        </Card>
      )}
    </main>
  );
}
