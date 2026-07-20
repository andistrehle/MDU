'use client';

// ============================================================
// MDU Auth — Session-Context (Sprint 5.2: echte Supabase-Auth)
// ============================================================
//
// Standard: echte Supabase-Authentifizierung.
//   • Login        → supabase.auth.signInWithPassword
//   • Registrierung→ supabase.auth.signUp (+ profiles via DB-Trigger)
//   • Reset        → supabase.auth.resetPasswordForEmail
//   • Session      → supabase.auth.getSession + onAuthStateChange
//   • Rolle        → aus public.profiles geladen (siehe supabase/schema.sql)
//
// Dev-Mock: NUR aktiv, wenn explizit NEXT_PUBLIC_USE_AUTH_MOCK=true
// gesetzt ist (lokale Entwicklung ohne Supabase). Der Mock leitet
// die Rolle aus dem E-Mail-Präfix ab und schützt nichts.
//
// Sicherheit:
//   • Es werden keine Passwörter gespeichert.
//   • Session-Persistenz übernimmt Supabase (anon key only).
//   • Rollen werden serverseitig durch RLS abgesichert — das
//     Frontend blendet nur UI aus, es ist KEINE Sicherheitsgrenze.
// ============================================================

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getRegistrationMatchSuggestion } from './player-match';
import type { UserProfile, UserRole } from './roles';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_AUTH_MOCK === 'true';
const MOCK_SESSION_KEY = 'mdu-auth-session';

const NOT_CONFIGURED_ERROR =
  'Anmeldung ist derzeit nicht verfügbar (Auth-Backend nicht konfiguriert).';

interface SignUpResult {
  error: string | null;
  /** True, wenn Supabase eine E-Mail-Bestätigung verlangt (keine Session). */
  needsEmailConfirmation?: boolean;
}

export interface SignUpParams {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  /** Registrierungs-Wunsch (kein Rechtebeweis). */
  intent: 'player' | 'team_captain';
  /** Freitext-Hinweis (Team/Lokal/Liga) bei nicht erkanntem Spieler; wird in
   *  den User-Metadaten abgelegt und im Admin sichtbar gemacht. */
  comment?: string;
}

interface AuthContextValue {
  /** Eingeloggter Benutzer oder null (Gast). */
  user: UserProfile | null;
  /** True bis die Session beim ersten Render geprüft wurde. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (params: SignUpParams) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  /** Neues Passwort setzen (Reset-Flow, Seite /passwort-zuruecksetzen). */
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Fehlertexte (Supabase → Deutsch) ──────────────────────────

function germanAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-Mail oder Passwort ist falsch.';
  if (m.includes('email not confirmed'))       return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  if (m.includes('user already registered'))   return 'Für diese E-Mail existiert bereits ein Konto.';
  if (m.includes('password should be at least')) return 'Das Passwort ist zu kurz.';
  if (m.includes('rate limit') || m.includes('too many requests')) return 'Zu viele Versuche — bitte kurz warten.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Verbindung fehlgeschlagen — bitte später erneut versuchen.';
  return 'Es ist ein Fehler aufgetreten. Bitte erneut versuchen.';
}

// ── Profil laden / anlegen ────────────────────────────────────

interface ProfileRow {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  player_id: string | null;
  team_id: string | null;
  first_name?: string | null;
  last_name?: string | null;
  registration_intent?: string | null;
  matched_player_id?: string | null;
  matched_team_id?: string | null;
  match_confidence?: string | null;
  match_status?: string | null;
  created_at: string;
  updated_at: string;
}

function toUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    playerId: row.player_id ?? undefined,
    teamId: row.team_id ?? undefined,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    registrationIntent: row.registration_intent ?? undefined,
    matchedPlayerId: row.matched_player_id ?? undefined,
    matchedTeamId: row.matched_team_id ?? undefined,
    matchConfidence: row.match_confidence ?? undefined,
    matchStatus: row.match_status ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Lädt das Profil zu einer auth.users-Id. Fehlt die Zeile (Bestands-
 * konto ohne Trigger), wird sie mit Rolle 'player' angelegt —
 * die RLS-Policy "profiles_insert_own" erlaubt genau das.
 */
async function loadProfile(userId: string, email: string, displayNameFallback: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('[MDU Auth] Profil konnte nicht geladen werden:', error.message);
    return null;
  }
  if (data) return toUserProfile(data as ProfileRow);

  // Profil fehlt → Fallback-Anlage (Rolle: player)
  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({ id: userId, email, display_name: displayNameFallback || email.split('@')[0], role: 'player' })
    .select('*')
    .maybeSingle();

  if (insertError || !created) {
    console.error('[MDU Auth] Profil konnte nicht angelegt werden:', insertError?.message);
    return null;
  }
  return toUserProfile(created as ProfileRow);
}

// ── Dev-Mock (nur bei NEXT_PUBLIC_USE_AUTH_MOCK=true) ─────────

function mockRoleForEmail(email: string): UserRole {
  const local = email.split('@')[0]?.toLowerCase() ?? '';
  if (local.startsWith('admin'))    return 'super_admin';
  if (local.startsWith('vorstand')) return 'league_admin';
  if (local.startsWith('kapitaen') || local.startsWith('captain')) return 'team_captain';
  return 'player';
}

