import { describe, expect, it } from 'vitest';
import { neueMailPruefen, NEUE_MAIL_VORLAGE, htmlZuText, istNewsletter, antwortBetreff, antwortPruefen, antwortText, betreffKern, fadenSchluessel, istAutomatisch, leererEntwurf, vorname, vorschau, zitat } from './postfach';

describe('Postfach', () => {
  it('Betreff-Kern: alle Antwort- und Weiterleitungs-Vorsätze fallen weg', () => {
    expect(betreffKern('Re: AW: WG:  Name ändern')).toBe('Name ändern');
    expect(betreffKern('Fwd: Re[2]: Foto')).toBe('Foto');
    expect(betreffKern('Reise nach Berlin')).toBe('Reise nach Berlin');
    expect(betreffKern('')).toBe('');
  });

  it('Antwort-Betreff bekommt genau ein „Re:“', () => {
    expect(antwortBetreff('Name ändern')).toBe('Re: Name ändern');
    expect(antwortBetreff('AW: Re: Name ändern')).toBe('Re: Name ändern');
  });

  it('Faden: gleicher Kern und gleiche Person = ein Faden, andere Person = anderer', () => {
    expect(fadenSchluessel('Re: Foto', 'Limo@Example.de ')).toBe(fadenSchluessel('Foto', 'limo@example.de'));
    expect(fadenSchluessel('Foto', 'a@example.de')).not.toBe(fadenSchluessel('Foto', 'b@example.de'));
  });

  it('Zitat: Kopfzeile in Berliner Zeit, jede Zeile mit „> “, Leerzeile als „>“', () => {
    const z = zitat({ datum: '2026-11-18T09:05:00Z', von_name: 'Wolfgang Limbrunner', von_email: 'w@example.de', text: 'Hallo Toni,\n\nbitte ändern.\n' });
    expect(z).toBe('Am 18.11.2026 um 10:05 schrieb Wolfgang Limbrunner <w@example.de>:\n> Hallo Toni,\n>\n> bitte ändern.');
  });

  it('Antworttext = Antwort, Leerzeile, Zitat', () => {
    const t = antwortText('Hallo Limo,\n\nerledigt.\n', { datum: '2026-07-01T10:00:00Z', von_name: null, von_email: 'w@example.de', text: 'Danke' });
    expect(t).toBe('Hallo Limo,\n\nerledigt.\n\nAm 01.07.2026 um 12:00 schrieb w@example.de:\n> Danke');
  });

  it('Vorname für die Anrede', () => {
    expect(vorname('Wolfgang Limbrunner')).toBe('Wolfgang');
    expect(vorname('"Limbrunner, Wolfgang"')).toBe('Wolfgang');
    expect(vorname('w@example.de')).toBe('');
    expect(vorname(null)).toBe('');
    expect(leererEntwurf({ von_name: 'Linda Maier' })).toBe('Hallo Linda,\n\n\n\nViele Grüße\n\nAndi\nMünchner Dart Union');
    expect(leererEntwurf({ von_name: null }).startsWith('Hallo,\n')).toBe(true);
  });

  it('Vorschau ohne Zitate, gekürzt mit …', () => {
    expect(vorschau('Servus,\n\nkurze Frage.\n\nAm 01.01.2026 um 10:00 schrieb x@y.de:\n> alt')).toBe('Servus, kurze Frage.');
    expect(vorschau('a'.repeat(200), 20)).toBe(`${'a'.repeat(19)}…`);
  });

  it('automatische Mails erkennen — die eigenen Plattform-Mails sind Aufgaben, keine Automatenpost', () => {
    expect(istAutomatisch('noreply@example.de', 'Hallo')).toBe(true);
    expect(istAutomatisch('no-reply@mail.instagram.com', 'sieh dir an, was du verpasst hast')).toBe(true);
    expect(istAutomatisch('MAILER-DAEMON@strato.de', 'x')).toBe(true);
    expect(istAutomatisch('w@example.de', 'Automatische Antwort: Urlaub')).toBe(true);
    expect(istAutomatisch('w@example.de', 'Name ändern')).toBe(false);
    // Login-Hilfe / Kontaktformular der Plattform
    expect(istAutomatisch('no-reply@mdudarts.de', 'MDU: Hilfe beim Login (E-Mail-Adresse vergessen)')).toBe(false);
    // Kopfzeilen
    expect(istAutomatisch('news@example.de', 'Neues', { listUnsubscribe: true })).toBe(true);
    expect(istAutomatisch('w@example.de', 'Re: Frage', { autoSubmitted: 'auto-replied' })).toBe(true);
    expect(istAutomatisch('w@example.de', 'Re: Frage', { autoSubmitted: 'no' })).toBe(false);
    expect(istNewsletter({ precedence: 'bulk' })).toBe(true);
    expect(istNewsletter({})).toBe(false);
    expect(istNewsletter(undefined)).toBe(false);
  });

  it('Antwort prüfen: Adresse, leer, nur Anrede + Signatur', () => {
    expect(antwortPruefen('kein-at', 'Hallo, das ist ein Text.')).toMatch(/Adresse/);
    expect(antwortPruefen('no-reply@mdudarts.de', 'Hallo, das ist ein Text.')).toMatch(/no-reply/);
    expect(antwortPruefen('w@example.de', '  ')).toMatch(/leer/);
    expect(antwortPruefen('w@example.de', leererEntwurf({ von_name: 'Wolfgang L' }))).toMatch(/nur Anrede/);
    expect(antwortPruefen('w@example.de', 'Hallo Limo,\n\nerledigt.\n\nViele Grüße\n\nAndi\nMünchner Dart Union')).toBeNull();
  });

  it('HTML-Mail wird zu Text: Absätze als Zeilen, Umlaute aufgelöst, kein Skript', () => {
    expect(htmlZuText('<style>p{color:red}</style><p>Hallo Toni,</p><p>bitte <b>Linprunner</b> in Limbrunner &auml;ndern&nbsp;&#8211; danke &#x1F3AF;</p><script>alert(1)</script>'))
      .toBe('Hallo Toni,\nbitte Linprunner in Limbrunner ändern – danke 🎯');
    expect(htmlZuText('a<br>b<br/>c &amp; d &unbekannt;')).toBe('a\nb\nc & d &unbekannt;');
  });

  it('neue Mail prüfen: Meldung gehört zum richtigen Feld; ein Entwurf darf unfertig sein', () => {
    const gut = 'Servus Stephan,\n\nkurze Bitte …\n\nViele Grüße\n\nAndi\nMünchner Dart Union';
    expect(neueMailPruefen('s@example.de', 'Login von Linda', gut)).toBeNull();
    expect(neueMailPruefen('', 'Login von Linda', gut)?.feld).toBe('an');
    expect(neueMailPruefen('kein-at', 'Login von Linda', gut)?.feld).toBe('an');
    expect(neueMailPruefen('no-reply@example.de', 'Login von Linda', gut)?.feld).toBe('an');
    expect(neueMailPruefen('s@example.de', ' ', gut)?.feld).toBe('betreff');
    expect(neueMailPruefen('s@example.de', 'Login von Linda', NEUE_MAIL_VORLAGE)?.feld).toBe('text');
    // Entwurf: leer ist erlaubt, eine kaputte Adresse nicht
    expect(neueMailPruefen('', '', '', true)).toBeNull();
    expect(neueMailPruefen('kein-at', '', '', true)?.feld).toBe('an');
  });
});
