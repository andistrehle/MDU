// ============================================================
// Route Handler: /api/chat (POST) — streamt die Bot-Antwort
// ============================================================
// Nimmt ein messages-Array (User/Assistant-Turns) entgegen, setzt serverseitig
// den System-Prompt, ruft die Anthropic Messages API auf und streamt den Text
// als plain-text zurück. Der API-Key kommt aus process.env und verlässt den
// Server nie.

import Anthropic from "@anthropic-ai/sdk";
import { getSystemPrompt } from "@/lib/system-prompt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  MODEL,
  MAX_TOKENS,
  MAX_INPUT_CHARS,
  MAX_HISTORY_TURNS,
  FRIENDLY_ERROR,
  RATE_LIMIT_NOTICE,
} from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Role = "user" | "assistant";
interface ChatMessage {
  role: Role;
  content: string;
}

/** Plain-Text-Antwort (kein Streaming) mit freundlicher Meldung. */
function plainText(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function sanitizeMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const out: ChatMessage[] = [];
  for (const m of input) {
    if (!m || typeof m !== "object") return null;
    const role = (m as Record<string, unknown>).role;
    const content = (m as Record<string, unknown>).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const trimmed = content.trim();
    if (!trimmed) continue;
    out.push({ role, content: trimmed });
  }
  return out;
}

export async function POST(request: Request): Promise<Response> {
  const now = Date.now();

  // 1) Abuse-Schutz pro IP.
  const ip = getClientIp(request);
  if (!checkRateLimit(ip, now)) {
    return plainText(RATE_LIMIT_NOTICE, 429);
  }

  // 2) Body parsen.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return plainText(FRIENDLY_ERROR, 400);
  }

  const messages = sanitizeMessages(
    (body as Record<string, unknown> | null)?.messages,
  );
  if (!messages || messages.length === 0) {
    return plainText(FRIENDLY_ERROR, 400);
  }

  // 3) Input-Limit: die letzte Nutzer-Nachricht darf max. MAX_INPUT_CHARS lang sein.
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return plainText(FRIENDLY_ERROR, 400);
  if (lastUser.content.length > MAX_INPUT_CHARS) {
    return plainText(
      `Deine Nachricht ist zu lang (max. ${MAX_INPUT_CHARS} Zeichen).`,
      413,
    );
  }

  // 4) Verlauf auf die letzten Turns begrenzen.
  const trimmed = messages.slice(-MAX_HISTORY_TURNS);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Ehrlich bleiben: keine erfundene Antwort, sondern klarer Fehler.
    return plainText(FRIENDLY_ERROR, 500);
  }

  const client = new Anthropic({ apiKey });

  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: getSystemPrompt(),
      messages: trimmed.map((m) => ({ role: m.role, content: m.content })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch {
          // Fehler mitten im Stream: sauber schließen. Der Client zeigt den
          // bereits erhaltenen Teil bzw. den freundlichen Fallback.
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    // Fehler vor dem ersten Token: freundliche Meldung, keine Details.
    return plainText(FRIENDLY_ERROR, 502);
  }
}
