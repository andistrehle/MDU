// ============================================================
// Supabase Client (Browser) — Sprint 5.2
// ============================================================
//
// Zentraler Client für Auth + Datenbankzugriff im Browser.
// Verwendet ausschließlich den öffentlichen anon key — der
// Service-Role-Key gehört NIEMALS ins Frontend.
//
// Konfiguration über .env.local (siehe .env.example):
//   NEXT_PUBLIC_SUPABASE_URL=...
//   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
//
// Fehlen die Variablen, crasht die App nicht: `supabase` ist
// dann null und `isSupabaseConfigured` false — der AuthContext
// zeigt in dem Fall verständliche Fehlermeldungen an.
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

/** Browser-Supabase-Client — null, wenn die ENV-Variablen fehlen. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        // Session-Persistenz übernimmt Supabase (verschlüsselte Tokens,
        // automatischer Refresh). Keine Passwörter, keine eigenen Tokens.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  // Einmalige, klare Warnung statt kryptischem Crash.
  console.warn(
    '[MDU Auth] Supabase ist nicht konfiguriert. ' +
    'Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local setzen ' +
    '(siehe .env.example). Login/Registrierung sind bis dahin deaktiviert.',
  );
}
