'use client';

import { AdminGuard, AdminEmpty } from '@/components/mdu/admin-guard';

export default function AdminDownloadsPage() {
  return (
    <AdminGuard title="Downloads" subtitle="Dokumente und Formulare verwalten.">
      <AdminEmpty>
        Die Downloads-Verwaltung ist vorbereitet. Geplante Kategorien:
        Spielberichtsbogen, Regelwerk, Saisonunterlagen, Anmeldeformulare,
        Datenschutz-/Einwilligungsvorlagen.
        <br /><br />
        Der Datei-Upload folgt mit Supabase Storage in einem späteren Sprint —
        es werden hier keine Beispiel-Dateien angezeigt.
      </AdminEmpty>
    </AdminGuard>
  );
}
