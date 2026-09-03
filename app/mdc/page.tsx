// ============================================================
// MDC — Startseite
// ============================================================

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Building2, CalendarClock, Crown, MapPin, Target,
  Trophy, Users,
} from 'lucide-react';
import { Dartboard } from '@/components/mdc/dartboard';
import { RankingWidget } from '@/components/mdc/ranking-widget';
import { TournamentCard } from '@/components/mdc/tournament-card';
import { SectionHeading, StatCard, DemoNotice } from '@/components/mdc/ui';
import { finalRankingOf, MDC_STATS } from '@/data/ranking';
import { getPlayer, playerName, PLAYERS } from '@/data/players';
import { finishedTournaments, tournamentsThisWeek } from '@/data/tournaments';
import { getVenue, VENUES, venueAddress } from '@/data/venues';
import { FINAL_SEASON } from '@/data/season';
import { formatDate, formatNumber, weekdayName } from '@/lib/mdc/format';
import { heroSrc } from '@/lib/mdc/brand';

const STEPS = [
  {
    icon: <MapPin size={22} />,
    title: 'Im Lokal anmelden',
    text: 'Vor Ort eintragen, Startgeld zahlen, fertig. Kein Vorlauf, keine Meldefrist — wer da ist, spielt mit.',
  },
  {
    icon: <Target size={22} />,
    title: 'Doppel-K.-o. spielen',
    text: 'Jeder startet im Winner Bracket. Wer verliert, spielt im Loser Bracket weiter.',
  },
  {
    icon: <Trophy size={22} />,
    title: 'Punkte sammeln',
    text: 'Punkte gibt es für die Platzierung — und je größer das Feld, desto mehr sind sie wert.',
  },
  {
    icon: <Crown size={22} />,
    title: 'Im Ranking steigen',
    text: 'Alle Punkte der Saison zählen zusammen. Am Ende entscheidet die Rangliste über die Ausschüttung.',
  },
];

