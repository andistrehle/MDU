// ============================================================
// BeDV-Demo — Startseite
// ============================================================
//
// Der Aufbau folgt genau dem Ablauf eines Verkaufsgesprächs:
//
//   Kopfbereich      „Das ist euer Verband, in modern."
//   Spielklassen     „Jeder findet seine Liga in einem Klick."
//   Nächste Spiele   „Wann spielt meine Mannschaft?"
//   Ergebnisse       „Was war letzte Woche?"
//   Tabellen         „Wo stehen wir?"
//   Pokal            „Auch der Pokal hat endlich ein Gesicht."
//   News & Termine   „Der Verband kann selbst veröffentlichen."
//   Plattform        „Und nach dem Login wird daraus mehr als eine Homepage."
//
// Wer die Reihenfolge ändert, ändert das Gespräch.
// ============================================================

import Link from 'next/link';
import { ArrowRight, ClipboardList, Users, ScanLine, ShieldCheck } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { Hero } from '@/components/bedv/home/hero';
import { LigaEinstiege } from '@/components/bedv/home/liga-einstiege';
import { TabellenKarten } from '@/components/bedv/home/tabellen-karten';
import { MatchCard } from '@/components/bedv/matches/match-card';
import { NewsCard } from '@/components/bedv/news/news-card';
import { SectionHead, Card, Badge } from '@/components/bedv/ui/bausteine';
import { TeamWappen } from '@/components/bedv/teams/team-wappen';
import { letzteErgebnisse, naechsteBegegnungen } from '@/data/bedv/spiele';
import { NEWS } from '@/data/bedv/news';
import { naechsteTermine } from '@/data/bedv/events';
import { AKTUELLE_RUNDE, paarungenDerRunde, POKAL_NAME, gesamtstand } from '@/data/bedv/pokal';
import { teamById } from '@/data/bedv/teams';
import { datum, datumKurz, wochentagKurz } from '@/lib/bedv/format';

/**
 * Halbstündlich neu bauen — als einzige Seite neben `/ergebnisse`.
 *
 * Hier steht „Nächste Spiele" und „Letzte Ergebnisse", beides hängt am
 * heutigen Tag. Für EINE Seite sind 48 Neurenderungen am Tag unbedenklich;
 * der Tageswert des Layouts gilt für über 600 Seiten und bleibt deshalb
 * stehen (von zwei Werten gilt in Next der kleinere).
 */
export const revalidate = 1800;

