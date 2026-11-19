import 'server-only';

// ============================================================
// Postfach kontakt@mdudarts.de — Abholen bei Strato und Antworten (Betreiber, 18.11.2026)
// ============================================================
// ABHOLEN: IMAP (imapflow) mit POSTFACH_IMAP_USER / POSTFACH_IMAP_PASSWORD (nur in
// Vercel, der Betreiber trägt sie selbst ein). Gelesen wird mit PEEK — bei Strato
// bleibt alles wie es ist (nichts wird als gelesen markiert, nichts verschoben).
// Abgeholt wird ab der zuletzt gesehenen UID; beim ersten Lauf die letzten 14 Tage.
// Jede neue Mail → Zeile in postfach_mails, Anhänge in den privaten Bucket „postfach“,
// Glocke (und damit Push) an die Ligaleitung.
//
// ANTWORTEN: über Resend als kontakt@mdudarts.de (liegt EMAIL_FROM auf einer anderen
// Domain, bleibt es bei EMAIL_FROM mit Antwort-an kontakt@). Danach — so gut es
// geht, ohne den Versand aufzuhalten — Kopie in den Strato-Ordner „Gesendet“ und
// die ursprüngliche Mail dort als beantwortet markiert.
//
// EHRLICH: ohne Zugangsdaten 'nicht_eingerichtet', ohne Resend 'skipped_no_provider'.
// ============================================================

import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  ABSENDER, ANHANG_MAX, POSTFACH_ADRESSE, TEXT_MAX, antwortBetreff, antwortText, fadenSchluessel, htmlZuText, istAutomatisch, istNewsletter,
  type PostfachAnhang, type PostfachMail,
} from '@/lib/postfach';

const HOST = process.env.POSTFACH_IMAP_HOST || 'imap.strato.de';
const USER = (process.env.POSTFACH_IMAP_USER || '').trim();
const PASS = process.env.POSTFACH_IMAP_PASSWORD || '';
const BUCKET = 'postfach';
const JE_LAUF = 40;
const ERSTER_LAUF_TAGE = 14;

export const postfachEingerichtet = () => !!(USER && PASS);

function verbindung() {
  return new ImapFlow({ host: HOST, port: 993, secure: true, auth: { user: USER, pass: PASS }, logger: false, socketTimeout: 45_000 });
}

const dateiname = (n: string) => n.normalize('NFKD').replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-').slice(0, 80) || 'anhang';

async function ligaleitung(): Promise<string[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.from('profiles').select('id').in('role', ['league_admin', 'super_admin']);
  return ((data ?? []) as { id: string }[]).map(r => r.id);
}

async function glocke(titel: string, text: string, link: string) {
  if (!supabaseAdmin) return;
  const an = await ligaleitung();
  if (!an.length) return;
  await supabaseAdmin.from('notifications').insert(an.map(id => ({
    recipient_user_id: id, type: 'postfach', title: titel, message: text, short_text: text,
    related_entity_type: 'postfach', action_url: link,
  })));
}

export interface AbholErgebnis { status: 'ok' | 'nicht_eingerichtet' | 'fehler'; neu: number; fehler?: string }

