// ============================================================
// Spielstätten-Abgleich (rein, ohne DB) — verhindert doppelte Einträge in
// `venues`. Genutzt bei der Freigabe einer Anmeldung (registrations.ts) und
// beim Ändern der Spielstätte eines Saison-Teams (season-teams.ts).
// Kanonisches Format im Bestand: „Straße Hsnr., PLZ Ort".
// ============================================================

/** Locker normalisieren für Spielstätten-Abgleich: Groß/klein, ß→ss,
 *  „straße"/„strasse"→„str", alle Sonderzeichen/Leerzeichen raus.
 *  So matchen „Gleichmannstr.6" und „Gleichmannstraße 6". */
export function normalizeLoose(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/ß/g, 'ss').replace(/strasse/g, 'str').replace(/[^a-z0-9]/g, '');
}

/** Adresse zerlegen: Straße+Hausnummer (Teil vor dem ersten Komma bzw. vor
 *  der PLZ, locker normalisiert) und PLZ (erste fünfstellige Zahl danach).
 *  „Poststr. 2, 85586 Poing" → { street: 'poststr2', plz: '85586' },
 *  „Poststr. 2" → { street: 'poststr2', plz: null }. */
function splitAddress(s: string | null | undefined): { street: string; plz: string | null } {
  const raw = (s ?? '').trim();
  const plzMatch = raw.match(/(?:^|[\s,])(\d{5})(?=\s|$)/);
  const streetPart = raw.split(',')[0].replace(/\s\d{5}(\s.*)?$/, '');
  return { street: normalizeLoose(streetPart), plz: plzMatch ? plzMatch[1] : null };
}

/** Passende Spielstätte im Bestand suchen (Schreibweisen-tolerant).
 *  Kanonisches Format im Bestand: „Straße Hsnr., PLZ Ort". Die Anmeldung
 *  bringt die PLZ oft nicht mit — verglichen wird deshalb Straße+Hausnummer;
 *  die PLZ zählt nur, wenn BEIDE eine haben (dann muss sie gleich sein).
 *  Reihenfolge: Name + Straße → nur Name (eindeutig) → nur Straße (eindeutig,
 *  z. B. umbenanntes Lokal). Mehrdeutig → kein Treffer, lieber neu anlegen
 *  als falsch zuordnen. `byStreet: false` schaltet den letzten Schritt ab. */
export function findMatchingVenue<V extends { name: string; address: string | null }>(
  venues: V[], name: string | null | undefined, address: string | null | undefined,
  opts: { byStreet?: boolean } = {},
): V | null {
  const nName = normalizeLoose(name);
  const a = splitAddress(address);
  const sameStreet = (v: V) => {
    const b = splitAddress(v.address);
    return !!a.street && a.street === b.street && (!a.plz || !b.plz || a.plz === b.plz);
  };
  const byName = venues.filter(v => nName && normalizeLoose(v.name) === nName);
  const both = byName.filter(sameStreet);
  if (both.length === 1) return both[0];
  if (both.length > 1) return null;
  // Name gleich, Adresse fehlt in der Anmeldung → Name reicht, wenn eindeutig.
  if (byName.length === 1 && !a.street) return byName[0];
  // Nur-Straße ist abschaltbar: Wer einem Team bewusst einen neuen Namen
  // einträgt, soll nicht still das alte Lokal an derselben Adresse bekommen.
  if (opts.byStreet === false) return null;
  const byStreet = venues.filter(sameStreet);
  if (byName.length === 0 && byStreet.length === 1) return byStreet[0];
  return null;
}
