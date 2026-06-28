import { useRef, useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import type { Message } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { streamChatMessage, resetChatSession } from "../../api/chat.api";
import type { ChatEvent } from "../../api/chat.api";

function makeId() {
  return Math.random().toString(36).slice(2);
}

const WELCOME: Message = {
  id:          "welcome",
  role:        "assistant",
  text:        "Hi! I'm IRCTC AI. I can help you search trains, book tickets, and manage your bookings. Just tell me where you want to go!",
  toolEvents:  [],
};

export function ChatWindow() {
  const [messages,    setMessages]    = useState<Message[]>([WELCOME]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef  = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const appendUserMessage = (text: string) => {
    const msg: Message = { id: makeId(), role: "user", text, toolEvents: [] };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const appendAssistantPlaceholder = (): string => {
    const id = makeId();
    const msg: Message = { id, role: "assistant", text: "", toolEvents: [], streaming: true };
    setMessages((prev) => [...prev, msg]);
    return id;
  };

  const patchAssistant = useCallback((id: string, patch: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }, []);

  const handleSend = async (userText: string) => {
    appendUserMessage(userText);
    const assistantId = appendAssistantPlaceholder();
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let accText = "";
    const toolEvents: Message["toolEvents"] = [];

    try {
      for await (const event of streamChatMessage(userText, controller.signal)) {
        handleEvent(event, assistantId, toolEvents, (text) => {
          accText += text;
          patchAssistant(assistantId, { text: accText, toolEvents: [...toolEvents] });
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        patchAssistant(assistantId, { text: msg, streaming: false });
      }
    } finally {
      patchAssistant(assistantId, { streaming: false });
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  function handleEvent(
    event: ChatEvent,
    assistantId: string,
    toolEvents: Message["toolEvents"],
    onText: (t: string) => void,
  ) {
    switch (event.type) {
      case "text_delta":
        onText(event.text);
        break;
      case "tool_start":
        toolEvents.push({ name: event.name, status: "running" });
        patchAssistant(assistantId, { toolEvents: [...toolEvents] });
        break;
      case "tool_done": {
        const idx = toolEvents.findLastIndex((e) => e.name === event.name && e.status === "running");
        if (idx >= 0) toolEvents[idx] = { name: event.name, summary: event.summary, status: "done" };
        patchAssistant(assistantId, { toolEvents: [...toolEvents] });
        break;
      }
      case "tool_error": {
        const idx = toolEvents.findLastIndex((e) => e.name === event.name);
        if (idx >= 0) toolEvents[idx] = { name: event.name, error: event.error, status: "error" };
        patchAssistant(assistantId, { toolEvents: [...toolEvents] });
        break;
      }
      case "error":
        onText(event.error);
        break;
    }
  }

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleReset = () => {
    handleStop();
    resetChatSession();
    setMessages([WELCOME]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-brand-primary text-white rounded-t-2xl">
        <span className="text-sm font-semibold">IRCTC AI Assistant</span>
        <button
          onClick={handleReset}
          title="New conversation"
          className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-slate-50">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isStreaming={isStreaming}
        onStop={handleStop}
      />
    </div>
  );
}