/** Holt neue Mails ab. Wirft nie; ein Fehler steht im Ergebnis und in postfach_stand. */
export async function abholen(): Promise<AbholErgebnis> {
  const db = supabaseAdmin;
  if (!db) return { status: 'fehler', neu: 0, fehler: 'Server-Datenbank ist nicht konfiguriert.' };
  if (!postfachEingerichtet()) return { status: 'nicht_eingerichtet', neu: 0 };

  const { data: standRoh, error: standFehler } = await db.from('postfach_stand').select('uidvalidity, letzte_uid').eq('id', 1).maybeSingle();
  if (standFehler) return { status: 'fehler', neu: 0, fehler: /postfach_stand/.test(standFehler.message) ? 'Migration 0070 fehlt noch.' : standFehler.message };
  const stand = (standRoh ?? { uidvalidity: null, letzte_uid: 0 }) as { uidvalidity: number | null; letzte_uid: number };

  const client = verbindung();
  const neu: { id: string; betreff: string; von: string; automatisch: boolean }[] = [];
  let hoechste = Number(stand.letzte_uid) || 0;
  let gueltig: number | null = null;
  let erster = false;
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      const box = client.mailbox;
      gueltig = box && typeof box === 'object' ? Number(box.uidValidity) : null;
      erster = !hoechste || (stand.uidvalidity != null && gueltig != null && Number(stand.uidvalidity) !== gueltig);
      if (erster) hoechste = 0;

      let uids: number[];
      if (erster) {
        const seit = new Date(Date.now() - ERSTER_LAUF_TAGE * 86_400_000);
        uids = ((await client.search({ since: seit }, { uid: true })) || []) as number[];
      } else {
        uids = ((await client.search({ uid: `${hoechste + 1}:*` }, { uid: true })) || []) as number[];
      }
      // „n:*“ liefert bei leerem Bereich die letzte Nachricht mit — deshalb filtern.
      uids = uids.filter(u => u > hoechste).sort((a, b) => a - b).slice(0, JE_LAUF);

      for (const uid of uids) {
        const msg = await client.fetchOne(String(uid), { source: true, internalDate: true }, { uid: true });
        if (!msg || !msg.source) { hoechste = Math.max(hoechste, uid); continue; }
        const p = await simpleParser(msg.source);
        const id = await ablegen(p, uid, msg.internalDate instanceof Date ? msg.internalDate : null);
        if (id) neu.push(id);
        hoechste = Math.max(hoechste, uid);
      }
    } finally {
      lock.release();
    }
    await client.logout().catch(() => {});
  } catch (e) {
    const fehler = e instanceof Error ? e.message : 'Unbekannter Fehler';
    client.close();
    // Was schon abgelegt ist, bleibt — der Stand rückt mit, damit nichts doppelt kommt.
    await db.from('postfach_stand').update({ letzte_uid: hoechste, ...(gueltig != null ? { uidvalidity: gueltig } : {}), letzter_lauf: new Date().toISOString(), letzter_fehler: fehler.slice(0, 300) }).eq('id', 1);
    return { status: 'fehler', neu: neu.length, fehler: /auth|login|credentials/i.test(fehler) ? 'Anmeldung bei Strato abgelehnt – Benutzername oder Passwort stimmen nicht.' : fehler };
  }

  await db.from('postfach_stand').update({ letzte_uid: hoechste, uidvalidity: gueltig, letzter_lauf: new Date().toISOString(), letzter_fehler: null }).eq('id', 1);

  // Glocke: einzeln bis drei Mails, sonst (und beim ersten Lauf) eine Sammelmeldung.
  const echte = neu.filter(n => !n.automatisch);
  if (erster && neu.length) {
    await glocke('Postfach eingerichtet', `${neu.length} ${neu.length === 1 ? 'Mail' : 'Mails'} der letzten ${ERSTER_LAUF_TAGE} Tage übernommen.`, '/admin/postfach');
  } else if (echte.length > 3) {
    await glocke(`${echte.length} neue Mails`, 'Im Postfach kontakt@mdudarts.de.', '/admin/postfach');
  } else {
    for (const n of echte) await glocke(`Neue Mail: ${n.betreff || '(ohne Betreff)'}`.slice(0, 120), `von ${n.von}`.slice(0, 160), `/admin/postfach?mail=${n.id}`);
  }
  return { status: 'ok', neu: neu.length };
}

/** Kontaktformular-Mails nennen die Person im Text („Name: …“). */
const nameAusText = (text: string) => (text.match(/^\s*Name:\s*(.+)$/m)?.[1] ?? '').trim().slice(0, 80);

