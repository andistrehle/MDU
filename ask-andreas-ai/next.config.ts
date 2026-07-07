import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Dieses Projekt liegt im Unterordner eines größeren Repos. Ohne feste Root
  // klettert Next/Turbopack nach oben und zieht fremde Configs (z. B. das
  // Tailwind-PostCSS der Darts-Plattform) an. Root hier festnageln.
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  // Der System-Prompt liegt als Markdown-Datei vor und wird serverseitig zur
  // Laufzeit eingelesen (lib/system-prompt.ts). Damit die Datei im Vercel-
  // Serverless-Bundle der /api/chat-Route landet, wird sie hier explizit
  // ins File-Tracing aufgenommen.
  outputFileTracingIncludes: {
    "/api/chat": ["./system-prompt-ask-andreas-ai.md"],
  },
};

export default nextConfig;
