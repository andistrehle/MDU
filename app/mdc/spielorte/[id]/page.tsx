import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, MapPin, Phone, Target } from 'lucide-react';
import { Dartboard } from '@/components/mdc/dartboard';
import {
  PHONES_PUBLIC, VENUES, getVenue, nextDatesForVenue, venueMapsUrl, venueWeekdayLabel,
} from '@/data/venues';
import { tournamentsAtVenue } from '@/data/tournament-results';
import { getPlayer, playerName } from '@/data/players';
import { RUNNING_SEASON, todayInMunich } from '@/data/season';
import { formatDate, formatNumber, formatTime, weekdayName } from '@/lib/mdc/format';

export function generateStaticParams() {
  return VENUES.map(venue => ({ id: venue.id }));
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await props.params;
  const venue = getVenue(id);
  if (!venue) return { title: 'Spielort' };
  return {
    title: venue.name,
    description: `MDC-Spielort ${venue.name} in ${venue.zip} ${venue.city}: ${venueWeekdayLabel(venue)} ab ${venue.time} Uhr, ${venue.boards} Dartautomaten.`,
  };
}

export default async function SpielortDetailPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const venue = getVenue(id);
  if (!venue) notFound();

  // Kommende Termine ergeben sich aus dem festen Spieltag des Lokals —
  // eine Terminliste führt die MDC nicht.
  const heute = todayInMunich();
  const termine = nextDatesForVenue(venue.id, heute, 4);

  // Gespielte Turniere dieses Lokals — beide Saisons, neueste zuerst.
  const gespielt = tournamentsAtVenue(venue.id);
  const starts = gespielt.reduce((sum, t) => sum + t.participants, 0);
  const laufend = gespielt.filter(t => t.seasonId === RUNNING_SEASON.id).length;

  return (
    <>
      <section className="mdc-hero">
        <Dartboard className="mdc-hero-board mdc-spin-slow" showNumbers={false} tone="brand" />
        <div className="mdc-shell" style={{ position: 'relative', zIndex: 2, paddingBlock: '36px 44px' }}>
          <Link href="/mdc/spielorte" className="mdc-chip" style={{ marginBottom: 18 }}>
            <ArrowLeft size={13} />
            Alle Spielorte
          </Link>

          <span className="mdc-kicker">{venue.zip} {venue.city}</span>
          <h1 className="mdc-display mdc-h2" style={{ marginTop: 12 }}>{venue.name}</h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
            <span className="mdc-chip mdc-chip-red">
              {venueWeekdayLabel(venue)} · {formatTime(venue.time)}
            </span>
          </div>
        </div>
      </section>

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <div className="mdc-card" style={{ padding: '20px' }}>
              <MapPin size={19} style={{ color: 'var(--mdc-red)' }} />
              <h2 className="mdc-display" style={{ fontSize: '1.05rem', marginTop: 10 }}>Adresse</h2>
              <p style={{ marginTop: 7, color: 'var(--mdc-ink-soft)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {venue.street}<br />{venue.zip} {venue.city}
              </p>
              <a
                href={venueMapsUrl(venue)}
                target="_blank"
                rel="noreferrer noopener"
                className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                style={{ marginTop: 14 }}
              >
                Auf der Karte
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="mdc-card" style={{ padding: '20px' }}>
              <Phone size={19} style={{ color: 'var(--mdc-red)' }} />
              <h2 className="mdc-display" style={{ fontSize: '1.05rem', marginTop: 10 }}>Kontakt</h2>
              {PHONES_PUBLIC ? (
                <ul style={{ marginTop: 7 }}>
                  {venue.phones.map(phone => (
                    <li key={phone} className="mdc-num" style={{ color: 'var(--mdc-ink-soft)', fontSize: '0.95rem' }}>
                      <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ marginTop: 7, fontSize: '0.88rem', color: 'var(--mdc-ink-soft)', lineHeight: 1.6 }}>
                  Die Nummern des Lokals liegen vor, sind aber noch nicht
                  freigegeben — überwiegend Mobilnummern. Der Betreiber
                  entscheidet, ob sie öffentlich stehen.
                </p>
              )}
            </div>

            <div className="mdc-card" style={{ padding: '20px' }}>
              <Target size={19} style={{ color: 'var(--mdc-red)' }} />
              <h2 className="mdc-display" style={{ fontSize: '1.05rem', marginTop: 10 }}>Spielbetrieb</h2>
              <p style={{ marginTop: 7, color: 'var(--mdc-ink-soft)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                {venue.boards} Dartautomaten<br />
                {venueWeekdayLabel(venue)}, Start {formatTime(venue.time)}<br />
                {gespielt.length > 0
                  ? `${gespielt.length} ausgewertete Ranking-Turniere`
                  : 'noch keine ausgewerteten Turniere'}
              </p>
            </div>
          </div>

          {termine.length > 0 && (
            <div>
              <h2 className="mdc-display mdc-h3" style={{ marginBottom: 6 }}>Nächste Termine</h2>
              <p style={{ color: 'var(--mdc-ink-soft)', fontSize: '0.88rem', marginBottom: 16 }}>
                {venueWeekdayLabel(venue)}, jeweils ab {formatTime(venue.time)}. Anmelden
                im Lokal bis kurz vor dem Start — einen Meldestand führt die MDC nicht.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {termine.map(datum => (
                  <span
                    key={datum}
                    className="mdc-card"
                    style={{ padding: '10px 14px', display: 'inline-flex', gap: 8, alignItems: 'baseline' }}
                  >
                    <span className="mdc-display" style={{ fontSize: '0.95rem' }}>
                      {datum === heute ? 'Heute' : weekdayName(datum)}
                    </span>
                    <span className="mdc-num" style={{ fontSize: '0.84rem', color: 'var(--mdc-ink-dim)' }}>
                      {formatDate(datum)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {gespielt.length > 0 && (
            <div>
              <h2 className="mdc-display mdc-h3" style={{ marginBottom: 6 }}>
                Gespielte Turniere
              </h2>
              <p style={{ color: 'var(--mdc-ink-soft)', fontSize: '0.88rem', marginBottom: 16 }}>
                {gespielt.length} Ranking-Turniere mit {formatNumber(starts)} Starts, davon{' '}
                {laufend} in der laufenden Saison {RUNNING_SEASON.label} — hier die
                letzten zehn.
              </p>

              <div className="mdc-card">
                <table className="mdc-table">
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th className="mdc-td-num">Starter</th>
                      <th className="mdc-hide-narrow">Sieger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gespielt.slice(0, 10).map(t => {
                      const sieger = t.results[0].playerId ? getPlayer(t.results[0].playerId) : undefined;
                      return (
                        <tr key={t.id}>
                          <td className="mdc-cell-name">
                            <Link href={`/mdc/turniere/ergebnisse/${t.id}`} className="mdc-num">
                              {formatDate(t.date)}
                            </Link>
                            <span className="mdc-row-meta mdc-narrow-only">
                              Sieger: {sieger ? playerName(sieger) : `Passnr. ${t.results[0].passNr}`}
                            </span>
                          </td>
                          <td className="mdc-td-num mdc-num">{t.participants}</td>
                          <td className="mdc-hide-narrow">
                            {sieger
                              ? <Link href={`/mdc/spieler/${sieger.id}`}>{playerName(sieger)}</Link>
                              : `Passnr. ${t.results[0].passNr}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Link
                href="/mdc/turniere/ergebnisse"
                className="mdc-btn mdc-btn-ghost mdc-btn-sm"
                style={{ marginTop: 16 }}
              >
                Alle {gespielt.length} Turniere ansehen
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
