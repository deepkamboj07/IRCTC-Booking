import { useRef, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { Button } from "../ui/button";

interface ChatInputProps {
  onSend:     (message: string) => void;
  isStreaming: boolean;
  onStop:     () => void;
  disabled?:  boolean;
}

export function ChatInput({ onSend, isStreaming, onStop, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    const text = textareaRef.current?.value.trim();
    if (!text || isStreaming) return;
    onSend(text);
    if (textareaRef.current) textareaRef.current.value = "";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-slate-200 p-3 bg-white flex gap-2 items-end">
      <textarea
        ref={textareaRef}
        onKeyDown={handleKeyDown}
        disabled={disabled || isStreaming}
        placeholder="Ask me to book a train…"
        rows={1}
        className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary disabled:opacity-50 placeholder:text-slate-400 max-h-24 overflow-y-auto"
        style={{ lineHeight: "1.5" }}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 96) + "px";
        }}
      />
      {isStreaming ? (
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          className="h-9 w-9 p-0 flex-shrink-0 border-red-200 text-red-500 hover:bg-red-50"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={handleSend}
          disabled={disabled}
          className="h-9 w-9 p-0 flex-shrink-0 bg-brand-primary hover:bg-brand-hover text-white"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
