// ============================================================
// MDC — Anbieterangaben für Impressum und Datenschutz
// ============================================================
//
// Die Pflichtangaben nach § 5 DDG und § 18 Abs. 2 MStV stehen an EINER Stelle,
// nicht verteilt über zwei Seiten: Impressum, Datenschutzhinweise und die
// Kontaktseite ziehen sie von hier. Damit können sie gar nicht auseinander
// laufen.
//
// Diese Angaben werden NICHT erfunden. Solange sie fehlen, gilt:
//
//   • `MDC_LEGAL_COMPLETE` ist falsch,
//   • Impressum und Datenschutz weisen die Lücke sichtbar aus,
//   • und die Seite bleibt für Suchmaschinen gesperrt (siehe `lib/mdc/site.ts`).
//
// Erst wenn hier alles steht, kann die Seite indexiert werden. Das ist Absicht:
// Eine öffentlich auffindbare Seite mit echten Personennamen ohne Impressum
// wäre ein Abmahnrisiko und schlicht nicht in Ordnung.
// ============================================================

export interface MdcLegal {
  /** Anbieter — Person oder Zusammenschluss, der die Seite betreibt. */
  operator: string;
  /** Rechtsform, falls zutreffend („nicht eingetragener Verein"). Sonst leer. */
  legalForm: string;
  /** Vertretungsberechtigte Person(en). */
  representedBy: string;
  street: string;
  zipCity: string;
  /** Pflichtangabe: E-Mail für Kontakt, Auskunft und Widerspruch. */
  email: string;
  /** Optional — nur ausfüllen, wenn die Nummer öffentlich stehen soll. */
  phone: string;
  /** Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV. */
  contentResponsible: string;
  /** Stand der Rechtstexte, z. B. „September 2026". */
  updated: string;
}

// Vom Betreiber bestätigt: Anschrift und Kontakt wie bei der MDU
// (`app/impressum/page.tsx`), Anbieter ist aber die Turnierserie selbst —
// Munich Darts Challenge, vertreten durch Anton Bauer.
export const MDC_LEGAL: MdcLegal = {
  operator: 'Munich Darts Challenge',
  legalForm: 'nicht eingetragener Verein',
  representedBy: 'Anton Bauer',
  street: 'Zenettistraße 30',
  zipCity: '80337 München',
  email: 'kontakt@mdudarts.de',
  // Leer lassen, solange keine Nummer öffentlich stehen soll — Pflicht ist sie
  // nicht, eine E-Mail-Adresse genügt.
  phone: '',
  contentResponsible: 'Anton Bauer',
  updated: 'September 2026',
};

/** Stehen alle Pflichtangaben? Ohne sie darf die Seite nicht indexiert werden. */
export const MDC_LEGAL_COMPLETE = Boolean(
  MDC_LEGAL.operator
  && MDC_LEGAL.street
  && MDC_LEGAL.zipCity
  && MDC_LEGAL.email
  && MDC_LEGAL.contentResponsible,
);

/**
 * Platzhalter für eine noch fehlende Angabe — sichtbar, nicht ausgedacht.
 * So sieht man auf der Seite selbst, was noch fehlt.
 */
export function legal(value: string, label: string): string {
  return value || `[${label}]`;
}
