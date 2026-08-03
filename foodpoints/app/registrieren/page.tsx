'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <main className="flex min-h-[70dvh] flex-col justify-center p-6">
        <Card className="space-y-3 text-center">
          <p className="text-sm text-body">
            Registrierung ist erst mit konfiguriertem Supabase verfügbar.
            Nutze solange den Demo-Modus über die Startseite.
          </p>
          <Link href="/" className="text-sm font-semibold text-brand-ink hover:underline">Zur Startseite</Link>
        </Card>
      </main>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    if (password.length < 8) {
      setError('Das Passwort braucht mindestens 8 Zeichen.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    setBusy(false);
    if (err) {
      setError('Registrierung fehlgeschlagen — bitte versuche es erneut.');
      return;
    }
    setDone(true);
  };

  return (
    <main className="flex min-h-[80dvh] flex-col justify-center gap-4 p-6">
      <h1 className="text-center text-2xl font-extrabold text-ink">Konto erstellen</h1>
      <Card>
        {done ? (
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold text-ink">Fast geschafft!</p>
            <p className="text-sm text-body">
              Wir haben dir eine E-Mail geschickt. Bitte bestätige deine Adresse und melde dich dann an.
            </p>
            <Link href="/login" className="text-sm font-semibold text-brand-ink hover:underline">Zur Anmeldung</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Field label="E-Mail" htmlFor="reg-email">
              <Input id="reg-email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Passwort" htmlFor="reg-password" hint="Mindestens 8 Zeichen.">
              <Input id="reg-password" type="password" autoComplete="new-password" required
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Wird erstellt …' : 'Registrieren'}
            </Button>
            <p className="text-center text-xs text-mut">
              Mit der Registrierung akzeptierst du unsere{' '}
              <Link href="/datenschutz" className="underline">Datenschutzhinweise</Link>.
            </p>
          </form>
        )}
      </Card>
      <Link href="/login" className="text-center text-sm font-semibold text-brand-ink hover:underline">
        Ich habe schon ein Konto
      </Link>
    </main>
  );
}
