// Entfernt ALLE vom Video-Seed angelegten Demo-Daten wieder (nach der Aufnahme).
// Löscht: Demo-Anmeldung, Demo-Benachrichtigungen, Demo-Profil, Demo-Auth-User.
// Start (aus Repo-Root): node scripts/cleanup-demo-video.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')&&l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim()];}));
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const EMAIL = 'demo.kapitaen@example.com';
const { data: list } = await admin.auth.admin.listUsers({ page:1, perPage:200 });
const userId = list.users.find(u => u.email === EMAIL)?.id;
if (!userId) { console.log('Kein Demo-User gefunden — nichts zu tun.'); process.exit(0); }

console.log('team_registrations:', (await admin.from('team_registrations').delete().eq('submitted_by', userId).select('id')).data?.length ?? 0, 'gelöscht');
console.log('notifications:', (await admin.from('notifications').delete().eq('recipient_user_id', userId).select('id')).data?.length ?? 0, 'gelöscht');
console.log('profiles:', (await admin.from('profiles').delete().eq('id', userId).select('id')).data?.length ?? 0, 'gelöscht');
const { error } = await admin.auth.admin.deleteUser(userId);
console.log('Auth-User:', error ? 'FEHLER ' + error.message : 'gelöscht');
console.log('DONE');
