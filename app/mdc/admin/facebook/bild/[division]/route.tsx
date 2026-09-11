// ============================================================
// MDC — Ranglistenbild als PNG
// ============================================================
//
// Liegt unter `/admin`, also hinter derselben Passwortabfrage wie der Rest
// der Verwaltung (`proxy.ts`) — das Bild zeigt zwar nur, was auf der
// Ranglistenseite ohnehin steht, aber es gehört zum Arbeitsweg der
// Turnierleitung und nicht in den Suchindex.
//
// Immer frisch gerechnet: Nach einem hochgeladenen Turnier soll das Bild den
// neuen Stand zeigen und nicht den vom letzten Neubau.
// ============================================================

import { aktuellerFacebookPost } from '@/lib/mdc/facebook-post';
import { bildDatenAus, ranglisteBild } from '@/lib/mdc/facebook-bild';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  props: { params: Promise<{ division: string }> },
) {
  const { division } = await props.params;
  if (division !== 'men' && division !== 'women') {
    return new Response('Unbekannte Wertung.', { status: 404 });
  }

  const post = aktuellerFacebookPost();
  if (!post) {
    return new Response('Für die laufende Saison gibt es noch keine Wertung.', { status: 404 });
  }
  if (!post.daten[division].length) {
    return new Response('In dieser Wertung steht noch niemand.', { status: 404 });
  }

  return ranglisteBild(bildDatenAus(post.daten, division));
}
