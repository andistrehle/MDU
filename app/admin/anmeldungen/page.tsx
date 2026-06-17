'use client';

import { AdminGuard, AdminEmpty } from '@/components/mdu/admin-guard';

export default function AdminAnmeldungenPage() {
  return (
    <AdminGuard title="Saisonanmeldungen" subtitle="Mannschaftsanmeldungen für die kommende Saison prüfen.">
      <AdminEmpty>
        Aktuell liegen keine offenen Mannschaftsanmeldungen vor.
        <br /><br />
        Sobald die Mannschaftsanmeldung für Teamkapitäne freigeschaltet ist, erscheinen
        eingehende Anmeldungen hier zum Prüfen und Freigeben. Es werden keine Beispiel-
        oder Demo-Anmeldungen angezeigt.
      </AdminEmpty>
    </AdminGuard>
  );
}
