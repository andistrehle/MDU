import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Der Ergebnis-Upload der MDC schickt ein Foto als Server-Action. Der
    // Browser verkleinert es vorher auf die lange Kante 1600 px (siehe
    // `components/mdc/ergebnis-upload.tsx`), damit liegt es üblicherweise
    // unter 500 KB. Die Voreinstellung von 1 MB wäre trotzdem knapp: Ein
    // dicht beschriebener Zettel mit viel Bilddetail kommt darüber, und die
    // Base64-Kodierung schlägt noch ein Drittel drauf.
    serverActions: { bodySizeLimit: '5mb' },
  },

  // ── Tab-Symbol auf mdc-ranking.de ──
  //
  // `app/favicon.ico` ist die Dartscheibe der MDU. Next behandelt diese Datei
  // besonders: Der Verweis darauf steht in JEDER Seite des Projekts, auch
  // unter `/mdc` — anders als `app/icon.png` lässt er sich durch `icons` im
  // MDC-Layout nicht ersetzen. Und wer ein Symbol sucht (Google, Browser,
  // WhatsApp), fragt ohnehin zuerst stumpf `/favicon.ico` ab.
  //
  // Auf der eigenen Domain zeigt das also das falsche Logo. Deshalb wird dort
  // — und nur dort, das MDU-Projekt setzt die Variable nicht — auf das runde
  // MDC-Emblem umgeschrieben. `beforeFiles` ist nötig: Erst danach greift
  // Next auf die eigenen Dateien zu, sonst gewönne die MDU-Datei.
  //
  // Google zeigt sein Symbol aus dem eigenen Zwischenspeicher und holt es
  // nicht bei jedem Durchlauf neu — bis das Suchergebnis nachzieht, können
  // Tage vergehen. Im Browser reicht ein harter Neuladen.
  // ── Interne Turnierseite (public/intern-x7k2/) aus dem Index halten ──
  //
  // Die statische Seite unter /intern-x7k2/turnier.html ist nur über den
  // direkten Link erreichbar (nirgends verlinkt, nicht in Sitemap/robots-
  // Allow). Zusätzlich bekommt der ganze Pfad per HTTP-Header ein hartes
  // noindex/nofollow mit — falls die URL doch irgendwo auftaucht, nimmt sie
  // keine Suchmaschine auf.
  async headers() {
    return [
      {
        source: '/intern-x7k2/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },

  async rewrites() {
    if (process.env.NEXT_PUBLIC_MDC_STANDALONE !== '1') return [];
    const emblem = '/mdc/icon.png';
    return {
      beforeFiles: [
        { source: '/favicon.ico', destination: emblem },
        { source: '/icon.png', destination: emblem },
        { source: '/apple-icon.png', destination: emblem },
        { source: '/apple-touch-icon.png', destination: emblem },
        { source: '/apple-touch-icon-precomposed.png', destination: emblem },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
