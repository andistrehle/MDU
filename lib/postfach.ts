// ============================================================
// Postfach kontakt@mdudarts.de in der Plattform — reine Logik (Betreiber, 18.11.2026)
// ============================================================
// Keine DB, kein Netz: Betreff/Faden, Antworttext mit Zitat, Signatur, Vorschau.
// Abholen: lib/server/postfach.ts · Seite: Admin → Postfach.
// ============================================================

export type MailStatus = 'offen' | 'erledigt';
export type MailRichtung = 'ein' | 'aus';

export interface PostfachAnhang { name: string; typ: string; groesse: number; pfad: string | null }

export interface PostfachMail {
  id: string;
  richtung: MailRichtung;
  von_name: string | null;
  von_email: string;
  an: string;
  betreff: string;
  text: string;
  datum: string;
  faden: string;
  status: MailStatus;
  anhaenge: PostfachAnhang[];
  entwurf: string | null;
  notiz: string | null;
  erledigt_von: string | null;
  erledigt_am: string | null;
  gesendet_von: string | null;
}

/** Signatur des Betreibers für alle Antworten (CLAUDE.md, 18.11.2026). */
export const SIGNATUR = 'Viele Grüße\n\nAndi\nMünchner Dart Union';
export const POSTFACH_ADRESSE = 'kontakt@mdudarts.de';
export const ABSENDER = `Münchner Dart Union <${POSTFACH_ADRESSE}>`;
/** Anhänge größer als das werden nicht abgelegt (nur Name und Größe gemerkt). */
export const ANHANG_MAX = 8 * 1024 * 1024;
export const TEXT_MAX = 60_000;

/** Betreff ohne „Re:“, „AW:“, „WG:“, „Fwd:“ … — daran hängt der Faden. */
export function betreffKern(betreff: string): string {
  let s = (betreff ?? '').trim();
  for (;;) {
    const n = s.replace(/^\s*(re|aw|wg|fwd?|antw|antwort)\s*(\[\d+\])?\s*:\s*/i, '');
    if (n === s) break;
    s = n;
  }
  return s.replace(/\s+/g, ' ').trim();
}

/** Faden-Schlüssel: Betreff-Kern + die Person außerhalb der MDU (klein, ohne Leerzeichen). */
export function fadenSchluessel(betreff: string, gegenueber: string): string {
  return `${betreffKern(betreff).toLowerCase()}|${(gegenueber ?? '').trim().toLowerCase()}`;
}

/** Betreff einer Antwort: genau ein „Re: “ davor. */
export function antwortBetreff(betreff: string): string {
  const k = betreffKern(betreff);
  return k ? `Re: ${k}` : 'Re:';
}

const datumLang = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const t = d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric' });
  const u = d.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });
  return `${t} um ${u}`;
};

/** Zitat der ursprünglichen Mail unter der Antwort („Am … schrieb …:“ + „> “ je Zeile). */
export function zitat(m: Pick<PostfachMail, 'datum' | 'von_name' | 'von_email' | 'text'>): string {
  const wer = m.von_name ? `${m.von_name} <${m.von_email}>` : m.von_email;
  const zeilen = (m.text ?? '').replace(/\r\n/g, '\n').trimEnd().split('\n').map(z => (z ? `> ${z}` : '>'));
  return `Am ${datumLang(m.datum)} schrieb ${wer}:\n${zeilen.join('\n')}`;
}

