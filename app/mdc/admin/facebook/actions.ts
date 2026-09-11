'use server';

// ============================================================
// MDC — Beitrag bei Facebook einstellen
// ============================================================
//
// Der Text kommt aus `lib/mdc/facebook-post.ts` und steht vorher am
// Bildschirm; abgeschickt wird nur, was dort bestätigt wurde — auch hier
// entscheidet der Mensch, nicht die Seite.
//
// Wie bei allen Verwaltungsaktionen wird der Zugang selbst nachgeprüft: Eine
// Aktion ist eine eigene Adresse im Netz und darf sich nicht darauf verlassen,
// dass der Proxy vor ihr aufgepasst hat.
// ============================================================

import { headers } from 'next/headers';
import {
  facebookStatus, posteAufFacebook, posteBilderAufFacebook, FacebookFehler,
} from '@/lib/mdc/facebook-api';
import { aktuellerFacebookPost } from '@/lib/mdc/facebook-post';
import { bildDatenAus, ranglisteBild } from '@/lib/mdc/facebook-bild';
import { MDC_ORIGIN } from '@/lib/mdc/site';

export type PostErgebnis =
  | { ok: true; url: string }
  | { ok: false; fehler: string };

async function zugangGeprueft(): Promise<boolean> {
  const passwort = (process.env.MDC_ADMIN_PASSWORD ?? '').trim();
  if (!passwort) return false;
  const header = (await headers()).get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const entschluesselt = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
    return entschluesselt.slice(entschluesselt.indexOf(':') + 1) === passwort;
  } catch {
    return false;
  }
}

export async function posteRangliste(text: string): Promise<PostErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: 'Kein Zugang zur Turnierverwaltung.' };

  const status = facebookStatus();
  if (!status.canPost) {
    return { ok: false, fehler: `Facebook ist nicht eingerichtet: ${status.missing.join(', ')}.` };
  }

  const inhalt = text.trim();
  if (inhalt.length < 20) {
    return { ok: false, fehler: 'Der Beitrag ist leer oder viel zu kurz.' };
  }
  // Facebook nimmt sehr lange Beiträge an, aber irgendwo ist Schluss — und ein
  // abgeschnittener Beitrag mitten in der Rangliste wäre das Schlechteste.
  if (inhalt.length > 60000) {
    return { ok: false, fehler: 'Der Beitrag ist zu lang für Facebook.' };
  }

  try {
    // Mit Bildern, wenn es welche gibt — der Beitrag soll bei Facebook so
    // aussehen wie hier am Bildschirm. Nur wenn die Wertung noch leer ist,
    // bleibt es beim reinen Text mit Vorschaubild der Seite.
    const post = aktuellerFacebookPost();
    const bilder = post
      ? await Promise.all(
        (['men', 'women'] as const)
          .filter(division => post.daten[division].length > 0)
          .map(async division => ({
            name: `mdc-rangliste-${division === 'men' ? 'herren' : 'damen'}-${post.daten.stand}.png`,
            daten: new Uint8Array(
              await ranglisteBild(bildDatenAus(post.daten, division)).arrayBuffer(),
            ),
          })),
      )
      : [];

    const beitrag = bilder.length
      ? await posteBilderAufFacebook(inhalt, bilder)
      : await posteAufFacebook(inhalt, `${MDC_ORIGIN}/rangliste`);
    return { ok: true, url: beitrag.url };
  } catch (fehler) {
    if (fehler instanceof FacebookFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Facebook-Beitrag fehlgeschlagen', fehler);
    return {
      ok: false,
      fehler: 'Der Beitrag konnte nicht eingestellt werden. Bitte noch einmal versuchen — '
        + 'oder den Text kopieren und von Hand einstellen.',
    };
  }
}
