"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  GREETING,
  SUGGESTION_CHIPS,
  MAX_INPUT_CHARS,
  MAX_MESSAGES_PER_SESSION,
  MAX_HISTORY_TURNS,
  FRIENDLY_ERROR,
  RATE_LIMIT_NOTICE,
} from "@/lib/config";

type Role = "user" | "assistant";
interface Msg {
  role: Role;
  content: string;
}

const GREETING_MSG: Msg = { role: "assistant", content: GREETING };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([GREETING_MSG]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [waiting, setWaiting] = useState(false); // vor dem ersten Token
  const [limitReached, setLimitReached] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const userCount = messages.filter((m) => m.role === "user").length;

  // Sanftes Auto-Scrolling zu neuen Nachrichten.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, waiting]);

  const autosize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 132) + "px";
  }, []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;
      if (content.length > MAX_INPUT_CHARS) return;

      if (userCount >= MAX_MESSAGES_PER_SESSION) {
        setLimitReached(true);
        return;
      }

      const userMsg: Msg = { role: "user", content };
      // Verlauf an die API: ohne die hartkodierte Begrüßung, nur die letzten Turns.
      const history = [...messages.slice(1), userMsg].slice(-MAX_HISTORY_TURNS);

      setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
      setInput("");
      setIsStreaming(true);
      setWaiting(true);
      requestAnimationFrame(autosize);

      const appendToLast = (chunk: string) =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });

      const replaceLast = (value: string) =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: value };
          return next;
        });

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        if (!res.ok || !res.body) {
          const fallback = (await res.text().catch(() => "")).trim();
          replaceLast(fallback || FRIENDLY_ERROR);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let first = true;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          if (first) {
            setWaiting(false);
            first = false;
          }
          appendToLast(chunk);
        }
        // Falls der Server ohne Inhalt schloss.
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last.role === "assistant" && last.content === "") {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: FRIENDLY_ERROR };
            return next;
          }
          return prev;
        });
      } catch {
        replaceLast(FRIENDLY_ERROR);
      } finally {
        setIsStreaming(false);
        setWaiting(false);
        // Session-Limit erreicht?
        if (userCount + 1 >= MAX_MESSAGES_PER_SESSION) setLimitReached(true);
      }
    },
    [messages, userCount, isStreaming, autosize],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const overLimit = input.length > MAX_INPUT_CHARS;
  const showChips = messages.length === 1 && !isStreaming;
  const composerDisabled = isStreaming || limitReached;

  return (
    <>
      <div className="messages" ref={scrollRef}>
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          const showTyping = isLast && m.role === "assistant" && waiting;
          return (
            <div key={i} className={`row ${m.role}`}>
              <div className="bubble">
                {showTyping ? (
                  <span className="typing" aria-label="Andreas AI schreibt …">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  m.content
                )}
              </div>
            </div>
          );
        })}

        {showChips && (
          <div className="chips">
            {SUGGESTION_CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                className="chip"
                onClick={() => send(c)}
                disabled={isStreaming}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {limitReached && (
          <div className="row assistant">
            <div className="bubble">{RATE_LIMIT_NOTICE}</div>
          </div>
        )}
      </div>

      <div className="composer">
        <form onSubmit={onSubmit}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autosize();
            }}
            onKeyDown={onKeyDown}
            placeholder={
              limitReached
                ? "Nachrichtenlimit erreicht"
                : "Frag etwas über Andreas …"
            }
            rows={1}
            maxLength={MAX_INPUT_CHARS + 200}
            disabled={composerDisabled}
            aria-label="Nachricht eingeben"
          />
          <button
            type="submit"
            className="send"
            disabled={composerDisabled || !input.trim() || overLimit}
            aria-label="Senden"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12l15-7-4 7 4 7-15-7z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
        <div className="meta">
          <span>{isStreaming ? "Andreas AI antwortet …" : " "}</span>
          <span className={overLimit ? "over" : undefined}>
            {input.length}/{MAX_INPUT_CHARS}
          </span>
        </div>
      </div>
    </>
  );
}
