import Link from "next/link";
import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Impressum – Ask Andreas AI",
  robots: { index: false, follow: false },
};

export default function Impressum() {
  return (
    <main className="page">
      <Link href="/" className="back">
        ← Zurück zum Chat
      </Link>
      <h1>Impressum</h1>

      <p>Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG):</p>

      <h2>Verantwortlich für den Inhalt</h2>
      <p>
        <span className="placeholder">[Name]</span>
        <br />
        <span className="placeholder">[Straße und Hausnummer]</span>
        <br />
        <span className="placeholder">[PLZ und Ort]</span>
        <br />
        Deutschland
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <br />
        Telefon: <span className="placeholder">[optional]</span>
      </p>

      <h2>Hinweis</h2>
      <p>
        Diese Seite ist ein privates Bewerbungsprojekt von Andreas Strehle. Sie
        steht in keiner Verbindung zu einem Verein, Unternehmen oder einer Marke.
      </p>
    </main>
  );
}
