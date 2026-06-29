const API_BASE = import.meta.env.VITE_API_URL as string;

// ─── Types ───────────────────────────────────────────────────────────────────

export type ChatEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_done"; name: string; summary: string }
  | { type: "tool_error"; name: string; error: string }
  | { type: "navigate"; label: string; path: string }
  | { type: "error"; error: string }
  | { type: "done"; sessionId: string };

// ─── Session ID (persisted per browser tab) ──────────────────────────────────

export function getChatSessionId(): string {
  let id = sessionStorage.getItem("irtc_chat_session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("irtc_chat_session", id);
  }
  return id;
}

export function resetChatSession() {
  sessionStorage.removeItem("irtc_chat_session");
}

// ─── SSE streaming generator ─────────────────────────────────────────────────

async function* readLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader  = body.getReader();
  const decoder = new TextDecoder();
  let buffer    = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) yield line;
  }
  if (buffer) yield buffer;
}

export async function* streamChatMessage(
  message: string,
  signal: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const token     = localStorage.getItem("irtc_token");
  const sessionId = getChatSessionId();

  const res = await fetch(`${API_BASE}/chat/message`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      Authorization:   token ? `Bearer ${token}` : "",
    },
    body:   JSON.stringify({ sessionId, message }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(res.status === 401 ? "Please log in to use the chat" : text || "Chat request failed");
  }

  if (!res.body) throw new Error("No response body");

  for await (const line of readLines(res.body)) {
    if (line.startsWith("data: ")) {
      try {
        yield JSON.parse(line.slice(6)) as ChatEvent;
      } catch {
        // skip malformed line
      }
    }
  }
}
