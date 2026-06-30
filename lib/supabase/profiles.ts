// ============================================================
// Supabase-Datenzugriff: Spieler- & Team-Zusatzprofile (Sprint 5.4)
// ============================================================
//
// Lädt/speichert die editierbaren Zusatzdaten aus den Tabellen
// player_profiles / team_profiles (siehe migrations/0002…).
// RLS in der DB erzwingt, dass nur Berechtigte schreiben dürfen —
// diese Helper sind nur die Client-Schicht.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { supabase } from './client';

export interface PlayerProfileExtras {
  nickname: string | null;
  aboutMe: string | null;
  profileImageUrl: string | null;
  /** Freiwillige Einwilligung zur öffentlichen Anzeige (DSGVO Art. 6 I a). */
  showNickname: boolean;
  showPhoto: boolean;
}

export interface TeamProfileExtras {
  description: string | null;
  logoUrl: string | null;
  teamImageUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  websiteUrl: string | null;
}

// Hinweis: Veröffentlichung von Spitzname UND Profilbild erfolgt nur per aktiver,
// freiwilliger Einwilligung (DSGVO Art. 6 I a) — Default AUS, keine vorausgewählte
// Checkbox (vorangekreuzte Einwilligung wäre unwirksam). Deckt sich mit Migration 0025
// (show_photo/show_nickname default false) und loadPublicPlayerProfile.
const EMPTY_PLAYER: PlayerProfileExtras = { nickname: null, aboutMe: null, profileImageUrl: null, showNickname: false, showPhoto: false };
const EMPTY_TEAM: TeamProfileExtras = {
  description: null, logoUrl: null, teamImageUrl: null,
  instagramUrl: null, facebookUrl: null, websiteUrl: null,
};

// ── Spielerprofil ─────────────────────────────────────────────

export async function loadPlayerProfile(playerId: string): Promise<PlayerProfileExtras> {
  if (!supabase) return EMPTY_PLAYER;
  const { data, error } = await supabase
    .from('player_profiles')
    .select('nickname, about_me, profile_image_url, show_nickname, show_photo')
    .eq('player_id', playerId)
    .maybeSingle();
  if (error || !data) return EMPTY_PLAYER;
  return {
    nickname: data.nickname ?? null,
    aboutMe: data.about_me ?? null,
    profileImageUrl: data.profile_image_url ?? null,
    showNickname: data.show_nickname ?? false,
    showPhoto: data.show_photo ?? false,
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
    show_nickname: extras.showNickname,
    show_photo: extras.showPhoto,
    consent_updated_at: new Date().toISOString(),
    updated_by: auth.user?.id ?? null,
  });
  return { error: error?.message ?? null };
}

// ── Telefonnummer (zugriffsgeschützt, eigene Tabelle) ────────

export interface PlayerContact {
  phone: string | null;
  /** Vom Nutzer freigegeben (für eingeloggte Teamkapitäne sichtbar). */
  phonePublic: boolean;
}

/** Lädt die eigene Telefonnummer + Freigabe (RLS: nur eigene/Admin). null = keine Zeile. */
export async function loadPlayerContact(playerId: string): Promise<PlayerContact | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('player_contacts')
    .select('phone, phone_public')
    .eq('player_id', playerId)
    .maybeSingle();
  if (error || !data) return null;
  return { phone: data.phone ?? null, phonePublic: data.phone_public ?? false };
}

export async function savePlayerContact(playerId: string, c: PlayerContact): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('player_contacts').upsert({
    player_id: playerId,
    phone: (c.phone ?? '').trim() || null,
    phone_public: c.phonePublic,
    updated_by: auth.user?.id ?? null,
  });
  return { error: error?.message ?? null };
}

/**
 * Öffentlich anzeigbare Profil-Zusatzdaten — gibt Spitzname/Bild NUR zurück,
 * wenn der Spieler der Veröffentlichung zugestimmt hat. Serverseitig nutzbar
 * (eigener anon-Client, RLS erlaubt öffentliches Lesen).
 */
export async function loadPublicPlayerProfile(playerId: string): Promise<{ nickname: string | null; photoUrl: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { nickname: null, photoUrl: null };
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await client
    .from('player_profiles')
    .select('nickname, profile_image_url, show_nickname, show_photo')
    .eq('player_id', playerId)
    .maybeSingle();
  if (!data) return { nickname: null, photoUrl: null };
  return {
    nickname: data.show_nickname ? (data.nickname ?? null) : null,
    photoUrl: data.show_photo ? (data.profile_image_url ?? null) : null,
  };
}

// ── Teamprofil ────────────────────────────────────────────────

/**
 * Öffentlich anzeigbare Team-Medien (Logo + Mannschaftsbild). Serverseitig
 * nutzbar (eigener anon-Client, RLS erlaubt öffentliches Lesen). Logos sind
 * keine personenbezogenen Daten; Mannschaftsbilder lädt der Kapitän nur mit
 * Zustimmung der Abgebildeten hoch (siehe Nutzungsbedingungen/Bildrechte).
 */
export async function loadPublicTeamProfile(teamId: string): Promise<{ logoUrl: string | null; teamImageUrl: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { logoUrl: null, teamImageUrl: null };
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await client
    .from('team_profiles')
    .select('logo_url, team_image_url')
    .eq('team_id', teamId)
    .maybeSingle();
  if (!data) return { logoUrl: null, teamImageUrl: null };
  return { logoUrl: data.logo_url ?? null, teamImageUrl: data.team_image_url ?? null };
}

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