export default function BedvStartseite() {
  const naechste = naechsteBegegnungen(6);
  const letzte = letzteErgebnisse(6);
  const news = NEWS.slice(0, 3);
  const termine = naechsteTermine(3);
  const pokalPaarungen = paarungenDerRunde(AKTUELLE_RUNDE);

  return (
    <>
      <Hero />

      {/* ── Spielklassen ── */}
      <section className="bedv-section bedv-shell">
        <SectionHead
          eyebrow="Spielbetrieb"
          titel="Alle Staffeln auf einen Blick"
          text="Tabelle, Spielplan, Ergebnisse, Einzelrangliste und Highlights — je Liga auf einer Seite."
          aktion={{ label: 'Liga-Übersicht', href: bedvPath('/ligen') }}
        />
        <LigaEinstiege />
      </section>

      {/* ── Nächste Spiele ── */}
      <section className="bedv-section bedv-section--tinted">
        <div className="bedv-shell">
          <SectionHead
            eyebrow="Kommender Spieltag"
            titel="Nächste Spiele"
            text="Termin, Uhrzeit und Spielstätte — quer über alle Staffeln."
            aktion={{ label: 'Alle Spielpläne', href: bedvPath('/ligen') }}
          />
          <div className="bedv-scroller">
            {naechste.map(b => (
              <div key={b.id} style={{ width: 318, maxWidth: '84vw' }}>
                <MatchCard begegnung={b} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Letzte Ergebnisse ── */}
      <section className="bedv-section bedv-shell">
        <SectionHead
          eyebrow="Frisch gemeldet"
          titel="Letzte Ergebnisse"
          text="Gespielt wird über 18 Einzelspiele — der Stand ist die Zahl der gewonnenen Spiele."
          aktion={{ label: 'Alle Ergebnisse', href: bedvPath('/ergebnisse') }}
        />
        <div className="bedv-grid bedv-grid--3">
          {letzte.map(b => <MatchCard key={b.id} begegnung={b} />)}
        </div>
      </section>

      {/* ── Tabellen ── */}
      <section className="bedv-section bedv-section--tinted">
        <div className="bedv-shell">
          <SectionHead
            eyebrow="Stand heute"
            titel="Tabellen"
            text="Drei Staffeln als Beispiel — jede Liga hat ihre vollständige Tabelle mit Form, Differenz und Auf-/Abstiegsplätzen."
            aktion={{ label: 'Alle Tabellen', href: bedvPath('/ligen') }}
          />
          <TabellenKarten ligen={['bezirksliga', 'a-liga', 'b1']} />
        </div>
      </section>

      {/* ── Pokal ── */}
      <section className="bedv-section bedv-shell">
        <SectionHead
          eyebrow="K.-o.-Runde"
          titel={POKAL_NAME}
          text="Hin- und Rückspiel bis zum Halbfinale, das Finale an neutralem Ort. Mit Turnierbaum über alle Runden."
          aktion={{ label: 'Zum Turnierbaum', href: bedvPath('/pokal') }}
        />
        <div className="bedv-grid bedv-grid--2">
          {pokalPaarungen.map(p => {
            const heim = teamById(p.heimTeamId ?? '');
            const gast = teamById(p.gastTeamId ?? '');
            if (!heim || !gast) return null;
            const stand = gesamtstand(p);
            return (
              <Card key={p.id} href={bedvPath('/pokal')} padding="15px 17px">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Badge ton="accent">Halbfinale</Badge>
                  <span className="bedv-kicker">
                    {p.rueckspiel ? 'Entschieden' : 'Rückspiel steht aus'}
                  </span>
                </div>
                <div style={{ display: 'grid', gap: 9 }}>
                  {[[heim, stand?.[0]], [gast, stand?.[1]]].map(([team, punkte], i) => {
                    const t = team as typeof heim;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <TeamWappen team={t} groesse={28} />
                        <span style={{ flex: 1, minWidth: 0, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </span>
                        <span className="bedv-score" style={{ fontSize: '1.1rem' }}>
                          {punkte as number | undefined ?? '–'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {p.hinspiel && (
                  <div style={{ marginTop: 11, paddingTop: 10, borderTop: '1px solid var(--bedv-line-soft)', fontSize: '0.78rem', color: 'var(--bedv-ink-dim)' }}>
                    Hinspiel {datumKurz(p.hinspiel.datum)}: {p.hinspiel.heim}:{p.hinspiel.gast}
                    {p.rueckspiel && ` · Rückspiel ${datumKurz(p.rueckspiel.datum)}: ${p.rueckspiel.heim}:${p.rueckspiel.gast}`}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── News und Termine ── */}
      <section className="bedv-section bedv-section--tinted">
        <div className="bedv-shell">
          <SectionHead
            eyebrow="Aus dem Verband"
            titel="News & Termine"
            aktion={{ label: 'Alle Beiträge', href: bedvPath('/news') }}
          />
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 2.1fr) minmax(0, 1fr)' }} className="bedv-news-layout">
            <div className="bedv-grid bedv-grid--3" style={{ alignContent: 'start' }}>
              {news.map(n => <NewsCard key={n.slug} beitrag={n} />)}
            </div>

            <Card padding={0} style={{ overflow: 'hidden', alignSelf: 'start' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--bedv-line)', background: 'var(--bedv-tint)' }}>
                <h3 style={{ fontSize: '1.02rem' }}>Nächste Termine</h3>
              </div>
              <div style={{ padding: '6px 16px 12px' }}>
                {termine.map(t => (
                  <Link
                    key={t.slug}
                    href={bedvPath(`/events#${t.slug}`)}
                    style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--bedv-line-soft)' }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 44, flex: 'none', textAlign: 'center', borderRadius: 9,
                        background: 'var(--bedv-blue-mist)', color: 'var(--bedv-blue-deep)',
                        padding: '5px 0', fontFamily: 'var(--bedv-font-display)',
                      }}
                    >
                      <span style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                        {wochentagKurz(t.datum).toUpperCase()}
                      </span>
                      <span style={{ display: 'block', fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.1 }}>
                        {t.datum.slice(8)}
                      </span>
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.35 }}>{t.titel}</span>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--bedv-ink-dim)', marginTop: 2 }}>
                        {datum(t.datum)}{t.uhrzeit ? `, ${t.uhrzeit}` : ''} · {t.ort}
                      </span>
                    </span>
                  </Link>
                ))}
                <Link href={bedvPath('/events')} className="bedv-btn bedv-btn--quiet bedv-btn--sm" style={{ marginTop: 10 }}>
                  Alle Termine <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Plattform statt Homepage ── */}
      <section className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: 52 }}>
          <div style={{ maxWidth: 640 }}>
            <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Nach dem Login</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4.2vw, 2.3rem)', marginTop: 8 }}>
              Aus einer Homepage wird eine Plattform.
            </h2>
            <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 12, fontSize: '1.02rem', lineHeight: 1.65 }}>
              Mannschaftsführer melden ihre Mannschaft, pflegen den Kader und reichen den
              Spielbericht ein. Die Ligaleitung prüft und gibt frei — an einer Stelle, mit
              Verlauf. Kein Formular per Mail, kein Zettel, der verloren geht.
            </p>
          </div>

          <div className="bedv-grid bedv-grid--4" style={{ marginTop: 28 }}>
            {[
              { icon: Users, titel: 'Mannschaft melden', text: 'Sechs Schritte, geführt — mit Prüfung vor dem Absenden.', ziel: '/mein-bereich/mannschaft-anmelden' },
              { icon: ClipboardList, titel: 'Digitaler Spielbericht', text: 'Paarungen und Legs am Telefon, Gesamtstand rechnet mit.', ziel: '/mein-bereich/spielbericht' },
              { icon: ScanLine, titel: 'Papierbogen fotografieren', text: 'Erkennen lassen, prüfen, freigeben — als Zukunftsfeature.', ziel: '/mein-bereich/spielbericht/upload' },
              { icon: ShieldCheck, titel: 'Ligaleitung', text: 'Offene Meldungen und Berichte mit Freigabe in einem Blick.', ziel: '/ligaleitung' },
            ].map(k => (
              <Link
                key={k.titel}
                href={bedvPath(k.ziel)}
                style={{
                  display: 'block', padding: '16px 17px', borderRadius: 13,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <k.icon size={20} aria-hidden="true" style={{ color: 'var(--bedv-accent)' }} />
                <div style={{ fontFamily: 'var(--bedv-font-display)', fontWeight: 700, marginTop: 10, color: '#fff' }}>
                  {k.titel}
                </div>
                <p style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.84rem', marginTop: 5, lineHeight: 1.5 }}>
                  {k.text}
                </p>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 26 }}>
            <Link href={bedvPath('/login')} className="bedv-btn bedv-btn--accent">
              Rolle wählen und ausprobieren <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