async function ablegen(p: ParsedMail, uid: number, eingang: Date | null): Promise<{ id: string; betreff: string; von: string; automatisch: boolean } | null> {
  const db = supabaseAdmin!;
  const messageId = (p.messageId || `uid-${uid}@postfach.mdudarts.de`).trim();
  const { data: da } = await db.from('postfach_mails').select('id').eq('message_id', messageId).maybeSingle();
  if (da) return null;

  const von = p.from?.value?.[0];
  let vonEmail = (von?.address || '').trim().toLowerCase() || 'unbekannt@unbekannt.invalid';
  let vonName = (von?.name || '').trim() || null;
  // Mails der Plattform selbst (Kontaktformular) tragen die Person als Antwort-an: dann ist SIE der Absender,
  // damit Name, Verlauf und Antwort stimmen. Ohne Antwort-an (Login-Hilfe) bleibt es bei no-reply.
  const antwortAn = p.replyTo?.value?.[0];
  if (antwortAn?.address && vonEmail.endsWith(`@${POSTFACH_ADRESSE.split('@')[1]}`) && antwortAn.address.toLowerCase() !== POSTFACH_ADRESSE) {
    vonEmail = antwortAn.address.trim().toLowerCase();
    vonName = (antwortAn.name || '').trim() || nameAusText(p.text || '') || null;
  }
  const anRoh = p.to ? (Array.isArray(p.to) ? p.to : [p.to]).flatMap(a => a.value.map(v => v.address || '')).filter(Boolean).join(', ') : '';
  const betreff = (p.subject || '').trim().slice(0, 300);
  const text = ((p.text && p.text.trim()) || (typeof p.html === 'string' ? htmlZuText(p.html) : '') || '').slice(0, TEXT_MAX);
  const kopf = (n: string) => { const w = p.headers.get(n); return typeof w === 'string' ? w : w ? 'ja' : null; };
  // mailparser fasst alle List-*-Kopfzeilen unter „list“ zusammen (List-Unsubscribe → list.unsubscribe) — die Abfrage nach
  // „list-unsubscribe“ fand deshalb nie etwas, und Instagram-Werbung blieb offen (19.11.2026).
  const liste = p.headers.get('list') as Record<string, unknown> | undefined;
  const merkmale = {
    listUnsubscribe: !!(liste && typeof liste === 'object' && ('unsubscribe' in liste || 'id' in liste)),
    autoSubmitted: kopf('auto-submitted'), precedence: kopf('precedence'), spam: /^\s*yes/i.test(kopf('x-spam-flag') ?? ''),
  };
  const automatisch = istAutomatisch(vonEmail, betreff, merkmale);
  // Newsletter/Werbung: gleich abgehakt (unter „Erledigt“ zu finden), keine Glocke.
  const werbung = istNewsletter(merkmale, vonEmail) && !vonEmail.endsWith(`@${POSTFACH_ADRESSE.split('@')[1]}`);

  const { data: zeile, error } = await db.from('postfach_mails').insert({
    richtung: 'ein', message_id: messageId, imap_uid: uid, in_reply_to: (p.inReplyTo || null),
    von_name: vonName, von_email: vonEmail, an: anRoh || POSTFACH_ADRESSE, betreff, text,
    datum: (p.date || eingang || new Date()).toISOString(), faden: fadenSchluessel(betreff, vonEmail),
    status: werbung ? 'erledigt' : 'offen', automatisch, anhaenge: [],
  }).select('id').single();
  if (error || !zeile) return null;
  const id = (zeile as { id: string }).id;

  // Anhänge: winzige eingebettete Bilder (Logos in Signaturen) überspringen.
  const anhaenge: PostfachAnhang[] = [];
  let nr = 0;
  for (const a of p.attachments ?? []) {
    const groesse = a.size ?? a.content?.length ?? 0;
    if (a.related && groesse < 20_000) continue;
    nr++;
    const name = a.filename || `anhang-${nr}`;
    const typ = a.contentType || 'application/octet-stream';
    let pfad: string | null = null;
    if (groesse <= ANHANG_MAX && a.content) {
      const ziel = `${id}/${nr}-${dateiname(name)}`;
      const { error: upFehler } = await db.storage.from(BUCKET).upload(ziel, a.content, { contentType: typ, upsert: true });
      if (!upFehler) pfad = ziel;
    }
    anhaenge.push({ name, typ, groesse, pfad });
  }
  if (anhaenge.length) await db.from('postfach_mails').update({ anhaenge }).eq('id', id);

  return { id, betreff, von: vonName || vonEmail, automatisch };
}

// ── Antworten ─────────────────────────────────────────────────

export type SendeStatus = 'sent' | 'failed' | 'skipped_no_provider';

/** Absender: kontakt@mdudarts.de, wenn EMAIL_FROM auf derselben Domain liegt (sonst lehnt Resend ab). */
function absender(): string | null {
  const from = (process.env.EMAIL_FROM || '').trim();
  if (!from) return null;
  const domain = POSTFACH_ADRESSE.split('@')[1];
  return new RegExp(`@${domain.replace('.', '\\.')}>?$`, 'i').test(from) ? ABSENDER : from;
}

