// Tests: Antworten prüfen (lib/umfrage.ts) — nur reine Rechnung, kein Netz.
import { describe, expect, it } from 'vitest';
import { FRAGEN, TM_FRAGEN, TM_UMFRAGE, UMFRAGE, antwortenPruefen, findeUmfrage, umfrageEnde, umfrageLaeuft, sichtbareFragen, fragenZahl, sichtbareOptionen } from './umfrage';

describe('Team-Manager-Umfrage', () => {
  it('nimmt Mehrfachwahl samt Freitext bei „Etwas anderes“ und den freiwilligen Namen', () => {
    expect(antwortenPruefen({ grund: ['test', 'sonst', 'quatsch'], grund_text: '  Kumpel hat es empfohlen ', name: ' Marcus ', gesamt: 5 }, TM_FRAGEN))
      .toEqual({ grund: ['test', 'sonst'], grund_text: 'Kumpel hat es empfohlen', name: 'Marcus', gesamt: 5 });
  });
  it('Freitext ohne „Etwas anderes“ fliegt raus, Unbekanntes auch', () => {
    expect(antwortenPruefen({ grund: ['preis'], grund_text: 'x', rolle: 'tc' }, TM_FRAGEN)).toEqual({ grund: ['preis'] });
  });
  it('leer → null; Name wird auf 80 Zeichen gekürzt', () => {
    expect(antwortenPruefen({ name: '   ' }, TM_FRAGEN)).toBeNull();
    expect((antwortenPruefen({ name: 'a'.repeat(200) }, TM_FRAGEN)!.name as string).length).toBe(80);
  });
  it('läuft ohne Ende ab dem Start', () => {
    expect(umfrageEnde(TM_UMFRAGE)).toBeNull();
    expect(umfrageLaeuft(new Date('2026-11-10T12:00:00Z'), TM_UMFRAGE)).toBe(false);
    expect(umfrageLaeuft(new Date('2027-03-01T12:00:00Z'), TM_UMFRAGE)).toBe(true);
  });
});

describe('Website-Umfrage bleibt wie bisher', () => {
  it('Standard = Website-Fragen, Start 15.11., 14 Tage bis einschließlich 28.11.', () => {
    expect(antwortenPruefen({ rolle: 'tc', grund: ['test'] })).toEqual({ rolle: 'tc' });
    expect(umfrageLaeuft(new Date('2026-11-14T22:00:00Z'))).toBe(false); // 14.11. 23:00 Berlin
    expect(umfrageLaeuft(new Date('2026-11-15T12:30:00Z'))).toBe(UMFRAGE.live);
    expect(umfrageLaeuft(new Date('2026-11-28T22:30:00Z'))).toBe(UMFRAGE.live); // 23:30 Berlin, letzter Tag
    expect(umfrageLaeuft(new Date('2026-11-28T23:30:00Z'))).toBe(false); // 29.11. 00:30 Berlin
    // genauer Startzeitpunkt (`ab`) am Starttag
    const mitAb = { ...UMFRAGE, live: true, ab: '2026-11-15T18:55:00Z' };
    expect(umfrageLaeuft(new Date('2026-11-15T18:54:00Z'), mitAb)).toBe(false);
    expect(umfrageLaeuft(new Date('2026-11-15T19:00:00Z'), mitAb)).toBe(true);
    expect(umfrageEnde()).toBe('2026-11-28');
    expect(findeUmfrage(undefined)).toBeUndefined();
    expect(findeUmfrage('website-2026-11')?.fragen).toBe(FRAGEN);
  });
});

describe('Wunsch-Frage: mehrere, höchstens 3', () => {
  it('nimmt bis zu 3 erlaubte Wünsche, den Freitext nur bei „Etwas anderes“', () => {
    expect(antwortenPruefen({ wunsch: ['forum', 'mdc', 'quatsch', 'brett', 'statistik'] })).toEqual({ wunsch: ['forum', 'mdc', 'brett'] });
    expect(antwortenPruefen({ wunsch: ['sonst'], wunsch_text: ' Dartscheiben-Tausch ' })).toEqual({ wunsch: ['sonst'], wunsch_text: 'Dartscheiben-Tausch' });
    expect(antwortenPruefen({ wunsch: ['forum'], wunsch_text: 'egal' })).toEqual({ wunsch: ['forum'] });
  });
});

describe('Folgefragen, Freitext und Tipps (Betreiber 15.11.2026)', () => {
  it('„😱 Warum nicht?“ nur bei Team Manager = Nein — sichtbar und gespeichert', () => {
    expect(sichtbareFragen(FRAGEN, { team_manager: 'ja' }).some(f => f.id === 'tm_nein')).toBe(false);
    expect(sichtbareFragen(FRAGEN, { team_manager: 'nein' }).some(f => f.id === 'tm_nein')).toBe(true);
    expect(antwortenPruefen({ team_manager: 'ja', tm_nein: 'stur' })).toEqual({ team_manager: 'ja' });
    expect(antwortenPruefen({ team_manager: 'nein', tm_nein: 'captain' })).toEqual({ team_manager: 'nein', tm_nein: 'captain' });
  });

  it('Freitext „Was würdest du besser machen?“ nur bei den passenden Antworten', () => {
    expect(antwortenPruefen({ zurecht: 'oft_nicht', zurecht_text: 'Menü' })).toEqual({ zurecht: 'oft_nicht', zurecht_text: 'Menü' });
    expect(antwortenPruefen({ zurecht: 'sehr', zurecht_text: 'Menü' })).toEqual({ zurecht: 'sehr' });
    expect(antwortenPruefen({ spielbericht: '2', spielbericht_text: 'x' })).toEqual({ spielbericht: '2', spielbericht_text: 'x' });
    expect(antwortenPruefen({ spielbericht: '1', spielbericht_text: 'x' })).toEqual({ spielbericht: '1', spielbericht_text: 'x' });
    expect(antwortenPruefen({ spielbericht: '3', spielbericht_text: 'x' })).toEqual({ spielbericht: '3' });
  });
});

