// ============================================================
// Report: Saison-Anmeldungen 26/27 als druckfertiges HTML (→ PDF)
// ============================================================
//
// Erzeugt eine gestaltete HTML-Datei (anmeldungen-2627.html) mit:
//   • Übersicht je Liga (26/27 laut Auf-/Abstieg): gemeldet / fehlt / neu
//   • pro Team: Status, Kapitän, Telefon, E-Mail (soweit vorhanden)
// Zum PDF: Datei im Browser öffnen → Drucken → „Als PDF speichern".
//
// Kontaktquellen (best effort, nur LESEND):
//   • Gemeldete Teams → Kontaktdaten aus der Anmeldung (contact_*)
//   • Fehlende Teams  → Kapitän (25/26) + Telefon aus player_contacts +
//     E-Mail aus profiles (über Namensabgleich)
//
// Voraussetzung: .env.local mit NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
// Aufruf:  node scripts/report-registrations.mjs   [--season=season-2027]
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const seasonArg = process.argv.find(a => a.startsWith('--season='))?.slice('--season='.length);
const STAND = '13.08.2026';        // Date.now() steht in Skripten nicht zur Verfügung
const DEADLINE = '20.09.2026';

// ── Baseline: [teamId, Name, Liga26/27, Kapitän25/26, withdrawn?] ──
const BASE = [
  ['spartans', 'Spartans', 'La', 'Karolina Mauerer'],
  ['ohne-jackie', 'Ohne Jackie', 'La', 'Toni Bauer'],
  ['jolly-pirates-kts', "Jolly Pirates KT's", 'La', 'Melanie Preisendörfer'],
  ['no-maam', "No Ma'am", 'La', 'Zlatko Juric'],
  ['alptraum', 'Alptraum', 'La', 'Thomas Wagner'],
  ['gambas', 'Gambas', 'La', 'Gerhart Romboy'],
  ['silberpfeile-ii', 'Silberpfeile II', 'La', 'Maik Koenig'],

  ['dc-null-bull', 'DC Null Bull', 'A', 'Dieter Rogge'],
  ['les-dartagnons', 'Les Dartagnons', 'A', 'Hubert Kandlbinder'],
  ['dc-animals-ii', 'DC Animals', 'A', 'Alex Mückstein'],
  ['spartans-vi', 'Spartans VI', 'A', 'Thomas Hofstetter'],
  ['treff-nix-freimann', 'Treff Nix Freimann', 'A', 'Manuel Buchholz'],
  ['jolly-pirates-v', 'Jolly Pirates V', 'A', 'Harry Spitzenberger'],
  ['oldies-co', 'Oldies & Co', 'A', 'Ute Hofmann'],
  ['de-wolperdinga', 'De Wolperdinga', 'A', 'Mario Vaccaro', true],
  ['belfort-evolution', 'Belfort Evolution', 'A', 'Dietmar Poppe'],
  ['fiaker-deife', 'Fiaker Deife', 'A', 'Christian Matejka'],
  ['freibad-bazis', 'Freibad Bazis', 'A', 'Andreas Strehle'],

  ['sound-warriors', "Sound Warrior's", 'B', 'Christian Rock'],
  ['game-over', 'Game Over', 'B', 'Annett Meyer'],
  ['flying-fighters', 'Flying Fighters', 'B', 'Stephanie Vaccaro'],
  ['master-of-desaster', 'Master of Desaster', 'B', 'Thomas Gämmerler'],
  ['flying-seven', 'Flying Seven', 'B', 'Thomas Reisinger'],
  ['lucky-darts-one', 'Lucky Darts One', 'B', 'Torsten Bauer'],
  ['team-desaster', 'Team Desaster', 'B', 'Stefan Fischer'],
  ['de-vogelwuidn', "De Vogelwuid'n", 'B', 'Horst Sänger'],
  ['wild-indians', 'Wild Indians', 'B', 'Markus Steyer'],
  ['muenchen-0815', 'München 08/15', 'B', 'Lukasz Wiacek'],
  ['lucky-darts-two', 'Lucky Darts Two', 'B', 'Susanne Bauer'],

  ['de-hutzeldarter', 'De Hutzeldarter', 'C', 'Christian Fürsicht'],
  ['massl-ghabt', 'Massl Ghabt', 'C', 'Markus Kniehl'],
  ['dc-dark-angels', 'DC Dark Angels', 'C', 'Franz Eberl'],
  ['funny-darters', 'Funny Darters Munich', 'C', 'Marcus Kampmann'],
  ['black-devils', 'Black Devils', 'C', 'Petra Rödl'],
  ['fuenf-sterne-boazn', '5 Sterne Boazn Team', 'C', 'Jutta Lachner'],
];
const LIGA_ORDER = ['La', 'A', 'B', 'C'];
const LIGA_LABEL = { La: 'La-Liga', A: 'A-Liga', B: 'B-Liga', C: 'C-Liga' };
const LIGA_COLOR = { La: '#D40000', A: '#E8B84A', B: '#0EA5E9', C: '#22C55E' };
const REQ_TO_LIGA = { la_liga: 'La', a_liga: 'A', b_liga: 'B', c_liga: 'C' };
const baseById = new Map(BASE.map(([id, name, liga, captain, withdrawn]) => [id, { id, name, liga, captain, withdrawn: !!withdrawn }]));

