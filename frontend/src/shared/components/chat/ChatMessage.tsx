import { Train, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface Message {
  id:              string;
  role:            "user" | "assistant";
  text:            string;
  toolEvents:      Array<{ name: string; summary?: string; error?: string; status: "running" | "done" | "error" }>;
  navigateActions?: Array<{ label: string; path: string }>;
  streaming?:      boolean;
}

const TOOL_LABELS: Record<string, string> = {
  search_stations:    "Searching stations",
  search_trains:      "Searching trains",
  get_seat_map:       "Loading seat map",
  hold_seats:         "Holding seats",
  confirm_booking:    "Confirming booking",
  get_my_bookings:    "Loading bookings",
  get_booking_detail: "Loading booking detail",
  cancel_booking:     "Cancelling booking",
};

function NavigateButton({ label, path }: { label: string; path: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="flex items-center gap-1.5 text-xs font-medium text-brand-primary border border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10 rounded-lg px-3 py-1.5 transition-colors"
    >
      <ExternalLink className="w-3 h-3" />
      {label}
    </button>
  );
}

function ToolEvent({ event }: { event: Message["toolEvents"][0] }) {
  const label = TOOL_LABELS[event.name] ?? event.name;
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
      {event.status === "running" && (
        <span className="inline-block w-3 h-3 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      )}
      {event.status === "done"    && <span className="text-green-600">✓</span>}
      {event.status === "error"   && <span className="text-red-500">✗</span>}
      <span>{event.status === "error" ? (event.error ?? label) : label}</span>
    </div>
  );
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[75%] bg-brand-primary text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 mb-3">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Train className="w-3.5 h-3.5 text-brand-primary" />
      </div>

      <div className="max-w-[80%] space-y-1">
        {/* Tool status events */}
        {message.toolEvents.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            {message.toolEvents.map((ev, i) => (
              <ToolEvent key={i} event={ev} />
            ))}
          </div>
        )}

        {/* Navigate action buttons */}
        {message.navigateActions && message.navigateActions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {message.navigateActions.map((action, i) => (
              <NavigateButton key={i} label={action.label} path={action.path} />
            ))}
          </div>
        )}

        {/* Text response */}
        {(message.text || message.streaming) && (
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-800 leading-relaxed shadow-sm">
            {message.text || <span className="inline-block w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />}
            {message.streaming && message.text && (
              <span className="inline-block w-1 h-3.5 bg-brand-primary ml-0.5 animate-pulse rounded-sm" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
