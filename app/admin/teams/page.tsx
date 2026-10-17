import { redirect } from 'next/navigation';

// Die frühere Seite „Teams“ zeigte nur die feste Teamliste 2025/26 ohne Funktion
// (Betreiber, 17.10.2026: entfernt). Teams einer Saison → Admin → Saison-Teams.
export default function AdminTeamsAlt() {
  redirect('/admin/season-teams');
}