const norm = (s) => (s ?? '').toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── ENV / Client ──────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL, key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Fehlt: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local'); process.exit(1); }
const admin = createClient(url, key, { auth: { persistSession: false } });

// ── Ziel-Saison ───────────────────────────────────────────────
let seasonId = seasonArg;
if (!seasonId) {
  const { data } = await admin.from('seasons').select('id, status').eq('status', 'registration_open');
  if (!data || data.length === 0) { console.error('Keine registration_open Saison. --season=… angeben.'); process.exit(1); }
  seasonId = data[0].id;
}

// ── Anmeldungen ───────────────────────────────────────────────
const { data: regs, error } = await admin.from('team_registrations')
  .select('team_name, source_team_id, is_new_team, requested_league, assigned_competition_id, status, contact_name, contact_phone, contact_email')
  .eq('season_id', seasonId);
if (error) { console.error('team_registrations lesen:', error.message); process.exit(1); }

const RANK = { approved: 4, in_review: 3, submitted: 3, changes_requested: 2, draft: 1, rejected: 0 };
const bestForBase = new Map();     // teamId → reg
const newTeams = [];
for (const r of regs ?? []) {
  const st = r.status ?? 'draft';
  if (!r.is_new_team && r.source_team_id && baseById.has(r.source_team_id)) {
    const prev = bestForBase.get(r.source_team_id);
    if (!prev || (RANK[st] ?? 0) > (RANK[prev.status] ?? 0)) bestForBase.set(r.source_team_id, r);
  } else {
    newTeams.push({ ...r, liga: REQ_TO_LIGA[r.assigned_competition_id] ?? REQ_TO_LIGA[r.requested_league] ?? '?' });
  }
}

// ── Kontakte fehlender Teams nachschlagen (Kapitän → Telefon/E-Mail) ──
const { data: players } = await admin.from('players').select('id, first_name, last_name, display_name');
const playerByName = new Map();
for (const p of players ?? []) {
  for (const cand of [`${p.first_name ?? ''} ${p.last_name ?? ''}`, p.display_name]) {
    const k = norm(cand); if (k && !playerByName.has(k)) playerByName.set(k, p.id);
  }
}
const { data: contacts } = await admin.from('player_contacts').select('player_id, phone');
const phoneByPlayer = new Map((contacts ?? []).filter(c => c.phone).map(c => [c.player_id, c.phone]));
const { data: profs } = await admin.from('profiles').select('player_id, email').not('player_id', 'is', null);
const emailByPlayer = new Map((profs ?? []).filter(p => p.email).map(p => [p.player_id, p.email]));
const lookupContact = (captainName) => {
  const pid = playerByName.get(norm(captainName));
  return { phone: pid ? (phoneByPlayer.get(pid) ?? '') : '', email: pid ? (emailByPlayer.get(pid) ?? '') : '' };
};

