import 'server-only';

// ============================================================
// Momentaufnahme Saison 2026/27 automatisch nachziehen (Betreiber, 18.11.2026)
// ============================================================
// Ändert die Ligaleitung unter Admin → Saison-Teams ein Lokal (oder ein Team sein
// Logo/Kürzel/seinen Namen), stand das bisher nur in der Datenbank — Spielplan,
// Teamseite und Spielstätten lesen aber lib/data/saison-2027.generated.json.
// Hier wird der Stand der DB mit der Datei verglichen und bei Unterschieden als
// EIN Commit übernommen (lib/server/github-mdu.ts → Neubau bei Vercel, danach
// stimmt alles überein). Ausgelöst: nach dem Speichern eines Lokals, per Knopf
// auf Admin → Saison-Teams und einmal täglich im Cron zusagen-mails.
// Ohne MDU_GITHUB_TOKEN wird nur verglichen und gemeldet, nichts vorgetäuscht.
// ============================================================

import plan from '@/app/admin/spielplan-vorschlag/spielplan.json';
import eingebaut from '@/lib/data/saison-2027.generated.json';
import { TEAMS } from '@/lib/data/teams';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { aendereJsonDatei, githubBereit } from '@/lib/server/github-mdu';
import { baueSnapshot, unterschiede, type Plan, type Snapshot, type TeamZeile } from '@/lib/saison-snapshot';

const SEASON_ID = 'season-2027';
const DATEI = 'lib/data/saison-2027.generated.json';
class Unveraendert extends Error {}

async function ausDb(vorher: Snapshot): Promise<Snapshot> {
  const db = supabaseAdmin;
  if (!db) throw new Error('Server-Datenbank ist nicht konfiguriert.');
  const { data, error } = await db.from('season_team_assignments')
    .select('team_id, assigned_competition_id, teams:team_id(name, short_name, logo_url), venues:venue_id(id, name, address)')
    .eq('season_id', SEASON_ID).eq('status', 'approved');
  if (error) throw new Error(error.message);
  const zeilen = (data ?? []) as unknown as TeamZeile[];
  const { data: profs } = await db.from('team_profiles').select('team_id, logo_url').in('team_id', zeilen.map(z => z.team_id));
  const profilLogo = new Map(((profs ?? []) as { team_id: string; logo_url: string | null }[]).filter(p => p.logo_url).map(p => [p.team_id, p.logo_url!]));
  return baueSnapshot({ seasonId: SEASON_ID, plan: plan as unknown as Plan, zeilen, profilLogo, stamm: TEAMS, vorher, jetzt: new Date().toISOString() });
}

/** Nur vergleichen: Was zeigt die Datenbank anders als die gerade ausgelieferte Seite? */
export async function snapshotVergleich(): Promise<{ unterschiede: string[]; bereit: boolean }> {
  const alt = eingebaut as unknown as Snapshot;
  return { unterschiede: unterschiede(alt, await ausDb(alt)), bereit: githubBereit() };
}

/** Unterschiede als Commit übernehmen. `geaendert: false` = es gab nichts zu tun. Wirft nie. */
export async function snapshotUebernehmen(): Promise<{ geaendert: boolean; unterschiede: string[]; error?: string }> {
  try {
    if (!githubBereit()) {
      const v = await snapshotVergleich();
      return { geaendert: false, unterschiede: v.unterschiede, error: v.unterschiede.length ? 'Das automatische Übernehmen ist nicht eingerichtet (MDU_GITHUB_TOKEN fehlt).' : undefined };
    }
    let liste: string[] = [];
    // Verglichen wird mit dem Stand in GitHub (nicht dem eingebauten) — das Deployment kann älter sein als main.
    const neuAusDb = await ausDb(eingebaut as unknown as Snapshot);
    try {
      await aendereJsonDatei<Snapshot>(DATEI, alt => {
        const neu: Snapshot = { ...neuAusDb, teams: Object.fromEntries(Object.entries(neuAusDb.teams).map(([id, t]) => [id, { ...t, logoUrl: t.logoUrl || alt.teams[id]?.logoUrl || null }])) };
        liste = unterschiede(alt, neu);
        if (!liste.length) throw new Unveraendert();
        return neu;
      }, 'Saison 2026/27: Momentaufnahme nachgezogen (Lokal, Name, Kürzel oder Logo in der Verwaltung geändert)');
    } catch (e) {
      if (e instanceof Unveraendert) return { geaendert: false, unterschiede: [] };
      throw e;
    }
    return { geaendert: true, unterschiede: liste };
  } catch (e) {
    return { geaendert: false, unterschiede: [], error: e instanceof Error ? e.message : 'Unbekannter Fehler.' };
  }
}
