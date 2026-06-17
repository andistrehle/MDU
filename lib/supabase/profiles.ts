// ============================================================
// Supabase-Datenzugriff: Spieler- & Team-Zusatzprofile (Sprint 5.4)
// ============================================================
//
// Lädt/speichert die editierbaren Zusatzdaten aus den Tabellen
// player_profiles / team_profiles (siehe migrations/0002…).
// RLS in der DB erzwingt, dass nur Berechtigte schreiben dürfen —
// diese Helper sind nur die Client-Schicht.
// ============================================================

import { supabase } from './client';

export interface PlayerProfileExtras {
  nickname: string | null;
  aboutMe: string | null;
  profileImageUrl: string | null;
}

export interface TeamProfileExtras {
  description: string | null;
  logoUrl: string | null;
  teamImageUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
}

const EMPTY_PLAYER: PlayerProfileExtras = { nickname: null, aboutMe: null, profileImageUrl: null };
const EMPTY_TEAM: TeamProfileExtras = {
  description: null, logoUrl: null, teamImageUrl: null,
  instagramUrl: null, facebookUrl: null, websiteUrl: null,
};

// ── Spielerprofil ─────────────────────────────────────────────

export async function loadPlayerProfile(playerId: string): Promise<PlayerProfileExtras> {
  if (!supabase) return EMPTY_PLAYER;
  const { data, error } = await supabase
    .from('player_profiles')
    .select('nickname, about_me, profile_image_url')
    .eq('player_id', playerId)
    .maybeSingle();
  if (error || !data) return EMPTY_PLAYER;
  return {
    nickname: data.nickname ?? null,
    aboutMe: data.about_me ?? null,
    profileImageUrl: data.profile_image_url ?? null,
  };
}

export async function savePlayerProfile(
  playerId: string,
  extras: PlayerProfileExtras,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('player_profiles').upsert({
    player_id: playerId,
    nickname: extras.nickname,
    about_me: extras.aboutMe,
    profile_image_url: extras.profileImageUrl,
    updated_by: auth.user?.id ?? null,
  });
  return { error: error?.message ?? null };
}

// ── Teamprofil ────────────────────────────────────────────────

export async function loadTeamProfile(teamId: string): Promise<TeamProfileExtras> {
  if (!supabase) return EMPTY_TEAM;
  const { data, error } = await supabase
    .from('team_profiles')
    .select('description, logo_url, team_image_url, instagram_url, facebook_url, website_url')
    .eq('team_id', teamId)
    .maybeSingle();
  if (error || !data) return EMPTY_TEAM;
  return {
    description: data.description ?? null,
    logoUrl: data.logo_url ?? null,
    teamImageUrl: data.team_image_url ?? null,
    instagramUrl: data.instagram_url ?? null,
    facebookUrl: data.facebook_url ?? null,
    websiteUrl: data.website_url ?? null,
  };
}

export async function saveTeamProfile(
  teamId: string,
  extras: TeamProfileExtras,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('team_profiles').upsert({
    team_id: teamId,
    description: extras.description,
    logo_url: extras.logoUrl,
    team_image_url: extras.teamImageUrl,
    instagram_url: extras.instagramUrl,
    facebook_url: extras.facebookUrl,
    website_url: extras.websiteUrl,
    updated_by: auth.user?.id ?? null,
  });
  return { error: error?.message ?? null };
}
