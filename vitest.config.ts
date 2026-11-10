// ============================================================
// Vitest — nur reine Rechenmodule (Betreiber, 10.11.2026)
// ============================================================
// Tests liegen als *.test.ts neben den Modulen in lib/. Keine UI-, keine
// End-to-End-Tests. KEIN Test darf Datenbank, Netz oder externe Dienste
// anfassen: lokal und live hängen an derselben Produktionsdatenbank.
//
// Supabase-Variablen werden für den Testlauf geleert. Grund: Manche reinen
// Module importieren lib/supabase/match-reports.ts → lib/supabase/client.ts,
// und der legt beim Laden einen Supabase-Client an, sobald URL und Schlüssel
// gesetzt sind (in .env.local bzw. in Cloud-Sessions als Umgebung). Ohne sie
// ist `supabase` null und es kann nichts verbinden.
// ============================================================

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
    },
  },
});
