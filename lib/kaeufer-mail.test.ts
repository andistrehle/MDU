// Tests: Text der Dankes-Mail an Team-Manager-Käufer (lib/kaeufer-mail.ts) — reiner Text, kein Versand.
import { describe, expect, it } from 'vitest';
import { kaeuferMailText } from './kaeufer-mail';

describe('Dankes-Mail an Käufer', () => {
  it('Anrede mit Vorname, Team, Paket und Umfrage-Link', () => {
    const m = kaeuferMailText({ vorname: 'Marcus', team: 'Funny Darters', paket: 'Saisonpass, gilt bis 31.05.2027', site: 'https://www.mdudarts.de' });
    expect(m.text.startsWith('Servus Marcus,')).toBe(true);
    expect(m.text).toContain('vielen Dank, dass du dich für den Team Manager entschieden hast!');
    expect(m.text).toContain('Er ist für Funny Darters freigeschaltet (Saisonpass, gilt bis 31.05.2027)');
    expect(m.text).toContain('Würdest du an einer ganz kurzen Umfrage teilnehmen?');
    expect(m.text).toContain('https://www.mdudarts.de/umfrage/team-manager');
  });
  it('ohne Vorname nur „Servus,“', () => {
    expect(kaeuferMailText({ vorname: null, team: 'X', paket: 'Monatsabo', site: 's' }).text.startsWith('Servus,\n')).toBe(true);
  });
});
