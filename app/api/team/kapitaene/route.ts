// ============================================================
// Route Handler: Co-Captain und Spielbericht-Vertretung (Migration 0062)
// ============================================================
//
// GET  /api/team/kapitaene?team=…
//   → { kapitaene, coCaptain, mitglieder, vertretungen, heimspiele, darf }
// POST /api/team/kapitaene
//   { team, aktion: 'co_setzen', userId, rechte }   — nur Kapitän / Ligaleitung
//   { team, aktion: 'co_entfernen' }                — nur Kapitän / Ligaleitung
//   { team, aktion: 'vertreter_setzen', matchKey, userId } — Kapitän, Co-Captain (Spielberichte), Ligaleitung
//   { team, aktion: 'vertreter_entziehen', id }     — dito
//
// Betreiber, 29.10.2026: Der Kapitän bestimmt höchstens EINEN Co-Captain und
// wählt dessen Rechte (jederzeit änderbar / entziehbar). Für ein Heimspiel
// ernennen Kapitän oder Co-Captain jemanden aus dem Team, der den Spielbericht
// anlegt, live führt und absendet — bis zum Absenden, spätestens Dienstag
// 24 Uhr nach dem Spiel. Für ALLE Teams, nicht nur mit Team Manager.
// Glocke (→ Push) an den Betroffenen; service_role, Regeln stehen hier.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser, hatTcRechtServer, type ServerUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { TC_RECHTE, TC_RECHT_TEXT, type TcRecht } from '@/lib/auth/roles';
import { alleBegegnungen27, team27, NEUE_SAISON, datumKurz27 } from '@/lib/data/saison-2027';
import { dienstagsEnde } from '@/lib/dienstags-ende';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Profil { id: string; role: string; display_name: string | null; first_name: string | null; last_name: string | null; email: string | null }
const nameVon = (p: Profil) => [p.first_name, p.last_name].filter(Boolean).join(' ') || p.display_name || (p.email ?? '').split('@')[0] || 'Unbekannt';
const fehler = (text: string, status = 400) => NextResponse.json({ error: text }, { status });
const migrationFehlt = (m: string) => /team_co_captains|spielbericht_vertretungen/.test(m) ? 'Die Datenbank kennt Co-Captain und Vertretung noch nicht — Migration 0062 fehlt.' : m;

function db() {
  if (!supabaseAdmin) throw new Error('Server-Datenbank ist nicht konfiguriert.');
  return supabaseAdmin;
}
/** Echter Kapitän des Teams oder Ligaleitung (Co-Captain bestimmen). */
const istKapitaen = (u: ServerUser, team: string) => isAdminUser(u) || (u.role === 'team_captain' && u.teamId === team);

/** Ende der Vertretung: Dienstag 23:59 (Berlin) nach dem Spieltag — Meldefrist. */
const heimspieleVon = (team: string) => alleBegegnungen27().filter(b => b.home === team);
const spielText = (key: string) => {
  const b = alleBegegnungen27().find(x => x.key === key);
  if (!b) return key;
  const wann = b.termin ? datumKurz27(b.termin.datum) : `Wochenende ${datumKurz27(b.fri)}`;
  return `${team27(b.home)?.name ?? b.home} – ${team27(b.away)?.name ?? b.away} (${wann})`;
};

async function melde(an: string[], ohne: string, titel: string, text: string, url: string) {
  const ids = [...new Set(an)].filter(id => id && id !== ohne);
  if (!ids.length) return;
  await db().from('notifications').insert(ids.map(id => ({
    recipient_user_id: id, type: 'team_kapitaene', title: titel, message: text, short_text: text, related_entity_type: 'team', action_url: url,
  })));
}

