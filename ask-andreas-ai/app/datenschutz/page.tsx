import Link from "next/link";
import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Datenschutz – Ask Andreas AI",
  robots: { index: false, follow: false },
};

export default function Datenschutz() {
  return (
    <main className="page">
      <Link href="/" className="back">
        ← Zurück zum Chat
      </Link>
      <h1>Datenschutzerklärung</h1>

      <h2>Kurz und ehrlich</h2>
      <p>
        Diese Seite setzt <strong>keine Cookies</strong>, nutzt{" "}
        <strong>kein Tracking</strong> und <strong>kein Analytics</strong>. Es
        werden <strong>keine Chatverläufe gespeichert</strong> – deine Eingaben
        leben nur im Speicher deines Browsers, solange die Seite geöffnet ist.
      </p>

      <h2>Verantwortlicher</h2>
      <p>
        <span className="placeholder">[Name]</span>,{" "}
        <span className="placeholder">[Anschrift]</span>
        <br />
        E-Mail: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <h2>Verarbeitung deiner Eingaben</h2>
      <p>
        Um deine Fragen zu beantworten, werden deine Nachrichten an die{" "}
        <strong>Anthropic API</strong> (Anthropic PBC, USA) übermittelt und dort
        verarbeitet. Die Übermittlung erfolgt zur Erfüllung deiner Anfrage
        (Art. 6 Abs. 1 lit. b/f DSGVO). Es findet eine Datenübermittlung in ein
        Drittland (USA) statt.
      </p>

      <h2>Hosting</h2>
      <p>
        Die Seite wird bei <strong>Vercel</strong> (Vercel Inc., USA) gehostet.
        Beim Aufruf fallen technisch bedingt Server-Logdaten an (z. B.
        IP-Adresse, Zeitpunkt, aufgerufene Ressource), die dem Betrieb und der
        Sicherheit des Dienstes dienen.
      </p>

      <h2>Deine Rechte</h2>
      <p>
        Dir stehen die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung
        der Verarbeitung, Datenübertragbarkeit und Widerspruch zu. Wende dich
        dafür an die oben genannte Kontaktadresse.
      </p>
    </main>
  );
}
