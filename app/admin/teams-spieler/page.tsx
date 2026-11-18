'use client';

import { AdminHub } from '@/components/mdu/admin-hub';

export default function AdminTeamsSpielerPage() {
  return (
    <AdminHub titel="Teams & Spieler" untertitel="Mannschaften, Kader, Spieler und Anmeldungen." punkte={[
      { href: '/admin/registrations', icon: 'list', titel: 'Saisonanmeldungen', text: 'Mannschaftsanmeldungen prüfen und freigeben.', badgeKey: 'registrations' },
      { href: '/admin/nachmeldungen', icon: 'user', titel: 'Nachmeldungen', text: 'Spieler-Nachmeldungen prüfen.', badgeKey: 'nominations' },
      { href: '/admin/season-teams', icon: 'trophy', titel: 'Saison-Teams', text: 'Mannschaften je Saison, Liga und Kader; Kapitän und Co-Captain.' },
      { href: '/admin/spieler', icon: 'users', titel: 'Spieler', text: 'Alle Spieler alphabetisch – Namen und Profil-Adresse ändern, löschen, Dubletten finden.' },
      { href: '/admin/kontakte', icon: 'user', titel: 'Kontakte', text: 'Telefonnummern der Team-Kapitäne.' },
      { href: '/admin/players', icon: 'list', titel: 'Spielerliste 2025/26', text: 'Der feste Spielerstamm der Vorsaison zum Nachschlagen.' },
    ]} />
  );
}
