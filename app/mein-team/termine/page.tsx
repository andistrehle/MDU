'use client';

// Team Manager — alle Termine (MDU-Spiele + eigene), Termin eintragen/importieren, Einstellungen (TC).
import { TeamManager } from '@/components/mdu/team-manager';

export default function TermineSeite() {
  return <TeamManager ansicht="termine" />;
}
