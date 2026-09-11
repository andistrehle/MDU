// ============================================================
// MDC — Wochenlauf: Rangliste für Facebook
// ============================================================
//
// Läuft montags über GitHub Actions (`.github/workflows/mdc-facebook-weekly.yml`)
// und lässt sich dort auch von Hand starten.
//
// Zwei Dinge passieren, und das zweite nur, wenn es eingerichtet ist:
//
//   IMMER      Der Beitrag wird gerechnet und in die Zusammenfassung des Laufs
//              geschrieben. Damit steht er in GitHub unter „Actions" und lässt
//              sich von dort kopieren — auch am Handy.
//
//   WENN       Sind MDC_FB_PAGE_ID und MDC_FB_PAGE_TOKEN als Secrets
//   MÖGLICH    hinterlegt, wird er zusätzlich auf der Facebook-SEITE
//              eingestellt. In eine Gruppe kann kein Programm schreiben, siehe
//              `lib/mdc/facebook-api.ts`.
//
// Ehrlichkeitsprinzip: Fehlt der Schlüssel, sagt der Lauf „übersprungen" und
// endet trotzdem grün. Er tut nicht so, als hätte er gepostet — und er lässt
// auch nicht jede Woche eine rote Meldung da, die nichts bedeutet.
//
// Aufruf von Hand:  npx tsx scripts/mdc-facebook-post.ts [--post]
// ============================================================

import { appendFileSync } from 'node:fs';
import { aktuellerFacebookPost } from '../lib/mdc/facebook-post';

/** Schreibt in die Zusammenfassung des GitHub-Laufs, falls es eine gibt. */
function zurZusammenfassung(text: string): void {
  const pfad = process.env.GITHUB_STEP_SUMMARY;
  if (!pfad) return;
  appendFileSync(pfad, `${text}\n`, 'utf8');
}

async function main(): Promise<void> {
  const post = aktuellerFacebookPost();

  if (!post) {
    console.log('Keine Wertung in der laufenden Saison — nichts zu posten.');
    zurZusammenfassung(
      '## MDC · Rangliste für Facebook\n\n'
      + 'Für die laufende Saison liegt noch kein ausgewertetes Turnier vor.',
    );
    return;
  }

  console.log(post.text);
  zurZusammenfassung([
    '## MDC · Rangliste für Facebook',
    '',
    `Stand ${post.daten.stand} · ${post.daten.men.length} Herren · ${post.daten.women.length} Damen`,
    '',
    'Zum Kopieren:',
    '',
    '```',
    post.text,
    '```',
  ].join('\n'));

  // Der Versand liegt hinter einem eigenen Schalter: Der Lauf soll den Text
  // auch dann erzeugen, wenn niemand posten will.
  if (!process.argv.includes('--post')) {
    console.log('\n(Ohne --post wird nichts eingestellt.)');
    return;
  }

  // Erst hier laden: Das Modul ist `server-only` und soll nicht schon beim
  // reinen Erzeugen des Textes im Weg stehen.
  const { facebookStatus, posteAufFacebook } = await import('../lib/mdc/facebook-api');
  const status = facebookStatus();
  if (!status.canPost) {
    console.log(`\nÜbersprungen — Facebook ist nicht eingerichtet: ${status.missing.join(', ')}.`);
    zurZusammenfassung(
      `\n_Nicht eingestellt: ${status.missing.join(', ')} fehlt. `
      + 'Der Text oben lässt sich von Hand in die MDC-Gruppe einfügen._',
    );
    return;
  }

  const beitrag = await posteAufFacebook(post.text, post.daten.link);
  console.log(`\nEingestellt: ${beitrag.url}`);
  zurZusammenfassung(`\n**Auf Facebook eingestellt:** ${beitrag.url}`);
}

main().catch((fehler: unknown) => {
  console.error(fehler);
  zurZusammenfassung(
    `\n**Fehlgeschlagen:** ${fehler instanceof Error ? fehler.message : String(fehler)}`,
  );
  process.exit(1);
});
