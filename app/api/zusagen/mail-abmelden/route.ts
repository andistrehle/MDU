// ============================================================
// /api/zusagen/mail-abmelden?u=<user>&t=<schlüssel>[&an=1]  (GET = Knopf, POST = umschalten)
// ============================================================
//
// Abmelden (bzw. mit an=1 wieder anmelden) von der E-Mail-Erinnerung an offene
// Zusagen — direkt aus der Mail, ohne Login. Der Schlüssel ist eine Signatur
// der Benutzer-ID (lib/server/zusage-mail-token.ts), fremde Konten lassen sich
// damit nicht umschalten. Antwort ist eine kleine Textseite.
// ============================================================

import { supabaseAdmin } from '@/lib/supabase/admin';
import { schluesselPasst } from '@/lib/server/zusage-mail-token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const seite = (titel: string, text: string, link?: { href: string; text: string }) => new Response(
  `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${titel} · Münchner Dart Union</title></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:60px auto;padding:0 20px;color:#1A1D24;line-height:1.55">
<h1 style="font-size:22px">${titel}</h1><p>${text}</p>
${link ? `<p><a href="${link.href}" style="color:#3E9C33;font-weight:700">${link.text}</a></p>` : ''}
<p><a href="/mein-team/zusagen" style="color:#3E9C33">Zum Team Manager</a></p></body></html>`,
  { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });

function pruefe(url: URL) {
  const u = url.searchParams.get('u') ?? '';
  const t = url.searchParams.get('t') ?? '';
  return { u, t, ok: /^[0-9a-f-]{36}$/i.test(u) && schluesselPasst(u, t) };
}
const UNGUELTIG = () => seite('Link ungültig', 'Dieser Link stimmt nicht (mehr). Nimm bitte den Link aus der letzten Erinnerungs-Mail.');

// GET zeigt nur einen Knopf: Mailprogramme rufen Links vorab auf (Virenprüfung) —
// ein GET, der sofort abmeldet, würde Spieler ungefragt abmelden.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const { u, t, ok } = pruefe(url);
  if (!ok) return UNGUELTIG();
  const an = url.searchParams.get('an') === '1';
  const ziel = `/api/zusagen/mail-abmelden?u=${u}&t=${t}${an ? '&an=1' : ''}`;
  return seite(an ? 'Wieder anmelden?' : 'Von der E-Mail-Erinnerung abmelden?',
    `${an ? 'Du bekommst die E-Mail-Erinnerung an offene Zu- und Absagen dann wieder.' : 'Du bekommst dann keine E-Mails mehr, wenn du für einen Termin noch nicht zu- oder abgesagt hast. Die Erinnerung in der Glocke bleibt.'}
    <form method="post" action="${ziel}" style="margin-top:18px"><button type="submit" style="padding:12px 20px;border-radius:10px;border:none;background:#3E9C33;color:#fff;font-weight:800;font-size:15px;cursor:pointer">${an ? 'Ja, wieder anmelden' : 'Ja, abmelden'}</button></form>`);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const { u, t, ok } = pruefe(url);
  if (!ok) return UNGUELTIG();
  const an = url.searchParams.get('an') === '1';
  if (!supabaseAdmin) return seite('Gerade nicht möglich', 'Das hat nicht geklappt. Bitte versuch es später noch einmal.');
  const { error } = await supabaseAdmin.from('profiles').update({ zusage_mail_aus: !an }).eq('id', u);
  if (error) return seite('Gerade nicht möglich', 'Das hat nicht geklappt. Bitte versuch es später noch einmal.');
  return an
    ? seite('Wieder angemeldet', 'Du bekommst die E-Mail-Erinnerung an offene Zu- und Absagen wieder – sofern dein Teamcaptain sie eingeschaltet hat.')
    : seite('Abgemeldet', 'Du bekommst keine E-Mail-Erinnerungen an offene Zu- und Absagen mehr. Die Erinnerung in der Glocke bleibt.',
        { href: `/api/zusagen/mail-abmelden?u=${u}&t=${t}&an=1`, text: 'Doch wieder anmelden' });
}
