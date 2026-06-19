// ============================================================
// MDU Auth — Rollenmodell & Rechte-Helper (Sprint 5.1)
// ============================================================
//
// Zentrales Rollenmodell. Rechte werden NUR über diese Helper
// geprüft — niemals verstreut in Komponenten hart codieren.
//
// Rollen-Hierarchie (aufsteigend):
//   guest < player < team_captain < league_admin < super_admin
//
// Die Struktur ist Supabase-kompatibel: `UserProfile` entspricht
// einer späteren `profiles`-Tabelle (id = auth.users.id).
// ============================================================

export type UserRole =
  | 'guest'
  | 'player'
  | 'team_captain'
  | 'league_admin'
  | 'super_admin';

/** App-Benutzerprofil. Entspricht der späteren Supabase-`profiles`-Tabelle. */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** Optionale Verknüpfung mit einem Spieler aus lib/data/players.ts */
  playerId?: string;
  /** Optionale Verknüpfung mit einem Team (relevant für team_captain) */
  teamId?: string;
  // ── Registrierungs-/Erkennungsdaten (Vorschlag, nie Rechtevergabe) ──
  firstName?: string;
  lastName?: string;
  /** Wunsch bei Registrierung: 'player' | 'team_captain' (kein Rechtebeweis). */
  registrationIntent?: string;
  /** Automatisch erkannter Spieler (Vorschlag). */
  matchedPlayerId?: string;
  /** Automatisch erkanntes Team (Vorschlag). */
  matchedTeamId?: string;
  /** 'exact' | 'likely' | 'ambiguous' | 'none' */
  matchConfidence?: string;
  /** 'pending' | 'confirmed' | 'rejected' | 'manual' */
  matchStatus?: string;
  createdAt: string;
  updatedAt: string;
}

/** Anzeige-Labels für die Rollen (UI). */
export const ROLE_LABELS: Record<UserRole, string> = {
  guest:        'Gast',
  player:       'Spieler',
  team_captain: 'Teamkapitän',
  league_admin: 'Ligaleitung / Vorstand',
  super_admin:  'Super Admin',
};

/** Hierarchie-Rang — höherer Rang schließt niedrigere Rechte ein. */
const ROLE_RANK: Record<UserRole, number> = {
  guest:        0,
  player:       1,
  team_captain: 2,
  league_admin: 3,
  super_admin:  4,
};

// ── Basis-Helper ──────────────────────────────────────────────

/** Effektive Rolle — nicht eingeloggt zählt als 'guest'. */
export function getRole(user: UserProfile | null): UserRole {
  return user?.role ?? 'guest';
}

export function hasRole(user: UserProfile | null, role: UserRole): boolean {
  return getRole(user) === role;
}

export function hasAnyRole(user: UserProfile | null, roles: UserRole[]): boolean {
  return roles.includes(getRole(user));
}

/** True, wenn die Rolle des Users mindestens `role` ist (Hierarchie). */
export function hasMinRole(user: UserProfile | null, role: UserRole): boolean {
  return ROLE_RANK[getRole(user)] >= ROLE_RANK[role];
}

// ── Fachliche Rechte ──────────────────────────────────────────

/** Eigenes Spielerprofil bearbeiten (Spitzname, Profilbild, Basisdaten). */
export function canEditPlayerProfile(user: UserProfile | null, playerId: string): boolean {
  if (hasMinRole(user, 'league_admin')) return true;
  // Spieler & Kapitäne: nur das eigene verknüpfte Profil
  return hasMinRole(user, 'player') && user?.playerId === playerId;
}

/** Teamdaten bearbeiten (Mannschaftsbild, Social Media, Kader). */
export function canEditTeam(user: UserProfile | null, teamId: string): boolean {
  if (hasMinRole(user, 'league_admin')) return true;
  return hasRole(user, 'team_captain') && user?.teamId === teamId;
}

/** Spieler im eigenen Team verwalten. */
export function canManageTeamPlayers(user: UserProfile | null, teamId: string): boolean {
  return canEditTeam(user, teamId);
}

/** Mannschaft zur Saison anmelden. */
export function canRegisterTeam(user: UserProfile | null, teamId: string): boolean {
  return canEditTeam(user, teamId);
}

/** Spielbericht für ein Team hochladen/erfassen. */
export function canUploadMatchReport(user: UserProfile | null, teamId: string): boolean {
  if (hasMinRole(user, 'league_admin')) return true;
  return hasRole(user, 'team_captain') && user?.teamId === teamId;
}

/** Spielberichte freigeben (Ligaleitung aufwärts). */
export function canApproveMatchReports(user: UserProfile | null): boolean {
  return hasMinRole(user, 'league_admin');
}

/** Ligadaten verwalten, Teams freigeben, News/Downloads pflegen, moderieren. */
export function canManageLeague(user: UserProfile | null): boolean {
  return hasMinRole(user, 'league_admin');
}

/** Systemeinstellungen / exklusive Super-Admin-Funktionen (nur Super Admin). */
export function canManageUsers(user: UserProfile | null): boolean {
  return hasRole(user, 'super_admin');
}

/** Darf die Benutzerverwaltung bearbeiten (Ligaleitung aufwärts). */
export function canEditUsers(user: UserProfile | null): boolean {
  return hasMinRole(user, 'league_admin');
}

/**
 * Darf ein konkretes Konto bearbeiten?
 * Super Admin: alle. Ligaleitung: alle außer Super-Admin-Konten.
 */
export function canEditUserAccount(actor: UserProfile | null, targetRole: UserRole): boolean {
  if (isSuperAdmin(actor)) return true;
  return hasMinRole(actor, 'league_admin') && targetRole !== 'super_admin';
}

/**
 * Darf eine bestimmte Rolle vergeben?
 * Super Admin: alle. Ligaleitung: alle außer 'super_admin' (keine Eskalation).
 */
export function canAssignRole(actor: UserProfile | null, role: UserRole): boolean {
  if (isSuperAdmin(actor)) return true;
  return hasMinRole(actor, 'league_admin') && role !== 'super_admin';
}

/** Ist der Benutzer Super Admin? */
export function isSuperAdmin(user: UserProfile | null): boolean {
  return hasRole(user, 'super_admin');
}

/** Benutzerliste einsehen (Ligaleitung aufwärts). */
export function canViewUsers(user: UserProfile | null): boolean {
  return hasMinRole(user, 'league_admin');
}

/** Rollen vergeben/ändern — exklusiv Super Admin (kein Ernennen durch Ligaleitung). */
export function canManageRoles(user: UserProfile | null): boolean {
  return hasRole(user, 'super_admin');
}

/** Eigenes Konto-/Spielerprofil bearbeiten (jeder eingeloggte Nicht-Gast). */
export function canEditOwnProfile(user: UserProfile | null): boolean {
  return hasMinRole(user, 'player');
}

/** Teamkapitän eines bestimmten Teams (ohne Admin-Override). */
export function isCaptainOfTeam(user: UserProfile | null, teamId: string): boolean {
  return hasRole(user, 'team_captain') && user?.teamId === teamId;
}

/** Darf eine Mannschaftsanmeldung erstellen (Kapitän, Ligaleitung, Super Admin). */
export function canStartRegistration(user: UserProfile | null): boolean {
  return hasRole(user, 'team_captain') || hasMinRole(user, 'league_admin');
}

/** Darf Anmeldungen prüfen/freigeben (Ligaleitung aufwärts). */
export function canApproveRegistrations(user: UserProfile | null): boolean {
  return hasMinRole(user, 'league_admin');
}
