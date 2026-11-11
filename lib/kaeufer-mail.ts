// ============================================================
// Dankes-Mail an Käufer des Team Managers (Betreiber, 11.11.2026)
// ============================================================
// Geht EINMAL je Team beim ersten bezahlten Kauf raus (lib/server/kaeufer-mail.ts):
// Dank + Bitte um die kurze Umfrage /umfrage/team-manager. Hier nur der Text.
// ============================================================

import { TM_UMFRAGE } from './umfrage';

export function kaeuferMailText(o: { vorname: string | null; team: string; paket: string; site: string }): { betreff: string; text: string } {
  const anrede = o.vorname ? `Servus ${o.vorname},` : 'Servus,';
  return {
    betreff: 'Danke für deinen Kauf – der Team Manager gehört euch',
    text: `${anrede}

vielen Dank, dass du dich für den Team Manager entschieden hast! Er ist für ${o.team} freigeschaltet (${o.paket}) – Zu- und Absagen, Aufstellung, Termine, Teamkasse und Statistik stehen jetzt deinem ganzen Team zur Verfügung.

Ich baue die Plattform nebenher und möchte sie so gut machen, dass sie euch im Alltag wirklich hilft. Würdest du an einer ganz kurzen Umfrage teilnehmen? Etwa 2 Minuten, nur Klicks und ein paar freiwillige Felder:

${o.site}${TM_UMFRAGE.pfad}

Ob du deinen Namen dazuschreibst, entscheidest du selbst.

Und falls mal etwas hakt oder dir etwas fehlt: Antworte einfach auf diese Mail, dann kümmere ich mich darum.

Viele Grüße und gut Darts
Andi
Münchner Dart Union
`,
  };
}
