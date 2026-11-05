'use client';

// Hinweis „gehört zum Team Manager“ (Kasse, Gegneranalyse, Statistiken, …).
// Seit dem Premium-Start (PREMIUM_OEFFENTLICH) mit Weg zum Freischalten statt
// Sackgasse: Kapitän/Co-Captain direkt zur Upgrade-Seite, alle anderen mit dem
// Hinweis, dass der Kapitän das macht.

import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { hatTcRecht } from '@/lib/auth/roles';
import { PREMIUM_OEFFENTLICH, TESTTAGE } from '@/lib/premium';

export function TeamManagerFehlt({ was }: { was: string }) {
  const { user } = useAuth();
  const kapitaen = !!user?.teamId && hatTcRecht(user, user.teamId, 'team_manager');
  return (
    <div role="note" style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--th-bg-card)', border: '1.5px solid rgba(232,184,74,0.75)', fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-body)', lineHeight: 1.55, maxWidth: 560 }}>
      <div style={{ fontWeight: 800, color: 'var(--th-text-strong)', marginBottom: 4 }}>{was} gehört zum Team Manager</div>
      {!PREMIUM_OEFFENTLICH ? 'Für dein Team ist er noch nicht verfügbar.'
        : kapitaen ? <>Schalte ihn für dein ganzes Team frei – {TESTTAGE} Tage gratis testen, dann Saisonpass oder monatlich.{' '}
            <Link href="/mein-team/premium" style={{ color: 'var(--th-accent)', fontWeight: 800, textDecoration: 'none' }}>Team Manager holen</Link></>
        : 'Euer Teamcaptain kann ihn unter Mein Bereich freischalten – mit 14 Tagen gratis zum Testen.'}
    </div>
  );
}