describe('Einstieg (Betreiber 15.11.2026)', () => {
  it('zählt nicht als Frage und erscheint nicht in den Schritten, die Antwort wird aber gespeichert', () => {
    // 16 eigene Fragen + „Bock auf ein MDU-Tippspiel?“ (die anderen WM-Fragen hängen an einem „Ja“, zählen also nicht)
    expect(fragenZahl(FRAGEN)).toBe(17);
    expect(sichtbareFragen(FRAGEN, {}).some(f => f.id === 'einstieg')).toBe(false);
    expect(antwortenPruefen({ einstieg: 'muas', rolle: 'spieler' })).toEqual({ einstieg: 'muas', rolle: 'spieler' });
  });
});

describe('Rolle steuert Fragen und Optionen (Betreiber 15.11.2026)', () => {
  it('Fans überspringen Spielbericht und Team Manager, sehen kein „ich trage selbst live ein“', () => {
    const ids = sichtbareFragen(FRAGEN, { rolle: 'fan' }).map(f => f.id);
    expect(ids).not.toContain('spielbericht');
    expect(ids).not.toContain('team_manager');
    // 14 für Fans + die WM-Frage, die seit dem WM-Start (25.11.2026) hinten dranhängt
    expect(sichtbareFragen(FRAGEN, { rolle: 'fan' })).toHaveLength(15);
    const ticker = FRAGEN.find(f => f.id === 'ticker')!;
    expect(sichtbareOptionen(ticker, { rolle: 'fan' }).map(o => o.wert)).toEqual(['zuschauer', 'noch_nicht', 'kenne_nicht']);
    expect(antwortenPruefen({ rolle: 'fan', spielbericht: '5', ticker: 'eintragen' })).toEqual({ rolle: 'fan' });
  });
  it('Teamcaptain/Co-Captain bekommt bei „Warum nicht?“ kein „Ich sag’s dem Captain“', () => {
    const f = FRAGEN.find(x => x.id === 'tm_nein')!;
    expect(sichtbareOptionen(f, { rolle: 'tc', team_manager: 'nein' }).map(o => o.wert)).toEqual(['okay', 'stur']);
    expect(sichtbareOptionen(f, { rolle: 'spieler', team_manager: 'nein' }).map(o => o.wert)).toEqual(['okay', 'captain', 'stur']);
  });
});

describe('WM-Tippspiel-Umfrage', () => {
  it('bei „Nein“ nur die erste Frage, Folgefragen fliegen beim Prüfen raus', async () => {
    const { WM_FRAGEN, sichtbareFragen, antwortenPruefen } = await import('./umfrage');
    expect(sichtbareFragen(WM_FRAGEN, { wm_bock: 'nein' }).map(f => f.id)).toEqual(['wm_bock']);
    expect(antwortenPruefen({ wm_bock: 'nein', wm_einsatz: '10' }, WM_FRAGEN)).toEqual({ wm_bock: 'nein' });
  });
  it('bei „Ja“ alle vier, Einsatz nur aus den Optionen', async () => {
    const { WM_FRAGEN, sichtbareFragen, antwortenPruefen } = await import('./umfrage');
    expect(sichtbareFragen(WM_FRAGEN, { wm_bock: 'ja' }).map(f => f.id)).toEqual(['wm_bock', 'wm_konto', 'wm_einsatz', 'wm_wertung']);
    expect(antwortenPruefen({ wm_bock: 'ja', wm_konto: 'nein', wm_einsatz: '20', wm_wertung: 'liga' }, WM_FRAGEN)).toEqual({ wm_bock: 'ja', wm_konto: 'nein', wm_wertung: 'liga' });
  });
  it('Tipp je Antwort', async () => {
    const { WM_FRAGEN, tippFuer } = await import('./umfrage');
    const konto = WM_FRAGEN.find(f => f.id === 'wm_konto')!;
    expect(tippFuer(konto, 'nein')?.link?.href).toBe('/registrieren');
    expect(tippFuer(konto, 'ja')?.text).toMatch(/^Super/);
    expect(tippFuer(konto, 'vielleicht')).toBeUndefined();
  });
});

describe('WM-Umfrage läuft eine Woche ab Start', () => {
  it('7 Tage einschließlich Starttag', async () => {
    const { WM_UMFRAGE, umfrageEnde } = await import('./umfrage');
    const ende = new Date(WM_UMFRAGE.start + 'T12:00:00Z'); ende.setUTCDate(ende.getUTCDate() + 6);
    expect(umfrageEnde(WM_UMFRAGE)).toBe(ende.toISOString().slice(0, 10));
  });
});
