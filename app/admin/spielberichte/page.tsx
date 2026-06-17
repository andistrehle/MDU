'use client';

import { AdminGuard, AdminEmpty } from '@/components/mdu/admin-guard';

export default function AdminSpielberichtePage() {
  return (
    <AdminGuard title="Spielberichte freigeben" subtitle="Von Teamkapitänen eingereichte Spielberichte prüfen.">
      <AdminEmpty>
        Es liegen keine eingereichten Spielberichte zur Freigabe vor.
        <br /><br />
        Sobald Teamkapitäne Spielberichte erfassen können, erscheinen sie hier mit
        Freigabe-Funktion. Bis dahin werden keine Demo-Berichte angezeigt.
      </AdminEmpty>
    </AdminGuard>
  );
}