// ── Zeilen je Team aufbereiten ────────────────────────────────
const isMeldung = (st) => (RANK[st] ?? 0) >= RANK.submitted;
const ST = { approved: 'freigegeben', in_review: 'in Prüfung', submitted: 'eingereicht', changes_requested: 'Nachbesserung', draft: 'nur Entwurf', rejected: 'abgelehnt' };
const STCLASS = { approved: 'ok', in_review: 'ok', submitted: 'ok', changes_requested: 'warn', draft: 'draft', rejected: 'miss', missing: 'miss' };

function rowFor(t) {
  const reg = bestForBase.get(t.id);
  if (reg && isMeldung(reg.status)) {
    return { name: t.name, statusKey: reg.status, status: ST[reg.status], captain: reg.contact_name || t.captain,
      phone: reg.contact_phone || '', email: reg.contact_email || '', cls: STCLASS[reg.status] };
  }
  if (reg && reg.status === 'draft') {
    const c = lookupContact(t.captain);
    return { name: t.name, statusKey: 'draft', status: 'nur Entwurf', captain: reg.contact_name || t.captain,
      phone: reg.contact_phone || c.phone, email: reg.contact_email || c.email, cls: 'draft' };
  }
  if (t.withdrawn) return { name: t.name, statusKey: 'withdrawn', status: 'zurückgezogen (25/26)', captain: t.captain, phone: '', email: '', cls: 'miss' };
  const c = lookupContact(t.captain);
  return { name: t.name, statusKey: 'missing', status: 'fehlt noch', captain: t.captain, phone: c.phone, email: c.email, cls: 'miss' };
}

// ── HTML bauen ────────────────────────────────────────────────
const cell = (v) => v ? esc(v) : '<span class="muted">–</span>';
function teamRows(rows) {
  return rows.map(r => `<tr>
    <td class="tname">${esc(r.name)}</td>
    <td><span class="badge ${r.cls}">${esc(r.status)}</span></td>
    <td>${cell(r.captain)}</td>
    <td class="mono">${cell(r.phone)}</td>
    <td class="mono">${cell(r.email)}</td></tr>`).join('');
}

let totExpect = 0, totDone = 0, totMissing = 0, totDraft = 0;
let sections = '';
for (const liga of LIGA_ORDER) {
  const teams = BASE.filter(([, , l]) => l === liga).map(([id]) => baseById.get(id));
  const active = teams.filter(t => !t.withdrawn);
  const rows = teams.map(rowFor);
  const newInLiga = newTeams.filter(n => n.liga === liga).map(n => ({
    name: n.team_name || '(ohne Namen)', status: `neu · ${ST[n.status] ?? n.status}`, captain: n.contact_name || '',
    phone: n.contact_phone || '', email: n.contact_email || '', cls: 'new',
  }));
  const done = rows.filter(r => ['approved', 'in_review', 'submitted', 'changes_requested'].includes(r.statusKey)).length;
  const draft = rows.filter(r => r.statusKey === 'draft').length;
  const missing = rows.filter(r => r.statusKey === 'missing').length;
  totExpect += active.length; totDone += done; totMissing += missing; totDraft += draft;

  sections += `<section>
    <h2><span class="dot" style="background:${LIGA_COLOR[liga]}"></span>${LIGA_LABEL[liga]}
      <span class="count">${done}/${active.length} gemeldet${newInLiga.length ? ` · +${newInLiga.length} neu` : ''}</span></h2>
    <table>
      <thead><tr><th>Mannschaft</th><th>Status</th><th>Kapitän</th><th>Telefon</th><th>E-Mail</th></tr></thead>
      <tbody>${teamRows(rows)}${newInLiga.length ? `<tr class="sep"><td colspan="5">Neue Mannschaften</td></tr>${teamRows(newInLiga)}` : ''}</tbody>
    </table>
  </section>`;
}