/** Vorname für die Anrede — aus dem Absendernamen, sonst leer. */
export function vorname(name: string | null | undefined): string {
  const n = (name ?? '').replace(/["']/g, '').trim();
  if (!n || n.includes('@')) return '';
  // „Nachname, Vorname“ → Vorname
  const teil = n.includes(',') ? n.split(',')[1] : n;
  return (teil ?? '').trim().split(/\s+/)[0] ?? '';
}

/** Leerer Antwort-Entwurf: Anrede, Platz für den Text, Signatur. */
export function leererEntwurf(m: Pick<PostfachMail, 'von_name'>): string {
  const v = vorname(m.von_name);
  return `Hallo${v ? ` ${v}` : ''},\n\n\n\n${SIGNATUR}`;
}

/** Ganzer Mailtext, der rausgeht: Antwort + Leerzeile + Zitat. */
export function antwortText(antwort: string, original: Pick<PostfachMail, 'datum' | 'von_name' | 'von_email' | 'text'>): string {
  return `${antwort.trim()}\n\n${zitat(original)}`;
}

/** Kurze Vorschau für die Liste: erste Zeilen ohne Zitate und Leerzeilen. */
export function vorschau(text: string, max = 140): string {
  const zeilen = (text ?? '').replace(/\r\n/g, '\n').split('\n').map(z => z.trim())
    .filter(z => z && !z.startsWith('>') && !/^Am .+ schrieb .+:$/.test(z));
  const s = zeilen.join(' ').replace(/\s+/g, ' ');
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** Kopfzeilen, an denen man Massen- und Automatenpost erkennt. */
export interface MailMerkmale { listUnsubscribe?: boolean; autoSubmitted?: string | null; precedence?: string | null }

const KEIN_MENSCH = /^(no-?reply|do-?not-?reply|mailer-daemon|postmaster|bounces?)([+.\-_][^@]*)?@/i;
const eigeneDomain = (email: string) => (email ?? '').toLowerCase().endsWith(`@${POSTFACH_ADRESSE.split('@')[1]}`);

/** Newsletter/Werbung (Instagram & Co.): trägt einen Abmelde-Kopf oder ist als Massenpost markiert. */
export function istNewsletter(m: MailMerkmale | undefined): boolean {
  return !!m && (!!m.listUnsubscribe || /^(bulk|list|junk)$/i.test((m.precedence ?? '').trim()));
}

/**
 * Automatenpost OHNE Aufgabe für uns: Abwesenheitsnotizen, Unzustellbar-Meldungen, fremde no-reply-Absender.
 * NICHT automatisch sind die Mails der Plattform selbst (no-reply@mdudarts.de: Login-Hilfe, Kontaktformular,
 * Kündigung) — das sind echte Aufgaben für die Ligaleitung (Betreiber 18.11.2026).
 */
export function istAutomatisch(vonEmail: string, betreff: string, m?: MailMerkmale): boolean {
  const v = (vonEmail ?? '').toLowerCase();
  if (eigeneDomain(v)) return false;
  if (istNewsletter(m)) return true;
  const auto = (m?.autoSubmitted ?? '').trim().toLowerCase();
  if (auto && auto !== 'no') return true;
  return KEIN_MENSCH.test(v) || /^(undeliverable|unzustellbar|delivery status|automatische antwort|abwesenheit|out of office)/i.test((betreff ?? '').trim());
}

/** Adresse, an die man nicht antworten kann (no-reply & Co.). */
export const nichtBeantwortbar = (email: string) => KEIN_MENSCH.test((email ?? '').trim());

const MAIL = /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/;
/** Prüft eine Antwort vor dem Senden. null = in Ordnung, sonst die Meldung fürs Feld. */
export function antwortPruefen(an: string, text: string): string | null {
  if (!MAIL.test((an ?? '').trim())) return 'An diese Adresse lässt sich nicht antworten.';
  if (nichtBeantwortbar(an)) return 'An eine no-reply-Adresse lässt sich nicht antworten – die Person bitte über die Angaben im Text erreichen.';
  const t = (text ?? '').trim();
  if (t.length < 10) return 'Die Antwort ist noch leer.';
  if (t === leererEntwurf({ von_name: null }).trim() || /^Hallo[^\n]*,\s*Viele Grüße\s*Andi\s*Münchner Dart Union$/.test(t)) return 'Die Antwort enthält nur Anrede und Signatur.';
  if (t.length > 20_000) return 'Die Antwort ist zu lang (höchstens 20.000 Zeichen).';
  return null;
}

const ZEICHEN: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü',
  szlig: 'ß', euro: '€', ndash: '–', mdash: '—', hellip: '…', bdquo: '„', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', eacute: 'é', egrave: 'è',
};
/** Mails, die nur als HTML kommen: Text daraus (Absätze als Zeilen, Zeichen-Kürzel aufgelöst). Kein HTML wird je angezeigt. */
export function htmlZuText(html: string): string {
  return (html ?? '')
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li|h\d|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (alles, name) => ZEICHEN[name] ?? alles)
    .split('\n').map(z => z.replace(/[ \t]+/g, ' ').trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n').trim();
}

/** Leere neue Mail: Platz für Anrede und Text, darunter die Signatur. */
export const NEUE_MAIL_VORLAGE = `Hallo ,\n\n\n\n${SIGNATUR}`;

/** Prüft eine NEUE Mail (keine Antwort) vor dem Senden. null = in Ordnung. `nurEntwurf`: Empfänger/Text dürfen noch fehlen. */
export function neueMailPruefen(an: string, betreff: string, text: string, nurEntwurf = false): { feld: 'an' | 'betreff' | 'text'; text: string } | null {
  const a = (an ?? '').trim();
  if (a && !MAIL.test(a)) return { feld: 'an', text: 'Das ist keine gültige E-Mail-Adresse.' };
  if (a && nichtBeantwortbar(a)) return { feld: 'an', text: 'An eine no-reply-Adresse lässt sich nichts schicken.' };
  if ((betreff ?? '').trim().length > 300) return { feld: 'betreff', text: 'Der Betreff ist zu lang (höchstens 300 Zeichen).' };
  if ((text ?? '').length > 20_000) return { feld: 'text', text: 'Der Text ist zu lang (höchstens 20.000 Zeichen).' };
  if (nurEntwurf) return null;
  if (!a) return { feld: 'an', text: 'Bitte eine E-Mail-Adresse eintragen.' };
  if ((betreff ?? '').trim().length < 3) return { feld: 'betreff', text: 'Bitte einen Betreff eintragen.' };
  const t = (text ?? '').trim();
  if (t.length < 10 || t === NEUE_MAIL_VORLAGE.trim() || /^Hallo[^\n]*,\s*Viele Grüße\s*Andi\s*Münchner Dart Union$/.test(t)) return { feld: 'text', text: 'Der Text ist noch leer.' };
  return null;
}
