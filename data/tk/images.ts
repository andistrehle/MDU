// ============================================================
// Tennis Kail — Bildstrategie
// ============================================================
//
// Grundsatz aus dem Auftrag: Originalmaterial hat Vorrang vor Stockfotos.
// Umgesetzt ist das als Zwei-Stufen-Modell:
//
//   1. `scripts/tk-fetch-images.mjs` lädt alle Bilder von tennis-kail.de,
//      legt sie unter `public/tk/original/` ab und schreibt ein Manifest
//      nach `data/tk/original-images.json`.
//   2. Jeder Bildplatz („Slot") unten trägt einen `match`-Schlüssel. Findet
//      sich im Manifest ein Original mit passendem Schlüssel, wird es
//      angezeigt. Sonst zeichnet die Anwendung eine eigene, zum Ort
//      passende Grafik (components/tk/media/facility-art.tsx).
//
// STAND DIESER DEMO — ehrlich: In der Umgebung, in der die Demo gebaut
// wurde, ist www.tennis-kail.de vom Egress-Proxy blockiert (HTTP 403 im
// CONNECT-Tunnel). Es konnte KEIN einziges Originalbild geladen werden.
// Deshalb ist das Manifest leer und überall greift Stufe 2. Sobald das
// Skript in einer Umgebung mit Netzzugang läuft, erscheinen die Fotos ohne
// jede Code-Änderung. Stockfotos kommen bewusst nirgends zum Einsatz —
// lieber eine eigene Grafik als ein fremder Platz, der nicht Kail ist.
// ============================================================

import manifest from './original-images.json';

export type ArtVariant =
  | 'sand-court'
  | 'indoor-court'
  | 'aerial'
  | 'net'
  | 'ball'
  | 'portrait'
  | 'kids'
  | 'camp'
  | 'event'
  | 'shop';

export interface ImageSlot {
  id: string;
  /** Beschreibung für Alternativtext und für die Redaktion. */
  alt: string;
  /** Grafikvariante, falls kein Original vorliegt. */
  variant: ArtVariant;
  /** Farbstimmung der Ersatzgrafik. */
  tone: 'clay' | 'forest' | 'night' | 'sun' | 'chalk';
  /**
   * Schlüsselwörter, nach denen das Skript im Original-Manifest sucht
   * (Dateiname oder Alternativtext der Quellseite).
   */
  match: string[];
}

