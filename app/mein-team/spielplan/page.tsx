'use client';

// ============================================================
// Mein Bereich → Mein Spielplan (Saison 2026/2027, vorläufig)
// ============================================================
// Für alle Mitglieder mit Team-Verknüpfung: die Spiele des eigenen Teams und
// der Plan der eigenen Liga. TCs (und die Ligaleitung) bekommen zusätzlich die
// Druckvorlagen für die TC-Sitzung: Team-Blatt mit Feldern für Datum/Uhrzeit
// und den Masterplan der Liga (lib/spielplan/printing.ts, gleiche Blätter wie
// im Admin-Bereich). Reine Anzeige — schreibt nichts.
// ============================================================

import { useMemo } from 'react';
import Link from 'next/link';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { VorlaeufigHinweis } from '@/components/mdu/saison-umschalter';
import { TeamSpielplan27, LigaSpielplan27 } from '@/components/mdu/spielplan-27';
import { useAuth } from '@/lib/auth/auth-context';
import { canEditTeam } from '@/lib/auth/roles';
import { team27, findLiga27, venue27, spielplanDaten27, NEUE_SAISON } from '@/lib/data/saison-2027';
import { printTeam, printMaster } from '@/lib/spielplan/printing';

export default function MeinSpielplanPage() {
  const { user, loading } = useAuth();
  const teamId = user?.teamId ?? null;
  const t = teamId ? team27(teamId) : undefined;
  const liga = findLiga27(t?.league);
  const darfDrucken = !!teamId && canEditTeam(user, teamId);
  const daten = useMemo(() => spielplanDaten27(), []);

  return (
    <MemberShell title="Mein Spielplan">
      {loading ? (
        <Muted>Lade …</Muted>
      ) : !user ? (
        <Notice title="Bitte einloggen">Dieser Bereich ist nur für angemeldete Mitglieder.{' '}<LoginLink /></Notice>
      ) : !teamId ? (
        <Notice title="Kein Team verknüpft">
          Deinem Konto ist noch kein Team zugeordnet. Den Spielplan aller Ligen findest du unter{' '}
          <Link href="/spielplan" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Spielplan</Link>.
        </Notice>
      ) : !t || !liga ? (
        <Notice title="Dein Team steht nicht im Spielplan">
          Für die {NEUE_SAISON.name} ist dein Team (noch) nicht im Spielplan. Bei Fragen melde dich bei der Ligaleitung.
        </Notice>
      ) : (
        <>
          {/* Team-Kopf */}
          <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '18px 20px', marginBottom: 18 }}>
            <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 24, color: 'var(--th-text-strong)', textTransform: 'uppercase', lineHeight: 1.1 }}>{t.name}</div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', marginTop: 6 }}>
              <span style={{ color: liga.color, fontWeight: 700 }}>{liga.name}</span> · {NEUE_SAISON.name} · Heimspiele: {venue27(t.venueId)?.name ?? 'Spielort folgt'}
            </div>
          </div>

          <VorlaeufigHinweis />

          {/* Druck — nur TC/Ligaleitung */}
          {darfDrucken && (
            <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '18px 20px', marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)', marginBottom: 4 }}>Für die TC-Sitzung drucken</div>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.55, margin: '0 0 14px' }}>
                Das Team-Blatt listet alle Spiele deines Teams mit Feldern für Datum und Uhrzeit. Im Masterplan der {liga.name} tragt ihr die Termine aller Spiele zusammen.
                Es öffnet sich ein neuer Tab mit dem Druckdialog, dort kannst du auch „Als PDF speichern“ wählen.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => printTeam(daten, liga.code, t.name, false)} style={btn(true)}>Team-Blatt drucken</button>
                <button type="button" onClick={() => printTeam(daten, liga.code, t.name, true)} style={btn(false)}>Team-Blatt + Masterplan</button>
                <button type="button" onClick={() => printMaster(daten, liga.code)} style={btn(false)}>Nur Masterplan</button>
              </div>
            </div>
          )}

          <h2 style={h2}>Spiele von {t.name}</h2>
          <TeamSpielplan27 teamId={t.id} />

          <h2 style={{ ...h2, marginTop: 32 }}>Ganze {liga.name}</h2>
          <LigaSpielplan27 liga={liga} />
        </>
      )}
    </MemberShell>
  );
}

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: '0 0 12px',
};

function btn(primary: boolean): React.CSSProperties {
  return {
    padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
    background: primary ? 'var(--th-accent)' : 'transparent',
    color: primary ? '#fff' : 'var(--th-accent)',
    border: '1.5px solid var(--th-accent)',
  };
}
