'use client';

// ============================================================
// MDU Auth — Session-Context (Sprint 5.1)
// ============================================================
//
// ⚠️  ENTWICKLUNGS-MOCK — KEINE ECHTE AUTHENTIFIZIERUNG  ⚠️
//
// Es ist noch kein Auth-Backend (Supabase) angebunden. Dieser
// Provider stellt die spätere Supabase-Auth-API nach, damit
// UI, Routen und Rollen-Logik bereits gebaut und getestet
// werden können.
//
// TODO (Supabase-Integration):
//   1. `npm install @supabase/supabase-js @supabase/ssr`
//   2. signIn/signUp/signOut/resetPassword unten durch
//      supabase.auth.signInWithPassword / signUp / signOut /
//      resetPasswordForEmail ersetzen.
//   3. Profil (Rolle, playerId, teamId) aus einer `profiles`-
//      Tabelle laden (id = auth.users.id) statt aus dem Mock.
//   4. Session-Persistenz übernimmt dann Supabase (Cookies via
//      @supabase/ssr) — den sessionStorage-Code entfernen.
//
// Sicherheits-Hinweise (gelten auch für den Mock):
//   • Es werden KEINE Passwörter gespeichert oder geprüft.
//   • In sessionStorage liegt nur das unkritische Profil
//     (Name, E-Mail, Rolle) — kein Token, kein Passwort.
//   • Der Mock schützt nichts: alle Inhalte bleiben öffentlich,
//     bis echte Auth + serverseitige Prüfungen existieren.
// ============================================================

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { UserProfile, UserRole } from './roles';

const SESSION_KEY = 'mdu-auth-session';

interface AuthContextValue {
  /** Eingeloggter Benutzer oder null (Gast). */
  user: UserProfile | null;
  /** True bis die Session beim ersten Render geprüft wurde. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Dev-Mock-Backend ──────────────────────────────────────────
// Rolle wird im Mock aus dem E-Mail-Präfix abgeleitet, damit alle
// Rollen-Ansichten testbar sind:
//   kapitaen@…  → team_captain
//   vorstand@…  → league_admin
//   admin@…     → super_admin
//   alles andere → player

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

function readSession(): UserProfile | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function writeSession(user: UserProfile | null) {
  try {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable — session lebt dann nur im Speicher */
  }
}

// ── Provider ──────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO Supabase: supabase.auth.getSession() + onAuthStateChange
    setUser(readSession());
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // TODO Supabase: supabase.auth.signInWithPassword({ email, password })
    await new Promise(r => setTimeout(r, 500)); // simulierte Netzwerk-Latenz
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
    if (password.length < 6) return { error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' };
    const profile = mockProfile(email);
    setUser(profile);
    writeSession(profile);
    return { error: null };
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    // TODO Supabase: supabase.auth.signUp({ email, password, options: { data: { displayName: name } } })
    await new Promise(r => setTimeout(r, 500));
    if (name.trim().length < 2) return { error: 'Bitte einen Namen eingeben.' };
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
    if (password.length < 6) return { error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' };
    const profile = mockProfile(email, name.trim());
    setUser(profile);
    writeSession(profile);
    return { error: null };
  }, []);

  const signOut = useCallback(() => {
    // TODO Supabase: supabase.auth.signOut()
    setUser(null);
    writeSession(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    // TODO Supabase: supabase.auth.resetPasswordForEmail(email, { redirectTo: … })
    await new Promise(r => setTimeout(r, 500));
    if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
    return { error: null };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
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