export const IMAGE_SLOTS: Record<string, ImageSlot> = {
  'hero': {
    id: 'hero',
    alt: 'Sandplätze von Tennis Kail am Perlacher Forst im Abendlicht',
    variant: 'aerial', tone: 'clay',
    match: ['anlage', 'aussen', 'platz', 'header', 'start', 'hero'],
  },
  'anlage-harlaching': {
    id: 'anlage-harlaching',
    alt: 'Anlage Harlaching: Halle und Sandplätze an der Oberbiberger Straße',
    variant: 'aerial', tone: 'forest',
    match: ['harlaching', 'oberbiberger', 'anlage'],
  },
  'anlage-neuperlach': {
    id: 'anlage-neuperlach',
    alt: 'Anlage Neuperlach mit acht Freiplätzen',
    variant: 'sand-court', tone: 'clay',
    match: ['neuperlach', 'kurt-eisner', 'freiplatz'],
  },
  'halle': {
    id: 'halle',
    alt: 'Blick in die Tennishalle',
    variant: 'indoor-court', tone: 'night',
    match: ['halle', 'indoor', 'teppich'],
  },
  'sand': {
    id: 'sand',
    alt: 'Frisch abgezogener Sandplatz',
    variant: 'sand-court', tone: 'clay',
    match: ['sand', 'asche', 'freiplatz'],
  },
  'net': {
    id: 'net',
    alt: 'Netz und Mittelband auf dem Platz',
    variant: 'net', tone: 'chalk',
    match: ['netz'],
  },
  'trainer-persson': {
    id: 'trainer-persson', alt: 'Trainer Niklas Persson',
    variant: 'portrait', tone: 'clay', match: ['persson', 'trainer'],
  },
  'trainer-dietrich': {
    id: 'trainer-dietrich', alt: 'Trainer Ekkehard Dietrich',
    variant: 'portrait', tone: 'forest', match: ['dietrich', 'trainer'],
  },
  'trainer-hoefer': {
    id: 'trainer-hoefer', alt: 'Trainerin Mara Höfer (Demo-Person)',
    variant: 'portrait', tone: 'sun', match: ['hoefer', 'jugend'],
  },
  'kids-bambini': { id: 'kids-bambini', alt: 'Kinder beim Training auf dem Kleinfeld', variant: 'kids', tone: 'sun', match: ['kinder', 'bambini', 'kids'] },
  'kids-orange': { id: 'kids-orange', alt: 'Kindertraining mit orangem Ball', variant: 'kids', tone: 'clay', match: ['kinder', 'jugend'] },
  'kids-jugend': { id: 'kids-jugend', alt: 'Jugendtraining auf dem Großfeld', variant: 'kids', tone: 'forest', match: ['jugend', 'mannschaft'] },
  'camp-herbst': { id: 'camp-herbst', alt: 'Herbstcamp in der Halle', variant: 'camp', tone: 'night', match: ['camp', 'ferien'] },
  'camp-ostern': { id: 'camp-ostern', alt: 'Ostercamp zum Saisonstart auf Sand', variant: 'camp', tone: 'clay', match: ['camp', 'ostern'] },
  'camp-sommer': { id: 'camp-sommer', alt: 'Sommercamp am Perlacher Forst', variant: 'camp', tone: 'sun', match: ['camp', 'sommer'] },
  'kurs-wiedereinstieg': { id: 'kurs-wiedereinstieg', alt: 'Kurs für Wiedereinsteiger', variant: 'net', tone: 'forest', match: ['kurs', 'erwachsene'] },
  'kurs-aufschlag': { id: 'kurs-aufschlag', alt: 'Aufschlagtraining', variant: 'ball', tone: 'sun', match: ['aufschlag', 'kurs'] },
  'event-sommerfest': { id: 'event-sommerfest', alt: 'Sommerfest auf der Anlage', variant: 'event', tone: 'sun', match: ['fest', 'sommerfest'] },
  'event-night': { id: 'event-night', alt: 'Flutlicht am Abend', variant: 'event', tone: 'night', match: ['flutlicht', 'abend'] },
  'event-halle': { id: 'event-halle', alt: 'Start der Hallensaison', variant: 'indoor-court', tone: 'night', match: ['halle', 'saison'] },
  'event-turnier': { id: 'event-turnier', alt: 'Turnier auf der Anlage', variant: 'event', tone: 'clay', match: ['turnier'] },
  'event-familie': { id: 'event-familie', alt: 'Familientag auf der Anlage', variant: 'kids', tone: 'sun', match: ['familie'] },
  'shop-bespannung': { id: 'shop-bespannung', alt: 'Bespannmaschine im Pro-Shop', variant: 'shop', tone: 'chalk', match: ['bespann', 'service', 'shop'] },
  'shop-griffband': { id: 'shop-griffband', alt: 'Griffbänder', variant: 'shop', tone: 'clay', match: ['griff', 'shop'] },
  'shop-baelle': { id: 'shop-baelle', alt: 'Tennisbälle in der Dose', variant: 'ball', tone: 'sun', match: ['ball', 'shop'] },
  'shop-kids-schlaeger': { id: 'shop-kids-schlaeger', alt: 'Kinderschläger', variant: 'shop', tone: 'sun', match: ['schlaeger', 'kinder'] },
  'shop-testschlaeger': { id: 'shop-testschlaeger', alt: 'Testschläger zum Ausleihen', variant: 'shop', tone: 'forest', match: ['schlaeger', 'test'] },
  'shop-saite': { id: 'shop-saite', alt: 'Saitensortiment', variant: 'shop', tone: 'chalk', match: ['saite', 'string'] },
  'shop-daempfer': { id: 'shop-daempfer', alt: 'Schwingungsdämpfer', variant: 'ball', tone: 'clay', match: ['daempfer', 'zubehoer'] },
};

export interface OriginalImage {
  /** Pfad unterhalb von /public, z. B. „/tk/original/anlage-01.jpg". */
  src: string;
  width: number;
  height: number;
  /** Ursprungs-URL auf tennis-kail.de, für die Rechteklärung. */
  sourceUrl: string;
  /** Alternativtext bzw. Dateiname der Quelle, kleingeschrieben. */
  keywords: string[];
}

interface Manifest {
  fetchedAt: string | null;
  note: string;
  images: OriginalImage[];
}

const ORIGINALS = manifest as Manifest;

export const ORIGINALS_AVAILABLE = ORIGINALS.images.length > 0;
export const ORIGINALS_NOTE = ORIGINALS.note;

/**
 * Passendes Originalbild für einen Slot suchen. Ein Bild darf mehrfach
 * verwendet werden — das ist besser als ein Fremdfoto, aber schlechter als
 * ein eigenes; das Skript sortiert deshalb nach Trefferzahl.
 */
export function originalFor(slotId: string): OriginalImage | undefined {
  const slot = IMAGE_SLOTS[slotId];
  if (!slot || ORIGINALS.images.length === 0) return undefined;
  let best: OriginalImage | undefined;
  let bestScore = 0;
  for (const img of ORIGINALS.images) {
    const score = slot.match.reduce(
      (acc, key) => acc + (img.keywords.some((k) => k.includes(key)) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      best = img;
      bestScore = score;
    }
  }
  return best;
}

export function slot(id: string): ImageSlot {
  return (
    IMAGE_SLOTS[id] ?? {
      id,
      alt: 'Tennis Kail',
      variant: 'net',
      tone: 'clay',
      match: [],
    }
  );
}