const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<title>MDU Saison-Anmeldungen 2026/2027</title>
<style>
  :root { --ink:#1a1d24; --muted:#8a90a0; --line:#e6e8ee; }
  * { box-sizing:border-box; }
  body { font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:var(--ink); margin:32px; font-size:12.5px; }
  header { border-bottom:3px solid var(--ink); padding-bottom:12px; margin-bottom:18px; }
  h1 { margin:0; font-size:22px; letter-spacing:.3px; }
  .sub { color:var(--muted); font-size:12px; margin-top:4px; }
  .stats { display:flex; gap:10px; flex-wrap:wrap; margin:16px 0 22px; }
  .stat { border:1px solid var(--line); border-radius:10px; padding:10px 14px; min-width:120px; }
  .stat b { display:block; font-size:22px; }
  .stat span { color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.5px; }
  section { margin-bottom:22px; break-inside:avoid; }
  h2 { font-size:15px; margin:0 0 8px; display:flex; align-items:center; gap:8px; }
  h2 .count { margin-left:auto; font-size:12px; color:var(--muted); font-weight:600; }
  .dot { width:11px; height:11px; border-radius:50%; display:inline-block; }
  table { width:100%; border-collapse:collapse; }
  th { text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); border-bottom:2px solid var(--line); padding:6px 8px; }
  td { padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
  .tname { font-weight:600; }
  .mono { font-variant-numeric:tabular-nums; }
  .muted { color:#c2c6d0; }
  tr.sep td { background:#f6f7f9; font-size:10.5px; text-transform:uppercase; letter-spacing:.5px; color:var(--muted); font-weight:700; padding:4px 8px; }
  .badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:10.5px; font-weight:700; white-space:nowrap; }
  .badge.ok   { background:#e7f7ee; color:#128a4e; }
  .badge.warn { background:#fdf1dc; color:#a9750f; }
  .badge.draft{ background:#eef1f6; color:#5b6472; }
  .badge.miss { background:#fdeaea; color:#c0392b; }
  .badge.new  { background:#e9f0fd; color:#2b62c4; }
  footer { margin-top:20px; padding-top:10px; border-top:1px solid var(--line); color:var(--muted); font-size:11px; }
  @media print { body { margin:14mm; } @page { size:A4; margin:0; } }
</style></head><body>
<header>
  <h1>Saison-Anmeldungen 2026 / 2027</h1>
  <div class="sub">Münchner Dart Union · Stand ${STAND} · Anmeldeschluss ${DEADLINE} · Einteilung nach 26/27-Liga (Auf-/Abstieg)</div>
</header>
<div class="stats">
  <div class="stat"><b>${totDone + newTeams.length}</b><span>im Boot</span></div>
  <div class="stat"><b>${totDone}</b><span>Wiederkehrer</span></div>
  <div class="stat"><b>${newTeams.length}</b><span>neue Teams</span></div>
  <div class="stat"><b>${totMissing}</b><span>fehlen noch</span></div>
  <div class="stat"><b>${totExpect}</b><span>Soll 25/26 (aktiv)</span></div>
</div>
${sections}
<footer>Kontaktdaten: gemeldete Teams aus der Anmeldung; fehlende Teams über Kapitän (25/26) + hinterlegte Telefon-/Konto-Daten (soweit vorhanden). „–" = keine Daten hinterlegt.</footer>
</body></html>`;

const out = 'anmeldungen-2627.html';
writeFileSync(out, html, 'utf8');
console.log(`\nGeschrieben: ${out}`);
console.log(`Im Boot: ${totDone + newTeams.length}  ·  Wiederkehrer: ${totDone}  ·  neu: ${newTeams.length}  ·  fehlen: ${totMissing}  ·  nur Entwurf: ${totDraft}`);
console.log(`\n→ Datei im Browser öffnen, dann Drucken → „Als PDF speichern".`);
