'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <main className="flex min-h-[70dvh] flex-col justify-center p-6">
        <Card className="text-center text-sm text-body">
          Passwort-Zurücksetzen ist erst mit konfiguriertem Supabase verfügbar.
        </Card>
      </main>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setBusy(false);
    if (err) {
      setError('Das hat nicht geklappt — bitte prüfe die E-Mail-Adresse.');
      return;
    }
    setDone(true);
  };

  return (
    <main className="flex min-h-[80dvh] flex-col justify-center gap-4 p-6">
      <h1 className="text-center text-2xl font-extrabold text-ink">Passwort zurücksetzen</h1>
      <Card>
        {done ? (
          <p className="text-center text-sm text-body">
            Wenn ein Konto zu dieser Adresse existiert, haben wir dir einen Link zum
            Zurücksetzen geschickt.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <Field label="E-Mail" htmlFor="fp-email">
              <Input id="fp-email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? 'Wird gesendet …' : 'Link anfordern'}
            </Button>
          </form>
        )}
      </Card>
      <Link href="/login" className="text-center text-sm font-semibold text-brand-ink hover:underline">
        Zurück zur Anmeldung
      </Link>
    </main>
  );
}
