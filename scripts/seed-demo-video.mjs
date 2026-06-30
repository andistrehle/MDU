// Demo-Daten für das Einführungsvideo (REVERSIBEL via cleanup-demo-video.mjs).
// Legt EINEN fiktiven Demo-Kapitän + 4 ungelesene Demo-Benachrichtigungen +
// 1 eingereichte Demo-Anmeldung ("DC Demo München") an. Keine echten Personen-
// oder Teamdaten werden verändert.
// Start (aus Repo-Root): node scripts/seed-demo-video.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const EMAIL = 'demo.kapitaen@example.com';
const PASSWORD = 'MduDemo2026!';
const TEAM = 'silberpfeile-ii';

let userId;
{
  const { data: created, error } = await admin.auth.admin.createUser({
    email: EMAIL, password: PASSWORD, email_confirm: true,
    user_metadata: { display_name: 'Demo Kapitän', demo: true },
  });
  if (error && !/already.*registered|exists/i.test(error.message)) { console.error('createUser:', error.message); process.exit(1); }
  if (created?.user) { userId = created.user.id; console.log('Auth-User angelegt:', userId); }
  else {
    const { data: list } = await admin.auth.admin.listUsers({ page:1, perPage:200 });
    userId = list.users.find(u => u.email === EMAIL)?.id;
    console.log('Auth-User existierte bereits:', userId);
  }
}
if (!userId) { console.error('Keine userId'); process.exit(1); }

{
  const { error } = await admin.from('profiles').upsert({
    id: userId, email: EMAIL, display_name: 'Demo Kapitän', role: 'team_captain',
    team_id: TEAM, player_id: null, first_name: 'Demo', last_name: 'Kapitän',
    registration_intent: 'team_captain',
  }, { onConflict: 'id' });
  console.log('Profil:', error ? 'FEHLER ' + error.message : 'ok (team_captain @ ' + TEAM + ')');
}

{
  await admin.from('notifications').delete().eq('recipient_user_id', userId);
  const N = [
    { type:'team_registration_approved', title:'Mannschaftsanmeldung freigegeben', short_text:'Deine Mannschaftsanmeldung wurde freigegeben.', message:'Die Ligaleitung hat deine Mannschaftsanmeldung für die neue Saison freigegeben.', action_url:'/mein-bereich/anmeldungen' },
    { type:'match_report_submitted', title:'Spielbericht wartet auf Prüfung', short_text:'Ein Spielbericht wartet auf deine Prüfung.', message:'Ein neuer Spielbericht wurde eingereicht und wartet auf deine Prüfung.', action_url:'/mein-bereich/spielberichte/uebersicht' },
    { type:'account_activated', title:'Spielerprofil zugeordnet', short_text:'Einem Konto wurde ein Spielerprofil zugeordnet.', message:'Einem Konto wurde ein Spielerprofil zugeordnet.', action_url:'/mein-bereich' },
    { type:'info', title:'Willkommen bei der MDU-Plattform', short_text:'Willkommen – schön, dass du dabei bist!', message:'Willkommen bei der neuen Plattform der Münchner Dart Union.', action_url:'/mein-bereich' },
  ];
  const now = Date.now();
  const rows = N.map((n,i)=>({ ...n, recipient_user_id:userId, target_role:null, read_at:null, created_at:new Date(now - i*3600_000).toISOString() }));
  const { error } = await admin.from('notifications').insert(rows);
  console.log('Benachrichtigungen:', error ? 'FEHLER ' + error.message : rows.length + ' ungelesen angelegt');
}

{
  await admin.from('team_registrations').delete().eq('submitted_by', userId);
  const { error } = await admin.from('team_registrations').insert({
    season_id:'season-2027', is_new_team:true, source_team_id:null,
    team_name:'DC Demo München', short_name:'DCD',
    description:'Demo-Mannschaft für die Plattform-Vorstellung.',
    venue_name:'Demo-Sportsbar', venue_address:'Musterstraße 1, 80331 München',
    contact_name:'Demo Kapitän', contact_email:EMAIL,
    requested_league:'b_liga', requested_competition_id:'b_liga',
    status:'submitted', submitted_by:userId, submitted_at:new Date().toISOString(),
  });
  console.log('Demo-Anmeldung:', error ? 'FEHLER ' + error.message : 'ok (DC Demo München, eingereicht, season-2027)');
}

console.log('\n=== FERTIG ===');
console.log('Login:', EMAIL, '/', PASSWORD);
console.log('userId:', userId);
