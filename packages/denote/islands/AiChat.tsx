/**
 * AI Chat Island
 * Floating "Ask AI" widget for documentation pages
 */
import { signal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Source {
  title: string;
  slug: string;
}

const isOpen = signal(false);
const messages = signal<ChatMessage[]>([]);
const input = signal("");
const loading = signal(false);
const sources = signal<Source[]>([]);
const mode = signal<"ai" | "search" | null>(null);

async function sendMessage() {
  const text = input.value.trim();
  if (!text || loading.value) return;

  const userMsg: ChatMessage = { role: "user", content: text };
  messages.value = [...messages.value, userMsg];
  input.value = "";
  loading.value = true;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages.value }),
    });

    if (!response.ok) throw new Error("Chat request failed");

    const data = await response.json();
    messages.value = [...messages.value, data.message];
    sources.value = data.sources || [];
    mode.value = data.mode;
  } catch {
    messages.value = [
      ...messages.value,
      {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      },
    ];
  } finally {
    loading.value = false;
  }
}

/**
 * Render markdown-lite content (bold, links, bullet lists)
 */
function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: preact.JSX.Element[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul class="list-disc list-inside space-y-1 my-2">
          {listItems.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
        </ul>,
      );
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("• ") || line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else {
      flushList();
      if (line.trim()) {
        elements.push(<p class="my-1">{renderInline(line)}</p>);
      }
    }
  }
  flushList();

  return <>{elements}</>;
}

/**
 * Render inline markdown (bold, links, inline code)
 */
function renderInline(text: string) {
  const parts: (string | preact.JSX.Element)[] = [];
  // Match **bold**, [text](url), and `code`
  const regex = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<strong>{match[1]}</strong>);
    } else if (match[2] && match[3]) {
      if (/^https?:\/\//.test(match[3])) {
        parts.push(
          <a
            href={match[3]}
            class="text-[var(--denote-primary-text)] hover:underline"
          >
            {match[2]}
          </a>,
        );
      } else if (match[3].startsWith("/")) {
        parts.push(
          <a
            href={match[3]}
            class="text-[var(--denote-primary-text)] hover:underline"
          >
            {match[2]}
          </a>,
        );
      } else {
        parts.push(<>{match[2]}</>);
      }
    } else if (match[4]) {
      parts.push(
        <code class="px-1 py-0.5 bg-[var(--denote-bg-tertiary)] rounded text-sm">
          {match[4]}
        </code>,
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

export function AiChat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.value.length, loading.value]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen.value) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen.value]);

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen.value && (
        <button
          type="button"
          onClick={() => (isOpen.value = true)}
          class="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-[var(--denote-primary)] hover:bg-[var(--denote-primary-hover)] text-[var(--denote-text-inverse)] rounded-full shadow-lg transition-all duration-200 group"
          aria-label="Ask AI"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span class="text-sm font-medium">Ask AI</span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen.value && (
        <div
          class="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-[var(--denote-bg)] rounded-2xl shadow-2xl border border-[var(--denote-border)] flex flex-col overflow-hidden"
          style={{ maxHeight: "min(600px, calc(100vh - 6rem))" }}
        >
          {/* Header */}
          <div class="flex items-center justify-between px-4 py-3 border-b border-[var(--denote-border)] bg-[var(--denote-bg-secondary)]">
            <div class="flex items-center gap-2">
              <svg
                class="w-5 h-5 text-[var(--denote-primary-text)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span class="font-semibold text-[var(--denote-text)] text-sm">
                Ask AI
              </span>
              {mode.value && (
                <span
                  class={`text-xs px-1.5 py-0.5 rounded-full ${
                    mode.value === "ai"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                  }`}
                >
                  {mode.value === "ai" ? "AI" : "Search"}
                </span>
              )}
            </div>
            <div class="flex items-center gap-1">
              {messages.value.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    messages.value = [];
                    sources.value = [];
                    mode.value = null;
                  }}
                  class="p-1.5 text-[var(--denote-text-muted)] hover:text-[var(--denote-text-secondary)] rounded-lg hover:bg-[var(--denote-bg-tertiary)] transition-colors"
                  title="Clear chat"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => (isOpen.value = false)}
                class="p-1.5 text-[var(--denote-text-muted)] hover:text-[var(--denote-text-secondary)] rounded-lg hover:bg-[var(--denote-bg-tertiary)] transition-colors"
                title="Close"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.value.length === 0 && (
              <div class="text-center py-8">
                <svg
                  class="w-12 h-12 mx-auto text-[var(--denote-border)] mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <p class="text-sm text-[var(--denote-text-muted)]">
                  Ask a question about the docs
                </p>
                <div class="mt-3 flex flex-wrap gap-2 justify-center">
                  {[
                    "How do I get started?",
                    "What AI features are available?",
                    "How do I deploy?",
                  ]
                    .map((q) => (
                      <button
                        type="button"
                        key={q}
                        onClick={() => {
                          input.value = q;
                          sendMessage();
                        }}
                        class="text-xs px-3 py-1.5 bg-[var(--denote-bg-tertiary)] text-[var(--denote-text-secondary)] rounded-full hover:bg-[var(--denote-border)] transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {messages.value.map((msg, i) => (
              <div
                key={i}
                class={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  class={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-[var(--denote-primary)] text-[var(--denote-text-inverse)] rounded-br-md"
                      : "bg-[var(--denote-bg-tertiary)] text-[var(--denote-text)] rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant"
                    ? renderContent(msg.content)
                    : msg.content}
                </div>
              </div>
            ))}

            {loading.value && (
              <div class="flex justify-start">
                <div class="bg-[var(--denote-bg-tertiary)] rounded-2xl rounded-bl-md px-4 py-3">
                  <div class="flex gap-1.5">
                    <div class="w-2 h-2 bg-[var(--denote-text-muted)] rounded-full animate-bounce" />
                    <div
                      class="w-2 h-2 bg-[var(--denote-text-muted)] rounded-full animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <div
                      class="w-2 h-2 bg-[var(--denote-text-muted)] rounded-full animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div class="border-t border-[var(--denote-border)] p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              class="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about the docs..."
                value={input.value}
                onInput={(e) => (input.value = e.currentTarget.value)}
                class="flex-1 px-3 py-2 bg-[var(--denote-bg-tertiary)] text-[var(--denote-text)] placeholder-[var(--denote-text-muted)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--denote-primary)]"
                disabled={loading.value}
              />
              <button
                type="submit"
                disabled={loading.value || !input.value.trim()}
                class="p-2 bg-[var(--denote-primary)] hover:bg-[var(--denote-primary-hover)] disabled:opacity-40 text-[var(--denote-text-inverse)] rounded-xl transition-colors"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
