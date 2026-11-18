'use client';

import { AdminHub } from '@/components/mdu/admin-hub';

export default function AdminBenutzerPage() {
  return (
    <AdminHub titel="Benutzer" untertitel="Konten, Rollen und Rechte." punkte={[
      { href: '/admin/users', icon: 'users', titel: 'Benutzer verwalten', text: 'Konten prüfen, Rollen vergeben, mit Spieler und Team verknüpfen.', badgeKey: 'users' },
      { href: '/admin/roles', icon: 'edit', titel: 'Rollen & Rechte', text: 'Übersicht, was welche Rolle darf.' },
    ]} />
  );
}
