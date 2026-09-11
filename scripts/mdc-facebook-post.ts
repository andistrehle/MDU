// ============================================================
// MDC — Wochenlauf: Rangliste für Facebook
// ============================================================
//
// Läuft montags über GitHub Actions (`.github/workflows/mdc-facebook-weekly.yml`)
// und lässt sich dort auch von Hand starten.
//
// Zwei Dinge passieren, und das zweite nur, wenn es eingerichtet ist:
//
//   IMMER      Der Beitrag wird gerechnet: der Text in die Zusammenfassung des
//              Laufs, die beiden Tabellenbilder als Dateien daneben. Beides
//              steht in GitHub unter „Actions" — Text kopieren, Bilder aus dem
//              Artefakt laden, fertig ist der Beitrag, auch am Handy.
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

import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { aktuellerFacebookPost } from '../lib/mdc/facebook-post';
import { bildDatenAus, ranglisteBild } from '../lib/mdc/facebook-bild';

/** Wohin die Bilder geschrieben werden — der Wochenlauf lädt diesen Ordner hoch. */
const BILDORDNER = 'facebook-bilder';

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

  // Bilder zuerst: Sie sind der Beitrag, der Text ist die Bildunterschrift.
  mkdirSync(BILDORDNER, { recursive: true });
  const bilder: { name: string; daten: Uint8Array }[] = [];
  for (const division of ['men', 'women'] as const) {
    if (!post.daten[division].length) continue;
    const name = `mdc-rangliste-${division === 'men' ? 'herren' : 'damen'}-${post.daten.stand}.png`;
    const daten = new Uint8Array(
      await ranglisteBild(bildDatenAus(post.daten, division)).arrayBuffer(),
    );
    writeFileSync(join(BILDORDNER, name), daten);
    bilder.push({ name, daten });
    console.log(`Bild geschrieben: ${BILDORDNER}/${name} (${daten.length} Bytes)`);
  }

  console.log(post.text);
  zurZusammenfassung([
    '## MDC · Rangliste für Facebook',
    '',
    `Stand ${post.daten.stand} · ${post.daten.men.length} Herren · ${post.daten.women.length} Damen`,
    '',
    `Die beiden Tabellenbilder liegen als Artefakt „${BILDORDNER}" bei diesem Lauf.`,
    '',
    'Text für den Beitrag:',
    '',
    '```',
    post.kurz,
    '```',
    '',
    '<details><summary>Dieselbe Rangliste als reiner Text</summary>',
    '',
    '```',
    post.text,
    '```',
    '',
    '</details>',
  ].join('\n'));

  // Der Versand liegt hinter einem eigenen Schalter: Der Lauf soll den Text
  // auch dann erzeugen, wenn niemand posten will.
  if (!process.argv.includes('--post')) {
    console.log('\n(Ohne --post wird nichts eingestellt.)');
    return;
  }

  // Erst hier laden: Das Modul ist `server-only` und soll nicht schon beim
  // reinen Erzeugen des Textes im Weg stehen.
  const { facebookStatus, posteBilderAufFacebook } = await import('../lib/mdc/facebook-api');
  const status = facebookStatus();
  if (!status.canPost) {
    console.log(`\nÜbersprungen — Facebook ist nicht eingerichtet: ${status.missing.join(', ')}.`);
    zurZusammenfassung(
      `\n_Nicht eingestellt: ${status.missing.join(', ')} fehlt. `
      + 'Der Text oben lässt sich von Hand in die MDC-Gruppe einfügen._',
    );
    return;
  }

  const beitrag = await posteBilderAufFacebook(post.kurz, bilder);
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
