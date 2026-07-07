import Link from "next/link";
import Chat from "@/components/Chat";
import { CONTACT_EMAIL } from "@/lib/config";

export default function Home() {
  return (
    <main className="app">
      <header className="header">
        <h1>
          <span className="dot" aria-hidden="true" />
          Ask Andreas AI
        </h1>
        <p>Der KI-Assistent zur Bewerbung von Andreas Strehle</p>
      </header>

      <Chat />

      <footer className="footer">
        KI-Chatbot auf Basis von Claude (Anthropic). Antworten können Fehler
        enthalten und sind ohne Gewähr. Es werden keine Chatverläufe gespeichert.
        Fragen direkt an Andreas:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <div className="links">
          <Link href="/impressum">Impressum</Link>·
          <Link href="/datenschutz">Datenschutz</Link>
        </div>
      </footer>
    </main>
  );
}
