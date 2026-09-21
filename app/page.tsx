import type { Metadata } from 'next';
import { HomeContent } from '@/components/mdu/home-content';

// News kommen aus der DB (Admin-verwaltet); serverseitig alle 10 Minuten neu
// erzeugt. Bewusst nicht kürzer: Jedes Neurendern ist ein kontingentierter
// Vercel-ISR-Write (siehe CLAUDE.md „Stolperfallen"). Die einzige laufend
// wechselnde Quelle hier sind Admin-News; Spielpläne/Ergebnisse stammen aus
// statischen Daten und ändern sich ohnehin nur mit einem Deploy. 10 Minuten
// Vorlauf für eine Vereins-Startseite sind unkritisch (Seite ist zudem noindex).
export const revalidate = 600;

// Startseite = kanonische Einstiegsseite für die Marken-Suchbegriffe
// (MDU, Münchner Dart Union, Dart Liga München …).
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// Der eigentliche Inhalt liegt in <HomeContent> (wiederverwendbar), damit die
// Design-Vorschau (/hero-vorschau) dieselbe Seite mit einer alternativen
// Hero-Variante zeigen kann. Live bleibt der klassische Hero.
export default function HomePage() {
  return <HomeContent hero="classic" />;
}