const b64Zeilen = (s: string) => (Buffer.from(s, 'utf8').toString('base64').match(/.{1,76}/g) ?? []).join('\r\n');
const kopf = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`);

/** Kopie in „Gesendet“ bei Strato + ursprüngliche Mail als beantwortet markieren. Nur Zugabe — Fehler egal. */
async function inGesendet(o: { an: string; betreff: string; text: string; messageId: string; bezug: string | null; uid: number | null; from: string }) {
  if (!postfachEingerichtet()) return;
  const client = verbindung();
  try {
    await client.connect();
    const ordner = await client.list();
    const gesendet = ordner.find(f => f.specialUse === '\\Sent') ?? ordner.find(f => /^(sent|gesendet|sent items|gesendete (objekte|elemente))$/i.test(f.name));
    if (gesendet) {
      const roh = [
        `From: ${o.from}`, `To: ${o.an}`, `Subject: ${kopf(o.betreff)}`, `Date: ${new Date().toUTCString()}`,
        `Message-ID: ${o.messageId}`, ...(o.bezug ? [`In-Reply-To: ${o.bezug}`, `References: ${o.bezug}`] : []),
        'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', b64Zeilen(o.text), '',
      ].join('\r\n');
      await client.append(gesendet.path, roh, ['\\Seen']);
    }
    if (o.uid) {
      const lock = await client.getMailboxLock('INBOX');
      try { await client.messageFlagsAdd(String(o.uid), ['\\Answered'], { uid: true }); } finally { lock.release(); }
    }
    await client.logout().catch(() => {});
  } catch {
    client.close();
  }
}

/** Schickt die Antwort auf eine eingegangene Mail und legt sie als ausgehende Zeile ab. */
export async function antworten(mailId: string, antwort: string, userId: string): Promise<{ status: SendeStatus; error?: string }> {
  const db = supabaseAdmin;
  if (!db) return { status: 'failed', error: 'Server-Datenbank ist nicht konfiguriert.' };
  const { data } = await db.from('postfach_mails').select('*').eq('id', mailId).maybeSingle();
  const m = data as (PostfachMail & { message_id: string | null; imap_uid: number | null }) | null;
  if (!m || m.richtung !== 'ein') return { status: 'failed', error: 'Mail nicht gefunden.' };

  const apiKey = process.env.RESEND_API_KEY;
  const from = absender();
  const betreff = antwortBetreff(m.betreff);
  const text = antwortText(antwort, m);
  const log = (status: SendeStatus, fehler?: string) => db.from('email_logs').insert({
    to_email: m.von_email, subject: betreff, type: 'postfach_antwort', related_entity_type: 'postfach', related_entity_id: m.id,
    status, error_message: fehler ?? null, sent_at: status === 'sent' ? new Date().toISOString() : null,
  });
  if (!apiKey || !from) { await log('skipped_no_provider'); return { status: 'skipped_no_provider' }; }

  const messageId = `<${crypto.randomUUID()}@mdudarts.de>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: [m.von_email], subject: betreff, text, reply_to: POSTFACH_ADRESSE,
        headers: { 'Message-ID': messageId, ...(m.message_id ? { 'In-Reply-To': m.message_id, References: m.message_id } : {}) },
      }),
    });
    if (!res.ok) {
      const fehler = `Resend ${res.status}: ${(await res.text()).slice(0, 300)}`;
      await log('failed', fehler);
      return { status: 'failed', error: fehler };
    }
  } catch (e) {
    const fehler = e instanceof Error ? e.message : 'Unbekannter Fehler beim Versand.';
    await log('failed', fehler);
    return { status: 'failed', error: fehler };
  }

  const jetzt = new Date().toISOString();
  await log('sent');
  await db.from('postfach_mails').insert({
    richtung: 'aus', message_id: messageId, in_reply_to: m.message_id, bezug: m.id,
    von_name: 'Münchner Dart Union', von_email: POSTFACH_ADRESSE, an: m.von_email, betreff, text: antwort.trim(),
    datum: jetzt, faden: m.faden, status: 'erledigt', gesendet_von: userId, erledigt_von: userId, erledigt_am: jetzt,
  });
  await db.from('postfach_mails').update({ status: 'erledigt', erledigt_von: userId, erledigt_am: jetzt, entwurf: null }).eq('id', m.id);
  await inGesendet({ an: m.von_email, betreff, text, messageId, bezug: m.message_id, uid: m.imap_uid, from });
  return { status: 'sent' };
}

