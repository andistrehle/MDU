export const metadata = { title: 'Impressum' };

/** Platzhalter — vor Veröffentlichung mit echten Angaben füllen. */
export default function ImprintPage() {
  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-extrabold text-ink">Impressum</h1>
      <p className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-body">
        Platzhalter: Vor dem öffentlichen Betrieb sind hier die gesetzlich erforderlichen
        Anbieterangaben (Name, Anschrift, Kontakt, Vertretungsberechtigte) einzutragen.
      </p>
      <div className="text-sm leading-relaxed text-body">
        <p>Anbieter: [Name]</p>
        <p>Anschrift: [Straße, PLZ Ort]</p>
        <p>Kontakt: [E-Mail]</p>
      </div>
    </main>
  );
}
