import { redirect } from 'next/navigation';

// Kurzer Link für Instagram-Bio, Facebook & Co.: mdudarts.de/neue-saison
// → öffnet den News-Beitrag zur Saison 2026/27 direkt (Deep-Link per #<id>,
// siehe components/mdu/news-article-card.tsx). Ziel bei Bedarf hier umstellen —
// der Kurzlink bleibt gleich (bewusst 307, nicht dauerhaft).
const ZIEL = '/news#spielplaene-2026-27-sind-online-gswuv';

export default function NeueSaisonPage() {
  redirect(ZIEL);
}
