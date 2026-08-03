import { APP_NAME } from '@/lib/app-config';

export const metadata = { title: 'Datenschutz' };

/** Platzhalter — vor Veröffentlichung juristisch prüfen lassen. */
export default function PrivacyPage() {
  return (
    <main className="prose-sm space-y-4 p-4 text-body">
      <h1 className="text-xl font-extrabold text-ink">Datenschutzhinweise</h1>
      <p className="rounded-xl bg-accent-soft px-3 py-2 text-xs">
        Platzhalter-Text: Vor dem öffentlichen Betrieb muss diese Seite durch eine
        juristisch geprüfte Datenschutzerklärung ersetzt werden.
      </p>
      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="text-base font-bold text-ink">Welche Daten verarbeitet {APP_NAME}?</h2>
        <p>
          Profil- und Zielangaben (z. B. Größe, Gewicht, Aktivitätslevel), Ernährungstagebuch,
          eigene Lebensmittel und Rezepte sowie optional Gewichtseinträge. Im Demo-/Offline-Betrieb
          bleiben alle Daten ausschließlich in deinem Browser (localStorage).
        </p>
        <h2 className="text-base font-bold text-ink">Fotoanalyse</h2>
        <p>
          Essens- und Etikettenfotos werden nur mit deiner ausdrücklichen Aktion (Aufnahme/Upload)
          zur Analyse an den Server übertragen. Standardmäßig werden Fotos nach der Analyse
          verworfen; dauerhaftes Speichern ist eine Opt-in-Einstellung. Metadaten (EXIF, inkl.
          GPS) werden vor der Übertragung entfernt.
        </p>
        <h2 className="text-base font-bold text-ink">Deine Rechte</h2>
        <p>
          Du kannst deine Daten jederzeit als JSON exportieren und vollständig löschen
          (Profil → „Alle lokalen Daten löschen“ bzw. Account-Löschung bei Server-Konten).
        </p>
        <h2 className="text-base font-bold text-ink">Keine medizinische Beratung</h2>
        <p>
          {APP_NAME} liefert allgemeine Schätzwerte zur Orientierung und ersetzt keine
          medizinische oder ernährungswissenschaftliche Beratung.
        </p>
      </section>
    </main>
  );
}
