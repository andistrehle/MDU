// ============================================================
// Supabase Admin-Client (NUR serverseitig) — Sprint Benachrichtigungen
// ============================================================
//
// ⚠️ Verwendet den service_role Key und umgeht RLS. Dieser Client darf
// AUSSCHLIESSLICH in Server-Code (Route Handler / Server Actions) genutzt
// werden — NIEMALS im Browser. Der Key ist eine server-only ENV
// (KEIN NEXT_PUBLIC_-Präfix), siehe .env.example.
//
// Wird nur für System-Schreibvorgänge gebraucht (z. B. email_logs).
// Fehlt die Konfiguration, ist der Client null und der Aufrufer überspringt
// das Logging sauber (keine Fake-Erfolge).
// ============================================================

import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin: SupabaseClient | null =
  url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;