function mockProfile(email: string, displayName?: string): UserProfile {
  const now = new Date().toISOString();
  return {
    id: `mock-${email.toLowerCase()}`,
    email,
    displayName: displayName || email.split('@')[0],
    role: mockRoleForEmail(email),
    createdAt: now,
    updatedAt: now,
  };
}

function readMockSession(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(MOCK_SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch { return null; }
}

function writeMockSession(user: UserProfile | null) {
  try {
    if (user) sessionStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(MOCK_SESSION_KEY);
  } catch { /* storage unavailable */ }
}

/**
 * Setzt/löscht einen einfachen Marker-Cookie „mdu-auth", damit die Middleware
 * am Server erkennt, ob überhaupt eine Anmeldung besteht, und Gäste von
 * /admin und /mein-bereich wegleiten kann (REV-002). Enthält KEINE Tokens —
 * die eigentliche Autorisierung bleibt bei RLS + den Server-APIs.
 */
function writeAuthCookie(hasSession: boolean) {
  if (typeof document === 'undefined') return;
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = hasSession
    ? `mdu-auth=1; path=/; max-age=2592000; SameSite=Lax${secure}`
    : `mdu-auth=; path=/; max-age=0; SameSite=Lax${secure}`;
}

// ── Provider ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      // Initial-Sync aus sessionStorage außerhalb des Effect-Bodys
      // (vermeidet kaskadierende Renders, react-hooks/set-state-in-effect)
      queueMicrotask(() => {
        setUser(readMockSession());
        setLoading(false);
      });
      return;
    }
    if (!supabase) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    let cancelled = false;

    async function syncFromSession() {
      const { data } = await supabase!.auth.getSession();
      const sessionUser = data.session?.user;
      if (cancelled) return;
      if (sessionUser) {
        writeAuthCookie(true);
        const profile = await loadProfile(
          sessionUser.id,
          sessionUser.email ?? '',
          (sessionUser.user_metadata?.display_name as string) ?? '',
        );
        if (!cancelled) setUser(profile);
      } else {
        writeAuthCookie(false);
        setUser(null);
      }
      if (!cancelled) setLoading(false);
    }

    syncFromSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session?.user) {
        writeAuthCookie(false);
        setUser(null);
        return;
      }
      writeAuthCookie(true);
      loadProfile(
        session.user.id,
        session.user.email ?? '',
        (session.user.user_metadata?.display_name as string) ?? '',
      ).then(profile => { if (!cancelled) setUser(profile); });
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400));
      if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
      if (password.length < 6) return { error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' };
      const profile = mockProfile(email);
      setUser(profile);
      writeMockSession(profile);
      return { error: null };
    }
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: germanAuthError(error.message) };

    const profile = await loadProfile(
      data.user.id,
      data.user.email ?? email,
      (data.user.user_metadata?.display_name as string) ?? '',
    );
    if (!profile) return { error: 'Dein Profil konnte nicht geladen werden. Bitte später erneut versuchen.' };
    writeAuthCookie(true); // synchron vor dem Redirect (sonst Race mit der Middleware)
    setUser(profile);
    return { error: null };
  }, []);

  const signUp = useCallback(async (params: SignUpParams): Promise<SignUpResult> => {
    const firstName = params.firstName.trim();
    const lastName = params.lastName.trim();
    const { email, password, intent } = params;
    const comment = (params.comment ?? '').trim();
    const displayName = `${firstName} ${lastName}`.trim();

    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400));
      if (firstName.length < 1 || lastName.length < 1) return { error: 'Bitte Vor- und Nachnamen eingeben.' };
      if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
      if (password.length < 6) return { error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' };
      const profile = mockProfile(email, displayName);
      setUser(profile);
      writeMockSession(profile);
      return { error: null };
    }
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };

    // Automatische Spieler-/Team-Erkennung (nur Vorschlag, keine Rechtevergabe)
    const match = getRegistrationMatchSuggestion(firstName, lastName);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Ziel der Bestätigungs-Mail: zurück auf die richtige Umgebung/Domain
        // (sonst kann der Link ins Leere/auf localhost zeigen), REV-022.
        emailRedirectTo: `${window.location.origin}/mein-bereich`,
        data: {
          display_name: displayName,
          first_name: firstName,
          last_name: lastName,
          registration_intent: intent,
          registration_comment: comment,
          matched_player_id: match.matchedPlayerId ?? '',
          matched_team_id: match.matchedTeamId ?? '',
          match_confidence: match.confidence,
        },
      },
    });
    if (error) return { error: germanAuthError(error.message) };

    // E-Mail-Bestätigung aktiv → keine Session, Hinweis anzeigen
    if (!data.session) return { error: null, needsEmailConfirmation: true };

    const profile = await loadProfile(data.user!.id, email, displayName);
    if (profile) { writeAuthCookie(true); setUser(profile); }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (USE_MOCK) {
      setUser(null);
      writeMockSession(null);
      return;
    }
    if (supabase) await supabase.auth.signOut();
    writeAuthCookie(false);
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 400));
      if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
      return { error: null };
    }
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/passwort-zuruecksetzen`,
    });
    if (error) return { error: germanAuthError(error.message) };
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (USE_MOCK) return { error: 'Im Mock-Modus nicht verfügbar.' };
    if (!supabase) return { error: NOT_CONFIGURED_ERROR };

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: germanAuthError(error.message) };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hooks / Helper ────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden.');
  return ctx;
}

/** Aktuellen Benutzer lesen (null = Gast). */
export function useCurrentUser(): UserProfile | null {
  return useAuth().user;
}