/**
 * Neue Mail (keine Antwort) als kontakt@mdudarts.de schicken. Mit `entwurfId` wird der gespeicherte Entwurf
 * (richtung 'aus', status 'offen') zur gesendeten Mail, sonst entsteht eine neue ausgehende Zeile.
 */
export async function neueMailSenden(o: { an: string; betreff: string; text: string; userId: string; entwurfId?: string | null }): Promise<{ status: SendeStatus; error?: string }> {
  const db = supabaseAdmin;
  if (!db) return { status: 'failed', error: 'Server-Datenbank ist nicht konfiguriert.' };
  const an = o.an.trim().toLowerCase(), betreff = o.betreff.trim(), text = o.text.trim();
  const apiKey = process.env.RESEND_API_KEY;
  const from = absender();
  const log = (status: SendeStatus, fehler?: string) => db.from('email_logs').insert({
    to_email: an, subject: betreff, type: 'postfach_neu', related_entity_type: 'postfach', related_entity_id: o.entwurfId ?? null,
    status, error_message: fehler ?? null, sent_at: status === 'sent' ? new Date().toISOString() : null,
  });
  if (!apiKey || !from) { await log('skipped_no_provider'); return { status: 'skipped_no_provider' }; }

  const messageId = `<${crypto.randomUUID()}@mdudarts.de>`;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [an], subject: betreff, text, reply_to: POSTFACH_ADRESSE, headers: { 'Message-ID': messageId } }),
    });
    if (!res.ok) {
      const fehler = `Resend ${res.status}: ${(await res.text()).slice(0, 300)}`;
      await log('failed', fehler);
      return { status: 'failed', error: fehler };
    }
  } catch (e) {
    const fehler = e instanceof Error ? e.message : 'Unbekannter Fehler beim Versand.';
    await log('failed', fehler);
    return { status: 'failed', error: fehler };
  }

  const jetzt = new Date().toISOString();
  await log('sent');
  const zeile = {
    richtung: 'aus', message_id: messageId, von_name: 'Münchner Dart Union', von_email: POSTFACH_ADRESSE, an, betreff, text,
    datum: jetzt, faden: fadenSchluessel(betreff, an), status: 'erledigt', entwurf: null, gesendet_von: o.userId, erledigt_von: o.userId, erledigt_am: jetzt,
  };
  if (o.entwurfId) await db.from('postfach_mails').update(zeile).eq('id', o.entwurfId).eq('richtung', 'aus').eq('status', 'offen');
  else await db.from('postfach_mails').insert(zeile);
  await inGesendet({ an, betreff, text, messageId, bezug: null, uid: null, from });
  return { status: 'sent' };
}

/** Entwurf einer neuen Mail anlegen oder ändern (liegt unter „Offen“, bis er gesendet oder gelöscht wird). */
export async function entwurfSpeichern(o: { id?: string | null; an: string; betreff: string; text: string }): Promise<{ id: string | null; error?: string }> {
  const db = supabaseAdmin;
  if (!db) return { id: null, error: 'Server-Datenbank ist nicht konfiguriert.' };
  const an = o.an.trim().toLowerCase(), betreff = o.betreff.trim().slice(0, 300);
  const zeile = { an, betreff, entwurf: o.text.slice(0, 20_000), faden: fadenSchluessel(betreff, an), datum: new Date().toISOString() };
  if (o.id) {
    const { error } = await db.from('postfach_mails').update(zeile).eq('id', o.id).eq('richtung', 'aus').eq('status', 'offen');
    return { id: o.id, error: error?.message };
  }
  const { data, error } = await db.from('postfach_mails').insert({
    ...zeile, richtung: 'aus', status: 'offen', von_name: 'Münchner Dart Union', von_email: POSTFACH_ADRESSE, text: '',
  }).select('id').single();
  return { id: (data as { id: string } | null)?.id ?? null, error: error?.message };
}

/** Signierter Link (5 Minuten) auf einen Anhang. */
export async function anhangLink(mailId: string, index: number): Promise<string | null> {
  const db = supabaseAdmin;
  if (!db) return null;
  const { data } = await db.from('postfach_mails').select('anhaenge').eq('id', mailId).maybeSingle();
  const a = ((data as { anhaenge: PostfachAnhang[] } | null)?.anhaenge ?? [])[index];
  if (!a?.pfad) return null;
  const { data: s } = await db.storage.from(BUCKET).createSignedUrl(a.pfad, 300, { download: a.name });
  return s?.signedUrl ?? null;
}
