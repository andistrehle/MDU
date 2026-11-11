// Tests: Antworten prüfen (lib/umfrage.ts) — nur reine Rechnung, kein Netz.
import { describe, expect, it } from 'vitest';
import { FRAGEN, TM_FRAGEN, TM_UMFRAGE, UMFRAGE, antwortenPruefen, findeUmfrage, umfrageEnde, umfrageLaeuft } from './umfrage';

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
  it('Standard = Website-Fragen, noch nicht gestartet, 14 Tage', () => {
    expect(antwortenPruefen({ rolle: 'tc', grund: ['test'] })).toEqual({ rolle: 'tc' });
    expect(umfrageLaeuft(new Date('2026-11-12T12:00:00Z'))).toBe(UMFRAGE.live);
    expect(umfrageEnde()).toBe('2026-11-22');
    expect(findeUmfrage(undefined)).toBeUndefined();
    expect(findeUmfrage('website-2026-11')?.fragen).toBe(FRAGEN);
  });
});
