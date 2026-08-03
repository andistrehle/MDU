/**
 * Zentrale App-Konfiguration.
 * Der Produktname ist bewusst nur hier definiert und damit zentral austauschbar.
 */
export const APP_NAME = 'FoodPoints';

export const APP_DESCRIPTION =
  'Ernährungstagebuch mit transparentem, konfigurierbarem Punktesystem — ' +
  'Lebensmittel suchen, scannen oder fotografieren und dein Tagesbudget im Blick behalten.';

/** Hinweistext, der bei jeder KI-Erkennung angezeigt werden MUSS. */
export const AI_ESTIMATE_DISCLAIMER =
  'Die Erkennung und Mengenbestimmung ist eine KI-gestützte Schätzung. ' +
  'Bitte prüfe alle Angaben vor dem Speichern.';

/** Hinweistext zu Budget/Zielen (keine medizinische Beratung). */
export const BUDGET_DISCLAIMER =
  'Dein Punktebudget ist eine allgemeine Schätzung auf Basis deiner Angaben — ' +
  'keine medizinische Beratung. Bei gesundheitlichen Fragen wende dich bitte an ' +
  'ärztliches Fachpersonal.';

/** Kennzeichnung der Formel (rechtlich wichtig: eigene Näherungsformel). */
export const FORMULA_DISCLAIMER =
  'Die Punkte werden mit der eigenen, offen dokumentierten FoodPoints-Näherungsformel ' +
  'berechnet. Sie ist kein Nachbau des Punktesystems eines anderen Anbieters.';
