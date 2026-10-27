// ============================================================
// Team Manager als Premium — Preise, Zahlungswege, Sichtbarkeit
// ============================================================
//
// Vom Betreiber festgelegt (17.10.2026):
//   • Verkäufer: der Betreiber privat/gewerblich (NICHT die MDU) → vor dem
//     Start Impressum-Angabe, Abo-Bedingungen + Widerruf, Datenschutz-Absatz
//     (Rechtstexte nur auf Anweisung, anwaltlich prüfen).
//   • Preis je Team: Saisonpass 49 € ODER 8,99 € im Monat (monatlich einzeln;
//     bis 27.10.2026 waren es 7,99 €).
//   • 14 Tage gratis testen, je Team einmal, startet beim ersten Klick.
//   • Bezahlen zunächst MANUELL (PayPal / Überweisung, mehrere Wege), der
//     Betreiber schaltet unter Admin → Premium frei. Stripe folgt später und
//     schreibt dann dieselbe Tabelle (Migration 0052, team_premium).
//   • NOCH NICHT ÖFFENTLICH: Upgrade-Seite und Admin-Ansicht sieht nur der
//     Super-Admin als Vorschau (PREMIUM_OEFFENTLICH = false). Knöpfe tun dort
//     nichts. Bis zum Start bleibt die Freischaltung in lib/features.ts.
// ============================================================

import { hasRole, type UserProfile } from '@/lib/auth/roles';

/** Erst auf true, wenn Zahlungsdaten, Rechtstexte und Migration 0052 stehen. */
export const PREMIUM_OEFFENTLICH = false;

/** Vorschau sehen: bis zum Start nur der Super-Admin. */
export const premiumVorschau = (user: Pick<UserProfile, 'role'> | null | undefined) =>
  !!user && hasRole(user as UserProfile, 'super_admin');

export const TESTTAGE = 14;

export const PREISE = {
  saison: { cents: 4900, name: 'Saisonpass', zeile: 'einmal pro Saison', hinweis: 'gilt bis Saisonende' },
  monat: { cents: 899, name: 'Monatlich', zeile: 'pro Monat', hinweis: 'jeden Monat neu, jederzeit beendbar' },
} as const;
export type PremiumModell = keyof typeof PREISE;

/** Zahlungswege (Betreiber, 17.10.2026). IBAN folgt noch — bis dahin Platzhalter. Keine Barzahlung. */
export const ZAHLUNG = {
  paypal: { aktiv: true, empfaenger: 'paypal.me/AndreasStrehle', me: 'AndreasStrehle' },
  ueberweisung: { aktiv: true, inhaber: 'folgt (Kontoinhaber)', iban: 'folgt (IBAN)' },
};

/** paypal.me-Link mit Betrag (öffnet PayPal mit vorbelegtem Betrag). */
export const paypalLink = (cents: number) => `https://www.paypal.com/paypalme/${ZAHLUNG.paypal.me}/${(cents / 100).toFixed(2)}EUR`;

export const verwendungszweck = (teamName: string, modell: PremiumModell, saisonName: string) =>
  `Team Manager ${teamName} ${modell === 'saison' ? saisonName : 'Monat'}`;

export const euroText = (cents: number) => (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

/** Was der Team Manager kann — für die Upgrade-Seite. Nur, was es wirklich gibt. */
export const LEISTUNGEN: { titel: string; text: string }[] = [
  { titel: 'Dashboard', text: 'Nächstes Spiel mit Countdown, wer dabei ist, Kasse und Aufgaben auf einen Blick.' },
  { titel: 'Zu- und Absagen', text: 'Jeder sagt mit einem Tipp zu, mit Begründung bei Absage. Du siehst sofort, wer kommt.' },
  { titel: 'Aufstellung', text: 'Aus den Zusagen H1–H8 aufstellen und in den Spielbericht übernehmen.' },
  { titel: 'Eigene Termine', text: 'Pokal, andere Ligen, Training – eintragen oder aus Excel importieren.' },
  { titel: 'Teamkasse', text: 'Strafenkatalog, Beiträge, Kassenbuch und wer was offen hat.' },
  { titel: 'Gegneranalyse', text: 'Tabelle, Form, direkter Vergleich und die besten Spieler des nächsten Gegners.' },
  { titel: 'Statistik', text: 'Wer wie oft zugesagt und gespielt hat – deine Quote im Vergleich zum Team.' },
];
