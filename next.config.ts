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
};

export default nextConfig;
