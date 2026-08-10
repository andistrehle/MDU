// ============================================================
// Tennis Kail — Strukturierte Daten und Metadaten
// ============================================================
//
// Für eine Anlage mit zwei Standorten ist `SportsActivityLocation` der
// passende Typ: Suchmaschinen zeigen daraus Öffnungszeiten, Adresse und
// Telefonnummer direkt an — genau die drei Dinge, nach denen Gäste
// tatsächlich suchen.
//
// WICHTIG: Die Demo ist auf noindex gestellt (app/tk/layout.tsx). Die
// strukturierten Daten sind vorbereitet, wirken aber erst, wenn aus der
// Demo eine echte Seite unter eigener Domain wird — dann muss auch
// `SITE` gesetzt werden.
// ============================================================

import { BRAND, LOCATIONS, WEEKDAY_LABEL, courtsOf } from '@/data/tk/facility';
import { PRICE_CARDS } from '@/data/tk/pricing';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mdudarts.de';

const SCHEMA_DAY = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

function openingHours(locationIndex: number) {
  const loc = LOCATIONS[locationIndex];
  return loc.hours.flatMap((h) =>
    h.blocks.map((b) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: SCHEMA_DAY[h.weekday],
      opens: `${String(Math.floor(b.from / 60)).padStart(2, '0')}:${String(b.from % 60).padStart(2, '0')}`,
      closes: `${String(Math.floor(b.to / 60)).padStart(2, '0')}:${String(b.to % 60).padStart(2, '0')}`,
    })),
  );
}

/** Organisation mit beiden Standorten. */
export function facilityJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': LOCATIONS.map((loc, i) => ({
      '@type': 'SportsActivityLocation',
      '@id': `${SITE}/tk#${loc.id}`,
      name: loc.name,
      description: loc.blurb,
      url: `${SITE}/tk/anlage#${loc.id}`,
      telephone: loc.phone ?? BRAND.phone,
      email: loc.email ?? BRAND.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: loc.street,
        postalCode: loc.zip,
        addressLocality: loc.city,
        addressCountry: 'DE',
      },
      geo: { '@type': 'GeoCoordinates', latitude: loc.lat, longitude: loc.lng },
      openingHoursSpecification: openingHours(i),
      amenityFeature: [
        {
          '@type': 'LocationFeatureSpecification',
          name: 'Sandplätze',
          value: courtsOf(loc.id).filter((c) => c.kind === 'freiplatz').length,
        },
        {
          '@type': 'LocationFeatureSpecification',
          name: 'Hallenplätze',
          value: courtsOf(loc.id).filter((c) => c.kind === 'halle').length,
        },
      ],
      sport: 'Tennis',
    })),
  };
}

/** Preisliste als Angebotskatalog. */
export function priceJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Platzmiete und Training bei Tennis Kail',
    itemListElement: PRICE_CARDS.map((card, i) => ({
      '@type': 'OfferCatalog',
      position: i + 1,
      name: card.title,
      description: card.subtitle,
      itemListElement: card.rows.map((row) => ({
        '@type': 'Offer',
        name: `${card.title} — ${row.label}`,
        price: row.value.replace(/[^\d,]/g, '').replace(',', '.'),
        priceCurrency: 'EUR',
      })),
    })),
  };
}

/** Kurs oder Camp als Veranstaltung. */
export function courseJsonLd(course: {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  priceCents: number;
  locationId: string;
}) {
  const loc = LOCATIONS.find((l) => l.id === course.locationId) ?? LOCATIONS[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: course.title,
    description: course.description,
    startDate: course.startDate,
    endDate: course.endDate ?? course.startDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: loc.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: loc.street,
        postalCode: loc.zip,
        addressLocality: loc.city,
        addressCountry: 'DE',
      },
    },
    offers: {
      '@type': 'Offer',
      price: (course.priceCents / 100).toFixed(2),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
    },
  };
}

/** Lesbare Öffnungszeiten für Textstellen. */
export function hoursSentence(locationIndex: number): string {
  const loc = LOCATIONS[locationIndex];
  return loc.hours
    .filter((h) => h.blocks.length > 0)
    .map(
      (h) =>
        `${WEEKDAY_LABEL[h.weekday]} ${h.blocks
          .map((b) => `${Math.floor(b.from / 60)}–${Math.floor(b.to / 60)} Uhr`)
          .join(' und ')}`,
    )
    .join(', ');
}
