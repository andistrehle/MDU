// ============================================================
// Tennis Kail — Pro-Shop (DEMO)
// ============================================================
//
// Frei erfundenes Sortiment. Bewusst als Abhol-Shop modelliert: Es gibt
// keinen Versand und keine Online-Zahlung, sondern Reservierung an der
// Anlage. Das passt zu einem Betrieb mit Theke und Bespannungsservice —
// und macht aus der Demo kein Versprechen, das ein Shop-System einlösen
// müsste.
// ============================================================

import type { ShopItem } from '@/lib/tk/types';

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'bespannung-standard',
    name: 'Bespannung · Standard',
    category: 'service',
    teaser: 'Saite nach Wahl, fertig bis zum nächsten Tag. Saite ab 8 €.',
    priceCents: 1500,
    inStock: true,
    pickupOnly: true,
    imageSlot: 'shop-bespannung',
    badge: 'Über Nacht',
  },
  {
    id: 'bespannung-express',
    name: 'Bespannung · Express',
    category: 'service',
    teaser: 'Vor Ort abgeben, nach dem Spiel mitnehmen. Innerhalb von 3 Stunden.',
    priceCents: 2400,
    inStock: true,
    pickupOnly: true,
    imageSlot: 'shop-bespannung',
  },
  {
    id: 'griffband-3er',
    name: 'Griffbänder, 3er-Pack',
    category: 'zubehoer',
    teaser: 'Saugstark, weiß oder schwarz. Reicht für eine halbe Saison.',
    priceCents: 990,
    inStock: true,
    pickupOnly: true,
    imageSlot: 'shop-griffband',
  },
  {
    id: 'baelle-4er',
    name: 'Turnierbälle, 4er-Dose',
    category: 'baelle',
    teaser: 'Die Dose, mit der auf der Anlage gespielt wird. Sand und Halle.',
    priceCents: 890,
    compareCents: 1090,
    inStock: true,
    pickupOnly: true,
    imageSlot: 'shop-baelle',
    badge: 'Hausmarke',
  },
  {
    id: 'baelle-karton',
    name: 'Bälle im Karton, 18 Dosen',
    category: 'baelle',
    teaser: 'Für Mannschaften und Vielspieler — Abholung nach Absprache.',
    priceCents: 13900,
    inStock: true,
    pickupOnly: true,
    imageSlot: 'shop-baelle',
  },
  {
    id: 'kids-schlaeger-23',
    name: 'Kinderschläger 23 Zoll',
    category: 'schlaeger',
    teaser: 'Leicht, kurz, für die ersten Jahre. Auch als Leihgerät im Kurs.',
    priceCents: 4900,
    inStock: true,
    pickupOnly: true,
    imageSlot: 'shop-kids-schlaeger',
  },
  {
    id: 'testschlaeger',
    name: 'Testschläger für eine Woche',
    category: 'schlaeger',
    teaser: 'Drei Modelle zur Auswahl. Kaufst du danach, wird die Gebühr angerechnet.',
    priceCents: 1000,
    inStock: true,
    pickupOnly: true,
    imageSlot: 'shop-testschlaeger',
    badge: 'Anrechenbar',
  },
  {
    id: 'saite-polyester',
    name: 'Polyestersaite, Satz',
    category: 'bespannung',
    teaser: 'Kontrollsaite für harte Schläger. Hält bei Vielspielern 10–15 Stunden.',
    priceCents: 1200,
    inStock: true,
    pickupOnly: true,
    imageSlot: 'shop-saite',
  },
  {
    id: 'saite-multifil',
    name: 'Multifilamentsaite, Satz',
    category: 'bespannung',
    teaser: 'Weich und armschonend — die Empfehlung bei Tennisarm.',
    priceCents: 1600,
    inStock: false,
    pickupOnly: true,
    imageSlot: 'shop-saite',
    badge: 'Nachbestellt',
  },
  {
    id: 'daempfer',
    name: 'Schwingungsdämpfer',
    category: 'zubehoer',
    teaser: 'Klein, günstig, an der Theke immer da.',
    priceCents: 350,
    inStock: true,
    pickupOnly: true,
    imageSlot: 'shop-daempfer',
  },
];

export const SHOP_CATEGORIES: { id: ShopItem['category'] | 'alle'; label: string }[] = [
  { id: 'alle', label: 'Alles' },
  { id: 'service', label: 'Service' },
  { id: 'schlaeger', label: 'Schläger' },
  { id: 'baelle', label: 'Bälle' },
  { id: 'bespannung', label: 'Saiten' },
  { id: 'zubehoer', label: 'Zubehör' },
];