export default function MdcHomePage() {
  // Liegt ein Bühnenfoto unter `public/mdc/` (siehe lib/mdc/brand.ts), tritt
  // die gezeichnete Dartscheibe dafür zurück.
  const hero = heroSrc();
  const menTop = finalRankingOf('men').slice(0, 8);
  const womenTop = finalRankingOf('women').slice(0, 5);
  const leader = MDC_STATS.leaderId ? getPlayer(MDC_STATS.leaderId) : undefined;
  const womenLeader = getPlayer(finalRankingOf('women')[0]?.playerId ?? '');
  const recordHolder = MDC_STATS.mostAppearancesPlayerId
    ? getPlayer(MDC_STATS.mostAppearancesPlayerId)
    : undefined;
  const week = tournamentsThisWeek();
  const latest = finishedTournaments().slice(0, 3);

  return (
    <>
      {/* ── Bühne ── */}
      <section className="mdc-hero">
        {hero ? (
          <div className="mdc-hero-photo" aria-hidden>
            <Image
              src={hero.src}
              alt=""
              width={hero.width}
              height={hero.height}
              priority
              sizes="(max-width: 900px) 56vw, 66vw"
            />
          </div>
        ) : (
          <Dartboard className="mdc-hero-board mdc-spin-slow" tone="brand" />
        )}
        <div
          className="mdc-shell"
          style={{
            position: 'relative', zIndex: 2,
            // Unten weniger als oben: Darunter folgt schon der Abstand des
            // nächsten Abschnitts, sonst klafft dazwischen eine Lücke.
            paddingTop: 'clamp(48px, 7vw, 84px)',
            paddingBottom: 'clamp(36px, 5vw, 60px)',
          }}
        >
          <span className="mdc-kicker mdc-rise">München · Einzelrangliste</span>

          {/* Rot nur auf den Initialen M, D, C — der Rest steht im Dunkelblau
              des Schriftzugs, wie im Logo. */}
          <h1 className="mdc-display mdc-h1 mdc-rise mdc-rise-1" style={{ marginTop: 18, maxWidth: 900 }}>
            <span style={{ color: 'var(--mdc-red)' }}>M</span>unich{' '}
            <span style={{ color: 'var(--mdc-red)' }}>D</span>arts<br />
            <span style={{ color: 'var(--mdc-red)' }}>C</span>hallenge
          </h1>

          <p
            className="mdc-display mdc-rise mdc-rise-2"
            style={{
              marginTop: 20, fontSize: 'clamp(1.1rem, 2.4vw, 1.6rem)',
              fontWeight: 700, color: 'var(--mdc-ink-soft)', letterSpacing: '0.01em',
            }}
          >
            Münchens Ranking-Serie für Einzelspieler.
          </p>

          <p className="mdc-lead mdc-rise mdc-rise-2" style={{ marginTop: 12, maxWidth: 520 }}>
            Spielen. Punkte sammeln. Im Ranking aufsteigen.
          </p>

          <div className="mdc-rise mdc-rise-3" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 32 }}>
            <Link href="/mdc/rangliste" className="mdc-btn mdc-btn-primary">
              <Trophy size={18} />
              Aktuelle Rangliste
            </Link>
            <Link href="/mdc/turniere" className="mdc-btn mdc-btn-ghost">
              <CalendarClock size={18} />
              Turniere ansehen
            </Link>
          </div>

          <div
            className="mdc-hero-stats mdc-rise mdc-rise-4"
            style={{
              display: 'flex', flexWrap: 'wrap', gap: '10px 28px', marginTop: 30,
              fontSize: '0.84rem', color: 'var(--mdc-ink-dim)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <span
                className="mdc-live-dot"
                style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--mdc-red)' }}
              />
              {week[0]?.tournaments.length ?? 0} Turniere am{' '}
              {week[0] ? weekdayName(week[0].date) : 'Spieltag'}
            </span>
            <span>{VENUES.length} Spielorte in München</span>
            <span>{formatNumber(PLAYERS.length)} Spieler mit MDC-Pass</span>
            <span>4 bis 32 Starter pro Turnier</span>
          </div>
        </div>
      </section>

      {/* ── Rangliste ── */}
      <section className="mdc-section">
        <div className="mdc-shell">
          <SectionHeading
            kicker={`Endstand ${FINAL_SEASON.label}`}
            title="MDC-Ranking"
            description={`Der offizielle Saison-Endstand vom ${formatDate(FINAL_SEASON.asOf)}. Männer und Frauen spielen dieselben Turniere und werden getrennt gewertet.`}
            action={{ label: 'Komplette Rangliste', href: '/mdc/rangliste' }}
          />

          <div style={{ display: 'grid', gap: 26, gridTemplateColumns: 'minmax(0, 1.65fr) minmax(0, 1fr)' }} className="mdc-grid-2">
            <div>
              <h3
                className="mdc-display"
                style={{ fontSize: '1.05rem', letterSpacing: '0.12em', marginBottom: 12, color: 'var(--mdc-ink-soft)' }}
              >
                Männer · Top 8
              </h3>
              <RankingWidget entries={menTop} division="men" />
            </div>

            <div>
              <h3
                className="mdc-display"
                style={{ fontSize: '1.05rem', letterSpacing: '0.12em', marginBottom: 12, color: 'var(--mdc-ink-soft)' }}
              >
                Frauen · Top 5
              </h3>
              <RankingWidget entries={womenTop} division="women" compact />
            </div>
          </div>
        </div>
      </section>

      {/* ── Kennzahlen ── */}
      <section style={{ paddingBottom: 20 }}>
        <div className="mdc-shell">
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            <StatCard
              icon={<Crown size={17} />}
              label="Aktuelle Nummer 1"
              value={leader ? playerName(leader) : '—'}
              sub={`${formatNumber(MDC_STATS.leaderPoints)} Punkte · Frauen: ${womenLeader ? playerName(womenLeader) : '—'}`}
              href={leader ? `/mdc/spieler/${leader.id}` : undefined}
            />
            <StatCard
              icon={<Trophy size={17} />}
              label={`Turniere ${FINAL_SEASON.label}`}
              value={`${MDC_STATS.mostAppearances}+`}
              sub={recordHolder ? `so oft war ${playerName(recordHolder)} am Start` : undefined}
            />
            <StatCard
              icon={<Users size={17} />}
              label="Spieler mit MDC-Pass"
              value={formatNumber(MDC_STATS.players)}
              sub="Männer- und Frauenwertung zusammen"
              href="/mdc/spieler"
            />
            <StatCard
              icon={<Building2 size={17} />}
              label="Spielorte"
              value={String(MDC_STATS.venues)}
              sub="von Giesing bis ins Würmtal"
              href="/mdc/spielorte"
            />
          </div>
        </div>
      </section>

      {/* ── Diese Woche ── */}
      <section className="mdc-section">
        <div className="mdc-shell">
          <SectionHeading
            kicker="Spielplan"
            title="Diese Woche bei der MDC"
            description="Von Montag bis Donnerstag wird gespielt — anmelden kann man sich direkt im Lokal, bis kurz vor Turnierstart."
            action={{ label: 'Alle Termine', href: '/mdc/turniere' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
            {week.map(day => (
              <div key={day.date}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                  <h3 className="mdc-display" style={{ fontSize: '1.4rem' }}>
                    {weekdayName(day.date)}
                  </h3>
                  <span className="mdc-num" style={{ fontSize: '0.84rem', color: 'var(--mdc-ink-dim)' }}>
                    {formatDate(day.date)}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                  {day.tournaments.map(tournament => {
                    const venue = getVenue(tournament.venueId);
                    if (!venue) return null;
                    return (
                      <div
                        key={tournament.id}
                        className="mdc-card mdc-card-hover"
                        style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                          <h4 className="mdc-display" style={{ fontSize: '1.15rem' }}>{venue.name}</h4>
                          <span className="mdc-num" style={{ color: 'var(--mdc-red)', fontWeight: 700 }}>
                            {tournament.time}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: 'var(--mdc-ink-soft)', lineHeight: 1.5 }}>
                          {venueAddress(venue)}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--mdc-ink-dim)', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Target size={13} />
                          {venue.boards} Dartautomaten · {tournament.participantIds.length} gemeldet
                        </p>
                        <Link
                          href={`/mdc/turniere/${tournament.id}`}
                          className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                          style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
                        >
                          Details
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Letzte Turniere ── */}
      <section className="mdc-section mdc-section-tint">
        <div className="mdc-shell">
          <SectionHeading
            kicker="Ergebnisse"
            title="Letzte Turniere"
            description="Die zuletzt gespielten Ranglistenturniere mit Podium, kompletter Ergebnisliste und Turnierbaum."
            action={{ label: 'Alle Ergebnisse', href: '/mdc/turniere' }}
          />

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}>
            {latest.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>

          <div style={{ marginTop: 22 }}>
            <DemoNotice>
              Echt sind die Ranglisten: der Saison-Endstand 2025/26 und der
              Endstand des Sommer-Rankings vom 01.09.2026. Die hier gezeigten
              einzelnen Turniere samt Ergebnissen, Meldeständen und
              Turnierbäumen sind Demo-Material — sie zahlen auf keine der
              beiden Ranglisten ein.
            </DemoNotice>
          </div>
        </div>
      </section>

      {/* ── So funktioniert die MDC ── */}
      <section className="mdc-section">
        <div className="mdc-shell">
          <SectionHeading
            kicker="Spielprinzip"
            title="So funktioniert die MDC"
            description="Vier Schritte — mehr braucht es nicht, um mitzuspielen."
            action={{ label: 'Alle Regeln', href: '/mdc/regeln' }}
          />

          <ol style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
            {STEPS.map((step, index) => (
              <li key={step.title} className="mdc-card mdc-card-hover" style={{ padding: '22px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--mdc-red)' }}>{step.icon}</span>
                  <span
                    className="mdc-display"
                    style={{ fontSize: '2.6rem', color: 'var(--mdc-tint-2)', lineHeight: 1 }}
                  >
                    {index + 1}
                  </span>
                </div>
                <h3 className="mdc-display" style={{ fontSize: '1.25rem', marginTop: 10 }}>{step.title}</h3>
                <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--mdc-ink-soft)' }}>
                  {step.text}
                </p>
              </li>
            ))}
          </ol>

          <div
            className="mdc-card mdc-card-accent"
            style={{
              marginTop: 22, padding: '22px 24px', display: 'flex', flexWrap: 'wrap',
              alignItems: 'center', gap: 18, justifyContent: 'space-between',
            }}
          >
            <p className="mdc-display" style={{ fontSize: 'clamp(1.2rem, 2.6vw, 1.8rem)' }}>
              Wer zweimal verliert, scheidet aus.
            </p>
            <Link href="/mdc/regeln" className="mdc-btn mdc-btn-ghost mdc-btn-sm">
              Doppel-K.-o. erklärt
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
