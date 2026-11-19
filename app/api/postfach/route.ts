// ============================================================
// /api/postfach — Postfach kontakt@mdudarts.de für die Ligaleitung (Betreiber, 18.11.2026)
// ============================================================
// GET            Liste (?status=offen|erledigt|alle), dazu Stand des Abholens.
// GET ?zahl=1    nur die Zahl offener Mails (Kachel/Seitenleiste).
// POST aktion:   abholen · status · entwurf · notiz · senden · anhang
//                neu_entwurf · neu_senden · neu_loeschen (neue Mail, keine Antwort)
// Alles per service_role (Tabelle ohne Policies), Zugang nur Ligaleitung.
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { abholen, anhangLink, antworten, entwurfSpeichern, neueMailSenden, postfachEingerichtet, telefonZu } from '@/lib/server/postfach';
import { antwortPruefen, neueMailPruefen } from '@/lib/postfach';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SPALTEN = 'id, richtung, von_name, von_email, an, betreff, text, datum, faden, status, automatisch, anhaenge, entwurf, notiz, erledigt_von, erledigt_am, gesendet_von, bezug';
const fehlt = (m: string) => (/postfach_/.test(m) ? 'Migration 0070 fehlt noch.' : m);

async function zugang(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return { fehler: NextResponse.json({ error: auth.message }, { status: auth.status }) };
  if (!isAdminUser(auth.user)) return { fehler: NextResponse.json({ error: 'Nur für die Ligaleitung.' }, { status: 403 }) };
  if (!supabaseAdmin) return { fehler: NextResponse.json({ error: 'Server-Datenbank ist nicht konfiguriert.' }, { status: 500 }) };
  return { user: auth.user, db: supabaseAdmin };
}

