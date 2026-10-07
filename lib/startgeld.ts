// ============================================================
// Startgeld je Team — eine Rechnung für Kapitänsansicht, Admin und Server
// ============================================================
//
// Grundsatz: 20 € je Spieler + 20 € je Mannschaft. Nachmeldungen kosten
// ebenfalls 20 € — ab Saisonstart (erster Spieltag) 25 €. Maßgeblich ist der
// Tag der MELDUNG (player_nominations.created_at), nicht der Freigabe: Wie lange
// die Ligaleitung zum Bestätigen braucht, geht nicht zu Lasten des Teams.
//
// Der Betrag wird gerechnet, nicht abgelegt — so stimmt er nach jeder
// Kaderänderung. Abgelegt wird nur, wie viel beim „bezahlt"-Setzen fällig war
// (season_team_payments.paid_amount). Kommt danach eine Nachmeldung dazu, ist
// die Differenz offen.
// ============================================================

import { SAISON_START } from '@/lib/data/saison-2027';

/** Startgeld je Spieler (Anmeldung und Nachmeldung vor Saisonstart). */
export const PLAYER_FEE_EUR = 20;
/** Mannschaftsbeitrag, einmal je Team. */
export const TEAM_FEE_EUR = 20;
/** Nachmeldung ab Saisonstart. */
export const LATE_NOMINATION_FEE_EUR = 25;

/**
 * Ab welchem Tag (YYYY-MM-DD) eine Nachmeldung den höheren Satz kostet.
 * Saison 2026/27: erster Spieltag (Wochenende ab 23.10.2026). Für ältere
 * Saisons gab es die Regel nicht — dort bleibt alles bei 20 €.
 */
export function lateNominationFrom(seasonId: string): string | null {
  return seasonId === 'season-2027' ? SAISON_START : null;
}

/** Ein Kadermitglied für die Rechnung: Nachmeldungen tragen ihr Meldedatum. */
export interface FeeMember {
  /** Gesetzt nur bei Nachmeldungen (ISO-Zeitpunkt der Meldung). */
  nominatedAt?: string | null;
  /** Nachmeldung, aber Datum nicht lesbar → wie vor Saisonstart gerechnet. */
  isNomination?: boolean;
}

export interface TeamFee {
  /** Spieler zum Grundsatz (Anmeldung + frühe Nachmeldungen). */
  regular: number;
  /** Davon Nachmeldungen vor Saisonstart (nur zur Anzeige). */
  earlyNominations: number;
  /** Nachmeldungen ab Saisonstart (höherer Satz). */
  lateNominations: number;
  /** Fälliger Gesamtbetrag in Euro (0 bei leerem Kader). */
  total: number;
}

/** Datum in Münchner Zeit (YYYY-MM-DD) — eine Meldung um 0:30 Uhr zählt zum neuen Tag. */
function berlinDay(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(iso));
}

export function computeTeamFee(seasonId: string, members: FeeMember[]): TeamFee {
  const from = lateNominationFrom(seasonId);
  let regular = 0, earlyNominations = 0, lateNominations = 0;
  for (const m of members) {
    const nominated = m.isNomination || !!m.nominatedAt;
    if (nominated && from && m.nominatedAt && berlinDay(m.nominatedAt) >= from) lateNominations += 1;
    else {
      regular += 1;
      if (nominated) earlyNominations += 1;
    }
  }
  const count = regular + lateNominations;
  const total = count > 0 ? regular * PLAYER_FEE_EUR + lateNominations * LATE_NOMINATION_FEE_EUR + TEAM_FEE_EUR : 0;
  return { regular, earlyNominations, lateNominations, total };
}

/** Rechenweg als Text, z. B. „10 × 20 € + 2 Nachmeldungen × 25 € + 20 € Team = 290 €". */
export function feeBreakdown(fee: TeamFee): string {
  const parts = [`${fee.regular} × ${PLAYER_FEE_EUR} €`];
  if (fee.lateNominations) parts.push(`${fee.lateNominations} ${fee.lateNominations === 1 ? 'Nachmeldung' : 'Nachmeldungen'} × ${LATE_NOMINATION_FEE_EUR} €`);
  return `${parts.join(' + ')} + ${TEAM_FEE_EUR} € Team = ${fee.total} €`;
}

/**
 * Offener Betrag. Nicht bezahlt → alles. Bezahlt → was seitdem dazukam.
 * Ohne gespeicherten Betrag (Markierung von vor der Umstellung) gilt der
 * damalige Stand als voll bezahlt — dafür werden die alten Zeilen beim Umstieg
 * einmal mit dem damals fälligen Betrag befüllt.
 */
export function openAmount(total: number, paid: boolean, paidAmount: number | null): number {
  if (!paid) return total;
  if (paidAmount == null) return 0;
  return Math.max(0, total - paidAmount);
}
