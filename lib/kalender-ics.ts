// ============================================================
// Spielplan eines Teams als Kalender (iCalendar, RFC 5545)
// ============================================================
//
// Ausgeliefert unter /kalender/<team-id>.ics (app/kalender/[datei]/route.ts),
// statisch beim Build erzeugt — kein ISR-Kontingent, neue Termine kommen mit
// dem nächsten Deploy. Wer den Kalender ABONNIERT (webcal://), bekommt
// Änderungen von selbst: Jedes Spiel hat eine feste UID (Begegnung Heim|Gast),
// der Kalender aktualisiert den Eintrag statt einen zweiten anzulegen.
//
// Nur öffentliche Angaben aus dem Spielplan (Teams, Termin, Spielort).
// ============================================================

import { alleBegegnungen27, team27, venue27, findLiga27, NEUE_SAISON } from '@/lib/data/saison-2027';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mdudarts.de';
/** Angenommene Dauer eines Spieltags (für das Ende des Termins). */
const DAUER_STD = 4;

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Zeilen auf 75 Bytes falten (RFC 5545 3.1). */
function falte(zeile: string): string {
  const bytes = new TextEncoder().encode(zeile);
  if (bytes.length <= 75) return zeile;
  const teile: string[] = [];
  let rest = zeile;
  let max = 75;
  while (new TextEncoder().encode(rest).length > max) {
    let n = Math.min(rest.length, max);
    while (new TextEncoder().encode(rest.slice(0, n)).length > max) n--;
    teile.push(rest.slice(0, n));
    rest = rest.slice(n);
    max = 74; // Folgezeilen beginnen mit einem Leerzeichen
  }
  teile.push(rest);
  return teile.join('\r\n ');
}

const lokal = (datum: string, zeit: string) => `${datum.replace(/-/g, '')}T${zeit.replace(':', '')}00`;
function plusStunden(datum: string, zeit: string, h: number): string {
  const [Y, M, D] = datum.split('-').map(Number), [hh, mm] = zeit.split(':').map(Number);
  const d = new Date(Date.UTC(Y, M - 1, D, hh + h, mm));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}00`;
}
const tagDanach = (datum: string) => {
  const d = new Date(datum + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
};

// Mitteleuropäische Zeit mit Sommerzeit — Google, Apple und Outlook lesen TZID
// zuverlässiger, wenn die Zone mitgeliefert wird.
const VTIMEZONE = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Berlin',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

export function teamKalender(teamId: string, jetzt = new Date()): string | null {
  const t = team27(teamId);
  if (!t) return null;
  const liga = findLiga27(t.league);
  const stamp = jetzt.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const zeilen: string[] = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Münchner Dart Union//Spielplan//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(`${t.name} – ${liga?.name ?? 'MDU'} ${NEUE_SAISON.name}`)}`,
    'X-WR-TIMEZONE:Europe/Berlin',
    // Abonnements fragen damit etwa alle 12 Stunden nach (Apple/Outlook; Google bestimmt selbst).
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H',
    ...VTIMEZONE,
  ];

  for (const b of alleBegegnungen27()) {
    if (b.home !== teamId && b.away !== teamId) continue;
    const heim = b.home === teamId;
    const gegner = team27(heim ? b.away : b.home)?.name ?? '';
    const ort = venue27(team27(b.home)?.venueId);
    const termin = b.termin;
    const titel = `${team27(b.home)?.name} – ${team27(b.away)?.name}${termin?.vorlaeufig ? ' (Termin wird geprüft)' : ''}`;
    const info = [
      `${liga?.name ?? ''} · ${b.spieltag}. Spieltag · ${heim ? 'Heimspiel' : `Auswärtsspiel bei ${gegner}`}${b.derby ? ' · Derby' : ''}`,
      termin ? (termin.uhrzeit ? '' : 'Uhrzeit folgt.') : `Genauer Termin folgt – Spielwochenende ${b.fri.slice(8)}.${b.fri.slice(5, 7)}.–${b.sun.slice(8)}.${b.sun.slice(5, 7)}.`,
      `Spielplan: ${SITE}/teams/${teamId}`,
    ].filter(Boolean).join('\n');

    zeilen.push('BEGIN:VEVENT', `UID:mdu-2027-${b.key.replace('|', '--')}@mdudarts.de`, `DTSTAMP:${stamp}`);
    if (termin?.uhrzeit) {
      zeilen.push(`DTSTART;TZID=Europe/Berlin:${lokal(termin.datum, termin.uhrzeit)}`, `DTEND;TZID=Europe/Berlin:${plusStunden(termin.datum, termin.uhrzeit, DAUER_STD)}`);
    } else if (termin) {
      zeilen.push(`DTSTART;VALUE=DATE:${termin.datum.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${tagDanach(termin.datum)}`);
    } else {
      // Ohne festen Termin: ganztägig über das Spielwochenende
      zeilen.push(`DTSTART;VALUE=DATE:${b.fri.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${tagDanach(b.sun)}`, 'TRANSP:TRANSPARENT');
    }
    zeilen.push(`SUMMARY:${esc(titel)}`, `DESCRIPTION:${esc(info)}`, `URL:${SITE}/teams/${teamId}`);
    if (ort) zeilen.push(`LOCATION:${esc(ort.address ? `${ort.name}, ${ort.address}` : ort.name)}`);
    zeilen.push('END:VEVENT');
  }
  zeilen.push('END:VCALENDAR');
  return zeilen.map(falte).join('\r\n') + '\r\n';
}
