// ============================================================
// Tennis Kail — Wettersimulation und Platzstatus
// ============================================================
//
// EHRLICH GESAGT: Hier hängt kein echter Wetterdienst dran. Die Demo
// erzeugt ein deterministisches, jahreszeitlich plausibles Wetter aus dem
// Datum — dieselbe Eingabe liefert immer dieselbe Ausgabe, damit Server
// und Browser übereinstimmen und eine Vorführung reproduzierbar bleibt.
// Die Oberfläche kennzeichnet das an jeder Stelle als Simulation.
//
// Interessant ist nicht das Wetter selbst, sondern was daraus folgt:
// Sandplätze sind nach Regen nicht sofort wieder bespielbar, die Halle ist
// immer bespielbar. Genau diese Ableitung — `courtStatusFor()` — bliebe in
// der Produktivversion unverändert; ausgetauscht würde nur die Datenquelle
// (z. B. Open-Meteo, kostenlos und ohne Schlüssel, Koordinaten stehen in
// data/tk/facility.ts).
// ============================================================

import type { Court, CourtStatus, WeatherDay, WeatherHour, WeatherSymbol } from '@/lib/tk/types';
import { formatTime } from './format';

/** Deterministischer Hash (FNV-1a) → 0..1. */
function rand01(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0xffffffff;
}

/** Tag im Jahr, grob — reicht für den Jahresgang. */
function dayOfYear(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  const start = Date.UTC(y, 0, 1);
  return Math.round((Date.UTC(y, m - 1, d) - start) / 86_400_000);
}

/** Jahresgang der Temperatur für München: Minimum im Januar, Maximum im Juli. */
function seasonalTemp(iso: string): { min: number; max: number } {
  const doy = dayOfYear(iso);
  const phase = Math.cos(((doy - 200) / 365) * 2 * Math.PI);
  const mid = 9.5 + 9.5 * phase; // ≈ 0 °C im Januar, ≈ 19 °C im Juli
  const swing = 6 + 3 * Math.max(0, phase);
  const jitter = (rand01(iso + 'temp') - 0.5) * 7;
  return { min: Math.round(mid - swing / 2 + jitter), max: Math.round(mid + swing / 2 + jitter) };
}

function symbolFor(rainChance: number, tempMax: number, thunder: boolean): WeatherSymbol {
  if (tempMax <= 1 && rainChance > 45) return 'schnee';
  if (thunder && rainChance > 55) return 'gewitter';
  if (rainChance > 70) return 'regen';
  if (rainChance > 45) return 'schauer';
  if (rainChance > 25) return 'bedeckt';
  if (rainChance > 12) return 'wolkig';
  return 'sonne';
}

export const WEATHER_LABEL: Record<WeatherSymbol, string> = {
  sonne: 'Sonnig',
  wolkig: 'Leicht bewölkt',
  bedeckt: 'Bedeckt',
  schauer: 'Schauer möglich',
  regen: 'Regen',
  gewitter: 'Gewitter',
  schnee: 'Schnee',
};

/** Tagesvorhersage aus dem Datum ableiten. Immer dasselbe Ergebnis pro Datum. */
export function weatherForDay(iso: string): WeatherDay {
  const { min, max } = seasonalTemp(iso);
  const base = rand01(iso + 'rain');
  // Sommer in München: häufiger kurze, kräftige Schauer statt Dauerregen.
  const doy = dayOfYear(iso);
  const summer = Math.max(0, Math.cos(((doy - 200) / 365) * 2 * Math.PI));
  // Die Potenz schiebt die Verteilung nach unten: die meisten Tage sind
  // trocken, Regentage bleiben die Ausnahme. Eine Gleichverteilung hätte
  // jeden zweiten Tag verregnet — das wäre weder München noch brauchbar.
  const rainChance = Math.round(Math.min(95, Math.pow(base, 2.4) * 100 * (0.7 + 0.45 * summer)));
  const thunder = summer > 0.5 && rand01(iso + 'thunder') > 0.72;
  const rainMm = rainChance > 45 ? Math.round(rand01(iso + 'mm') * 90) / 10 : 0;
  const symbol = symbolFor(rainChance, max, thunder);

  const hours: WeatherHour[] = [];
  for (let m = 6 * 60; m <= 22 * 60; m += 60) {
    const t = m / 60;
    // Tagesgang: kühl früh, Maximum gegen 16 Uhr.
    const curve = Math.sin(((t - 5) / 18) * Math.PI);
    const tempC = Math.round(min + (max - min) * Math.max(0, curve));
    const hourNoise = rand01(`${iso}|${m}|h`);
    // Schauer konzentrieren sich nachmittags.
    const peak = t >= 14 && t <= 19 ? 1.35 : 0.75;
    const hourRain = Math.round(Math.min(98, rainChance * peak * (0.55 + hourNoise * 0.9)));
    hours.push({
      minute: m,
      tempC,
      rainChance: hourRain,
      rainMm: hourRain > 55 ? Math.round(rainMm * (0.4 + hourNoise) * 10) / 10 : 0,
      windKmh: Math.round(6 + hourNoise * 22),
      symbol: symbolFor(hourRain, tempC, thunder),
    });
  }

  return { date: iso, minC: min, maxC: max, rainChance, rainMm, symbol, hours };
}

