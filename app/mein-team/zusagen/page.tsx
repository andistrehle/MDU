'use client';

// Team Manager — Übersicht (Dashboard). Die Terminliste liegt unter /mein-team/termine.
import { TeamManager } from '@/components/mdu/team-manager';

export default function TeamManagerPage() {
  return <TeamManager ansicht="dashboard" />;
}
