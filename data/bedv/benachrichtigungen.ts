// ============================================================
// BeDV-Demo — Benachrichtigungen (Glocke im Kopfbereich)
// ============================================================
//
// Reine Oberflächen-Demo: Es wird nichts verschickt und nichts gespeichert.
// Die Liste hängt an der gewählten Demo-Rolle, damit im Gespräch sichtbar
// wird, dass jede Rolle ihre eigenen Vorgänge sieht.
// ============================================================

import type { Benachrichtigung } from './typen';
import type { DemoRolle } from './typen';

export const BENACHRICHTIGUNGEN: Benachrichtigung[] = [
  {
    id: 'meldung-freigegeben',
    rollen: ['kapitaen', 'spieler'],
    titel: 'Mannschaftsmeldung freigegeben',
    text: 'Ghost Darts ist für die Winterliga 2026/27 in der B1-Liga gemeldet.',
    vorTagen: 0,
    art: 'erfolg',
    ziel: '/mein-bereich/mannschaft',
  },
  {
    id: 'spielbericht-offen',
    rollen: ['kapitaen'],
    titel: 'Spielbericht fehlt noch',
    text: 'Für die Begegnung am letzten Spieltag liegt noch kein Bericht vor.',
    vorTagen: 1,
    art: 'aktion',
    ziel: '/mein-bereich/spielbericht',
  },
  {
    id: 'spieler-zugeordnet',
    rollen: ['spieler'],
    titel: 'Du wurdest einem Kader zugeordnet',
    text: 'Dein Mannschaftsführer hat dich für die Rückrunde gemeldet.',
    vorTagen: 2,
    art: 'info',
    ziel: '/mein-bereich',
  },
  {
    id: 'naechstes-spiel',
    rollen: ['kapitaen', 'spieler'],
    titel: 'Nächstes Spiel',
    text: 'Am kommenden Spieltag geht es auswärts weiter — Anfahrt im Mannschaftsprofil.',
    vorTagen: 2,
    art: 'info',
    ziel: '/mein-bereich',
  },
  {
    id: 'meldungen-warten',
    rollen: ['ligaleitung', 'admin'],
    titel: '3 Mannschaftsmeldungen warten auf Prüfung',
    text: 'Zwei Nachmeldungen und eine neue Mannschaft für die C3-Liga.',
    vorTagen: 0,
    art: 'aktion',
    ziel: '/ligaleitung',
  },
  {
    id: 'berichte-warten',
    rollen: ['ligaleitung', 'admin'],
    titel: '2 Spielberichte eingereicht',
    text: 'Ein Bericht wurde digital erfasst, einer als Foto hochgeladen.',
    vorTagen: 1,
    art: 'aktion',
    ziel: '/ligaleitung',
  },
  {
    id: 'protest',
    rollen: ['ligaleitung', 'admin'],
    titel: 'Protest eingegangen',
    text: 'Eine Mannschaft beanstandet die Automateneinstellung einer Begegnung.',
    vorTagen: 3,
    art: 'info',
    ziel: '/ligaleitung',
  },
  {
    id: 'zugang-angelegt',
    rollen: ['admin'],
    titel: 'Neuer Zugang angelegt',
    text: 'Für die Sommerliga wurde eine zweite Spielleitung eingerichtet.',
    vorTagen: 4,
    art: 'info',
  },
];

export function benachrichtigungenFuer(rolle: DemoRolle): Benachrichtigung[] {
  return BENACHRICHTIGUNGEN
    .filter(b => b.rollen.includes(rolle))
    .sort((a, b) => a.vorTagen - b.vorTagen);
}