/** Mehrtägige Vorhersage ab einem Datum. */
export function forecast(fromIso: string, days: number): WeatherDay[] {
  const out: WeatherDay[] = [];
  const [y, m, d] = fromIso.split('-').map(Number);
  for (let i = 0; i < days; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    out.push(weatherForDay(dt.toISOString().slice(0, 10)));
  }
  return out;
}

/**
 * Platzstatus aus dem Wetter ableiten.
 *
 * Regeln (bewusst konservativ, wie sie ein Platzwart anwenden würde):
 *   • Halle: immer bespielbar.
 *   • Sand ab 8 mm Regen am Tag oder > 75 % Regenwahrscheinlichkeit: gesperrt.
 *   • Sand bei 3–8 mm oder > 55 %: feucht, spielbar mit Einschränkung.
 *   • Unter 2 °C Höchsttemperatur: Freiplätze zu (Frost).
 *   • Zwischen November und März sind die Freiplätze ohnehin außer Betrieb.
 */
export function courtStatusFor(court: Court, iso: string, weather = weatherForDay(iso)): CourtStatus {
  if (court.kind === 'halle') {
    return {
      courtId: court.id,
      condition: 'bespielbar',
      headline: 'Bespielbar',
      detail: 'Halle, beheizt — wetterunabhängig.',
    };
  }

  const month = Number(iso.split('-')[1]);
  if (month >= 11 || month <= 3) {
    return {
      courtId: court.id,
      condition: 'geschlossen',
      headline: 'Winterpause',
      detail: 'Die Sandplätze sind von November bis März außer Betrieb.',
      suggestion: 'In der Halle ist zur selben Zeit gespielt.',
    };
  }

  if (weather.maxC <= 2) {
    return {
      courtId: court.id,
      condition: 'gesperrt',
      headline: 'Frost',
      detail: `Höchstens ${weather.maxC} °C — der Belag bleibt gefroren.`,
      suggestion: 'Halle ausweichen.',
    };
  }

  if (weather.rainMm >= 8 || weather.rainChance > 75) {
    const worst = weather.hours.reduce((a, b) => (b.rainChance > a.rainChance ? b : a));
    return {
      courtId: court.id,
      condition: 'gesperrt',
      headline: 'Wegen Regen gesperrt',
      detail: `${weather.rainChance} % Regenwahrscheinlichkeit, bis zu ${weather.rainMm} mm — Hauptzeit gegen ${formatTime(worst.minute)}.`,
      suggestion: 'Buchungen werden automatisch gutgeschrieben. Halle ist frei buchbar.',
    };
  }

  if (weather.rainMm >= 3 || weather.rainChance > 55) {
    return {
      courtId: court.id,
      condition: 'feucht',
      headline: 'Feucht, aber bespielbar',
      detail: `${weather.rainChance} % Regenwahrscheinlichkeit. Der Platz ist abgezogen, kann aber rutschig sein.`,
      suggestion: 'Bei Schauer wird kurzfristig gesperrt — du bekommst eine Nachricht.',
    };
  }

  return {
    courtId: court.id,
    condition: 'bespielbar',
    headline: 'Bespielbar',
    detail: `${weather.maxC} °C, ${WEATHER_LABEL[weather.symbol].toLowerCase()} — Platz frisch abgezogen.`,
  };
}

/** Zusammenfassung über eine Platzgruppe für die Statusleiste. */
export function summariseStatus(
  courts: Court[],
  iso: string,
): { open: number; limited: number; closed: number; headline: string } {
  const weather = weatherForDay(iso);
  let open = 0;
  let limited = 0;
  let closed = 0;
  for (const c of courts) {
    const s = courtStatusFor(c, iso, weather);
    if (s.condition === 'bespielbar') open++;
    else if (s.condition === 'feucht') limited++;
    else closed++;
  }
  const headline =
    closed === 0 && limited === 0
      ? 'Alle Plätze bespielbar'
      : closed > 0 && open === 0
        ? 'Draußen gesperrt — Halle offen'
        : `${open + limited} von ${courts.length} Plätzen bespielbar`;
  return { open, limited, closed, headline };
}