async function lageVon(team: string) {
  const [pr, co, ve, mr] = await Promise.all([
    db().from('profiles').select('id, role, display_name, first_name, last_name, email').eq('team_id', team),
    db().from('team_co_captains').select('user_id, rechte').eq('team_id', team).maybeSingle(),
    db().from('spielbericht_vertretungen').select('id, match_key, user_id, gueltig_bis').eq('team_id', team).is('ended_at', null).gt('gueltig_bis', new Date().toISOString()),
    db().from('match_reports').select('home_team_id, guest_team_id, status').eq('season_id', NEUE_SAISON.id).eq('home_team_id', team),
  ]);
  if (co.error) throw new Error(migrationFehlt(co.error.message));
  const profile = (pr.data ?? []) as Profil[];
  const name = (id: string) => { const p = profile.find(x => x.id === id); return p ? nameVon(p) : 'Unbekannt'; };
  const coRow = co.data as { user_id: string; rechte: string[] } | null;
  const abgesendet = new Set(((mr.data ?? []) as { home_team_id: string; guest_team_id: string; status: string }[])
    .filter(r => r.status !== 'draft').map(r => `${r.home_team_id}|${r.guest_team_id}`));
  // Heimspiele, für die noch ein Vertreter Sinn ergibt: Bericht nicht abgesendet, Frist nicht vorbei.
  const jetzt = Date.now();
  const heimspiele = heimspieleVon(team)
    .filter(b => !abgesendet.has(b.key) && new Date(dienstagsEnde(b.termin?.datum ?? b.sun)).getTime() > jetzt)
    .map(b => ({ key: b.key, text: spielText(b.key) }));
  return {
    profile, name, coRow,
    antwort: {
      kapitaene: profile.filter(p => p.role === 'team_captain').map(p => ({ userId: p.id, name: nameVon(p) })),
      coCaptain: coRow ? { userId: coRow.user_id, name: name(coRow.user_id), rechte: coRow.rechte } : null,
      mitglieder: profile.map(p => ({ userId: p.id, name: nameVon(p), kapitaen: p.role === 'team_captain' })).sort((a, b) => a.name.localeCompare(b.name, 'de')),
      vertretungen: ((ve.data ?? []) as { id: string; match_key: string; user_id: string; gueltig_bis: string }[])
        .map(v => ({ id: v.id, matchKey: v.match_key, spiel: spielText(v.match_key), userId: v.user_id, name: name(v.user_id), gueltigBis: v.gueltig_bis })),
      heimspiele,
    },
  };
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return fehler(auth.message, auth.status);
  const u = auth.user;
  const team = new URL(request.url).searchParams.get('team') ?? '';
  if (!team || (!isAdminUser(u) && u.teamId !== team)) return fehler('Kein Zugriff.', 403);
  try {
    const { antwort } = await lageVon(team);
    return NextResponse.json({ ...antwort, darf: { coCaptain: istKapitaen(u, team), vertreter: hatTcRechtServer(u, team, 'spielberichte') } });
  } catch (e) {
    return fehler(e instanceof Error ? e.message : 'Fehler.', 500);
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return fehler(auth.message, auth.status);
  const u = auth.user;
  const b = await request.json().catch(() => ({})) as { team?: string; aktion?: string; userId?: string; rechte?: string[]; matchKey?: string; id?: string };
  const team = b.team ?? '';
  if (!team) return fehler('Team fehlt.');
  const teamName = team27(team)?.name ?? team;
  try {
    const { profile, name, coRow } = await lageVon(team);

    if (b.aktion === 'co_setzen' || b.aktion === 'co_entfernen') {
      if (!istKapitaen(u, team)) return fehler('Den Co-Captain bestimmt der Kapitän.', 403);
      if (b.aktion === 'co_entfernen' || !(b.rechte ?? []).length) {
        if (!coRow) return NextResponse.json({ ok: true });
        const { error } = await db().from('team_co_captains').delete().eq('team_id', team);
        if (error) return fehler(error.message, 500);
        await melde([coRow.user_id], u.id, 'Nicht mehr Co-Captain', `Du bist nicht mehr Co-Captain von ${teamName}.`, '/mein-team');
        return NextResponse.json({ ok: true });
      }
      const ziel = profile.find(p => p.id === b.userId);
      if (!ziel) return fehler('Diese Person ist nicht im Team (Konto mit dem Team verknüpft).');
      if (ziel.role === 'team_captain') return fehler(`${nameVon(ziel)} ist schon Kapitän.`);
      const rechte = [...new Set(b.rechte)].filter((r): r is TcRecht => (TC_RECHTE as readonly string[]).includes(r));
      if (!rechte.length) return fehler('Bitte mindestens ein Recht wählen.');
      const { error } = await db().from('team_co_captains').upsert({ team_id: team, user_id: ziel.id, rechte, ernannt_von: u.id, updated_at: new Date().toISOString() });
      if (error) return fehler(migrationFehlt(error.message), 500);
      const liste = rechte.map(r => TC_RECHT_TEXT[r].label).join(', ');
      if (coRow && coRow.user_id !== ziel.id) {
        await melde([coRow.user_id], u.id, 'Nicht mehr Co-Captain', `Du bist nicht mehr Co-Captain von ${teamName}.`, '/mein-team');
      }
      const neu = !coRow || coRow.user_id !== ziel.id;
      await melde([ziel.id], u.id, neu ? 'Du bist jetzt Co-Captain' : 'Deine Co-Captain-Rechte',
        `${neu ? `Du bist jetzt Co-Captain von ${teamName}.` : `Deine Rechte als Co-Captain von ${teamName} wurden geändert.`} Rechte: ${liste}.`, '/mein-team');
      return NextResponse.json({ ok: true });
    }

    if (b.aktion === 'vertreter_setzen' || b.aktion === 'vertreter_entziehen') {
      if (!hatTcRechtServer(u, team, 'spielberichte')) return fehler('Einen Vertreter ernennen Kapitän oder Co-Captain (mit Recht „Spielberichte“).', 403);
      if (b.aktion === 'vertreter_entziehen') {
        const { data } = await db().from('spielbericht_vertretungen').update({ ended_at: new Date().toISOString(), ended_reason: 'entzogen' })
          .eq('id', b.id ?? '').eq('team_id', team).is('ended_at', null).select('user_id, match_key');
        const v = ((data ?? []) as { user_id: string; match_key: string }[])[0];
        if (v) await melde([v.user_id], u.id, 'Vertretung beendet', `Du trägst den Spielbericht ${spielText(v.match_key)} nicht mehr ein.`, '/mein-team');
        return NextResponse.json({ ok: true });
      }
      const spiel = heimspieleVon(team).find(x => x.key === b.matchKey);
      if (!spiel) return fehler('Den Spielbericht trägt das Heimteam ein – bitte ein Heimspiel wählen.');
      const ziel = profile.find(p => p.id === b.userId);
      if (!ziel) return fehler('Diese Person ist nicht im Team (Konto mit dem Team verknüpft).');
      const { data: rep } = await db().from('match_reports').select('status').eq('season_id', NEUE_SAISON.id).eq('home_team_id', spiel.home).eq('guest_team_id', spiel.away).maybeSingle();
      if (rep && (rep as { status: string }).status !== 'draft') return fehler('Für dieses Spiel ist der Spielbericht schon abgesendet.');
      const gueltigBis = dienstagsEnde(spiel.termin?.datum ?? spiel.sun);
      if (new Date(gueltigBis).getTime() <= Date.now()) return fehler('Die Meldefrist für dieses Spiel ist schon vorbei.');
      // Eine aktive Vertretung je Spiel: die bisherige endet.
      const { data: alt } = await db().from('spielbericht_vertretungen').update({ ended_at: new Date().toISOString(), ended_reason: 'ersetzt' })
        .eq('team_id', team).eq('match_key', spiel.key).is('ended_at', null).select('user_id');
      const { error } = await db().from('spielbericht_vertretungen').insert({ team_id: team, match_key: spiel.key, user_id: ziel.id, ernannt_von: u.id, gueltig_bis: gueltigBis });
      if (error) return fehler(migrationFehlt(error.message), 500);
      for (const a of (alt ?? []) as { user_id: string }[]) {
        if (a.user_id !== ziel.id) await melde([a.user_id], u.id, 'Vertretung beendet', `Du trägst den Spielbericht ${spielText(spiel.key)} nicht mehr ein.`, '/mein-team');
      }
      await melde([ziel.id], u.id, 'Du trägst den Spielbericht ein',
        `${name(u.id) === 'Unbekannt' ? 'Dein Kapitän' : name(u.id)} hat dich für ${spielText(spiel.key)} eingeteilt: Du darfst den Spielbericht anlegen, live führen und absenden – bis er abgesendet ist.`,
        `/mein-bereich/spielberichte?begegnung=${encodeURIComponent(spiel.key)}`);
      return NextResponse.json({ ok: true, gueltigBis });
    }

    return fehler('Unbekannte Aktion.');
  } catch (e) {
    return fehler(e instanceof Error ? e.message : 'Fehler.', 500);
  }
}
