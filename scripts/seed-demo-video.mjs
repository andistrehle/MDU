// Demo-Daten für das Einführungsvideo (REVERSIBEL via cleanup-demo-video.mjs).
// Legt 2 fiktive Demo-Konten an:
//   • Demo-Kapitän (team_captain @ freibad-bazis) + 4 Benachrichtigungen + 1 eingereichte Anmeldung
//   • Demo-Spieler (player, verknüpft mit öffentlichem Spielerprofil) + 3 Benachrichtigungen
// Keine echten Personen-/Teamdaten werden verändert (nur Verknüpfung, reversibel).
// Start (aus Repo-Root): node scripts/seed-demo-video.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const PASSWORD = 'MduDemo2026!';

async function ensureUser(email, displayName) {
  const { data: created, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
    user_metadata: { display_name: displayName, demo: true },
  });
  if (error && !/already.*registered|exists/i.test(error.message)) { console.error('createUser', email, error.message); process.exit(1); }
  if (created?.user) { console.log('Auth-User angelegt:', email); return created.user.id; }
  const { data: list } = await admin.auth.admin.listUsers({ page:1, perPage:200 });
  const id = list.users.find(u => u.email === email)?.id;
  console.log('Auth-User existierte bereits:', email);
  return id;
}

async function seedNotifications(userId, items) {
  await admin.from('notifications').delete().eq('recipient_user_id', userId);
  const now = Date.now();
  const rows = items.map((n,i)=>({ ...n, recipient_user_id:userId, target_role:null, read_at:null, created_at:new Date(now - i*3600_000).toISOString() }));
  const { error } = await admin.from('notifications').insert(rows);
  console.log('  Benachrichtigungen:', error ? 'FEHLER ' + error.message : rows.length + ' ungelesen');
}

// ── 1) Demo-Kapitän ───────────────────────────────────────────
{
  const EMAIL = 'demo.kapitaen@example.com';
  const userId = await ensureUser(EMAIL, 'Demo Kapitän');
  const { error } = await admin.from('profiles').upsert({
    id:userId, email:EMAIL, display_name:'Demo Kapitän', role:'team_captain',
    team_id:'freibad-bazis', player_id:null, first_name:'Demo', last_name:'Kapitän',
    registration_intent:'team_captain',
  }, { onConflict:'id' });
  console.log('  Profil:', error ? 'FEHLER ' + error.message : 'team_captain @ freibad-bazis');
  await seedNotifications(userId, [
    { type:'team_registration_approved', title:'Mannschaftsanmeldung freigegeben', short_text:'Deine Mannschaftsanmeldung wurde freigegeben.', message:'Die Ligaleitung hat deine Mannschaftsanmeldung für die neue Saison freigegeben.', action_url:'/mein-bereich/anmeldungen' },
    { type:'match_report_submitted', title:'Spielbericht wartet auf Prüfung', short_text:'Ein Spielbericht wartet auf deine Prüfung.', message:'Ein neuer Spielbericht wurde eingereicht und wartet auf deine Prüfung.', action_url:'/mein-bereich/spielberichte/uebersicht' },
    { type:'account_activated', title:'Spielerprofil zugeordnet', short_text:'Einem Konto wurde ein Spielerprofil zugeordnet.', message:'Einem Konto wurde ein Spielerprofil zugeordnet.', action_url:'/mein-bereich' },
    { type:'info', title:'Willkommen bei der MDU-Plattform', short_text:'Willkommen – schön, dass du dabei bist!', message:'Willkommen bei der neuen Plattform der Münchner Dart Union.', action_url:'/mein-bereich' },
  ]);
  await admin.from('team_registrations').delete().eq('submitted_by', userId);
  const { error: rerr } = await admin.from('team_registrations').insert({
    season_id:'season-2027', is_new_team:true, source_team_id:null,
    team_name:'DC Demo München', short_name:'DCD', description:'Demo-Mannschaft für die Plattform-Vorstellung.',
    venue_name:'Demo-Sportsbar', venue_address:'Musterstraße 1, 80331 München',
    contact_name:'Demo Kapitän', contact_email:EMAIL,
    requested_league:'b_liga', requested_competition_id:'b_liga',
    status:'submitted', submitted_by:userId, submitted_at:new Date().toISOString(),
  });
  console.log('  Anmeldung:', rerr ? 'FEHLER ' + rerr.message : 'DC Demo München (eingereicht)');
}

// ── 2) Demo-Spieler ───────────────────────────────────────────
{
  const EMAIL = 'demo.spieler@example.com';
  const userId = await ensureUser(EMAIL, 'Demo Spieler');
  const { error } = await admin.from('profiles').upsert({
    id:userId, email:EMAIL, display_name:'Demo Spieler', role:'player',
    team_id:'freibad-bazis', player_id:'andreas-strehle', first_name:'Demo', last_name:'Spieler',
    registration_intent:'player',
  }, { onConflict:'id' });
  console.log('  Profil:', error ? 'FEHLER ' + error.message : 'player @ freibad-bazis (Profil: andreas-strehle)');
  await seedNotifications(userId, [
    { type:'account_activated', title:'Dein Konto wurde freigeschaltet', short_text:'Dein Konto wurde freigeschaltet.', message:'Dein Konto bei der Münchner Dart Union wurde freigeschaltet.', action_url:'/mein-bereich' },
    { type:'info', title:'Spielerprofil verknüpft', short_text:'Dein Spielerprofil wurde verknüpft.', message:'Dein Konto wurde mit deinem Spielerprofil verknüpft.', action_url:'/mein-profil' },
    { type:'info', title:'Willkommen bei der MDU-Plattform', short_text:'Willkommen – schön, dass du dabei bist!', message:'Willkommen bei der neuen Plattform der Münchner Dart Union.', action_url:'/mein-bereich' },
  ]);
}

console.log('\n=== FERTIG ===');
console.log('Demo-Kapitän: demo.kapitaen@example.com /', PASSWORD);
console.log('Demo-Spieler:  demo.spieler@example.com  /', PASSWORD);
