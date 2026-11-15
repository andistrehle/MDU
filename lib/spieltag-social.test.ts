// Tests: Facebook-Überschrift (lib/spieltag-social.ts), Betreiber 15.11.2026.
// Erwartung von Hand: A–Z ab U+1D5D4, a–z ab U+1D5EE, 0–9 ab U+1D7EC; Umlaut = fetter Grundbuchstabe + U+0308.
import { describe, expect, it } from 'vitest';
import { facebookKopf, fettSchrift } from './spieltag-social';

describe('fettSchrift', () => {
  it('Buchstaben und Ziffern werden fett, alles andere bleibt', () => {
    expect(fettSchrift('Ab 9:9!')).toBe('\u{1D5D4}\u{1D5EF} \u{1D7F5}:\u{1D7F5}!');
  });
  it('Umlaute aus Grundbuchstabe + Trema, ß und Emoji unverändert', () => {
    expect(fettSchrift('Ü')).toBe('\u{1D5E8}\u0308');
    expect(fettSchrift('ö')).toBe('\u{1D5FC}\u0308');
    expect(fettSchrift('ß 🎯')).toBe('ß 🎯');
  });
  it('Kopf: fett zwischen zwei Dartscheiben', () => {
    expect(facebookKopf(' MDU ')).toBe('🎯 \u{1D5E0}\u{1D5D7}\u{1D5E8} 🎯');
  });
});
