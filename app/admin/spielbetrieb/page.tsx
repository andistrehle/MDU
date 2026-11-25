'use client';

import { AdminHub } from '@/components/mdu/admin-hub';

export default function AdminSpielbetriebPage() {
  return (
    <AdminHub titel="Spielbetrieb" untertitel="Spielberichte, Verlegungen und Spielpläne." punkte={[
      { href: '/admin/spielberichte', icon: 'file', titel: 'Spielberichte', text: 'Alle Begegnungen: fehlt, eingereicht, bestätigt, Proteste.', badgeKey: 'matchReports' },
      { href: '/admin/verlegungen', icon: 'calendar', titel: 'Verlegungen', text: 'Von den Teamcaptains angefragte Verlegungen und Heimrechttausch.' },
      { href: '/admin/wm-tipp', icon: 'trophy', titel: 'WM-Tipp', text: 'Tippspiel zur Darts-WM: Spielplan, Ergebnisse, Bonusfragen.' },
      { href: '/admin/spielplan-vorschlag', icon: 'calendar', titel: 'Spielplan / TC-Pläne', text: 'Plan jeder Mannschaft, Liga oder jedes Spielorts drucken.' },
    ]} />
  );
}
