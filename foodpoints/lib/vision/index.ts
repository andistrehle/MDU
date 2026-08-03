import 'server-only';
import type { VisionProvider } from './types';
import { MockVisionProvider } from './mock';

/**
 * Provider-Auswahl per ENV (server-only):
 * - VISION_PROVIDER=claude + VISION_API_KEY → ClaudeVisionProvider
 * - sonst → MockVisionProvider (Demo-Modus, deterministische Ergebnisse)
 */
export async function getVisionProvider(): Promise<VisionProvider> {
  const provider = process.env.VISION_PROVIDER ?? 'mock';
  const apiKey = process.env.VISION_API_KEY;
  if (provider === 'claude' && apiKey) {
    const { ClaudeVisionProvider } = await import('./claude');
    const model = process.env.VISION_MODEL ?? 'claude-sonnet-5';
    return new ClaudeVisionProvider(apiKey, model);
  }
  return new MockVisionProvider();
}
