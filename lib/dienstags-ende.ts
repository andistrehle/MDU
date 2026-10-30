/** Dienstag 23:59:59 (Berlin) nach dem Datum — Ende einer Vertretung für einen Spieltag. */
export function dienstagsEnde(datum: string): string {
  const d = new Date(`${datum}T12:00:00Z`);
  const bis = (2 - d.getUTCDay() + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + bis);
  const tag = d.toISOString().slice(0, 10);
  // Offset von Berlin an diesem Tag (Winter +01:00, Sommer +02:00).
  const off = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', timeZoneName: 'shortOffset' })
    .formatToParts(new Date(`${tag}T12:00:00Z`)).find(p => p.type === 'timeZoneName')?.value ?? 'GMT+1';
  const h = Number(off.replace('GMT', '')) || 1;
  return new Date(`${tag}T23:59:59+0${h}:00`).toISOString();
}
