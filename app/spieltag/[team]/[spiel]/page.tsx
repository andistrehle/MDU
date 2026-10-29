import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { SpieltagAnsicht } from '@/components/mdu/spieltag-ansicht';
import { ZUSAGEN_TEAMS } from '@/lib/features';
import { teamManagerAktiv } from '@/lib/server/premium';
import { alleBegegnungen27, team27, venue27, findLiga27 } from '@/lib/data/saison-2027';
import { passtSlug, spielSlug, wochentag, tagMonat } from '@/lib/spieltag';

// ============================================================
// Spieltag-Seite (Zu-/Absagen) — teilbar, z. B. in die WhatsApp-Gruppe
// ============================================================
// Statisch je freigeschaltetem Team und Spiel; der Stand kommt im Browser
// (Teammitglieder über RLS mit Namen, alle anderen nur Zahlen über
// /api/spieltag/stand). Dadurch kein Neurendern pro Zu-/Absage (ISR-Kontingent).
// ============================================================

// Vorgebaut für die festen Teams; bezahlte Teams (Migration 0063) entstehen beim ersten Aufruf.
export const dynamicParams = true;

export function generateStaticParams() {
  return ZUSAGEN_TEAMS.flatMap(team => alleBegegnungen27()
    .filter(b => b.home === team || b.away === team)
    .map(b => ({ team, spiel: spielSlug(b.key) })));
}

type Params = { params: Promise<{ team: string; spiel: string }> };

async function finde(team: string, spiel: string) {
  const b = alleBegegnungen27().find(x => passtSlug(x.key, spiel));
  if (!b || (b.home !== team && b.away !== team) || !(await teamManagerAktiv(team))) return null;
  return b;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { team, spiel } = await params;
  const b = await finde(team, spiel);
  if (!b) return {};
  const t = b.termin;
  const titel = `${t ? `${wochentag(t.datum)} ${tagMonat(t.datum)}${t.uhrzeit ? ` ${t.uhrzeit}` : ''} · ` : ''}${team27(b.home)?.name ?? b.home} – ${team27(b.away)?.name ?? b.away}`;
  const text = `${team27(team)?.name}: Wer ist dabei? Zu- und Absagen für dieses Spiel.`;
  return {
    title: titel,
    description: text,
    robots: { index: false, follow: false },
    openGraph: { title: titel, description: text },
  };
}

export default async function SpieltagPage({ params }: Params) {
  const { team, spiel } = await params;
  const b = await finde(team, spiel);
  if (!b) notFound();
  const heim = b.home === team;
  const ort = venue27(team27(b.home)?.venueId);
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/mein-bereich" />
      <div className="mdu-section-pad" style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 80px' }}>
        <SpieltagAnsicht b={b} teamId={team} teamName={team27(team)?.name ?? team}
          gegner={team27(heim ? b.away : b.home)?.name ?? ''} liga={findLiga27(b.liga)?.name ?? ''}
          ort={ort ? { name: ort.name, address: ort.address } : null} />
      </div>
    </div>
  );
}
