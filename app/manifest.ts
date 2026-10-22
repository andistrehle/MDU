// ============================================================
// Web-App-Manifest (Betreiber, 22.10.2026): MDU als installierbare App
// ============================================================
// Damit lässt sich die Seite „Zum Home-Bildschirm“ hinzufügen und startet im
// Vollbild wie eine App — Voraussetzung für Push auf dem iPhone (iOS 16.4+
// nur für installierte Web-Apps). Symbol = das gelbe MDU-Logo (app/icon.png,
// daraus public/app/*). Dasselbe Repo läuft als mdc-ranking.de; dort bekommt
// die MDC ihr eigenes, schlichtes Manifest, damit niemand die MDU installiert.
// ============================================================

import type { MetadataRoute } from 'next';
import { MDC_STANDALONE } from '@/lib/mdc/site';

export default function manifest(): MetadataRoute.Manifest {
  if (MDC_STANDALONE) {
    return {
      name: 'Munich Darts Challenge',
      short_name: 'MDC',
      start_url: '/',
      display: 'browser',
      icons: [{ src: '/mdc/icon.png', sizes: '512x512', type: 'image/png' }],
    };
  }
  return {
    id: '/',
    name: 'Münchner Dart Union',
    short_name: 'MDU',
    description: 'Tabellen, Spielpläne, Spielberichte und Team Manager der Münchner Dart Union.',
    lang: 'de',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F1D35C',
    theme_color: '#1B2433',
    icons: [
      { src: '/app/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/app/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/app/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