export async function GET(request: Request) {
  const z = await zugang(request);
  if (z.fehler) return z.fehler;
  const url = new URL(request.url);

  if (url.searchParams.get('zahl')) {
    const { count } = await z.db.from('postfach_mails').select('id', { count: 'exact', head: true }).eq('richtung', 'ein').eq('status', 'offen');
    return NextResponse.json({ offen: count ?? 0 }, { headers: { 'Cache-Control': 'no-store' } });
  }

  // Nummer zu EINER Adresse (Feld „An“ einer neuen Mail): ?telefon=<adresse>
  const frage = url.searchParams.get('telefon');
  if (frage) {
    const t = await telefonZu([frage]);
    return NextResponse.json({ telefon: t[frage.trim().toLowerCase()] ?? null }, { headers: { 'Cache-Control': 'no-store' } });
  }

  const status = url.searchParams.get('status') ?? 'offen';
  let q = z.db.from('postfach_mails').select(SPALTEN).order('datum', { ascending: false }).limit(200);
  if (status === 'offen') q = q.eq('status', 'offen'); // eingehende offene UND eigene Entwürfe (richtung 'aus')
  else if (status === 'erledigt') q = q.eq('status', 'erledigt');
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: fehlt(error.message) }, { status: 500 });

  // Zu offenen Mails den ganzen Faden mitgeben (frühere Mails derselben Person + eigene Antworten).
  const mails = data ?? [];
  const faeden = [...new Set(mails.map(m => (m as { faden: string }).faden))].slice(0, 100);
  let verlauf: unknown[] = [];
  if (status === 'offen' && faeden.length) {
    const { data: v } = await z.db.from('postfach_mails').select(SPALTEN).in('faden', faeden).order('datum', { ascending: true }).limit(400);
    verlauf = v ?? [];
  }
  // Hinterlegte Telefonnummern der Gegenüber (für „Per WhatsApp“): eingehend der Absender, bei Entwürfen der Empfänger.
  const ein = (mails as { richtung: string; von_email: string; von_name: string | null; an: string }[]);
  const telefone = await telefonZu(
    ein.map(m => (m.richtung === 'ein' ? m.von_email : m.an)),
    Object.fromEntries(ein.filter(m => m.richtung === 'ein').map(m => [m.von_email.toLowerCase(), m.von_name])),
  );
  const { data: stand } = await z.db.from('postfach_stand').select('letzter_lauf, letzter_fehler').eq('id', 1).maybeSingle();
  return NextResponse.json(
    { mails, verlauf, telefone, stand: stand ?? null, eingerichtet: postfachEingerichtet(), versand: !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  const z = await zugang(request);
  if (z.fehler) return z.fehler;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const aktion = String(body.aktion ?? '');
  const id = typeof body.id === 'string' ? body.id : '';

  if (aktion === 'abholen') {
    const r = await abholen();
    if (r.status === 'nicht_eingerichtet') return NextResponse.json({ error: 'Die Zugangsdaten für Strato fehlen noch in Vercel (POSTFACH_IMAP_USER, POSTFACH_IMAP_PASSWORD).' }, { status: 503 });
    if (r.status === 'fehler') return NextResponse.json({ error: r.fehler ?? 'Abholen fehlgeschlagen.' }, { status: 502 });
    return NextResponse.json({ ok: true, neu: r.neu });
  }

  // ── Neue Mail (keine Antwort): Entwurf speichern / senden / Entwurf löschen ──
  if (aktion === 'neu_entwurf' || aktion === 'neu_senden') {
    const an = String(body.an ?? ''), betreff = String(body.betreff ?? ''), text = String(body.text ?? '');
    const m = neueMailPruefen(an, betreff, text, aktion === 'neu_entwurf');
    if (m) return NextResponse.json({ error: m.text, feld: m.feld }, { status: 400 });
    if (aktion === 'neu_entwurf') {
      const r = await entwurfSpeichern({ id: id || null, an, betreff, text });
      if (r.error || !r.id) return NextResponse.json({ error: fehlt(r.error ?? 'Speichern fehlgeschlagen.') }, { status: 500 });
      return NextResponse.json({ ok: true, id: r.id });
    }
    const r = await neueMailSenden({ an, betreff, text, userId: z.user.id, entwurfId: id || null });
    if (r.status === 'skipped_no_provider') return NextResponse.json({ error: 'Der Mailversand ist auf dem Server nicht eingerichtet – die Mail wurde NICHT verschickt.' }, { status: 503 });
    if (r.status === 'failed') return NextResponse.json({ error: `Die Mail wurde NICHT verschickt: ${r.error ?? 'unbekannter Fehler'}` }, { status: 502 });
    return NextResponse.json({ ok: true });
  }
  if (aktion === 'neu_loeschen') {
    if (!id) return NextResponse.json({ error: 'Entwurf fehlt.' }, { status: 400 });
    const { error } = await z.db.from('postfach_mails').delete().eq('id', id).eq('richtung', 'aus').eq('status', 'offen');
    if (error) return NextResponse.json({ error: fehlt(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (!id) return NextResponse.json({ error: 'Mail fehlt.' }, { status: 400 });

  if (aktion === 'status') {
    const status = body.status === 'erledigt' ? 'erledigt' : 'offen';
    const { error } = await z.db.from('postfach_mails').update(
      status === 'erledigt' ? { status, erledigt_von: z.user.id, erledigt_am: new Date().toISOString() } : { status, erledigt_von: null, erledigt_am: null },
    ).eq('id', id);
    if (error) return NextResponse.json({ error: fehlt(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (aktion === 'entwurf' || aktion === 'notiz') {
    const wert = typeof body.text === 'string' ? body.text.slice(0, 20_000) : '';
    const { error } = await z.db.from('postfach_mails').update({ [aktion]: wert.trim() ? wert : null }).eq('id', id);
    if (error) return NextResponse.json({ error: fehlt(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (aktion === 'senden') {
    const text = typeof body.text === 'string' ? body.text : '';
    const { data: m } = await z.db.from('postfach_mails').select('von_email').eq('id', id).maybeSingle();
    if (!m) return NextResponse.json({ error: 'Mail nicht gefunden.' }, { status: 404 });
    const meldung = antwortPruefen((m as { von_email: string }).von_email, text);
    if (meldung) return NextResponse.json({ error: meldung }, { status: 400 });
    const r = await antworten(id, text, z.user.id);
    if (r.status === 'skipped_no_provider') return NextResponse.json({ error: 'Der Mailversand ist auf dem Server nicht eingerichtet – die Antwort wurde NICHT verschickt.' }, { status: 503 });
    if (r.status === 'failed') return NextResponse.json({ error: `Die Antwort wurde NICHT verschickt: ${r.error ?? 'unbekannter Fehler'}` }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  if (aktion === 'anhang') {
    const link = await anhangLink(id, Number(body.index) || 0);
    if (!link) return NextResponse.json({ error: 'Der Anhang ist nicht abgelegt (zu groß oder nicht mehr vorhanden).' }, { status: 404 });
    return NextResponse.json({ url: link });
  }

  return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
}
